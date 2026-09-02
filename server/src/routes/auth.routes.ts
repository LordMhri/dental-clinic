import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signToken, requireAuth, type AuthUser, type ScopeLevel } from '../middleware/auth.js'

export const authRouter = Router()

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ error: 'Username and password are required.' })
      return
    }

    const { username, password } = parseResult.data
    const cleanUser = username.trim().toLowerCase()

    const staff = await prisma.staff.findUnique({
      where: { username: cleanUser },
    })

    if (!staff || !staff.isActive) {
      res.status(401).json({ error: 'Invalid username or password.' })
      return
    }

    const match = await bcrypt.compare(password, staff.passwordHash)
    if (!match) {
      res.status(401).json({ error: 'Invalid username or password.' })
      return
    }

    const authUser: AuthUser = {
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      title: staff.title,
      initials: staff.initials,
      scopes: {
        patients: staff.scopePatients as ScopeLevel,
        clinical: staff.scopeClinical as ScopeLevel,
        scheduling: staff.scopeScheduling as ScopeLevel,
        billing: staff.scopeBilling as ScopeLevel,
        inventory: staff.scopeInventory as ScopeLevel,
      },
    }

    const token = signToken(authUser)

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: staff.id,
        action: 'LOGIN',
        entity: 'Staff',
        entityId: staff.id,
        ipAddress: req.ip,
      },
    })

    res.json({
      user: authUser,
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error during authentication.' })
  }
})

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.user!.id },
    })

    if (!staff || !staff.isActive) {
      res.status(401).json({ error: 'User account not found or deactivated.' })
      return
    }

    const authUser: AuthUser = {
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      title: staff.title,
      initials: staff.initials,
      scopes: {
        patients: staff.scopePatients as ScopeLevel,
        clinical: staff.scopeClinical as ScopeLevel,
        scheduling: staff.scopeScheduling as ScopeLevel,
        billing: staff.scopeBilling as ScopeLevel,
        inventory: staff.scopeInventory as ScopeLevel,
      },
    }

    res.json({ user: authUser })
  } catch (err) {
    console.error('Auth check error:', err)
    res.status(500).json({ error: 'Internal server error checking profile.' })
  }
})

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          staffId: req.user.id,
          action: 'LOGOUT',
          entity: 'Staff',
          entityId: req.user.id,
          ipAddress: req.ip,
        },
      })
    }
    res.json({ success: true, message: 'Logged out successfully.' })
  } catch {
    res.json({ success: true })
  }
})
