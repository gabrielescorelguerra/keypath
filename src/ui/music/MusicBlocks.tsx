import { useEffect, useRef, useState } from 'react'
import { useAudio } from '@/audio'
import { DEFAULT_SETTINGS, useSettings } from '@/data'
import {
  chordQualityName,
  chordToDegree,
  formatChord,
  formatDegree,
  formatPitchClass,
  notesToMidi,
  parseChord,
  parseKey,
  progressionToChords,
  SCALE_TYPES,
  voiceChord,
  voiceLead,
  voiceScale,
  type Chord,
  type NoteName,
  type ScaleType,
} from '@/domain/music'
import { Keyboard } from './Keyboard.tsx'
import { noteList } from './names.ts'
import styles from './Music.module.css'

function useNaming() {
  return (useSettings() ?? DEFAULT_SETTINGS).noteNaming
}

function PlayButton({
  onPlay,
  label = 'Tocar',
}: {
  readonly onPlay: () => void
  readonly label?: string
}) {
  const { enabled } = useAudio()
  if (!enabled) return null
  return (
    <button type="button" className={`button ${styles.play}`} onClick={onPlay}>
      ▶ {label}
    </button>
  )
}

/** ::chord — um acorde: cifra, qualidade, grau, notas e teclado. */
export function ChordBlock({
  symbol,
  inversion = 0,
  keyName,
  octave = 4,
}: {
  readonly symbol: string
  readonly inversion?: number
  readonly keyName?: string
  readonly octave?: number
}) {
  const naming = useNaming()
  const { player } = useAudio()
  const chord = parseChord(symbol)
  const notes = voiceChord(chord, { octave, inversion })
  const degree = keyName ? formatDegree(chordToDegree(parseKey(keyName).tonic, chord)) : null

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        <span className={styles.chordName}>{formatChord(chord)}</span>
        {degree && <span className={styles.degree}>{degree}</span>}
        <span className="muted small">
          {chordQualityName(chord.quality)}
          {inversion > 0 && ` · ${inversion}ª inversão`}
        </span>
        <PlayButton onPlay={() => player.playChord(notesToMidi(notes))} />
      </figcaption>
      <Keyboard notes={notes} naming={naming} />
      <p className={styles.notes}>{noteList(notes, naming)}</p>
    </figure>
  )
}

interface SequenceItem {
  readonly chord: Chord
  readonly main: string
  readonly sub: string | null
}

/** Sequência de acordes clicáveis com teclado e reprodução (base de ::chords e ::progression). */
function ChordSequence({
  items,
  caption,
}: {
  readonly items: readonly SequenceItem[]
  readonly caption?: string
}) {
  const naming = useNaming()
  const { player } = useAudio()
  const voicings = voiceLead(items.map((item) => item.chord))
  const [selected, setSelected] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t)
    },
    [],
  )

  const STEP = 0.9
  function playAll() {
    for (const t of timers.current) window.clearTimeout(t)
    player.playSequence(voicings.map(notesToMidi), STEP)
    timers.current = voicings.map((_, i) =>
      window.setTimeout(() => setSelected(i), i * STEP * 1000),
    )
  }

  const current: readonly NoteName[] = voicings[selected] ?? []

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        {caption && <span className="muted small">{caption}</span>}
        <PlayButton onPlay={playAll} label="Tocar a sequência" />
      </figcaption>
      <div className={styles.chips} role="group" aria-label="Acordes">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            className={styles.chip}
            aria-pressed={i === selected}
            onClick={() => {
              setSelected(i)
              player.playChord(notesToMidi(voicings[i] ?? []))
            }}
          >
            <span className={styles.chipMain}>{item.main}</span>
            {item.sub && <span className={styles.chipSub}>{item.sub}</span>}
          </button>
        ))}
      </div>
      <Keyboard notes={current} naming={naming} />
      <p className={styles.notes}>{noteList(current, naming)}</p>
    </figure>
  )
}

/** ::chords — lista de cifras (com graus, se houver tom). */
export function ChordsBlock({
  symbols,
  keyName,
}: {
  readonly symbols: string
  readonly keyName?: string
}) {
  const tonic = keyName ? parseKey(keyName).tonic : null
  const items = symbols
    .trim()
    .split(/\s+/)
    .map((symbol) => {
      const chord = parseChord(symbol)
      return {
        chord,
        main: formatChord(chord),
        sub: tonic ? formatDegree(chordToDegree(tonic, chord)) : null,
      }
    })
  return <ChordSequence items={items} />
}

/** ::progression — graus num tom, com as cifras correspondentes. */
export function ProgressionBlock({
  keyName,
  degrees,
}: {
  readonly keyName: string
  readonly degrees: string
}) {
  const naming = useNaming()
  const key = parseKey(keyName)
  const chords = progressionToChords(key.tonic, degrees)
  const items = chords.map((chord) => ({
    chord,
    main: formatDegree(chordToDegree(key.tonic, chord)),
    sub: formatChord(chord),
  }))
  const keyLabel = `${formatPitchClass(key.tonic, naming)} ${key.mode === 'major' ? 'maior' : 'menor'}`
  return <ChordSequence items={items} caption={`Em ${keyLabel}`} />
}

/** ::scale — escala no teclado, tocada subindo. */
export function ScaleBlock({
  root,
  type,
  octaves = 1,
}: {
  readonly root: string
  readonly type: ScaleType
  readonly octaves?: number
}) {
  const naming = useNaming()
  const { player } = useAudio()
  const notes = voiceScale(root, type, { octave: 4, octaves })
  const title = `${formatPitchClass(root, naming)} · ${SCALE_TYPES[type].name.toLowerCase()}`

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        <span className={styles.chordName}>Escala</span>
        <span>{title}</span>
        <PlayButton
          onPlay={() =>
            player.playSequence(
              notesToMidi(notes).map((m) => [m]),
              0.35,
            )
          }
          label="Tocar a escala"
        />
      </figcaption>
      <Keyboard notes={notes} naming={naming} minOctaves={octaves + 1} />
      <p className={styles.notes}>{noteList(notes.slice(0, -1), naming)}</p>
    </figure>
  )
}
