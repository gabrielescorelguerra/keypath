import type { SplendidGrandPiano } from 'smplr'
import { getAudio } from './context.ts'

/**
 * Reprodução de notas (D: interface AudioPlayer). Usa amostras de piano (smplr),
 * carregadas da internet no primeiro toque; enquanto carregam — ou se falharem
 * (sem internet) — toca com um sintetizador simples, para o som responder na hora.
 */
/** Notas que soam juntas a partir de `at` segundos (relativo ao início), por `seconds`. */
export interface NoteEvent {
  readonly midis: readonly number[]
  readonly at: number
  readonly seconds: number
}

export interface AudioPlayer {
  /** Toca notas juntas (acorde). */
  playChord(midis: readonly number[], seconds?: number): void
  /** Toca uma sequência de acordes/notas, um passo após o outro. */
  playSequence(steps: readonly (readonly number[])[], stepSeconds?: number): void
  /** Toca eventos agendados, sem interromper o que já está soando. */
  playEvents(events: readonly NoteEvent[]): void
  stop(): void
  setVolume(volume: number): void
}

/** Atraso (s) entre o pedido e o primeiro som; a animação do teclado usa o mesmo valor. */
export const PLAYBACK_LATENCY = 0.04

type Piano = ReturnType<typeof SplendidGrandPiano>

class WebAudioPlayer implements AudioPlayer {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private piano: Piano | null = null
  private pianoReady = false
  private volume = 0.8
  private synthVoices = new Set<OscillatorNode>()

  private ensureContext(): AudioContext | null {
    const audio = getAudio()
    if (!audio) return null
    if (!this.context) {
      this.context = audio.context
      this.master = audio.context.createGain()
      this.master.gain.value = this.volume
      this.master.connect(audio.master)
      this.loadPiano(this.context, this.master)
    }
    return this.context
  }

  private loadPiano(context: AudioContext, destination: AudioNode) {
    // A biblioteca só é baixada no primeiro toque (deixa a abertura do app mais leve).
    import('smplr').then(
      ({ SplendidGrandPiano: createPiano }) => this.startPiano(createPiano, context, destination),
      () => {
        this.piano = null
      },
    )
  }

  private startPiano(
    createPiano: typeof SplendidGrandPiano,
    context: AudioContext,
    destination: AudioNode,
  ) {
    try {
      const piano = createPiano(context, {
        destination,
        // Uma camada de dinâmica e só a região usada nos exemplos: carrega rápido.
        notesToLoad: {
          notes: Array.from({ length: 61 }, (_, i) => 36 + i),
          velocityRange: [70, 90],
          fallback: 'nearest',
        },
      })
      this.piano = piano
      piano.load.then(
        () => {
          this.pianoReady = true
        },
        () => {
          this.piano = null
        },
      )
    } catch {
      this.piano = null
    }
  }

  private playNotes(midis: readonly number[], time: number, seconds: number) {
    if (this.piano && this.pianoReady) {
      for (const note of midis) {
        this.piano.start({ note, time, duration: seconds, velocity: 80 })
      }
      return
    }
    this.synth(midis, time, seconds)
  }

  /** Som simples (seno + triângulo com decaimento), parecido com um piano elétrico. */
  private synth(midis: readonly number[], time: number, seconds: number) {
    const context = this.context
    const master = this.master
    if (!context || !master) return
    const level = 0.22 / Math.max(1, Math.sqrt(midis.length))
    for (const midi of midis) {
      const frequency = 440 * 2 ** ((midi - 69) / 12)
      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0, time)
      envelope.gain.linearRampToValueAtTime(level, time + 0.01)
      envelope.gain.exponentialRampToValueAtTime(level * 0.3, time + seconds * 0.6)
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + seconds + 0.3)
      envelope.connect(master)
      for (const type of ['sine', 'triangle'] as const) {
        const oscillator = context.createOscillator()
        oscillator.type = type
        oscillator.frequency.value = type === 'sine' ? frequency : frequency * 2
        const gain = context.createGain()
        gain.gain.value = type === 'sine' ? 1 : 0.15
        oscillator.connect(gain).connect(envelope)
        oscillator.start(time)
        oscillator.stop(time + seconds + 0.35)
        this.synthVoices.add(oscillator)
        oscillator.onended = () => this.synthVoices.delete(oscillator)
      }
    }
  }

  playChord(midis: readonly number[], seconds = 1.6) {
    this.stop()
    this.playEvents([{ midis, at: 0, seconds }])
  }

  playSequence(steps: readonly (readonly number[])[], stepSeconds = 0.9) {
    this.stop()
    this.playEvents(
      steps.map((midis, index) => ({
        midis,
        at: index * stepSeconds,
        seconds: stepSeconds * 0.95,
      })),
    )
  }

  playEvents(events: readonly NoteEvent[]) {
    const context = this.ensureContext()
    if (!context) return
    const start = context.currentTime + PLAYBACK_LATENCY
    for (const event of events) this.playNotes(event.midis, start + event.at, event.seconds)
  }

  stop() {
    this.piano?.stop()
    for (const voice of this.synthVoices) {
      try {
        voice.stop()
      } catch {
        // já parado
      }
    }
    this.synthVoices.clear()
  }

  setVolume(volume: number) {
    this.volume = volume
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.02)
    }
  }
}

export const audioPlayer: AudioPlayer = new WebAudioPlayer()
