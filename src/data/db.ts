import { Dexie, type EntityTable } from 'dexie'
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

  constructor(name = 'keypath') {
    super(name)
    this.version(1).stores({
      attempts: 'id, exerciseId, finishedAt',
      declarations: 'competencyId',
      lessonProgress: 'lessonId, lastVisitedAt',
      settings: 'id',
      meta: 'key',
    })
  }
}

export const db = new KeyPathDatabase()
