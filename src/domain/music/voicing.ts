import type { Chord } from './chords.ts'
import { getChordQuality } from './chords.ts'
import { noteToMidi, transpose, type NoteName, type PitchClass } from './notes.ts'
import { scaleNotes, type ScaleType } from './scales.ts'

export interface ChordVoicingOptions {
  /** Oitava da fundamental (padrão 4: o Dó central é C4). */
  readonly octave?: number
  /** 0 = posição fundamental, 1 = primeira inversão, … */
  readonly inversion?: number
}

/**
 * Notas concretas de um acorde, da mais grave para a mais aguda.
 * Em acordes com baixo ("C/E"), o baixo fica uma oitava abaixo do acorde.
 */
export function voiceChord(chord: Chord, options: ChordVoicingOptions = {}): readonly NoteName[] {
  const { octave = 4, inversion = 0 } = options
  const quality = getChordQuality(chord.quality)
  const stacked: NoteName[] = quality.intervals.map((interval) =>
    transpose(`${chord.root}${octave}`, interval),
  )

  const steps = ((inversion % stacked.length) + stacked.length) % stacked.length
  for (let i = 0; i < steps; i++) {
    let moved = stacked.shift()
    if (moved === undefined) break
    // Sobe oitavas até ficar acima da nota mais aguda (importa em acordes com 9ª, 13ª…).
    const highest = Math.max(...stacked.map(noteToMidi))
    while (noteToMidi(moved) <= highest) {
      moved = transpose(moved, '8P')
    }
    stacked.push(moved)
  }

  if (chord.bass) {
    stacked.unshift(`${chord.bass}${octave - 1}`)
  }
  return stacked
}

/** Notas concretas de uma escala, subindo, incluindo a tônica no topo de cada oitava. */
export function voiceScale(
  root: PitchClass,
  type: ScaleType,
  options: { octave?: number; octaves?: number } = {},
): readonly NoteName[] {
  const { octave = 4, octaves = 1 } = options
  const start: NoteName = `${root}${octave}`
  const notes = scaleNotes(root, type)
  const result: NoteName[] = []

  for (let o = 0; o < octaves; o++) {
    const base = transpose(start, `${o * 7 + 1}P`)
    for (const pc of notes) {
      let note: NoteName = `${pc}${octaveOfBase(base)}`
      while (noteToMidi(note) < noteToMidi(base)) {
        note = transpose(note, '8P')
      }
      result.push(note)
    }
  }
  result.push(transpose(start, `${octaves * 7 + 1}P`))
  return result
}

function octaveOfBase(note: NoteName): number {
  return Number(/-?\d+$/.exec(note)?.[0] ?? 4)
}

export function notesToMidi(notes: readonly NoteName[]): readonly number[] {
  return notes.map(noteToMidi)
}

/**
 * Distribui uma sequência de acordes com condução de vozes simples: o primeiro em
 * posição fundamental; cada seguinte na inversão (e oitava) cujo centro fica mais
 * perto do acorde anterior — como um tecladista faria, sem pular pelo teclado.
 */
export function voiceLead(
  chords: readonly Chord[],
  options: { octave?: number } = {},
): NoteName[][] {
  const { octave = 4 } = options
  const center = (notes: readonly NoteName[], chord: Chord) => {
    const upper = chord.bass ? notes.slice(1) : notes
    const midis = upper.map(noteToMidi)
    return midis.reduce((sum, m) => sum + m, 0) / midis.length
  }

  const result: NoteName[][] = []
  let previous: number | null = null
  for (const chord of chords) {
    if (previous === null) {
      const first = [...voiceChord(chord, { octave })]
      result.push(first)
      previous = center(first, chord)
      continue
    }
    const size = getChordQuality(chord.quality).intervals.length
    let best: NoteName[] | null = null
    let bestDistance = Infinity
    for (const o of [octave - 1, octave]) {
      for (let inversion = 0; inversion < size; inversion++) {
        const candidate = [...voiceChord(chord, { octave: o, inversion })]
        const distance = Math.abs(center(candidate, chord) - previous)
        if (distance < bestDistance - 1e-9) {
          best = candidate
          bestDistance = distance
        }
      }
    }
    if (best) {
      result.push(best)
      previous = center(best, chord)
    }
  }
  return result
}
