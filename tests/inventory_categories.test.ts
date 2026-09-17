import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://127.0.0.1:5000'

describe('Sprint 5B: Hybrid Hierarchical Inventory Categories', () => {
  let token: string

  beforeAll(async () => {
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

  it('GET /api/inventory/categories returns centralized category tree with nested children', async () => {
    const res = await fetch(`${API_BASE}/api/inventory/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.categories)).toBe(true)

    // Check that Orthodontics exists and has nested children
    const ortho = body.categories.find((c: any) => c.id === 'ortho')
    expect(ortho).toBeDefined()
    expect(ortho.name).toBe('Orthodontics (Braces)')
    expect(Array.isArray(ortho.children)).toBe(true)

    // Check level 2 and level 3 nesting (Archwires -> NiTi Round)
    const archwires = ortho.children.find((c: any) => c.id === 'ortho-wires')
    expect(archwires).toBeDefined()
    expect(archwires.name).toBe('Archwires')
    expect(archwires.children.some((c: any) => c.name === 'NiTi Round')).toBe(true)
  })

  it('POST /api/inventory/categories/nodes creates a custom subcategory on the fly', async () => {
    const res = await fetch(`${API_BASE}/api/inventory/categories/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        parentId: 'ortho-brackets',
        name: 'Ceramic Aesthetic Brackets',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.node).toBeDefined()
    expect(body.node.name).toBe('Ceramic Aesthetic Brackets')

    // Verify it now exists in the category tree
    const getRes = await fetch(`${API_BASE}/api/inventory/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const getBody = await getRes.json()
    const ortho = getBody.categories.find((c: any) => c.id === 'ortho')
    const brackets = ortho.children.find((c: any) => c.id === 'ortho-brackets')
    expect(brackets.children.some((c: any) => c.name === 'Ceramic Aesthetic Brackets')).toBe(true)
  })

  it('POST /api/inventory/items creates an item with categoryPath and attributes JSONB', async () => {
    const uniqueSku = `BRK-CER-${Date.now().toString().slice(-4)}`
    const res = await fetch(`${API_BASE}/api/inventory/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Clarity Advanced Ceramic Brackets (0.022 Upper)',
        sku: uniqueSku,
        qty: 12,
        unit: 'kits',
        minQty: 4,
        unitCost: 2800,
        location: 'Operatory 2 (Ortho)',
        categoryId: 'ortho-brackets',
        categoryPath: ['Orthodontics (Braces)', 'Brackets', 'Ceramic Aesthetic Brackets'],
        attributes: {
          slot: '0.022',
          material: 'Polycrystalline Alumina',
          translucent: true,
        },
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.item.name).toBe('Clarity Advanced Ceramic Brackets (0.022 Upper)')
    expect(body.item.sku).toBe(uniqueSku)
    expect(body.item.categoryPath).toContain('Orthodontics (Braces)')
    expect(body.item.categoryPath).toContain('Brackets')
    expect(body.item.attributes.slot).toBe('0.022')
    expect(body.item.attributes.translucent).toBe(true)
  })

  it('GET /api/inventory/items?category=ortho returns items across all orthodontic subcategories', async () => {
    const res = await fetch(`${API_BASE}/api/inventory/items?category=ortho`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBeGreaterThanOrEqual(3)

    // Should include wires, brackets, and power chains
    const names = body.items.map((i: any) => i.name)
    expect(names.some((n: string) => n.includes('Archwire'))).toBe(true)
    expect(names.some((n: string) => n.includes('Brackets'))).toBe(true)
    expect(names.some((n: string) => n.includes('Power Chain'))).toBe(true)
  })

  it('GET /api/inventory/items?category=ortho-wires-niti filters specifically to NiTi wires', async () => {
    const res = await fetch(`${API_BASE}/api/inventory/items?category=ortho-wires-niti`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items.length).toBeGreaterThanOrEqual(1)
    expect(body.items.every((i: any) => i.name.includes('NiTi'))).toBe(true)
  })
})
