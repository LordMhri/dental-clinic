import { Fragment, useMemo, useState } from 'react'
import {
  Calendar,
  Pencil,
  Plus,
  X,
  AlertTriangle,
  Armchair,
} from 'lucide-react'
import { staff } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'
import type { AppointmentStatus } from '../types'

const days = [
  { key: '2026-08-10', label: 'Mon 10' },
  { key: '2026-08-11', label: 'Tue 11' },
  { key: '2026-08-12', label: 'Wed 12' },
  { key: '2026-08-13', label: 'Thu 13' },
  { key: '2026-08-14', label: 'Fri 14' },
  { key: '2026-08-15', label: 'Sat 15' },
  { key: '2026-08-16', label: 'Sun 16' },
]

const CLINIC_HOURS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
]

const OPERATORIES = [
  {
    id: 'op-1',
    name: 'Chair 1 (Operatory A)',
    type: 'General Dentistry',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'op-2',
    name: 'Chair 2 (Operatory B)',
    type: 'Oral Surgery & Implants',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'op-3',
    name: 'Hygiene Bay',
    type: 'Prophylaxis & Scaling',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
]

export function Appointments() {
  const {
    appointments,
    patients,
    setBookOpen,
    updateAppointmentStatus,
    rescheduleAppointment,
    notify,
  } = useClinic()

  const [view, setView] = useState<'Chairs' | 'Day' | 'Week' | 'Month'>('Chairs')
  const [dentist, setDentist] = useState('All Dentists')
  const [status, setStatus] = useState('All Statuses')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusDate, setFocusDate] = useState('2026-08-12')
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [newDate, setNewDate] = useState('2026-08-13')
  const [newTime, setNewTime] = useState('10:00 AM')

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = staff.find((s) => s.id === a.dentistId)
      const okD = dentist === 'All Dentists' || d?.name === dentist
      const okS = status === 'All Statuses' || a.status === status
      return okD && okS
    })
  }, [appointments, dentist, status])

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0]
  const selPatient = patients.find((p) => p.id === selected?.patientId)
  const selDentist = staff.find((s) => s.id === selected?.dentistId)
  const todayAppointments = filtered.filter((a) => a.date === focusDate)
  const visibleDays = view === 'Day' ? days.filter((d) => d.key === focusDate) : days
  const monthList = filtered.filter((a) => a.date.startsWith('2026-08'))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operatory Chair & Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">
            Multi-chair dental scheduling, conflict prevention, and daily clinic throughput.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm shadow-sm">
            {(['Chairs', 'Day', 'Week', 'Month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  view === v ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v === 'Chairs' ? '💺 Operatory Chairs' : v}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            <Plus className="h-4 w-4" />
            Book Chair
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-slate-500">Date:</span>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={focusDate}
            onChange={(e) => setFocusDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB]"
          />
        </div>

        <span className="font-medium text-slate-500 ml-2">Dentist:</span>
        <select
          value={dentist}
          onChange={(e) => setDentist(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option>All Dentists</option>
          {staff
            .filter((s) => s.role === 'dentist' || s.role === 'admin')
            .map((s) => (
              <option key={s.id}>{s.name}</option>
            ))}
        </select>

        <span className="font-medium text-slate-500 ml-2">Status:</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option>All Statuses</option>
          <option>Scheduled</option>
          <option>Confirmed</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Delayed</option>
          <option>Cancelled</option>
        </select>
      </div>

      {/* Main Schedule Content Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:col-span-2">
          {/* VIEW 1: OPERATORY CHAIRS VIEW */}
          {view === 'Chairs' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OPERATORIES.map((op) => {
                  const chairAppts = todayAppointments.filter(
                    (a) => (a.operatoryId || 'op-1') === op.id
                  )
                  return (
                    <div
                      key={op.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="mb-3 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Armchair className="h-4 w-4 text-[#2563EB]" />
                          {op.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{op.type}</div>
                        <div className="mt-1 text-[11px] font-semibold text-slate-600">
                          {chairAppts.length} {chairAppts.length === 1 ? 'patient' : 'patients'} scheduled
                        </div>
                      </div>

                      {/* Appointments in this Chair */}
                      <div className="space-y-2 flex-1">
                        {chairAppts.length === 0 ? (
                          <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                            No appointments booked for this chair on {focusDate}.
                          </div>
                        ) : (
                          chairAppts.map((a) => {
                            const p = patients.find((x) => x.id === a.patientId)
                            const d = staff.find((x) => x.id === a.dentistId)
                            const isSelected = selected?.id === a.id
                            return (
                              <div
                                key={a.id}
                                onClick={() => setSelectedId(a.id)}
                                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                                  isSelected
                                    ? 'border-[#2563EB] bg-blue-50 shadow-sm ring-1 ring-[#2563EB]'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">
                                    {a.time} - {a.endTime}
                                  </span>
                                  <Badge status={a.status} />
                                </div>
                                <div className="mt-1 font-bold text-slate-900">{p?.name}</div>
                                <div className="text-xs text-slate-600">{a.treatment}</div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                  <span>{d?.name.split(' ')[1] || 'Dentist'}</span>
                                  {a.emergency && (
                                    <span className="font-bold text-rose-600">EMERGENCY</span>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: DAY & WEEK CALENDAR */}
          {(view === 'Day' || view === 'Week') && (
            <div
              className={`grid min-w-[720px] text-xs ${
                view === 'Day' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,1fr)]'
              }`}
            >
              <div className="py-2 font-medium text-slate-400">Time</div>
              {visibleDays.map((d) => (
                <div
                  key={d.key}
                  className={`py-2 text-center font-semibold ${
                    d.key === focusDate ? 'text-[#2563EB]' : 'text-slate-600'
                  }`}
                >
                  {d.label}
                </div>
              ))}
              {CLINIC_HOURS.map((h) => (
                <Fragment key={h}>
                  <div className="border-t border-slate-100 py-3 text-slate-400 font-medium">
                    {h}
                  </div>
                  {visibleDays.map((d) => {
                    const hit = filtered.find((a) => a.date === d.key && a.time === h)
                    const p = patients.find((x) => x.id === hit?.patientId)
                    return (
                      <button
                        key={`${d.key}-${h}`}
                        type="button"
                        onClick={() => hit && setSelectedId(hit.id)}
                        className="min-h-[72px] border-t border-l border-slate-100 p-1 text-left"
                      >
                        {hit && (
                          <div
                            className={`h-full rounded-lg p-2 text-[11px] ${
                              hit.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800'
                                : selected?.id === hit.id
                                ? 'border border-blue-200 bg-blue-50 text-blue-800'
                                : 'bg-sky-50 text-sky-800'
                            }`}
                          >
                            <div className="font-semibold">{p?.name.split(' ')[0]}</div>
                            <div className="truncate">{hit.treatment}</div>
                            <Badge status={hit.status} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          )}

          {/* VIEW 3: MONTH LIST */}
          {view === 'Month' && (
            <ul className="space-y-2">
              {monthList.map((a) => {
                const p = patients.find((x) => x.id === a.patientId)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                        selected?.id === a.id ? 'border-[#2563EB] bg-blue-50' : 'border-slate-100'
                      }`}
                    >
                      <span className="font-medium text-slate-800">{p?.name}</span>
                      <span className="text-slate-500">
                        {a.date} · {a.time}
                      </span>
                      <Badge status={a.status} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Selected Appointment Details Drawer */}
        {selected && selPatient ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-800">Appointment Details</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(selected.date)
                    setNewTime(selected.time)
                    setRescheduleOpen(true)
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label="Reschedule appointment"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Avatar initials={selPatient.initials} size="lg" />
              <div>
                <div className="font-bold text-slate-800 text-base">{selPatient.name}</div>
                <div className="text-xs text-slate-500">
                  {selPatient.id} · {selPatient.phone}
                </div>
              </div>
            </div>

            {selPatient.allergy && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                Medical Alert: {selPatient.allergy}
              </div>
            )}

            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-800">
                  {selected.date} · {selected.time} - {selected.endTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dentist:</span>
                <span className="font-semibold text-slate-800">{selDentist?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Operatory Chair:</span>
                <span className="font-semibold text-[#2563EB]">
                  {OPERATORIES.find((o) => o.id === selected.operatoryId)?.name || 'Chair 1'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Procedure:</span>
                <span className="font-semibold text-slate-800">{selected.treatment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge status={selected.status} />
              </div>
            </div>

            {/* Status Update Quick Buttons */}
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">Update Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'Confirmed',
                    'In Progress',
                    'Completed',
                    'Delayed',
                    'Cancelled',
                  ] as AppointmentStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      updateAppointmentStatus(selected.id, st)
                      notify(`Appointment updated to ${st}.`)
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selected.status === st
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            Select an appointment to inspect chair assignment and update status.
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleOpen && selected && (
        <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)}>
          <ModalHeader
            title="Reschedule Appointment"
            subtitle={`Moving appointment for ${selPatient?.name}`}
            onClose={() => setRescheduleOpen(false)}
          />
          <div className="space-y-3 px-6 py-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">New Date</span>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">New Time</span>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {CLINIC_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  rescheduleAppointment(selected.id, newDate, newTime)
                  notify(`Rescheduled to ${newDate} at ${newTime}.`)
                  setRescheduleOpen(false)
                }}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
