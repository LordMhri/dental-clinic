import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'
import { uploadToStorage, getFileStream, deleteFromStorage } from '../lib/storage.js'

export const patientRouter = Router()

// Configure Multer for memory buffer storage (streamed directly to MinIO)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max for dental X-rays & scans
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'application/pdf',
      'application/dicom',
    ]
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.dcm')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file format. Allowed: JPEG, PNG, WEBP, TIFF, PDF, DICOM.'))
    }
  },
})

const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['M', 'F']),
  age: z.coerce.number().int().min(0).max(125),
  phone: z.string().min(9, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  allergy: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/patients
patientRouter.get(
  '/',
  requireAuth,
  requireScope('patients', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string)?.trim()
      const status = (req.query.status as string)?.trim()

      const where: Record<string, unknown> = {}
      if (status) {
        where.status = status
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { id: { contains: search, mode: 'insensitive' } },
        ]
      }

      const patients = await prisma.patient.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          appointments: {
            take: 1,
            orderBy: { date: 'desc' },
            select: { id: true, date: true, time: true, treatment: true, status: true },
          },
        },
      })

      res.json({ patients })
    } catch (err) {
      console.error('Error fetching patients:', err)
      res.status(500).json({ error: 'Failed to retrieve patients.' })
    }
  }
)

// GET /api/patients/:id
patientRouter.get(
  '/:id',
  requireAuth,
  requireScope('patients', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          appointments: {
            orderBy: { date: 'desc' },
            include: { dentist: { select: { id: true, name: true, role: true } } },
          },
          treatments: {
            orderBy: { createdAt: 'desc' },
            include: { dentist: { select: { id: true, name: true } } },
          },
          dentalCharts: {
            orderBy: { toothNumber: 'asc' },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            include: { payments: true },
          },
          attachments: {
            orderBy: { uploadedAt: 'desc' },
          },
        },
      })

      if (!patient) {
        res.status(404).json({ error: `Patient ${id} not found.` })
        return
      }

      // Generate secure streaming file URLs for attachments
      const attachmentsWithUrls = patient.attachments.map((att) => ({
        ...att,
        url: `/api/patients/${id}/attachments/${att.id}/file`,
      }))

      res.json({
        patient: {
          ...patient,
          attachments: attachmentsWithUrls,
        },
      })
    } catch (err) {
      console.error(`Error fetching patient ${req.params.id}:`, err)
      res.status(500).json({ error: 'Failed to retrieve patient profile.' })
    }
  }
)

// POST /api/patients
patientRouter.post(
  '/',
  requireAuth,
  requireScope('patients', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = createPatientSchema.safeParse(req.body)
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message })
        return
      }

      const data = parseResult.data

      // Generate unique clinic patient ID: PT-XXXX
      const count = await prisma.patient.count()
      const generatedId = `PT-${(count + 8422).toString()}`

      // Extract initials
      const nameParts = data.name.trim().split(/\s+/)
      const initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : nameParts[0].slice(0, 2).toUpperCase()

      const patient = await prisma.patient.create({
        data: {
          id: generatedId,
          name: data.name.trim(),
          initials,
          gender: data.gender,
          age: data.age,
          phone: data.phone.trim(),
          email: data.email || null,
          address: data.address?.trim() || null,
          allergy: data.allergy?.trim() || null,
          notes: data.notes?.trim() || null,
          status: 'Active',
        },
      })

      // Initialize default sound dental chart (Teeth 1-32)
      const chartEntries = Array.from({ length: 32 }, (_, i) => ({
        patientId: patient.id,
        toothNumber: i + 1,
        condition: 'Sound',
      }))
      await prisma.dentalChart.createMany({
        data: chartEntries,
        skipDuplicates: true,
      })

      // Audit Log
      await prisma.auditLog.create({
        data: {
          staffId: req.user?.id,
          action: 'CREATE_PATIENT',
          entity: 'Patient',
          entityId: patient.id,
          details: JSON.stringify({ name: patient.name, phone: patient.phone }),
        },
      })

      res.status(201).json({ patient })
    } catch (err) {
      console.error('Error creating patient:', err)
      res.status(500).json({ error: 'Failed to create patient record.' })
    }
  }
)

