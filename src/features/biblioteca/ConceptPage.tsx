import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { Markdown } from '@/ui/markdown/Markdown'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './Concept.module.css'

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

      <div className={styles.layout}>
        <article className={styles.article}>
          <Markdown root={concept.body} />
        </article>

        <aside className={styles.aside} aria-label="Neste verbete">
          {concept.aliases.length > 0 && (
            <div className={styles.block}>
              <span className="eyebrow">Também chamado de</span>
              <p className={styles.aliases}>{concept.aliases.join(' · ')}</p>
            </div>
          )}

          {concept.related.length > 0 && (
            <section className={styles.block} aria-labelledby="relacionados">
              <h2 id="relacionados" className="eyebrow">
                Veja também
              </h2>
              <ul className={styles.links}>
                {concept.related.map((id) => (
                  <li key={id}>
                    <Link to={paths.concept(id)} className="arrow-link small">
                      {catalog.conceptById.get(id)?.title ?? id}
                      <Icon name="arrow" size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {competencies.length > 0 && (
            <section className={`panel sunken ${styles.block}`} aria-labelledby="estudar">
              <h2 id="estudar" className="eyebrow">
                Para estudar e praticar
              </h2>
              <ul className={styles.study}>
                {competencies.map((competency) => {
                  const state = progress?.snapshot.competencies.get(competency.id)
                  return (
                    <li key={competency.id}>
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
        </aside>
      </div>
    </>
  )
}
