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
interface Effects {
  readonly input: GainNode
  readonly chorusWet: GainNode
  readonly chorusLfo: OscillatorNode
  readonly delay: DelayNode
  readonly delayFeedback: GainNode
  readonly delayWet: GainNode
  readonly reverb: ConvolverNode
  readonly reverbWet: GainNode
  reverbSize: number
}

/** Resposta ao impulso sintética: ruído estéreo com decaimento — um reverb de sala simples. */
function impulse(context: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds))
  const buffer = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.5
  }
  return buffer
}

export class SynthLab {
  private patch: SynthPatch
  private voices = new Map<number, Voice>()
  private volume = 0.8
  private effects: Effects | null = null

  constructor(patch: SynthPatch) {
    this.patch = patch
  }

  setPatch(patch: SynthPatch): void {
    this.patch = patch
    if (this.effects) this.applyEffects(this.effects)
  }

  /** Cadeia de efeitos em paralelo (seco + chorus + delay + reverb), montada no primeiro toque. */
  private ensureEffects(context: AudioContext, master: AudioNode): Effects {
    if (this.effects) return this.effects
    const input = context.createGain()
    input.connect(master)

    const chorusDelay = context.createDelay(0.1)
    chorusDelay.delayTime.value = 0.018
    const chorusLfo = context.createOscillator()
    chorusLfo.frequency.value = 0.8
    const chorusDepth = context.createGain()
    chorusDepth.gain.value = 0.004
    chorusLfo.connect(chorusDepth).connect(chorusDelay.delayTime)
    chorusLfo.start()
    const chorusWet = context.createGain()
    input.connect(chorusDelay).connect(chorusWet).connect(master)

    const delay = context.createDelay(2)
    const delayFeedback = context.createGain()
    const delayWet = context.createGain()
    input.connect(delay)
    delay.connect(delayFeedback).connect(delay)
    delay.connect(delayWet).connect(master)

    const reverb = context.createConvolver()
    const reverbWet = context.createGain()
    input.connect(reverb).connect(reverbWet).connect(master)

    this.effects = {
      input,
      chorusWet,
      chorusLfo,
      delay,
      delayFeedback,
      delayWet,
      reverb,
      reverbWet,
      reverbSize: 0,
    }
    this.applyEffects(this.effects)
    return this.effects
  }

  private applyEffects(fx: Effects): void {
    const p = this.patch
    const now = fx.input.context.currentTime
    fx.chorusWet.gain.setTargetAtTime(p.chorus * 0.8, now, 0.02)
    fx.delay.delayTime.setTargetAtTime(p.delayTime, now, 0.02)
    fx.delayFeedback.gain.setTargetAtTime(Math.min(0.9, p.delayFeedback), now, 0.02)
    fx.delayWet.gain.setTargetAtTime(p.delayMix * 0.7, now, 0.02)
    fx.reverbWet.gain.setTargetAtTime(p.reverbMix * 1.2, now, 0.02)
    if (Math.abs(fx.reverbSize - p.reverbSize) > 0.05) {
      fx.reverb.buffer = impulse(fx.input.context, p.reverbSize)
      fx.reverbSize = p.reverbSize
    }
  }

  /** Desliga a cadeia de efeitos (ao sair da página). */
  dispose(): void {
    this.stopAll()
    if (!this.effects) return
    this.effects.chorusLfo.stop()
    this.effects.input.disconnect()
    this.effects = null
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
    filter.connect(amp).connect(this.ensureEffects(context, master).input)

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
