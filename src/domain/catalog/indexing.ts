import type { Catalog, Competency, Concept, Exercise, Lesson, Style, Track } from './types.ts'

/** Catálogo com índices de consulta — calculados uma vez, ao carregar. */
export interface CatalogIndex extends Catalog {
  readonly trackById: ReadonlyMap<string, Track>
  readonly styleById: ReadonlyMap<string, Style>
  readonly competencyById: ReadonlyMap<string, Competency>
  readonly conceptById: ReadonlyMap<string, Concept>
  readonly lessonById: ReadonlyMap<string, Lesson>
  readonly exerciseById: ReadonlyMap<string, Exercise>
  /** Competências de cada trilha, na ordem de cadastro. */
  readonly competenciesByTrack: ReadonlyMap<string, readonly Competency[]>
  /** Aulas que trabalham cada competência. */
  readonly lessonsByCompetency: ReadonlyMap<string, readonly Lesson[]>
  /** Competências que dependem diretamente de cada competência. */
  readonly dependentsByCompetency: ReadonlyMap<string, readonly Competency[]>
}

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]))

const groupBy = <T>(items: readonly T[], keysOf: (item: T) => readonly string[]) => {
  const map = new Map<string, T[]>()
  for (const item of items) {
    for (const key of keysOf(item)) {
      const group = map.get(key)
      if (group) group.push(item)
      else map.set(key, [item])
    }
  }
  return map
}

export function indexCatalog(catalog: Catalog): CatalogIndex {
  return {
    ...catalog,
    trackById: byId(catalog.tracks),
    styleById: byId(catalog.styles),
    competencyById: byId(catalog.competencies),
    conceptById: byId(catalog.concepts),
    lessonById: byId(catalog.lessons),
    exerciseById: byId(catalog.exercises),
    competenciesByTrack: groupBy(catalog.competencies, (c) => [c.track]),
    lessonsByCompetency: groupBy(catalog.lessons, (l) => l.competencies),
    dependentsByCompetency: groupBy(catalog.competencies, (c) => c.prerequisites),
  }
}
