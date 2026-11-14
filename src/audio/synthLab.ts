import { getAudio } from './context.ts'
import type { SynthPatch } from './patch.ts'

interface Voice {
  readonly sources: readonly OscillatorNode[]
  readonly amp: GainNode
}

const PEAK = 0.22

/**
 * Sintetizador subtrativo do laboratório: 1–2 osciladores → filtro passa-baixa
 * (com LFO no corte) → envelope ADSR de amplitude. Polifônico, uma voz por tecla.
 */
export class SynthLab {
  private patch: SynthPatch
  private voices = new Map<number, Voice>()
  private volume = 0.8

  constructor(patch: SynthPatch) {
    this.patch = patch
  }

  setPatch(patch: SynthPatch): void {
    this.patch = patch
  }

  setVolume(volume: number): void {
    this.volume = volume
  }

  noteOn(midi: number): void {
    const audio = getAudio()
    if (!audio) return
    this.noteOff(midi)
    const { context, master } = audio
    const p = this.patch
    const now = context.currentTime
    const frequency = 440 * 2 ** ((midi - 69) / 12)

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = p.cutoff
    filter.Q.value = p.resonance

    const amp = context.createGain()
    const level = PEAK * this.volume
    amp.gain.setValueAtTime(0, now)
    amp.gain.linearRampToValueAtTime(level, now + Math.max(0.003, p.attack))
    amp.gain.linearRampToValueAtTime(
      level * p.sustain,
      now + Math.max(0.003, p.attack) + Math.max(0.003, p.decay),
    )
    filter.connect(amp).connect(master)

    const sources: OscillatorNode[] = []
    const detunes = p.detune > 0 ? [-p.detune / 2, p.detune / 2] : [0]
    for (const cents of detunes) {
      const osc = context.createOscillator()
      osc.type = p.wave
      osc.frequency.value = frequency
      osc.detune.value = cents
      const gain = context.createGain()
      gain.gain.value = 1 / detunes.length
      osc.connect(gain).connect(filter)
      osc.start(now)
      sources.push(osc)
    }

    if (p.lfoRate > 0 && p.lfoDepth > 0) {
      const lfo = context.createOscillator()
      lfo.frequency.value = p.lfoRate
      const depth = context.createGain()
      depth.gain.value = p.cutoff * p.lfoDepth
      lfo.connect(depth).connect(filter.frequency)
      lfo.start(now)
      sources.push(lfo)
    }

    this.voices.set(midi, { sources, amp })
  }

  noteOff(midi: number): void {
    const voice = this.voices.get(midi)
    const audio = getAudio()
    if (!voice || !audio) return
    this.voices.delete(midi)
    const now = audio.context.currentTime
    const release = Math.max(0.01, this.patch.release)
    const gain = voice.amp.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(0, now + release)
    for (const source of voice.sources) source.stop(now + release + 0.05)
  }

  stopAll(): void {
    for (const midi of [...this.voices.keys()]) this.noteOff(midi)
  }
}
