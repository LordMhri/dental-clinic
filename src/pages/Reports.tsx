import { DonutChart } from '../components/ui/DonutChart'
import { useClinic } from '../context/ClinicContext'
import { etb } from '../lib/format'

export function Reports() {
  const { patients, appointments, invoices } = useClinic()
  const unpaid = invoices.filter((i) => i.status !== 'Paid')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Clinic performance for August 2026 — tables and totals only.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Patients on file" value={String(patients.length)} />
        <Card label="Appointments this week" value={String(appointments.length)} />
        <Card label="Collected (sample)" value={etb(15400)} />
        <Card label="Open invoices" value={String(unpaid.length)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Appointment mix</h2>
          <DonutChart
            total={appointments.length}
            segments={[
              { label: 'Completed', value: 40, color: '#14B8A6' },
              { label: 'Scheduled', value: 35, color: '#2563EB' },
              { label: 'In chair', value: 15, color: '#6366F1' },
              { label: 'Delayed', value: 10, color: '#FB7185' },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Top treatments</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Procedure</th>
                <th className="pb-3 font-medium">Visits</th>
                <th className="pb-3 font-medium">Est. revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Root Canal Therapy', '18', 81000],
                ['Composite Restoration', '24', 46800],
                ['Routine Cleaning', '31', 27900],
                ['Whitening', '9', 16200],
                ['Extraction', '7', 10500],
              ].map(([name, n, rev]) => (
                <tr key={String(name)}>
                  <td className="py-3 text-slate-800">{name}</td>
                  <td className="py-3 text-slate-600">{n}</td>
                  <td className="py-3 font-medium">{etb(Number(rev))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}
