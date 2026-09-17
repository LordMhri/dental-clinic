import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireScope } from '../middleware/auth.js'
import { sendLowStockAlert } from '../services/telegram.service.js'

export const inventoryRouter = Router()

export interface CategoryNode {
  id: string
  name: string
  children?: CategoryNode[]
}

const DEFAULT_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'ortho',
    name: 'Orthodontics (Braces)',
    children: [
      {
        id: 'ortho-wires',
        name: 'Archwires',
        children: [
          { id: 'ortho-wires-niti', name: 'NiTi Round' },
          { id: 'ortho-wires-ss', name: 'Stainless Steel' },
        ],
      },
      { id: 'ortho-brackets', name: 'Brackets' },
      { id: 'ortho-elastics', name: 'Elastics & Power Chains' },
      { id: 'ortho-adhesives', name: 'Adhesives & Primers' },
    ],
  },
  {
    id: 'restorative',
    name: 'Restorative & Fillings',
    children: [
      { id: 'rest-composite', name: 'Composite Resins' },
      { id: 'rest-bonding', name: 'Bonding & Etchants' },
      { id: 'rest-cements', name: 'Glass Ionomer (GIC) & Cements' },
    ],
  },
  {
    id: 'anesthetics',
    name: 'Anesthetics & Pharmaceuticals',
    children: [
      { id: 'anes-local', name: 'Local Anesthetics (Lidocaine/Articaine)' },
      { id: 'anes-needles', name: 'Dental Needles (27G/30G)' },
      { id: 'anes-topical', name: 'Topical Numbing Gels' },
    ],
  },
  {
    id: 'infection-control',
    name: 'Infection Control & Disposables',
    children: [
      { id: 'inf-ppe', name: 'Gloves & PPE' },
      { id: 'inf-barriers', name: 'Patient Bibs & Barriers' },
      { id: 'inf-pouches', name: 'Autoclave Sterilization Pouches' },
    ],
  },
]

// GET /api/inventory/categories (Fetch Centralized Category Tree)
inventoryRouter.get(
  '/categories',
  requireAuth,
  requireScope('inventory', 'read'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      let record = await prisma.inventoryCategoryTree.findUnique({
        where: { id: 'default' },
      })
      if (!record) {
        record = await prisma.inventoryCategoryTree.create({
          data: {
            id: 'default',
            tree: DEFAULT_CATEGORY_TREE as any,
          },
        })
      }
      res.json({ categories: record.tree })
    } catch (err) {
      console.error('Error fetching inventory categories:', err)
      res.status(500).json({ error: 'Failed to retrieve inventory categories.' })
    }
  }
)

// PUT /api/inventory/categories (Update Centralized Category Tree)
inventoryRouter.put(
  '/categories',
  requireAuth,
  requireScope('inventory', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tree } = req.body
      if (!Array.isArray(tree)) {
        res.status(400).json({ error: 'Category tree must be an array of category nodes.' })
        return
      }

      const updated = await prisma.inventoryCategoryTree.upsert({
        where: { id: 'default' },
        create: { id: 'default', tree },
        update: { tree },
      })

      res.json({ categories: updated.tree })
    } catch (err) {
      console.error('Error updating category tree:', err)
      res.status(500).json({ error: 'Failed to update category tree.' })
    }
  }
)

// POST /api/inventory/categories/nodes (Create Subcategory / Category on the Fly)
inventoryRouter.post(
  '/categories/nodes',
  requireAuth,
  requireScope('inventory', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId, name } = req.body
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Category name is required.' })
        return
      }

      let record = await prisma.inventoryCategoryTree.findUnique({
        where: { id: 'default' },
      })
      const tree: CategoryNode[] = (record?.tree || DEFAULT_CATEGORY_TREE) as CategoryNode[]

      const newNode: CategoryNode = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        children: [],
      }

      if (!parentId) {
        tree.push(newNode)
      } else {
        function insertChild(nodes: CategoryNode[]): boolean {
          for (const node of nodes) {
            if (node.id === parentId) {
              if (!node.children) node.children = []
              node.children.push(newNode)
              return true
            }
            if (node.children && insertChild(node.children)) return true
          }
          return false
        }
        const inserted = insertChild(tree)
        if (!inserted) {
          tree.push(newNode)
        }
      }

      const updated = await prisma.inventoryCategoryTree.upsert({
        where: { id: 'default' },
        create: { id: 'default', tree: tree as any },
        update: { tree: tree as any },
      })

      res.status(201).json({ node: newNode, categories: updated.tree })
    } catch (err) {
      console.error('Error adding category node:', err)
      res.status(500).json({ error: 'Failed to add category node.' })
    }
  }
)

