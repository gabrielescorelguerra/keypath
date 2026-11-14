/** Quantos dias sem backup, havendo atividade nova, até lembrar. */
export const BACKUP_REMINDER_DAYS = 7

export type BackupReminder =
  /** Nada a lembrar (sem atividade, ou backup em dia). */
  | 'none'
  /** Há dados e nunca foi feito backup. */
  | 'never'
  /** Há atividade depois do último backup, feito há mais de BACKUP_REMINDER_DAYS dias. */
  | 'stale'

export function backupReminder(options: {
  readonly lastBackupAt: string | null
  readonly lastActivityAt: string | null
  readonly now?: Date
}): BackupReminder {
  const { lastBackupAt, lastActivityAt, now = new Date() } = options
  if (lastActivityAt === null) return 'none'
  if (lastBackupAt === null) return 'never'
  const backup = Date.parse(lastBackupAt)
  const hasNewActivity = Date.parse(lastActivityAt) > backup
  const days = (now.getTime() - backup) / 86_400_000
  return hasNewActivity && days > BACKUP_REMINDER_DAYS ? 'stale' : 'none'
}

/** Data da atividade mais recente nos fatos do usuário. */
export function lastActivity(facts: {
  readonly attempts: readonly { readonly finishedAt: string }[]
  readonly declarations: readonly { readonly declaredAt: string }[]
  readonly lessonProgress: readonly { readonly lastVisitedAt: string }[]
}): string | null {
  let result: string | null = null
  for (const date of [
    ...facts.attempts.map((a) => a.finishedAt),
    ...facts.declarations.map((d) => d.declaredAt),
    ...facts.lessonProgress.map((p) => p.lastVisitedAt),
  ]) {
    if (result === null || Date.parse(date) > Date.parse(result)) result = date
  }
  return result
}
