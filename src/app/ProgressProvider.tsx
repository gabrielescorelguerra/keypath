import { useMemo, useState, type ReactNode } from 'react'
import { catalog } from '@/content'
import { useUserFacts } from '@/data'
import { computeProgress, computeStudyMap } from '@/domain/progress'
import { ProgressContext } from './progress.ts'

/** Uma única leitura do banco para o app inteiro; o estado derivado é recalculado a cada gravação. */
export function ProgressProvider({ children }: { readonly children: ReactNode }) {
  const facts = useUserFacts()
  // "Revisar" depende da data de hoje; fixada ao abrir o app (basta para o uso diário).
  const [today] = useState(() => new Date())
  const value = useMemo(() => {
    if (!facts) return undefined
    const snapshot = computeProgress(catalog, facts)
    const studyMap = computeStudyMap(catalog, snapshot, facts, today)
    return { facts, snapshot, studyMap }
  }, [facts, today])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
