import {
  bMastered,
  catalog,
  day,
  facts,
  lessonProgress,
  quizAttempt,
  selfAttempt,
} from './fixtures.ts'
import { NO_FACTS } from './facts.ts'
import { competenciesUpToLevel, computeProgress, unsatisfiedPrerequisites } from './progress.ts'

const stateOf = (f: Parameters<typeof computeProgress>[1], id: string) => {
  const state = computeProgress(catalog, f).competencies.get(id)
  if (!state) throw new Error(`sem estado para ${id}`)
  return state
}

describe('critérios de domínio', () => {
  it('quiz: precisa do aproveitamento mínimo (0,8 por padrão)', () => {
    expect(
      stateOf(facts({ attempts: [quizAttempt('teoria.a.quiz', 0.75, day(1))] }), 'teoria.a').status,
    ).toBe('in-progress')
    const state = stateOf(
      facts({ attempts: [quizAttempt('teoria.a.quiz', 0.8, day(1))] }),
      'teoria.a',
    )
    expect(state.status).toBe('mastered')
    expect(state.masteredAt).toBe(day(1))
  })

  it('quiz: registra o melhor aproveitamento', () => {
    const state = stateOf(
      facts({
        attempts: [
          quizAttempt('teoria.a.quiz', 0.5, day(1)),
          quizAttempt('teoria.a.quiz', 0.75, day(2)),
        ],
      }),
      'teoria.a',
    )
    expect(state.criteria[0]?.bestScore).toBe(0.75)
    expect(state.criteria[0]?.met).toBe(false)
  })

  it('autoavaliação: exige todos os itens e dias diferentes', () => {
    const quizOk = quizAttempt('harmonia.b.quiz', 1, day(1))
    const both = { um: true, dois: true }

    const sameDay = stateOf(
      facts({
        attempts: [
          quizOk,
          selfAttempt('harmonia.b.exec', both, day(1, 9)),
          selfAttempt('harmonia.b.exec', both, day(1, 20)),
        ],
      }),
      'harmonia.b',
    )
    expect(sameDay.status).toBe('in-progress')
    expect(sameDay.criteria[1]).toMatchObject({ met: false, qualifyingDays: 1, requiredDays: 2 })

    const incomplete = stateOf(
      facts({
        attempts: [
          quizOk,
          selfAttempt('harmonia.b.exec', both, day(1)),
          selfAttempt('harmonia.b.exec', { um: true, dois: false }, day(2)),
        ],
      }),
      'harmonia.b',
    )
    expect(incomplete.criteria[1]?.qualifyingDays).toBe(1)

    const done = stateOf(
      facts({
        attempts: [
          quizOk,
          selfAttempt('harmonia.b.exec', both, day(1)),
          selfAttempt('harmonia.b.exec', both, day(3)),
        ],
      }),
      'harmonia.b',
    )
    expect(done.status).toBe('mastered')
    expect(done.masteredAt).toBe(day(3))
  })

  it('a data de domínio é quando o último critério foi cumprido', () => {
    const state = stateOf(
      facts({
        attempts: [
          selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(1)),
          selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(2)),
          quizAttempt('harmonia.b.quiz', 1, day(5)),
        ],
      }),
      'harmonia.b',
    )
    expect(state.masteredAt).toBe(day(5))
  })
})

describe('status das competências', () => {
  it('sem fatos: nada iniciado; só quem não tem pré-requisitos está pronta', () => {
    const snapshot = computeProgress(catalog, NO_FACTS)
    expect(
      [...snapshot.competencies.values()].map((s) => [s.competencyId, s.status, s.ready]),
    ).toEqual([
      ['teoria.a', 'not-started', true],
      ['harmonia.b', 'not-started', false],
      ['harmonia.c', 'not-started', false],
      ['harmonia.d', 'not-started', false],
      ['harmonia.e', 'not-started', true],
    ])
    expect(snapshot.competencies.get('harmonia.b')?.missingPrerequisites).toEqual(['teoria.a'])
  })

  it('declarada vale como satisfeita para os pré-requisitos (D20)', () => {
    const snapshot = computeProgress(
      catalog,
      facts({ declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }] }),
    )
    expect(snapshot.competencies.get('teoria.a')).toMatchObject({
      status: 'declared',
      satisfied: true,
      declaredAt: day(1),
    })
    expect(snapshot.competencies.get('harmonia.b')).toMatchObject({
      prerequisitesMet: true,
      ready: true,
    })
  })

  it('dominada prevalece sobre declarada', () => {
    const state = stateOf(
      facts({
        declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }],
        attempts: [quizAttempt('teoria.a.quiz', 1, day(2))],
      }),
      'teoria.a',
    )
    expect(state.status).toBe('mastered')
    expect(state.declaredAt).toBe(day(1))
  })

  it('checkpoint concluído em aula que trabalha a competência conta como atividade', () => {
    const state = stateOf(
      facts({ lessonProgress: [lessonProgress('harmonia.l1', { x: day(4) }, day(4))] }),
      'harmonia.b',
    )
    expect(state).toMatchObject({ status: 'in-progress', lastActivityAt: day(4) })
  })

  it('tentativa de outro tipo não cumpre o critério', () => {
    const state = stateOf(
      facts({ attempts: [selfAttempt('teoria.a.quiz', { um: true }, day(1))] }),
      'teoria.a',
    )
    expect(state.status).toBe('in-progress')
  })
})

