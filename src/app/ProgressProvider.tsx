import { useMemo, type ReactNode } from 'react'
import { catalog } from '@/content'
import { useUserFacts } from '@/data'
import { computeProgress } from '@/domain/progress'
import { ProgressContext } from './progress.ts'

/** Uma única leitura do banco para o app inteiro; o estado derivado é recalculado a cada gravação. */
export function ProgressProvider({ children }: { readonly children: ReactNode }) {
  const facts = useUserFacts()
  const value = useMemo(
    () => (facts ? { facts, snapshot: computeProgress(catalog, facts) } : undefined),
    [facts],
  )
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
