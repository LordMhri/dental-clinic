import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type ScopeDomain = 'patients' | 'clinical' | 'scheduling' | 'billing' | 'inventory'
export type ScopeLevel = 'none' | 'read' | 'own' | 'all'

const SCOPE_VALUES: Record<ScopeLevel, number> = {
  none: 0,
  read: 1,
  own: 2,
  all: 3,
}

export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  title: string
  initials: string
  scopes: Record<ScopeDomain, ScopeLevel>
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'sys-core-secret-key-lewi-dental-2026'

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token.' })
  }
}

/**
 * Enforces Scoped RBAC access on a domain.
 * Level hierarchy: none (0) < read (1) < own (2) < all (3).
 * Admin role automatically satisfies all scopes.
 */
export function requireScope(domain: ScopeDomain, minLevel: ScopeLevel) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' })
      return
    }

    if (req.user.role === 'admin') {
      next()
      return
    }

    const userScope = req.user.scopes[domain] || 'none'
    const userVal = SCOPE_VALUES[userScope] ?? 0
    const requiredVal = SCOPE_VALUES[minLevel] ?? 0

    if (userVal < requiredVal) {
      res.status(403).json({
        error: `Access denied. Requires '${minLevel}' scope on domain '${domain}'. Current scope: '${userScope}'.`,
      })
      return
    }

    next()
  }
}
