import { resetDatabase } from '@/test/db.ts'
import {
  BackupError,
  backupFileName,
  createBackup,
  CURRENT_SCHEMA_VERSION,
  importBackup,
  parseBackup,
} from './backup.ts'
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
}

beforeEach(resetDatabase)

describe('ida e volta', () => {
  it('exporta e importa sem perder nada', async () => {
    await seed()
    const text = JSON.stringify(await createBackup(at(3)))
    const before = await loadFacts()

    await resetDatabase()
    await recordAttempt({
      exerciseId: 'outro',
      startedAt: at(5).toISOString(),
      finishedAt: at(5).toISOString(),
      context: {},
      result: { type: 'quiz', answers: {}, score: 0 },
    })

    const summary = await importBackup(parseBackup(text))
    expect(summary).toEqual({
      exportedAt: at(3).toISOString(),
      attempts: 1,
      declarations: 1,
      lessons: 1,
    })
    // A importação substitui tudo (D21): a tentativa "outro" sumiu.
    expect(await loadFacts()).toEqual(before)
    expect((await getSettings()).noteNaming).toBe('letters')
  })

  it('não leva a data do último backup (é do dispositivo, não dos dados)', async () => {
    await setLastBackupAt(at(1))
    const backup = await createBackup(at(3))
    expect(JSON.stringify(backup)).not.toContain('lastBackupAt')
    await importBackup(backup)
    expect(await getLastBackupAt()).toBe(at(1).toISOString())
  })

  it('o arquivo tem o formato documentado', async () => {
    const backup = await createBackup(at(3))
    expect(backup).toMatchObject({
      format: 'keypath-backup',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: at(3).toISOString(),
      data: { attempts: [], declarations: [], lessonProgress: [] },
    })
  })
})

describe('parseBackup', () => {
  const valid = {
    format: 'keypath-backup',
    schemaVersion: 1,
    exportedAt: '2026-11-14T12:00:00.000Z',
    data: { attempts: [], declarations: [], lessonProgress: [] },
  }
  const parse = (value: unknown) => () => parseBackup(JSON.stringify(value))

  it('aceita backup sem configurações (usa o padrão)', () => {
    expect(parseBackup(JSON.stringify(valid)).data.settings.noteNaming).toBe('both')
  })

  it('rejeita o que não é backup', () => {
    expect(() => parseBackup('não é json')).toThrow('O arquivo não é um JSON válido.')
    expect(parse({ hello: 'world' })).toThrow('Este arquivo não é um backup do KeyPath.')
  })

  it('rejeita backup de versão mais nova', () => {
    expect(parse({ ...valid, schemaVersion: 99 })).toThrow(/versão mais nova/)
  })

  it('rejeita dados corrompidos, dizendo onde', () => {
    const broken = {
      ...valid,
      data: { ...valid.data, declarations: [{ competencyId: 'x', declaredAt: 'ontem' }] },
    }
    expect(parse(broken)).toThrow(BackupError)
    expect(parse(broken)).toThrow(/declarations\.0\.declaredAt/)
  })

  it('aplica migrações de formatos antigos, em sequência', () => {
    const v1 = { ...valid, data: { tentativas: [], declarations: [], lessonProgress: [] } }
    const migrations = {
      1: (data: unknown) => {
        const { tentativas, ...rest } = data as { tentativas: unknown[] }
        return { ...rest, attempts: tentativas }
      },
      2: (data: unknown) => ({ ...(data as object), migratedTo3: true }),
    }
    const result = parseBackup(JSON.stringify(v1), migrations, 3)
    expect(result.schemaVersion).toBe(3)
    expect(result.data.attempts).toEqual([])
  })

  it('falha se faltar uma migração', () => {
    expect(() => parseBackup(JSON.stringify(valid), {}, 2)).toThrow(
      'Não há migração do formato 1 para 2.',
    )
  })
})

it('nome do arquivo com a data local', () => {
  expect(backupFileName(new Date(2026, 0, 5))).toBe('keypath-backup-2026-01-05.json')
})
