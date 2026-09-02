import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  History,
  ListChecks,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'
import { treatmentsCatalog } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Avatar } from '../components/ui/Avatar'
import { Odontogram } from '../components/odontogram/Odontogram'
import { DentalAttachments, type AttachmentItem } from '../components/clinical/DentalAttachments'
import type { ToothCondition, ToothData } from '../components/odontogram/odontogramUtils'
import type { Patient, TreatmentRecord } from '../types'

const PROCEDURE_FEES: Record<string, number> = {
  'Routine Checkup': 650,
  'Routine Cleaning': 800,
  'Composite Restoration (Filling)': 1850,
  'Root Canal Therapy': 4500,
  'Crown Fitting': 6200,
  Extraction: 1200,
  Whitening: 2500,
  'Braces Consult': 800,
  Consultation: 650,
}

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
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q),
    )
  }, [patients, query])

  function pick(p: Patient) {
    setParams({ patient: p.id })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      {/* Patient Sidebar */}
      <aside className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h1 className="mb-1 text-lg font-bold text-slate-800">Clinical Treatments</h1>
        <p className="mb-3 text-xs text-slate-500">Select a patient to chart today’s procedure.</p>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, or ID..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
        <ul className="max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pick(p)}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors ${
                  selectedId === p.id ? 'bg-blue-50 ring-1 ring-[#2563EB]' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar initials={p.initials} size="sm" />
                <div className="min-w-0 flex-1">
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

      {/* Main Clinical Charting Area */}
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
            <p className="mt-1 text-sm text-slate-500">Pick someone from the list to begin charting.</p>
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
  const { token, user } = useClinic()
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [activeVisit, setActiveVisit] = useState<string | null>(visitId)
  const [selectedTooth, setSelectedTooth] = useState<number>(14)
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(['O'])
  const [procedure, setProcedure] = useState<string>(
    patient.treatment ?? treatmentsCatalog[2], // Composite Restoration default
  )
  const [date, setDate] = useState('2026-08-12')
  const [complaint, setComplaint] = useState(patient.notes ?? '')
  const [plan, setPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [fee, setFee] = useState<number>(PROCEDURE_FEES[patient.treatment ?? ''] || 1850)
  const [submitting, setSubmitting] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])

  // Initialize standard 32-tooth chart in memory
  const [chart, setChart] = useState<Record<number, ToothData>>(() => {
    const init: Record<number, ToothData> = {}
    for (let i = 1; i <= 32; i++) {
      init[i] = { toothNumber: i, condition: 'Sound', surfaces: null }
    }
    return init
  })

  // Fetch real odontogram from backend API
  const fetchChart = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical/odontogram/${patient.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const nextChart: Record<number, ToothData> = {}
        for (let i = 1; i <= 32; i++) {
          nextChart[i] = { toothNumber: i, condition: 'Sound', surfaces: null }
        }
        for (const item of data.chart) {
          nextChart[item.toothNumber] = item
        }
        setChart(nextChart)
      }
    } catch (err) {
      console.error('Failed to load odontogram:', err)
    }
  }, [patient.id, token])

  // Fetch patient treatments & attachments from backend
  const fetchPatientDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        if (data.patient?.treatments) {
          setRecords(data.patient.treatments)
        }
        if (data.patient?.attachments) {
          setAttachments(data.patient.attachments)
        }
      }
    } catch (err) {
      console.error('Failed to load patient treatments/attachments:', err)
    }
  }, [patient.id, token])

  useEffect(() => {
    fetchChart()
    fetchPatientDetails()
  }, [fetchChart, fetchPatientDetails])

  // Toggle surface selection
  function handleToggleSurface(surface: string) {
    setSelectedSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface].sort(),
    )
  }

  // Update tooth condition directly in backend & state
  async function handleUpdateCondition(toothNumber: number, condition: ToothCondition) {
    try {
      const res = await fetch(`/api/clinical/odontogram/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          toothNumber,
          condition,
          surfaces: selectedSurfaces.join(''),
        }),
      })

      if (res.ok) {
        setChart((prev) => ({
          ...prev,
          [toothNumber]: {
            ...prev[toothNumber],
            condition,
            surfaces: selectedSurfaces.join(''),
          },
        }))
        notify(`Tooth #${toothNumber} set to ${condition}.`)
      }
    } catch {
      notify('Failed to update tooth condition.')
    }
  }

  // When procedure changes, auto-set fee
  function handleProcedureChange(proc: string) {
    setProcedure(proc)
    if (PROCEDURE_FEES[proc]) {
      setFee(PROCEDURE_FEES[proc])
    }
  }

  // Save procedure & trigger anti-leakage cashier draft invoice
  async function handleSaveProcedure() {
    setSubmitting(true)
    setSavedSuccess(false)

    try {
      const res = await fetch('/api/clinical/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: patient.id,
          procedure,
          toothNumber: selectedTooth,
          surfaces: selectedSurfaces.join(''),
          notes: notes || `Treated tooth #${selectedTooth} (${selectedSurfaces.join('')})`,
          fee,
          status: 'Completed',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save treatment')
      }

      setSavedSuccess(true)
      notify(`Procedure saved & billed to cashier desk (ETB ${fee.toLocaleString()}).`)
      await fetchChart()
      await fetchPatientDetails()
    } catch (err) {
      notify(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  function openVisit(r: TreatmentRecord) {
    setActiveVisit(r.id)
    setProcedure(r.procedure)
    setNotes(r.notes)
    setDate(toInputDate(r.date))
    const tooth = toothFromNotes(r.notes)
    if (tooth) setSelectedTooth(tooth)
    notify(`Opened ${r.procedure} from ${r.date}.`)
  }

  return (
    <div className="space-y-4">
      {/* Patient Header Banner */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Avatar initials={patient.initials} size="lg" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="text-lg font-bold text-slate-800 hover:text-[#2563EB]"
            onClick={onOpenProfile}
          >
            {patient.name}
          </button>
          <div className="text-sm text-slate-500">
            {patient.id} · {patient.gender === 'F' ? 'Female' : 'Male'} · {patient.age} y/o ·{' '}
            {patient.phone}
          </div>
        </div>

        {patient.allergy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            {patient.allergy}
          </span>
        )}

        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          <Clock className="h-3.5 w-3.5" />
          Last visit: {patient.lastVisit}
        </span>
      </div>

      {/* 1. Interactive Anatomical Odontogram */}
      <Odontogram
        chart={chart}
        selectedTooth={selectedTooth}
        selectedSurfaces={selectedSurfaces}
        onSelectTooth={setSelectedTooth}
        onToggleSurface={handleToggleSurface}
        onUpdateCondition={handleUpdateCondition}
      />

      {/* 2. Diagnosis & Procedure Recording Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Diagnosis & Treatment Planning */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
            <ListChecks className="h-4 w-4 text-[#2563EB]" />
            Diagnosis & Clinical Plan
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

        {/* Procedure Recording Form */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Record Completed Procedure</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Procedure</span>
              <select
                value={procedure}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {treatmentsCatalog.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">Procedure Fee (ETB)</span>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-bold text-slate-800"
                />
              </div>
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-slate-600">Date of Service</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold">Selected Tooth:</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-[#2563EB]">
              Tooth #{selectedTooth}
            </span>
            {selectedSurfaces.length > 0 && (
              <>
                <span className="font-semibold ml-2">Surfaces:</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-[#2563EB]">
                  {selectedSurfaces.join('')}
                </span>
              </>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Clinical Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Document materials, shade, anesthesia, and post-op instructions..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            />
          </label>

          <div className="mt-4 flex items-center justify-between">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Billed to cashier desk!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Signing as {user?.name || 'Dr. Eyuel Hailu'}
              </span>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveProcedure}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {submitting ? 'Saving & Billing...' : 'Save & Bill Procedure'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dental Imaging & X-Rays (MinIO S3 Integration) */}
      <DentalAttachments
        patientId={patient.id}
        attachments={attachments}
        onUploadSuccess={(newAtt) => setAttachments((prev) => [newAtt, ...prev])}
        onDeleteSuccess={(deletedId) => setAttachments((prev) => prev.filter((a) => a.id !== deletedId))}
        token={token}
      />

      {/* 4. Treatment History Timeline */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
          <History className="h-4 w-4 text-[#2563EB]" />
          Historical Procedures & Records
        </h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">No procedures on file yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
            {records.map((r) => (
              <li key={r.id}>
                <span className="absolute -left-1.5 mt-2 h-3 w-3 rounded-full bg-[#2563EB]" />
                <button
                  type="button"
                  onClick={() => openVisit(r)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    activeVisit === r.id
                      ? 'border-blue-300 bg-blue-50 ring-1 ring-[#2563EB]'
                      : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{r.date}</span>
                    <span className="text-xs font-bold text-slate-800">
                      ETB {r.fee ? r.fee.toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {r.procedure}
                    {r.toothNumber ? ` · Tooth #${r.toothNumber}` : ''}
                    {r.surfaces ? ` (${r.surfaces})` : ''}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{r.notes}</p>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
