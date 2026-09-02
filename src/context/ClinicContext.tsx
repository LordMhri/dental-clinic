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
  operatoryId?: string
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
  bookAppointment: (payload: BookPayload) => Promise<string | null>
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, patch: Partial<Patient>) => void
  processPayment: (invoiceId: string, amount: number, method: PaymentMethod, referenceNumber?: string) => Promise<void>
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void
  rescheduleAppointment: (id: string, date: string, time: string) => void
  createInvoice: (payload: { patientId: string; treatment: string; total: number }) => Invoice
  refreshAppointments: () => Promise<void>
  refreshInvoices: () => Promise<void>
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

  const refreshAppointments = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/scheduling/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.appointments) setAppointments(data.appointments)
      }
    } catch {}
  }, [token])

  const refreshInvoices = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/billing/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.invoices) setInvoices(data.invoices)
      }
    } catch {}
  }, [token])

  useEffect(() => {
    if (token) {
      refreshAppointments()
      refreshInvoices()
    }
  }, [token, refreshAppointments, refreshInvoices])

  const bookAppointment = useCallback(
    async (payload: BookPayload): Promise<string | null> => {
      if (token) {
        try {
          const res = await fetch('/api/scheduling/appointments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
          const data = await res.json()
          if (!res.ok) {
            return data.error || 'Failed to book appointment'
          }
          setAppointments((prev) => [data.appointment, ...prev])
          return null
        } catch {
          return 'Network error when booking appointment'
        }
      }
      // Offline fallback
      const id = `ap-${Date.now()}`
      const next: Appointment = {
        id,
        patientId: payload.patientId,
        dentistId: payload.dentistId,
        operatoryId: payload.operatoryId,
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
      return null
    },
    [token],
  )

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => [patient, ...prev])
  }, [])

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const processPayment = useCallback(
    async (invoiceId: string, amount: number, method: PaymentMethod, referenceNumber?: string) => {
      if (token) {
        try {
          const res = await fetch(`/api/billing/invoices/${invoiceId}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ amount, method, referenceNumber }),
          })
          if (res.ok) {
            const data = await res.json()
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv)),
            )
            return
          }
        } catch {}
      }
      // Offline fallback
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv
          const paid = Math.min(inv.total, inv.paid + amount)
          const status = paid >= inv.total ? 'Paid' : paid > 0 ? 'Partial' : inv.status
          return { ...inv, paid, status, method }
        }),
      )
    },
    [token],
  )

  const updateAppointmentStatus = useCallback(
    async (id: string, status: Appointment['status']) => {
      if (token) {
        try {
          await fetch(`/api/scheduling/appointments/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          })
        } catch {}
      }
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    },
    [token],
  )

  const rescheduleAppointment = useCallback(
    async (id: string, date: string, time: string) => {
      if (token) {
        try {
          await fetch(`/api/scheduling/appointments/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ date, time }),
          })
        } catch {}
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, date, time, endTime: time, status: 'Scheduled' } : a)),
      )
    },
    [token],
  )

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
      refreshAppointments,
      refreshInvoices,
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
      setBookOpen,
      bookAppointment,
      addPatient,
      updatePatient,
      processPayment,
      updateAppointmentStatus,
      rescheduleAppointment,
      createInvoice,
      refreshAppointments,
      refreshInvoices,
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
