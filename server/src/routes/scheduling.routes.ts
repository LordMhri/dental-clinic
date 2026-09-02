import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'

export const schedulingRouter = Router()

// Helper to convert "HH:MM AM/PM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

// Helper to add duration to time string
function addMinutesToTime(timeStr: string, mins: number): string {
  const startMins = timeToMinutes(timeStr)
  const endMins = startMins + mins
  let hours = Math.floor(endMins / 60) % 24
  const minutes = endMins % 60
  const period = hours >= 12 ? 'PM' : 'AM'

  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12

  const padMin = minutes.toString().padStart(2, '0')
  const padHour = hours.toString().padStart(2, '0')
  return `${padHour}:${padMin} ${period}`
}

// GET /api/scheduling/operatories
schedulingRouter.get(
  '/operatories',
  requireAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const operatories = await prisma.operatory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
      res.json({ operatories })
    } catch (err) {
      console.error('Error fetching operatories:', err)
      res.status(500).json({ error: 'Failed to retrieve operatories.' })
    }
  }
)

// GET /api/scheduling/appointments
schedulingRouter.get(
  '/appointments',
  requireAuth,
  requireScope('scheduling', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, operatoryId, dentistId, status } = req.query

      const where: Record<string, unknown> = {}
      if (date && typeof date === 'string') where.date = date
      if (operatoryId && typeof operatoryId === 'string') where.operatoryId = operatoryId
      if (dentistId && typeof dentistId === 'string') where.dentistId = dentistId
      if (status && typeof status === 'string') where.status = status

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              gender: true,
              age: true,
              initials: true,
              allergy: true,
            },
          },
          dentist: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          operatory: true,
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      })

      res.json({ appointments })
    } catch (err) {
      console.error('Error fetching appointments:', err)
      res.status(500).json({ error: 'Failed to retrieve appointments.' })
    }
  }
)

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  dentistId: z.string().min(1, 'Dentist ID is required'),
  operatoryId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s*(AM|PM)$/i, 'Time must be HH:MM AM/PM'),
  durationMins: z.number().int().min(15).max(240).default(45),
  treatment: z.string().min(1, 'Treatment procedure is required'),
  notes: z.string().optional().nullable(),
  emergency: z.boolean().optional().default(false),
})

// POST /api/scheduling/appointments
schedulingRouter.post(
  '/appointments',
  requireAuth,
  requireScope('scheduling', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createAppointmentSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message })
        return
      }

      const {
        patientId,
        dentistId,
        operatoryId,
        date,
        time,
        durationMins,
        treatment,
        notes,
        emergency,
      } = parsed.data

      const newStartMins = timeToMinutes(time)
      const newEndMins = newStartMins + durationMins
      const endTime = addMinutesToTime(time, durationMins)

      // Fallback default operatory if none provided
      let finalOperatoryId = operatoryId
      if (!finalOperatoryId) {
        const firstOp = await prisma.operatory.findFirst({ where: { isActive: true } })
        finalOperatoryId = firstOp?.id
      }

      // Conflict Check: Check existing appointments for same date and chair
      const existingAppts = await prisma.appointment.findMany({
        where: {
          date,
          status: { notIn: ['Cancelled', 'No-Show'] },
          OR: [
            { operatoryId: finalOperatoryId },
            { dentistId },
          ],
        },
        include: {
          patient: { select: { name: true } },
          dentist: { select: { name: true } },
          operatory: { select: { name: true } },
        },
      })

      // Check time overlap
      for (const ex of existingAppts) {
        const exStartMins = timeToMinutes(ex.time)
        const exEndMins = exStartMins + ex.durationMins

        const overlaps = newStartMins < exEndMins && newEndMins > exStartMins
        if (overlaps) {
          if (ex.operatoryId === finalOperatoryId) {
            res.status(409).json({
              error: `Chair conflict: ${ex.operatory?.name || 'Chair'} is already reserved by ${ex.patient.name} from ${ex.time} to ${ex.endTime}.`,
            })
            return
          }
          if (ex.dentistId === dentistId) {
            res.status(409).json({
              error: `Dentist conflict: ${ex.dentist.name} is already booked with ${ex.patient.name} from ${ex.time} to ${ex.endTime}.`,
            })
            return
          }
        }
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          dentistId,
          operatoryId: finalOperatoryId,
          date,
          time,
          endTime,
          durationMins,
          treatment,
          notes: notes || null,
          emergency: emergency || false,
          status: 'Scheduled',
        },
        include: {
          patient: true,
          dentist: true,
          operatory: true,
        },
      })

      res.status(201).json({ appointment })
    } catch (err) {
      console.error('Error creating appointment:', err)
      res.status(500).json({ error: 'Failed to schedule appointment.' })
    }
  }
)

// PATCH /api/scheduling/appointments/:id
schedulingRouter.patch(
  '/appointments/:id',
  requireAuth,
  requireScope('scheduling', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { status, notes, operatoryId, time, durationMins } = req.body

      const existing = await prisma.appointment.findUnique({ where: { id } })
      if (!existing) {
        res.status(404).json({ error: 'Appointment not found.' })
        return
      }

      const dataToUpdate: Record<string, unknown> = {}
      if (status) dataToUpdate.status = status
      if (notes !== undefined) dataToUpdate.notes = notes
      if (operatoryId) dataToUpdate.operatoryId = operatoryId

      if (time) {
        dataToUpdate.time = time
        const dur = durationMins || existing.durationMins
        dataToUpdate.durationMins = dur
        dataToUpdate.endTime = addMinutesToTime(time, dur)
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: dataToUpdate,
        include: {
          patient: true,
          dentist: true,
          operatory: true,
        },
      })

      res.json({ appointment: updated })
    } catch (err) {
      console.error('Error updating appointment:', err)
      res.status(500).json({ error: 'Failed to update appointment.' })
    }
  }
)

// DELETE /api/scheduling/appointments/:id (Soft cancel)
schedulingRouter.delete(
  '/appointments/:id',
  requireAuth,
  requireScope('scheduling', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      await prisma.appointment.update({
        where: { id },
        data: { status: 'Cancelled' },
      })
      res.json({ success: true, message: 'Appointment cancelled.' })
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      res.status(500).json({ error: 'Failed to cancel appointment.' })
    }
  }
)
