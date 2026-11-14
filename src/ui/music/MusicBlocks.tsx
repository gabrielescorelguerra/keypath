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
import { Icon } from '../Icon.tsx'
import { Keyboard } from './Keyboard.tsx'
import { noteList } from './names.ts'
import { chordScore, sequenceScore, stepStarts } from './score.ts'
import { setSlowMotion, usePlayback, useSlowMotion } from './usePlayback.ts'
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
    <button type="button" className={styles.play} onClick={onPlay}>
      <span className={styles.playIcon} aria-hidden="true">
        <Icon name="play" size={14} />
      </span>
      {label}
    </button>
  )
}

/** Alterna a câmera lenta (vale para todos os exemplos da página). */
function SlowMotionToggle() {
  const { enabled } = useAudio()
  const slow = useSlowMotion()
  if (!enabled) return null
  return (
    <button
      type="button"
      className={styles.slow}
      aria-pressed={slow}
      title="Toca mais devagar e arpeja os acordes, nota por nota"
      onClick={() => setSlowMotion(!slow)}
    >
      <Icon name="clock" size={14} />
      Câmera lenta
    </button>
  )
}

/** Controles de reprodução do cabeçalho de um exemplo. */
function Controls({ onPlay, label }: { readonly onPlay: () => void; readonly label?: string }) {
  return (
    <span className={styles.controls}>
      <SlowMotionToggle />
      <PlayButton onPlay={onPlay} {...(label ? { label } : {})} />
    </span>
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
  const playback = usePlayback()
  const slow = useSlowMotion()
  const chord = parseChord(symbol)
  const notes = voiceChord(chord, { octave, inversion })
  const degree = keyName ? formatDegree(chordToDegree(parseKey(keyName).tonic, chord)) : null

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        <span className={styles.chordName}>{formatChord(chord)}</span>
        {degree && <span className={styles.degree}>{degree}</span>}
        <span className={styles.caption}>
          {chordQualityName(chord.quality)}
          {inversion > 0 && ` · ${inversion}ª inversão`}
        </span>
        <Controls onPlay={() => playback.play(chordScore(notesToMidi(notes), slow))} />
      </figcaption>
      <div className={styles.keys}>
        <Keyboard
          notes={notes}
          naming={naming}
          pressed={playback.pressed}
          onPress={playback.press}
          onRelease={playback.release}
        />
      </div>
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
  const playback = usePlayback()
  const slow = useSlowMotion()
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
    playback.play(sequenceScore(voicings.map(notesToMidi), STEP, slow))
    timers.current = stepStarts(voicings.length, STEP, slow).map((at, i) =>
      window.setTimeout(() => setSelected(i), at * 1000),
    )
  }

  const current: readonly NoteName[] = voicings[selected] ?? []

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        {caption && <span className={styles.caption}>{caption}</span>}
        <Controls onPlay={playAll} label="Tocar a sequência" />
      </figcaption>
      <div className={styles.chips} role="group" aria-label="Acordes">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            className={styles.chip}
            aria-pressed={i === selected}
            onClick={() => {
              for (const t of timers.current) window.clearTimeout(t)
              setSelected(i)
              playback.play(chordScore(notesToMidi(voicings[i] ?? []), slow))
            }}
          >
            <span className={styles.chipMain}>{item.main}</span>
            {item.sub && <span className={styles.chipSub}>{item.sub}</span>}
          </button>
        ))}
      </div>
      <div className={styles.keys}>
        <Keyboard
          notes={current}
          naming={naming}
          pressed={playback.pressed}
          onPress={playback.press}
          onRelease={playback.release}
        />
      </div>
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
  const playback = usePlayback()
  const slow = useSlowMotion()
  const notes = voiceScale(root, type, { octave: 4, octaves })
  const title = `${formatPitchClass(root, naming)} · ${SCALE_TYPES[type].name.toLowerCase()}`

  return (
    <figure className={styles.block}>
      <figcaption className={styles.header}>
        <span className={styles.chordName}>{title}</span>
        <Controls
          onPlay={() =>
            playback.play(
              sequenceScore(
                notesToMidi(notes).map((m) => [m]),
                0.35,
                slow,
              ),
            )
          }
          label="Tocar a escala"
        />
      </figcaption>
      <div className={styles.keys}>
        <Keyboard
          notes={notes}
          naming={naming}
          minOctaves={octaves + 1}
          pressed={playback.pressed}
          onPress={playback.press}
          onRelease={playback.release}
        />
      </div>
      <p className={styles.notes}>{noteList(notes.slice(0, -1), naming)}</p>
    </figure>
  )
}
