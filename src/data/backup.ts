import type { UserFacts } from '@/domain/progress'
import * as z from 'zod'
import { getSettings, loadFacts, replaceAllData, setLastBackupAt } from './repositories.ts'
import { backupDataSchema } from './schema.ts'
import type { Settings } from './settings.ts'

export const BACKUP_FORMAT = 'keypath-backup'
export const CURRENT_SCHEMA_VERSION = 1

export interface BackupData extends UserFacts {
  readonly settings: Settings
}

export interface BackupFile {
  readonly format: typeof BACKUP_FORMAT
  readonly schemaVersion: number
  readonly exportedAt: string
  readonly data: BackupData
}

export interface BackupSummary {
  readonly exportedAt: string
  readonly attempts: number
  readonly declarations: number
  readonly lessons: number
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupError'
  }
}

/** Migração de `data` da versão n para n + 1. */
export type Migration = (data: unknown) => unknown

/**
 * Migrações do formato do backup, por versão de origem.
 * Ao mudar o formato: aumente CURRENT_SCHEMA_VERSION e adicione aqui a migração
 * da versão anterior (com teste).
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {}

export async function createBackup(now: Date = new Date()): Promise<BackupFile> {
  const [facts, settings] = await Promise.all([loadFacts(), getSettings()])
  return {
    format: BACKUP_FORMAT,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: { ...facts, settings },
  }
}

export function backupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `keypath-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

const headerSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.iso.datetime({ offset: true }),
  data: z.unknown(),
})

/** Lê e valida um arquivo de backup, aplicando migrações de versões antigas. */
export function parseBackup(
  text: string,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  currentVersion: number = CURRENT_SCHEMA_VERSION,
): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('O arquivo não é um JSON válido.')
  }

  const header = headerSchema.safeParse(raw)
  if (!header.success) {
    throw new BackupError('Este arquivo não é um backup do KeyPath.')
  }
  const { schemaVersion } = header.data
  if (schemaVersion > currentVersion) {
    throw new BackupError(
      `Este backup é de uma versão mais nova do KeyPath (formato ${schemaVersion}). Atualize o app antes de importar.`,
    )
  }

  let data = header.data.data
  for (let version = schemaVersion; version < currentVersion; version++) {
    const migrate = migrations[version]
    if (!migrate) {
      throw new BackupError(`Não há migração do formato ${version} para ${version + 1}.`)
    }
    data = migrate(data)
  }

  const parsed = backupDataSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path.map(String).join('.') ?? ''
    throw new BackupError(
      `O backup está corrompido ou incompleto${where ? ` (em ${where})` : ''}: ${first?.message ?? 'formato inválido'}.`,
    )
  }

  return {
    format: BACKUP_FORMAT,
    schemaVersion: currentVersion,
    exportedAt: header.data.exportedAt,
    // O Zod valida o formato; a conversão só ajusta campos opcionais ausentes.
    data: parsed.data as unknown as BackupData,
  }
}

export function summarizeBackup(backup: BackupFile): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    attempts: backup.data.attempts.length,
    declarations: backup.data.declarations.length,
    lessons: backup.data.lessonProgress.length,
  }
}

/** Substitui todos os dados pelo conteúdo do backup (após confirmação na interface). */
export async function importBackup(backup: BackupFile): Promise<BackupSummary> {
  await replaceAllData(backup.data)
  return summarizeBackup(backup)
}

/** Gera o arquivo de backup e inicia o download no navegador. */
export async function downloadBackup(now: Date = new Date()): Promise<void> {
  const backup = await createBackup(now)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName(now)
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
  await setLastBackupAt(now)
}
