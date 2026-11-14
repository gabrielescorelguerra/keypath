import { useState } from 'react'
import { clampBpm, MAX_BPM, MIN_BPM, useMetronome } from '@/audio'
import styles from './Metronome.module.css'

const BAR_OPTIONS = [2, 3, 4, 6] as const

/** Metrônomo: andamento, compasso, iniciar/parar e indicador de tempo. */
export function MetronomeControl({ initialBpm = 80 }: { readonly initialBpm?: number }) {
  const metronome = useMetronome()
  const [bpm, setBpm] = useState(clampBpm(initialBpm))
  const [beats, setBeats] = useState<number>(4)

  const change = (nextBpm: number, nextBeats = beats) => {
    const value = clampBpm(nextBpm)
    setBpm(value)
    setBeats(nextBeats)
    metronome.update(value, nextBeats)
  }

  return (
    <div className={styles.metronome} role="group" aria-label="Metrônomo">
      <span className={styles.title}>Metrônomo</span>
      <div className={styles.controls}>
        <button
          type="button"
          className="button"
          aria-label="Diminuir 5 bpm"
          onClick={() => change(bpm - 5)}
        >
          −
        </button>
        <label className={styles.bpm}>
          <input
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            aria-label="Andamento em bpm"
            onChange={(event) => setBpm(Number(event.target.value))}
            onBlur={() => change(bpm)}
          />
          bpm
        </label>
        <button
          type="button"
          className="button"
          aria-label="Aumentar 5 bpm"
          onClick={() => change(bpm + 5)}
        >
          +
        </button>
        <select
          className={styles.select}
          value={beats}
          aria-label="Tempos por compasso"
          onChange={(event) => change(bpm, Number(event.target.value))}
        >
          {BAR_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}/4
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`button ${metronome.running ? '' : 'primary'}`}
          onClick={() => (metronome.running ? metronome.stop() : metronome.start(bpm, beats))}
        >
          {metronome.running ? '■ Parar' : '▶ Iniciar'}
        </button>
      </div>
      <div className={styles.dots} aria-hidden="true">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={styles.dot}
            data-on={metronome.beat === i}
            data-accent={i === 0}
          />
        ))}
      </div>
    </div>
  )
}
