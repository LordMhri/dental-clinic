import { describe, it, expect } from 'vitest'

// Scope level mapping matching server/src/middleware/auth.ts
const SCOPE_LEVELS: Record<string, number> = {
  none: 0,
  read: 1,
  own: 2,
  all: 3,
}

function checkPermission(
  userScope: string,
  requiredLevel: 'read' | 'own' | 'all'
): boolean {
  const userLevel = SCOPE_LEVELS[userScope] ?? 0
  const reqLevel = SCOPE_LEVELS[requiredLevel] ?? 999
  return userLevel >= reqLevel
}

describe('Scoped RBAC Security Model', () => {
  it('correctly orders hierarchy: all (3) > own (2) > read (1) > none (0)', () => {
    expect(SCOPE_LEVELS['all']).toBeGreaterThan(SCOPE_LEVELS['own'])
    expect(SCOPE_LEVELS['own']).toBeGreaterThan(SCOPE_LEVELS['read'])
    expect(SCOPE_LEVELS['read']).toBeGreaterThan(SCOPE_LEVELS['none'])
  })

  it('permits "all" users to access read, own, and all protected routes', () => {
    expect(checkPermission('all', 'read')).toBe(true)
    expect(checkPermission('all', 'own')).toBe(true)
    expect(checkPermission('all', 'all')).toBe(true)
  })

  it('permits "own" users to access read and own routes, but denies "all" routes', () => {
    expect(checkPermission('own', 'read')).toBe(true)
    expect(checkPermission('own', 'own')).toBe(true)
    expect(checkPermission('own', 'all')).toBe(false)
  })

  it('permits "read" users to view read-only resources, but denies mutation', () => {
    expect(checkPermission('read', 'read')).toBe(true)
    expect(checkPermission('read', 'own')).toBe(false)
    expect(checkPermission('read', 'all')).toBe(false)
  })

  it('denies "none" users from accessing any protected resource', () => {
    expect(checkPermission('none', 'read')).toBe(false)
    expect(checkPermission('none', 'own')).toBe(false)
    expect(checkPermission('none', 'all')).toBe(false)
  })
})
