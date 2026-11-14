import type { CatalogIndex, Competency, Lesson } from '../catalog/index.ts'
import type { ProgressSnapshot } from './progress.ts'

export type Recommendation =
  /** Continuar a aula em andamento. */
  | { readonly kind: 'continue-lesson'; readonly lessonId: string }
  /** Começar (ou retomar) uma aula que trabalha uma competência pronta. */
  | { readonly kind: 'start-lesson'; readonly lessonId: string; readonly competencyId: string }
  /** Demonstrar uma competência pronta pelos exercícios (não há aula pendente para ela). */
  | { readonly kind: 'demonstrate'; readonly competencyId: string }

export interface RecommendationFilter {
  readonly trackId?: string
  readonly styleId?: string
}

/**
 * Próximos passos, em ordem de prioridade (produto §5):
 * 1. aulas em andamento, da visitada mais recentemente;
 * 2. competências prontas (pré-requisitos atendidos, não satisfeitas), por nível e
 *    ordem de cadastro — com a aula que as trabalha, ou "demonstrar" se não houver.
 * Recomenda, nunca bloqueia (D06).
 */
export function recommend(
  catalog: CatalogIndex,
  snapshot: ProgressSnapshot,
  filter: RecommendationFilter = {},
  limit = 3,
): readonly Recommendation[] {
  const { trackId, styleId } = filter
  const lessonsOf = (c: Competency) => catalog.lessonsByCompetency.get(c.id) ?? []

  const competencyMatches = (c: Competency) =>
    (trackId === undefined || c.track === trackId) &&
    (styleId === undefined ||
      c.styles.includes(styleId) ||
      lessonsOf(c).some((l) => l.styles.includes(styleId)))

  const lessonMatches = (lesson: Lesson) => {
    const worked = lesson.competencies.flatMap((id) => {
      const c = catalog.competencyById.get(id)
      return c ? [c] : []
    })
    return (
      (trackId === undefined ||
        lesson.track === trackId ||
        worked.some((c) => c.track === trackId)) &&
      (styleId === undefined ||
        lesson.styles.includes(styleId) ||
        worked.some((c) => c.styles.includes(styleId)))
    )
  }

  const result: Recommendation[] = []
  const recommendedLessons = new Set<string>()

  // 1. Aulas em andamento
  const inProgress = catalog.lessons
    .filter((l) => snapshot.lessons.get(l.id)?.status === 'in-progress' && lessonMatches(l))
    .sort(
      (a, b) =>
        Date.parse(snapshot.lessons.get(b.id)?.lastVisitedAt ?? '') -
        Date.parse(snapshot.lessons.get(a.id)?.lastVisitedAt ?? ''),
    )
  for (const lesson of inProgress) {
    result.push({ kind: 'continue-lesson', lessonId: lesson.id })
    recommendedLessons.add(lesson.id)
  }

  // 2. Competências prontas
  const lessonOrder = new Map(catalog.lessons.map((l, index) => [l.id, index]))
  const ready = catalog.competencies
    .filter((c) => snapshot.competencies.get(c.id)?.ready && competencyMatches(c))
    .sort((a, b) => a.level - b.level || a.order - b.order)

  for (const competency of ready) {
    const lessons = lessonsOf(competency)
    if (lessons.some((l) => recommendedLessons.has(l.id))) continue

    const pending = lessons
      .filter((l) => snapshot.lessons.get(l.id)?.status !== 'completed')
      .sort(
        (a, b) => a.level - b.level || (lessonOrder.get(a.id) ?? 0) - (lessonOrder.get(b.id) ?? 0),
      )
    const lesson = pending[0]
    if (lesson) {
      result.push({ kind: 'start-lesson', lessonId: lesson.id, competencyId: competency.id })
      recommendedLessons.add(lesson.id)
    } else {
      result.push({ kind: 'demonstrate', competencyId: competency.id })
    }
  }

  return result.slice(0, limit)
}
