// Mapping between Universal (1-32) and FDI Two-Digit (11-48) dental notation

// Upper Right (UR): Universal 1-8 -> FDI 18-11
// Upper Left (UL): Universal 9-16 -> FDI 21-28
// Lower Left (LL): Universal 17-24 -> FDI 31-38
// Lower Right (LR): Universal 25-32 -> FDI 41-48

const UNIVERSAL_TO_FDI_MAP: Record<number, number> = {
  1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
  9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
  17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
  25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48,
}

const FDI_TO_UNIVERSAL_MAP: Record<number, number> = Object.entries(
  UNIVERSAL_TO_FDI_MAP
).reduce((acc, [univ, fdi]) => {
  acc[Number(fdi)] = Number(univ)
  return acc
}, {} as Record<number, number>)

export function universalToFDI(univ: number): number {
  return UNIVERSAL_TO_FDI_MAP[univ] ?? univ
}

export function fdiToUniversal(fdi: number): number {
  return FDI_TO_UNIVERSAL_MAP[fdi] ?? fdi
}

export function getToothName(univ: number): string {
  const names: Record<number, string> = {
    1: 'Upper Right 3rd Molar (Wisdom)',
    2: 'Upper Right 2nd Molar',
    3: 'Upper Right 1st Molar',
    4: 'Upper Right 2nd Premolar',
    5: 'Upper Right 1st Premolar',
    6: 'Upper Right Canine',
    7: 'Upper Right Lateral Incisor',
    8: 'Upper Right Central Incisor',
    9: 'Upper Left Central Incisor',
    10: 'Upper Left Lateral Incisor',
    11: 'Upper Left Canine',
    12: 'Upper Left 1st Premolar',
    13: 'Upper Left 2nd Premolar',
    14: 'Upper Left 1st Molar',
    15: 'Upper Left 2nd Molar',
    16: 'Upper Left 3rd Molar (Wisdom)',
    17: 'Lower Left 3rd Molar (Wisdom)',
    18: 'Lower Left 2nd Molar',
    19: 'Lower Left 1st Molar',
    20: 'Lower Left 2nd Premolar',
    21: 'Lower Left 1st Premolar',
    22: 'Lower Left Canine',
    23: 'Lower Left Lateral Incisor',
    24: 'Lower Left Central Incisor',
    25: 'Lower Right Central Incisor',
    26: 'Lower Right Lateral Incisor',
    27: 'Lower Right Canine',
    28: 'Lower Right 1st Premolar',
    29: 'Lower Right 2nd Premolar',
    30: 'Lower Right 1st Molar',
    31: 'Lower Right 2nd Molar',
    32: 'Lower Right 3rd Molar (Wisdom)',
  }
  return names[univ] || `Tooth #${univ}`
}

export type ToothCondition =
  | 'Sound'
  | 'Decayed'
  | 'Restored'
  | 'Crown'
  | 'RootCanal'
  | 'Missing'
  | 'Implant'

export interface ToothData {
  toothNumber: number // 1-32 Universal standard
  condition: ToothCondition
  surfaces?: string | null // e.g. "MOD", "O", "B"
  notes?: string | null
}
