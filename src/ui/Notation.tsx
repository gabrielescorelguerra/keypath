import { useId } from 'react'
import styles from './Notation.module.css'

/** Posição (em teclas brancas) de cada tecla preta numa oitava: C♯ D♯ · F♯ G♯ A♯. */
const BLACK_KEYS = [1, 2, 4, 5, 6] as const

/**
 * Medidor de oitava: as 5 teclas pretas são os 5 níveis. Acesas até `level`;
 * a seguinte acende parcialmente conforme `next` (0–1).
 */
export function OctaveMeter({
  level,
  next = 0,
  label,
  size = 'sm',
}: {
  readonly level: number
  readonly next?: number
  readonly label: string
  readonly size?: 'sm' | 'md' | 'lg'
}) {
  const white = 10
  const height = 30
  return (
    <svg
      className={styles.octave}
      data-size={size}
      viewBox={`0 0 ${white * 7} ${height}`}
      role={label ? 'meter' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 5 : undefined}
      aria-valuenow={label ? level : undefined}
    >
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          className={styles.white}
          x={i * white + 0.5}
          y={0.5}
          width={white - 1}
          height={height - 1}
          rx={1.2}
        />
      ))}
      {BLACK_KEYS.map((position, index) => {
        const n = index + 1
        const state = n <= level ? 'on' : n === level + 1 && next > 0 ? 'partial' : 'off'
        const x = position * white - 3.25
        return (
          <g key={n}>
            <rect className={styles.black} x={x} y={0} width={6.5} height={18} rx={1} />
            {state !== 'off' && (
              <rect
                className={styles.lit}
                x={x}
                y={state === 'on' ? 0 : 18 - 18 * Math.min(1, next)}
                width={6.5}
                height={state === 'on' ? 18 : 18 * Math.min(1, next)}
                rx={1}
                data-partial={state === 'partial'}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Compassos: uma parte por compasso, separados por barras de compasso,
 * com barra dupla final. Compassos concluídos ficam preenchidos.
 */
export function Measures({
  done,
  total,
  current,
  label,
}: {
  readonly done: readonly boolean[]
  readonly total: number
  readonly current?: number
  readonly label: string
}) {
  const completed = done.filter(Boolean).length
  return (
    <div
      className={styles.measures}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={styles.measure}
          data-done={done[i] ?? false}
          data-current={current === i}
        />
      ))}
      <span className={styles.final} aria-hidden="true" />
    </div>
  )
}

/** Régua de teclado: faixa fina com o padrão de teclas, usada como divisória de cabeçalho. */
export function KeyRule({ className = '' }: { readonly className?: string }) {
  const id = useId()
  const w = 14
  const h = 8
  return (
    <svg className={`${styles.rule} ${className}`} height={h} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width={w * 7} height={h} patternUnits="userSpaceOnUse">
          {BLACK_KEYS.map((position) => (
            <rect
              key={position}
              className={styles.ruleBlack}
              x={position * w - 3.5}
              y="0"
              width="7"
              height={h}
              rx="1"
            />
          ))}
        </pattern>
      </defs>
      <rect className={styles.ruleLine} width="100%" height="1" />
      <rect width="100%" height={h} fill={`url(#${id})`} />
    </svg>
  )
}