describe('nível por trilha', () => {
  it('começa sem nível', () => {
    const tracks = computeProgress(catalog, NO_FACTS).tracks
    expect(tracks.get('harmonia')).toEqual({
      trackId: 'harmonia',
      level: 0,
      next: { level: 1, satisfied: 0, total: 1 },
    })
  })

  it('sobe quando todas as essenciais do nível estão satisfeitas', () => {
    const tracks = computeProgress(catalog, bMastered).tracks
    expect(tracks.get('teoria')?.level).toBe(1)
    expect(tracks.get('harmonia')).toEqual({
      trackId: 'harmonia',
      level: 1,
      // harmonia.d não é essencial: o nível 2 tem só harmonia.c
      next: { level: 2, satisfied: 0, total: 1 },
    })
  })

  it('um nível sem competências interrompe a contagem', () => {
    // Teoria só tem nível 1: mesmo dominando tudo, não passa para o nível 2.
    const tracks = computeProgress(catalog, bMastered).tracks
    expect(tracks.get('teoria')).toEqual({
      trackId: 'teoria',
      level: 1,
      next: { level: 2, satisfied: 0, total: 0 },
    })

    // Harmonia: N1 e N2 satisfeitos, N3 (harmonia.e) não → fica no 2, mesmo sem lacuna antes.
    const more = computeProgress(catalog, {
      ...bMastered,
      declarations: [...bMastered.declarations, { competencyId: 'harmonia.c', declaredAt: day(5) }],
    }).tracks
    expect(more.get('harmonia')).toMatchObject({
      level: 2,
      next: { level: 3, satisfied: 0, total: 1 },
    })
  })
})

describe('aulas', () => {
  it('status pelos checkpoints concluídos', () => {
    const lessons = (checkpoints: Record<string, string>) =>
      computeProgress(
        catalog,
        facts({ lessonProgress: [lessonProgress('harmonia.l1', checkpoints, day(5))] }),
      ).lessons.get('harmonia.l1')

    expect(computeProgress(catalog, NO_FACTS).lessons.get('harmonia.l1')).toMatchObject({
      status: 'not-started',
      totalCheckpoints: 2,
      lastVisitedAt: null,
    })
    expect(lessons({ x: day(4) })).toMatchObject({
      status: 'in-progress',
      completedCheckpoints: ['x'],
    })
    expect(lessons({ x: day(4), y: day(5) })).toMatchObject({
      status: 'completed',
      completedAt: day(5),
    })
  })

  it('ignora checkpoints que não existem mais na aula', () => {
    const state = computeProgress(
      catalog,
      facts({ lessonProgress: [lessonProgress('harmonia.l1', { antigo: day(1) }, day(1))] }),
    ).lessons.get('harmonia.l1')
    expect(state?.status).toBe('not-started')
  })

  it('concluir a aula não domina a competência', () => {
    const snapshot = computeProgress(
      catalog,
      facts({ lessonProgress: [lessonProgress('harmonia.l1', { x: day(1), y: day(1) }, day(1))] }),
    )
    expect(snapshot.lessons.get('harmonia.l1')?.status).toBe('completed')
    expect(snapshot.competencies.get('harmonia.b')?.status).toBe('in-progress')
  })
})

describe('auxiliares de declaração', () => {
  it('competências de uma trilha até um nível', () => {
    expect(competenciesUpToLevel(catalog, 'harmonia', 2)).toEqual([
      'harmonia.b',
      'harmonia.c',
      'harmonia.d',
    ])
    expect(competenciesUpToLevel(catalog, 'harmonia', 1)).toEqual(['harmonia.b'])
  })

  it('pré-requisitos não satisfeitos, diretos e indiretos', () => {
    expect(
      unsatisfiedPrerequisites(catalog, computeProgress(catalog, NO_FACTS), 'harmonia.c'),
    ).toEqual(['teoria.a', 'harmonia.b'])
    const declared = computeProgress(
      catalog,
      facts({ declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }] }),
    )
    expect(unsatisfiedPrerequisites(catalog, declared, 'harmonia.c')).toEqual(['harmonia.b'])
  })
})
