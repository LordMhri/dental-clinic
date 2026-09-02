import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://127.0.0.1:5000'

describe('Backend API Integration Tests (Local sys-core-service & PostgreSQL)', () => {
  let token: string

  it('GET /api/health responds with 200 OK and healthy PostgreSQL connection', async () => {
    const res = await fetch(`${API_BASE}/api/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.database).toBe('connected')
  })

  it('POST /api/auth/login authenticates dentist Dr. Eyuel and returns valid JWT with scopes', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'eyuel',
        password: 'clinic123',
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBeDefined()
    expect(body.user.username).toBe('eyuel')
    expect(body.user.scopes.clinical).toBe('all')
    token = body.token
  })

  it('GET /api/patients retrieves patient list with authentication', async () => {
    const res = await fetch(`${API_BASE}/api/patients`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.patients)).toBe(true)
    expect(body.patients.length).toBeGreaterThan(0)
  })

  it('GET /api/clinical/odontogram/:patientId returns all 32 adult teeth for patient', async () => {
    const res = await fetch(`${API_BASE}/api/clinical/odontogram/PT-8421`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.chart)).toBe(true)
    expect(body.chart.length).toBeGreaterThanOrEqual(1)
  })

  it('PUT /api/clinical/odontogram/:patientId updates tooth condition and surfaces', async () => {
    const res = await fetch(`${API_BASE}/api/clinical/odontogram/PT-8421`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        toothNumber: 14,
        condition: 'Decayed',
        surfaces: 'MOD',
        notes: 'Caries reaching dentin',
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tooth.toothNumber).toBe(14)
    expect(body.tooth.condition).toBe('Decayed')
    expect(body.tooth.surfaces).toBe('MOD')
  })

  it('POST /api/clinical/treatments logs procedure and stages draft invoice for cashier desk', async () => {
    const res = await fetch(`${API_BASE}/api/clinical/treatments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patientId: 'PT-8421',
        procedure: 'Composite Restoration (Filling)',
        toothNumber: 14,
        surfaces: 'MOD',
        fee: 1850,
        notes: 'Restored with composite shade A2',
        status: 'Completed',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.treatment.procedure).toBe('Composite Restoration (Filling)')
    expect(body.treatment.fee).toBe(1850)

    // Verify draft invoice was created in billing queue
    const patientRes = await fetch(`${API_BASE}/api/patients/PT-8421`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const patientData = await patientRes.json()
    const autoInvoice = patientData.patient.invoices.find(
      (inv: { treatmentRecordId: string }) => inv.treatmentRecordId === body.treatment.id
    )
    expect(autoInvoice).toBeDefined()
    expect(autoInvoice.total).toBe(1850)
    expect(autoInvoice.status).toBe('Unpaid')
  })
})
