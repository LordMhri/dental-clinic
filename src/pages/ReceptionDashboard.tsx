import type { ReactNode } from 'react'
import { CalendarPlus, ClipboardList, UserCheck, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useClinic } from '../context/ClinicContext'
import { greeting } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { ActionMenu } from '../components/ui/ActionMenu'

export function ReceptionDashboard() {
  const { appointments, patients, setBookOpen, updateAppointmentStatus, notify } = useClinic()
  const navigate = useNavigate()
  const today = appointments.filter((a) => a.date === '2026-08-12')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{greeting('Reception')}</h1>
        <p className="mt-1 text-sm text-slate-500">Here is the overview for today, August 12th.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Quick icon={<UserPlus className="h-5 w-5" />} label="Register New Patient" onClick={() => navigate('/patients')} />
        <Quick icon={<CalendarPlus className="h-5 w-5" />} label="Book Appointment" onClick={() => setBookOpen(true)} />
        <Quick
          icon={<UserCheck className="h-5 w-5" />}
          label="Check-in Patient"
          onClick={() => {
            const next = today.find((a) => a.status === 'Scheduled' || a.status === 'Confirmed')
            if (next) updateAppointmentStatus(next.id, 'Checked-in')
          }}
        />
        <Quick icon={<ClipboardList className="h-5 w-5" />} label="View Today's Schedule" onClick={() => navigate('/appointments')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Today's Appointment Schedule</h2>
            <button type="button" onClick={() => navigate('/appointments')} className="text-sm font-medium text-[#2563EB]">
              View All
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Treatment</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {today.map((a) => {
                const p = patients.find((x) => x.id === a.patientId)
                return (
                  <tr key={a.id}>
                    <td className="py-3 text-slate-700">{a.time}</td>
                    <td className="py-3 font-medium text-slate-800">{p?.name}</td>
                    <td className="py-3 text-slate-600">{a.treatment}</td>
                    <td className="py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="py-3">
                      <ActionMenu
                        items={[
                          {
                            label: 'Check in',
                            onClick: () => {
                              updateAppointmentStatus(a.id, 'Checked-in')
                              notify(`${p?.name ?? 'Patient'} checked in.`)
                            },
                          },
                          {
                            label: 'Open record',
                            onClick: () => p && navigate(`/patients/${p.id}`),
                          },
                          {
                            label: 'Reschedule',
                            onClick: () => navigate('/appointments'),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Today's Statistics</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <button type="button" className="flex w-full justify-between text-left" onClick={() => navigate('/appointments')}>
                  <span className="text-slate-500">Appointments Booked</span>
                  <span className="font-bold text-slate-800">24</span>
                </button>
              </li>
              <li>
                <button type="button" className="flex w-full justify-between text-left" onClick={() => navigate('/appointments')}>
                  <span className="text-slate-500">Patients Checked-in</span>
                  <span className="font-bold text-slate-800">18</span>
                </button>
              </li>
              <li>
                <button type="button" className="flex w-full justify-between text-left" onClick={() => navigate('/patients')}>
                  <span className="text-slate-500">New Registrations</span>
                  <span className="font-bold text-slate-800">3</span>
                </button>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Pending Follow-ups</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                4
              </span>
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  type="button"
                  className="w-full rounded-lg p-1 text-left hover:bg-slate-50"
                  onClick={() => {
                    notify('Call logged for Yohannes Haile.')
                    navigate('/patients/PT-9945')
                  }}
                >
                  <div className="font-semibold text-slate-800">Yohannes Haile</div>
                  <p className="text-slate-500">Post-extraction checkup call. Remind about meds.</p>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="w-full rounded-lg p-1 text-left hover:bg-slate-50"
                  onClick={() => {
                    notify('X-ray note queued for Selamawit Tekle.')
                    navigate('/patients/PT-20938')
                  }}
                >
                  <div className="font-semibold text-slate-800">Selamawit Tekle</div>
                  <p className="text-slate-500">Send X-ray results via patient portal.</p>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Quick({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm hover:border-blue-200"
    >
      <div className="rounded-xl bg-blue-50 p-2.5 text-[#2563EB]">{icon}</div>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </button>
  )
}
