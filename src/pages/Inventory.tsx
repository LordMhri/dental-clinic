import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Send,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { inventory as seedInventory, stockMovements as seedMoves, suppliers as seedSuppliers } from '../data/mock'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { useClinic } from '../context/ClinicContext'

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

  const [updateOpen, setUpdateOpen] = useState(false)
  const [suppliersOpen, setSuppliersOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(seedInventory[0]?.id || '')
  const [adjustType, setAdjustType] = useState<'Restock' | 'Dispensed'>('Restock')
  const [qtyDelta, setQtyDelta] = useState('10')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchInventory = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/inventory/items', {
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
  }, [token, selectedId])

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
    fetchInventory()
    fetchMovements()
  }, [fetchInventory, fetchMovements])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Inventory & Pharmacy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stock levels, automatic Telegram low-stock alerts, and dispensing audit log.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUpdateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Adjust Stock
          </button>
          <button
            type="button"
            onClick={() => {
              if (items[0]) setSelectedId(items[0].id)
              setAdjustType('Restock')
              setUpdateOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            <Plus className="h-4 w-4" />
            Restock Item
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
          badge="Live Clinic Store"
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

      {/* Telegram Alerts & Quick Restock */}
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Priority Stock Alerts</h2>
            <span className="inline-flex items-center gap-1 text-xs text-[#2563EB]">
              <Send className="h-3 w-3" /> Bot Channel: clinic-staff-inventory
            </span>
          </div>

          {low.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-4"
            >
              <div>
                <div className="font-bold text-amber-950">{item.name}</div>
                <p className="text-xs text-amber-800">
                  Current balance: <span className="font-bold">{item.qty} {item.unit}</span> (Safety threshold: {item.minQty} {item.unit}) · Location: {item.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(item.id)
                  setAdjustType('Restock')
                  setQtyDelta('20')
                  setUpdateOpen(true)
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#2563EB] shadow-sm border border-amber-200 hover:bg-slate-50"
              >
                Restock Now
              </button>
            </div>
          ))}

          {out.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 p-4"
            >
              <div>
                <div className="font-bold text-rose-950">{item.name}</div>
                <p className="text-xs text-rose-800">
                  Out of stock in {item.location}!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(item.id)
                  setAdjustType('Restock')
                  setQtyDelta('30')
                  setUpdateOpen(true)
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Emergency Restock
              </button>
            </div>
          ))}

          {low.length === 0 && out.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              All clinical inventory supplies are above their safety reorder thresholds.
            </div>
          )}
        </div>

        {/* Stock Snapshot */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-1 font-bold text-slate-800">Stock Levels by Item</h2>
          <p className="mb-4 text-xs text-slate-400">Quantities vs safety thresholds.</p>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className="mb-1 flex w-full justify-between text-left text-xs"
                  onClick={() => {
                    setSelectedId(i.id)
                    setUpdateOpen(true)
                  }}
                >
                  <span className="font-semibold text-slate-700">{i.name}</span>
                  <span className="font-bold text-slate-900">
                    {i.qty} {i.unit}
                  </span>
                </button>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${
                      i.qty === 0
                        ? 'bg-rose-500'
                        : i.qty <= i.minQty
                        ? 'bg-amber-500'
                        : 'bg-[#2563EB]'
                    }`}
                    style={{
                      width: `${Math.min(100, (i.qty / Math.max(i.minQty * 2, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stock Movements Audit Log Table */}
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Dispensing & Restock Movements</h2>
            <span className="text-xs text-slate-400">PostgreSQL Audit Trail</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Quantity</th>
                  <th className="pb-3 font-medium">Staff / Operator</th>
                  <th className="pb-3 font-medium">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moves.slice(0, 10).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">
                      {m.item?.name || 'Item'}
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
                    <td className="py-2.5 text-slate-600">{m.staff?.name || 'Staff'}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[140px]">
                      {m.reason || 'Routine operation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 font-bold text-slate-800">Medical Suppliers</h2>
          <ul className="space-y-3">
            {supplierList.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => setSuppliersOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                >
                  <Avatar initials={s.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 text-xs">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.next}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setSuppliersOpen(true)}
            className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Manage Suppliers
          </button>
        </div>
      </div>

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
