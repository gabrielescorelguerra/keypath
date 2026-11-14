import { useMemo } from 'react'
import { catalog } from '@/content'
import { useUserFacts } from '@/data'
import { computeProgress, type ProgressSnapshot, type UserFacts } from '@/domain/progress'

export interface ProgressData {
  readonly facts: UserFacts
  readonly snapshot: ProgressSnapshot
}

/** Fatos salvos + estado derivado, recalculado a cada gravação. `undefined` enquanto carrega. */
export function useProgress(): ProgressData | undefined {
  const facts = useUserFacts()
  return useMemo(
    () => (facts ? { facts, snapshot: computeProgress(catalog, facts) } : undefined),
    [facts],
  )
}
