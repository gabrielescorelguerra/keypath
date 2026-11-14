/** Catálogo e fatos de teste (usado só pelos testes deste módulo). */
import { indexCatalog, type Catalog, type Competency, type Lesson } from '../catalog/index.ts'
import type { Attempt, LessonProgress, UserFacts } from './facts.ts'

const EMPTY = { type: 'root' as const, children: [] }

function competency(
  id: string,
  level: 1 | 2 | 3,
  prerequisites: string[],
  mastery: Competency['mastery'],
  extra: Partial<Competency> = {},
): Competency {
  return {
    id,
    track: id.split('.')[0] ?? '',
    level,
    title: id,
    description: id,
    core: true,
    prerequisites,
    concepts: [],
    styles: [],
    mastery,
    order: 0,
    ...extra,
  }
}

const quizCriterion = (exercise: string, minScore = 0.8, distinctDays = 1) => ({
  id: 'quiz',
  method: 'quiz' as const,
  exercise,
  minScore,
  distinctDays,
})
const selfCriterion = (exercise: string, distinctDays = 1) => ({
  id: 'teclado',
  method: 'self-assessment' as const,
  exercise,
  minScore: 0.8,
  distinctDays,
})

function lesson(
  id: string,
  competencies: string[],
  checkpoints: string[],
  extra: Partial<Lesson> = {},
): Lesson {
  return {
    id,
    title: id,
    summary: id,
    track: 'harmonia',
    competencies,
    styles: [],
    estimatedMinutes: null,
    intro: EMPTY,
    checkpoints: checkpoints.map((c) => ({ id: c, title: c, body: EMPTY })),
    level: 1,
    prerequisites: [],
    ...extra,
  }
}

/**
 * teoria.a (N1)
 *   └─ harmonia.b (N1) — quiz + execução em 2 dias
 *        ├─ harmonia.c (N2)
 *        └─ harmonia.d (N2, não essencial, gospel)
 * harmonia.e (N3, sem pré-requisitos e sem aula)
 *
 * Aulas: harmonia.l1 trabalha b (checkpoints x, y); harmonia.l2 trabalha c e d (z, gospel).
 */
const competencies: Competency[] = [
  competency('teoria.a', 1, [], [quizCriterion('teoria.a.quiz')]),
  competency(
    'harmonia.b',
    1,
    ['teoria.a'],
    [quizCriterion('harmonia.b.quiz'), selfCriterion('harmonia.b.exec', 2)],
  ),
  competency('harmonia.c', 2, ['harmonia.b'], [quizCriterion('harmonia.c.quiz')]),
  competency('harmonia.d', 2, ['harmonia.b'], [quizCriterion('harmonia.d.quiz')], {
    core: false,
    styles: ['gospel'],
  }),
  competency('harmonia.e', 3, [], [quizCriterion('harmonia.e.quiz')]),
].map((c, order) => ({ ...c, order }))

const quizExercise = (id: string, competencyId: string) => ({
  id,
  title: id,
  prompt: null,
  competencies: [competencyId],
  styles: [],
  type: 'quiz' as const,
  questions: [
    {
      id: 'q1',
      kind: 'single-choice' as const,
      prompt: '?',
      options: ['a', 'b'],
      correct: [0],
      explanation: null,
    },
    {
      id: 'q2',
      kind: 'multiple-choice' as const,
      prompt: '?',
      options: ['a', 'b', 'c'],
      correct: [0, 2],
      explanation: null,
    },
  ],
})

export const catalogData: Catalog = {
  tracks: [
    { id: 'teoria', name: 'Teoria', description: '-', kind: 'discipline' },
    { id: 'harmonia', name: 'Harmonia', description: '-', kind: 'discipline' },
  ],
  levels: ([1, 2, 3, 4, 5] as const).map((number) => ({ number, name: `N${number}` })),
  styles: [{ id: 'gospel', name: 'Gospel' }],
  competencies,
  concepts: [],
  lessons: [
    lesson('harmonia.l1', ['harmonia.b'], ['x', 'y']),
    lesson('harmonia.l2', ['harmonia.c', 'harmonia.d'], ['z'], { level: 2, styles: ['gospel'] }),
  ],
  exercises: [
    quizExercise('teoria.a.quiz', 'teoria.a'),
    quizExercise('harmonia.b.quiz', 'harmonia.b'),
    {
      id: 'harmonia.b.exec',
      title: 'exec',
      prompt: null,
      competencies: ['harmonia.b'],
      styles: [],
      type: 'performance',
      parameters: { keys: [], targetBpm: null, hands: null },
      checklist: [
        { id: 'um', text: 'um' },
        { id: 'dois', text: 'dois' },
      ],
    },
    quizExercise('harmonia.c.quiz', 'harmonia.c'),
    quizExercise('harmonia.d.quiz', 'harmonia.d'),
    quizExercise('harmonia.e.quiz', 'harmonia.e'),
  ],
}

export const catalog = indexCatalog(catalogData)

let nextId = 0

/** Data local: dia(14, 10) = 14/11/2026 às 10h no fuso da máquina. */
export const day = (date: number, hour = 10) => new Date(2026, 10, date, hour).toISOString()

export function quizAttempt(exerciseId: string, score: number, at: string): Attempt {
  return {
    id: `a${nextId++}`,
    exerciseId,
    startedAt: at,
    finishedAt: at,
    context: {},
    result: { type: 'quiz', answers: {}, score },
  }
}

export function selfAttempt(
  exerciseId: string,
  checked: Record<string, boolean>,
  at: string,
): Attempt {
  return {
    id: `a${nextId++}`,
    exerciseId,
    startedAt: at,
    finishedAt: at,
    context: {},
    result: { type: 'self-assessment', checked },
  }
}

export function lessonProgress(
  lessonId: string,
  checkpoints: Record<string, string>,
  lastVisitedAt: string,
): LessonProgress {
  return { lessonId, startedAt: lastVisitedAt, lastVisitedAt, checkpoints }
}

export function facts(partial: Partial<UserFacts> = {}): UserFacts {
  return { attempts: [], declarations: [], lessonProgress: [], ...partial }
}

/** Fatos que deixam harmonia.b dominada (e teoria.a declarada). */
export const bMastered = facts({
  declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }],
  attempts: [
    quizAttempt('harmonia.b.quiz', 1, day(2)),
    selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(2)),
    selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(3)),
  ],
})
