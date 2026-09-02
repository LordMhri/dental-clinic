import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://127.0.0.1:5000'

describe('Sprint 3: Operatory Scheduling & Cashier Desk Reconciliation', () => {
  let token: string

  beforeAll(async () => {
    // Authenticate as Dr. Eyuel
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'eyuel',
        password: 'clinic123',
      }),
    })
    const body = await res.json()
    token = body.token
  })

  describe('Operatory Chair Scheduling & Conflict Prevention', () => {
    it('GET /api/scheduling/operatories returns active dental chairs', async () => {
      const res = await fetch(`${API_BASE}/api/scheduling/operatories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.operatories)).toBe(true)
      expect(body.operatories.length).toBeGreaterThanOrEqual(3)

      const names = body.operatories.map((o: { name: string }) => o.name)
      expect(names.some((n: string) => n.includes('Chair 1'))).toBe(true)
      expect(names.some((n: string) => n.includes('Chair 2'))).toBe(true)
      expect(names.some((n: string) => n.includes('Hygiene'))).toBe(true)
    })

    it('GET /api/scheduling/appointments retrieves schedule with chair and patient info', async () => {
      const res = await fetch(`${API_BASE}/api/scheduling/appointments?date=2026-08-12`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.appointments)).toBe(true)
      expect(body.appointments.length).toBeGreaterThan(0)
    })

    it('POST /api/scheduling/appointments detects and blocks double-booking conflicts on same chair (HTTP 409)', async () => {
      // Hanna Bekele is booked on Chair 1 (op-1) from 02:00 PM to 02:45 PM
      const res = await fetch(`${API_BASE}/api/scheduling/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: 'PT-8421',
          dentistId: 'st-2',
          operatoryId: 'op-1',
          date: '2026-08-12',
          time: '02:15 PM', // Overlaps with 02:00 PM - 02:45 PM
          durationMins: 30,
          treatment: 'Scaling & Polishing',
        }),
      })

      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toContain('Chair conflict')
    })
  })

  describe('Ethiopian Cashier Desk & Register Reconciliation', () => {
    it('GET /api/billing/invoices returns billing ledger with patient details', async () => {
      const res = await fetch(`${API_BASE}/api/billing/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.invoices)).toBe(true)
      expect(body.invoices.length).toBeGreaterThan(0)
    })

    it('POST /api/billing/cash-drawer/open allows cashier to open register with float cash', async () => {
      // If a session is open from earlier test, close it first
      await fetch(`${API_BASE}/api/billing/cash-drawer/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ countedCash: 5000 }),
      })

      const res = await fetch(`${API_BASE}/api/billing/cash-drawer/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          openingCash: 7500,
          notes: 'Test morning register float',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.session.status).toBe('Open')
      expect(body.session.openingCash).toBe(7500)
      expect(body.session.expectedCash).toBe(7500)
    })

    it('POST /api/billing/cash-drawer/close reconciles physical count and calculates discrepancy', async () => {
      const res = await fetch(`${API_BASE}/api/billing/cash-drawer/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countedCash: 7500,
          notes: 'Shift end physical count matches expected cash',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.session.status).toBe('Closed')
      expect(body.discrepancy).toBe(0)
    })
  })
})
