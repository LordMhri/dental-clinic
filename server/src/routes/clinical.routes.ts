import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'

export const clinicalRouter = Router()

const updateToothSchema = z.object({
  toothNumber: z.number().int().min(1).max(32).optional(),
  toothNumbers: z.array(z.number().int().min(1).max(32)).optional(),
  condition: z.enum([
    'Sound',
    'Decayed',
    'Restored',
    'Crown',
    'RootCanal',
    'Missing',
    'Implant',
  ]),
  surfaces: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => data.toothNumber !== undefined || (data.toothNumbers && data.toothNumbers.length > 0), {
  message: 'Either toothNumber or toothNumbers must be provided',
})

const createTreatmentSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional().nullable(),
  procedure: z.string().min(2, 'Procedure name required'),
  toothNumber: z.number().int().min(1).max(32).optional().nullable(),
  toothNumbers: z.array(z.number().int().min(1).max(32)).optional(),
  surfaces: z.string().optional().nullable(),
  notes: z.string().min(1, 'Clinical notes are required for procedures'),
  fee: z.coerce.number().min(0),
  status: z.enum(['Planned', 'In Progress', 'Completed']).default('Completed'),
})

// GET /api/clinical/odontogram/:patientId
clinicalRouter.get(
  '/odontogram/:patientId',
  requireAuth,
  requireScope('clinical', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params

      let chart = await prisma.dentalChart.findMany({
        where: { patientId },
        orderBy: { toothNumber: 'asc' },
      })

      // If patient has no chart records yet, initialize 32 teeth
      if (chart.length === 0) {
        const defaultChart = Array.from({ length: 32 }, (_, i) => ({
          patientId,
          toothNumber: i + 1,
          condition: 'Sound',
        }))
        await prisma.dentalChart.createMany({
          data: defaultChart,
          skipDuplicates: true,
        })
        chart = await prisma.dentalChart.findMany({
          where: { patientId },
          orderBy: { toothNumber: 'asc' },
        })
      }

      res.json({ chart })
    } catch (err) {
      console.error('Error fetching odontogram:', err)
      res.status(500).json({ error: 'Failed to retrieve dental chart.' })
    }
  }
)

// PUT /api/clinical/odontogram/:patientId (Update single tooth state)
clinicalRouter.put(
  '/odontogram/:patientId',
  requireAuth,
  requireScope('clinical', 'own'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params
      const parseResult = updateToothSchema.safeParse(req.body)

      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message })
        return
      }

      const { toothNumber, toothNumbers, condition, surfaces, notes } = parseResult.data
      const targetNumbers: number[] = toothNumbers && toothNumbers.length > 0
        ? toothNumbers
        : toothNumber !== undefined ? [toothNumber] : []

      const updatedTeeth = await Promise.all(
        targetNumbers.map((num) =>
          prisma.dentalChart.upsert({
            where: {
              patientId_toothNumber: {
                patientId,
                toothNumber: num,
              },
            },
            create: {
              patientId,
              toothNumber: num,
              condition,
              surfaces: surfaces || null,
              notes: notes || null,
            },
            update: {
              condition,
              surfaces: surfaces || null,
              notes: notes || null,
            },
          })
        )
      )

      res.json({
        tooth: updatedTeeth[0],
        teeth: updatedTeeth,
      })
    } catch (err) {
      console.error('Error updating tooth condition:', err)
      res.status(500).json({ error: 'Failed to update tooth.' })
    }
  }
)

