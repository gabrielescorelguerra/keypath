import { createContext, useContext } from 'react'
import type { ProgressSnapshot, StudyMap, UserFacts } from '@/domain/progress'

export interface ProgressData {
  readonly facts: UserFacts
  readonly snapshot: ProgressSnapshot
  readonly studyMap: StudyMap
}

export const ProgressContext = createContext<ProgressData | undefined>(undefined)

/** Progresso atual; `undefined` enquanto carrega. */
export function useProgress(): ProgressData | undefined {
  return useContext(ProgressContext)
}
