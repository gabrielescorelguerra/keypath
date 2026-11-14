import { useLiveQuery } from 'dexie-react-hooks'
import type { Attachment, PracticeSession, Song } from '@/domain/practice'
import type { UserFacts } from '@/domain/progress'
import { db } from './db.ts'
import { getActiveSession } from './practice.ts'
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

/** Repertório, do mais recente para o mais antigo. */
export function useSongs(): readonly Song[] | undefined {
  return useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().toArray())
}

/** Uma música; `null` se não existe; `undefined` enquanto carrega. */
export function useSong(id: string): Song | null | undefined {
  return useLiveQuery(async () => (await db.songs.get(id)) ?? null, [id])
}

export function useAttachments(songId: string): readonly Attachment[] | undefined {
  return useLiveQuery(
    () => db.attachments.where('songId').equals(songId).sortBy('createdAt'),
    [songId],
  )
}

/** Quantidade de anexos por música. */
export function useAttachmentCounts(): ReadonlyMap<string, number> | undefined {
  return useLiveQuery(async () => {
    const counts = new Map<string, number>()
    for (const a of await db.attachments.toArray())
      counts.set(a.songId, (counts.get(a.songId) ?? 0) + 1)
    return counts
  })
}

/** Sessão em andamento; `null` se não há; `undefined` enquanto carrega. */
export function useActiveSession(): PracticeSession | null | undefined {
  return useLiveQuery(getActiveSession)
}

/** Sessões encerradas, da mais recente para a mais antiga. */
export function usePastSessions(): readonly PracticeSession[] | undefined {
  return useLiveQuery(async () =>
    (await db.practiceSessions.orderBy('startedAt').reverse().toArray()).filter(
      (s) => s.endedAt !== null,
    ),
  )
}

export function useSession(id: string): PracticeSession | null | undefined {
  return useLiveQuery(async () => (await db.practiceSessions.get(id)) ?? null, [id])
}
