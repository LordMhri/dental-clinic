import { useState, useEffect } from 'react'
import {
  Building2,
  CalendarDays,
  Layers,
  Package,
  Receipt,
  Save,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react'
import { useClinic } from '../context/ClinicContext'
import type { ClinicModule } from '../types'

interface ModuleConfig {
  id: ClinicModule
  name: string
  desc: string
  icon: typeof Users
  badge: string
}

const ALL_MODULES: ModuleConfig[] = [
  {
    id: 'patients',
    name: 'Patient Intake & Records',
    desc: 'Walk-in registration, medical history, allergy alerts, and patient profiles.',
    icon: Users,
    badge: 'Core Foundation',
  },
  {
    id: 'clinical',
    name: 'Clinical Charting & Odontogram',
    desc: 'Interactive 32-teeth anatomical SVG odontogram, treatment procedures, and MinIO digital X-ray storage.',
    icon: Stethoscope,
    badge: 'Clinical Core',
  },
  {
    id: 'scheduling',
    name: 'Operatory Chair Scheduling',
    desc: 'Multi-chair operatory timeline grid with automated double-booking conflict prevention.',
    icon: CalendarDays,
    badge: 'Operations',
  },
  {
    id: 'billing',
    name: 'Billing & Cashier Desk',
    desc: 'Cash drawer float reconciliation, Cash & Transfer settlements (Telebirr, CBE, Dashen, etc.), and thermal receipts.',
    icon: Receipt,
    badge: 'Financial Ledger',
  },
  {
    id: 'inventory',
    name: 'Hierarchical Inventory & Supplies',
    desc: 'Multi-tier JSONB category tree, on-the-fly subcategories, custom product attributes, and safety stock threshold alerts.',
    icon: Package,
    badge: 'Supply Chain',
  },
]

export function Settings() {
  const { clinic, updateClinicProfile, user, notify } = useClinic()

  const [name, setName] = useState(clinic?.name || '')
  const [tagline, setTagline] = useState(clinic?.tagline || '')
  const [location, setLocation] = useState(clinic?.location || '')
  const [phone, setPhone] = useState(clinic?.phone || '')
  const [tinNumber, setTinNumber] = useState(clinic?.tinNumber || '')
  const [workingHours, setWorkingHours] = useState(
    clinic?.workingHours || 'Mon–Sat · 8:00 AM – 6:00 PM (EAT)',
  )
  const [enabledModules, setEnabledModules] = useState<ClinicModule[]>(
    clinic?.enabledModules || ['patients', 'clinical', 'scheduling', 'billing', 'inventory'],
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clinic) {
      setName(clinic.name || '')
      setTagline(clinic.tagline || '')
      setLocation(clinic.location || '')
      setPhone(clinic.phone || '')
      setTinNumber(clinic.tinNumber || '')
      if (clinic.workingHours) setWorkingHours(clinic.workingHours)
      if (clinic.enabledModules) setEnabledModules(clinic.enabledModules)
    }
  }, [clinic])

  const isAdmin = user?.role === 'admin'

  function toggleModule(modId: ClinicModule) {
    if (!isAdmin) {
      notify('Only clinic administrators can change active modules.')
      return
    }
    setEnabledModules((prev) => {
      if (prev.includes(modId)) {
        if (prev.length <= 1) {
          notify('At least one module must remain enabled.')
          return prev
        }
        return prev.filter((m) => m !== modId)
      } else {
        return [...prev, modId]
      }
    })
  }

  async function handleSave() {
    if (!name.trim()) {
      notify('Please enter a valid clinic name.')
      return
    }
    if (enabledModules.length === 0) {
      notify('At least one module must be enabled.')
      return
    }

    setSaving(true)
    try {
      await updateClinicProfile({
        name: name.trim(),
        tagline: tagline.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        tinNumber: tinNumber.trim() || null,
        workingHours: workingHours.trim() || null,
        currency: 'ETB',
        enabledModules,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clinic Profile & System Configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure clinic branding, official receipt metadata, and toggle active software modules.
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            You are currently signed in as a <strong>{user?.role}</strong>. Only administrators can
            modify clinic identity and active software modules.
          </span>
        </div>
      )}

      {/* 1. Clinic Identity & Receipt Branding Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Building2 className="h-5 w-5 text-[#2563EB]" />
          <div>
            <h2 className="text-base font-bold text-slate-800">Clinic Identity & Receipt Header</h2>
            <p className="text-xs text-slate-400">
              Customizes navigation branding, page titles, and printed thermal receipts.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">
              Clinic Name <span className="text-rose-500">*</span>
            </span>
            <input
              disabled={!isAdmin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bole Smile Dental Clinic"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Tagline / Subtitle</span>
            <input
              disabled={!isAdmin}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Clinical Excellence & Advanced Care"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Physical Location / Address</span>
            <input
              disabled={!isAdmin}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bole Sub-City, Woreda 03, Addis Ababa"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Front Desk Phone</span>
            <input
              disabled={!isAdmin}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +251 911 123 456"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">TIN Number (Receipts)</span>
            <input
              disabled={!isAdmin}
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
              placeholder="e.g. 0048291042"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Working Hours</span>
            <input
              disabled={!isAdmin}
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Mon–Sat · 8:00 AM – 6:00 PM (EAT)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] disabled:bg-slate-50"
            />
          </label>
        </div>
      </div>

      {/* 2. Active Modules & Feature Flags Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-bold text-slate-800">Module Flag Configuration</h2>
              <p className="text-xs text-slate-400">
                Activate or deactivate modules for this clinic. Disabled modules disappear from the
                sidebar and are blocked by route guards.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
            {enabledModules.length} of {ALL_MODULES.length} Active
          </span>
        </div>

        <div className="space-y-3">
          {ALL_MODULES.map((mod) => {
            const active = enabledModules.includes(mod.id)
            const Icon = mod.icon
            return (
              <div
                key={mod.id}
                onClick={() => isAdmin && toggleModule(mod.id)}
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                  isAdmin ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'
                } ${
                  active
                    ? 'border-blue-200 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 rounded-lg p-2 ${
                      active ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{mod.name}</span>
                      <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                        {mod.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{mod.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleModule(mod.id)
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    active ? 'bg-[#2563EB]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            {saving ? (
              'Saving Configuration...'
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Clinic Configuration
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

