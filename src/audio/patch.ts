/** Parâmetros de um timbre do laboratório de síntese (subtrativa, dois osciladores). */
export interface SynthPatch {
  readonly wave: 'sine' | 'triangle' | 'sawtooth' | 'square'
  /** Desafinação do segundo oscilador, em cents (0 = um oscilador só). */
  readonly detune: number
  /** Corte do filtro passa-baixa, em Hz. */
  readonly cutoff: number
  /** Ressonância do filtro (Q). */
  readonly resonance: number
  /** Envelope de amplitude: tempos em segundos, sustain de 0 a 1. */
  readonly attack: number
  readonly decay: number
  readonly sustain: number
  readonly release: number
  /** LFO no corte do filtro: frequência (Hz) e profundidade (0–1). */
  readonly lfoRate: number
  readonly lfoDepth: number
}

export type PresetId = 'pad' | 'pluck' | 'lead' | 'strings' | 'organ' | 'bass'

export const PRESETS: Readonly<
  Record<PresetId, { readonly name: string; readonly patch: SynthPatch }>
> = {
  pad: {
    name: 'Pad',
    patch: {
      wave: 'sawtooth',
      detune: 12,
      cutoff: 1400,
      resonance: 1,
      attack: 0.9,
      decay: 0.6,
      sustain: 0.8,
      release: 1.8,
      lfoRate: 0.25,
      lfoDepth: 0.3,
    },
  },
  pluck: {
    name: 'Pluck',
    patch: {
      wave: 'sawtooth',
      detune: 0,
      cutoff: 2600,
      resonance: 5,
      attack: 0.005,
      decay: 0.28,
      sustain: 0,
      release: 0.25,
      lfoRate: 0,
      lfoDepth: 0,
    },
  },
  lead: {
    name: 'Lead',
    patch: {
      wave: 'square',
      detune: 7,
      cutoff: 4200,
      resonance: 2,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.85,
      release: 0.15,
      lfoRate: 5.5,
      lfoDepth: 0.08,
    },
  },
  strings: {
    name: 'Strings',
    patch: {
      wave: 'sawtooth',
      detune: 16,
      cutoff: 3000,
      resonance: 0.7,
      attack: 0.35,
      decay: 0.4,
      sustain: 0.85,
      release: 0.9,
      lfoRate: 4.5,
      lfoDepth: 0.04,
    },
  },
  organ: {
    name: 'Órgão',
    patch: {
      wave: 'square',
      detune: 0,
      cutoff: 1800,
      resonance: 0.5,
      attack: 0.008,
      decay: 0.05,
      sustain: 1,
      release: 0.06,
      lfoRate: 6,
      lfoDepth: 0.05,
    },
  },
  bass: {
    name: 'Baixo',
    patch: {
      wave: 'sawtooth',
      detune: 0,
      cutoff: 500,
      resonance: 6,
      attack: 0.005,
      decay: 0.22,
      sustain: 0.5,
      release: 0.1,
      lfoRate: 0,
      lfoDepth: 0,
    },
  },
}

export function isPresetId(value: string): value is PresetId {
  return Object.hasOwn(PRESETS, value)
}

/**
 * Pontos (tempo, nível) do envelope ADSR para desenhar: ataque, queda até o sustain,
 * uma nota segurada por `hold` segundos e o release.
 */
export function envelopePoints(
  patch: Pick<SynthPatch, 'attack' | 'decay' | 'sustain' | 'release'>,
  hold = 0.6,
): readonly (readonly [number, number])[] {
  const a = patch.attack
  const d = a + patch.decay
  const h = d + hold
  const r = h + patch.release
  return [
    [0, 0],
    [a, 1],
    [d, patch.sustain],
    [h, patch.sustain],
    [r, 0],
  ]
}
