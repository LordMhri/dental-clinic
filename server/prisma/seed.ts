import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.dentalChart.deleteMany()
  await prisma.treatmentRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.operatory.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.cashDrawerSession.deleteMany()
  await prisma.staff.deleteMany()

  const defaultPasswordHash = await bcrypt.hash('clinic123', 10)

  // 1. Staff with Scoped RBAC
  const staffData = [
    {
      id: 'st-1',
      name: 'Dr. Eyuel Hailu',
      role: 'admin',
      title: 'Clinic Director',
      email: 'eyuel@lewi.et',
      phone: '+251 911 220 118',
      username: 'eyuel',
      passwordHash: defaultPasswordHash,
      initials: 'EH',
      scopePatients: 'all',
      scopeClinical: 'all',
      scopeScheduling: 'all',
      scopeBilling: 'all',
      scopeInventory: 'all',
    },
    {
      id: 'st-2',
      name: 'Dr. Selamawit Tadesse',
      role: 'dentist',
      title: 'Endodontist',
      email: 'selamawit@lewi.et',
      phone: '+251 911 334 221',
      username: 'selamawit',
      passwordHash: defaultPasswordHash,
      initials: 'ST',
      scopePatients: 'read',
      scopeClinical: 'own',
      scopeScheduling: 'own',
      scopeBilling: 'none',
      scopeInventory: 'read',
    },
    {
      id: 'st-3',
      name: 'Dr. Salem Bekele',
      role: 'dentist',
      title: 'General Dentist',
      email: 'salem@lewi.et',
      phone: '+251 911 445 332',
      username: 'salem',
      passwordHash: defaultPasswordHash,
      initials: 'SB',
      scopePatients: 'read',
      scopeClinical: 'own',
      scopeScheduling: 'own',
      scopeBilling: 'none',
      scopeInventory: 'read',
    },
    {
      id: 'st-4',
      name: 'Hirut Mekonnen',
      role: 'reception',
      title: 'Front Desk',
      email: 'hirut@lewi.et',
      phone: '+251 911 556 443',
      username: 'hirut',
      passwordHash: defaultPasswordHash,
      initials: 'HM',
      scopePatients: 'all',
      scopeClinical: 'none',
      scopeScheduling: 'all',
      scopeBilling: 'read',
      scopeInventory: 'none',
    },
    {
      id: 'st-5',
      name: 'Yonas Girma',
      role: 'cashier',
      title: 'Billing Officer',
      email: 'yonas@lewi.et',
      phone: '+251 911 667 554',
      username: 'yonas',
      passwordHash: defaultPasswordHash,
      initials: 'YG',
      scopePatients: 'read',
      scopeClinical: 'none',
      scopeScheduling: 'read',
      scopeBilling: 'all',
      scopeInventory: 'none',
    },
    {
      id: 'st-6',
      name: 'Nurse Tigist Selam',
      role: 'nurse',
      title: 'Dental Hygienist',
      email: 'tigist@lewi.et',
      phone: '+251 911 778 665',
      username: 'tigist',
      passwordHash: defaultPasswordHash,
      initials: 'TS',
      scopePatients: 'read',
      scopeClinical: 'none',
      scopeScheduling: 'read',
      scopeBilling: 'none',
      scopeInventory: 'all',
    },
  ]

  for (const s of staffData) {
    await prisma.staff.create({ data: s })
  }
  console.log(`✅ Seeded ${staffData.length} staff accounts.`)

  // 2. Operatories (Dental Chairs)
  const operatoryData = [
    { id: 'op-1', name: 'Chair 1 (Operatory A)', type: 'General', isActive: true },
    { id: 'op-2', name: 'Chair 2 (Operatory B)', type: 'Surgery', isActive: true },
    { id: 'op-3', name: 'Hygiene Bay', type: 'Hygiene', isActive: true },
  ]
  for (const op of operatoryData) {
    await prisma.operatory.create({ data: op })
  }
  console.log(`✅ Seeded ${operatoryData.length} operatories.`)

  // 3. Patients
  const patientsData = [
    {
      id: 'PT-8421',
      name: 'Abebe Bikila',
      initials: 'AB',
      gender: 'M',
      age: 42,
      phone: '+251 911 123 456',
      email: 'abebe.bikila@example.com',
      lastVisitDate: 'Aug 10, 2026',
      status: 'Active',
      treatment: 'Root Canal Therapy',
      address: 'Kirkos, Addis Ababa',
      notes: 'Long-standing patient. Completed RCT on 10 Aug 2026. Crown planned. Prefers Amharic. No known drug allergies.',
    },
    {
      id: 'PT-20938',
      name: 'Selamawit Kebede',
      initials: 'SK',
      gender: 'F',
      age: 34,
      phone: '+251 911 234 567',
      email: 'selamawit.k@example.com',
      lastVisitDate: 'Aug 12, 2026',
      status: 'Active',
      treatment: 'Root Canal Consult',
      allergy: 'Penicillin Allergy',
      address: 'Bole Medhanialem, Addis Ababa',
      notes: 'Reports lingering cold sensitivity UL. Penicillin allergy — use clindamycin if needed. Last FMX Feb 2026.',
    },
    {
      id: 'PT-3102',
      name: 'Sara Tadesse',
      initials: 'ST',
      gender: 'F',
      age: 29,
      phone: '+251 922 345 678',
      email: 'sara.tadesse@example.com',
      lastVisitDate: 'Aug 12, 2026',
      status: 'Active',
      treatment: 'Whitening',
      address: 'Piassa, Addis Ababa',
      notes: 'Whitening in progress. Advise against staining foods for 48 hours after each session.',
    },
    {
      id: 'PT-4418',
      name: 'Dawit Alemu',
      initials: 'DA',
      gender: 'M',
      age: 38,
      phone: '+251 911 456 789',
      email: 'dawit.alemu@example.com',
      lastVisitDate: 'Jul 28, 2026',
      status: 'Follow-up Due',
      treatment: 'Crown Fitting',
      address: 'Gerji, Addis Ababa',
      notes: 'Crown try-in pending. Follow-up due after delayed appointment last month.',
    },
    {
      id: 'PT-5520',
      name: 'Hanna Bekele',
      initials: 'HB',
      gender: 'F',
      age: 31,
      phone: '+251 913 567 890',
      email: 'hanna.bekele@example.com',
      lastVisitDate: 'Aug 12, 2026',
      status: 'Active',
      treatment: 'Composite Restoration',
    },
    {
      id: 'PT-6611',
      name: 'Almaz Ayana',
      initials: 'AA',
      gender: 'F',
      age: 27,
      phone: '+251 911 678 901',
      email: 'almaz.ayana@example.com',
      lastVisitDate: 'Aug 11, 2026',
      status: 'Active',
      treatment: 'Root Canal',
    },
    {
      id: 'PT-7723',
      name: 'Tigist Assefa',
      initials: 'TA',
      gender: 'F',
      age: 36,
      phone: '+251 924 789 012',
      email: 'tigist.assefa@example.com',
      lastVisitDate: 'Jun 03, 2026',
      status: 'Follow-up Due',
      treatment: 'Whitening',
    },
    {
      id: 'PT-8834',
      name: 'Mulugeta Tesfaye',
      initials: 'MT',
      gender: 'M',
      age: 51,
      phone: '+251 911 890 123',
      email: 'mulugeta.t@example.com',
      lastVisitDate: 'Aug 08, 2026',
      status: 'Active',
      treatment: 'Consultation',
    },
    {
      id: 'PT-9945',
      name: 'Yohannes Haile',
      initials: 'YH',
      gender: 'M',
      age: 45,
      phone: '+251 911 901 234',
      email: 'yohannes.haile@example.com',
      lastVisitDate: 'Jul 02, 2026',
      status: 'Follow-up Due',
      treatment: 'Extraction',
      allergy: 'Latex Allergy',
      address: 'Megenagna, Addis Ababa',
      notes: 'Post-extraction. Call to remind about analgesics. Use nitrile gloves only.',
    },
  ]

  for (const p of patientsData) {
    await prisma.patient.create({ data: p })
  }
  console.log(`✅ Seeded ${patientsData.length} patients.`)

  // 4. Appointments
  const appointmentsData = [
    {
      id: 'ap-1',
      patientId: 'PT-8834',
      dentistId: 'st-1',
      operatoryId: 'op-1',
      date: '2026-08-12',
      time: '08:00 AM',
      endTime: '08:45 AM',
      durationMins: 45,
      treatment: 'Consultation',
      status: 'Completed',
    },
    {
      id: 'ap-2',
      patientId: 'PT-8421',
      dentistId: 'st-1',
      operatoryId: 'op-1',
      date: '2026-08-12',
      time: '09:00 AM',
      endTime: '09:45 AM',
      durationMins: 45,
      treatment: 'Routine Checkup',
      status: 'Completed',
    },
    {
      id: 'ap-3',
      patientId: 'PT-20938',
      dentistId: 'st-2',
      operatoryId: 'op-2',
      date: '2026-08-12',
      time: '09:00 AM',
      endTime: '10:30 AM',
      durationMins: 90,
      treatment: 'Root Canal Therapy',
      tooth: 'Tooth #14, Upper Left',
      status: 'Confirmed',
      notes: 'Patient reports lingering sensitivity on upper left.',
    },
    {
      id: 'ap-4',
      patientId: 'PT-6611',
      dentistId: 'st-2',
      operatoryId: 'op-2',
      date: '2026-08-12',
      time: '09:30 AM',
      endTime: '10:30 AM',
      durationMins: 60,
      treatment: 'Root Canal',
      status: 'In Progress',
    },
    {
      id: 'ap-5',
      patientId: 'PT-3102',
      dentistId: 'st-1',
      operatoryId: 'op-1',
      date: '2026-08-12',
      time: '10:30 AM',
      endTime: '11:15 AM',
      durationMins: 45,
      treatment: 'Composite Restoration',
      status: 'In Progress',
    },
    {
      id: 'ap-6',
      patientId: 'PT-4418',
      dentistId: 'st-3',
      operatoryId: 'op-2',
      date: '2026-08-12',
      time: '11:15 AM',
      endTime: '12:00 PM',
      durationMins: 45,
      treatment: 'Crown Fitting',
      status: 'Scheduled',
    },
    {
      id: 'ap-7',
      patientId: 'PT-7723',
      dentistId: 'st-3',
      operatoryId: 'op-3',
      date: '2026-08-12',
      time: '11:00 AM',
      endTime: '11:45 AM',
      durationMins: 45,
      treatment: 'Whitening',
      status: 'Scheduled',
    },
    {
      id: 'ap-8',
      patientId: 'PT-5520',
      dentistId: 'st-1',
      operatoryId: 'op-1',
      date: '2026-08-12',
      time: '02:00 PM',
      endTime: '02:45 PM',
      durationMins: 45,
      treatment: 'Composite Restoration',
      status: 'Delayed',
    },
  ]

  for (const a of appointmentsData) {
    await prisma.appointment.create({ data: a })
  }
  console.log(`✅ Seeded ${appointmentsData.length} appointments.`)

  // 5. Treatment Records & Dental Charts
  const treatmentsData = [
    {
      id: 'tr-1',
      patientId: 'PT-20938',
      dentistId: 'st-1',
      date: '2025-08-15',
      procedure: 'Prophylaxis',
      notes: 'Routine cleaning. Light calculus on lower anteriors.',
      fee: 800,
      status: 'Completed',
    },
    {
      id: 'tr-2',
      patientId: 'PT-20938',
      dentistId: 'st-2',
      date: '2026-02-10',
      procedure: 'Comprehensive Exam',
      notes: 'FMX taken. Sensitivity noted on tooth #14.',
      fee: 650,
      status: 'Completed',
    },
    {
      id: 'tr-3',
      patientId: 'PT-8421',
      dentistId: 'st-2',
      date: '2026-08-10',
      procedure: 'Root Canal Therapy',
      toothNumber: 14,
      notes: 'Canal shaping complete. Patient to return for crown.',
      fee: 4500,
      status: 'Completed',
    },
  ]

  for (const tr of treatmentsData) {
    await prisma.treatmentRecord.create({ data: tr })
  }
  console.log(`✅ Seeded ${treatmentsData.length} treatment records.`)

  // 6. Invoices & Payments
  const invoicesData = [
    {
      id: 'INV-2026-089',
      patientId: 'PT-8421',
      treatment: 'Root Canal Therapy',
      date: 'Aug 10, 2026',
      total: 4500,
      paid: 0,
      status: 'Unpaid',
    },
    {
      id: 'INV-2026-090',
      patientId: 'PT-20938',
      treatment: 'Root Canal Consult',
      date: 'Aug 12, 2026',
      total: 2800,
      paid: 0,
      status: 'Unpaid',
    },
    {
      id: 'INV-2026-088',
      patientId: 'PT-6611',
      treatment: 'Root Canal',
      date: 'Aug 12, 2026',
      total: 6200,
      paid: 0,
      status: 'Unpaid',
    },
    {
      id: 'INV-2026-087',
      patientId: 'PT-3102',
      treatment: 'Whitening',
      date: 'Aug 12, 2026',
      total: 1800,
      paid: 1800,
      status: 'Paid',
      method: 'Telebirr',
    },
    {
      id: 'INV-2026-086',
      patientId: 'PT-8834',
      treatment: 'Consultation',
      date: 'Aug 12, 2026',
      total: 650,
      paid: 650,
      status: 'Paid',
      method: 'Cash',
    },
    {
      id: 'INV-2026-084',
      patientId: 'PT-5520',
      treatment: 'Composite Restoration',
      date: 'Aug 09, 2026',
      total: 1950,
      paid: 1000,
      status: 'Partial',
      method: 'Cash',
    },
  ]

  for (const inv of invoicesData) {
    await prisma.invoice.create({ data: inv })
  }

  // Seed one completed payment for INV-2026-087
  await prisma.payment.create({
    data: {
      invoiceId: 'INV-2026-087',
      cashierId: 'st-5',
      amount: 1800,
      method: 'Telebirr',
      referenceNumber: 'TB-99281726',
      notes: 'Telebirr mobile payment confirmation received',
    },
  })
  console.log(`✅ Seeded ${invoicesData.length} invoices with payment history.`)

  // 7. Suppliers & Inventory
  const suppliersData = [
    { id: 'sup-1', initials: 'AP', name: 'Addis Pharmaceuticals', nextDelivery: 'Aug 18, 2026', phone: '+251 11 551 2233' },
    { id: 'sup-2', initials: 'EM', name: 'Ethio-Medical Supplies', nextDelivery: 'Aug 20, 2026', phone: '+251 11 662 3344' },
    { id: 'sup-3', initials: 'AD', name: 'Abyssinia Dental Supply', nextDelivery: 'Aug 22, 2026', phone: '+251 11 440 5566' },
  ]
  for (const sup of suppliersData) {
    await prisma.supplier.create({ data: sup })
  }

  const inventoryData = [
    {
      id: 'inv-1',
      name: 'Latex Gloves (M)',
      sku: 'GLV-M',
      qty: 2,
      unit: 'boxes',
      minQty: 8,
      location: 'Operatory 1',
      supplierId: 'sup-2',
      unitCost: 350,
    },
    {
      id: 'inv-2',
      name: 'Lidocaine Carpules',
      sku: 'LIDO-2',
      qty: 10,
      unit: 'units',
      minQty: 40,
      expiry: 'Sep 18, 2026',
      location: 'Pharmacy Cabinet',
      supplierId: 'sup-1',
      unitCost: 85,
    },
    {
      id: 'inv-3',
      name: 'Anesthetic Cartridges (Lido)',
      sku: 'ANES-L',
      qty: 6,
      unit: 'boxes',
      minQty: 12,
      location: 'Sterile Store',
      supplierId: 'sup-1',
      unitCost: 1200,
    },
    {
      id: 'inv-4',
      name: 'Composite Resin (Shade A2)',
      sku: 'COMP-A2',
      qty: 4,
      unit: 'syringes',
      minQty: 6,
      expiry: 'Aug 22, 2026',
      location: 'Operatory 2',
      supplierId: 'sup-3',
      unitCost: 850,
    },
    {
      id: 'inv-5',
      name: 'Disposable Bibs',
      sku: 'BIB-50',
      qty: 0,
      unit: 'packs',
      minQty: 5,
      location: 'Storage Room B',
      supplierId: 'sup-2',
      unitCost: 280,
    },
    {
      id: 'inv-6',
      name: 'Nitrile Gloves (L)',
      sku: 'NIT-L',
      qty: 48,
      unit: 'boxes',
      minQty: 10,
      location: 'Central Store',
      supplierId: 'sup-2',
      unitCost: 420,
    },
  ]

  for (const item of inventoryData) {
    await prisma.inventoryItem.create({ data: item })
  }
  console.log(`✅ Seeded ${inventoryData.length} inventory items.`)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
