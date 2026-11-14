import type {
  CatalogIndex,
  Competency,
  Exercise,
  Lesson,
  LevelNumber,
  MasteryCriterion,
  MasteryMethod,
} from '../catalog/index.ts'
import { latest, localDayKey } from './dates.ts'
import type { Attempt, Declaration, LessonProgress, UserFacts } from './facts.ts'
import { isSelfAssessmentComplete } from './grading.ts'

/**
 * Estado derivado (modelo de dados §6). Tudo aqui é calculado a partir do
 * catálogo e dos fatos do usuário — nada é salvo.
 */

export type CompetencyStatus = 'mastered' | 'declared' | 'in-progress' | 'not-started'

export interface CriterionState {
  readonly criterionId: string
  readonly method: MasteryMethod
  readonly exerciseId: string
  readonly met: boolean
  /** Dias distintos em que o critério foi cumprido. */
  readonly qualifyingDays: number
  readonly requiredDays: number
  /** Quando o critério passou a estar cumprido. */
  readonly metAt: string | null
  /** Melhor aproveitamento (só quiz). */
  readonly bestScore: number | null
}

export interface CompetencyState {
  readonly competencyId: string
  readonly status: CompetencyStatus
  /** Dominada ou declarada — vale para pré-requisitos e nível (D20). */
  readonly satisfied: boolean
  readonly criteria: readonly CriterionState[]
  readonly masteredAt: string | null
  readonly declaredAt: string | null
  readonly prerequisitesMet: boolean
  readonly missingPrerequisites: readonly string[]
  /** Pré-requisitos atendidos e ainda não satisfeita. */
  readonly ready: boolean
  readonly lastActivityAt: string | null
}

export interface TrackLevelState {
  readonly trackId: string
  /** 0 = sem nível. */
  readonly level: 0 | LevelNumber
  /** Progresso no próximo nível; null quando o nível 5 foi atingido. */
  readonly next: {
    readonly level: LevelNumber
    readonly satisfied: number
    readonly total: number
  } | null
}

export type LessonStatus = 'not-started' | 'in-progress' | 'completed'

export interface LessonState {
  readonly lessonId: string
  readonly status: LessonStatus
  readonly completedCheckpoints: readonly string[]
  readonly totalCheckpoints: number
  readonly lastVisitedAt: string | null
  readonly completedAt: string | null
}

export interface ProgressSnapshot {
  readonly competencies: ReadonlyMap<string, CompetencyState>
  readonly tracks: ReadonlyMap<string, TrackLevelState>
  readonly lessons: ReadonlyMap<string, LessonState>
}

const SCORE_EPSILON = 1e-9

function evaluateCriterion(
  criterion: MasteryCriterion,
  exercise: Exercise | undefined,
  attempts: readonly Attempt[],
): CriterionState {
  const qualifying: Attempt[] = []
  let bestScore: number | null = null

  for (const attempt of attempts) {
    const result = attempt.result
    if (criterion.method === 'quiz' && result.type === 'quiz') {
      bestScore = Math.max(bestScore ?? 0, result.score)
      if (result.score + SCORE_EPSILON >= criterion.minScore) qualifying.push(attempt)
    } else if (
      criterion.method === 'self-assessment' &&
      result.type === 'self-assessment' &&
      exercise?.type === 'performance' &&
      isSelfAssessmentComplete(exercise, result)
    ) {
      qualifying.push(attempt)
    }
  }

  qualifying.sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt))
  const days = new Set<string>()
  let metAt: string | null = null
  for (const attempt of qualifying) {
    days.add(localDayKey(attempt.finishedAt))
    if (metAt === null && days.size >= criterion.distinctDays) metAt = attempt.finishedAt
  }

  return {
    criterionId: criterion.id,
    method: criterion.method,
    exerciseId: criterion.exercise,
    met: metAt !== null,
    qualifyingDays: days.size,
    requiredDays: criterion.distinctDays,
    metAt,
    bestScore: criterion.method === 'quiz' ? bestScore : null,
  }
}

function lessonState(lesson: Lesson, progress: LessonProgress | undefined): LessonState {
  const done = lesson.checkpoints
    .map((c) => c.id)
    .filter((id) => progress?.checkpoints[id] !== undefined)
  const total = lesson.checkpoints.length
  const status: LessonStatus =
    done.length === 0 ? 'not-started' : done.length === total ? 'completed' : 'in-progress'
  return {
    lessonId: lesson.id,
    status,
    completedCheckpoints: done,
    totalCheckpoints: total,
    lastVisitedAt: progress?.lastVisitedAt ?? null,
    completedAt:
      status === 'completed' ? latest(done.map((id) => progress?.checkpoints[id] ?? '')) : null,
  }
}

