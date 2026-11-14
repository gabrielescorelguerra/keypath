import { useEffect, useRef, useState } from 'react'
import {
  envelopePoints,
  PRESETS,
  SynthLab as SynthEngine,
  useAudio,
  type PresetId,
  type SynthPatch,
} from '@/audio'
import { DEFAULT_SETTINGS, useSettings } from '@/data'
import { Keyboard } from './Keyboard.tsx'
import styles from './SynthLab.module.css'

const WAVES: readonly { id: SynthPatch['wave']; label: string }[] = [
  { id: 'sine', label: 'Senoide' },
  { id: 'triangle', label: 'Triangular' },
  { id: 'sawtooth', label: 'Dente de serra' },
  { id: 'square', label: 'Quadrada' },
]

/** Ponto de divisão do teclado: Dó3 (MIDI 48). */
const SPLIT_POINT = 48

const MIN_CUTOFF = 80
const MAX_CUTOFF = 12000
const toCutoff = (v: number) => Math.round(MIN_CUTOFF * (MAX_CUTOFF / MIN_CUTOFF) ** (v / 1000))
const fromCutoff = (hz: number) =>
  Math.round((1000 * Math.log(hz / MIN_CUTOFF)) / Math.log(MAX_CUTOFF / MIN_CUTOFF))

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  readonly label: string
  readonly value: number
  readonly display: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly onChange: (value: number) => void
}) {
  return (
    <label className={styles.slider}>
      <span className={styles.sliderHead}>
        <span>{label}</span>
        <output className={styles.value}>{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

const seconds = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`)

/** Desenho do envelope ADSR. */
function EnvelopeCurve({ patch }: { readonly patch: SynthPatch }) {
  const points = envelopePoints(patch)
  const total = points[points.length - 1]?.[0] ?? 1
  const w = 220
  const h = 64
  const d = points
    .map(
      ([t, l], i) =>
        `${i === 0 ? 'M' : 'L'}${((t / total) * w).toFixed(1)},${(h - l * (h - 4)).toFixed(1)}`,
    )
    .join(' ')
  return (
    <svg className={styles.curve} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`${d} L${w},${h} L0,${h} Z`} className={styles.curveFill} />
      <path d={d} className={styles.curveLine} />
    </svg>
  )
}

/**
 * ::synth — laboratório de síntese subtrativa: oscilador, filtro, envelope ADSR e LFO,
 * tocado no teclado da tela. Para ouvir o efeito de cada parâmetro na hora.
 */
export function SynthLab({
  preset = 'pad',
  split,
  layer,
}: {
  readonly preset?: PresetId
  /** Timbre da mão esquerda, abaixo de Dó3 (divisão do teclado). */
  readonly split?: PresetId | undefined
  /** Timbre sobreposto ao principal, no teclado inteiro (camada). */
  readonly layer?: PresetId | undefined
}) {
  const { enabled } = useAudio()
  const settings = useSettings() ?? DEFAULT_SETTINGS
  const [patch, setPatch] = useState<SynthPatch>(PRESETS[preset].patch)
  const [active, setActive] = useState<PresetId | null>(preset)
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set())
  const engine = useRef<SynthEngine | null>(null)
  engine.current ??= new SynthEngine(patch)
  const second = useRef<SynthEngine | null>(null)
  const secondPreset = split ?? layer
  second.current ??= secondPreset ? new SynthEngine(PRESETS[secondPreset].patch) : null
  /** Qual motor toca cada tecla: na divisão, abaixo de Dó3 vai para o timbre da esquerda. */
  const enginesFor = (midi: number) => {
    const main = engine.current
    const other = second.current
    if (split && other) return [midi < SPLIT_POINT ? other : main]
    if (layer && other) return [main, other]
    return [main]
  }

  useEffect(() => {
    engine.current?.setPatch(patch)
  }, [patch])
  useEffect(() => {
    engine.current?.setVolume(settings.volume)
    second.current?.setVolume(settings.volume * 0.85)
  }, [settings.volume])
  useEffect(() => {
    const synths = [engine.current, second.current]
    return () => {
      for (const synth of synths) synth?.dispose()
    }
  }, [])

  const set = (changes: Partial<SynthPatch>) => {
    setPatch((current) => ({ ...current, ...changes }))
    setActive(null)
  }

  if (!enabled) {
    return (
      <p className={styles.off}>
        O laboratório de síntese precisa do som ligado (Configurações → Som).
      </p>
    )
  }

  return (
    <figure className={styles.lab}>
      <figcaption className={styles.header}>
        <span className={styles.title}>Laboratório de síntese</span>
        <span className={styles.presets} role="group" aria-label="Timbres prontos">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={styles.preset}
              aria-pressed={active === id}
              onClick={() => {
                setPatch(PRESETS[id].patch)
                setActive(id)
              }}
            >
              {PRESETS[id].name}
            </button>
          ))}
        </span>
      </figcaption>

      <div className={styles.modules}>
        <fieldset className={styles.module}>
          <legend>Oscilador</legend>
          <div className={styles.waves} role="radiogroup" aria-label="Forma de onda">
            {WAVES.map((wave) => (
              <button
                key={wave.id}
                type="button"
                role="radio"
                aria-checked={patch.wave === wave.id}
                className={styles.wave}
                onClick={() => set({ wave: wave.id })}
              >
                {wave.label}
              </button>
            ))}
          </div>
          <Slider
            label="Desafinação (2º oscilador)"
            value={patch.detune}
            display={patch.detune === 0 ? 'desligado' : `${patch.detune} cents`}
            min={0}
            max={40}
            step={1}
            onChange={(detune) => set({ detune })}
          />
        </fieldset>

        <fieldset className={styles.module}>
          <legend>Filtro passa-baixa</legend>
          <Slider
            label="Corte"
            value={fromCutoff(patch.cutoff)}
            display={`${patch.cutoff} Hz`}
            min={0}
            max={1000}
            step={1}
            onChange={(v) => set({ cutoff: toCutoff(v) })}
          />
          <Slider
            label="Ressonância"
            value={patch.resonance}
            display={patch.resonance.toFixed(1)}
            min={0.1}
            max={15}
            step={0.1}
            onChange={(resonance) => set({ resonance })}
          />
        </fieldset>

        <fieldset className={styles.module}>
          <legend>Envelope (ADSR)</legend>
          <EnvelopeCurve patch={patch} />
          <Slider
            label="Ataque"
            value={patch.attack}
            display={seconds(patch.attack)}
            min={0.005}
            max={3}
            step={0.005}
            onChange={(attack) => set({ attack })}
          />
          <Slider
            label="Queda (decay)"
            value={patch.decay}
            display={seconds(patch.decay)}
            min={0.01}
            max={3}
            step={0.01}
            onChange={(decay) => set({ decay })}
          />
          <Slider
            label="Sustentação"
            value={patch.sustain}
            display={`${Math.round(patch.sustain * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            onChange={(sustain) => set({ sustain })}
          />
          <Slider
            label="Release"
            value={patch.release}
            display={seconds(patch.release)}
            min={0.01}
            max={4}
            step={0.01}
            onChange={(release) => set({ release })}
          />
        </fieldset>

        <fieldset className={styles.module}>
          <legend>Efeitos</legend>
          <Slider
            label="Chorus"
            value={patch.chorus}
            display={`${Math.round(patch.chorus * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            onChange={(chorus) => set({ chorus })}
          />
          <Slider
            label="Delay — tempo"
            value={patch.delayTime}
            display={seconds(patch.delayTime)}
            min={0.05}
            max={1.5}
            step={0.005}
            onChange={(delayTime) => set({ delayTime })}
          />
          <Slider
            label="Delay — repetições"
            value={patch.delayFeedback}
            display={`${Math.round(patch.delayFeedback * 100)}%`}
            min={0}
            max={0.9}
            step={0.01}
            onChange={(delayFeedback) => set({ delayFeedback })}
          />
          <Slider
            label="Delay — mix"
            value={patch.delayMix}
            display={`${Math.round(patch.delayMix * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            onChange={(delayMix) => set({ delayMix })}
          />
          <Slider
            label="Reverb — tamanho"
            value={patch.reverbSize}
            display={seconds(patch.reverbSize)}
            min={0.3}
            max={8}
            step={0.1}
            onChange={(reverbSize) => set({ reverbSize })}
          />
          <Slider
            label="Reverb — mix"
            value={patch.reverbMix}
            display={`${Math.round(patch.reverbMix * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            onChange={(reverbMix) => set({ reverbMix })}
          />
        </fieldset>

        <fieldset className={styles.module}>
          <legend>LFO → corte do filtro</legend>
          <Slider
            label="Velocidade"
            value={patch.lfoRate}
            display={patch.lfoRate === 0 ? 'desligado' : `${patch.lfoRate.toFixed(2)} Hz`}
            min={0}
            max={12}
            step={0.05}
            onChange={(lfoRate) => set({ lfoRate })}
          />
          <Slider
            label="Profundidade"
            value={patch.lfoDepth}
            display={`${Math.round(patch.lfoDepth * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            onChange={(lfoDepth) => set({ lfoDepth })}
          />
        </fieldset>
      </div>

      <div className={styles.keys}>
        <Keyboard
          notes={[]}
          naming={settings.noteNaming}
          minOctaves={split ? 3 : 2}
          pressed={held}
          onPress={(midi) => {
            for (const synth of enginesFor(midi)) synth?.noteOn(midi)
            setHeld((current) => new Set(current).add(midi))
          }}
          onRelease={(midi) => {
            for (const synth of enginesFor(midi)) synth?.noteOff(midi)
            setHeld((current) => {
              if (!current.has(midi)) return current
              const next = new Set(current)
              next.delete(midi)
              return next
            })
          }}
        />
      </div>
      {secondPreset && (
        <p className={styles.mode}>
          {split
            ? `Teclado dividido: ${PRESETS[secondPreset].name} na mão esquerda (abaixo de Dó3) e o timbre editável na direita.`
            : `Camada: ${PRESETS[secondPreset].name} soando junto com o timbre editável em todo o teclado.`}
        </p>
      )}
      <p className={styles.hint}>
        Segure uma tecla para ouvir ataque, queda e sustentação; solte para ouvir o release.
      </p>
    </figure>
  )
}
