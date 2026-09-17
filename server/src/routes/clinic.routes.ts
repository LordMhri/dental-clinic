import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

export const clinicRouter = Router()

// GET /api/clinic/profile (Fetch active clinic identity & enabled modules)
clinicRouter.get('/profile', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.clinicProfile.findFirst()
    if (!profile) {
      res.json({ profile: null })
      return
    }

    res.json({ profile })
  } catch (err) {
    console.error('Error fetching clinic profile:', err)
    res.status(500).json({ error: 'Failed to retrieve clinic profile.' })
  }
})

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  tagline: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  tinNumber: z.string().optional().nullable(),
  workingHours: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  enabledModules: z.array(z.string()).min(1, 'At least one module must be enabled'),
})

// PUT /api/clinic/profile (Update clinic identity, branding, and active module flags)
clinicRouter.put('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Admin can modify clinic configuration and active modules
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only clinic administrators can update clinic profile and active modules.' })
      return
    }

    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }

    const { name, tagline, location, phone, tinNumber, workingHours, currency, enabledModules } = parsed.data

    const existing = await prisma.clinicProfile.findFirst()
    const id = existing?.id || 'clinic-primary'

    const profile = await prisma.clinicProfile.upsert({
      where: { id },
      update: {
        name,
        tagline: tagline || null,
        location: location || null,
        phone: phone || null,
        tinNumber: tinNumber || null,
        workingHours: workingHours || null,
        currency: currency || 'ETB',
        enabledModules,
      },
      create: {
        id,
        name,
        tagline: tagline || null,
        location: location || null,
        phone: phone || null,
        tinNumber: tinNumber || null,
        workingHours: workingHours || null,
        currency: currency || 'ETB',
        enabledModules,
      },
    })

    res.json({
      profile,
      message: 'Clinic profile and module configuration updated successfully.',
    })
  } catch (err) {
    console.error('Error updating clinic profile:', err)
    res.status(500).json({ error: 'Failed to update clinic profile.' })
  }
})
