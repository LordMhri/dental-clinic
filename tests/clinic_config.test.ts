import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://127.0.0.1:5000'

describe('Clinic Customization & Dynamic Module Configuration', () => {
  let adminToken: string
  let cashierToken: string

  beforeAll(async () => {
    // Authenticate as Admin (Dr. Eyuel)
    const adminRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'eyuel',
        password: 'clinic123',
      }),
    })
    const adminBody = await adminRes.json()
    adminToken = adminBody.token

    // Authenticate as Cashier (Salem)
    const cashierRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'salem',
        password: 'clinic123',
      }),
    })
    const cashierBody = await cashierRes.json()
    cashierToken = cashierBody.token
  })

  it('GET /api/clinic/profile returns clinic profile or null', async () => {
    const res = await fetch(`${API_BASE}/api/clinic/profile`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect('profile' in body).toBe(true)
  })

  it('PUT /api/clinic/profile allows administrator to update clinic branding and active modules', async () => {
    const res = await fetch(`${API_BASE}/api/clinic/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Bole Smile Dental Clinic',
        tagline: 'Precision Dentistry in Addis Ababa',
        location: 'Bole Medhanealem, Suite 402',
        phone: '+251 922 889 900',
        tinNumber: '0098412039',
        workingHours: 'Mon–Sat · 8:30 AM – 6:30 PM',
        currency: 'ETB',
        enabledModules: ['patients', 'clinical', 'billing'],
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.profile.name).toBe('Bole Smile Dental Clinic')
    expect(body.profile.tagline).toBe('Precision Dentistry in Addis Ababa')
    expect(body.profile.tinNumber).toBe('0098412039')
    expect(Array.isArray(body.profile.enabledModules)).toBe(true)
    expect(body.profile.enabledModules).toEqual(['patients', 'clinical', 'billing'])
  })

  it('GET /api/clinic/profile returns the newly updated clinic profile and module flags', async () => {
    const res = await fetch(`${API_BASE}/api/clinic/profile`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.profile.name).toBe('Bole Smile Dental Clinic')
    expect(body.profile.enabledModules).toContain('patients')
    expect(body.profile.enabledModules).toContain('billing')
    expect(body.profile.enabledModules).not.toContain('inventory')
  })

  it('PUT /api/clinic/profile blocks non-admin staff from altering configuration (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/api/clinic/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Change',
        enabledModules: ['patients'],
      }),
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('Only clinic administrators')
  })

  it('PUT /api/clinic/profile validates input (requires name and at least one module, HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/api/clinic/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: '',
        enabledModules: [],
      }),
    })

    expect(res.status).toBe(400)
  })
})
