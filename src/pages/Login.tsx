import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Info, Lock, User } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clinic, staff } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Modal, ModalHeader } from '../components/ui/Modal'

function homeFor(role: string) {
  if (role === 'dentist') return '/dentist'
  if (role === 'reception') return '/reception'
  if (role === 'cashier') return '/billing'
  return '/dashboard'
}

export function Login() {
  const { user, login, notify } = useClinic()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetUser, setResetUser] = useState('')

  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(username, password, remember)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    const found = staff.find((s) => s.username === username.trim().toLowerCase())
    navigate(homeFor(found?.role ?? 'admin'))
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8EEF5] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, #dbeafe 0%, transparent 40%), radial-gradient(circle at 80% 80%, #e0e7ff 0%, transparent 40%), linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      />
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <form onSubmit={submit} className="px-8 pb-6 pt-10">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-md">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3c-2.2 1.6-3.5 3.6-3.8 6-.4 3.2.6 6.2 2.2 9.2.5 1 1.1 1.8 1.6 1.8s1.1-.8 1.6-1.8c1.6-3 2.6-6 2.2-9.2C15.5 6.6 14.2 4.6 12 3Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{clinic.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Clinic Management System</p>
          </div>
          <div className="mb-6 h-px bg-slate-100" />

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Username</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
          </label>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-2.5 text-slate-400"
              >
                {show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="mb-5 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Remember me
            </label>
            <button type="button" className="font-medium text-[#2563EB]" onClick={() => setForgotOpen(true)}>
              Forgot Password?
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2563EB] py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="mb-2 font-semibold text-slate-600">Demo accounts — click to sign in</p>
            <div className="flex flex-wrap gap-1.5">
              {staff
                .filter((s) => ['eyuel', 'selamawit', 'hirut', 'yonas'].includes(s.username))
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true)
                      setError('')
                      const err = await login(s.username, s.password || 'clinic123', true)
                      setLoading(false)
                      if (!err) navigate(homeFor(s.role))
                      else setError(err)
                    }}
                    className="rounded-full bg-white px-2.5 py-1 font-medium text-[#2563EB] ring-1 ring-slate-200 hover:ring-[#2563EB] disabled:opacity-50"
                  >
                    {s.username}
                  </button>
                ))}
            </div>
          </div>
        </form>
        <div className="bg-slate-50 px-8 py-3 text-center text-xs text-slate-500">
          <Info className="mr-1 inline h-3.5 w-3.5" />
          Authorized personnel only.
        </div>
      </div>
      <p className="relative mt-8 text-xs text-slate-400">
        © 2026 Lewi Dental Clinic | Powered by {clinic.poweredBy}
      </p>
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)}>
        <ModalHeader title="Reset password" subtitle="IT will send a temporary password to your clinic email." onClose={() => setForgotOpen(false)} />
        <div className="space-y-3 px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-slate-700">Username</span>
            <input
              value={resetUser}
              onChange={(e) => setResetUser(e.target.value)}
              placeholder="e.g. hirut"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setForgotOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const found = staff.find((s) => s.username === resetUser.trim().toLowerCase())
              notify(
                found
                  ? `Reset link sent to ${found.email}. Demo password is still clinic123.`
                  : 'If that username exists, a reset email was sent.',
              )
              setForgotOpen(false)
              setResetUser('')
            }}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Send reset
          </button>
        </div>
      </Modal>
    </div>
  )
}
