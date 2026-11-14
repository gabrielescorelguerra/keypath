import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { DEFAULT_SETTINGS, updateSettings, useSettings } from '@/data'
import { StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { formatMinutes, levelName, STUDY_STATUS } from '@/ui/labels'
import { Measures } from '@/ui/Notation'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './Module.module.css'

export function ModulePage() {
  const { moduleId = '' } = useParams()
  const progress = useProgress()
  const settings = useSettings() ?? DEFAULT_SETTINGS
  const module = catalog.moduleById.get(moduleId)
  if (!module) return <NotFoundPage />
  if (!progress) return <Loading />

  const { studyMap: map, snapshot } = progress
  const state = map.modules.get(module.id)
  const status = state?.status ?? 'new'
  const course = catalog.courseById.get(module.course)
  const dependents = catalog.modules.filter((m) => m.prerequisites.includes(module.id))
  const nextLesson = state?.nextLesson ? catalog.lessonById.get(state.nextLesson) : undefined
  const isGoal = settings.goals.includes(module.id)
  const style = module.style ? catalog.styleById.get(module.style) : undefined

  return (
    <>
      <PageHeader
        title={module.title}
        crumbs={[
          { label: 'Aprender', to: paths.learn },
          { label: course?.title ?? module.course, to: paths.course(module.course) },
        ]}
        subtitle={module.summary}
        meta={
          <p className={styles.meta}>
            <span className="status" data-tone={STUDY_STATUS[status].tone}>
              {STUDY_STATUS[status].label}
            </span>
            <span>
              Nível {module.level} · {levelName(module.level)}
            </span>
            {module.lessons.length > 0 && (
              <span>
                {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
              </span>
            )}
            {module.estimatedMinutes && (
              <span>cerca de {formatMinutes(module.estimatedMinutes)}</span>
            )}
            {style && <span>{style.name}</span>}
          </p>
        }
        aside={
          nextLesson && (
            <div className={styles.cue}>
              <span className={styles.cueLabel}>
                {snapshot.lessons.get(nextLesson.id)?.status === 'in-progress'
                  ? 'Aula em andamento'
                  : 'Comece por'}
              </span>
              <span className={styles.cueTitle}>{nextLesson.title}</span>
              <Link to={paths.lesson(nextLesson.id)} className="button primary">
                {snapshot.lessons.get(nextLesson.id)?.status === 'in-progress'
                  ? 'Continuar'
                  : 'Começar'}
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          )
        }
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <section aria-labelledby="aulas-do-modulo">
            <h2 id="aulas-do-modulo" className="section-title">
              Aulas, em ordem
            </h2>
            {module.lessons.length === 0 && (
              <p className="muted">
                Este módulo ainda não tem aulas publicadas. Os tópicos planejados estão abaixo.
              </p>
            )}
            <ol className={styles.lessons}>
              {module.lessons.map((lessonId, index) => {
                const lesson = catalog.lessonById.get(lessonId)
                const ls = snapshot.lessons.get(lessonId)
                const lessonStatus = map.lessons.get(lessonId) ?? 'new'
                if (!lesson) return null
                const done = new Set(ls?.completedCheckpoints ?? [])
                return (
                  <li
                    key={lessonId}
                    className={styles.lesson}
                    data-next={lessonId === state?.nextLesson}
                  >
                    <span className={styles.number} aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className={styles.lessonMain}>
                      <Link to={paths.lesson(lessonId)} className={`plain ${styles.lessonTitle}`}>
                        {lesson.title}
                      </Link>
                      <p className={styles.lessonSummary}>{lesson.summary}</p>
                      <Measures
                        done={lesson.checkpoints.map((c) => done.has(c.id))}
                        total={lesson.checkpoints.length}
                        label={`Partes concluídas em ${lesson.title}`}
                      />
                    </div>
                    <div className={styles.lessonSide}>
                      <span className="status" data-tone={STUDY_STATUS[lessonStatus].tone}>
                        {STUDY_STATUS[lessonStatus].label}
                      </span>
                      <span className="faint small num">
                        {done.size}/{lesson.checkpoints.length} partes
                        {lesson.estimatedMinutes
                          ? ` · ${formatMinutes(lesson.estimatedMinutes)}`
                          : ''}
                      </span>
                    </div>
                  </li>
                )
              })}
              {module.upcoming.map((topic) => (
                <li key={topic} className={styles.lesson} data-upcoming="true">
                  <span className={styles.number} aria-hidden="true">
                    ·
                  </span>
                  <div className={styles.lessonMain}>
                    <span className={styles.lessonTitle}>{topic}</span>
                  </div>
                  <div className={styles.lessonSide}>
                    <span className="status" data-tone="muted">
                      Em preparação
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className={styles.aside}>
          <section aria-labelledby="antes">
            <h2 id="antes" className={styles.asideTitle}>
              Antes deste módulo
            </h2>
            {module.prerequisites.length === 0 ? (
              <p className={styles.quiet}>Nenhum pré-requisito: pode começar por aqui.</p>
            ) : (
              <ul className={styles.links}>
                {module.prerequisites.map((id) => {
                  const ms = map.modules.get(id)
                  return (
                    <li key={id}>
                      <Link to={paths.module(id)}>{catalog.moduleById.get(id)?.title ?? id}</Link>
                      {ms && (
                        <span className="status" data-tone={STUDY_STATUS[ms.status].tone}>
                          {STUDY_STATUS[ms.status].label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {dependents.length > 0 && (
            <section aria-labelledby="depois">
              <h2 id="depois" className={styles.asideTitle}>
                Depois, você pode estudar
              </h2>
              <ul className={styles.links}>
                {dependents.map((m) => (
                  <li key={m.id}>
                    <Link to={paths.module(m.id)}>{m.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(state?.competencies.length ?? 0) > 0 && (
            <section aria-labelledby="competencias-do-modulo">
              <h2 id="competencias-do-modulo" className={styles.asideTitle}>
                O que você vai dominar
              </h2>
              <ul className={styles.links}>
                {state?.competencies.map((id) => {
                  const cs = snapshot.competencies.get(id)
                  return (
                    <li key={id}>
                      <Link to={paths.competency(id)}>
                        {catalog.competencyById.get(id)?.title ?? id}
                      </Link>
                      {cs && <StatusBadge status={cs.status} />}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <button
            type="button"
            className={`button ghost sm ${styles.goal}`}
            aria-pressed={isGoal}
            onClick={() =>
              void updateSettings({
                goals: isGoal
                  ? settings.goals.filter((g) => g !== module.id)
                  : [...settings.goals, module.id],
              })
            }
          >
            {isGoal ? 'É um objetivo seu · remover' : 'Definir como objetivo'}
          </button>
        </aside>
      </div>
    </>
  )
}
