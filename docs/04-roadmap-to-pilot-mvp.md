# Roadmap: Path to 90% Completion & Clinical Pilot Trial

A strategic execution plan to transform the current prototype into a 90% production-ready Dental Clinic ERP, deployable for live pilot trials with practicing dentists.

---

## 1. The Pilot-Ready Definition (What "90% Complete" Means)

A dental clinic cannot run a "half-working" system. If reception registers a patient, but the doctor cannot see the chart, or the cashier cannot print a receipt, the trial fails.

For a clinic to successfully pilot the software for 30 days without reverting to paper, the system must achieve complete workflows across 4 core operational loops:

```
[1. Registration] -> [2. Chair Scheduling] -> [3. Clinical Odontogram] -> [4. Cashier Invoicing]
         ^                                                                         |
         └───────────────── [5. Automated Telegram Recall & Reminder] <───────────┘
```

---

## 2. Feature Matrix: Pilot Scope vs. Future Horizon

| Module | Must-Have for 30-Day Pilot (Phase 1–4) | Deferred to v1.1 / Post-Pilot |
| :--- | :--- | :--- |
| **Authentication & RBAC** | • Scoped RBAC (`all`, `own`, `read`, `none`)<br/>• Session persistence with JWT<br/>• Demo / staff accounts seeded | • Multi-factor authentication (MFA / 2FA)<br/>• SSO / SAML integration |
| **Patient Demographics** | • Full intake (Phone, Age, Gender, Address)<br/>• Medical alerts & drug allergies flag<br/>• Search by phone, name, or patient ID | • Online patient self-intake tablet mode<br/>• Insurance policy scanning |
| **Scheduling** | • Operatory / Chair-centric daily calendar<br/>• Status lifecycle (`Scheduled` $\rightarrow$ `Completed`)<br/>• Conflict prevention | • Multi-location cross-branch view<br/>• Online public patient booking widget |
| **Odontogram & Charting** | • Interactive 32-tooth permanent chart<br/>• FDI & Universal notation toggle<br/>• Procedure recording with tooth & surfaces | • 3D mesh rendering<br/>• Direct DICOM/PACS sensor bridge |
| **Billing & Cashier** | • Invoice generation from completed procedures<br/>• Telebirr, CBE Bank, Cash, Card split tracking<br/>• Printable HTML browser receipt<br/>• End-of-day register reconciliation dialog | • Direct ERCA fiscal printer hardware API<br/>• Automated credit bureau reporting |
| **Telegram Notifications** | • Instant booking confirmation to patient<br/>• 24-hour appointment reminder<br/>• Clinic low-stock alert channel | • Interactive bot conversational scheduling<br/>• Natural language triage chatbot |
| **Inventory** | • Stock catalog with minQty thresholds<br/>• Manual restock / dispensing movements | • Barcode scanner hardware wedge<br/>• Automated PO generation to suppliers |

---

## 3. Four-Week Sprint Plan to Reach Pilot Readiness

### Sprint 1: Isolated Backend & Relational Database (Week 1)
- [ ] Initialize `server/` with Node.js 22 LTS (Alpine) and PostgreSQL 16 LTS Docker setup.
- [ ] Write Prisma schema matching `docs/02-architecture-and-security.md`.
- [ ] Create database seed script converting `mock.ts` data into real relational records with hashed passwords.
- [ ] Implement Scoped RBAC middleware (`patients`, `clinical`, `scheduling`, `billing`, `inventory`).
- [ ] Configure Vite dev proxy `/api` $\rightarrow$ `http://localhost:5000`.

### Sprint 2: Clinical Core & Interactive Odontogram (Week 2)
- [ ] Implement interactive SVG Odontogram in React supporting FDI (11–48) and Universal (1–32).
- [ ] Connect `Treatments.tsx` to live backend: selecting tooth, surface, and procedure saves directly to database.
- [ ] Wire treatment completion event to automatically stage an unpaid invoice in the billing queue.
- [ ] Display real historical procedures and chart notes in `PatientProfile.tsx`.

### Sprint 3: Operatory Scheduling & Ethiopian Cashier Desk (Week 3)
- [ ] Upgrade calendar in `Appointments.tsx` to show full operational clinic hours (08:00 – 18:00) with operatory chair columns.
- [ ] Connect `CashierDashboard.tsx` and `ProcessPayment.tsx` to calculate real invoice totals and drawer reconciliation from PostgreSQL.
- [ ] Wire end-of-day register close to lock the session and record opening/closing cash balances.

### Sprint 4: Telegram Bot & Deployment Packaging (Week 4)
- [ ] Implement Telegram Bot engine in `server/src/services/telegram.service.ts`.
- [ ] Add deep-link `/start patient_<id>` handler for instant patient account binding.
- [ ] Implement automated 24h appointment reminder worker.
- [ ] Package entire application into a one-command production script:
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```
- [ ] Deliver user guide and onboarding checklist for pilot clinic testing.

---

## 4. The 30-Day Clinic Pilot Framework

When introducing the software to the first 2–3 dental clinics:
1. **The Parallel Run (Days 1–7)**:
   - Clinic uses the system alongside their current manual book/Excel.
   - You observe reception and doctors directly, noting any UI friction points or missed edge cases.
2. **Full Cutover (Days 8–25)**:
   - Clinic uses the ERP exclusively for all active patients.
   - Daily automated database backups sent to secure offsite storage.
3. **Pilot Review & Conversion (Days 26–30)**:
   - Present the clinic director with their first real monthly report (total patients seen, revenue collected via Telebirr vs Cash, chair utilization rate).
   - Convert pilot clinic into the first paying customer using the Hybrid Annual Software Assurance model.
