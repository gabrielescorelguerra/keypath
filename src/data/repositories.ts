import type { Attachment, PracticeSession, Song } from '@/domain/practice'
import type { Attempt, LessonProgress, UserFacts } from '@/domain/progress'
import { db } from './db.ts'
import { DEFAULT_SETTINGS, type Settings } from './settings.ts'
import { requestPersistentStorage } from './storage.ts'

/** Operações sobre os dados do usuário. Toda gravação passa por aqui. */

const iso = (date: Date) => date.toISOString()

function afterWrite() {
  void requestPersistentStorage()
}

export async function loadFacts(): Promise<UserFacts> {
  const [attempts, declarations, lessonProgress] = await Promise.all([
    db.attempts.orderBy('finishedAt').toArray(),
    db.declarations.toArray(),
    db.lessonProgress.toArray(),
  ])
  return { attempts, declarations, lessonProgress }
}

export async function recordAttempt(attempt: Omit<Attempt, 'id'>): Promise<Attempt> {
  const saved: Attempt = { ...attempt, id: crypto.randomUUID() }
  await db.attempts.add(saved)
  afterWrite()
  return saved
}

/** Declara conhecimento prévio. Competências já declaradas mantêm a data original. */
export async function declareCompetencies(
  competencyIds: readonly string[],
  now: Date = new Date(),
): Promise<void> {
  await db.transaction('rw', db.declarations, async () => {
    const existing = new Set(
      (await db.declarations.bulkGet([...competencyIds])).flatMap((d) =>
        d ? [d.competencyId] : [],
      ),
    )
    await db.declarations.bulkPut(
      competencyIds
        .filter((id) => !existing.has(id))
        .map((competencyId) => ({ competencyId, declaredAt: iso(now) })),
    )
  })
  afterWrite()
}

export async function undeclareCompetencies(competencyIds: readonly string[]): Promise<void> {
  await db.declarations.bulkDelete([...competencyIds])
}

/** Registra que a aula foi aberta (para "continuar de onde parou"). */
export async function visitLesson(lessonId: string, now: Date = new Date()): Promise<void> {
  await db.transaction('rw', db.lessonProgress, async () => {
    const current = await db.lessonProgress.get(lessonId)
    const record: LessonProgress = current
      ? { ...current, lastVisitedAt: iso(now) }
      : { lessonId, startedAt: iso(now), lastVisitedAt: iso(now), checkpoints: {} }
    await db.lessonProgress.put(record)
  })
}

/** Marca a aula como revisada agora (zera o aviso de "revisar"). */
export async function markLessonReviewed(lessonId: string, now: Date = new Date()): Promise<void> {
  await db.transaction('rw', db.lessonProgress, async () => {
    const current = await db.lessonProgress.get(lessonId)
    if (!current) return
    await db.lessonProgress.put({ ...current, reviewedAt: iso(now), lastVisitedAt: iso(now) })
  })
  afterWrite()
}

export async function setCheckpointCompleted(
  lessonId: string,
  checkpointId: string,
  completed: boolean,
  now: Date = new Date(),
): Promise<void> {
  await db.transaction('rw', db.lessonProgress, async () => {
    const current: LessonProgress = (await db.lessonProgress.get(lessonId)) ?? {
      lessonId,
      startedAt: iso(now),
      lastVisitedAt: iso(now),
      checkpoints: {},
    }
    const checkpoints = { ...current.checkpoints }
    if (completed) checkpoints[checkpointId] ??= iso(now)
    else delete checkpoints[checkpointId]
    await db.lessonProgress.put({ ...current, lastVisitedAt: iso(now), checkpoints })
  })
  afterWrite()
}

export async function getSettings(): Promise<Settings> {
  const record = await db.settings.get('settings')
  if (!record) return DEFAULT_SETTINGS
  const { id: _id, ...settings } = record
  return { ...DEFAULT_SETTINGS, ...settings }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await db.settings.put({ id: 'settings', ...next })
  return next
}

const LAST_BACKUP_KEY = 'lastBackupAt'

export async function getLastBackupAt(): Promise<string | null> {
  return (await db.meta.get(LAST_BACKUP_KEY))?.value ?? null
}

export async function setLastBackupAt(date: Date = new Date()): Promise<void> {
  await db.meta.put({ key: LAST_BACKUP_KEY, value: iso(date) })
}

/** Substitui todos os dados do usuário (importação de backup, D21). */
export async function replaceAllData(
  data: UserFacts & {
    readonly settings: Settings
    readonly songs: readonly Song[]
    readonly attachments: readonly Attachment[]
    readonly practiceSessions: readonly PracticeSession[]
  },
  files: ReadonlyMap<string, { readonly data: ArrayBuffer; readonly mimeType: string }> = new Map(),
): Promise<void> {
  const tables = [
    db.attempts,
    db.declarations,
    db.lessonProgress,
    db.settings,
    db.songs,
    db.attachments,
    db.blobs,
    db.practiceSessions,
  ]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()))
    await db.attempts.bulkAdd([...data.attempts])
    await db.declarations.bulkAdd([...data.declarations])
    await db.lessonProgress.bulkAdd([...data.lessonProgress])
    await db.settings.put({ id: 'settings', ...data.settings })
    await db.songs.bulkAdd([...data.songs])
    await db.attachments.bulkAdd([...data.attachments])
    await db.practiceSessions.bulkAdd([...data.practiceSessions])
    await db.blobs.bulkAdd([...files].map(([id, file]) => ({ id, ...file })))
  })
  afterWrite()
}
