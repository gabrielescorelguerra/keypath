import { getChordQuality, type Chord } from './chords.ts'
import { MusicParseError } from './errors.ts'
import {
  chroma,
  intervalBetween,
  pitchClassOf,
  transpose,
  type NoteName,
  type PitchClass,
} from './notes.ts'

const PERFECT = new Set([1, 4, 5, 8, 11, 12, 15])

/**
 * Rótulo de grau de um intervalo, como se lê em cifras e livros de harmonia:
 * "1P" → "1", "3m" → "♭3", "5d" → "♭5", "7d" → "𝄫7", "9M" → "9", "11A" → "♯11".
 */
export function degreeLabel(interval: string): string {
  const match = /^(\d+)([PMmdA]+)$/.exec(interval)
  if (!match) throw new MusicParseError('Intervalo', interval)
  const number = Number(match[1])
  const quality = match[2] ?? ''
  let accidental = ''
  if (quality.startsWith('A')) accidental = '♯'.repeat(quality.length)
  else if (quality.startsWith('d'))
    accidental = PERFECT.has(number) ? '♭'.repeat(quality.length) : '𝄫'
  else if (quality === 'm') accidental = '♭'
  return `${accidental}${number}`
}

/** Grau de `note` em relação a `root`, dentro da oitava ("♭3", "5"). */
export function intervalLabel(root: PitchClass, note: PitchClass): string {
  return degreeLabel(intervalBetween(root, note))
}

/** Grau de cada nota de um acorde, pela classe de altura (C → "1", Eb → "♭3", D → "9"). */
export function chordToneLabels(chord: Chord): ReadonlyMap<number, string> {
  const labels = new Map<number, string>()
  for (const interval of getChordQuality(chord.quality).intervals) {
    labels.set(chroma(transpose(chord.root, interval)), degreeLabel(interval))
  }
  return labels
}

/** Rótulos de grau para notas concretas, a partir de um mapa por classe de altura (chroma). */
export function labelNotes(
  notes: readonly NoteName[],
  byChroma: ReadonlyMap<number, string>,
): ReadonlyMap<NoteName, string> {
  const result = new Map<NoteName, string>()
  for (const note of notes) {
    const label = byChroma.get(chroma(pitchClassOf(note)))
    if (label) result.set(note, label)
  }
  return result
}

/** Nome do intervalo em português pelo número de semitons (0–12). */
export const INTERVAL_NAMES: readonly string[] = [
  'uníssono',
  'segunda menor',
  'segunda maior',
  'terça menor',
  'terça maior',
  'quarta justa',
  'trítono',
  'quinta justa',
  'sexta menor',
  'sexta maior',
  'sétima menor',
  'sétima maior',
  'oitava',
]
