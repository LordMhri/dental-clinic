/**
 * Ethiopian HMIS / ICD-10 Standardised Dental Disease List
 *
 * Derived from:
 *  - ICD-10 Chapter XI (K00–K14) — Diseases of the oral cavity, salivary glands and jaws
 *  - Ethiopian Federal Ministry of Health HMIS reporting requirements for dental units
 *
 * Each entry maps a free-text procedure or diagnosis string (as typed by the dentist)
 * to a canonical ICD-10 code and display label used in the monthly HMIS report.
 */

export interface IcdEntry {
  code: string
  label: string
  /** Keywords used to match free-text procedure strings */
  keywords: string[]
}

/** Full standardised list — 23 most clinically relevant dental ICD-10 codes for Ethiopian HMIS */
export const ICD_DENTAL_LIST: IcdEntry[] = [
  // ─── Developmental / Eruption ───────────────────────────────────────────────
  {
    code: 'K00',
    label: 'Disorders of tooth development and eruption',
    keywords: ['eruption', 'impaction', 'impacted', 'hypodontia', 'anodontia', 'supernumerary'],
  },
  {
    code: 'K01',
    label: 'Embedded and impacted teeth',
    keywords: ['embedded', 'impacted wisdom', 'wisdom tooth'],
  },

  // ─── Caries ─────────────────────────────────────────────────────────────────
  {
    code: 'K02.0',
    label: 'Dental caries — enamel (early / white spot)',
    keywords: ['enamel caries', 'white spot', 'initial caries'],
  },
  {
    code: 'K02.1',
    label: 'Dental caries — dentine (cavity filling)',
    keywords: [
      'caries',
      'cavity',
      'filling',
      'composite restoration',
      'composite resin',
      'amalgam',
      'cavity filling',
    ],
  },
  {
    code: 'K02.9',
    label: 'Dental caries, unspecified',
    keywords: ['dental caries'],
  },

  // ─── Hard tissue / Attrition ────────────────────────────────────────────────
  {
    code: 'K03',
    label: 'Other diseases of hard tooth structure (attrition, erosion, abrasion)',
    keywords: ['attrition', 'erosion', 'abrasion', 'bruxism', 'grinding', 'hard tissue'],
  },

  // ─── Pulp & Periapical ──────────────────────────────────────────────────────
  {
    code: 'K04.0',
    label: 'Pulpitis (pulp inflammation)',
    keywords: ['pulpitis', 'pulp inflammation', 'sensitivity', 'hypersensitivity'],
  },
  {
    code: 'K04.1',
    label: 'Necrosis of pulp',
    keywords: ['pulp necrosis', 'necrotic pulp', 'non-vital'],
  },
  {
    code: 'K04.5',
    label: 'Chronic apical periodontitis (root canal therapy)',
    keywords: [
      'root canal',
      'rct',
      'endodontic',
      'pulpectomy',
      'root canal therapy',
      'periapical',
      'apical',
    ],
  },
  {
    code: 'K04.7',
    label: 'Periapical abscess',
    keywords: ['abscess', 'periapical abscess', 'dental abscess', 'dental infection'],
  },

  // ─── Periodontal ────────────────────────────────────────────────────────────
  {
    code: 'K05.0',
    label: 'Acute gingivitis',
    keywords: ['acute gingivitis', 'bleeding gums'],
  },
  {
    code: 'K05.1',
    label: 'Chronic gingivitis',
    keywords: ['chronic gingivitis', 'gingivitis'],
  },
  {
    code: 'K05.3',
    label: 'Chronic periodontitis (scaling / deep cleaning)',
    keywords: [
      'periodontitis',
      'periodontal',
      'scaling',
      'root planing',
      'deep cleaning',
      'prophylaxis',
      'routine cleaning',
      'prophy',
    ],
  },

  // ─── Other tooth disorders ──────────────────────────────────────────────────
  {
    code: 'K08.1',
    label: 'Loss of teeth (extraction)',
    keywords: ['extraction', 'exo', 'tooth removal', 'tooth loss', 'remove tooth'],
  },
  {
    code: 'K08.8',
    label: 'Prosthetic / restorative procedures (crown, bridge, denture)',
    keywords: ['crown', 'crown fitting', 'bridge', 'denture', 'prosthetic', 'implant', 'veneers'],
  },
  {
    code: 'K08.9',
    label: 'Cosmetic / elective (whitening, braces, consult)',
    keywords: [
      'whitening',
      'bleaching',
      'braces',
      'orthodont',
      'aligner',
      'consultation',
      'consult',
      'routine checkup',
      'comprehensive exam',
    ],
  },

  // ─── Oral Mucosal / Stomatitis ──────────────────────────────────────────────
  {
    code: 'K12',
    label: 'Stomatitis and related lesions (ulcers, canker sores)',
    keywords: ['stomatitis', 'ulcer', 'canker sore', 'aphthous', 'oral lesion', 'lesion'],
  },

  // ─── Tongue ─────────────────────────────────────────────────────────────────
  {
    code: 'K14',
    label: 'Diseases of the tongue',
    keywords: ['tongue', 'glossitis', 'geographic tongue'],
  },

  // ─── Preventive / Routine ───────────────────────────────────────────────────
  {
    code: 'Z00',
    label: 'Routine examination / preventive care',
    keywords: ['routine', 'checkup', 'check-up', 'annual', 'exam'],
  },
]

/**
 * Map a free-text procedure name to its canonical ICD entry.
 * Tries each entry's keywords; falls back to K08.9 if nothing matches.
 */
export function resolveIcd(procedure: string): IcdEntry {
  const lower = procedure.toLowerCase()
  for (const entry of ICD_DENTAL_LIST) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry
    }
  }
  return { code: 'K08.9', label: 'Other dental procedure', keywords: [] }
}