// Helper to collect all matching category identifiers (self + children)
function findSubtreeIdentifiers(nodes: CategoryNode[], targetIdOrName: string): string[] {
  let targetNode: CategoryNode | null = null

  function findNode(list: CategoryNode[]) {
    for (const item of list) {
      if (item.id === targetIdOrName || item.name.toLowerCase() === targetIdOrName.toLowerCase()) {
        targetNode = item
        return
      }
      if (item.children) findNode(item.children)
    }
  }
  findNode(nodes)

  if (!targetNode) return [targetIdOrName]

  const matches: string[] = []
  function collect(node: CategoryNode) {
    matches.push(node.id, node.name)
    if (node.children) {
      for (const c of node.children) collect(c)
    }
  }
  collect(targetNode)
  return matches
}

// GET /api/inventory/items (Query items with category filter and search)
inventoryRouter.get(
  '/items',
  requireAuth,
  requireScope('inventory', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const category = (req.query.category as string)?.trim()
      const search = (req.query.search as string)?.trim()

      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (category && category !== 'all') {
        const catRecord = await prisma.inventoryCategoryTree.findUnique({
          where: { id: 'default' },
        })
        const tree = (catRecord?.tree || DEFAULT_CATEGORY_TREE) as CategoryNode[]
        const validMatches = findSubtreeIdentifiers(tree, category)

        where.OR = [
          { categoryId: { in: validMatches } },
          { categoryPath: { hasSome: validMatches } },
        ]
      }

      const items = await prisma.inventoryItem.findMany({
        where,
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

const createItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  qty: z.coerce.number().int().min(0).default(0),
  unit: z.string().min(1, 'Unit is required'),
  minQty: z.coerce.number().int().min(0).default(5),
  location: z.string().default('Central Store'),
  unitCost: z.coerce.number().min(0).default(0),
  expiry: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  categoryPath: z.array(z.string()).optional().default([]),
  attributes: z.record(z.any()).optional().nullable(),
})

// POST /api/inventory/items (Create New Catalog Item with Hierarchy)
inventoryRouter.post(
  '/items',
  requireAuth,
  requireScope('inventory', 'all'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createItemSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message })
        return
      }

      const data = parsed.data

      // Check unique SKU
      const existing = await prisma.inventoryItem.findUnique({
        where: { sku: data.sku },
      })
      if (existing) {
        res.status(409).json({ error: `Item with SKU ${data.sku} already exists.` })
        return
      }

      const item = await prisma.inventoryItem.create({
        data: {
          name: data.name.trim(),
          sku: data.sku.trim(),
          qty: data.qty,
          unit: data.unit.trim(),
          minQty: data.minQty,
          location: data.location,
          unitCost: data.unitCost,
          expiry: data.expiry || null,
          supplierId: data.supplierId || null,
          categoryId: data.categoryId || null,
          categoryPath: data.categoryPath || [],
          attributes: data.attributes ? (data.attributes as any) : undefined,
        },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
        },
      })

      res.status(201).json({
        item: {
          ...item,
          status:
            item.qty <= 0
              ? 'Out of Stock'
              : item.qty <= item.minQty
              ? 'Low Stock'
              : 'In Stock',
        },
      })
    } catch (err) {
      console.error('Error creating inventory item:', err)
      res.status(500).json({ error: 'Failed to create inventory item.' })
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
        newQty = qty
        formattedQtyStr = `Reset to ${qty} ${item.unit}`
      }

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
