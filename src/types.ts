export type Role = 'admin' | 'dentist' | 'reception' | 'cashier' | 'nurse'

export type PatientStatus = 'Active' | 'Follow-up Due' | 'Inactive'
export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked-in'
  | 'In Progress'
  | 'Completed'
  | 'Delayed'
  | 'No-Show'
  | 'Cancelled'
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partial' | 'Overdue'
export type PaymentMethod = 'Cash' | 'Transfer'
export type StockMoveType = 'Restock' | 'Dispensed' | 'Disposed'

export type ScopeDomain = 'patients' | 'clinical' | 'scheduling' | 'billing' | 'inventory'
export type ScopeLevel = 'none' | 'read' | 'own' | 'all'

export type ClinicModule = 'patients' | 'clinical' | 'scheduling' | 'billing' | 'inventory'

export interface ClinicProfile {
  id?: string
  name: string
  tagline?: string | null
  location?: string | null
  phone?: string | null
  tinNumber?: string | null
  workingHours?: string | null
  currency?: string | null
  enabledModules: ClinicModule[]
  updatedAt?: string
}

export interface Staff {
  id: string
  name: string
  role: Role
  title: string
  email: string
  phone: string
  username: string
  password?: string
  initials: string
  scopes?: Record<ScopeDomain, ScopeLevel>
}

export interface Patient {
  id: string
  name: string
  initials: string
  gender: 'M' | 'F'
  age: number
  phone: string
  email: string
  registered: string
  lastVisit: string
  status: PatientStatus
  allergy?: string
  treatment?: string
  notes?: string
  address?: string
}

export interface Appointment {
  id: string
  patientId: string
  dentistId: string
  operatoryId?: string
  date: string
  time: string
  endTime: string
  durationMins: number
  treatment: string
  tooth?: string
  status: AppointmentStatus
  notes?: string
  emergency?: boolean
  patient?: { id: string; name: string; phone?: string; allergy?: string }
  dentist?: { id: string; name: string; role?: string }
  operatory?: { id: string; name: string; type?: string }
}

export interface Invoice {
  id: string
  patientId: string
  treatment: string
  date: string
  total: number
  paid: number
  status: InvoiceStatus
  method?: PaymentMethod
  transferChannel?: string | null
  time?: string
  payments?: Payment[]
  patient?: Patient
}

export interface Payment {
  id: string
  invoiceId: string
  cashierId: string
  amount: number
  method: PaymentMethod
  transferChannel?: string | null
  referenceNumber?: string | null
  notes?: string | null
  paidAt?: string
  cashier?: { id: string; name: string }
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  qty: number
  unit: string
  minQty: number
  expiry?: string
  location: string
  supplier: string
}

export interface StockMovement {
  id: string
  itemName: string
  type: StockMoveType
  qty: string
  at: string
  user: string
}

export interface TreatmentRecord {
  id: string
  patientId: string
  date: string
  procedure: string
  toothNumber?: number | null
  surfaces?: string | null
  notes: string
  dentist?: string | { id: string; name: string }
  fee?: number
  status?: string
}

export interface Activity {
  id: string
  text: string
  time: string
  tone: 'blue' | 'green' | 'purple'
}
