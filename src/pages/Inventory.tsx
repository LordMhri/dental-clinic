import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Send,
  ArrowDownRight,
  ArrowUpRight,
  Folder,
  FolderOpen,
  Tag,
  Search,
} from 'lucide-react'
import {
  inventory as seedInventory,
  stockMovements as seedMoves,
  suppliers as seedSuppliers,
} from '../data/mock'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'

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

interface ApiInventoryItem {
  id: string
  name: string
  sku: string
  qty: number
  unit: string
  minQty: number
  expiry: string | null
  location: string
  supplierId?: string | null
  unitCost: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  categoryId?: string | null
  categoryPath?: string[]
  attributes?: Record<string, any> | null
  supplier?: { id: string; name: string; phone?: string } | null
}

interface ApiStockMovement {
  id: string
  itemId: string
  staffId?: string | null
  type: string
  qty: string
  reason?: string | null
  createdAt: string
  item?: { id: string; name: string; sku: string; unit: string }
  staff?: { id: string; name: string } | null
}

export function Inventory() {
  const { notify, token } = useClinic()
  const [items, setItems] = useState<ApiInventoryItem[]>(() =>
    seedInventory.map((i) => ({
      ...i,
      unitCost: 0,
      expiry: i.expiry ?? null,
      status: i.qty <= 0 ? 'Out of Stock' : i.qty <= i.minQty ? 'Low Stock' : 'In Stock',
      categoryId: i.id === 'inv-1' || i.id === 'inv-6' ? 'inf-ppe' : i.id === 'inv-4' ? 'rest-composite' : 'anes-local',
      categoryPath:
        i.id === 'inv-1' || i.id === 'inv-6'
          ? ['Infection Control & Disposables', 'Gloves & PPE']
          : i.id === 'inv-4'
          ? ['Restorative & Fillings', 'Composite Resins']
          : ['Anesthetics & Pharmaceuticals', 'Local Anesthetics'],
      attributes: null,
      supplier: { id: 'sup-1', name: i.supplier },
    }))
  )
  const [moves, setMoves] = useState<ApiStockMovement[]>(() =>
    seedMoves.map((m, idx) => ({
      id: `sm-${idx}`,
      itemId: 'inv-1',
      type: m.type,
      qty: m.qty,
      createdAt: m.at,
      item: { id: 'inv-1', name: m.itemName, sku: 'SKU', unit: 'units' },
      staff: { id: 'st-1', name: m.user },
    }))
  )
  const [supplierList] = useState(seedSuppliers)

  // Category Tree State
  const [categories, setCategories] = useState<CategoryNode[]>(DEFAULT_CATEGORY_TREE)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ortho: true,
    'ortho-wires': true,
    restorative: true,
    anesthetics: false,
    'infection-control': false,
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [updateOpen, setUpdateOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [suppliersOpen, setSuppliersOpen] = useState(false)
  const [newSubcatOpen, setNewSubcatOpen] = useState(false)

  // Adjust Stock Form
  const [selectedId, setSelectedId] = useState(seedInventory[0]?.id || '')
  const [adjustType, setAdjustType] = useState<'Restock' | 'Dispensed'>('Restock')
  const [qtyDelta, setQtyDelta] = useState('10')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Add Item Form
  const [newItemName, setNewItemName] = useState('')
  const [newItemSku, setNewItemSku] = useState('')
  const [newItemQty, setNewItemQty] = useState('10')
  const [newItemUnit, setNewItemUnit] = useState('boxes')
  const [newItemMinQty, setNewItemMinQty] = useState('5')
  const [newItemCost, setNewItemCost] = useState('350')
  const [newItemLocation, setNewItemLocation] = useState('Operatory 1')
  const [newItemCategory, setNewItemCategory] = useState('ortho-wires-niti')
  const [newItemAttributes, setNewItemAttributes] = useState<{ key: string; val: string }[]>([
    { key: '', val: '' },
  ])

  // Subcategory On-The-Fly Form
  const [newSubcatParentId, setNewSubcatParentId] = useState('ortho-brackets')
  const [newSubcatName, setNewSubcatName] = useState('')

  const fetchCategories = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/inventory/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        }
      }
    } catch {}
  }, [token])

  const fetchInventory = useCallback(async () => {
    if (!token) return
    try {
      const url =
        selectedCategory && selectedCategory !== 'all'
          ? `/api/inventory/items?category=${encodeURIComponent(selectedCategory)}`
          : '/api/inventory/items'

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        if (data.items.length > 0 && !selectedId) {
          setSelectedId(data.items[0].id)
        }
      }
    } catch {}
  }, [token, selectedCategory, selectedId])

  const fetchMovements = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/inventory/movements', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMoves(data.movements)
      }
    } catch {}
  }, [token])

  useEffect(() => {
    fetchCategories()
    fetchInventory()
    fetchMovements()
  }, [fetchCategories, fetchInventory, fetchMovements])

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter items by search query and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (selectedCategory === 'all') return true

    // Match exact category ID or any path segment
    if (item.categoryId === selectedCategory) return true
    if (item.categoryPath && item.categoryPath.some((p) => p.toLowerCase().includes(selectedCategory.toLowerCase()))) {
      return true
    }
    return false
  })

  const low = items.filter((i) => i.status === 'Low Stock')
  const expiring = items.filter((i) => i.expiry)
  const out = items.filter((i) => i.status === 'Out of Stock')
  const selected = items.find((i) => i.id === selectedId) ?? items[0]

  async function handleAdjustStock() {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/inventory/items/${selected.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: adjustType,
          qty: Number(qtyDelta) || 1,
          reason: reason || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setUpdateOpen(false)
        setReason('')
        fetchInventory()
        fetchMovements()

        if (data.item.status === 'Low Stock') {
          notify(
            `⚠️ ${selected.name} reached safety threshold (${data.item.qty} ${selected.unit}). Telegram alert sent to clinic channel!`,
          )
        } else {
          notify(`${selected.name} stock level updated successfully.`)
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to adjust stock')
      }
    } catch {
      alert('Network error adjusting stock.')
    } finally {
      setSubmitting(false)
    }
  }

  // Flatten categories into list of options with indentation
  function getFlatCategoryOptions(nodes: CategoryNode[], depth = 0): { id: string; name: string; path: string[] }[] {
    const out: { id: string; name: string; path: string[] }[] = []
    for (const n of nodes) {
      out.push({
        id: n.id,
        name: `${'— '.repeat(depth)}${n.name}`,
        path: [n.name],
      })
      if (n.children && n.children.length > 0) {
        const childOptions = getFlatCategoryOptions(n.children, depth + 1)
        for (const co of childOptions) {
          out.push({
            id: co.id,
            name: co.name,
            path: [n.name, ...co.path],
          })
        }
      }
    }
    return out
  }
  const flatOptions = getFlatCategoryOptions(categories)

  async function handleCreateItem() {
    if (!newItemName.trim() || !newItemSku.trim()) {
      alert('Item name and SKU are required.')
      return
    }
    setSubmitting(true)

    // Build attributes object
    const attributes: Record<string, string> = {}
    for (const attr of newItemAttributes) {
      if (attr.key.trim() && attr.val.trim()) {
        attributes[attr.key.trim()] = attr.val.trim()
      }
    }

    const matchedOption = flatOptions.find((o) => o.id === newItemCategory)
    const categoryPath = matchedOption ? matchedOption.path : []

    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          sku: newItemSku.trim(),
          qty: Number(newItemQty) || 0,
          unit: newItemUnit.trim() || 'units',
          minQty: Number(newItemMinQty) || 5,
          unitCost: Number(newItemCost) || 0,
          location: newItemLocation.trim(),
          categoryId: newItemCategory,
          categoryPath,
          attributes: Object.keys(attributes).length > 0 ? attributes : null,
        }),
      })

      if (res.ok) {
        setCreateItemOpen(false)
        setNewItemName('')
        setNewItemSku('')
        setNewItemAttributes([{ key: '', val: '' }])
        fetchInventory()
        notify(`Item added to catalog with category: ${categoryPath.join(' > ')}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create item.')
      }
    } catch {
      alert('Network error creating item.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateSubcategory() {
    if (!newSubcatName.trim()) {
      alert('Subcategory name is required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory/categories/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parentId: newSubcatParentId || undefined,
          name: newSubcatName.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewSubcatOpen(false)
        setNewSubcatName('')
        fetchCategories()
        if (data.node) {
          setNewItemCategory(data.node.id)
        }
        notify(`Created subcategory: ${newSubcatName.trim()}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create subcategory.')
      }
    } catch {
      alert('Network error creating subcategory.')
    } finally {
      setSubmitting(false)
    }
  }

  // Recursive Category Sidebar Item
  const renderCategoryTree = (node: CategoryNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] ?? false
    const isSelected = selectedCategory === node.id
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer ${
            isSelected
              ? 'bg-blue-50 font-bold text-[#2563EB]'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setSelectedCategory(node.id)}
        >
          <div className="flex items-center gap-1.5 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
                className="p-0.5 text-slate-400 hover:text-slate-700"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-[#2563EB]" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-slate-400" />
              )
            ) : (
              <Tag className="h-3 w-3 text-slate-400" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map((child) => renderCategoryTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Inventory & Supplies</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hierarchical catalog (Orthodontics, Restorative, Anesthetics), Telegram alerts, and dispensing audit log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUpdateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Adjust Stock
          </button>
          <button
            type="button"
            onClick={() => setCreateItemOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            <Plus className="h-4 w-4" />
            Add Catalog Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Package className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Total Units on Hand"
          value={String(items.reduce((s, i) => s + i.qty, 0))}
          badge="Live Clinic Catalog"
          badgeClass="bg-blue-50 text-blue-700"
        />
        <Metric
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          bg="bg-amber-50"
          label="Low Stock Items"
          value={String(low.length)}
          badge="Telegram Alerts Active"
          badgeClass="bg-amber-50 text-amber-700"
        />
        <Metric
          icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
          bg="bg-rose-50"
          label="Expiring Batches"
          value={String(expiring.length)}
          badge="Monitor Expiry"
          badgeClass="bg-rose-50 text-rose-700"
        />
        <Metric
          icon={<ShoppingCart className="h-5 w-5 text-slate-600" />}
          bg="bg-slate-100"
          label="Out of Stock"
          value={String(out.length)}
        />
      </div>

      {/* Main Content Layout: Category Folder Tree on Left + Items Table on Right */}
      <div className="grid gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {/* Left: Category Hierarchy Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categories & Types
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNewSubcatParentId('')
                  setNewSubcatOpen(true)
                }}
                className="text-[11px] font-bold text-[#2563EB] hover:underline"
              >
                + New Folder
              </button>
            </div>

            {/* "All Supplies" root link */}
            <div
              onClick={() => setSelectedCategory('all')}
              className={`mb-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5" />
                <span>All Supplies</span>
              </div>
              <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {items.length}
              </span>
            </div>

            {/* Collapsible Category Tree */}
            <div className="space-y-1">
              {categories.map((cat) => renderCategoryTree(cat, 0))}
            </div>
          </div>

          {/* Low Stock Priority Banner */}
          {low.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Low Stock Threshold Alert</span>
              </div>
              <p className="text-[11px] text-amber-800 mb-3">
                {low.length} supply items have dropped below minimum safety balance.
              </p>
              <div className="space-y-1.5">
                {low.slice(0, 3).map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs bg-white/70 rounded-lg p-1.5">
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">{it.name}</span>
                    <span className="text-amber-700 font-bold">{it.qty} {it.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Items Catalog & Movement Tables */}
        <div className="lg:col-span-3 xl:col-span-4 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplies by name, SKU, or room..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing:</span>
              <span className="font-bold text-slate-800">
                {selectedCategory === 'all'
                  ? 'All Supplies'
                  : flatOptions.find((f) => f.id === selectedCategory)?.name || selectedCategory}
              </span>
              <span>({filteredItems.length} items)</span>
            </div>
          </div>

          {/* Catalog Items Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Supply Item</th>
                    <th className="py-3 px-4 font-semibold">Category Hierarchy</th>
                    <th className="py-3 px-4 font-semibold">Stock / Threshold</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Attributes */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400">SKU: {item.sku}</div>
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(item.attributes).map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Category Path */}
                      <td className="py-3 px-4">
                        {item.categoryPath && item.categoryPath.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 text-[11px]">
                            {item.categoryPath.map((seg, idx) => (
                              <span key={seg} className="inline-flex items-center gap-1 text-slate-600">
                                {idx > 0 && <span className="text-slate-300">›</span>}
                                <span className={idx === item.categoryPath!.length - 1 ? 'font-bold text-[#2563EB]' : ''}>
                                  {seg}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">General Supply</span>
                        )}
                      </td>

                      {/* Stock & Status Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">
                            {item.qty} {item.unit}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.status === 'In Stock'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${
                              item.qty === 0
                                ? 'bg-rose-500'
                                : item.qty <= item.minQty
                                ? 'bg-amber-500'
                                : 'bg-[#2563EB]'
                            }`}
                            style={{
                              width: `${Math.min(100, (item.qty / Math.max(item.minQty * 2, 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">Min: {item.minQty} {item.unit}</span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-600">{item.location}</td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.unitCost ? etb(item.unitCost) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(item.id)
                              setAdjustType('Restock')
                              setUpdateOpen(true)
                            }}
                            className="rounded-lg bg-blue-50 px-2 py-1 font-bold text-[#2563EB] hover:bg-blue-100"
                          >
                            + Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(item.id)
                              setAdjustType('Dispensed')
                              setUpdateOpen(true)
                            }}
                            className="rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            - Dispense
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No supplies found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispensing Movements Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Recent Dispensing & Stock Movements</h2>
                <p className="text-xs text-slate-400">PostgreSQL Audit Trail with Operator & Timestamp</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-[#2563EB]">
                <Send className="h-3 w-3" /> Telegram Bot Low-Stock Trigger Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-2.5 font-medium">Item</th>
                    <th className="pb-2.5 font-medium">Movement Type</th>
                    <th className="pb-2.5 font-medium">Quantity</th>
                    <th className="pb-2.5 font-medium">Staff / Operator</th>
                    <th className="pb-2.5 font-medium">Reason / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moves.slice(0, 8).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-semibold text-slate-800">
                        {m.item?.name || 'Supply Item'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                            m.type === 'Restock'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {m.type === 'Restock' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">{m.qty}</td>
                      <td className="py-2.5 text-slate-600">{m.staff?.name || 'Clinic Staff'}</td>
                      <td className="py-2.5 text-slate-400 truncate max-w-[160px]">
                        {m.reason || 'Clinical use'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Catalog Item Modal */}
      {createItemOpen && (
        <Modal open={createItemOpen} onClose={() => setCreateItemOpen(false)}>
          <ModalHeader
            title="Add New Supply to Catalog"
            subtitle="Record items with custom category nesting and attributes"
            onClose={() => setCreateItemOpen(false)}
          />
          <div className="space-y-4 px-6 py-5 max-h-[80vh] overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">Item Name</span>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. 0.016 NiTi Round Upper Archwire"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>

              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">SKU / Code</span>
                <input
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                  placeholder="e.g. WIRE-NT16U"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>
            </div>

            {/* Category Selector with Inline + New Subcategory Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">Category & Subcategory</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewSubcatParentId(newItemCategory)
                    setNewSubcatOpen(true)
                  }}
                  className="text-[11px] font-bold text-[#2563EB] hover:underline"
                >
                  + Add Subcategory
                </button>
              </div>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              >
                {flatOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">Initial Qty</span>
                <input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">Unit</span>
                <input
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="boxes / packs"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">Min Safety Qty</span>
                <input
                  type="number"
                  value={newItemMinQty}
                  onChange={(e) => setNewItemMinQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-slate-700">Unit Cost (ETB)</span>
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>
            </div>

            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Location / Operatory Room</span>
              <input
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value)}
                placeholder="e.g. Operatory 2 (Ortho Cabinet)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              />
            </label>

            {/* Dynamic Attributes Builder */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Custom Attributes (Shade, Wire Size, Gauge, Slot)
                </span>
                <button
                  type="button"
                  onClick={() => setNewItemAttributes((prev) => [...prev, { key: '', val: '' }])}
                  className="text-[11px] font-bold text-[#2563EB]"
                >
                  + Add Attribute
                </button>
              </div>
              <div className="space-y-2">
                {newItemAttributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      placeholder="e.g. size"
                      value={attr.key}
                      onChange={(e) => {
                        const next = [...newItemAttributes]
                        next[idx].key = e.target.value
                        setNewItemAttributes(next)
                      }}
                      className="w-1/2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#2563EB]"
                    />
                    <input
                      placeholder="e.g. 0.016"
                      value={attr.val}
                      onChange={(e) => {
                        const next = [...newItemAttributes]
                        next[idx].val = e.target.value
                        setNewItemAttributes(next)
                      }}
                      className="w-1/2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#2563EB]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateItemOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCreateItem}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {submitting ? 'Saving...' : 'Create Supply Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Subcategory On-The-Fly Modal */}
      {newSubcatOpen && (
        <Modal open={newSubcatOpen} onClose={() => setNewSubcatOpen(false)}>
          <ModalHeader
            title="Create Custom Subcategory"
            subtitle="Nest categories as deep as needed for your clinic"
            onClose={() => setNewSubcatOpen(false)}
          />
          <div className="space-y-4 px-6 py-5">
            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Parent Category</span>
              <select
                value={newSubcatParentId}
                onChange={(e) => setNewSubcatParentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              >
                <option value="">(Root Level Folder)</option>
                {flatOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Subcategory Name</span>
              <input
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                placeholder="e.g. Ceramic Aesthetic Brackets or NiTi Rectangular"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewSubcatOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !newSubcatName.trim()}
                onClick={handleCreateSubcategory}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {submitting ? 'Creating...' : 'Create Subcategory'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Adjust Stock Modal */}
      {updateOpen && selected && (
        <Modal open={updateOpen} onClose={() => setUpdateOpen(false)}>
          <ModalHeader
            title="Adjust Stock Level"
            subtitle={`Record dispensing or shipment arrival for ${selected.name}`}
            onClose={() => setUpdateOpen(false)}
          />
          <div className="space-y-4 px-6 py-5">
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAdjustType('Restock')}
                className={`flex-1 rounded-md py-1.5 transition-all ${
                  adjustType === 'Restock' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Restock (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('Dispensed')}
                className={`flex-1 rounded-md py-1.5 transition-all ${
                  adjustType === 'Dispensed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Dispense / Use (-)
              </button>
            </div>

            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Select Item</span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Current: {i.qty} {i.unit})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Quantity ({selected.unit})</span>
              <input
                type="number"
                value={qtyDelta}
                onChange={(e) => setQtyDelta(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#2563EB]"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-700">Reason / Clinical Note</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  adjustType === 'Restock'
                    ? 'e.g. Delivery from Ethio-Medical Supplies'
                    : 'e.g. Restocked Operatory 1'
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdateOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || Number(qtyDelta) <= 0}
                onClick={handleAdjustStock}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {submitting ? 'Saving...' : 'Confirm Movement'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Suppliers Modal */}
      {suppliersOpen && (
        <Modal open={suppliersOpen} onClose={() => setSuppliersOpen(false)}>
          <ModalHeader
            title="Medical & Dental Suppliers"
            subtitle="Addis Ababa distributors"
            onClose={() => setSuppliersOpen(false)}
          />
          <ul className="space-y-3 px-6 py-5">
            {supplierList.map((s) => (
              <li key={s.name} className="rounded-xl border border-slate-100 p-3 text-xs">
                <div className="font-bold text-slate-800">{s.name}</div>
                <p className="text-slate-500">{s.next}</p>
                <p className="text-slate-500">Bole / Kirkos · +251 11 662 4480</p>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}

function Metric({
  icon,
  bg,
  label,
  value,
  badge,
  badgeClass,
}: {
  icon: ReactNode
  bg: string
  label: string
  value: string
  badge?: string
  badgeClass?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      {badge && (
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
          {badge}
        </span>
      )}
    </div>
  )
}
