import { MusicParseError } from './errors.ts'
import { normalizeAccidentals, parsePitchClass, type PitchClass } from './notes.ts'

export type KeyMode = 'major' | 'minor'

export interface Key {
  readonly tonic: PitchClass
  readonly mode: KeyMode
}

/** As 12 tonalidades maiores usadas nos exercícios, pelo ciclo de quintas. */
export const MAJOR_KEYS: readonly PitchClass[] = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'Db',
  'Ab',
  'Eb',
  'Bb',
  'F',
]

/** As 12 tonalidades menores usadas nos exercícios, pelo ciclo de quintas. */
export const MINOR_KEYS: readonly PitchClass[] = [
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'D#',
  'Bb',
  'F',
  'C',
  'G',
  'D',
]

/** Lê uma tonalidade: "G" (Sol maior), "Em" (Mi menor), "Bb", "F#m". */
export function parseKey(input: string): Key {
  const normalized = normalizeAccidentals(input).replaceAll(' ', '')
  const match = /^([A-G][#b]?)(m)?$/.exec(normalized)
  if (!match) {
    throw new MusicParseError('Tonalidade', input)
  }
  return { tonic: parsePitchClass(match[1] ?? ''), mode: match[2] ? 'minor' : 'major' }
}
