import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, History, Landmark, Receipt, Smartphone, Wallet } from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { CreateInvoiceModal } from '../components/CreateInvoiceModal'

export function CashierDashboard() {
  const { invoices, patients, notify } = useClinic()
  const navigate = useNavigate()
  const unpaid = invoices.filter((i) => i.status !== 'Paid')
  const paid = invoices.filter((i) => i.status === 'Paid')
  const [date, setDate] = useState('2026-08-12')
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [closed, setClosed] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            REGISTER OPEN
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Cashier Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Today's financial overview and active transactions.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              notify(`Showing register for ${e.target.value}.`)
            }}
            className="border-0 bg-transparent outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        <div className="rounded-2xl bg-[#2563EB] p-5 text-white shadow-sm xl:col-span-2">
          <div className="text-sm text-blue-100">Total Revenue Today</div>
          <div className="mt-2 text-3xl font-bold">ETB 15,400.00</div>
          <div className="mt-2 text-sm text-blue-100">↑ +12% vs yesterday</div>
        </div>
        {[
          { label: 'Cash', amount: 4100, tx: '12 txns', icon: Wallet },
          { label: 'Bank Transfer', amount: 6200, tx: '5 txns', icon: Landmark },
          { label: 'Telebirr', amount: 2400, tx: '8 txns', icon: Smartphone },
          { label: 'Card', amount: 2700, tx: '4 txns', icon: Receipt },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <m.icon className="mb-2 h-4 w-4 text-[#2563EB]" />
            <div className="text-xs text-slate-500">{m.label}</div>
            <div className="font-bold text-slate-800">{etb(m.amount)}</div>
            <div className="text-xs text-slate-400">{m.tx}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-2">
          <h2 className="font-semibold text-slate-800">Quick Actions</h2>
          <button
            type="button"
            onClick={() => {
              if (unpaid[0]) navigate(`/billing/pay/${unpaid[0].id}`)
              else notify('No unpaid invoices. Create one first.')
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white"
          >
            <Receipt className="h-4 w-4" />
            Process Payment
          </button>
          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-[#2563EB] px-4 py-3 text-sm font-semibold text-[#2563EB]"
          >
            Create Invoice
          </button>
          <button type="button" onClick={() => navigate('/billing')} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
            <Clock className="h-4 w-4" />
            Payment History
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Pending Invoices</h2>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
              {unpaid.length} Actions Required
            </span>
          </div>
          <ul className="space-y-3">
            {unpaid.slice(0, 3).map((inv) => {
              const p = patients.find((x) => x.id === inv.patientId)
              return (
                <li key={inv.id} className="flex items-center gap-3">
                  <Avatar initials={p?.initials ?? 'PT'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-800">{p?.name}</div>
                    <div className="text-xs text-slate-400">{inv.treatment}</div>
                  </div>
                  <div className="text-sm font-semibold text-rose-600">{etb(inv.total - inv.paid)}</div>
                  <button
                    type="button"
                    onClick={() => navigate(`/billing/pay/${inv.id}`)}
                    className="rounded-lg bg-[#2563EB] px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Process
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Reconciliation Summary</h2>
          <div className="mb-2 text-sm text-slate-500">Cash Drawer Expected</div>
          <div className="mb-1 font-semibold">{etb(4100)}</div>
          <div className="mb-4 h-1.5 rounded-full bg-slate-100">
            <div className="h-full w-[92%] rounded-full bg-emerald-500" />
          </div>
          <div className="mb-2 text-sm text-slate-500">Card / Bank Terminal</div>
          <div className="mb-1 font-semibold">{etb(6200)}</div>
          <div className="mb-4 h-1.5 rounded-full bg-slate-100">
            <div className="h-full w-[88%] rounded-full bg-[#2563EB]" />
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-800">
            {closed ? 'Register closed · Discrepancy: ETB 0.00' : 'Discrepancy: ETB 0.00'}
          </div>
          <button
            type="button"
            onClick={() => setCloseOpen(true)}
            className="mt-3 w-full rounded-xl bg-blue-100 py-2.5 text-sm font-semibold text-[#1D4ED8]"
          >
            {closed ? 'Reopen Register' : 'End of Day Close'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Today's Transactions</h2>
          <button type="button" onClick={() => navigate('/billing')} aria-label="Payment history" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <History className="h-4 w-4" />
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Patient</th>
              <th className="pb-3 font-medium">Invoice #</th>
              <th className="pb-3 font-medium">Method</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paid.map((inv) => {
              const p = patients.find((x) => x.id === inv.patientId)
              return (
                <tr key={inv.id}>
                  <td className="py-3 text-slate-500">{inv.time ?? '—'}</td>
                  <td className="py-3 font-medium text-slate-800">{p?.name}</td>
                  <td className="py-3">
                    <button type="button" className="font-medium text-[#2563EB]" onClick={() => navigate(`/billing/pay/${inv.id}`)}>
                      {inv.id}
                    </button>
                  </td>
                  <td className="py-3 text-slate-600">{inv.method ?? '—'}</td>
                  <td className="py-3 font-semibold">{etb(inv.paid)}</td>
                  <td className="py-3">
                    <Badge status="Paid" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <CreateInvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />

      <Modal open={closeOpen} onClose={() => setCloseOpen(false)}>
        <ModalHeader title={closed ? 'Reopen register' : 'End of day close'} subtitle="Cash drawer vs expected ETB 4,100.00" onClose={() => setCloseOpen(false)} />
        <p className="px-6 py-5 text-sm text-slate-600">
          {closed
            ? 'Reopen the Bole front-desk register for walk-in collections?'
            : 'Counted cash matches expected. Close the register for 12 Aug 2026?'}
        </p>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setCloseOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setClosed((v) => !v)
              setCloseOpen(false)
              notify(closed ? 'Register reopened.' : 'Register closed. Discrepancy ETB 0.00.')
            }}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  )
}
