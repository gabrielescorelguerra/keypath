import {
  buildChord,
  getChordQuality,
  parseChordSuffix,
  type Chord,
  type ChordQualityId,
} from './chords.ts'
import { MusicParseError } from './errors.ts'
import {
  alterPitchClass,
  chroma,
  letterIndex,
  normalizeAccidentals,
  transpose,
  type PitchClass,
} from './notes.ts'

/**
 * Graus são sempre relativos à escala maior da tônica (convenção brasileira):
 * em Sol, "bVI" é Mib e "IVm" é Dó menor — também em tonalidades menores.
 */
const MAJOR_SCALE_INTERVALS = ['1P', '2M', '3M', '4P', '5P', '6M', '7M'] as const
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

export type DegreeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ScaleDegree {
  /** Número do grau (1–7). */
  readonly number: DegreeNumber
  /** Alteração em relação à escala maior: -1 = ♭, +1 = ♯. */
  readonly alteration: number
}

export interface ChordDegree extends ScaleDegree {
  readonly quality: ChordQualityId
  readonly bass: ScaleDegree | null
}

const DEGREE_RE =
  /^([b#]{0,2})(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(.*?)(?:\/([b#]{0,2})(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i))?$/

function parseAlteration(accidentals: string): number {
  let alteration = 0
  for (const char of accidentals) {
    alteration += char === '#' ? 1 : -1
  }
  return alteration
}

function romanToNumber(roman: string): DegreeNumber {
  return (ROMAN.indexOf(roman.toUpperCase() as (typeof ROMAN)[number]) + 1) as DegreeNumber
}

/** Sufixos de grau em minúsculas que já descrevem a qualidade (não recebem "m"). */
const LOWERCASE_SELF_QUALIFIED: Readonly<Record<string, ChordQualityId>> = {
  '°': 'dim',
  o: 'dim',
  '°7': 'dim7',
  o7: 'dim7',
  ø: 'm7b5',
  ø7: 'm7b5',
}

/**
 * Lê um grau. Aceita as duas convenções:
 * - brasileira (Chediak): maiúsculas + sufixo de cifra — "IVm", "IIm7(b5)", "bVI7M";
 * - de caixa: minúsculas = menor — "iv", "iiø", "vii°".
 */
export function parseDegree(input: string): ChordDegree {
  const normalized = normalizeAccidentals(input).replaceAll(' ', '')
  const match = DEGREE_RE.exec(normalized)
  if (!match) {
    throw new MusicParseError('Grau', input)
  }
  const [, accidentals = '', roman = '', suffix = '', bassAccidentals, bassRoman] = match

  const isLowercase = roman === roman.toLowerCase()
  let quality: ChordQualityId | null
  if (isLowercase) {
    quality = LOWERCASE_SELF_QUALIFIED[suffix] ?? parseChordSuffix(`m${suffix}`)
  } else {
    quality = parseChordSuffix(suffix)
  }
  if (quality === null) {
    throw new MusicParseError('Grau', input)
  }

  return {
    number: romanToNumber(roman),
    alteration: parseAlteration(accidentals),
    quality,
    bass: bassRoman
      ? { number: romanToNumber(bassRoman), alteration: parseAlteration(bassAccidentals ?? '') }
      : null,
  }
}

/** Nota correspondente a um grau da escala na tônica dada. */
export function degreeToPitchClass(tonic: PitchClass, degree: ScaleDegree): PitchClass {
  const interval = MAJOR_SCALE_INTERVALS[degree.number - 1] ?? '1P'
  return alterPitchClass(transpose(tonic, interval), degree.alteration)
}

/** Grau de uma nota em relação à tônica: em Sol, "Eb" é ♭6. */
export function pitchClassToDegree(tonic: PitchClass, pc: PitchClass): ScaleDegree {
  const number = ((((letterIndex(pc) - letterIndex(tonic)) % 7) + 7) % 7) + 1
  const expected = degreeToPitchClass(tonic, { number: number as DegreeNumber, alteration: 0 })
  const alteration = ((((chroma(pc) - chroma(expected)) % 12) + 18) % 12) - 6
  return { number: number as DegreeNumber, alteration }
}

export function degreeToChord(tonic: PitchClass, degree: ChordDegree | string): Chord {
  const parsed = typeof degree === 'string' ? parseDegree(degree) : degree
  const root = degreeToPitchClass(tonic, parsed)
  const bass = parsed.bass ? degreeToPitchClass(tonic, parsed.bass) : null
  return buildChord(root, parsed.quality, bass)
}

export function chordToDegree(tonic: PitchClass, chord: Chord): ChordDegree {
  return {
    ...pitchClassToDegree(tonic, chord.root),
    quality: chord.quality,
    bass: chord.bass ? pitchClassToDegree(tonic, chord.bass) : null,
  }
}

/** Converte uma sequência de graus ("I IV iv I") em acordes. */
export function progressionToChords(tonic: PitchClass, degrees: string): readonly Chord[] {
  return degrees
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((degree) => degreeToChord(tonic, degree))
}

/** Grau em texto canônico ASCII, na convenção brasileira: "bVI7M", "IIm7(b5)", "I/III". */
export function degreeToString(degree: ChordDegree): string {
  const scaleDegree = (d: ScaleDegree) =>
    (d.alteration >= 0 ? '#'.repeat(d.alteration) : 'b'.repeat(-d.alteration)) +
    (ROMAN[d.number - 1] ?? '?')
  const suffix = getChordQuality(degree.quality).brSymbol
  return scaleDegree(degree) + suffix + (degree.bass ? `/${scaleDegree(degree.bass)}` : '')
}
