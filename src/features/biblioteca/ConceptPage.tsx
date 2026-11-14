import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { StatusBadge } from '@/ui/Badges'
import { Markdown } from '@/ui/markdown/Markdown'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'

export function ConceptPage() {
  const { conceptId = '' } = useParams()
  const progress = useProgress()
  const concept = catalog.conceptById.get(conceptId)
  if (!concept) return <NotFoundPage />

  const competencies = catalog.competencies.filter((c) => c.concepts.includes(concept.id))
  const lessons = [
    ...new Map(
      competencies
        .flatMap((c) => catalog.lessonsByCompetency.get(c.id) ?? [])
        .map((lesson) => [lesson.id, lesson]),
    ).values(),
  ]

  return (
    <>
      <PageHeader
        title={concept.title}
        crumbs={[{ label: 'Biblioteca', to: paths.library }]}
        subtitle={concept.summary}
      />
      {concept.aliases.length > 0 && (
        <p className="muted small">Também chamado de: {concept.aliases.join(', ')}</p>
      )}

      <article className="section">
        <Markdown root={concept.body} />
      </article>

      {concept.related.length > 0 && (
        <section className="section" aria-labelledby="relacionados">
          <h2 id="relacionados">Veja também</h2>
          <ul className="list">
            {concept.related.map((id) => (
              <li key={id}>
                <Link to={paths.concept(id)} className="plain">
                  {catalog.conceptById.get(id)?.title ?? id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {competencies.length > 0 && (
        <section className="section" aria-labelledby="estudar">
          <h2 id="estudar">Para estudar e praticar</h2>
          <ul className="list">
            {competencies.map((competency) => {
              const state = progress?.snapshot.competencies.get(competency.id)
              return (
                <li key={competency.id} className="row">
                  <Link to={paths.competency(competency.id)} className="plain">
                    Competência: {competency.title}
                  </Link>
                  {state && <StatusBadge status={state.status} />}
                </li>
              )
            })}
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link to={paths.lesson(lesson.id)} className="plain">
                  Aula: {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
