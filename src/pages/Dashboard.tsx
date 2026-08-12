import type { ReactNode } from 'react'
import {
  CalendarDays,
  ClipboardList,
  Pencil,
  Users,
  Wallet,
  Clock,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { activities, inventory, staff } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { etb, greeting } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { DonutChart } from '../components/ui/DonutChart'

export function Dashboard() {
  const { user, appointments, patients, setBookOpen } = useClinic()
  const navigate = useNavigate()
  const todayAppts = appointments.filter((a) => a.date === '2026-08-12')
  const firstName = user?.name.replace('Dr. ', '').split(' ')[0] ?? 'Doctor'

  const lowStock = inventory.filter((i) => i.qty <= i.minQty)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting(`Dr. ${firstName}`)}</h1>
          <p className="mt-1 text-sm text-slate-500">Here is what's happening at the clinic today.</p>
        </div>
        <button
          type="button"
          onClick={() => setBookOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
        >
          <Clock className="h-4 w-4" />
          Quick Schedule
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<Users className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Total Patients"
          value="1,240"
          trend="+5%"
        />
        <Kpi
          icon={<CalendarDays className="h-5 w-5 text-indigo-600" />}
          bg="bg-indigo-50"
          label="Today's Appointments"
          value={String(todayAppts.length)}
          trend="+12%"
        />
        <Kpi
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Revenue Today"
          value="ETB 15,400"
          trend="+8%"
        />
        <Kpi
          icon={<ClipboardList className="h-5 w-5 text-rose-600" />}
          bg="bg-rose-50"
          label="Pending Payments"
          value="ETB 4,200"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Revenue by Method</h2>
            <span className="text-xs text-slate-400">Today · no charts</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Cash', amount: 4100, count: '12 txns', color: 'bg-emerald-500' },
              { label: 'Bank Transfer', amount: 6200, count: '5 txns', color: 'bg-blue-500' },
              { label: 'Telebirr', amount: 2400, count: '8 txns', color: 'bg-sky-500' },
              { label: 'Card', amount: 2700, count: '4 txns', color: 'bg-indigo-500' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{m.label}</span>
                  <span>{m.count}</span>
                </div>
                <div className="mt-1 text-lg font-bold text-slate-800">{etb(m.amount)}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${m.color}`} style={{ width: `${(m.amount / 15400) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800">Appointments</h2>
          <DonutChart
            total={28}
            segments={[
              { label: 'Scheduled', value: 55, color: '#1D4ED8' },
              { label: 'Completed', value: 25, color: '#14B8A6' },
              { label: 'No-Show', value: 15, color: '#FDBA74' },
              { label: 'Cancelled', value: 5, color: '#FBCFE8' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Today's Appointments</h2>
            <Link to="/appointments" className="text-sm font-medium text-[#2563EB]">
              View All
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Dentist</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayAppts.slice(0, 5).map((a) => {
                const p = patients.find((x) => x.id === a.patientId)
                const d = staff.find((x) => x.id === a.dentistId)
                return (
                  <tr key={a.id}>
                    <td className="py-3 font-medium text-slate-700">{a.time}</td>
                    <td className="py-3 text-slate-800">{p?.name}</td>
                    <td className="py-3 text-slate-600">{d?.name}</td>
                    <td className="py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => navigate('/appointments')}
                        className="rounded-lg p-1.5 text-[#2563EB] hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Recent Activity</h2>
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      a.tone === 'green' ? 'bg-emerald-500' : a.tone === 'purple' ? 'bg-violet-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <h2 className="mb-3 font-semibold text-rose-800">Low Stock Alerts</h2>
            <ul className="space-y-2 text-sm text-rose-800">
              {lowStock.slice(0, 3).map((i) => (
                <li key={i.id}>
                  {i.name} — {i.qty} {i.unit} left
                </li>
              ))}
            </ul>
            <Link to="/inventory" className="mt-3 inline-block text-sm font-semibold text-[#2563EB]">
              Order Supplies
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Role dashboards:{' '}
            <Link to="/dentist" className="font-medium text-[#2563EB]">
              Dentist
            </Link>
            {' · '}
            <Link to="/reception" className="font-medium text-[#2563EB]">
              Reception
            </Link>
            {' · '}
            <Link to="/cashier" className="font-medium text-[#2563EB]">
              Cashier
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  bg,
  label,
  value,
  trend,
}: {
  icon: ReactNode
  bg: string
  label: string
  value: string
  trend?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${bg}`}>{icon}</div>
        {trend && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {trend}
          </span>
        )}
      </div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}
