import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'

export const billingRouter = Router()

// GET /api/billing/invoices
billingRouter.get(
  '/invoices',
  requireAuth,
  requireScope('billing', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, patientId } = req.query

      const where: Record<string, unknown> = {}
      if (status && typeof status === 'string' && status !== 'All') {
        where.status = status
      }
      if (patientId && typeof patientId === 'string') {
        where.patientId = patientId
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              initials: true,
            },
          },
          treatmentRecord: {
            select: {
              id: true,
              procedure: true,
              toothNumber: true,
              surfaces: true,
            },
          },
          payments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      res.json({ invoices })
    } catch (err) {
      console.error('Error fetching invoices:', err)
      res.status(500).json({ error: 'Failed to retrieve invoices.' })
    }
  }
)

// GET /api/billing/invoices/:id
billingRouter.get(
  '/invoices/:id',
  requireAuth,
  requireScope('billing', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: true,
          treatmentRecord: {
            include: { dentist: { select: { id: true, name: true } } },
          },
          payments: {
            include: { cashier: { select: { id: true, name: true } } },
            orderBy: { paidAt: 'desc' },
          },
        },
      })

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found.' })
        return
      }

      res.json({ invoice })
    } catch (err) {
      console.error('Error fetching invoice details:', err)
      res.status(500).json({ error: 'Failed to retrieve invoice.' })
    }
  }
)

const processPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  method: z.enum(['Cash', 'Transfer']),
  transferChannel: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// POST /api/billing/invoices/:id/payments (Process Payment & Reconcile)
billingRouter.post(
  '/invoices/:id/payments',
  requireAuth,
  requireScope('billing', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const parsed = processPaymentSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message })
        return
      }

      const { amount, method, transferChannel, referenceNumber, notes } = parsed.data
      const cashierId = req.user?.id || 'st-4' // Salem cashier default

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { payments: true },
      })

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found.' })
        return
      }

      const currentPaid = invoice.paid || 0
      const newPaid = currentPaid + amount
      const newStatus = newPaid >= invoice.total ? 'Paid' : 'Partial'

      // Transaction: create payment, update invoice, and update active cash drawer if Cash
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            invoiceId: id,
            cashierId,
            amount,
            method,
            transferChannel: method === 'Transfer' ? transferChannel || 'Telebirr' : null,
            referenceNumber: referenceNumber || null,
            notes: notes || null,
          },
        })

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            paid: newPaid,
            status: newStatus,
            method,
            transferChannel: method === 'Transfer' ? transferChannel || 'Telebirr' : null,
          },
          include: {
            payments: {
              include: { cashier: { select: { id: true, name: true } } },
              orderBy: { paidAt: 'desc' },
            },
            patient: true,
          },
        })

        // If Cash payment, update current active cash drawer session expected cash
        if (method === 'Cash') {
          const activeDrawer = await tx.cashDrawerSession.findFirst({
            where: { status: 'Open' },
            orderBy: { openedAt: 'desc' },
          })
          if (activeDrawer) {
            await tx.cashDrawerSession.update({
              where: { id: activeDrawer.id },
              data: {
                expectedCash: activeDrawer.expectedCash + amount,
              },
            })
          }
        }

        return { payment, invoice: updatedInvoice }
      })

      res.status(201).json(result)
    } catch (err) {
      console.error('Error processing payment:', err)
      res.status(500).json({ error: 'Failed to process payment.' })
    }
  }
)

// GET /api/billing/cash-drawer
billingRouter.get(
  '/cash-drawer',
  requireAuth,
  requireScope('billing', 'read'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // Find current open drawer session or latest session
      let session = await prisma.cashDrawerSession.findFirst({
        where: { status: 'Open' },
        include: {
          cashier: { select: { id: true, name: true, role: true } },
        },
        orderBy: { openedAt: 'desc' },
      })

      if (!session) {
        session = await prisma.cashDrawerSession.findFirst({
          include: {
            cashier: { select: { id: true, name: true, role: true } },
          },
          orderBy: { openedAt: 'desc' },
        })
      }

      res.json({ session })
    } catch (err) {
      console.error('Error fetching cash drawer session:', err)
      res.status(500).json({ error: 'Failed to retrieve cash drawer session.' })
    }
  }
)

// POST /api/billing/cash-drawer/open
billingRouter.post(
  '/cash-drawer/open',
  requireAuth,
  requireScope('billing', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { openingCash, notes } = req.body
      const cashierId = req.user?.id || 'st-4'
      const today = new Date().toISOString().split('T')[0]

      // Check if there is already an open session
      const existing = await prisma.cashDrawerSession.findFirst({
        where: { status: 'Open' },
      })
      if (existing) {
        res.status(400).json({ error: 'A cash drawer session is already open.' })
        return
      }

      const startingAmount = Number(openingCash) || 0
      const session = await prisma.cashDrawerSession.create({
        data: {
          cashierId,
          date: today,
          openingCash: startingAmount,
          expectedCash: startingAmount,
          status: 'Open',
          notes: notes || null,
        },
        include: {
          cashier: { select: { id: true, name: true } },
        },
      })

      res.status(201).json({ session })
    } catch (err) {
      console.error('Error opening cash drawer:', err)
      res.status(500).json({ error: 'Failed to open cash drawer.' })
    }
  }
)

// POST /api/billing/cash-drawer/close
billingRouter.post(
  '/cash-drawer/close',
  requireAuth,
  requireScope('billing', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { countedCash, notes } = req.body

      const activeSession = await prisma.cashDrawerSession.findFirst({
        where: { status: 'Open' },
        orderBy: { openedAt: 'desc' },
      })

      if (!activeSession) {
        res.status(404).json({ error: 'No active cash drawer session found to close.' })
        return
      }

      const counted = Number(countedCash) || 0
      const discrepancy = counted - activeSession.expectedCash

      const closedSession = await prisma.cashDrawerSession.update({
        where: { id: activeSession.id },
        data: {
          countedCash: counted,
          discrepancy,
          status: 'Closed',
          closedAt: new Date(),
          notes: notes || activeSession.notes,
        },
        include: {
          cashier: { select: { id: true, name: true } },
        },
      })

      res.json({ session: closedSession, discrepancy })
    } catch (err) {
      console.error('Error closing cash drawer:', err)
      res.status(500).json({ error: 'Failed to close cash drawer.' })
    }
  }
)
