import type { AppointmentStatus, InvoiceStatus, PatientStatus, StockMoveType } from '../../types'

const map: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  'Follow-up Due': 'bg-amber-50 text-amber-700',
  Inactive: 'bg-rose-50 text-rose-700',
  Scheduled: 'bg-sky-50 text-sky-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  'Checked-in': 'bg-teal-50 text-teal-700',
  'In Progress': 'bg-indigo-50 text-indigo-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Delayed: 'bg-rose-50 text-rose-700',
  'No-Show': 'bg-rose-50 text-rose-600',
  Cancelled: 'bg-slate-100 text-slate-500',
  Paid: 'bg-emerald-50 text-emerald-700',
  Unpaid: 'bg-rose-50 text-rose-700',
  Partial: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-rose-100 text-rose-800',
  Restock: 'bg-blue-50 text-blue-700',
  Dispensed: 'bg-slate-100 text-slate-600',
  Disposed: 'bg-rose-50 text-rose-700',
}

const dots: Record<string, string> = {
  Active: 'bg-emerald-500',
  'Follow-up Due': 'bg-amber-500',
  Inactive: 'bg-rose-500',
}

export function Badge({
  status,
  dot,
}: {
  status: PatientStatus | AppointmentStatus | InvoiceStatus | StockMoveType | string
  dot?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[status] ?? 'bg-slate-400'}`} />}
      {status}
    </span>
  )
}
