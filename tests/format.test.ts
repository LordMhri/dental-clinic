import { describe, it, expect } from 'vitest'
import { etb, todayLabel, initials, greeting } from '../src/lib/format'

describe('Ethiopian Currency & Localization Formatting', () => {
  it('formats ETB currency amounts with 2 decimal places and locale comma grouping', () => {
    expect(etb(0)).toBe('ETB 0.00')
    expect(etb(1850)).toBe('ETB 1,850.00')
    expect(etb(125000)).toBe('ETB 125,000.00')
  })

  it('generates clinic greeting and today date labels', () => {
    const label = todayLabel(new Date('2026-08-12T10:00:00Z'))
    expect(label).toBeDefined()
    expect(label).toContain('2026')

    const greet = greeting('Dr. Eyuel', new Date('2026-08-12T09:00:00'))
    expect(greet).toBe('Good Morning, Dr. Eyuel!')
  })

  it('extracts two-letter uppercase initials from patient/staff names', () => {
    expect(initials('Eyuel Hailu')).toBe('EH')
    expect(initials('Selamawit Tadesse')).toBe('ST')
    expect(initials('Single')).toBe('S')
  })
})
