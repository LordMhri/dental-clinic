import { Fragment, useMemo, useState } from 'react'
import { Calendar, Pencil, Plus, X } from 'lucide-react'
import { staff, timeSlots } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'

const days = [
  { key: '2026-08-10', label: 'Mon 10' },
  { key: '2026-08-11', label: 'Tue 11' },
  { key: '2026-08-12', label: 'Wed 12' },
  { key: '2026-08-13', label: 'Thu 13' },
  { key: '2026-08-14', label: 'Fri 14' },
  { key: '2026-08-15', label: 'Sat 15' },
  { key: '2026-08-16', label: 'Sun 16' },
]
const hours = ['09:00 AM', '10:00 AM', '11:00 AM']

export function Appointments() {
  const { appointments, patients, setBookOpen, updateAppointmentStatus, rescheduleAppointment, notify } = useClinic()
  const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Week')
  const [dentist, setDentist] = useState('All Dentists')
  const [status, setStatus] = useState('All Statuses')
  const [selectedId, setSelectedId] = useState<string | null>('ap-3')
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
  const today = filtered.filter((a) => a.date === focusDate)
  const visibleDays = view === 'Day' ? days.filter((d) => d.key === focusDate) : days
  const monthList = filtered.filter((a) => a.date.startsWith('2026-08'))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Management</h1>
          <p className="mt-1 text-sm text-slate-500">August 10 — August 16, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
            {(['Day', 'Week', 'Month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 font-medium ${view === v ? 'bg-[#2563EB] text-white' : 'text-slate-600'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Book New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-slate-500">Filters:</span>
        <select value={dentist} onChange={(e) => setDentist(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2">
          <option>All Dentists</option>
          {staff.filter((s) => s.role === 'dentist' || s.role === 'admin').map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2">
          <option>All Statuses</option>
          <option>Scheduled</option>
          <option>Confirmed</option>
          <option>Completed</option>
          <option>Delayed</option>
        </select>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={focusDate}
            onChange={(e) => setFocusDate(e.target.value)}
            className="rounded-lg border border-slate-200 py-2 pl-9 pr-3"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:col-span-2">
          {view === 'Month' ? (
            <ul className="space-y-2">
              {monthList.map((a) => {
                const p = patients.find((x) => x.id === a.patientId)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${selected?.id === a.id ? 'border-[#2563EB] bg-blue-50' : 'border-slate-100'}`}
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
          ) : (
          <div className={`grid min-w-[720px] text-xs ${view === 'Day' ? 'grid-cols-[72px_1fr]' : 'grid-cols-[72px_repeat(7,1fr)]'}`}>
            <div className="py-2 font-medium text-slate-400">Time</div>
            {visibleDays.map((d) => (
              <div key={d.key} className={`py-2 text-center font-semibold ${d.key === focusDate ? 'text-[#2563EB]' : 'text-slate-600'}`}>
                {d.label}
              </div>
            ))}
            {hours.map((h) => (
              <Fragment key={h}>
                <div className="border-t border-slate-100 py-3 text-slate-400">
                  {h.replace(' AM', '')}
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
                          <Badge status={hit.status === 'Completed' ? 'Completed' : 'Confirmed'} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
          )}
        </div>

        {selected && selPatient && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Appointment Details</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!selected) return
                    setNewDate(selected.date)
                    setNewTime(selected.time)
                    setRescheduleOpen(true)
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label="Edit appointment"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <Avatar initials={selPatient.initials} />
              <div>
                <div className="font-semibold text-slate-800">{selPatient.name}</div>
                <div className="text-xs text-slate-400">{selPatient.id}</div>
              </div>
              <Badge status={selected.status} />
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                {selected.date === '2026-08-12' ? 'Wednesday, Aug 12' : selected.date} · {selected.time} – {selected.endTime} ({selected.durationMins} mins)
              </li>
              <li>
                {selected.treatment}
                {selected.tooth ? ` · ${selected.tooth}` : ''}
              </li>
              <li>
                {selDentist?.name} · {selDentist?.title}
              </li>
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!selected) return
                  setNewDate(selected.date)
                  setNewTime(selected.time)
                  setRescheduleOpen(true)
                }}
                className="rounded-lg border border-[#2563EB] py-2 text-sm font-semibold text-[#2563EB]"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAppointmentStatus(selected.id, 'Checked-in')
                  notify(`${selPatient.name} checked in.`)
                }}
                className="rounded-lg bg-[#2563EB] py-2 text-sm font-semibold text-white"
              >
                Check-In
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Today's Summary</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Patient</th>
              <th className="pb-3 font-medium">Treatment</th>
              <th className="pb-3 font-medium">Dentist</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {today.map((a) => {
              const p = patients.find((x) => x.id === a.patientId)
              const d = staff.find((x) => x.id === a.dentistId)
              return (
                <tr key={a.id}>
                  <td className="py-3 text-slate-700">{a.time}</td>
                  <td className="py-3 font-medium text-slate-800">{p?.name}</td>
                  <td className="py-3 text-slate-600">{a.treatment}</td>
                  <td className="py-3 text-slate-600">{d?.name}</td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)}>
        <ModalHeader title="Reschedule appointment" subtitle={selPatient?.name} onClose={() => setRescheduleOpen(false)} />
        <div className="grid grid-cols-2 gap-3 px-6 py-5">
          <label className="text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Date</span>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Time</span>
            <select value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
              {timeSlots.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setRescheduleOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (selected) {
                rescheduleAppointment(selected.id, newDate, newTime)
                notify(`Moved to ${newDate} at ${newTime}.`)
              }
              setRescheduleOpen(false)
            }}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Save new time
          </button>
        </div>
      </Modal>
    </div>
  )
}
