# Project & User Memory

## 1. User Profile & Working Relationship
- **Developer Background**: 22-year-old software developer with 1 year of professional experience. Based in Ethiopia. Solo engineer on this project collaborating with business/clinical partners.
- **Working Directive**: **NEVER immediately agree with changes or structural decisions.** The AI must act as a rigorous, objective senior engineering partner.
  - Actively stress-test ideas and call out hidden complexity.
  - Highlight architectural traps, maintenance liabilities, performance bottlenecks, and security vulnerabilities.
  - Present trade-offs, steel-manned counterarguments, and simpler alternatives before accepting any pivot.

---

## 2. Concise Observations About the User

| Observation | Reason / Context |
| :--- | :--- |
| **Pragmatic grasp of local Ethiopian market realities** | Correctly identified that clinics care about cash reconciliation & revenue reports first (not deep odontograms); recognized that on-prem hardware is an operational trap for a solo dev; calibrated realistic pricing (ETB 80k setup + 2k/mo in installments). |
| **Sensitive to permission & admin maintenance fatigue** | Strongly rejected granular RBAC hierarchies (100+ permission strings) and Monday.com row-level ACLs because of previous bad experience with over-engineered systems requiring constant admin intervention. |
| **Prone to scope expansion / ambitious multi-project vision** | Mentions building a multi-tenant ERP, Telegram bot engine, custom VPS hosting business, and clinical charting simultaneously. Needs discipline to keep focus on an MVP that actually ships. |
| **High self-awareness & open to critical technical pushback** | Proactively requested to be challenged rather than validated, recognizing the difference between 1 year of hands-on experience and broader software engineering patterns. |

---

## 3. Product & Technical Constraints
- **Stack**: Node.js 22 LTS (Express/TypeScript), PostgreSQL 16 LTS, Prisma ORM, Docker Compose.
- **Hosting**: Managed Linux VPS (HahuCloud VPS) with generic Linux naming (`sys-core-service`, `sys-db-service`, `sys-isolated-net`).
- **Authorization**: Scoped RBAC (5 domains: `patients`, `clinical`, `scheduling`, `billing`, `inventory` $\times$ 4 scopes: `none`, `read`, `own`, `all`).
- **Communication**: Automated Telegram Bot Engine instead of SMS APIs (patient deep-link `/start pt_<id>`, 24h reminders, cashier close alerts, nurse stock alerts).
- **Business Model**: Hybrid Model — ETB 80,000 onboarding package + ETB 2,000/month hosting (paid in 3, 6, or 12-month installments) + annual maintenance.

---

## 4. Verified VPS Deployment Environment
- **Host**: `178.105.14.11` (Ubuntu 5.15 x86_64)
- **User**: `spool`
- **Auth Key**: `/home/mhri/.ssh/id_ed25519`
- **Docker**: Docker v29.6.2 + Docker Compose v5.3.1 (Active)
- **Existing Services**: Caddy on ports 80/443 (reverse proxy), existing metrics/store containers. Port `5000` is open.
- **Service Naming**: Aligns with existing generic Linux naming on the host (e.g. `hostmetricsd-store`, `ingestmetricsd`).

---

## 5. Strict Operational Boundary Rules
- **VPS IS OFF-LIMITS / CONSIDERED NON-EXISTENT**: Under no circumstances should the agent ever run SSH commands, rsync, or connect to the VPS (`178.105.14.11`). Treat the system as 100% local only. Any future deployment to VPS requires explicit, unambiguous user confirmation.
- **ZERO INTERFERENCE WITH EXISTING SERVICES**: Under no circumstances should any container, port, database, or service not created by this project be touched, reconfigured, or shared (e.g., `backend-postgres-1` on local port 5432, etc.).
- **DEDICATED CONTAINERS ONLY**: This dental ERP must have its own dedicated PostgreSQL container (`sys-db-service`), own dedicated MinIO S3 object store (`sys-storage-service`), and own dedicated API (`sys-core-service`), fully isolated in its own Docker network (`sys-isolated-net`).
- **FRAMEWORK DECISION**: Modular Express.js + Zod + TypeScript (chosen for speed of execution, lower boilerplate, and high velocity over NestJS).
