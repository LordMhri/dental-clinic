import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Play, Stethoscope, Users } from 'lucide-react'
import { staff } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { greeting } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'

export function DentistDashboard() {
  const { user, appointments, patients } = useClinic()
  const navigate = useNavigate()
  const mine = appointments.filter(
    (a) => a.date === '2026-08-12' && (a.dentistId === user?.id || user?.role === 'admin'),
  )
  const next = mine.find((a) => a.status === 'Confirmed' || a.status === 'Scheduled' || a.status === 'In Progress') ?? mine[0]
  const np = patients.find((p) => p.id === next?.patientId)
  const first = user?.name.replace('Dr. ', '').split(' ')[0] ?? 'Eyuel'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{greeting(`Dr. ${first}`).replace('!', '.')}</h1>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Next Appointment ({next?.time ?? '—'})
          </div>
          {np && next && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <Avatar initials={np.initials} size="lg" />
                <div>
                  <div className="text-lg font-bold text-slate-800">{np.name}</div>
                  <div className="text-sm text-slate-500">
                    {np.age} yrs · {np.gender === 'F' ? 'Female' : 'Male'} · ID: {np.id}
                  </div>
                </div>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="text-xs text-slate-400">Reason for Visit</div>
                  <div className="font-medium text-slate-800">{next.treatment}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="text-xs text-slate-400">Last Treatment</div>
                  <div className="font-medium text-slate-800">Routine Cleaning (Jul 12)</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/treatments')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Play className="h-4 w-4" />
                  Start Session
                </button>
                <button
                  type="button"
                  onClick={() => np && navigate(`/patients/${np.id}`)}
                  className="rounded-xl border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#2563EB]"
                >
                  View Full Profile
                </button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Today's Clinical Stats</h2>
          <div className="space-y-3">
            <StatRow icon={<Users className="h-4 w-4 text-blue-600" />} bg="bg-blue-50" label="Patients Seen" value="8" />
            <StatRow icon={<Stethoscope className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" label="Procedures" value="5" />
            <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Pending Plans</div>
                  <div className="text-xl font-bold text-slate-800">3</div>
                </div>
              </div>
              <Link to="/treatments" className="text-xs font-semibold text-[#2563EB]">
                Review
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Today's Schedule</h2>
            <span className="text-sm text-slate-400">Aug 12, 2026</span>
          </div>
          <ul className="space-y-2">
            {mine.map((a) => {
              const p = patients.find((x) => x.id === a.patientId)
              const current = a.id === next?.id
              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-4 rounded-xl border px-3 py-3 ${current ? 'border-[#2563EB] bg-blue-50' : 'border-slate-100'}`}
                >
                  <div className="w-24 text-sm font-semibold text-slate-700">{a.time}</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{p?.name}</div>
                    <div className="text-xs text-slate-500">{a.treatment}</div>
                  </div>
                  <Badge status={a.status} />
                  {current && (
                    <button type="button" onClick={() => navigate('/treatments')} className="text-xs font-semibold text-[#2563EB]">
                      View Record
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/patients" className="flex gap-3 rounded-xl p-2 hover:bg-slate-50">
              <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">View My Patients</div>
                <div className="text-xs text-slate-500">Access full patient directory.</div>
              </div>
            </Link>
            <Link to="/treatments" className="flex gap-3 rounded-xl p-2 hover:bg-slate-50">
              <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Record Treatment</div>
                <div className="text-xs text-slate-500">Log new procedure notes.</div>
              </div>
            </Link>
            <Link to="/appointments" className="flex gap-3 rounded-xl p-2 hover:bg-slate-50">
              <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">View Treatment History</div>
                <div className="text-xs text-slate-500">Review past clinic logs.</div>
              </div>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">Covering for {staff.find((s) => s.id === 'st-2')?.name} this week.</p>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  icon,
  bg,
  label,
  value,
}: {
  icon: ReactNode
  bg: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-bold text-slate-800">{value}</div>
      </div>
    </div>
  )
}
