import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, ChevronDown, Clock, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useClinic } from '../../context/ClinicContext'
import { todayLabel } from '../../lib/format'
import { Avatar } from '../ui/Avatar'

export function Header({
  searchPlaceholder,
  title,
  onMenuClick,
}: {
  searchPlaceholder?: string
  title?: string
  onMenuClick?: () => void
}) {
  const { user, logout, notify } = useClinic()
  const navigate = useNavigate()
  const shortName = user?.name.replace('Dr. ', '') ?? 'Staff'
  const [query, setQuery] = useState('')
  const [bellOpen, setBellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setBellOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function search(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      navigate('/patients')
      return
    }
    navigate(`/patients?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
        {title ? (
          <h1 className="truncate text-lg font-semibold text-[#2563EB]">{title}</h1>
        ) : (
          <form onSubmit={search} className="relative w-[420px] max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white"
              placeholder={searchPlaceholder ?? 'Search patients, invoices...'}
            />
          </form>
        )}
        </div>
      </div>
      <div className="flex items-center gap-3" ref={wrap}>
        <span className="hidden text-sm text-slate-500 md:inline">{todayLabel()}</span>
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Today's schedule"
        >
          <Clock className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBellOpen((v) => !v)
              setMenuOpen(false)
            }}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          {bellOpen && (
            <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
              <div className="mb-2 text-sm font-semibold text-slate-800">Notifications</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    className="w-full rounded-lg p-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/inventory')
                    }}
                  >
                    <div className="font-medium text-slate-800">Low stock: Latex Gloves (M)</div>
                    <div className="text-xs text-slate-400">2 boxes left · Order supplies</div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full rounded-lg p-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/billing')
                    }}
                  >
                    <div className="font-medium text-slate-800">Unpaid invoice INV-2026-089</div>
                    <div className="text-xs text-slate-400">Abebe Bikila · ETB 4,500.00</div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full rounded-lg p-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/appointments')
                    }}
                  >
                    <div className="font-medium text-slate-800">Hanna Bekele is delayed</div>
                    <div className="text-xs text-slate-400">2:00 PM composite restoration</div>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v)
              setBellOpen(false)
            }}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50"
          >
            <Avatar initials={user?.initials ?? 'LD'} size="sm" />
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              {user?.role === 'reception' ? 'Reception' : shortName}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
              <button type="button" className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setMenuOpen(false); navigate('/dashboard') }}>
                Admin dashboard
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setMenuOpen(false); navigate('/dentist') }}>
                Dentist view
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setMenuOpen(false); navigate('/reception') }}>
                Reception desk
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setMenuOpen(false); navigate('/cashier') }}>
                Cashier desk
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setMenuOpen(false); navigate('/settings') }}>
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  logout()
                  notify('Signed out.')
                  navigate('/login')
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
