import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  appointments as seedAppointments,
  invoices as seedInvoices,
  patients as seedPatients,
  staff,
} from '../data/mock'
import type {
  Appointment,
  Invoice,
  Patient,
  PaymentMethod,
  Staff,
} from '../types'

interface BookPayload {
  patientId: string
  dentistId: string
  date: string
  time: string
  treatment: string
  notes?: string
  emergency?: boolean
}

interface ClinicContextValue {
  user: Staff | null
  login: (username: string, password: string, remember: boolean) => string | null
  logout: () => void
  switchUser: (staffId: string) => void
  patients: Patient[]
  appointments: Appointment[]
  invoices: Invoice[]
  bookOpen: boolean
  setBookOpen: (open: boolean) => void
  bookAppointment: (payload: BookPayload) => void
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, patch: Partial<Patient>) => void
  processPayment: (invoiceId: string, amount: number, method: PaymentMethod) => void
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void
  rescheduleAppointment: (id: string, date: string, time: string) => void
  createInvoice: (payload: { patientId: string; treatment: string; total: number }) => Invoice
  toast: string | null
  notify: (message: string) => void
}

const ClinicContext = createContext<ClinicContextValue | null>(null)

const remembered = (() => {
  try {
    const id = localStorage.getItem('lewi-user')
    return staff.find((s) => s.id === id) ?? null
  } catch {
    return null
  }
})()

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(remembered)
  const [patients, setPatients] = useState(seedPatients)
  const [appointments, setAppointments] = useState(seedAppointments)
  const [invoices, setInvoices] = useState(seedInvoices)
  const [bookOpen, setBookOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const login = useCallback((username: string, password: string, remember: boolean) => {
    const found = staff.find(
      (s) => s.username === username.trim().toLowerCase() && s.password === password,
    )
    if (!found) return 'Invalid username or password.'
    setUser(found)
    if (remember) localStorage.setItem('lewi-user', found.id)
    else localStorage.removeItem('lewi-user')
    return null
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('lewi-user')
  }, [])

  const switchUser = useCallback((staffId: string) => {
    const found = staff.find((s) => s.id === staffId)
    if (found) {
      setUser(found)
      localStorage.setItem('lewi-user', found.id)
    }
  }, [])

  const bookAppointment = useCallback((payload: BookPayload) => {
    const id = `ap-${Date.now()}`
    const next: Appointment = {
      id,
      patientId: payload.patientId,
      dentistId: payload.dentistId,
      date: payload.date,
      time: payload.time,
      endTime: payload.time,
      durationMins: payload.emergency ? 30 : 45,
      treatment: payload.treatment,
      status: payload.emergency ? 'Confirmed' : 'Scheduled',
      notes: payload.notes,
      emergency: payload.emergency,
    }
    setAppointments((prev) => [next, ...prev])
  }, [])

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => [patient, ...prev])
  }, [])

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const processPayment = useCallback(
    (invoiceId: string, amount: number, method: PaymentMethod) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv
          const paid = Math.min(inv.total, inv.paid + amount)
          const status = paid >= inv.total ? 'Paid' : paid > 0 ? 'Partial' : inv.status
          return { ...inv, paid, status, method }
        }),
      )
    },
    [],
  )

  const updateAppointmentStatus = useCallback((id: string, status: Appointment['status']) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const rescheduleAppointment = useCallback((id: string, date: string, time: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date, time, endTime: time, status: 'Scheduled' } : a)),
    )
  }, [])

  const createInvoice = useCallback(
    (payload: { patientId: string; treatment: string; total: number }) => {
      const next: Invoice = {
        id: `INV-2026-${100 + Math.floor(Math.random() * 800)}`,
        patientId: payload.patientId,
        treatment: payload.treatment,
        date: 'Aug 12, 2026',
        total: payload.total,
        paid: 0,
        status: 'Unpaid',
      }
      setInvoices((prev) => [next, ...prev])
      return next
    },
    [],
  )

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      switchUser,
      patients,
      appointments,
      invoices,
      bookOpen,
      setBookOpen,
      bookAppointment,
      addPatient,
      updatePatient,
      processPayment,
      updateAppointmentStatus,
      rescheduleAppointment,
      createInvoice,
      toast,
      notify,
    }),
    [
      user,
      login,
      logout,
      switchUser,
      patients,
      appointments,
      invoices,
      bookOpen,
      bookAppointment,
      addPatient,
      updatePatient,
      processPayment,
      updateAppointmentStatus,
      rescheduleAppointment,
      createInvoice,
      toast,
      notify,
    ],
  )

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export function useClinic() {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider')
  return ctx
}
