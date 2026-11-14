import { strToU8, zipSync } from 'fflate'
import { resetDatabase } from '@/test/db.ts'
import {
  BackupError,
  backupFileName,
  CURRENT_SCHEMA_VERSION,
  createBackup,
  encodeBackup,
  importBackup,
  parseBackup,
  readBackup,
} from './backup.ts'
import { db } from './db.ts'
import { addFileAttachment, addLinkAttachment, createSong, startSession } from './practice.ts'
import {
  declareCompetencies,
  getLastBackupAt,
  getSettings,
  loadFacts,
  recordAttempt,
  setCheckpointCompleted,
  setLastBackupAt,
  updateSettings,
} from './repositories.ts'

const at = (day: number) => new Date(2026, 10, day, 10)

const fakeFile = (name: string, type: string, text: string) => {
  const bytes = new TextEncoder().encode(text)
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.slice().buffer,
  }
}

async function seed() {
  await recordAttempt({
    exerciseId: 'harmonia.triades.quiz',
    startedAt: at(1).toISOString(),
    finishedAt: at(1).toISOString(),
    context: {},
    result: { type: 'quiz', answers: { q: [1] }, score: 0.5 },
  })
  await declareCompetencies(['teoria.intervalos'], at(1))
  await setCheckpointCompleted('harmonia.aula', 'um', true, at(2))
  await updateSettings({ noteNaming: 'letters' })
  const song = await createSong({ title: 'Oceanos', key: 'D', status: 'learning' }, at(2))
  await addFileAttachment(
    song.id,
    fakeFile('oceanos.pdf', 'application/pdf', '%PDF-cifra'),
    'pdf',
    at(2),
  )
  await addLinkAttachment(
    song.id,
    { name: 'Vídeo', url: 'https://youtu.be/abcdef12345', startSeconds: 30 },
    at(2),
  )
  await startSession(null, at(3))
}

const roundTrip = async (now = at(4)) => readBackup(encodeBackup(await createBackup(now)))

beforeEach(resetDatabase)

describe('ida e volta (ZIP)', () => {
  it('exporta e importa tudo, inclusive os arquivos dos anexos', async () => {
    await seed()
    const backup = await roundTrip()
    const before = {
      facts: await loadFacts(),
      songs: await db.songs.toArray(),
      attachments: await db.attachments.toArray(),
      sessions: await db.practiceSessions.toArray(),
    }

    await resetDatabase()
    await createSong({ title: 'Outra música' })

    const summary = await importBackup(backup)
    expect(summary).toMatchObject({
      attempts: 1,
      declarations: 1,
      lessons: 1,
      songs: 1,
      attachments: 2,
      sessions: 1,
    })

    expect(await loadFacts()).toEqual(before.facts)
    expect(await db.songs.toArray()).toEqual(before.songs) // "Outra música" sumiu (D21)
    expect(await db.attachments.toArray()).toEqual(before.attachments)
    expect(await db.practiceSessions.toArray()).toEqual(before.sessions)
    expect((await getSettings()).noteNaming).toBe('letters')

    const [blob] = await db.blobs.toArray()
    expect(new TextDecoder().decode(blob?.data)).toBe('%PDF-cifra')
    expect(blob?.mimeType).toBe('application/pdf')
  })

  it('não leva a data do último backup (é do dispositivo)', async () => {
    await setLastBackupAt(at(1))
    const backup = await createBackup(at(3))
    expect(JSON.stringify(backup.file)).not.toContain('lastBackupAt')
    await importBackup(backup)
    expect(await getLastBackupAt()).toBe(at(1).toISOString())
  })

  it('o JSON tem o formato documentado', async () => {
    const { file } = await createBackup(at(3))
    expect(file).toMatchObject({
      format: 'keypath-backup',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: at(3).toISOString(),
      data: {
        attempts: [],
        declarations: [],
        lessonProgress: [],
        songs: [],
        attachments: [],
        practiceSessions: [],
      },
    })
  })
})

describe('readBackup', () => {
  const v1 = {
    format: 'keypath-backup',
    schemaVersion: 1,
    exportedAt: '2026-11-14T12:00:00.000Z',
    data: {
      attempts: [],
      declarations: [{ competencyId: 'teoria.intervalos', declaredAt: '2026-11-14T12:00:00.000Z' }],
      lessonProgress: [],
    },
  }
  const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))

  it('aceita backup antigo em JSON (formato 1) e migra para o 2', () => {
    const { file, files } = readBackup(json(v1))
    expect(file.schemaVersion).toBe(2)
    expect(file.data.declarations).toHaveLength(1)
    expect(file.data.songs).toEqual([])
    expect(files.size).toBe(0)
  })

  it('rejeita o que não é backup', () => {
    expect(() => readBackup(new TextEncoder().encode('não é json'))).toThrow(BackupError)
    expect(() => readBackup(json({ hello: 'world' }))).toThrow(
      'Este arquivo não é um backup do KeyPath.',
    )
    expect(() => readBackup(zipSync({ 'outro.txt': strToU8('x') }))).toThrow(/falta backup\.json/)
  })

  it('rejeita backup de versão mais nova', () => {
    expect(() => readBackup(json({ ...v1, schemaVersion: 99 }))).toThrow(/versão mais nova/)
  })

  it('rejeita ZIP sem o arquivo de um anexo', async () => {
    await seed()
    const backup = await createBackup(at(4))
    const broken = encodeBackup({ file: backup.file, files: new Map() })
    expect(() => readBackup(broken)).toThrow(/falta o arquivo do anexo "oceanos.pdf"/)
  })

  it('rejeita dados corrompidos, dizendo onde', () => {
    const broken = {
      ...v1,
      data: { ...v1.data, declarations: [{ competencyId: 'x', declaredAt: 'ontem' }] },
    }
    expect(() => readBackup(json(broken))).toThrow(/declarations\.0\.declaredAt/)
  })
})

describe('parseBackup (migrações)', () => {
  const v1 = {
    format: 'keypath-backup',
    schemaVersion: 1,
    exportedAt: '2026-11-14T12:00:00.000Z',
    data: { tentativas: [], declarations: [], lessonProgress: [] },
  }

  it('aplica migrações em sequência', () => {
    const migrations = {
      1: (data: unknown) => {
        const { tentativas, ...rest } = data as { tentativas: unknown[] }
        return { ...rest, attempts: tentativas }
      },
      2: (data: unknown) => data,
    }
    const result = parseBackup(JSON.stringify(v1), migrations, 3)
    expect(result.schemaVersion).toBe(3)
    expect(result.data.attempts).toEqual([])
  })

  it('falha se faltar uma migração', () => {
    expect(() => parseBackup(JSON.stringify(v1), {}, 2)).toThrow(
      'Não há migração do formato 1 para 2.',
    )
  })
})

it('nome do arquivo com a data local', () => {
  expect(backupFileName(new Date(2026, 0, 5))).toBe('keypath-backup-2026-01-05.zip')
})
