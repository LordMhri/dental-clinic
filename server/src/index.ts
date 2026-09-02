import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { patientRouter } from './routes/patient.routes.js'
import { clinicalRouter } from './routes/clinical.routes.js'
import { schedulingRouter } from './routes/scheduling.routes.js'
import { billingRouter } from './routes/billing.routes.js'
import { initStorage } from './lib/storage.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security & Parsing Middlewares
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
)
app.use(express.json())

// Route Registration
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/patients', patientRouter)
app.use('/api/clinical', clinicalRouter)
app.use('/api/scheduling', schedulingRouter)
app.use('/api/billing', billingRouter)

// Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found.' })
})

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(PORT, async () => {
  console.log(`🚀 [sys-core-service] Dental ERP API server running on port ${PORT}`)
  await initStorage()
})