export function computeProgress(catalog: CatalogIndex, facts: UserFacts): ProgressSnapshot {
  // --- Índices dos fatos -----------------------------------------------------
  const attemptsByExercise = new Map<string, Attempt[]>()
  for (const attempt of facts.attempts) {
    const list = attemptsByExercise.get(attempt.exerciseId)
    if (list) list.push(attempt)
    else attemptsByExercise.set(attempt.exerciseId, [attempt])
  }
  const declarations = new Map<string, Declaration>()
  for (const declaration of facts.declarations) {
    const existing = declarations.get(declaration.competencyId)
    if (!existing || Date.parse(declaration.declaredAt) > Date.parse(existing.declaredAt)) {
      declarations.set(declaration.competencyId, declaration)
    }
  }
  const progressByLesson = new Map(facts.lessonProgress.map((p) => [p.lessonId, p]))

  // --- Aulas -----------------------------------------------------------------
  const lessons = new Map<string, LessonState>()
  for (const lesson of catalog.lessons) {
    lessons.set(lesson.id, lessonState(lesson, progressByLesson.get(lesson.id)))
  }

  // --- Competências (1ª passada: domínio e atividade) ------------------------
  const exercisesTraining = new Map<string, string[]>()
  for (const exercise of catalog.exercises) {
    for (const id of exercise.competencies) {
      const list = exercisesTraining.get(id)
      if (list) list.push(exercise.id)
      else exercisesTraining.set(id, [exercise.id])
    }
  }

  const base = new Map<
    string,
    Omit<CompetencyState, 'prerequisitesMet' | 'missingPrerequisites' | 'ready'>
  >()
  for (const competency of catalog.competencies) {
    const criteria = competency.mastery.map((criterion) =>
      evaluateCriterion(
        criterion,
        catalog.exerciseById.get(criterion.exercise),
        attemptsByExercise.get(criterion.exercise) ?? [],
      ),
    )
    const mastered = criteria.length > 0 && criteria.every((c) => c.met)
    const declaration = declarations.get(competency.id)

    const exerciseIds = new Set([
      ...competency.mastery.map((m) => m.exercise),
      ...(exercisesTraining.get(competency.id) ?? []),
    ])
    const activity = [
      ...[...exerciseIds].flatMap((id) =>
        (attemptsByExercise.get(id) ?? []).map((a) => a.finishedAt),
      ),
      ...(catalog.lessonsByCompetency.get(competency.id) ?? []).flatMap((lesson) =>
        Object.values(progressByLesson.get(lesson.id)?.checkpoints ?? {}),
      ),
    ]
    const lastActivityAt = latest(activity)

    const status: CompetencyStatus = mastered
      ? 'mastered'
      : declaration
        ? 'declared'
        : lastActivityAt
          ? 'in-progress'
          : 'not-started'

    base.set(competency.id, {
      competencyId: competency.id,
      status,
      satisfied: status === 'mastered' || status === 'declared',
      criteria,
      masteredAt: mastered ? latest(criteria.map((c) => c.metAt ?? '')) : null,
      declaredAt: declaration?.declaredAt ?? null,
      lastActivityAt,
    })
  }

  // --- Competências (2ª passada: pré-requisitos) -----------------------------
  const competencies = new Map<string, CompetencyState>()
  for (const competency of catalog.competencies) {
    const state = base.get(competency.id)
    if (!state) continue
    const missingPrerequisites = competency.prerequisites.filter(
      (id) => !(base.get(id)?.satisfied ?? false),
    )
    const prerequisitesMet = missingPrerequisites.length === 0
    competencies.set(competency.id, {
      ...state,
      prerequisitesMet,
      missingPrerequisites,
      ready: prerequisitesMet && !state.satisfied,
    })
  }

  // --- Nível por trilha ------------------------------------------------------
  const tracks = new Map<string, TrackLevelState>()
  for (const track of catalog.tracks) {
    const core = (catalog.competenciesByTrack.get(track.id) ?? []).filter((c) => c.core)
    const atLevel = (n: number) => core.filter((c) => c.level === n)
    const isSatisfied = (c: Competency) => competencies.get(c.id)?.satisfied ?? false

    let level: 0 | LevelNumber = 0
    for (const n of [1, 2, 3, 4, 5] as const) {
      const group = atLevel(n)
      if (group.length === 0 || !group.every(isSatisfied)) break
      level = n
    }
    const nextLevel = level === 5 ? null : ((level + 1) as LevelNumber)
    const nextGroup = nextLevel === null ? [] : atLevel(nextLevel)
    tracks.set(track.id, {
      trackId: track.id,
      level,
      next:
        nextLevel === null
          ? null
          : {
              level: nextLevel,
              satisfied: nextGroup.filter(isSatisfied).length,
              total: nextGroup.length,
            },
    })
  }

  return { competencies, tracks, lessons }
}

/** Competências de uma trilha até um nível — para o diagnóstico "já sei até aqui". */
export function competenciesUpToLevel(
  catalog: CatalogIndex,
  trackId: string,
  level: LevelNumber,
): readonly string[] {
  return (catalog.competenciesByTrack.get(trackId) ?? [])
    .filter((c) => c.level <= level)
    .map((c) => c.id)
}

/**
 * Pré-requisitos (diretos e indiretos) ainda não satisfeitos, em ordem de cadastro —
 * para oferecer "declarar também os pré-requisitos".
 */
export function unsatisfiedPrerequisites(
  catalog: CatalogIndex,
  snapshot: ProgressSnapshot,
  competencyId: string,
): readonly string[] {
  const found = new Set<string>()
  const stack = [...(catalog.competencyById.get(competencyId)?.prerequisites ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()
    if (id === undefined || found.has(id)) continue
    if (snapshot.competencies.get(id)?.satisfied) continue
    found.add(id)
    stack.push(...(catalog.competencyById.get(id)?.prerequisites ?? []))
  }
  return [...found].sort(
    (a, b) =>
      (catalog.competencyById.get(a)?.order ?? 0) - (catalog.competencyById.get(b)?.order ?? 0),
  )
}
