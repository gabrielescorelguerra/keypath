import type { ReactNode } from 'react'
import type { CompetencyStatus } from '@/domain/progress'
import { COMPETENCY_STATUS } from './labels.ts'
import { OctaveMeter } from './Notation.tsx'

const STATUS_TONE: Record<CompetencyStatus, string> = {
  mastered: 'success',
  declared: 'declared',
  'in-progress': 'accent',
  'not-started': 'neutral',
}

/** Ponto de estado + rótulo (dominada ● / declarada ◐ / em andamento ● / não iniciada ○). */
export function StatusBadge({ status }: { readonly status: CompetencyStatus }) {
  return (
    <span className="status" data-tone={STATUS_TONE[status]}>
      {COMPETENCY_STATUS[status].label}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  readonly children: ReactNode
  readonly tone?: 'success' | 'accent' | 'warning' | 'neutral'
}) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, label }: { readonly value: number; readonly label: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

/** Nível (0–5) desenhado como uma oitava: as 5 teclas pretas são os níveis. */
export function LevelMeter({
  level,
  next = 0,
  label,
  size = 'sm',
}: {
  readonly level: number
  /** Progresso (0–1) no próximo nível. */
  readonly next?: number
  readonly label: string
  readonly size?: 'sm' | 'md' | 'lg'
}) {
  return <OctaveMeter level={level} next={next} label={label} size={size} />
}
