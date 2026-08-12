import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, Building2, CreditCard, Plus, Smartphone } from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { ActionMenu } from '../components/ui/ActionMenu'
import { CreateInvoiceModal } from '../components/CreateInvoiceModal'

export function Billing() {
  const { invoices, patients, notify } = useClinic()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const unpaid = invoices.filter((i) => i.status !== 'Paid')
  const paidToday = invoices.filter((i) => i.status === 'Paid' && i.date.includes('Aug 12'))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Invoices, collections, and outstanding balances in ETB.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
          <button
            type="button"
            onClick={() => {
              if (unpaid[0]) navigate(`/billing/pay/${unpaid[0].id}`)
              else notify('No unpaid invoices. Create one first.')
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Process Payment
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#2563EB] p-5 text-white shadow-sm">
          <div className="text-sm text-blue-100">Outstanding</div>
          <div className="mt-1 text-3xl font-bold">
            {etb(unpaid.reduce((s, i) => s + (i.total - i.paid), 0))}
          </div>
          <div className="mt-2 text-xs text-blue-100">{unpaid.length} open invoices</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Collected today</div>
          <div className="mt-1 text-3xl font-bold text-slate-800">
            {etb(paidToday.reduce((s, i) => s + i.paid, 0))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Paid invoices</div>
          <div className="mt-1 text-3xl font-bold text-slate-800">{invoices.filter((i) => i.status === 'Paid').length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">All Invoices</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3 font-medium">Invoice</th>
              <th className="pb-3 font-medium">Patient</th>
              <th className="pb-3 font-medium">Treatment</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const p = patients.find((x) => x.id === inv.patientId)
              return (
                <tr key={inv.id}>
                  <td className="py-3 font-medium text-[#2563EB]">{inv.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={p?.initials ?? 'PT'} size="sm" />
                      {p?.name}
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{inv.treatment}</td>
                  <td className="py-3 text-slate-500">{inv.date}</td>
                  <td className="py-3 font-semibold text-slate-800">{etb(inv.total)}</td>
                  <td className="py-3">
                    <Badge status={inv.status} />
                  </td>
                  <td className="py-3 text-right">
                    {inv.status !== 'Paid' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/billing/pay/${inv.id}`)}
                        className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Process
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
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { icon: Banknote, label: 'Cash' },
          { icon: Building2, label: 'Bank' },
          { icon: Smartphone, label: 'Telebirr' },
          { icon: CreditCard, label: 'Card' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            role="button"
            tabIndex={0}
            onClick={() => notify(`Filter: ${label} payments. Open an invoice to collect.`)}
            onKeyDown={(e) => e.key === 'Enter' && notify(`Filter: ${label} payments.`)}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600 hover:border-blue-200"
          >
            <Icon className="h-4 w-4 text-[#2563EB]" />
            {label} accepted
          </div>
        ))}
      </div>
      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