// PATCH /api/patients/:id
patientRouter.patch(
  '/:id',
  requireAuth,
  requireScope('patients', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateSchema = createPatientSchema.partial()
      const parseResult = updateSchema.safeParse(req.body)

      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message })
        return
      }

      const updated = await prisma.patient.update({
        where: { id },
        data: parseResult.data,
      })

      res.json({ patient: updated })
    } catch (err) {
      console.error(`Error updating patient ${req.params.id}:`, err)
      res.status(500).json({ error: 'Failed to update patient details.' })
    }
  }
)

// POST /api/patients/:id/attachments (Upload X-Ray / Document to MinIO)
patientRouter.post(
  '/:id/attachments',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const file = req.file

      if (!file) {
        res.status(400).json({ error: 'No file uploaded.' })
        return
      }

      const patient = await prisma.patient.findUnique({ where: { id } })
      if (!patient) {
        res.status(404).json({ error: `Patient ${id} not found.` })
        return
      }

      const fileType = (req.body.fileType as string) || 'xray'
      const notes = (req.body.notes as string) || null

      // Clean filename and create unique S3 key
      const timestamp = Date.now()
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      const s3Key = `patients/${id}/${timestamp}-${safeName}`

      // Stream to MinIO
      await uploadToStorage(s3Key, file.buffer, file.mimetype)

      // Save metadata to database
      const attachment = await prisma.patientAttachment.create({
        data: {
          patientId: id,
          fileName: file.originalname,
          fileType,
          s3Key,
          contentType: file.mimetype,
          sizeBytes: file.size,
          notes,
        },
      })

      res.status(201).json({
        attachment: {
          ...attachment,
          url: `/api/patients/${id}/attachments/${attachment.id}/file`,
        },
      })
    } catch (err) {
      console.error('Error uploading dental attachment:', err)
      res.status(500).json({ error: 'Failed to upload attachment to MinIO.' })
    }
  }
)

// DELETE /api/patients/:id/attachments/:attachmentId
patientRouter.delete(
  '/:id/attachments/:attachmentId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, attachmentId } = req.params

      const attachment = await prisma.patientAttachment.findFirst({
        where: { id: attachmentId, patientId: id },
      })

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found.' })
        return
      }

      // Delete from MinIO
      await deleteFromStorage(attachment.s3Key)

      // Delete from database
      await prisma.patientAttachment.delete({ where: { id: attachmentId } })

      res.json({ success: true, message: 'Attachment deleted.' })
    } catch (err) {
      console.error('Error deleting attachment:', err)
      res.status(500).json({ error: 'Failed to delete attachment.' })
    }
  }
)

// GET /api/patients/:id/attachments/:attachmentId/file (Stream file directly from MinIO)
patientRouter.get(
  '/:id/attachments/:attachmentId/file',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, attachmentId } = req.params

      const attachment = await prisma.patientAttachment.findFirst({
        where: { id: attachmentId, patientId: id },
      })

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found.' })
        return
      }

      const s3Response = await getFileStream(attachment.s3Key)
      res.setHeader('Content-Type', attachment.contentType)
      res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`)
      if (attachment.sizeBytes) {
        res.setHeader('Content-Length', attachment.sizeBytes.toString())
      }

      if (s3Response.Body) {
        // Stream body to client
        const readable = s3Response.Body as NodeJS.ReadableStream
        readable.pipe(res)
      } else {
        res.status(404).json({ error: 'File stream unavailable.' })
      }
    } catch (err) {
      console.error('Error streaming attachment:', err)
      res.status(500).json({ error: 'Failed to stream attachment file.' })
    }
  }
)