// POST /api/clinical/treatments (Record completed or planned procedure)
clinicalRouter.post(
  '/treatments',
  requireAuth,
  requireScope('clinical', 'own'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = createTreatmentSchema.safeParse(req.body)
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message })
        return
      }

      const data = parseResult.data
      const dentistId = req.user?.id || 'st-1'

      const targetTeeth: number[] =
        data.toothNumbers && data.toothNumbers.length > 0
          ? data.toothNumbers
          : data.toothNumber
          ? [data.toothNumber]
          : []

      // 1. Create Treatment Record
      const treatment = await prisma.treatmentRecord.create({
        data: {
          patientId: data.patientId,
          dentistId,
          appointmentId: data.appointmentId || null,
          procedure: data.procedure,
          toothNumber: data.toothNumber || (targetTeeth.length > 0 ? targetTeeth[0] : null),
          surfaces: data.surfaces || null,
          notes: data.notes,
          fee: data.fee,
          status: data.status,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        },
      })

      // 2. Automatically update tooth condition in odontogram if applicable
      if (targetTeeth.length > 0 && data.status === 'Completed') {
        let conditionUpdate: string | null = null
        const procLower = data.procedure.toLowerCase()

        if (procLower.includes('extract')) conditionUpdate = 'Missing'
        else if (procLower.includes('implant')) conditionUpdate = 'Implant'
        else if (procLower.includes('crown')) conditionUpdate = 'Crown'
        else if (procLower.includes('root canal') || procLower.includes('rct'))
          conditionUpdate = 'RootCanal'
        else if (procLower.includes('fill') || procLower.includes('restor') || procLower.includes('composite'))
          conditionUpdate = 'Restored'

        if (conditionUpdate) {
          await Promise.all(
            targetTeeth.map((tNum) =>
              prisma.dentalChart.upsert({
                where: {
                  patientId_toothNumber: {
                    patientId: data.patientId,
                    toothNumber: tNum,
                  },
                },
                create: {
                  patientId: data.patientId,
                  toothNumber: tNum,
                  condition: conditionUpdate,
                  surfaces: data.surfaces || null,
                },
                update: {
                  condition: conditionUpdate,
                  surfaces: data.surfaces || null,
                },
              }),
            ),
          )
        }
      }

      // 3. CLINICAL-TO-CASHIER BRIDGE (Prevent Revenue Leakage)
      // If procedure is completed and has a fee > 0, generate draft invoice for cashier desk
      if (data.status === 'Completed' && data.fee > 0) {
        const invId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
        const toothDesc =
          targetTeeth.length === 1
            ? ` (Tooth #${targetTeeth[0]})`
            : targetTeeth.length > 1
            ? ` (Teeth #${targetTeeth.join(', #')})`
            : ''
        await prisma.invoice.create({
          data: {
            id: invId,
            patientId: data.patientId,
            treatmentRecordId: treatment.id,
            treatment: `${data.procedure}${toothDesc}`,
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            total: data.fee,
            paid: 0,
            status: 'Unpaid',
            notes: `Auto-generated from clinical treatment by ${req.user?.name}`,
          },
        })
      }

      // 4. If linked to an appointment, mark appointment as Completed
      if (data.appointmentId && data.status === 'Completed') {
        await prisma.appointment.update({
          where: { id: data.appointmentId },
          data: { status: 'Completed' },
        })
      }

      res.status(201).json({ treatment })
    } catch (err) {
      console.error('Error logging treatment record:', err)
      res.status(500).json({ error: 'Failed to record clinical treatment.' })
    }
  }
)

// GET /api/clinical/treatments
clinicalRouter.get(
  '/treatments',
  requireAuth,
  requireScope('clinical', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.query.patientId as string | undefined
      const dentistId = req.query.dentistId as string | undefined

      const where: Record<string, unknown> = {}
      if (patientId) where.patientId = patientId
      if (dentistId) where.dentistId = dentistId

      // If user only has 'own' scope on clinical domain, restrict to their own records
      if (req.user?.role !== 'admin' && req.user?.scopes.clinical === 'own') {
        where.dentistId = req.user.id
      }

      const treatments = await prisma.treatmentRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          dentist: { select: { id: true, name: true, role: true } },
          invoice: { select: { id: true, status: true, total: true, paid: true } },
        },
      })

      res.json({ treatments })
    } catch (err) {
      console.error('Error listing treatments:', err)
      res.status(500).json({ error: 'Failed to retrieve treatments.' })
    }
  }
)
