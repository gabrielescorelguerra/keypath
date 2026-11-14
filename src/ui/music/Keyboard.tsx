import type { PointerEvent } from 'react'
import {
  formatPitchClass,
  noteToMidi,
  pitchClassOf,
  type NoteName,
  type NoteNaming,
} from '@/domain/music'
import styles from './Music.module.css'

const WHITE = new Set([0, 2, 4, 5, 7, 9, 11])
const WHITE_WIDTH = 24
const WHITE_HEIGHT = 112
const BLACK_WIDTH = 14
const BLACK_HEIGHT = 70

/** Nome curto para caber na tecla ("Dó♯", "C♯"); com "os dois", usa o latino. */
function keyLabel(note: NoteName, naming: NoteNaming): string {
  return formatPitchClass(pitchClassOf(note), naming === 'letters' ? 'letters' : 'latin')
}

/**
 * Teclado com as notas destacadas. A extensão cobre as notas em oitavas completas
 * (de Dó a Si), com pelo menos `minOctaves`. As teclas em `pressed` aparecem
 * afundadas (soando); com `onPress`, as teclas podem ser tocadas com o mouse ou o
 * dedo, inclusive arrastando de uma para outra.
 */
export function Keyboard({
  notes,
  naming,
  minOctaves = 2,
  pressed,
  onPress,
  onRelease,
  labels,
}: {
  readonly notes: readonly NoteName[]
  readonly naming: NoteNaming
  readonly minOctaves?: number
  readonly pressed?: ReadonlySet<number>
  readonly onPress?: (midi: number) => void
  readonly onRelease?: (midi: number) => void
  /** Rótulos no lugar dos nomes das notas (ex.: graus "1", "♭3"). */
  readonly labels?: ReadonlyMap<NoteName, string> | undefined
}) {
  const textFor = (note: NoteName) => labels?.get(note) ?? keyLabel(note, naming)
  const playable = onPress !== undefined
  const keyProps = (midi: number) =>
    playable
      ? {
          onPointerDown: (event: PointerEvent<SVGRectElement>) => {
            event.preventDefault()
            // Libera a captura para que arrastar passe às teclas vizinhas.
            event.currentTarget.releasePointerCapture?.(event.pointerId)
            onPress(midi)
          },
          onPointerEnter: (event: PointerEvent<SVGRectElement>) => {
            if (event.buttons === 1) onPress(midi)
          },
          onPointerUp: () => onRelease?.(midi),
          onPointerLeave: () => onRelease?.(midi),
          onPointerCancel: () => onRelease?.(midi),
        }
      : {}
  const midis = notes.map(noteToMidi)
  const highlighted = new Map(notes.map((note) => [noteToMidi(note), note]))
  const lowest = midis.length ? Math.min(...midis) : 60
  const highest = midis.length ? Math.max(...midis) : 71
  let low = lowest - (lowest % 12)
  let high = highest - (highest % 12) + 11
  while ((high - low + 1) / 12 < minOctaves) {
    if (low > 36) low -= 12
    else high += 12
  }

  const keys = Array.from({ length: high - low + 1 }, (_, i) => low + i)
  const whites = keys.filter((m) => WHITE.has(m % 12))
  const whiteIndex = new Map(whites.map((m, i) => [m, i]))
  const width = whites.length * WHITE_WIDTH

  const label = notes.length
    ? `Teclado com as notas: ${notes.map((n) => formatPitchClass(pitchClassOf(n), naming)).join(', ')}`
    : 'Teclado'

  return (
    <svg
      className={styles.keyboard}
      data-playable={playable || undefined}
      viewBox={`0 0 ${width} ${WHITE_HEIGHT + 1}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {whites.map((midi, i) => {
        const note = highlighted.get(midi)
        return (
          <g key={midi}>
            <rect
              x={i * WHITE_WIDTH + 0.5}
              y={0.5}
              width={WHITE_WIDTH - 1}
              height={WHITE_HEIGHT}
              rx={3}
              className={note ? styles.whiteOn : styles.white}
              data-midi={midi}
              data-on={note ? 'true' : undefined}
              data-pressed={pressed?.has(midi) ? 'true' : undefined}
              {...keyProps(midi)}
            />
            {note && (
              <text
                x={i * WHITE_WIDTH + WHITE_WIDTH / 2}
                y={WHITE_HEIGHT - 10}
                className={styles.keyLabelOnWhite}
              >
                {textFor(note)}
              </text>
            )}
          </g>
        )
      })}
      {keys
        .filter((m) => !WHITE.has(m % 12))
        .map((midi) => {
          const left = (whiteIndex.get(midi - 1) ?? 0) + 1
          const x = left * WHITE_WIDTH - BLACK_WIDTH / 2
          const note = highlighted.get(midi)
          return (
            <g key={midi}>
              <rect
                x={x}
                y={0.5}
                width={BLACK_WIDTH}
                height={BLACK_HEIGHT}
                rx={2}
                className={note ? styles.blackOn : styles.black}
                data-midi={midi}
                data-on={note ? 'true' : undefined}
                data-pressed={pressed?.has(midi) ? 'true' : undefined}
                {...keyProps(midi)}
              />
              {note && (
                <text
                  x={x + BLACK_WIDTH / 2}
                  y={BLACK_HEIGHT + 12}
                  className={styles.keyLabelOnBlack}
                >
                  {textFor(note)}
                </text>
              )}
            </g>
          )
        })}
    </svg>
  )
}
