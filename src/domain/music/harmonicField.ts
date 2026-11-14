import { buildChord, identifyChordQuality, type Chord } from './chords.ts'
import { chordToDegree, type ChordDegree } from './degrees.ts'
import type { PitchClass } from './notes.ts'
import { scaleNotes, type ScaleType } from './scales.ts'

export type HarmonicFieldType = Extract<
  ScaleType,
  'major' | 'natural-minor' | 'harmonic-minor' | 'melodic-minor'
>
export type HarmonicFieldSize = 'triads' | 'sevenths'
export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant'

export interface HarmonicFieldChord {
  readonly degree: ChordDegree
  readonly chord: Chord
  /** Função harmônica — definida apenas para o campo maior. */
  readonly function: HarmonicFunction | null
}

const MAJOR_FUNCTIONS: readonly HarmonicFunction[] = [
  'tonic',
  'subdominant',
  'tonic',
  'subdominant',
  'dominant',
  'tonic',
  'dominant',
]

export const HARMONIC_FUNCTION_NAMES: Readonly<Record<HarmonicFunction, string>> = {
  tonic: 'Tônica',
  subdominant: 'Subdominante',
  dominant: 'Dominante',
}

/** Empilha terças sobre cada grau da escala. */
export function harmonicField(
  tonic: PitchClass,
  type: HarmonicFieldType = 'major',
  size: HarmonicFieldSize = 'triads',
): readonly HarmonicFieldChord[] {
  const scale = scaleNotes(tonic, type)
  const voices = size === 'triads' ? 3 : 4
  return scale.map((root, index) => {
    const notes = Array.from({ length: voices }, (_, v) => scale[(index + v * 2) % scale.length])
    const quality = identifyChordQuality(root, notes as PitchClass[])
    if (quality === null) {
      throw new Error(`Acorde não reconhecido no campo de ${tonic} ${type}: ${notes.join(' ')}`)
    }
    const chord = buildChord(root, quality)
    return {
      degree: chordToDegree(tonic, chord),
      chord,
      function: type === 'major' ? (MAJOR_FUNCTIONS[index] ?? null) : null,
    }
  })
}
