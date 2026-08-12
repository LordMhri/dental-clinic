import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Clock, History, ListChecks, Search } from 'lucide-react'
import { treatments as historySeed, treatmentsCatalog } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Avatar } from '../components/ui/Avatar'
import type { Patient, TreatmentRecord } from '../types'

function toInputDate(label: string) {
  const d = new Date(label)
  if (Number.isNaN(d.getTime())) return '2026-08-12'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toothFromNotes(notes: string) {
  const match = notes.match(/#(\d+)/)
  return match ? Number(match[1]) : undefined
}

const ur = [1, 2, 3, 4, 5, 6, 7, 8]
const ul = [9, 10, 11, 12, 13, 14, 15, 16]
const lr = [32, 31, 30, 29, 28, 27, 26, 25]
const ll = [17, 18, 19, 20, 21, 22, 23, 24]

export function Treatments() {
  const { patients, appointments, notify } = useClinic()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const selectedId = params.get('patient')
  const visitId = params.get('visit')
  const patient = patients.find((p) => p.id === selectedId)

  const todayIds = new Set(
    appointments.filter((a) => a.date === '2026-08-12').map((a) => a.patientId),
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return patients.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [patients, query])

  function pick(p: Patient) {
    setParams({ patient: p.id })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h1 className="mb-1 text-lg font-bold text-slate-800">Treatments</h1>
        <p className="mb-3 text-xs text-slate-500">Select a patient to chart today’s procedure.</p>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
        <ul className="max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pick(p)}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left ${
                  selectedId === p.id ? 'bg-blue-50 ring-1 ring-[#2563EB]' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar initials={p.initials} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400">
                    {p.id}
                    {todayIds.has(p.id) ? ' · today' : ''}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {patient ? (
        <Chart
          key={patient.id}
          patient={patient}
          visitId={visitId}
          onOpenProfile={() => navigate(`/patients/${patient.id}`)}
          notify={notify}
        />
      ) : (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div>
            <p className="font-semibold text-slate-800">No patient selected</p>
            <p className="mt-1 text-sm text-slate-500">Pick someone from the list to record a procedure.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Chart({
  patient,
  visitId,
  onOpenProfile,
  notify,
}: {
  patient: Patient
  visitId: string | null
  onOpenProfile: () => void
  notify: (msg: string) => void
}) {
  const records = historySeed.filter((t) => t.patientId === patient.id)
  const [activeVisit, setActiveVisit] = useState<string | null>(visitId)
  const [selected, setSelected] = useState(30)
  const [procedure, setProcedure] = useState(patient.treatment ?? treatmentsCatalog[0])
  const [date, setDate] = useState('2026-08-12')
  const [complaint, setComplaint] = useState(patient.notes ?? '')
  const [plan, setPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  function openVisit(r: TreatmentRecord, announce = true) {
    setActiveVisit(r.id)
    setProcedure(r.procedure)
    setNotes(r.notes)
    setDate(toInputDate(r.date))
    const tooth = toothFromNotes(r.notes)
    if (tooth) setSelected(tooth)
    setSaved(false)
    if (announce) notify(`Opened ${r.procedure} from ${r.date}.`)
  }

  useEffect(() => {
    if (!visitId) return
    const r = records.find((x) => x.id === visitId)
    if (r) openVisit(r, false)
  }, [visitId])

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Avatar initials={patient.initials} size="lg" />
          <div className="min-w-0 flex-1">
            <button type="button" className="text-lg font-bold text-slate-800 hover:text-[#2563EB]" onClick={onOpenProfile}>
              {patient.name}
            </button>
            <div className="text-sm text-slate-500">
              {patient.id} · {patient.gender === 'F' ? 'Female' : 'Male'} · {patient.age} y/o
            </div>
          </div>
          {patient.allergy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {patient.allergy}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <Clock className="h-3.5 w-3.5" />
            Last visit: {patient.lastVisit}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
            <ListChecks className="h-4 w-4 text-[#2563EB]" />
            Diagnosis & Planning
          </h2>
          <label className="mb-3 block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Chief Complaint / Diagnosis</span>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Treatment Plan Summary</span>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={3}
              placeholder="Numbered plan for this visit..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Procedure Recording</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Procedure Type</span>
              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {treatmentsCatalog.includes(procedure) ? null : <option value={procedure}>{procedure}</option>}
                {treatmentsCatalog.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Date of Service</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <p className="mb-2 text-sm font-medium text-slate-600">Teeth Involved (Adult)</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-6">
              <Quad label="UR" teeth={ur} selected={selected} onSelect={setSelected} />
              <Quad label="UL" teeth={ul} selected={selected} onSelect={setSelected} />
              <Quad label="LR" teeth={lr} selected={selected} onSelect={setSelected} />
              <Quad label="LL" teeth={ll} selected={selected} onSelect={setSelected} />
            </div>
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Clinical Notes / Procedure Description</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Document anesthesia, materials, and post-op instructions..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]"
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSaved(true)
                notify(`Procedure saved for ${patient.name}, tooth #${selected}.`)
              }}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
            >
              Save Procedure
            </button>
          </div>
          {saved && (
            <p className="mt-2 text-right text-sm text-emerald-600">
              Procedure saved for {patient.name}, tooth #{selected}.
            </p>
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
          <History className="h-4 w-4 text-[#2563EB]" />
          Treatment History
        </h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">No procedures on file yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
            {records.map((r) => (
              <li key={r.id}>
                <span className="absolute -left-1.5 mt-3 h-3 w-3 rounded-full bg-[#2563EB]" />
                <button
                  type="button"
                  onClick={() => openVisit(r)}
                  className={`w-full rounded-xl p-2 text-left ${
                    activeVisit === r.id ? 'bg-blue-50 ring-1 ring-[#2563EB]' : 'hover:bg-slate-50'
                  }`}
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
      </aside>
    </div>
  )
}

function Quad({
  label,
  teeth,
  selected,
  onSelect,
}: {
  label: string
  teeth: number[]
  selected: number
  onSelect: (n: number) => void
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {teeth.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={`h-8 w-8 rounded-md text-xs font-semibold ${
              selected === n ? 'bg-[#2563EB] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#2563EB]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
