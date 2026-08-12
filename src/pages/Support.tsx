import { useState } from 'react'
import { clinic } from '../data/mock'
import { useClinic } from '../context/ClinicContext'

export function Support() {
  const { notify } = useClinic()
  const [ticket, setTicket] = useState('')
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Support</h1>
        <p className="mt-1 text-sm text-slate-500">Help for Lewi Dental Clinic staff.</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">IT desk — YOM Tech Solution</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bole, Addis Ababa · Weekdays 8:00 AM – 8:00 PM EAT
        </p>
        <p className="mt-1 text-sm text-slate-600">support@yomtech.et · +251 11 662 4480</p>
        <div className="mt-4 flex gap-2">
          <a href="mailto:support@yomtech.et" className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white">
            Email IT desk
          </a>
          <a href="tel:+251116624480" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Call front desk
          </a>
        </div>
        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Open a ticket</span>
          <textarea
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            rows={3}
            placeholder="Describe the issue..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!ticket.trim()) {
              notify('Write a short description first.')
              return
            }
            notify('Ticket sent to YOM Tech Solution.')
            setTicket('')
          }}
          className="mt-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
        >
          Submit ticket
        </button>
      </div>
      <div className="space-y-3">
        {[
          ['How do I book an appointment?', 'Use + Book Appointment in the sidebar. Search the patient by name or ID, then pick dentist, time, and treatment.'],
          ['How do I take a payment?', 'Open Billing, then Process on an unpaid invoice. Amounts are in ETB. Telebirr, cash, bank, and card are supported.'],
          ['Demo logins?', 'eyuel, selamawit, hirut, yonas, salem, tigist — password clinic123 for all.'],
        ].map(([q, a]) => (
          <div key={q} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{q}</h3>
            <p className="mt-1 text-sm text-slate-600">{a}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">© 2026 {clinic.name} Clinic · Powered by {clinic.poweredBy}</p>
    </div>
  )
}
