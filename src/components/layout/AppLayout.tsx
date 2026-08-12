import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useClinic } from '../../context/ClinicContext'
import { BookAppointmentModal } from '../BookAppointmentModal'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const stored = () => {
  try {
    return localStorage.getItem('lewi-sidebar') === 'collapsed'
  } catch {
    return false
  }
}

export function AppLayout({ searchPlaceholder, title }: { searchPlaceholder?: string; title?: string }) {
  const { user } = useClinic()
  const [collapsed, setCollapsed] = useState(stored)

  if (!user) return <Navigate to="/login" replace />

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('lewi-sidebar', next ? 'collapsed' : 'open')
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header searchPlaceholder={searchPlaceholder} title={title} onMenuClick={toggle} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <BookAppointmentModal />
    </div>
  )
}
