import { useNavigate } from 'react-router-dom'
import { staff } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Avatar } from '../components/ui/Avatar'

const homes: Record<string, string> = {
  admin: '/dashboard',
  dentist: '/dentist',
  reception: '/reception',
  cashier: '/cashier',
  nurse: '/dashboard',
}

export function Users() {
  const { user, switchUser } = useClinic()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Clinic staff at Lewi Dental, Bole. Switch demo roles without logging out.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <Avatar initials={s.initials} />
              <div>
                <div className="font-semibold text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-500">{s.title}</div>
              </div>
            </div>
            <p className="text-sm text-slate-500">{s.email}</p>
            <p className="text-sm text-slate-500">{s.phone}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#2563EB]">
                {s.role}
              </span>
              {user?.id === s.id ? (
                <span className="text-xs font-semibold text-emerald-600">Signed in</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    switchUser(s.id)
                    navigate(homes[s.role])
                  }}
                  className="text-xs font-semibold text-[#2563EB]"
                >
                  Switch to this user
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Login: {s.username} / clinic123
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
