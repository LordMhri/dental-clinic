import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Lock,
  Unlock,
} from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { ActionMenu } from '../components/ui/ActionMenu'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { CreateInvoiceModal } from '../components/CreateInvoiceModal'

interface CashDrawerSessionData {
  id: string
  date: string
  status: 'Open' | 'Closed'
  openingCash: number
  expectedCash: number
  countedCash?: number | null
  discrepancy?: number | null
  notes?: string | null
  cashier?: { id: string; name: string }
}

export function Billing() {
  const { invoices, patients, notify, token } = useClinic()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [filterTab, setFilterTab] = useState<'All' | 'Unpaid' | 'Partial' | 'Paid'>('All')

  // Cash drawer session state
  const [drawerSession, setDrawerSession] = useState<CashDrawerSessionData | null>(null)
  const [openDrawerModal, setOpenDrawerModal] = useState(false)
  const [closeDrawerModal, setCloseDrawerModal] = useState(false)
  const [openingCashInput, setOpeningCashInput] = useState('5000')
  const [countedCashInput, setCountedCashInput] = useState('')
  const [reconcileNotes, setReconcileNotes] = useState('')
  const [submittingDrawer, setSubmittingDrawer] = useState(false)

  const fetchDrawerSession = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/billing/cash-drawer', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDrawerSession(data.session)
      }
    } catch {}
  }, [token])

  useEffect(() => {
    fetchDrawerSession()
  }, [fetchDrawerSession])

  async function handleOpenDrawer() {
    setSubmittingDrawer(true)
    if (!token) {
      setDrawerSession({
        id: 'cds-demo',
        date: 'Aug 12, 2026',
        status: 'Open',
        openingCash: Number(openingCashInput) || 5000,
        expectedCash: Number(openingCashInput) || 5000,
        cashier: { id: 'st-1', name: 'Reception' },
      })
      setOpenDrawerModal(false)
      notify(`Cash drawer opened with ${etb(Number(openingCashInput) || 5000)}.`)
      setSubmittingDrawer(false)
      return
    }
    try {
      const res = await fetch('/api/billing/cash-drawer/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          openingCash: Number(openingCashInput) || 0,
          notes: 'Shift start',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDrawerSession(data.session)
        setOpenDrawerModal(false)
        notify(`Cash drawer opened with ${etb(Number(openingCashInput) || 0)}.`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to open cash drawer.')
      }
    } catch {
      alert('Network error opening drawer.')
    } finally {
      setSubmittingDrawer(false)
    }
  }

  async function handleCloseDrawer() {
    setSubmittingDrawer(true)
    if (!token) {
      setDrawerSession({
        id: 'cds-demo',
        date: 'Aug 12, 2026',
        status: 'Closed',
        openingCash: drawerSession?.openingCash || 5000,
        expectedCash: drawerSession?.expectedCash || 5000,
        countedCash: Number(countedCashInput) || 0,
        discrepancy: discrepancyPreview,
        cashier: { id: 'st-1', name: 'Reception' },
      })
      setCloseDrawerModal(false)
      notify(`Register closed. Discrepancy: ${etb(discrepancyPreview)}.`)
      setSubmittingDrawer(false)
      return
    }
    try {
      const res = await fetch('/api/billing/cash-drawer/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countedCash: Number(countedCashInput) || 0,
          notes: reconcileNotes,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDrawerSession(data.session)
        setCloseDrawerModal(false)
        notify(`Register closed. Discrepancy: ${etb(data.discrepancy || 0)}.`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to close register.')
      }
    } catch {
      alert('Network error closing register.')
    } finally {
      setSubmittingDrawer(false)
    }
  }

  const unpaid = invoices.filter((i) => i.status !== 'Paid')
  const paidToday = invoices.filter(
    (i) => i.status === 'Paid' && (i.date.includes('Aug 12') || i.date.includes('Sep 2')),
  )

  const filteredInvoices = invoices.filter((inv) => {
    if (filterTab === 'All') return true
    return inv.status === filterTab
  })

  const discrepancyPreview =
    Number(countedCashInput) - (drawerSession?.expectedCash || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cashier Desk & Billing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Invoices, Telebirr/CBE collections, and daily register cash reconciliation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
          <button
            type="button"
            onClick={() => {
              if (unpaid[0]) navigate(`/billing/pay/${unpaid[0].id}`)
              else notify('No unpaid invoices in queue.')
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Process Next Unpaid
          </button>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                drawerSession?.status === 'Open'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {drawerSession?.status === 'Open' ? (
                <Unlock className="h-6 w-6" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">
                  Cash Drawer Session:{' '}
                  <span
                    className={
                      drawerSession?.status === 'Open'
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }
                  >
                    {drawerSession?.status === 'Open' ? 'REGISTER OPEN' : 'REGISTER CLOSED'}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {drawerSession?.status === 'Open'
                  ? `Active cashier: ${drawerSession.cashier?.name || 'Reception'} · Opening float: ${etb(
                      drawerSession.openingCash,
                    )} · Expected cash in drawer: ${etb(drawerSession.expectedCash)}`
                  : 'Cash register is currently locked. Open register to track cash collections.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {drawerSession?.status === 'Open' ? (
              <button
                type="button"
                onClick={() => {
                  setCountedCashInput(String(drawerSession.expectedCash))
                  setCloseDrawerModal(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <Lock className="h-4 w-4" /> Close Register & Reconcile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpenDrawerModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                <Unlock className="h-4 w-4" /> Open Morning Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#2563EB] p-5 text-white shadow-sm">
          <div className="text-sm text-blue-100">Outstanding Receivable</div>
          <div className="mt-1 text-3xl font-bold">
            {etb(unpaid.reduce((s, i) => s + (i.total - i.paid), 0))}
          </div>
          <div className="mt-2 text-xs text-blue-100">{unpaid.length} unpaid clinical invoices</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Collected Today</div>
          <div className="mt-1 text-3xl font-bold text-slate-800">
            {etb(paidToday.reduce((s, i) => s + i.paid, 0))}
          </div>
          <div className="mt-2 text-xs text-slate-400">Telebirr, CBE & Cash</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Paid Invoices</div>
          <div className="mt-1 text-3xl font-bold text-slate-800">
            {invoices.filter((i) => i.status === 'Paid').length}
          </div>
          <div className="mt-2 text-xs text-slate-400">100% cleared to ledger</div>
        </div>
      </div>

      {/* Invoices List with Filter Tabs */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-800">Clinical Invoices & Billing Queue</h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {(['All', 'Unpaid', 'Partial', 'Paid'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`rounded-lg px-3 py-1 transition-all ${
                  filterTab === tab
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Invoice ID</th>
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Clinical Procedure</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Total Amount</th>
                <th className="pb-3 font-medium">Paid</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const p = patients.find((x) => x.id === inv.patientId)
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-[#2563EB]">{inv.id}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={p?.initials ?? 'PT'} size="sm" />
                        <div>
                          <div className="font-medium text-slate-800">{p?.name || 'Patient'}</div>
                          <div className="text-xs text-slate-400">{inv.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-700">{inv.treatment}</td>
                    <td className="py-3 text-slate-500">{inv.date}</td>
                    <td className="py-3 font-bold text-slate-800">{etb(inv.total)}</td>
                    <td className="py-3 text-slate-600">{etb(inv.paid)}</td>
                    <td className="py-3">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3 text-right">
                      {inv.status !== 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/billing/pay/${inv.id}`)}
                          className="rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                        >
                          Collect Payment
                        </button>
                      ) : (
                        <ActionMenu
                          items={[
                            {
                              label: 'Print receipt',
                              onClick: () => {
                                window.print()
                                notify(`Receipt for ${inv.id} sent to printer.`)
                              },
                            },
                            {
                              label: 'View patient',
                              onClick: () => navigate(`/patients/${inv.patientId}`),
                            },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Cash Drawer Modal */}
      {openDrawerModal && (
        <Modal open={openDrawerModal} onClose={() => setOpenDrawerModal(false)}>
          <ModalHeader
            title="Open Morning Cash Register"
            subtitle="Count and record the initial opening float cash"
            onClose={() => setOpenDrawerModal(false)}
          />
          <div className="space-y-4 px-6 py-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Opening Cash Float (ETB)
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">
                  ETB
                </span>
                <input
                  type="number"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-14 pr-3 text-lg font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setOpenDrawerModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDrawer}
                onClick={handleOpenDrawer}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {submittingDrawer ? 'Opening...' : 'Confirm & Open Register'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Close Cash Drawer & Reconcile Modal */}
      {closeDrawerModal && (
        <Modal open={closeDrawerModal} onClose={() => setCloseDrawerModal(false)}>
          <ModalHeader
            title="Close Register & Daily Reconciliation"
            subtitle="Perform physical cash count and verify against expected register total"
            onClose={() => setCloseDrawerModal(false)}
          />
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Opening Cash:</span>
                <span className="font-semibold text-slate-700">
                  {etb(drawerSession?.openingCash || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">System Expected Cash in Drawer:</span>
                <span className="font-bold text-slate-900">
                  {etb(drawerSession?.expectedCash || 0)}
                </span>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Counted Physical Cash (ETB)
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">
                  ETB
                </span>
                <input
                  type="number"
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-14 pr-3 text-lg font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>
            </label>

            {/* Discrepancy indicator */}
            <div
              className={`rounded-xl p-3 text-xs font-semibold ${
                discrepancyPreview === 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : discrepancyPreview > 0
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              Reconciliation Discrepancy: {etb(discrepancyPreview)}{' '}
              {discrepancyPreview === 0
                ? '(Balanced)'
                : discrepancyPreview > 0
                ? '(Surplus)'
                : '(Shortage)'}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Cashier Close Notes</span>
              <textarea
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                rows={2}
                placeholder="Notes regarding cash drop, banking handover, or discrepancy..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setCloseDrawerModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDrawer}
                onClick={handleCloseDrawer}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {submittingDrawer ? 'Closing...' : 'Lock Register & Close Shift'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {createOpen && <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
