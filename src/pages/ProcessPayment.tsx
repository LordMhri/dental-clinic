import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  Clock,
  CreditCard,
  Printer,
  Smartphone,
} from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import type { PaymentMethod } from '../types'

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'Bank', label: 'Bank', icon: Building2 },
  { id: 'Telebirr', label: 'Telebirr', icon: Smartphone },
]

export function ProcessPayment() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { invoices, patients, processPayment, notify } = useClinic()
  const invoice = invoices.find((i) => i.id === invoiceId) ?? invoices.find((i) => i.status !== 'Paid')
  const patient = patients.find((p) => p.id === invoice?.patientId)
  const [method, setMethod] = useState<PaymentMethod>('Card')
  const [full, setFull] = useState(true)
  const remaining = invoice ? invoice.total - invoice.paid : 0
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [ref, setRef] = useState('')
  const [date, setDate] = useState('2026-08-12')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  if (!invoice || !patient) {
    return <p className="text-slate-500">Invoice not found.</p>
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/billing')}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Billing
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Process Payment</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          <Clock className="h-3.5 w-3.5" />
          Draft Saved 1m ago
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Payment Details</h2>
          <p className="mb-2 text-sm font-medium text-slate-600">Payment Method</p>
          <div className="mb-5 grid grid-cols-4 gap-3">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-medium ${
                  method === m.id
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <m.icon className="h-5 w-5" />
                {m.label}
              </button>
            ))}
          </div>

          <label className="mb-4 block">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Amount to Pay</span>
              <div className="flex overflow-hidden rounded-full bg-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFull(true)
                    setAmount(remaining.toFixed(2))
                  }}
                  className={`px-3 py-1 ${full ? 'bg-[#2563EB] text-white' : 'text-slate-500'}`}
                >
                  Full
                </button>
                <button
                  type="button"
                  onClick={() => setFull(false)}
                  className={`px-3 py-1 ${!full ? 'bg-[#2563EB] text-white' : 'text-slate-500'}`}
                >
                  Partial
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">ETB</span>
              <input
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setFull(false)
                }}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-14 pr-3 text-lg font-semibold outline-none focus:border-[#2563EB]"
              />
            </div>
          </label>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Reference Number</span>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. TRC-09823"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2563EB]"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Date Received</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2563EB]"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Internal Notes (Optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add cashier notes or Telebirr confirmation..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>

        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice</div>
              <div className="font-bold text-slate-800">{invoice.id}</div>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
              {invoice.status}
            </span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              Patient: <span className="font-semibold text-slate-800">{patient.name}</span>
            </li>
            <li>
              Treatment: <span className="font-medium">{invoice.treatment}</span>
            </li>
            <li>Invoice Date: {invoice.date}</li>
          </ul>
          <div className="my-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-medium">{etb(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Paid</span>
              <span>{etb(invoice.paid)}</span>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="text-xs font-medium text-blue-700">Remaining Balance</div>
            <div className="text-2xl font-bold text-[#1D4ED8]">{etb(remaining)}</div>
          </div>
          {done ? (
            <p className="mt-4 text-center text-sm font-medium text-emerald-600">Payment recorded.</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                processPayment(invoice.id, Number(amount) || 0, method)
                setDone(true)
                notify(`Payment of ETB ${amount} recorded.`)
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              Process Payment
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const html = `<html><head><title>Receipt ${invoice.id}</title>
                <style>body{font-family:sans-serif;padding:24px} h1{font-size:18px}</style></head>
                <body><h1>Lewi Dental Clinic</h1><p>Bole Road, Addis Ababa</p>
                <p>${invoice.id}</p><p>${patient.name}</p><p>${invoice.treatment}</p>
                <p>Paid: ${etb(Number(amount) || invoice.paid)} via ${method}</p>
                <p>Thank you.</p></body></html>`
              const w = window.open('', '_blank', 'width=480,height=640')
              if (w) {
                w.document.write(html)
                w.document.close()
                w.focus()
                w.print()
              }
              notify('Receipt opened for printing.')
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </aside>
      </div>
    </div>
  )
}
