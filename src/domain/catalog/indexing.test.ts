import { indexCatalog } from './indexing.ts'
import type { Catalog, Competency, Lesson } from './types.ts'

const competency = (id: string, prerequisites: string[] = []): Competency => ({
  id,
  track: id.split('.')[0] ?? '',
  level: 1,
  title: id,
  description: id,
  core: true,
  prerequisites,
  concepts: [],
  styles: [],
  mastery: [],
  order: 0,
})

const lesson = (id: string, competencies: string[]): Lesson => ({
  id,
  title: id,
  summary: id,
  track: 'harmonia',
  competencies,
  styles: [],
  estimatedMinutes: null,
  intro: { type: 'root', children: [] },
  checkpoints: [],
  level: 1,
  prerequisites: [],
})

it('indexa o catálogo', () => {
  const catalog: Catalog = {
    tracks: [],
    levels: [],
    styles: [],
    competencies: [
      competency('teoria.a'),
      competency('harmonia.b', ['teoria.a']),
      competency('harmonia.c', ['teoria.a', 'harmonia.b']),
    ],
    concepts: [],
    lessons: [
      lesson('harmonia.l1', ['harmonia.b', 'harmonia.c']),
      lesson('harmonia.l2', ['harmonia.c']),
    ],
    exercises: [],
  }
  const index = indexCatalog(catalog)

  expect(index.competencyById.get('harmonia.b')?.prerequisites).toEqual(['teoria.a'])
  expect(index.competenciesByTrack.get('harmonia')?.map((c) => c.id)).toEqual([
    'harmonia.b',
    'harmonia.c',
  ])
  expect(index.lessonsByCompetency.get('harmonia.c')?.map((l) => l.id)).toEqual([
    'harmonia.l1',
    'harmonia.l2',
  ])
  expect(index.dependentsByCompetency.get('teoria.a')?.map((c) => c.id)).toEqual([
    'harmonia.b',
    'harmonia.c',
  ])
  expect(index.lessonsByCompetency.get('teoria.a')).toBeUndefined()
})
