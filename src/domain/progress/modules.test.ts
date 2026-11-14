import { indexCatalog, type Module } from '../catalog/index.ts'
import { catalogData, day, facts, lessonProgress } from './fixtures.ts'
import { computeStudyMap, learningOverview, nextInPath, pathToGoal } from './modules.ts'
import { computeProgress } from './progress.ts'

const mod = (id: string, lessons: string[], prerequisites: string[] = []): Module => ({
  id: `curso.${id}`,
  course: 'curso',
  title: id,
  summary: id,
  level: 1,
  prerequisites: prerequisites.map((p) => `curso.${p}`),
  lessons,
  upcoming: [],
  style: null,
  estimatedMinutes: null,
})

const catalog = indexCatalog({
  ...catalogData,
  courses: [
    {
      id: 'curso',
      title: 'Curso',
      summary: '-',
      modules: [
        mod('um', ['harmonia.l1']),
        mod('dois', ['harmonia.l2'], ['um']),
        mod('tres', [], ['dois']),
      ],
    },
  ],
})

const NOW = new Date(2026, 10, 14, 12)
const mapFor = (f = facts()) => computeStudyMap(catalog, computeProgress(catalog, f), f, NOW)

describe('computeStudyMap', () => {
  it('sem histórico: primeiro módulo novo, o seguinte avançado, o vazio em preparação', () => {
    const map = mapFor()
    expect(map.modules.get('curso.um')?.status).toBe('new')
    expect(map.modules.get('curso.dois')?.status).toBe('advanced')
    expect(map.modules.get('curso.dois')?.missingModules).toEqual(['curso.um'])
    expect(map.modules.get('curso.tres')?.status).toBe('upcoming')
    expect(map.lessons.get('harmonia.l2')).toBe('advanced')
  })

  it('em andamento, concluído e revisão depois de 30 dias', () => {
    const inProgress = mapFor(
      facts({ lessonProgress: [lessonProgress('harmonia.l1', { x: day(13) }, day(13))] }),
    )
    expect(inProgress.modules.get('curso.um')?.status).toBe('in-progress')
    expect(inProgress.modules.get('curso.um')?.nextLesson).toBe('harmonia.l1')

    const done = mapFor(
      facts({
        lessonProgress: [lessonProgress('harmonia.l1', { x: day(13), y: day(13) }, day(13))],
      }),
    )
    expect(done.modules.get('curso.um')?.status).toBe('completed')
    expect(done.modules.get('curso.dois')?.status).toBe('new')

    const old = new Date(2026, 8, 1).toISOString()
    const stale = facts({
      lessonProgress: [lessonProgress('harmonia.l1', { x: old, y: old }, old)],
    })
    expect(mapFor(stale).modules.get('curso.um')?.status).toBe('review')
    const reviewed = facts({
      lessonProgress: [
        { ...lessonProgress('harmonia.l1', { x: old, y: old }, old), reviewedAt: day(10) },
      ],
    })
    expect(mapFor(reviewed).modules.get('curso.um')?.status).toBe('completed')
  })

  it('competências declaradas concluem o módulo para efeito de pré-requisito', () => {
    const map = mapFor(
      facts({
        declarations: [
          { competencyId: 'teoria.a', declaredAt: day(1) },
          { competencyId: 'harmonia.b', declaredAt: day(1) },
        ],
      }),
    )
    expect(map.modules.get('curso.dois')?.status).toBe('new')
  })
})

describe('percurso', () => {
  it('learningOverview aponta o módulo atual e a próxima aula', () => {
    const overview = learningOverview(mapFor())
    expect(overview).toMatchObject({
      currentModule: 'curso.um',
      nextLesson: 'harmonia.l1',
      lessonsTotal: 2,
      modulesAvailable: 2,
    })
  })

  it('pathToGoal lista os módulos pendentes até o objetivo, pré-requisitos primeiro', () => {
    expect(pathToGoal(catalog, mapFor(), 'curso.tres')).toEqual([
      'curso.um',
      'curso.dois',
      'curso.tres',
    ])
  })

  it('nextInPath segue a ordem dos módulos', () => {
    const l1 = catalog.lessonById.get('harmonia.l1')
    expect(l1 && nextInPath(catalog, l1)).toBe('harmonia.l2')
  })
})
