/** Agenda de batidas do metrônomo — pura, para testar sem áudio. */
export interface MetronomeState {
  readonly bpm: number
  readonly beatsPerBar: number
  /** Tempo (em segundos do AudioContext) da próxima batida. */
  readonly nextTime: number
  /** Índice da próxima batida no compasso (0 = acentuada). */
  readonly nextBeat: number
}

export interface ScheduledBeat {
  readonly time: number
  readonly beat: number
  readonly accent: boolean
}

export const MIN_BPM = 30
export const MAX_BPM = 240

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** Batidas que caem antes de `until` e o estado seguinte. */
export function scheduleBeats(
  state: MetronomeState,
  until: number,
): { readonly beats: readonly ScheduledBeat[]; readonly state: MetronomeState } {
  const interval = 60 / clampBpm(state.bpm)
  const beats: ScheduledBeat[] = []
  let { nextTime, nextBeat } = state
  while (nextTime < until) {
    beats.push({ time: nextTime, beat: nextBeat, accent: nextBeat === 0 })
    nextTime += interval
    nextBeat = (nextBeat + 1) % Math.max(1, state.beatsPerBar)
  }
  return { beats, state: { ...state, nextTime, nextBeat } }
}
