import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import type { Attachment, PracticeSession, Song } from '@/domain/practice'
import type { UserFacts } from '@/domain/progress'
import * as z from 'zod'
import { db } from './db.ts'
import { getSettings, loadFacts, replaceAllData, setLastBackupAt } from './repositories.ts'
import { backupDataSchema } from './schema.ts'
import type { Settings } from './settings.ts'

export const BACKUP_FORMAT = 'keypath-backup'
/** v1: progresso e configurações (JSON). v2: + repertório, anexos e sessões (ZIP com arquivos). */
export const CURRENT_SCHEMA_VERSION = 2

export interface BackupData extends UserFacts {
  readonly settings: Settings
  readonly songs: readonly Song[]
  readonly attachments: readonly Attachment[]
  readonly practiceSessions: readonly PracticeSession[]
}

export interface BackupFile {
  readonly format: typeof BACKUP_FORMAT
  readonly schemaVersion: number
  readonly exportedAt: string
  readonly data: BackupData
}

export interface StoredFile {
  readonly data: ArrayBuffer
  readonly mimeType: string
}

/** Backup completo: os dados (backup.json) e os arquivos dos anexos, por blobId. */
export interface Backup {
  readonly file: BackupFile
  readonly files: ReadonlyMap<string, StoredFile>
}

export interface BackupSummary {
  readonly exportedAt: string
  readonly attempts: number
  readonly declarations: number
  readonly lessons: number
  readonly songs: number
  readonly attachments: number
  readonly sessions: number
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
 * Migrações do formato, por versão de origem. Ao mudar o formato: aumente
 * CURRENT_SCHEMA_VERSION e adicione aqui a migração da versão anterior (com teste).
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // v1 → v2: surgem repertório, anexos e sessões (vazios).
  1: (data) => ({ ...(data as object), songs: [], attachments: [], practiceSessions: [] }),
}

const JSON_NAME = 'backup.json'
const FILES_DIR = 'files/'

export async function createBackup(now: Date = new Date()): Promise<Backup> {
  const [facts, settings, songs, attachments, practiceSessions, blobs] = await Promise.all([
    loadFacts(),
    getSettings(),
    db.songs.toArray(),
    db.attachments.toArray(),
    db.practiceSessions.toArray(),
    db.blobs.toArray(),
  ])
  return {
    file: {
      format: BACKUP_FORMAT,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      data: { ...facts, settings, songs, attachments, practiceSessions },
    },
    files: new Map(blobs.map((b) => [b.id, { data: b.data, mimeType: b.mimeType }])),
  }
}

/** Empacota o backup num ZIP: backup.json + files/<id>. */
export function encodeBackup(backup: Backup): Uint8Array {
  const entries: Zippable = {
    [JSON_NAME]: [strToU8(JSON.stringify(backup.file, null, 2)), { level: 6 }],
  }
  for (const [id, file] of backup.files) {
    // PDFs e imagens já são comprimidos: guardar sem recomprimir é mais rápido.
    entries[`${FILES_DIR}${id}`] = [new Uint8Array(file.data), { level: 0 }]
  }
  return zipSync(entries)
}

export function backupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `keypath-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.zip`
}

const headerSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.iso.datetime({ offset: true }),
  data: z.unknown(),
})

/** Lê e valida o JSON do backup, aplicando migrações de versões antigas. */
export function parseBackup(
  text: string,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  currentVersion: number = CURRENT_SCHEMA_VERSION,
): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('O arquivo não é um backup válido (JSON ilegível).')
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

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b

/** Lê um arquivo de backup: ZIP (atual) ou JSON (formato 1, antigo). */
export function readBackup(bytes: Uint8Array): Backup {
  if (!isZip(bytes)) {
    return { file: parseBackup(new TextDecoder().decode(bytes)), files: new Map() }
  }

  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(bytes)
  } catch {
    throw new BackupError('O arquivo ZIP está corrompido.')
  }
  const json = entries[JSON_NAME]
  if (!json) throw new BackupError('Este arquivo não é um backup do KeyPath (falta backup.json).')

  const file = parseBackup(strFromU8(json))
  const files = new Map<string, StoredFile>()
  for (const attachment of file.data.attachments) {
    if (!attachment.blobId) continue
    const content = entries[`${FILES_DIR}${attachment.blobId}`]
    if (!content) {
      throw new BackupError(
        `O backup está incompleto: falta o arquivo do anexo "${attachment.name}".`,
      )
    }
    files.set(attachment.blobId, {
      data: content.slice().buffer,
      mimeType: attachment.mimeType ?? 'application/octet-stream',
    })
  }
  return { file, files }
}

export function summarizeBackup(file: BackupFile): BackupSummary {
  return {
    exportedAt: file.exportedAt,
    attempts: file.data.attempts.length,
    declarations: file.data.declarations.length,
    lessons: file.data.lessonProgress.length,
    songs: file.data.songs.length,
    attachments: file.data.attachments.length,
    sessions: file.data.practiceSessions.length,
  }
}

/** Substitui todos os dados pelo conteúdo do backup (após confirmação na interface). */
export async function importBackup(backup: Backup): Promise<BackupSummary> {
  await replaceAllData(backup.file.data, backup.files)
  return summarizeBackup(backup.file)
}

/** Gera o arquivo de backup e inicia o download no navegador. */
export async function downloadBackup(now: Date = new Date()): Promise<void> {
  const bytes = encodeBackup(await createBackup(now))
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/zip' })
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
