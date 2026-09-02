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
  CheckCircle2,
} from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import type { PaymentMethod } from '../types'

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard; desc: string }[] = [
  { id: 'Telebirr', label: 'Telebirr', icon: Smartphone, desc: 'Mobile wallet payment' },
  { id: 'Bank', label: 'CBE / Bank', icon: Building2, desc: 'Commercial Bank of Ethiopia' },
  { id: 'Cash', label: 'Cash (ETB)', icon: Banknote, desc: 'Physical drawer collection' },
  { id: 'Card', label: 'POS Card', icon: CreditCard, desc: 'Debit / ATM terminal' },
]

export function ProcessPayment() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { invoices, patients, user, processPayment, notify } = useClinic()
  const invoice = invoices.find((i) => i.id === invoiceId) ?? invoices.find((i) => i.status !== 'Paid')
  const patient = patients.find((p) => p.id === invoice?.patientId)

  const [method, setMethod] = useState<PaymentMethod>('Telebirr')
  const [full, setFull] = useState(true)
  const remaining = invoice ? Math.max(0, invoice.total - invoice.paid) : 0
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [cashTendered, setCashTendered] = useState(remaining.toFixed(2))
  const [ref, setRef] = useState('')
  const [date, setDate] = useState('2026-08-12')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!invoice || !patient) {
    return <p className="p-8 text-slate-500">Invoice not found.</p>
  }

  const changeDue = Math.max(0, Number(cashTendered) - Number(amount))

  async function handleProcessPayment() {
    if (!invoice || !patient) return
    setSubmitting(true)
    try {
      await processPayment(invoice.id, Number(amount) || 0, method, ref || undefined)
      setDone(true)
      notify(`Payment of ${etb(Number(amount) || 0)} successfully processed via ${method}.`)
    } catch {
      notify('Failed to process payment.')
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrintReceipt() {
    if (!invoice || !patient) return
    const paidAmount = Number(amount) || invoice.paid
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${invoice.id}</title>
  <style>
    @media print {
      body { margin: 0; padding: 12px; font-family: monospace; font-size: 13px; color: #000; }
      .no-print { display: none; }
    }
    body { font-family: monospace; font-size: 13px; max-width: 320px; margin: 0 auto; padding: 20px; line-height: 1.4; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size: 16px;">LEWI DENTAL CLINIC</div>
    <div>Bole Sub-City, Woreda 03</div>
    <div>Addis Ababa, Ethiopia</div>
    <div>Tel: +251 911 123 456</div>
    <div>TIN: 0048291042</div>
  </div>
  <div class="divider"></div>
  <div><span class="bold">Receipt #:</span> ${invoice.id}</div>
  <div><span class="bold">Date:</span> ${new Date().toLocaleDateString('en-ET')} ${new Date().toLocaleTimeString()}</div>
  <div><span class="bold">Patient:</span> ${patient.name} (${patient.id})</div>
  <div><span class="bold">Cashier:</span> ${user?.name || 'Reception'}</div>
  <div class="divider"></div>
  <div class="bold">PROCEDURE / SERVICE:</div>
  <div class="row">
    <span>${invoice.treatment}</span>
    <span>ETB ${invoice.total.toLocaleString()}</span>
  </div>
  <div class="divider"></div>
  <div class="row">
    <span>Total Due:</span>
    <span class="bold">ETB ${invoice.total.toLocaleString()}</span>
  </div>
  <div class="row">
    <span>Amount Tendered (${method}):</span>
    <span class="bold">ETB ${paidAmount.toLocaleString()}</span>
  </div>
  ${
    method === 'Cash' && changeDue > 0
      ? `<div class="row"><span>Change Given:</span><span>ETB ${changeDue.toLocaleString()}</span></div>`
      : ''
  }
  ${ref ? `<div><span class="bold">Ref / Trans ID:</span> ${ref}</div>` : ''}
  <div class="divider"></div>
  <div class="center" style="margin-top: 12px;">
    <div>*** OFFICIAL RECEIPT ***</div>
    <div>Thank you for choosing Lewi Dental!</div>
    <div>Get well soon!</div>
  </div>
</body>
</html>`

    const w = window.open('', '_blank', 'width=420,height=600')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 250)
    }
    notify(`Receipt for ${invoice.id} opened for printing.`)
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
        <h1 className="text-2xl font-bold text-slate-800">Cashier Settlement & Payment</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Clock className="h-3.5 w-3.5" />
          Active Cashier Desk
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {/* Payment Form */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Select Payment Instrument</h2>
            <p className="text-xs text-slate-500">
              Support Telebirr wallet, CBE direct transfer, physical Cash, or Card.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3.5 text-center transition-all ${
                  method === m.id
                    ? 'border-[#2563EB] bg-blue-50/80 text-[#2563EB] ring-2 ring-[#2563EB] shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                }`}
              >
                <m.icon className="h-6 w-6" />
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px] text-slate-400 leading-none">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Amount to Pay */}
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Amount to Collect (ETB)</span>
              <div className="flex overflow-hidden rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFull(true)
                    setAmount(remaining.toFixed(2))
                    setCashTendered(remaining.toFixed(2))
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    full ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Full ({etb(remaining)})
                </button>
                <button
                  type="button"
                  onClick={() => setFull(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !full ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Partial Split
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                ETB
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setCashTendered(e.target.value)
                  setFull(false)
                }}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-14 pr-3 text-xl font-bold text-slate-800 outline-none focus:border-[#2563EB]"
              />
            </div>
          </label>

          {/* If Cash Payment: Tendered & Change Due */}
          {method === 'Cash' && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Cash Register Calculator
                </span>
                <span className="text-xs text-emerald-700">Records to daily drawer</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-700">
                    Cash Tendered by Patient
                  </span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                  />
                </label>
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-700">Change Due</span>
                  <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700">
                    {etb(changeDue)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference & Date Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">
                {method === 'Telebirr'
                  ? 'Telebirr Transaction Code'
                  : method === 'Bank'
                  ? 'CBE Reference / Slip #'
                  : 'Reference Code (Optional)'}
              </span>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder={
                  method === 'Telebirr'
                    ? 'e.g. TL-9821-4412'
                    : method === 'Bank'
                    ? 'e.g. CBE-TX-98421'
                    : 'Transaction ref...'
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Date Received</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Cashier Note / Audit Trail
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Telebirr SMS confirmed on desk phone..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>

        {/* Invoice Summary Card */}
        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Invoice Reference
              </div>
              <div className="font-bold text-slate-800 text-lg">{invoice.id}</div>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
              {invoice.status}
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <span className="text-slate-400">Patient:</span>{' '}
              <span className="font-bold text-slate-800">{patient.name}</span>
            </li>
            <li>
              <span className="text-slate-400">ID:</span>{' '}
              <span className="font-semibold text-slate-700">{patient.id}</span>
            </li>
            <li>
              <span className="text-slate-400">Procedure:</span>{' '}
              <span className="font-semibold text-slate-800">{invoice.treatment}</span>
            </li>
            <li>
              <span className="text-slate-400">Date of Service:</span> {invoice.date}
            </li>
          </ul>

          <div className="my-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Procedure Total:</span>
              <span className="font-semibold text-slate-800">{etb(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Paid:</span>
              <span className="text-slate-700">{etb(invoice.paid)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-3.5">
            <div className="text-xs font-medium text-blue-700">Remaining Balance Due</div>
            <div className="text-2xl font-bold text-[#1D4ED8]">{etb(remaining)}</div>
          </div>

          {done ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Payment Cleared to Clinic Ledger!
              </div>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                <Printer className="h-4 w-4" />
                Print Official Receipt
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting || Number(amount) <= 0}
                onClick={handleProcessPayment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {submitting ? 'Recording Payment...' : `Collect ${etb(Number(amount) || 0)}`}
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Preview Receipt
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
