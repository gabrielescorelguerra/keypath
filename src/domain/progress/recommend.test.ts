import { bMastered, catalog, day, facts, lessonProgress } from './fixtures.ts'
import { NO_FACTS, type UserFacts } from './facts.ts'
import { computeProgress } from './progress.ts'
import { recommend, type RecommendationFilter } from './recommend.ts'

const recs = (f: UserFacts, filter: RecommendationFilter = {}, limit = 5) =>
  recommend(catalog, computeProgress(catalog, f), filter, limit)

describe('recommend', () => {
  it('sem progresso: competências prontas por nível; demonstrar quando não há aula', () => {
    expect(recs(NO_FACTS)).toEqual([
      { kind: 'demonstrate', competencyId: 'teoria.a' },
      { kind: 'demonstrate', competencyId: 'harmonia.e' },
    ])
  })

  it('com o pré-requisito declarado, recomenda a aula da competência liberada', () => {
    const f = facts({ declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }] })
    expect(recs(f)[0]).toEqual({
      kind: 'start-lesson',
      lessonId: 'harmonia.l1',
      competencyId: 'harmonia.b',
    })
  })

  it('aula em andamento vem primeiro, a mais recente antes', () => {
    const f = facts({
      ...bMastered,
      lessonProgress: [
        lessonProgress('harmonia.l1', { x: day(3) }, day(3)),
        lessonProgress('harmonia.l2', {}, day(6)),
      ],
    })
    // l2 sem checkpoint concluído não está "em andamento"
    expect(recs(f)[0]).toEqual({ kind: 'continue-lesson', lessonId: 'harmonia.l1' })
  })

  it('a mesma aula não aparece duas vezes (c e d são trabalhadas por l2)', () => {
    const list = recs(bMastered)
    expect(list).toEqual([
      { kind: 'start-lesson', lessonId: 'harmonia.l2', competencyId: 'harmonia.c' },
      { kind: 'demonstrate', competencyId: 'harmonia.e' },
    ])
  })

  it('aula concluída sem domínio: recomenda demonstrar', () => {
    const f = facts({
      declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }],
      lessonProgress: [lessonProgress('harmonia.l1', { x: day(2), y: day(2) }, day(2))],
    })
    expect(recs(f)[0]).toEqual({ kind: 'demonstrate', competencyId: 'harmonia.b' })
  })

  it('filtra por trilha e por estilo', () => {
    expect(recs(NO_FACTS, { trackId: 'teoria' })).toEqual([
      { kind: 'demonstrate', competencyId: 'teoria.a' },
    ])
    expect(recs(bMastered, { styleId: 'gospel' })).toEqual([
      { kind: 'start-lesson', lessonId: 'harmonia.l2', competencyId: 'harmonia.c' },
    ])
  })

  it('respeita o limite e devolve vazio quando tudo está satisfeito', () => {
    expect(recs(NO_FACTS, {}, 1)).toHaveLength(1)
    const all = facts({
      declarations: ['teoria.a', 'harmonia.b', 'harmonia.c', 'harmonia.d', 'harmonia.e'].map(
        (competencyId) => ({
          competencyId,
          declaredAt: day(1),
        }),
      ),
    })
    expect(recs(all)).toEqual([])
  })
})
