import { describe, it, expect } from 'vitest'
import {
  universalToFDI,
  fdiToUniversal,
  getToothName,
} from '../src/components/odontogram/odontogramUtils'

describe('Odontogram Dental Notation Utilities', () => {
  it('correctly maps Upper Right quadrant from Universal (1-8) to FDI (18-11)', () => {
    expect(universalToFDI(1)).toBe(18) // UR 3rd molar
    expect(universalToFDI(2)).toBe(17) // UR 2nd molar
    expect(universalToFDI(3)).toBe(16) // UR 1st molar
    expect(universalToFDI(4)).toBe(15) // UR 2nd premolar
    expect(universalToFDI(5)).toBe(14) // UR 1st premolar
    expect(universalToFDI(6)).toBe(13) // UR canine
    expect(universalToFDI(7)).toBe(12) // UR lateral incisor
    expect(universalToFDI(8)).toBe(11) // UR central incisor
  })

  it('correctly maps Upper Left quadrant from Universal (9-16) to FDI (21-28)', () => {
    expect(universalToFDI(9)).toBe(21)  // UL central incisor
    expect(universalToFDI(10)).toBe(22) // UL lateral incisor
    expect(universalToFDI(11)).toBe(23) // UL canine
    expect(universalToFDI(12)).toBe(24) // UL 1st premolar
    expect(universalToFDI(13)).toBe(25) // UL 2nd premolar
    expect(universalToFDI(14)).toBe(26) // UL 1st molar
    expect(universalToFDI(15)).toBe(27) // UL 2nd molar
    expect(universalToFDI(16)).toBe(28) // UL 3rd molar
  })

  it('correctly maps Lower Left quadrant from Universal (17-24) to FDI (38-31)', () => {
    expect(universalToFDI(17)).toBe(38) // LL 3rd molar
    expect(universalToFDI(18)).toBe(37) // LL 2nd molar
    expect(universalToFDI(19)).toBe(36) // LL 1st molar
    expect(universalToFDI(20)).toBe(35) // LL 2nd premolar
    expect(universalToFDI(21)).toBe(34) // LL 1st premolar
    expect(universalToFDI(22)).toBe(33) // LL canine
    expect(universalToFDI(23)).toBe(32) // LL lateral incisor
    expect(universalToFDI(24)).toBe(31) // LL central incisor
  })

  it('correctly maps Lower Right quadrant from Universal (25-32) to FDI (41-48)', () => {
    expect(universalToFDI(25)).toBe(41) // LR central incisor
    expect(universalToFDI(26)).toBe(42) // LR lateral incisor
    expect(universalToFDI(27)).toBe(43) // LR canine
    expect(universalToFDI(28)).toBe(44) // LR 1st premolar
    expect(universalToFDI(29)).toBe(45) // LR 2nd premolar
    expect(universalToFDI(30)).toBe(46) // LR 1st molar
    expect(universalToFDI(31)).toBe(47) // LR 2nd molar
    expect(universalToFDI(32)).toBe(48) // LR 3rd molar
  })

  it('guarantees bidirectional bijective round-trip mapping for all 32 teeth', () => {
    for (let univ = 1; univ <= 32; univ++) {
      const fdi = universalToFDI(univ)
      expect(fdiToUniversal(fdi)).toBe(univ)
    }
  })

  it('provides anatomical human-readable tooth names for clinical records', () => {
    expect(getToothName(1)).toBe('Upper Right 3rd Molar (Wisdom)')
    expect(getToothName(8)).toBe('Upper Right Central Incisor')
    expect(getToothName(9)).toBe('Upper Left Central Incisor')
    expect(getToothName(14)).toBe('Upper Left 1st Molar')
    expect(getToothName(19)).toBe('Lower Left 1st Molar')
    expect(getToothName(32)).toBe('Lower Right 3rd Molar (Wisdom)')
  })
})
