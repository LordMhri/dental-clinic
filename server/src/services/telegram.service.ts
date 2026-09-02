/**
 * Telegram Notification & Reminder Service for Dental Clinic ERP
 * Supports:
 * - 24-hour appointment reminder to patient
 * - Instant booking confirmation
 * - Low-stock inventory alert channel for clinic staff
 * - Simulation / Local Fallback Mode when no BOT_TOKEN is configured
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CLINIC_CHAT_ID = process.env.TELEGRAM_CLINIC_CHAT_ID || ''

export interface SendMessageOptions {
  chatId: string
  text: string
  parseMode?: 'Markdown' | 'HTML'
}

export async function sendTelegramMessage(options: SendMessageOptions): Promise<boolean> {
  const { chatId, text, parseMode = 'HTML' } = options

  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.log(`\n┌────────────────────────────────────────────────────────────┐`)
    console.log(`│ 📨 [Telegram Bot Simulation - Local Offline Mode]         │`)
    console.log(`│ Recipient: ${chatId.padEnd(46)} │`)
    console.log(`├────────────────────────────────────────────────────────────┤`)
    console.log(
      text
        .replace(/<[^>]*>/g, '')
        .split('\n')
        .map((l) => `│ ${l.padEnd(58)} │`)
        .join('\n')
    )
    console.log(`└────────────────────────────────────────────────────────────┘\n`)
    return true
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    })

    const data = (await res.json()) as { ok?: boolean }
    return data.ok === true
  } catch (err) {
    console.error('⚠️ [Telegram] Error sending message:', err)
    return false
  }
}

/**
 * Sends booking confirmation to the patient.
 */
export async function sendBookingConfirmation(params: {
  chatId?: string | null
  patientName: string
  date: string
  time: string
  treatment: string
  dentistName: string
}): Promise<boolean> {
  const targetChatId = params.chatId || 'patient-telegram-demo'
  const message = `
🦷 <b>Lewi Dental Clinic — Appointment Confirmed</b>

Dear <b>${params.patientName}</b>,
Your appointment has been successfully scheduled:

📅 <b>Date:</b> ${params.date}
⏰ <b>Time:</b> ${params.time}
👨‍⚕️ <b>Dentist:</b> ${params.dentistName}
🩺 <b>Procedure:</b> ${params.treatment}
📍 <b>Location:</b> Bole Sub-City, Addis Ababa

<i>Please arrive 10 minutes prior to your scheduled time. To reschedule, contact us at +251 911 123 456.</i>
`.trim()

  return sendTelegramMessage({ chatId: targetChatId, text: message })
}

/**
 * Sends 24-hour appointment reminder to the patient.
 */
export async function sendAppointmentReminder(params: {
  chatId?: string | null
  patientName: string
  date: string
  time: string
  treatment: string
}): Promise<boolean> {
  const targetChatId = params.chatId || 'patient-telegram-demo'
  const message = `
⏰ <b>Friendly Reminder: Dental Visit Tomorrow</b>

Hello <b>${params.patientName}</b>,
This is a quick reminder for your dental appointment tomorrow at <b>Lewi Dental Clinic</b>:

📅 <b>Date:</b> ${params.date}
⏰ <b>Time:</b> ${params.time}
🩺 <b>Procedure:</b> ${params.treatment}

We look forward to seeing you tomorrow! 🦷✨
`.trim()

  return sendTelegramMessage({ chatId: targetChatId, text: message })
}

/**
 * Sends low-stock warning alert to the clinic staff Telegram channel.
 */
export async function sendLowStockAlert(params: {
  itemName: string
  sku: string
  currentQty: number
  minQty: number
  unit: string
}): Promise<boolean> {
  const targetChatId = TELEGRAM_CLINIC_CHAT_ID || 'clinic-staff-inventory-channel'
  const message = `
⚠️ <b>INVENTORY ALERT: LOW STOCK THRESHOLD REACHED</b>

Item: <b>${params.itemName}</b>
SKU: <code>${params.sku}</code>
Current Balance: <b>${params.currentQty} ${params.unit}</b>
Safety Threshold: <b>${params.minQty} ${params.unit}</b>

<i>Please initiate a purchase order with the supplier.</i>
`.trim()

  return sendTelegramMessage({ chatId: targetChatId, text: message })
}
