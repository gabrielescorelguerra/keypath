import type { CatalogIndex, Lesson, Module } from '../catalog/index.ts'
import { latest } from './dates.ts'
import type { LessonProgress, UserFacts } from './facts.ts'
import type { ProgressSnapshot } from './progress.ts'

/** Depois de quantos dias uma aula concluída pede revisão. */
export const REVIEW_AFTER_DAYS = 30
const DAY = 24 * 60 * 60 * 1000

/**
 * Situação de uma aula ou módulo no percurso:
 * - upcoming: ainda sem aula (tópicos em preparação);
 * - advanced: há módulos pré-requisito não concluídos (pode estudar, mas é avançado para você);
 * - new / in-progress / completed;
 * - review: concluído há mais de REVIEW_AFTER_DAYS dias sem revisão.
 */
export type StudyStatus = 'upcoming' | 'advanced' | 'new' | 'in-progress' | 'completed' | 'review'

/** Data da última conclusão ou revisão de uma aula concluída. */
function lastTouched(snapshot: ProgressSnapshot, progress: LessonProgress | undefined, id: string) {
  const state = snapshot.lessons.get(id)
  if (state?.status !== 'completed') return null
  return latest([state.completedAt ?? '', progress?.reviewedAt ?? ''].filter(Boolean))
}

export function lessonNeedsReview(
  snapshot: ProgressSnapshot,
  facts: UserFacts,
  lessonId: string,
  now: Date,
): boolean {
  const progress = facts.lessonProgress.find((p) => p.lessonId === lessonId)
  const touched = lastTouched(snapshot, progress, lessonId)
  return touched !== null && now.getTime() - Date.parse(touched) > REVIEW_AFTER_DAYS * DAY
}

export interface ModuleState {
  readonly moduleId: string
  readonly status: StudyStatus
  readonly lessonsCompleted: number
  readonly lessonsTotal: number
  /** Competências trabalhadas pelas aulas do módulo. */
  readonly competencies: readonly string[]
  readonly competenciesSatisfied: number
  /** Módulos pré-requisito ainda não concluídos. */
  readonly missingModules: readonly string[]
  /** Aulas que pedem revisão. */
  readonly lessonsToReview: readonly string[]
  /** Próxima aula a estudar no módulo (a em andamento, senão a primeira não concluída). */
  readonly nextLesson: string | null
  readonly lastVisitedAt: string | null
}

export interface StudyMap {
  readonly modules: ReadonlyMap<string, ModuleState>
  readonly lessons: ReadonlyMap<string, StudyStatus>
}

/** Um módulo conta como concluído (para pré-requisitos) quando tem aulas e todas estão concluídas ou suas competências satisfeitas. */
function isModuleDone(catalog: CatalogIndex, snapshot: ProgressSnapshot, module: Module) {
  if (module.lessons.length === 0) return true // em preparação: não bloqueia
  return module.lessons.every((id) => {
    if (snapshot.lessons.get(id)?.status === 'completed') return true
    const lesson = catalog.lessonById.get(id)
    return (
      lesson !== undefined &&
      lesson.competencies.every((c) => snapshot.competencies.get(c)?.satisfied)
    )
  })
}

