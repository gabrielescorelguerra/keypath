import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { setCheckpointCompleted, visitLesson } from '@/data'
import type { Lesson } from '@/domain/catalog'
import { StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { formatMinutes, LESSON_STATUS, levelName, METHOD_LABEL } from '@/ui/labels'
import { Markdown, type EmbedRenderers } from '@/ui/markdown/Markdown'
import { Measures } from '@/ui/Notation'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { ExerciseRunner } from '../exercicios/ExerciseRunner.tsx'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './Lesson.module.css'
import { Materials, NextStep } from './LessonExtras.tsx'
import { INTRO_STEP, MATERIALS_STEP, STAGE_LABEL } from './stages.ts'

function embedsFor(lesson: Lesson, checkpointId: string): EmbedRenderers {
  return {
    concept: (id) => {
      const concept = catalog.conceptById.get(id)
      if (!concept) return null
      return (
        <details className={styles.concept} open>
          <summary>
            <span className="eyebrow accent">Da Biblioteca</span>
            <span className={styles.conceptTitle}>{concept.title}</span>
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
  const hasMaterials = lesson.materials.length > 0
  // Etapa atual: a pedida; senão a introdução (aula nova) ou a primeira parte pendente.
  const step =
    requested === INTRO_STEP || (requested === null && done.size === 0)
      ? INTRO_STEP
      : requested === MATERIALS_STEP && hasMaterials
        ? MATERIALS_STEP
        : 'checkpoint'
  const current =
    step === 'checkpoint'
      ? (lesson.checkpoints.find((c) => c.id === requested) ??
        firstPending ??
        lesson.checkpoints[0])
      : undefined
  const currentIndex = current ? lesson.checkpoints.indexOf(current) : -1
  const next = lesson.checkpoints[currentIndex + 1]
  const previous = lesson.checkpoints[currentIndex - 1]
  const track = catalog.trackById.get(lesson.track)
  const module = catalog.moduleByLesson.get(lesson.id)
  const course = module ? catalog.courseById.get(module.course) : undefined
  const total = lesson.checkpoints.length
  const isCompleted = state?.status === 'completed'
  const first = lesson.checkpoints[0]

  const goTo = (target: string) => {
    setParams({ parte: target })
    window.scrollTo({ top: 0 })
  }
  const afterLast = () => (hasMaterials ? goTo(MATERIALS_STEP) : undefined)

  return (
    <>
      <PageHeader
        title={lesson.title}
        crumbs={
          module && course
            ? [
                { label: 'Aprender', to: paths.learn },
                { label: course.title, to: paths.course(course.id) },
                { label: module.title, to: paths.module(module.id) },
              ]
            : [
                { label: 'Início', to: paths.home },
                { label: track?.name ?? lesson.track, to: paths.track(lesson.track) },
              ]
        }
        subtitle={lesson.summary}
        meta={
          <p className={styles.metaLine}>
            <span className={styles.metaStatus} data-state={state?.status ?? 'not-started'}>
              {LESSON_STATUS[state?.status ?? 'not-started']} · {done.size}/{total}
            </span>
            <span>
              Nível {lesson.level} · {levelName(lesson.level)}
            </span>
            {lesson.estimatedMinutes && (
              <span>cerca de {formatMinutes(lesson.estimatedMinutes)}</span>
            )}
            {lesson.styles.map((id) => (
              <span key={id} className={styles.metaStyle}>
                {catalog.styleById.get(id)?.name ?? id}
              </span>
            ))}
          </p>
        }
      />

      <div className={styles.layout}>
        <nav className={styles.parts} aria-label="Etapas da aula">
          <span className={styles.partsHead}>
            <span>Etapas</span>
            <span className="num faint">
              {done.size} de {total}
            </span>
          </span>
          <Measures
            done={lesson.checkpoints.map((c) => done.has(c.id))}
            total={total}
            {...(currentIndex >= 0 ? { current: currentIndex } : {})}
            label="Progresso na aula"
          />
          <ol>
            <li>
              <button
                type="button"
                className={styles.part}
                aria-current={step === INTRO_STEP ? 'step' : undefined}
                onClick={() => goTo(INTRO_STEP)}
              >
                <span className={styles.partMark} data-kind="extra" aria-hidden="true" />
                <span className={styles.partTitle}>Introdução</span>
              </button>
            </li>
            {lesson.checkpoints.map((checkpoint, index) => (
              <li key={checkpoint.id}>
                <button
                  type="button"
                  className={styles.part}
                  aria-current={checkpoint === current ? 'step' : undefined}
                  onClick={() => goTo(checkpoint.id)}
                >
                  <span className={styles.partMark} data-done={done.has(checkpoint.id)}>
                    {done.has(checkpoint.id) ? <Icon name="check" size={12} /> : index + 1}
                  </span>
                  <span className={styles.partTitle}>
                    {checkpoint.stage && (
                      <span className={styles.partStage}>{STAGE_LABEL[checkpoint.stage]}</span>
                    )}
                    {checkpoint.title}
                  </span>
                </button>
              </li>
            ))}
            {hasMaterials && (
              <li>
                <button
                  type="button"
                  className={styles.part}
                  aria-current={step === MATERIALS_STEP ? 'step' : undefined}
                  onClick={() => goTo(MATERIALS_STEP)}
                >
                  <span className={styles.partMark} data-kind="extra" aria-hidden="true" />
                  <span className={styles.partTitle}>Aprofundamento</span>
                </button>
              </li>
            )}
          </ol>
        </nav>

        <div className={styles.reading}>
          {step === INTRO_STEP && (
            <article aria-labelledby="parte-atual" className="page-enter">
              <h2 id="parte-atual" className={styles.partHeading}>
                <span className={styles.partNumber}>Antes de começar</span>
                <span className={styles.partName}>Introdução</span>
              </h2>
              {lesson.why && <p className={styles.why}>{lesson.why}</p>}
              {lesson.intro.children.length > 0 && (
                <div className={styles.intro}>
                  <Markdown root={lesson.intro} />
                </div>
              )}
              <section className={styles.before} aria-label="Antes de começar">
                <div>
                  <h3 className={styles.beforeTitle}>O que você vai aprender</h3>
                  <ul>
                    {lesson.competencies.map((id) => (
                      <li key={id}>
                        <Link to={paths.competency(id)}>
                          {catalog.competencyById.get(id)?.title ?? id}
                        </Link>
                        <span className="muted xsmall">
                          {' '}
                          — {catalog.competencyById.get(id)?.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {lesson.prerequisites.length > 0 && (
                  <div>
                    <h3 className={styles.beforeTitle}>Pré-requisitos recomendados</h3>
                    <ul className={styles.prereqs}>
                      {lesson.prerequisites.map((id) => {
                        const ps = snapshot.competencies.get(id)
                        return (
                          <li key={id}>
                            <Link to={paths.competency(id)}>
                              {catalog.competencyById.get(id)?.title ?? id}
                            </Link>
                            {ps && <StatusBadge status={ps.status} />}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </section>
              <section aria-labelledby="roteiro" className={styles.roadmap}>
                <h3 id="roteiro" className={styles.beforeTitle}>
                  Roteiro da aula
                </h3>
                <ol>
                  {lesson.checkpoints.map((c) => (
                    <li key={c.id}>
                      {c.stage && <span className={styles.partStage}>{STAGE_LABEL[c.stage]}</span>}
                      {c.title}
                    </li>
                  ))}
                  {hasMaterials && <li>Aprofundamento: vídeos, textos e músicas</li>}
                </ol>
              </section>
              {first && (
                <div className={styles.footer}>
                  <button
                    type="button"
                    className="button primary lg"
                    onClick={() => goTo((firstPending ?? first).id)}
                  >
                    {done.size === 0 ? 'Começar a aula' : 'Continuar a aula'} →
                  </button>
                </div>
              )}
            </article>
          )}

          {current && (
            <article aria-labelledby="parte-atual" key={current.id} className="page-enter">
              <h2 id="parte-atual" className={styles.partHeading}>
                <span className={styles.partNumber}>
                  Parte {currentIndex + 1} de {total}
                  {current.stage && ` · ${STAGE_LABEL[current.stage]}`}
                  <span className="visually-hidden"> · </span>
                </span>
                <span className={styles.partName}>{current.title}</span>
              </h2>
              <Markdown root={current.body} embeds={embedsFor(lesson, current.id)} />

              <div className={styles.footer}>
                {done.has(current.id) ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => void setCheckpointCompleted(lesson.id, current.id, false)}
                  >
                    <Icon name="check" size={16} /> Parte concluída (desfazer)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button primary lg"
                    onClick={() => {
                      void setCheckpointCompleted(lesson.id, current.id, true)
                      if (next) goTo(next.id)
                      else afterLast()
                    }}
                  >
                    {next ? 'Concluí esta parte · próxima →' : 'Concluí esta parte'}
                  </button>
                )}
                <span className={styles.nav}>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => goTo(previous ? previous.id : INTRO_STEP)}
                  >
                    ← Anterior
                  </button>
                  {next ? (
                    <button type="button" className="button ghost" onClick={() => goTo(next.id)}>
                      Próxima →
                    </button>
                  ) : (
                    hasMaterials && (
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => goTo(MATERIALS_STEP)}
                      >
                        Aprofundamento →
                      </button>
                    )
                  )}
                </span>
              </div>
            </article>
          )}

          {step === MATERIALS_STEP && (
            <article aria-labelledby="parte-atual" className="page-enter">
              <h2 id="parte-atual" className={styles.partHeading}>
                <span className={styles.partNumber}>Para ir além</span>
                <span className={styles.partName}>Aprofundamento</span>
              </h2>
              <p className={styles.why}>
                Materiais externos selecionados para este assunto. Abrem em outra aba.
              </p>
              <Materials lesson={lesson} />
            </article>
          )}

          {isCompleted && (step === MATERIALS_STEP || !hasMaterials || !next) && (
            <section className={`panel ${styles.completed}`} aria-labelledby="concluida">
              <span className="eyebrow accent">Fim da aula</span>
              <h2 id="concluida" className={styles.completedTitle}>
                Aula concluída
              </h2>
              <p className="muted small" style={{ marginTop: 0 }}>
                Concluir a aula não marca as competências como dominadas: para isso, cumpra os
                critérios abaixo.
              </p>
              <ul className={styles.criteria}>
                {lesson.competencies.map((id) => {
                  const competency = catalog.competencyById.get(id)
                  const cs = snapshot.competencies.get(id)
                  if (!competency) return null
                  return (
                    <li key={id}>
                      <div className="row">
                        <Link to={paths.competency(id)} className={styles.criteriaTitle}>
                          {competency.title}
                        </Link>
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

          {(step === MATERIALS_STEP || (isCompleted && !next && step !== INTRO_STEP)) && (
            <NextStep lesson={lesson} />
          )}
        </div>
      </div>
    </>
  )
}
