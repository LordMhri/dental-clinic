import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  Package,
  BarChart3,
  UserCog,
  Settings,
  LifeBuoy,
  LogOut,
  Plus,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useClinic } from '../../context/ClinicContext'

import type { ClinicModule } from '../../types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  module?: ClinicModule
}

const allItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users, module: 'patients' },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays, module: 'scheduling' },
  { to: '/treatments', label: 'Treatments', icon: Stethoscope, module: 'clinical' },
  { to: '/billing', label: 'Billing', icon: Receipt, module: 'billing' },
  { to: '/inventory', label: 'Inventory', icon: Package, module: 'inventory' },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: UserCog },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { clinic, isModuleEnabled, setBookOpen, logout } = useClinic()
  const navigate = useNavigate()

  const items = allItems.filter((item) => !item.module || isModuleEnabled(item.module))

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-slate-200 bg-[#F7F9FC] py-5 transition-[width] duration-200 ${
        collapsed ? 'w-[76px] px-2' : 'w-[248px] px-4'
      }`}
    >
      <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3c-2.2 1.6-3.5 3.6-3.8 6-.4 3.2.6 6.2 2.2 9.2.5 1 1.1 1.8 1.6 1.8s1.1-.8 1.6-1.8c1.6-3 2.6-6 2.2-9.2C15.5 6.6 14.2 4.6 12 3Z" />
            <path d="M10 11.5c.6.8 1.3 1.2 2 1.2s1.4-.4 2-1.2" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold leading-tight text-slate-800" title={clinic?.name}>
              {clinic?.name || 'Dental Clinic'}
            </div>
            {clinic?.tagline && (
              <div className="truncate text-[11px] text-slate-400" title={clinic.tagline}>
                {clinic.tagline}
              </div>
            )}
          </div>
        )}
      </div>

      {isModuleEnabled('scheduling') && (
        <button
          type="button"
          onClick={() => setBookOpen(true)}
          title="Book Appointment"
          className={`mb-5 flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8] ${
            collapsed ? 'px-0' : 'w-full px-3'
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && 'Book Appointment'}
        </button>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onToggle}
          title="Collapse"
          className={`mt-1 flex items-center rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4 shrink-0" /> : <ChevronsLeft className="h-4 w-4 shrink-0" />}
          {!collapsed && 'Collapse'}
        </button>
      </nav>

      <div className="mt-3 border-t border-slate-200 pt-3">
        <NavLink
          to="/support"
          title="Support"
          className={({ isActive }) =>
            `flex items-center rounded-xl py-2.5 text-sm font-medium ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-3'
            } ${isActive ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-white'}`
          }
        >
          <LifeBuoy className="h-4 w-4 shrink-0" />
          {!collapsed && 'Support'}
        </NavLink>
        <button
          type="button"
          title="Logout"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}
