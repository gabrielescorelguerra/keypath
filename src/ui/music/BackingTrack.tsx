import { useEffect, useRef, useState } from 'react'
import { clampBpm, useAudio } from '@/audio'
import type { Backing } from '@/domain/catalog'
import {
  chordToDegree,
  formatChord,
  formatDegree,
  notesToMidi,
  parseKey,
  progressionToChords,
  voiceLead,
} from '@/domain/music'
import { DEFAULT_SETTINGS, useSettings } from '@/data'
import { Icon } from '../Icon.tsx'
import { Keyboard } from './Keyboard.tsx'
import styles from './Music.module.css'
import { usePlayback } from './usePlayback.ts'

const LOOPS = 8

/**
 * Playback: a progressão do exercício em loop, um acorde por compasso (baixo na
 * mão esquerda e acorde conduzido), no andamento escolhido — para tocar junto.
 */
export function BackingTrack({
  backing,
  initialBpm,
}: {
  readonly backing: Backing
  readonly initialBpm: number
}) {
  const { enabled } = useAudio()
  const naming = (useSettings() ?? DEFAULT_SETTINGS).noteNaming
  const playback = usePlayback()
  const [bpm, setBpm] = useState(clampBpm(initialBpm))
  const [current, setCurrent] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const key = parseKey(backing.key)
  const chords = progressionToChords(key.tonic, backing.degrees)
  const voicings = voiceLead(chords)

  const clear = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current.length = 0
  }
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const t of pending) window.clearTimeout(t)
    }
  }, [timers])

  if (!enabled) return null

  function start() {
    clear()
    const bar = (60 / bpm) * backing.beatsPerChord
    const events = []
    for (let loop = 0; loop < LOOPS; loop++) {
      for (let i = 0; i < chords.length; i++) {
        const at = (loop * chords.length + i) * bar
        const chord = chords[i]
        const bass = chord ? notesToMidi([`${chord.root}2`])[0] : undefined
        const midis = [...(bass === undefined ? [] : [bass]), ...notesToMidi(voicings[i] ?? [])]
        events.push({ midis, at, seconds: bar * 0.92 })
        timers.current.push(window.setTimeout(() => setCurrent(i), at * 1000))
      }
    }
    timers.current.push(
      window.setTimeout(() => setCurrent(null), LOOPS * chords.length * bar * 1000),
    )
    playback.play(events)
  }

  function stop() {
    clear()
    playback.stop()
    setCurrent(null)
  }

  const playing = current !== null

  return (
    <div className={styles.backing} role="group" aria-label="Playback">
      <div className={styles.backingTop}>
        <span className={styles.backingTitle}>Playback para tocar junto</span>
        <label className={styles.backingBpm}>
          <input
            type="number"
            min={30}
            max={240}
            value={bpm}
            disabled={playing}
            onChange={(event) => setBpm(clampBpm(Number(event.target.value) || bpm))}
          />
          bpm
        </label>
        <button
          type="button"
          className={styles.play}
          onClick={playing ? stop : start}
          aria-pressed={playing}
        >
          <span className={styles.playIcon} aria-hidden="true">
            <Icon name={playing ? 'stop' : 'play'} size={14} />
          </span>
          {playing ? 'Parar' : 'Tocar playback'}
        </button>
      </div>
      <ol className={styles.backingChords} aria-label="Progressão">
        {chords.map((chord, i) => (
          <li key={i} aria-current={current === i ? 'true' : undefined}>
            <span className={styles.chipMain}>{formatDegree(chordToDegree(key.tonic, chord))}</span>
            <span className={styles.chipSub}>{formatChord(chord)}</span>
          </li>
        ))}
      </ol>
      <div className={styles.keys}>
        <Keyboard notes={[]} naming={naming} pressed={playback.pressed} />
      </div>
    </div>
  )
}
