import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'
import { sendLowStockAlert } from '../services/telegram.service.js'

export const inventoryRouter = Router()

// GET /api/inventory/items
inventoryRouter.get(
  '/items',
  requireAuth,
  requireScope('inventory', 'read'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const items = await prisma.inventoryItem.findMany({
        include: {
          supplier: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      const itemsWithStatus = items.map((item) => ({
        ...item,
        status:
          item.qty <= 0
            ? 'Out of Stock'
            : item.qty <= item.minQty
            ? 'Low Stock'
            : 'In Stock',
      }))

      res.json({ items: itemsWithStatus })
    } catch (err) {
      console.error('Error fetching inventory items:', err)
      res.status(500).json({ error: 'Failed to retrieve inventory items.' })
    }
  }
)

const adjustStockSchema = z.object({
  type: z.enum(['Restock', 'Dispensed', 'Adjustment', 'Disposed']),
  qty: z.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().optional().nullable(),
})

// POST /api/inventory/items/:id/adjust (Restock or Dispense)
inventoryRouter.post(
  '/items/:id/adjust',
  requireAuth,
  requireScope('inventory', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const parsed = adjustStockSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message })
        return
      }

      const { type, qty, reason } = parsed.data
      const staffId = req.user?.id || null

      const item = await prisma.inventoryItem.findUnique({ where: { id } })
      if (!item) {
        res.status(404).json({ error: 'Inventory item not found.' })
        return
      }

      let newQty = item.qty
      let formattedQtyStr = ''

      if (type === 'Restock') {
        newQty = item.qty + qty
        formattedQtyStr = `+${qty} ${item.unit}`
      } else if (type === 'Dispensed' || type === 'Disposed') {
        if (item.qty < qty) {
          res.status(400).json({
            error: `Insufficient stock. Current balance is ${item.qty} ${item.unit}.`,
          })
          return
        }
        newQty = item.qty - qty
        formattedQtyStr = `-${qty} ${item.unit}`
      } else {
        // Adjustment
        newQty = qty
        formattedQtyStr = `Reset to ${qty} ${item.unit}`
      }

      // Execute transaction: update quantity and record stock movement
      const [updatedItem, movement] = await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id },
          data: { qty: newQty },
        }),
        prisma.stockMovement.create({
          data: {
            itemId: id,
            staffId,
            type,
            qty: formattedQtyStr,
            reason: reason || null,
          },
          include: {
            staff: { select: { id: true, name: true } },
          },
        }),
      ])

      // If stock drops below threshold, trigger automated Telegram alert
      if (newQty <= updatedItem.minQty) {
        await sendLowStockAlert({
          itemName: updatedItem.name,
          sku: updatedItem.sku,
          currentQty: updatedItem.qty,
          minQty: updatedItem.minQty,
          unit: updatedItem.unit,
        })
      }

      res.json({
        item: {
          ...updatedItem,
          status:
            updatedItem.qty <= 0
              ? 'Out of Stock'
              : updatedItem.qty <= updatedItem.minQty
              ? 'Low Stock'
              : 'In Stock',
        },
        movement,
      })
    } catch (err) {
      console.error('Error adjusting inventory stock:', err)
      res.status(500).json({ error: 'Failed to adjust stock level.' })
    }
  }
)

// GET /api/inventory/movements
inventoryRouter.get(
  '/movements',
  requireAuth,
  requireScope('inventory', 'read'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const movements = await prisma.stockMovement.findMany({
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
          staff: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      res.json({ movements })
    } catch (err) {
      console.error('Error fetching stock movements:', err)
      res.status(500).json({ error: 'Failed to retrieve stock movements.' })
    }
  }
)

// GET /api/inventory/suppliers
inventoryRouter.get(
  '/suppliers',
  requireAuth,
  requireScope('inventory', 'read'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const suppliers = await prisma.supplier.findMany({
        include: {
          items: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { name: 'asc' },
      })

      res.json({ suppliers })
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      res.status(500).json({ error: 'Failed to retrieve suppliers.' })
    }
  }
)
