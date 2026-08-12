import { useMemo, useState, type ReactNode } from 'react'
import { Calendar, Download, Plus, Search, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useClinic } from '../context/ClinicContext'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal, ModalHeader } from '../components/ui/Modal'
import { ActionMenu } from '../components/ui/ActionMenu'
import type { Patient, PatientStatus } from '../types'

export function Patients() {
  const { patients, addPatient, setBookOpen, invoices, notify } = useClinic()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState('All Statuses')
  const [range, setRange] = useState<'30' | '90' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const match =
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q.toLowerCase())
      const st = status === 'All Statuses' || p.status === status
      const recent = range === 'all' || p.lastVisit.includes('2026')
      return match && st && recent
    })
  }, [patients, q, status, range])

  const per = 8
  const slice = filtered.slice((page - 1) * per, page * per)
  const pages = Math.max(1, Math.ceil(filtered.length / per))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage patient records, history, and current status.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
        >
          <Plus className="h-4 w-4" />
          Register New Patient
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Users className="h-5 w-5 text-blue-600" />} bg="bg-blue-50" label="Total Patients" value="1,240" tag="+12%" tagColor="bg-blue-50 text-blue-700" />
        <Stat icon={<UserPlus className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" label="New This Month" value="45" tag="+5" tagColor="bg-emerald-50 text-emerald-700" />
        <Stat icon={<ShieldCheck className="h-5 w-5 text-blue-600" />} bg="bg-blue-50" label="Active Patients" value="890" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Search Name, Phone, ID..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Follow-up Due</option>
            <option>Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => {
              const next = range === 'all' ? '30' : range === '30' ? '90' : 'all'
              setRange(next)
              setPage(1)
              notify(next === 'all' ? 'Showing all patients.' : `Filtered to last ${next} days.`)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            <Calendar className="h-4 w-4" />
            {range === 'all' ? 'All time' : `Last ${range} Days`}
          </button>
          <button
            type="button"
            onClick={() => {
              const rows = [
                ['ID', 'Name', 'Phone', 'Email', 'Age', 'Gender', 'Last Visit', 'Status'],
                ...filtered.map((p) => [p.id, p.name, p.phone, p.email, String(p.age), p.gender, p.lastVisit, p.status]),
              ]
              const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'lewi-patients.csv'
              a.click()
              URL.revokeObjectURL(url)
              notify(`Exported ${filtered.length} patients to CSV.`)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            <Download className="h-4 w-4" />
            Export CSV/PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="py-3 font-medium">ID</th>
                <th className="py-3 font-medium">Patient Info</th>
                <th className="py-3 font-medium">Contact</th>
                <th className="py-3 font-medium">Age/Gender</th>
                <th className="py-3 font-medium">Last Visit</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-500">#{p.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={p.initials} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-800">
                          <button type="button" className="hover:text-[#2563EB]" onClick={() => navigate(`/patients/${p.id}`)}>
                            {p.name}
                          </button>
                        </div>
                        <div className="text-xs text-slate-400">Reg: {p.registered}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="text-slate-700">{p.phone}</div>
                    <div className="text-xs text-slate-400">{p.email}</div>
                  </td>
                  <td className="py-3 text-slate-600">
                    {p.age} / {p.gender}
                  </td>
                  <td className="py-3 text-slate-600">{p.lastVisit}</td>
                  <td className="py-3">
                    <Badge status={p.status} dot />
                  </td>
                  <td className="py-3">
                    <ActionMenu
                      items={[
                        {
                          label: 'Open record',
                          onClick: () => navigate(`/patients/${p.id}`),
                        },
                        {
                          label: 'Record treatment',
                          onClick: () => navigate(`/treatments?patient=${p.id}`),
                        },
                        {
                          label: 'Book appointment',
                          onClick: () => setBookOpen(true),
                        },
                        {
                          label: invoices.find((i) => i.patientId === p.id && i.status !== 'Paid')
                            ? 'Process payment'
                            : 'View billing',
                          onClick: () => {
                            const inv = invoices.find((i) => i.patientId === p.id && i.status !== 'Paid')
                            navigate(inv ? `/billing/pay/${inv.id}` : '/billing')
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {(page - 1) * per + 1} to {Math.min(page * per, filtered.length)} of {filtered.length} patients
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-lg text-sm font-medium ${n === page ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <RegisterModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(p) => {
          addPatient(p)
          setOpen(false)
          notify(`${p.name} registered.`)
        }}
      />
    </div>
  )
}

function Stat({
  icon,
  bg,
  label,
  value,
  tag,
  tagColor,
}: {
  icon: ReactNode
  bg: string
  label: string
  value: string
  tag?: string
  tagColor?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${bg}`}>{icon}</div>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
        </div>
      </div>
      {tag && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagColor}`}>{tag}</span>}
    </div>
  )
}

function RegisterModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (p: Patient) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+251 ')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('30')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [status, setStatus] = useState<PatientStatus>('Active')

  function save() {
    if (!name.trim()) return
    const parts = name.trim().split(' ')
    const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    onSave({
      id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      initials,
      gender,
      age: Number(age) || 30,
      phone,
      email,
      registered: 'Aug 12, 2026',
      lastVisit: '—',
      status,
    })
    setName('')
    setEmail('')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Register New Patient" subtitle="Add a record for Lewi Dental Clinic" onClose={onClose} />
      <div className="grid grid-cols-2 gap-3 px-6 py-5">
        <label className="col-span-2 block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abeba Kebede" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Age</span>
          <input value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Gender</span>
          <select value={gender} onChange={(e) => setGender(e.target.value as 'M' | 'F')} className="w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
        </label>
        <label className="col-span-2 block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as PatientStatus)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
            <option>Active</option>
            <option>Follow-up Due</option>
            <option>Inactive</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
          Cancel
        </button>
        <button type="button" onClick={save} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
          Save Patient
        </button>
      </div>
    </Modal>
  )
}
