import { useMemo, useState } from 'react'
import { Calendar, Clock, PlusSquare, Search, Stethoscope } from 'lucide-react'
import { staff, timeSlots, treatmentsCatalog } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Modal, ModalHeader } from './ui/Modal'

const dentists = staff.filter((s) => s.role === 'dentist' || s.role === 'admin')

export function BookAppointmentModal() {
  const { bookOpen, setBookOpen, patients, bookAppointment, notify } = useClinic()
  const [query, setQuery] = useState('')
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState('2026-08-12')
  const [dentistId, setDentistId] = useState('')
  const [time, setTime] = useState('')
  const [treatment, setTreatment] = useState('')
  const [emergency, setEmergency] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const matches = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return patients.slice(0, 5)
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [patients, query])

  function reset() {
    setQuery('')
    setPatientId('')
    setDentistId('')
    setTime('')
    setTreatment('')
    setEmergency(false)
    setNotes('')
    setError('')
  }

  function submit() {
    if (!patientId || !date || !dentistId || !time || !treatment) {
      setError('Please complete patient, date, dentist, time, and treatment.')
      return
    }
    bookAppointment({ patientId, dentistId, date, time, treatment, notes, emergency })
    notify('Appointment booked.')
    reset()
    setBookOpen(false)
  }

  return (
    <Modal open={bookOpen} onClose={() => setBookOpen(false)}>
      <ModalHeader
        title="Book Appointment"
        subtitle="Schedule a new visit for Lewi Dental Clinic"
        onClose={() => setBookOpen(false)}
      />
      <div className="space-y-4 px-6 py-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Patient</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPatientId('')
              }}
              placeholder="Search patient by name or ID..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
            />
          </div>
          <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-100">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPatientId(p.id)
                  setQuery(`${p.name} (${p.id})`)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${patientId === p.id ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-700'}`}
              >
                <span>{p.name}</span>
                <span className="text-xs text-slate-400">{p.id}</span>
              </button>
            ))}
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Date</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Dentist</span>
            <div className="relative">
              <PlusSquare className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
              >
                <option value="">Select provider</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Time</span>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
              >
                <option value="">Select time</option>
                {timeSlots.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Treatment Type</span>
            <div className="relative">
              <Stethoscope className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
              >
                <option value="">Select treatment</option>
                {treatmentsCatalog.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Estimated Duration</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
              <Clock className="h-3 w-3" />
              {emergency ? '30 mins' : '45 mins'}
            </span>
          </div>
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => setEmergency(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#2563EB]"
            />
            Mark as Emergency Appointment
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Clinical Notes (Optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any specific patient requests or clinical notes here..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={() => setBookOpen(false)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
        >
          Submit Appointment
        </button>
      </div>
    </Modal>
  )
}
