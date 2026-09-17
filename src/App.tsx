import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClinicProvider } from './context/ClinicContext'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { DentistDashboard } from './pages/DentistDashboard'
import { ReceptionDashboard } from './pages/ReceptionDashboard'
import { CashierDashboard } from './pages/CashierDashboard'
import { Patients } from './pages/Patients'
import { Appointments } from './pages/Appointments'
import { Treatments } from './pages/Treatments'
import { Billing } from './pages/Billing'
import { ProcessPayment } from './pages/ProcessPayment'
import { Inventory } from './pages/Inventory'
import { Reports } from './pages/Reports'
import { Users } from './pages/Users'
import { Settings } from './pages/Settings'
import { Support } from './pages/Support'
import { PatientProfile } from './pages/PatientProfile'
import { ModuleRouteGuard } from './components/ModuleRouteGuard'
import { ToastHost } from './components/ui/Toast'

export default function App() {
  return (
    <ClinicProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dentist" element={<DentistDashboard />} />
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/cashier" element={<CashierDashboard />} />
          </Route>
          <Route element={<AppLayout searchPlaceholder="Search patients, invoices..." />}>
            <Route element={<ModuleRouteGuard module="patients" />}>
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:patientId" element={<PatientProfile />} />
            </Route>
            <Route element={<ModuleRouteGuard module="scheduling" />}>
              <Route path="/appointments" element={<Appointments />} />
            </Route>
            <Route element={<ModuleRouteGuard module="clinical" />}>
              <Route path="/treatments" element={<Treatments />} />
            </Route>
            <Route element={<ModuleRouteGuard module="billing" />}>
              <Route path="/billing" element={<Billing />} />
              <Route path="/billing/pay/:invoiceId" element={<ProcessPayment />} />
            </Route>
            <Route element={<ModuleRouteGuard module="inventory" />}>
              <Route path="/inventory" element={<Inventory />} />
            </Route>
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastHost />
      </BrowserRouter>
    </ClinicProvider>
  )
}
