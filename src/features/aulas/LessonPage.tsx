import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { setCheckpointCompleted, visitLesson } from '@/data'
import type { Lesson } from '@/domain/catalog'
import { Badge, ProgressBar, StatusBadge } from '@/ui/Badges'
import { LESSON_STATUS, levelName, METHOD_LABEL } from '@/ui/labels'
import { Markdown, type EmbedRenderers } from '@/ui/markdown/Markdown'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { ExerciseRunner } from '../exercicios/ExerciseRunner.tsx'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './Lesson.module.css'

function embedsFor(lesson: Lesson, checkpointId: string): EmbedRenderers {
  return {
    concept: (id) => {
      const concept = catalog.conceptById.get(id)
      if (!concept) return null
      return (
        <details className={styles.concept} open>
          <summary>
            <span className={styles.conceptKicker}>Da Biblioteca</span> {concept.title}
          </summary>
          <Markdown root={concept.body} />
          <Link to={paths.concept(id)} className="small">
            Abrir na Biblioteca
          </Link>
        </details>
      )
    },
    exercise: (id) => {
      const exercise = catalog.exerciseById.get(id)
      return exercise ? (
        <ExerciseRunner
          exercise={exercise}
          context={{ lessonId: lesson.id, checkpointId }}
          embedded
        />
      ) : null
    },
  }
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const progress = useProgress()
  const lesson = catalog.lessonById.get(lessonId)

  useEffect(() => {
    if (lesson) void visitLesson(lesson.id)
  }, [lesson])

  if (!lesson) return <NotFoundPage />
  if (!progress) return <Loading />

  const { snapshot } = progress
  const state = snapshot.lessons.get(lesson.id)
  const done = new Set(state?.completedCheckpoints ?? [])
  const firstPending = lesson.checkpoints.find((c) => !done.has(c.id))
  const requested = params.get('parte')
  const current =
    lesson.checkpoints.find((c) => c.id === requested) ?? firstPending ?? lesson.checkpoints[0]
  const currentIndex = current ? lesson.checkpoints.indexOf(current) : 0
  const next = lesson.checkpoints[currentIndex + 1]
  const previous = lesson.checkpoints[currentIndex - 1]
  const track = catalog.trackById.get(lesson.track)
  const total = lesson.checkpoints.length
  const isCompleted = state?.status === 'completed'

  const goTo = (checkpointId: string) => {
    setParams({ parte: checkpointId })
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <PageHeader
        title={lesson.title}
        crumbs={[
          { label: 'Início', to: paths.home },
          { label: track?.name ?? lesson.track, to: paths.track(lesson.track) },
        ]}
        subtitle={lesson.summary}
        aside={
          <Badge tone={isCompleted ? 'success' : 'neutral'}>
            {LESSON_STATUS[state?.status ?? 'not-started']} · {done.size}/{total}
          </Badge>
        }
      />

      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <Badge>
          Nível {lesson.level} · {levelName(lesson.level)}
        </Badge>
        {lesson.estimatedMinutes && <Badge>Cerca de {lesson.estimatedMinutes} min</Badge>}
        {lesson.styles.map((id) => (
          <Badge key={id} tone="accent">
            {catalog.styleById.get(id)?.name ?? id}
          </Badge>
        ))}
      </div>

      {currentIndex === 0 && (
        <section className={`section card ${styles.before}`} aria-label="Antes de começar">
          <div>
            <h2 className={styles.boxTitle}>Objetivos</h2>
            <ul>
              {lesson.competencies.map((id) => (
                <li key={id}>
                  <Link to={paths.competency(id)}>
                    {catalog.competencyById.get(id)?.title ?? id}
                  </Link>
                  <span className="muted small">
                    {' '}
                    — {catalog.competencyById.get(id)?.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {lesson.prerequisites.length > 0 && (
            <div>
              <h2 className={styles.boxTitle}>Pré-requisitos recomendados</h2>
              <ul className={styles.prereqs}>
                {lesson.prerequisites.map((id) => {
                  const ps = snapshot.competencies.get(id)
                  return (
                    <li key={id}>
                      <Link to={paths.competency(id)}>
                        {catalog.competencyById.get(id)?.title ?? id}
                      </Link>{' '}
                      {ps && <StatusBadge status={ps.status} />}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {currentIndex === 0 && lesson.intro.children.length > 0 && (
        <div className="section">
          <Markdown root={lesson.intro} />
        </div>
      )}

      <nav className={`section ${styles.parts}`} aria-label="Partes da aula">
        <ProgressBar value={done.size / Math.max(1, total)} label="Progresso na aula" />
        <ol>
          {lesson.checkpoints.map((checkpoint, index) => (
            <li key={checkpoint.id}>
              <button
                type="button"
                className={styles.part}
                aria-current={checkpoint === current ? 'step' : undefined}
                onClick={() => goTo(checkpoint.id)}
              >
                <span className={styles.partMark} data-done={done.has(checkpoint.id)}>
                  {done.has(checkpoint.id) ? '✓' : index + 1}
                </span>
                {checkpoint.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {current && (
        <article className="section" aria-labelledby="parte-atual">
          <h2 id="parte-atual" className={styles.partTitle}>
            <span className="muted">
              Parte {currentIndex + 1} de {total} ·{' '}
            </span>
            {current.title}
          </h2>
          <Markdown root={current.body} embeds={embedsFor(lesson, current.id)} />

          <div className={styles.footer}>
            {done.has(current.id) ? (
              <button
                type="button"
                className="button"
                onClick={() => void setCheckpointCompleted(lesson.id, current.id, false)}
              >
                ✓ Parte concluída (desfazer)
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  void setCheckpointCompleted(lesson.id, current.id, true)
                  if (next) goTo(next.id)
                }}
              >
                {next ? 'Concluí esta parte · próxima →' : 'Concluí esta parte'}
              </button>
            )}
            <span className={styles.nav}>
              {previous && (
                <button type="button" className="button" onClick={() => goTo(previous.id)}>
                  ← Anterior
                </button>
              )}
              {next && (
                <button type="button" className="button" onClick={() => goTo(next.id)}>
                  Próxima →
                </button>
              )}
            </span>
          </div>
        </article>
      )}

      {isCompleted && (
        <section className={`section card ${styles.completed}`} aria-labelledby="concluida">
          <h2 id="concluida" className={styles.boxTitle}>
            Aula concluída 🎉
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Concluir a aula não marca as competências como dominadas: para isso, cumpra os critérios
            abaixo.
          </p>
          <ul className={styles.criteria}>
            {lesson.competencies.map((id) => {
              const competency = catalog.competencyById.get(id)
              const cs = snapshot.competencies.get(id)
              if (!competency) return null
              return (
                <li key={id}>
                  <div className="row">
                    <Link to={paths.competency(id)}>{competency.title}</Link>
                    {cs && <StatusBadge status={cs.status} />}
                  </div>
                  <ul>
                    {competency.mastery.map((criterion) => {
                      const met = cs?.criteria.find((c) => c.criterionId === criterion.id)?.met
                      return (
                        <li key={criterion.id} className="small">
                          {met ? '✓ ' : ''}
                          {METHOD_LABEL[criterion.method]}:{' '}
                          <Link to={paths.exercise(criterion.exercise)}>
                            {catalog.exerciseById.get(criterion.exercise)?.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
