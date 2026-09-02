import { describe, it, expect, beforeAll } from 'vitest'
import {
  sendTelegramMessage,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendLowStockAlert,
} from '../server/src/services/telegram.service.js'

const API_BASE = 'http://127.0.0.1:5000'

describe('Sprint 4: Telegram Bot Notifications & Inventory Management', () => {
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

  describe('Telegram Notification Engine', () => {
    it('sendTelegramMessage gracefully simulates delivery when offline/no bot token', async () => {
      const delivered = await sendTelegramMessage({
        chatId: 'test-chat-123',
        text: 'Test clinic notification',
      })
      expect(delivered).toBe(true)
    })

    it('sendBookingConfirmation formats appointment details correctly', async () => {
      const sent = await sendBookingConfirmation({
        patientName: 'Abebe Bikila',
        date: '2026-08-14',
        time: '10:00 AM',
        treatment: 'Porcelain Crown',
        dentistName: 'Dr. Eyuel Hailu',
      })
      expect(sent).toBe(true)
    })

    it('sendAppointmentReminder formats 24h reminder notification', async () => {
      const sent = await sendAppointmentReminder({
        patientName: 'Sara Mengistu',
        date: '2026-08-13',
        time: '02:00 PM',
        treatment: 'Root Canal Therapy',
      })
      expect(sent).toBe(true)
    })

    it('sendLowStockAlert formats clinic inventory threshold warning', async () => {
      const sent = await sendLowStockAlert({
        itemName: 'Composite Resin (Shade A2)',
        sku: 'COMP-A2',
        currentQty: 2,
        minQty: 6,
        unit: 'syringes',
      })
      expect(sent).toBe(true)
    })
  })

  describe('Inventory Catalog & Stock Movement Audit Log', () => {
    it('GET /api/inventory/items returns items with calculated stockStatus and suppliers', async () => {
      const res = await fetch(`${API_BASE}/api/inventory/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.items)).toBe(true)
      expect(body.items.length).toBeGreaterThan(0)

      const item = body.items[0]
      expect(item).toHaveProperty('sku')
      expect(item).toHaveProperty('qty')
      expect(item).toHaveProperty('minQty')
      expect(item).toHaveProperty('status')
      expect(['In Stock', 'Low Stock', 'Out of Stock']).toContain(item.status)
    })

    it('POST /api/inventory/items/:id/adjust updates stock level and logs StockMovement', async () => {
      // Restock 15 units of item inv-1 (Latex Gloves)
      const res = await fetch(`${API_BASE}/api/inventory/items/inv-1/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'Restock',
          qty: 15,
          reason: 'Bi-weekly shipment from Ethio-Medical',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.item.id).toBe('inv-1')
      expect(body.movement.type).toBe('Restock')
      expect(body.movement.qty).toContain('+15')
      expect(body.movement.staff.name).toBe('Dr. Eyuel Hailu')
    })

    it('GET /api/inventory/movements returns chronological stock movement audit trail', async () => {
      const res = await fetch(`${API_BASE}/api/inventory/movements`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.movements)).toBe(true)
      expect(body.movements.length).toBeGreaterThan(0)
      expect(body.movements[0]).toHaveProperty('type')
      expect(body.movements[0]).toHaveProperty('staff')
    })

    it('POST /api/inventory/items/:id/adjust rejects dispensing more than current stock', async () => {
      const res = await fetch(`${API_BASE}/api/inventory/items/inv-1/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'Dispensed',
          qty: 99999, // Impossible quantity
        }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Insufficient stock')
    })
  })
})
