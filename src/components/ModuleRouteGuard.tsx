import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useClinic } from '../context/ClinicContext'
import type { ClinicModule } from '../types'

const MODULE_NAMES: Record<ClinicModule, string> = {
  patients: 'Patient Intake & Records',
  clinical: 'Clinical Charting & Odontogram',
  scheduling: 'Operatory Scheduling',
  billing: 'Billing & Cashier Desk',
  inventory: 'Inventory & Supplies',
}

export function ModuleRouteGuard({
  module,
  children,
}: {
  module: ClinicModule
  children?: React.ReactNode
}) {
  const { isModuleEnabled, notify, user } = useClinic()
  const enabled = isModuleEnabled(module)

  useEffect(() => {
    if (!enabled) {
      notify(`The ${MODULE_NAMES[module]} module is currently disabled for this clinic.`)
    }
  }, [enabled, module, notify])

  if (!enabled) {
    // Redirect user to their role's home view or dashboard
    const fallback =
      user?.role === 'cashier'
        ? '/billing'
        : user?.role === 'dentist'
        ? '/dentist'
        : user?.role === 'reception'
        ? '/reception'
        : '/dashboard'

    // If cashier and billing is disabled, fallback to dashboard
    const target = fallback === '/billing' && !isModuleEnabled('billing') ? '/dashboard' : fallback
    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
