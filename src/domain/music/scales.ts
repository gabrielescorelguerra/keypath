import { Scale } from 'tonal'
import { MusicParseError } from './errors.ts'
import type { PitchClass } from './notes.ts'

export type ScaleType =
  | 'major'
  | 'natural-minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues'

interface ScaleDef {
  readonly tonalName: string
  readonly name: string
}

export const SCALE_TYPES: Readonly<Record<ScaleType, ScaleDef>> = {
  major: { tonalName: 'major', name: 'Maior' },
  'natural-minor': { tonalName: 'aeolian', name: 'Menor natural' },
  'harmonic-minor': { tonalName: 'harmonic minor', name: 'Menor harmônica' },
  'melodic-minor': { tonalName: 'melodic minor', name: 'Menor melódica' },
  ionian: { tonalName: 'ionian', name: 'Jônio' },
  dorian: { tonalName: 'dorian', name: 'Dórico' },
  phrygian: { tonalName: 'phrygian', name: 'Frígio' },
  lydian: { tonalName: 'lydian', name: 'Lídio' },
  mixolydian: { tonalName: 'mixolydian', name: 'Mixolídio' },
  aeolian: { tonalName: 'aeolian', name: 'Eólio' },
  locrian: { tonalName: 'locrian', name: 'Lócrio' },
  'major-pentatonic': { tonalName: 'major pentatonic', name: 'Pentatônica maior' },
  'minor-pentatonic': { tonalName: 'minor pentatonic', name: 'Pentatônica menor' },
  blues: { tonalName: 'minor blues', name: 'Blues' },
}

export function isScaleType(value: string): value is ScaleType {
  return Object.hasOwn(SCALE_TYPES, value)
}

/** Notas da escala, a partir da tônica, sem repetir a oitava. */
export function scaleNotes(root: PitchClass, type: ScaleType): readonly PitchClass[] {
  const def = SCALE_TYPES[type]
  const scale = Scale.get(`${root} ${def.tonalName}`)
  if (scale.empty) {
    throw new MusicParseError('Escala', `${root} ${type}`)
  }
  return scale.notes
}
