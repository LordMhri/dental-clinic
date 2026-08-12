import { useState } from 'react'
import { clinic } from '../data/mock'
import { useClinic } from '../context/ClinicContext'

export function Settings() {
  const { notify } = useClinic()
  const [name, setName] = useState(clinic.name)
  const [tagline, setTagline] = useState(clinic.tagline)
  const [location, setLocation] = useState(clinic.location)
  const [phone, setPhone] = useState(clinic.phone)
  const [saved, setSaved] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Clinic profile and working hours.</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Clinic name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Tagline</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Front desk phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Currency</span>
          <input value="ETB — Ethiopian Birr" readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Working hours</span>
          <input defaultValue="Mon–Sat · 8:00 AM – 6:00 PM (EAT)" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]" />
        </label>
        <button
          type="button"
          onClick={() => {
            setSaved(true)
            notify('Clinic settings saved.')
          }}
          className="mt-5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Save changes
        </button>
        {saved && <p className="mt-2 text-sm text-emerald-600">Settings saved locally.</p>}
      </div>
    </div>
  )
}
