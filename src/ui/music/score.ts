import type { NoteEvent } from '@/audio'

/** Quanto a câmera lenta estica o tempo. */
export const SLOW_FACTOR = 2.5
/** Intervalo entre as notas de um acorde arpejado na câmera lenta (s). */
const ROLL = 0.45

/**
 * Acorde: em tempo normal, todas as notas juntas; em câmera lenta, uma de cada
 * vez, de baixo para cima, sustentadas até soarem todas juntas.
 */
export function chordScore(midis: readonly number[], slow: boolean): NoteEvent[] {
  if (!slow) return [{ midis, at: 0, seconds: 1.6 }]
  const sorted = [...midis].sort((a, b) => a - b)
  const end = sorted.length * ROLL + 1.6
  return sorted.map((midi, i) => ({ midis: [midi], at: i * ROLL, seconds: end - i * ROLL }))
}

/**
 * Sequência de passos (acordes ou notas). Em câmera lenta, cada passo dura
 * `SLOW_FACTOR` vezes mais e os acordes são levemente arpejados.
 */
export function sequenceScore(
  steps: readonly (readonly number[])[],
  stepSeconds: number,
  slow: boolean,
): NoteEvent[] {
  const step = slow ? stepSeconds * SLOW_FACTOR : stepSeconds
  return steps.flatMap((midis, index) => {
    const at = index * step
    const seconds = step * 0.95
    if (!slow || midis.length < 2) return [{ midis, at, seconds }]
    const roll = Math.min(0.15, step / (midis.length * 3))
    return [...midis]
      .sort((a, b) => a - b)
      .map((midi, i) => ({ midis: [midi], at: at + i * roll, seconds: seconds - i * roll }))
  })
}

/** Início de cada passo de uma sequência, em segundos. */
export function stepStarts(count: number, stepSeconds: number, slow: boolean): number[] {
  const step = slow ? stepSeconds * SLOW_FACTOR : stepSeconds
  return Array.from({ length: count }, (_, i) => i * step)
}
