import type { CompetencyStatus } from '@/domain/progress'
import { COMPETENCY_STATUS } from './labels.ts'

export function StatusBadge({ status }: { readonly status: CompetencyStatus }) {
  const { label, tone } = COMPETENCY_STATUS[status]
  return (
    <span className="badge" data-tone={tone}>
      {label}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  readonly children: React.ReactNode
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
