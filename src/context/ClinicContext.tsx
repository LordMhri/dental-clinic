import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  token: string | null
  login: (username: string, password: string, remember: boolean) => Promise<string | null>
  logout: () => void
  switchUser: (staffId: string) => Promise<void>
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

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('lewi-token')
    } catch {
      return null
    }
  })
  const [user, setUser] = useState<Staff | null>(null)
  const [patients, setPatients] = useState(seedPatients)
  const [appointments, setAppointments] = useState(seedAppointments)
  const [invoices, setInvoices] = useState(seedInvoices)
  const [bookOpen, setBookOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore authenticated session on mount
  useEffect(() => {
    if (!token) {
      // Check legacy local storage fallback
      const rememberedId = localStorage.getItem('lewi-user')
      if (rememberedId) {
        const found = staff.find((s) => s.id === rememberedId)
        if (found) setUser(found)
      }
      return
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        } else {
          setUser(null)
          setToken(null)
          localStorage.removeItem('lewi-token')
        }
      })
      .catch(() => {
        // Fallback to legacy remembered user if offline
        const rememberedId = localStorage.getItem('lewi-user')
        if (rememberedId) {
          const found = staff.find((s) => s.id === rememberedId)
          if (found) setUser(found)
        }
      })
  }, [token])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const login = useCallback(async (username: string, password: string, remember: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return data.error || 'Invalid username or password.'
      }

      setUser(data.user)
      setToken(data.token)
      if (remember) {
        localStorage.setItem('lewi-token', data.token)
        localStorage.setItem('lewi-user', data.user.id)
      } else {
        localStorage.removeItem('lewi-token')
        localStorage.removeItem('lewi-user')
      }
      return null
    } catch {
      // Offline fallback
      const found = staff.find(
        (s) => s.username === username.trim().toLowerCase() && s.password === password,
      )
      if (!found) return 'Invalid username or password.'
      setUser(found)
      if (remember) localStorage.setItem('lewi-user', found.id)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {}
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('lewi-token')
    localStorage.removeItem('lewi-user')
  }, [token])

  const switchUser = useCallback(
    async (staffId: string) => {
      const target = staff.find((s) => s.id === staffId)
      if (target) {
        await login(target.username, 'clinic123', true)
      }
    },
    [login],
  )

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
      token,
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
      token,
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
