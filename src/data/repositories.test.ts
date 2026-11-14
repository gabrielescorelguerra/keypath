import { resetDatabase } from '@/test/db.ts'
import {
  declareCompetencies,
  getLastBackupAt,
  getSettings,
  loadFacts,
  recordAttempt,
  setCheckpointCompleted,
  setLastBackupAt,
  undeclareCompetencies,
  updateSettings,
  visitLesson,
} from './repositories.ts'
import { DEFAULT_SETTINGS } from './settings.ts'

const at = (day: number, hour = 10) => new Date(2026, 10, day, hour)

beforeEach(resetDatabase)

describe('tentativas', () => {
  it('grava com id novo e devolve em ordem cronológica', async () => {
    const later = await recordAttempt({
      exerciseId: 'x.quiz',
      startedAt: at(2).toISOString(),
      finishedAt: at(2).toISOString(),
      context: { lessonId: 'harmonia.aula' },
      result: { type: 'quiz', answers: { q1: [0] }, score: 1 },
    })
    const earlier = await recordAttempt({
      exerciseId: 'x.exec',
      startedAt: at(1).toISOString(),
      finishedAt: at(1).toISOString(),
      context: {},
      result: { type: 'self-assessment', checked: { a: true } },
    })
    expect(later.id).not.toBe(earlier.id)
    const facts = await loadFacts()
    expect(facts.attempts.map((a) => a.id)).toEqual([earlier.id, later.id])
    expect(facts.attempts[1]).toEqual(later)
  })
})

describe('declarações', () => {
  it('declara, mantém a data original ao repetir e desfaz', async () => {
    await declareCompetencies(['teoria.a', 'harmonia.b'], at(1))
    await declareCompetencies(['teoria.a', 'harmonia.c'], at(5))
    let facts = await loadFacts()
    expect(
      Object.fromEntries(facts.declarations.map((d) => [d.competencyId, d.declaredAt])),
    ).toEqual({
      'teoria.a': at(1).toISOString(),
      'harmonia.b': at(1).toISOString(),
      'harmonia.c': at(5).toISOString(),
    })

    await undeclareCompetencies(['teoria.a'])
    facts = await loadFacts()
    expect(facts.declarations.map((d) => d.competencyId).sort()).toEqual([
      'harmonia.b',
      'harmonia.c',
    ])
  })
})

describe('progresso de aula', () => {
  it('registra visita, conclui e desfaz checkpoints', async () => {
    await visitLesson('harmonia.aula', at(1))
    await setCheckpointCompleted('harmonia.aula', 'um', true, at(2))
    await setCheckpointCompleted('harmonia.aula', 'um', true, at(3)) // não muda a data
    await setCheckpointCompleted('harmonia.aula', 'dois', true, at(3))
    await setCheckpointCompleted('harmonia.aula', 'dois', false, at(4))
    await visitLesson('harmonia.aula', at(6))

    const [progress] = (await loadFacts()).lessonProgress
    expect(progress).toEqual({
      lessonId: 'harmonia.aula',
      startedAt: at(1).toISOString(),
      lastVisitedAt: at(6).toISOString(),
      checkpoints: { um: at(2).toISOString() },
    })
  })

  it('concluir checkpoint sem visita prévia cria o registro', async () => {
    await setCheckpointCompleted('harmonia.aula', 'um', true, at(2))
    expect((await loadFacts()).lessonProgress[0]?.startedAt).toBe(at(2).toISOString())
  })
})

describe('configurações e metadados', () => {
  it('usa o padrão e aplica alterações parciais', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
    await updateSettings({ noteNaming: 'latin' })
    await updateSettings({ volume: 0.5 })
    expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, noteNaming: 'latin', volume: 0.5 })
  })

  it('guarda a data do último backup', async () => {
    expect(await getLastBackupAt()).toBeNull()
    await setLastBackupAt(at(3))
    expect(await getLastBackupAt()).toBe(at(3).toISOString())
  })
})
