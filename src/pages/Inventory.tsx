import { useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronRight, Package, Plus, RefreshCw, ShoppingCart } from 'lucide-react'
import { inventory as seedInventory, stockMovements as seedMoves, suppliers as seedSuppliers } from '../data/mock'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { useClinic } from '../context/ClinicContext'
import type { InventoryItem, StockMovement } from '../types'

export function Inventory() {
  const { notify } = useClinic()
  const [items, setItems] = useState(seedInventory)
  const [moves, setMoves] = useState(seedMoves)
  const [supplierList] = useState(seedSuppliers)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [suppliersOpen, setSuppliersOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const [qtyDelta, setQtyDelta] = useState('10')
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('12')
  const [newUnit, setNewUnit] = useState('boxes')
  const [detailSupplier, setDetailSupplier] = useState<(typeof seedSuppliers)[0] | null>(null)

  const low = items.filter((i) => i.qty > 0 && i.qty <= i.minQty)
  const expiring = items.filter((i) => i.expiry)
  const out = items.filter((i) => i.qty === 0)
  const selected = items.find((i) => i.id === selectedId) ?? items[0]

  function restock(item: InventoryItem, qty: number, label: string) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i)))
    const move: StockMovement = {
      id: `sm-${Date.now()}`,
      itemName: item.name,
      type: qty >= 0 ? 'Restock' : 'Dispensed',
      qty: `${qty >= 0 ? '+' : ''}${qty} ${item.unit}`,
      at: 'Aug 12, 2026 · just now',
      user: 'Amanuel Gebre',
    }
    setMoves((prev) => [move, ...prev])
    notify(label)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Stock levels for the Bole clinic store.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUpdateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Update Stock
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Package className="h-5 w-5 text-blue-600" />} bg="bg-blue-50" label="Total Items in Stock" value={String(items.reduce((s, i) => s + i.qty, 0))} badge="+4% this week" badgeClass="bg-emerald-50 text-emerald-700" />
        <Metric icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} bg="bg-amber-50" label="Low Stock Items" value={String(low.length)} badge="Requires action" badgeClass="bg-amber-50 text-amber-700" />
        <Metric icon={<AlertTriangle className="h-5 w-5 text-rose-600" />} bg="bg-rose-50" label="Items Expiring Soon" value={String(expiring.length)} badge="Urgent" badgeClass="bg-rose-50 text-rose-700" />
        <Metric icon={<ShoppingCart className="h-5 w-5 text-slate-600" />} bg="bg-slate-100" label="Out of Stock" value={String(out.length)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <h2 className="font-semibold text-slate-800">Priority Alerts</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="font-semibold text-amber-900">Anesthetic Cartridges (Lido)</div>
            <p className="text-sm text-amber-800">Low stock in sterile store.</p>
            <button
              type="button"
              onClick={() => {
                const item = items.find((i) => i.name.includes('Anesthetic')) ?? items[2]
                restock(item, 12, 'Purchase order sent to Addis Pharmaceuticals.')
              }}
              className="mt-1 text-sm font-semibold text-[#2563EB]"
            >
              Reorder Now
            </button>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-semibold text-rose-900">Composite Resin (Shade A2)</div>
            <p className="text-sm text-rose-800">Batch expiring Aug 22, 2026.</p>
            <button type="button" onClick={() => setBatchOpen(true)} className="mt-1 text-sm font-semibold text-[#2563EB]">
              Review Batch
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-slate-800">Disposable Bibs</div>
            <p className="text-sm text-slate-500">Out of stock in Storage Room B.</p>
            <button
              type="button"
              onClick={() => {
                const item = items.find((i) => i.name.includes('Bibs')) ?? items[4]
                restock(item, 8, 'Bibs restocked from Ethio-Medical Supplies.')
              }}
              className="mt-1 text-sm font-semibold text-[#2563EB]"
            >
              Restock now
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800">Stock Snapshot</h2>
          <p className="mb-4 text-xs text-slate-400">Usage trend shown as quantities — no bar graphs.</p>
          <ul className="space-y-3">
            {items.slice(0, 5).map((i) => (
              <li key={i.id}>
                <button type="button" className="mb-1 flex w-full justify-between text-left text-sm" onClick={() => { setSelectedId(i.id); setUpdateOpen(true) }}>
                  <span className="text-slate-700">{i.name}</span>
                  <span className="font-semibold text-slate-800">
                    {i.qty} {i.unit}
                  </span>
                </button>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${i.qty === 0 ? 'bg-rose-400' : i.qty <= i.minQty ? 'bg-amber-400' : 'bg-[#2563EB]'}`}
                    style={{ width: `${Math.min(100, (i.qty / Math.max(i.minQty * 2, 1)) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-800">Recent Stock Movements</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Item Name</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Qty Change</th>
                <th className="pb-3 font-medium">Date & Time</th>
                <th className="pb-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 font-medium text-slate-800">{m.itemName}</td>
                  <td className="py-3">
                    <Badge status={m.type} />
                  </td>
                  <td className="py-3 text-slate-600">{m.qty}</td>
                  <td className="py-3 text-slate-500">{m.at}</td>
                  <td className="py-3 text-slate-600">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-800">Top Suppliers</h2>
          <ul className="space-y-3">
            {supplierList.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => setDetailSupplier(s)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                >
                  <Avatar initials={s.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.next}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setSuppliersOpen(true)}
            className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700"
          >
            Manage Suppliers
          </button>
        </div>
      </div>

      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)}>
        <ModalHeader title="Update Stock" subtitle="Adjust quantity on hand" onClose={() => setUpdateOpen(false)} />
        <div className="space-y-3 px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Item</span>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.qty} {i.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Quantity to add</span>
            <input value={qtyDelta} onChange={(e) => setQtyDelta(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setUpdateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (selected) restock(selected, Number(qtyDelta) || 0, `${selected.name} updated.`)
              setUpdateOpen(false)
            }}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Save stock
          </button>
        </div>
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <ModalHeader title="Add New Item" subtitle="Catalog for the Bole store" onClose={() => setAddOpen(false)} />
        <div className="space-y-3 px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Alginate powder" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-slate-700">Qty</span>
              <input value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-slate-700">Unit</span>
              <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) return
              const item: InventoryItem = {
                id: `inv-${Date.now()}`,
                name: newName.trim(),
                sku: 'NEW',
                qty: Number(newQty) || 0,
                unit: newUnit,
                minQty: 4,
                location: 'Central Store',
                supplier: 'Ethio-Medical Supplies',
              }
              setItems((prev) => [item, ...prev])
              setAddOpen(false)
              setNewName('')
              notify(`${item.name} added to inventory.`)
            }}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Add item
          </button>
        </div>
      </Modal>

      <Modal open={batchOpen} onClose={() => setBatchOpen(false)}>
        <ModalHeader title="Review batch" subtitle="Composite Resin (Shade A2)" onClose={() => setBatchOpen(false)} />
        <div className="space-y-2 px-6 py-5 text-sm text-slate-600">
          <p>Lot: CMP-A2-8821 · Expiry: Aug 22, 2026</p>
          <p>Location: Operatory 2 · 4 syringes remaining</p>
          <p>Supplier: Abyssinia Dental Supply</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setBatchOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Keep
          </button>
          <button
            type="button"
            onClick={() => {
              const item = items.find((i) => i.name.includes('Composite')) ?? items[3]
              restock(item, -item.qty, 'Expired composite batch disposed.')
              setBatchOpen(false)
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Dispose batch
          </button>
        </div>
      </Modal>

      <Modal open={suppliersOpen || !!detailSupplier} onClose={() => { setSuppliersOpen(false); setDetailSupplier(null) }}>
        <ModalHeader
          title={detailSupplier ? detailSupplier.name : 'Manage Suppliers'}
          subtitle="Addis Ababa medical suppliers"
          onClose={() => { setSuppliersOpen(false); setDetailSupplier(null) }}
        />
        <ul className="space-y-3 px-6 py-5">
          {(detailSupplier ? [detailSupplier] : supplierList).map((s) => (
            <li key={s.name} className="rounded-xl border border-slate-100 p-3 text-sm">
              <div className="font-semibold text-slate-800">{s.name}</div>
              <p className="text-slate-500">{s.next}</p>
              <p className="text-slate-500">Bole / Kirkos · +251 11 662 4480</p>
              <button
                type="button"
                onClick={() => {
                  notify(`Reorder email queued to ${s.name}.`)
                  setSuppliersOpen(false)
                  setDetailSupplier(null)
                }}
                className="mt-2 text-sm font-semibold text-[#2563EB]"
              >
                Place order
              </button>
            </li>
          ))}
        </ul>
      </Modal>
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
      {badge && <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>{badge}</span>}
    </div>
  )
}
