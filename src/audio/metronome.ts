import { getAudio } from './context.ts'
import { clampBpm, scheduleBeats, type MetronomeState } from './metronomeSchedule.ts'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.12

/**
 * Metrônomo com agendamento antecipado no relógio do Web Audio (preciso mesmo com a
 * aba ocupada). `onBeat` é chamado na hora de cada batida, para o indicador visual.
 */
export class Metronome {
  private state: MetronomeState | null = null
  private timer: number | null = null
  private pendingVisuals: number[] = []
  private volume = 0.8

  private readonly onBeat: (beat: number) => void

  constructor(onBeat: (beat: number) => void = () => {}) {
    this.onBeat = onBeat
  }

  get running(): boolean {
    return this.state !== null
  }

  start(bpm: number, beatsPerBar: number): void {
    const audio = getAudio()
    if (!audio) return
    this.stop()
    this.state = {
      bpm: clampBpm(bpm),
      beatsPerBar,
      nextTime: audio.context.currentTime + 0.05,
      nextBeat: 0,
    }
    this.tick()
    this.timer = window.setInterval(() => this.tick(), LOOKAHEAD_MS)
  }

  /** Muda o andamento sem reiniciar. */
  update(bpm: number, beatsPerBar: number): void {
    if (this.state) this.state = { ...this.state, bpm: clampBpm(bpm), beatsPerBar }
  }

  setVolume(volume: number): void {
    this.volume = volume
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer)
    for (const t of this.pendingVisuals) window.clearTimeout(t)
    this.pendingVisuals = []
    this.timer = null
    this.state = null
  }

  private tick(): void {
    const audio = getAudio()
    if (!audio || !this.state) return
    const { context } = audio
    const { beats, state } = scheduleBeats(this.state, context.currentTime + SCHEDULE_AHEAD_S)
    this.state = state
    for (const beat of beats) {
      this.click(context, beat.time, beat.accent)
      const delay = Math.max(0, (beat.time - context.currentTime) * 1000)
      this.pendingVisuals.push(window.setTimeout(() => this.onBeat(beat.beat), delay))
    }
    if (this.pendingVisuals.length > 64) this.pendingVisuals = this.pendingVisuals.slice(-16)
  }

  private click(context: AudioContext, time: number, accent: boolean): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = accent ? 1600 : 1000
    const level = (accent ? 0.6 : 0.35) * this.volume
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(time)
    oscillator.stop(time + 0.06)
  }
}
