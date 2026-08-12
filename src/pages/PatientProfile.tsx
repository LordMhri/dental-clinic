import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  FileText,
  MapPin,
  Phone,
  Receipt,
  Stethoscope,
} from 'lucide-react'
import { treatments as historySeed } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'

export function PatientProfile() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { patients, appointments, invoices, updatePatient, setBookOpen, notify } = useClinic()
  const patient = patients.find((p) => p.id === patientId)

  const [notes, setNotes] = useState(patient?.notes ?? '')

  useEffect(() => {
    setNotes(patient?.notes ?? '')
  }, [patient?.id, patient?.notes])
  const history = historySeed.filter((t) => t.patientId === patientId)
  const visits = appointments.filter((a) => a.patientId === patientId)
  const bills = invoices.filter((i) => i.patientId === patientId)

  if (!patient) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => navigate('/patients')} className="text-sm font-medium text-[#2563EB]">
          ← Back to patients
        </button>
        <p className="text-slate-500">Patient not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate('/patients')}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar initials={patient.initials} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
            <p className="text-sm text-slate-500">
              {patient.id} · {patient.gender === 'F' ? 'Female' : 'Male'} · {patient.age} y/o
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              {patient.phone} · {patient.email}
            </p>
            {patient.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {patient.address}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge status={patient.status} dot />
              {patient.allergy && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-3 w-3" />
                  {patient.allergy}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <CalendarPlus className="h-4 w-4" />
            Book
          </button>
          <button
            type="button"
            onClick={() => navigate(`/treatments?patient=${patient.id}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <Stethoscope className="h-4 w-4" />
            Record treatment
          </button>
          <button
            type="button"
            onClick={() => {
              const inv = bills.find((i) => i.status !== 'Paid')
              navigate(inv ? `/billing/pay/${inv.id}` : '/billing')
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white"
          >
            <Receipt className="h-4 w-4" />
            Billing
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-[#2563EB]" />
            Clinical notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Chart notes, allergies, preferences..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                updatePatient(patient.id, { notes })
                notify('Notes saved to chart.')
              }}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
            >
              Save notes
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Treatment history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No procedures recorded yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-slate-200 pl-4">
              {history.map((r) => (
                <li key={r.id}>
                  <span className="absolute -left-1.5 mt-3 h-3 w-3 rounded-full bg-[#2563EB]" />
                  <button
                    type="button"
                    onClick={() => navigate(`/treatments?patient=${patient.id}&visit=${r.id}`)}
                    className="w-full rounded-xl p-2 text-left hover:bg-slate-50"
                  >
                    <div className="text-xs text-slate-400">{r.date}</div>
                    <div className="font-semibold text-slate-800">{r.procedure}</div>
                    <p className="text-sm text-slate-500">{r.notes}</p>
                    <p className="text-xs text-slate-400">{r.dentist}</p>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Visit history</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments on file.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium">Treatment</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 text-slate-600">
                      {a.date} · {a.time}
                    </td>
                    <td className="py-2 text-slate-800">{a.treatment}</td>
                    <td className="py-2">
                      <Badge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Invoices</h2>
          {bills.length === 0 ? (
            <p className="text-sm text-slate-500">No invoices yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">Invoice</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2">
                      <Link to={`/billing/pay/${inv.id}`} className="font-medium text-[#2563EB]">
                        {inv.id}
                      </Link>
                    </td>
                    <td className="py-2">{etb(inv.total)}</td>
                    <td className="py-2">
                      <Badge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
