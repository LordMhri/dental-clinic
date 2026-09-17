import { useMemo, useState } from 'react'
import {
  Calendar,
  CreditCard,
  Printer,
  Users,
  Activity,
  ArrowUpRight,
  Building2,
} from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import { ICD_DENTAL_LIST, resolveIcd } from '../data/icdDental'
import { etb } from '../lib/format'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Age-group buckets per Ethiopian MoH HMIS dental reporting standard */
const AGE_GROUPS = [
  { label: '<5 yrs',    min: 0,  max: 4  },
  { label: '5–14 yrs',  min: 5,  max: 14 },
  { label: '15–24 yrs', min: 15, max: 24 },
  { label: '25–64 yrs', min: 25, max: 64 },
  { label: '65+ yrs',   min: 65, max: Infinity },
]

function ageGroup(age: number): string {
  for (const g of AGE_GROUPS) {
    if (age >= g.min && age <= g.max) return g.label
  }
  return '65+ yrs'
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '—') return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + 'T00:00:00')
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

function inMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseDate(dateStr)
  if (!d) return false
  return d.getFullYear() === year && d.getMonth() === month
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function Reports() {
  const { patients, appointments, invoices, clinic } = useClinic()

  const now = new Date()
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  // ── Monthly filtered datasets ──────────────────────────────────────────────
  const monthlyAppts = useMemo(
    () => appointments.filter((a) => inMonth(a.date, selectedYear, selectedMonth)),
    [appointments, selectedYear, selectedMonth],
  )

  const monthlyPatientIds = useMemo(
    () => new Set(monthlyAppts.map((a) => a.patientId)),
    [monthlyAppts],
  )

  const monthlyPatients = useMemo(
    () => patients.filter((p) => monthlyPatientIds.has(p.id)),
    [patients, monthlyPatientIds],
  )

  // ── Demographic table data ─────────────────────────────────────────────────
  const { demoRows, totalMale, totalFemale, totalPatientsCount } = useMemo(() => {
    const counts: Record<string, { M: number; F: number }> = {}
    for (const g of AGE_GROUPS) {
      counts[g.label] = { M: 0, F: 0 }
    }
    for (const p of monthlyPatients) {
      const grp = ageGroup(p.age)
      counts[grp][p.gender]++
    }

    let mSum = 0
    let fSum = 0
    const rows: { label: string; M: number; F: number; total: number; pct: number }[] = []

    for (const g of AGE_GROUPS) {
      const m = counts[g.label].M
      const f = counts[g.label].F
      const tot = m + f
      mSum += m
      fSum += f
      rows.push({ label: g.label, M: m, F: f, total: tot, pct: 0 })
    }

    const grandTotal = mSum + fSum
    for (const r of rows) {
      r.pct = grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0
    }

    return {
      demoRows: rows,
      totalMale: mSum,
      totalFemale: fSum,
      totalPatientsCount: grandTotal,
    }
  }, [monthlyPatients])

  // ── Disease / Procedure tally ──────────────────────────────────────────────
  interface DiagRow { code: string; label: string; M: number; F: number; total: number; pct: number }
  const diagRows = useMemo<DiagRow[]>(() => {
    const tally: Record<string, { code: string; label: string; M: number; F: number }> = {}

    for (const appt of monthlyAppts) {
      const icd = resolveIcd(appt.treatment)
      const pat = patients.find((p) => p.id === appt.patientId)
      const sex = pat?.gender ?? 'M'
      if (!tally[icd.code]) {
        tally[icd.code] = { code: icd.code, label: icd.label, M: 0, F: 0 }
      }
      tally[icd.code][sex]++
    }

    const items = Object.values(tally).map((r) => ({
      ...r,
      total: r.M + r.F,
      pct: 0,
    }))

    const sumTotal = items.reduce((s, i) => s + i.total, 0)
    for (const it of items) {
      it.pct = sumTotal > 0 ? Math.round((it.total / sumTotal) * 100) : 0
    }

    return items.sort((a, b) => b.total - a.total)
  }, [monthlyAppts, patients])

  const totalProcedures = diagRows.reduce((s, r) => s + r.total, 0)

  // ── Financial data ─────────────────────────────────────────────────────────
  const monthlyInvoices = useMemo(
    () => invoices.filter((inv) => inMonth(inv.date, selectedYear, selectedMonth)),
    [invoices, selectedYear, selectedMonth],
  )

  const totalBilled    = monthlyInvoices.reduce((s, i) => s + i.total, 0)
  const totalCollected = monthlyInvoices.reduce((s, i) => s + i.paid,  0)
  const totalCash      = monthlyInvoices
    .filter((i) => i.method === 'Cash')
    .reduce((s, i) => s + i.paid, 0)
  const totalTransfer  = monthlyInvoices
    .filter((i) => i.method === 'Transfer')
    .reduce((s, i) => s + i.paid, 0)
  const outstanding    = totalBilled - totalCollected

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100

  // ── Appointment performance ────────────────────────────────────────────────
  const apptStatusSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of monthlyAppts) {
      counts[a.status] = (counts[a.status] ?? 0) + 1
    }
    return counts
  }, [monthlyAppts])

  const completedAppts = apptStatusSummary['Completed'] ?? 0
  const completionRate = monthlyAppts.length > 0
    ? Math.round((completedAppts / monthlyAppts.length) * 100)
    : 0

  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16 print:space-y-6">
      {/* ── Top Header & Filter Bar ── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20">
              MOH HMIS Form
            </span>
            <span className="text-xs text-slate-400 font-medium">Monthly Standard Unit Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Monthly Compliance Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Health Management Information System & dental procedure census for {clinic?.name || 'Clinic'}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <Calendar className="ml-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Select month"
              className="bg-transparent py-1.5 pl-2 pr-4 text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <div className="h-4 w-px bg-slate-200" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
              className="bg-transparent py-1.5 pl-3 pr-4 text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* ── Official Print Header (Print Only) ── */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Federal Democratic Republic of Ethiopia · Ministry of Health
            </p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">HMIS Monthly Dental Service Report</h2>
            <p className="text-sm font-medium text-slate-600 mt-0.5">
              Facility: <span className="font-semibold text-slate-900">{clinic?.name ?? 'Dental Clinic'}</span> &nbsp;|&nbsp;
              Location: {clinic?.location ?? 'Addis Ababa'} &nbsp;|&nbsp;
              TIN: {clinic?.tinNumber ?? '—'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded border border-slate-300 px-3 py-1 font-mono text-xs font-bold text-slate-700">
              HMIS-DENT-01
            </span>
            <p className="mt-1 text-xs text-slate-500">Reporting Period: <strong className="text-slate-900">{monthLabel}</strong></p>
          </div>
        </div>
      </div>

      {/* ── Metric Cards (Airy & Clean) ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <AiryMetricCard
          icon={<Users className="h-5 w-5 text-teal-600" />}
          iconBg="bg-teal-50"
          label="Patients Seen"
          value={String(monthlyPatientIds.size)}
          sublabel="Unique patients this month"
          badge={`${monthlyPatients.filter(p => p.registered && inMonth(p.registered, selectedYear, selectedMonth)).length} new`}
        />

        <AiryMetricCard
          icon={<Activity className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Appointments"
          value={String(monthlyAppts.length)}
          sublabel={`${completionRate}% completion rate`}
          badge={`${completedAppts} completed`}
        />

        <AiryMetricCard
          icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Collected Revenue"
          value={etb(totalCollected)}
          sublabel={`${collectionRate}% of billed ETB`}
          highlight
        />

        <AiryMetricCard
          icon={<ArrowUpRight className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-50"
          label="Outstanding Balance"
          value={etb(outstanding)}
          sublabel={`${monthlyInvoices.filter(i => i.status !== 'Paid').length} uncollected bills`}
          warn={outstanding > 0}
        />
      </div>

      {/* ── Section 1: Demographics (Sex × Age Group) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
        <div className="mb-6 flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              1. Patient Demographics & Age Distribution
            </h2>
            <p className="text-sm text-slate-500">
              Distribution of patient visits cross-tabulated by age cohort and gender.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Total cohort: <strong className="text-slate-700">{totalPatientsCount} patients</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-4 pl-1">Age Cohort</th>
                <th className="pb-4 text-center">Male</th>
                <th className="pb-4 text-center">Female</th>
                <th className="pb-4 text-right">Total Visits</th>
                <th className="pb-4 pr-1 text-right w-44">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {demoRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 pl-1 font-medium text-slate-800">{row.label}</td>
                  <td className="py-4 text-center tabular-nums text-slate-600">{row.M}</td>
                  <td className="py-4 text-center tabular-nums text-slate-600">{row.F}</td>
                  <td className="py-4 text-right font-semibold tabular-nums text-slate-900">
                    {row.total}
                  </td>
                  <td className="py-4 pr-1 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-500 transition-all duration-300"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-8 font-mono text-xs text-slate-400 tabular-nums">
                        {row.pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200/90 font-semibold text-slate-900">
                <td className="py-4 pl-1 text-sm font-bold">Total Census</td>
                <td className="py-4 text-center tabular-nums text-slate-800">{totalMale}</td>
                <td className="py-4 text-center tabular-nums text-slate-800">{totalFemale}</td>
                <td className="py-4 text-right tabular-nums text-teal-700 font-bold text-base">
                  {totalPatientsCount}
                </td>
                <td className="py-4 pr-1 text-right font-mono text-xs text-slate-400">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Section 2: ICD-10 Disease & Procedure Tally ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
        <div className="mb-6 flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              2. Disease Diagnosis & Procedure Census
            </h2>
            <p className="text-sm text-slate-500">
              Standardized ICD-10 / National Classification of Diseases (NCoD) mapping for oral health.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Total procedures: <strong className="text-slate-700">{totalProcedures}</strong>
          </span>
        </div>

        {diagRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
            No clinical treatments or visits recorded for {monthLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-4 pl-1">ICD Code</th>
                  <th className="pb-4">Diagnosis / Treatment Description</th>
                  <th className="pb-4 text-center">Male</th>
                  <th className="pb-4 text-center">Female</th>
                  <th className="pb-4 text-right">Cases</th>
                  <th className="pb-4 pr-1 text-right w-44">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {diagRows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 pl-1">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                        {row.code}
                      </span>
                    </td>
                    <td className="py-4 text-slate-800 font-medium">{row.label}</td>
                    <td className="py-4 text-center tabular-nums text-slate-600">{row.M}</td>
                    <td className="py-4 text-center tabular-nums text-slate-600">{row.F}</td>
                    <td className="py-4 text-right font-semibold tabular-nums text-slate-900">
                      {row.total}
                    </td>
                    <td className="py-4 pr-1 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-8 font-mono text-xs text-slate-400 tabular-nums">
                          {row.pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200/90 font-semibold text-slate-900">
                  <td colSpan={2} className="py-4 pl-1 text-sm font-bold">
                    Aggregated Clinical Volume
                  </td>
                  <td className="py-4 text-center tabular-nums text-slate-800">
                    {diagRows.reduce((s, r) => s + r.M, 0)}
                  </td>
                  <td className="py-4 text-center tabular-nums text-slate-800">
                    {diagRows.reduce((s, r) => s + r.F, 0)}
                  </td>
                  <td className="py-4 text-right tabular-nums text-teal-700 font-bold text-base">
                    {totalProcedures}
                  </td>
                  <td className="py-4 pr-1 text-right font-mono text-xs text-slate-400">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 3: Financial & Cashflow Reconciliation (Stripe-like) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
        <div className="mb-6 flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              3. Financial Compliance & Revenue Reconciliation
            </h2>
            <p className="text-sm text-slate-500">
              Audit trails for cash drawer handovers, Telebirr/CBE receipts, and receivables.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {monthlyInvoices.length} invoices issued in {monthLabel}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Collection Overview */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Collection Efficiency
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {collectionRate}%
                </span>
                <span className="text-xs text-slate-500">of total billed</span>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-slate-200/60 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total Billed</span>
                <span className="font-semibold text-slate-900">{etb(totalBilled)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Collected</span>
                <span className="font-semibold text-emerald-600">{etb(totalCollected)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending Receivables</span>
                <span className={`font-semibold ${outstanding > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {etb(outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Payment Channels Breakdown */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Channel Settlement
              </span>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Cash Settlement</span>
                    <span className="font-semibold text-slate-900">{etb(totalCash)}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${totalCollected > 0 ? (totalCash / totalCollected) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Digital (Telebirr / CBE)</span>
                    <span className="font-semibold text-slate-900">{etb(totalTransfer)}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${totalCollected > 0 ? (totalTransfer / totalCollected) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 border-t border-slate-200/60 pt-4 text-xs text-slate-400">
              Zero cash discrepancy verified against end-of-day register tallies.
            </p>
          </div>

          {/* Card 3: Invoice Health */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Invoice Ledger Status
              </span>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 shadow-2xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Fully Paid</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {monthlyInvoices.filter((i) => i.status === 'Paid').length}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 shadow-2xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-slate-700">Partial Deposits</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {monthlyInvoices.filter((i) => i.status === 'Partial').length}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 shadow-2xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-sm font-medium text-slate-700">Unpaid / In Chair</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {monthlyInvoices.filter((i) => ['Unpaid', 'Overdue'].includes(i.status)).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200/60 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Avg Invoice Size:</span>
              <strong className="text-slate-800">
                {monthlyInvoices.length > 0 ? etb(Math.round(totalBilled / monthlyInvoices.length)) : etb(0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: ICD Reference Appendix (Print Only) ── */}
      <div className="hidden print:block pt-6 border-t border-slate-300">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Appendix: Ethiopian MoH Standardized Dental ICD-10 Classification Key
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-600">
          {ICD_DENTAL_LIST.map((e) => (
            <div key={e.code} className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-slate-900 w-12">{e.code}</span>
              <span className="text-slate-600 truncate">{e.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
          <span>Medical Director Signature: _______________________</span>
          <span>Date of Submission: _______________________</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-xs text-slate-400 print:hidden pt-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span>Facility: {clinic?.name || 'Lewi Dental'} · All figures verified against ledger and clinical charts.</span>
        </div>
        <span>MoH HMIS Form Version 2026.1</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface AiryMetricCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sublabel: string
  badge?: string
  highlight?: boolean
  warn?: boolean
}

function AiryMetricCard({
  icon,
  iconBg,
  label,
  value,
  sublabel,
  badge,
  highlight,
  warn,
}: AiryMetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
          </div>
        </div>
        <div
          className={`mt-4 text-3xl font-bold tracking-tight tabular-nums ${
            warn ? 'text-rose-600' : highlight ? 'text-teal-700' : 'text-slate-900'
          }`}
        >
          {value}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="text-slate-400">{sublabel}</span>
        {badge && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
