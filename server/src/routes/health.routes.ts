import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma.js'

export const healthRouter = Router()

healthRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'healthy',
      service: 'sys-core-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'sys-core-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: String(err),
    })
  }
})