export function computeStudyMap(
  catalog: CatalogIndex,
  snapshot: ProgressSnapshot,
  facts: UserFacts,
  now: Date,
): StudyMap {
  const modules = new Map<string, ModuleState>()
  const lessons = new Map<string, StudyStatus>()

  for (const module of catalog.modules) {
    const missingModules = module.prerequisites.filter((id) => {
      const prerequisite = catalog.moduleById.get(id)
      return prerequisite !== undefined && !isModuleDone(catalog, snapshot, prerequisite)
    })
    const states = module.lessons.map((id) => snapshot.lessons.get(id))
    const lessonsCompleted = states.filter((s) => s?.status === 'completed').length
    const anyStarted = states.some((s) => s && s.status !== 'not-started')
    const lessonsToReview = module.lessons.filter((id) =>
      lessonNeedsReview(snapshot, facts, id, now),
    )
    const competencies = [
      ...new Set(module.lessons.flatMap((id) => catalog.lessonById.get(id)?.competencies ?? [])),
    ]
    const competenciesSatisfied = competencies.filter(
      (id) => snapshot.competencies.get(id)?.satisfied,
    ).length

    let status: StudyStatus
    if (module.lessons.length === 0) status = 'upcoming'
    else if (lessonsCompleted === module.lessons.length)
      status = lessonsToReview.length > 0 ? 'review' : 'completed'
    else if (anyStarted) status = 'in-progress'
    else if (missingModules.length > 0) status = 'advanced'
    else status = 'new'

    const inProgress = module.lessons.find(
      (id) => snapshot.lessons.get(id)?.status === 'in-progress',
    )
    const nextLesson =
      inProgress ??
      module.lessons.find((id) => snapshot.lessons.get(id)?.status !== 'completed') ??
      null

    for (const id of module.lessons) {
      const s = snapshot.lessons.get(id)?.status ?? 'not-started'
      lessons.set(
        id,
        s === 'completed'
          ? lessonsToReview.includes(id)
            ? 'review'
            : 'completed'
          : s === 'in-progress'
            ? 'in-progress'
            : missingModules.length > 0
              ? 'advanced'
              : 'new',
      )
    }

    modules.set(module.id, {
      moduleId: module.id,
      status,
      lessonsCompleted,
      lessonsTotal: module.lessons.length,
      competencies,
      competenciesSatisfied,
      missingModules,
      lessonsToReview,
      nextLesson,
      lastVisitedAt: latest(states.flatMap((s) => (s?.lastVisitedAt ? [s.lastVisitedAt] : []))),
    })
  }
  return { modules, lessons }
}

/**
 * Caminho até um objetivo: o módulo e seus pré-requisitos (recursivamente) ainda
 * não concluídos, em ordem de estudo (pré-requisitos primeiro).
 */
export function pathToGoal(catalog: CatalogIndex, map: StudyMap, goalId: string): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  const visit = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    const module = catalog.moduleById.get(id)
    if (!module) return
    for (const p of module.prerequisites) visit(p)
    const status = map.modules.get(id)?.status
    if (status !== 'completed' && status !== 'review') result.push(id)
  }
  visit(goalId)
  return result
}

export interface LearningOverview {
  /** Módulo em que você está: o da aula visitada mais recentemente que não terminou. */
  readonly currentModule: string | null
  /** A próxima aula recomendada. */
  readonly nextLesson: string | null
  readonly lessonsCompleted: number
  readonly lessonsTotal: number
  readonly modulesCompleted: number
  /** Módulos com aulas publicadas. */
  readonly modulesAvailable: number
}

export function learningOverview(map: StudyMap): LearningOverview {
  const states = [...map.modules.values()]
  const byRecent = states
    .filter((s) => s.lastVisitedAt !== null && s.nextLesson !== null)
    .sort((a, b) => Date.parse(b.lastVisitedAt ?? '') - Date.parse(a.lastVisitedAt ?? ''))
  // Sem histórico: o primeiro módulo novo, na ordem dos cursos.
  const current =
    byRecent[0] ??
    states.find((s) => s.status === 'in-progress') ??
    states.find((s) => s.status === 'new') ??
    null
  const withLessons = states.filter((s) => s.lessonsTotal > 0)
  return {
    currentModule: current?.moduleId ?? null,
    nextLesson: current?.nextLesson ?? null,
    lessonsCompleted: withLessons.reduce((n, s) => n + s.lessonsCompleted, 0),
    lessonsTotal: withLessons.reduce((n, s) => n + s.lessonsTotal, 0),
    modulesCompleted: withLessons.filter((s) => s.status === 'completed' || s.status === 'review')
      .length,
    modulesAvailable: withLessons.length,
  }
}

/** A aula seguinte no percurso (no mesmo módulo; senão, a primeira do próximo módulo com aulas). */
export function nextInPath(catalog: CatalogIndex, lesson: Lesson): string | null {
  const ordered = catalog.modules.flatMap((m) => m.lessons)
  const index = ordered.indexOf(lesson.id)
  return index >= 0 ? (ordered[index + 1] ?? null) : null
}
