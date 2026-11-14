import { Dexie, type EntityTable } from 'dexie'
import type { Attachment, PracticeSession, Song } from '@/domain/practice'
import type { Attempt, Declaration, LessonProgress } from '@/domain/progress'
import type { Settings } from './settings.ts'

export interface SettingsRecord extends Settings {
  readonly id: 'settings'
}

/** Metadados do app (ex.: data do último backup). Não entram no backup. */
export interface MetaRecord {
  readonly key: string
  readonly value: string
}

/** Conteúdo de um anexo (PDF, imagem, MIDI), guardado como bytes. */
export interface BlobRecord {
  readonly id: string
  readonly data: ArrayBuffer
  readonly mimeType: string
}

/**
 * Banco local (IndexedDB). Só fatos e preferências — o estado é derivado (D13).
 * Para mudar o formato: adicione uma nova `version(n)` com `.upgrade()`;
 * nunca altere uma versão já publicada.
 */
export class KeyPathDatabase extends Dexie {
  declare attempts: EntityTable<Attempt, 'id'>
  declare declarations: EntityTable<Declaration, 'competencyId'>
  declare lessonProgress: EntityTable<LessonProgress, 'lessonId'>
  declare settings: EntityTable<SettingsRecord, 'id'>
  declare meta: EntityTable<MetaRecord, 'key'>
  declare songs: EntityTable<Song, 'id'>
  declare attachments: EntityTable<Attachment, 'id'>
  declare blobs: EntityTable<BlobRecord, 'id'>
  declare practiceSessions: EntityTable<PracticeSession, 'id'>

  constructor(name = 'keypath') {
    super(name)
    this.version(1).stores({
      attempts: 'id, exerciseId, finishedAt',
      declarations: 'competencyId',
      lessonProgress: 'lessonId, lastVisitedAt',
      settings: 'id',
      meta: 'key',
    })
    // v2 (área de Prática): repertório, anexos, arquivos e sessões.
    this.version(2).stores({
      songs: 'id, status, updatedAt',
      attachments: 'id, songId',
      blobs: 'id',
      practiceSessions: 'id, startedAt, endedAt',
    })
  }
}

export const db = new KeyPathDatabase()
