import { useLiveQuery } from 'dexie-react-hooks'
import type { UserFacts } from '@/domain/progress'
import { getLastBackupAt, getSettings, loadFacts } from './repositories.ts'
import type { Settings } from './settings.ts'

/** Fatos do usuário, atualizados automaticamente a cada gravação. `undefined` enquanto carrega. */
export function useUserFacts(): UserFacts | undefined {
  return useLiveQuery(loadFacts)
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(getSettings)
}

/** Data do último backup; `null` se nunca houve; `undefined` enquanto carrega. */
export function useLastBackupAt(): string | null | undefined {
  return useLiveQuery(getLastBackupAt)
}
