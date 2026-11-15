import { Link, useSearchParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { DEFAULT_SETTINGS, updateSettings, useSettings } from '@/data'
import type { Course } from '@/domain/catalog'
import { learningOverview, pathToGoal, type StudyMap } from '@/domain/progress'
import { Icon } from '@/ui/Icon'
import { formatMinutes, STUDY_STATUS } from '@/ui/labels'
import { KeyRule, Measures } from '@/ui/Notation'
import { Loading } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { useDocumentTitle } from '@/ui/useDocumentTitle'
import styles from './Learn.module.css'

function StatusText({ status }: { readonly status: keyof typeof STUDY_STATUS }) {
  const { label, tone } = STUDY_STATUS[status]
  return (
    <span className="status" data-tone={tone}>
      {label}
    </span>
  )
}

/** O mapa de um curso: módulos em sequência, ligados por uma linha, cada um com seu estado. */
function CourseMap({ course, map }: { readonly course: Course; readonly map: StudyMap }) {
  return (
    <ol className={styles.path} aria-label={`Módulos de ${course.title}`}>
      {course.modules.map((module, index) => {
        const state = map.modules.get(module.id)
        const status = state?.status ?? 'new'
        const missing = (state?.missingModules ?? [])
          .map((id) => catalog.moduleById.get(id)?.title ?? id)
          .join(', ')
        return (
          <li key={module.id} className={styles.step} data-status={status}>
            <span className={styles.node} aria-hidden="true" />
            <span className={styles.stepNumber} aria-hidden="true">
              {index + 1}
            </span>
            <div className={styles.stepMain}>
              <Link to={paths.module(module.id)} className={`plain ${styles.stepTitle}`}>
                {module.title}
              </Link>
              <p className={styles.stepSummary}>{module.summary}</p>
              {status === 'advanced' && missing && (
                <p className={styles.stepNote}>Recomendado antes: {missing}</p>
              )}
            </div>
            <div className={styles.stepSide}>
              <StatusText status={status} />
              <span className={styles.stepFacts}>
                <span>Nível {module.level}</span>
                <span>
                  {module.lessons.length > 0
                    ? `${state?.lessonsCompleted ?? 0} de ${module.lessons.length} ${module.lessons.length === 1 ? 'aula' : 'aulas'}`
                    : `${module.upcoming.length} ${module.upcoming.length === 1 ? 'tópico' : 'tópicos'}`}
                  {module.estimatedMinutes ? ` · ${formatMinutes(module.estimatedMinutes)}` : ''}
                </span>
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Goals({ map }: { readonly map: StudyMap }) {
  const settings = useSettings() ?? DEFAULT_SETTINGS
  const goals = settings.goals.filter((id) => catalog.moduleById.has(id))
  const options = catalog.modules.filter((m) => !goals.includes(m.id))

  return (
    <section className={styles.goals} aria-labelledby="objetivos">
      <h2 id="objetivos" className={styles.columnTitle}>
        Objetivos de estudo
      </h2>
      {goals.length === 0 && (
        <p className={styles.quiet}>
          Escolha um módulo que você quer alcançar. O KeyPath mostra o caminho até ele.
        </p>
      )}
      <ul className={styles.goalList}>
        {goals.map((goalId) => {
          const goal = catalog.moduleById.get(goalId)
          const path = pathToGoal(catalog, map, goalId)
          return (
            <li key={goalId}>
              <div className={styles.goalHead}>
                <Link to={paths.module(goalId)} className={`plain ${styles.goalTitle}`}>
                  {goal?.title}
                </Link>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remover o objetivo ${goal?.title}`}
                  onClick={() => void updateSettings({ goals: goals.filter((g) => g !== goalId) })}
                >
                  Remover
                </button>
              </div>
              {path.length === 0 ? (
                <p className={styles.quiet}>Objetivo alcançado.</p>
              ) : (
                <ol className={styles.chain} aria-label="Caminho até o objetivo">
                  {path.map((id) => (
                    <li key={id} data-status={map.modules.get(id)?.status}>
                      <Link to={paths.module(id)}>{catalog.moduleById.get(id)?.title}</Link>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          )
        })}
      </ul>
      {options.length > 0 && (
        <label className={styles.addGoal}>
          <span className="visually-hidden">Adicionar objetivo</span>
          <select
            className="select"
            value=""
            onChange={(event) => {
              if (event.target.value) void updateSettings({ goals: [...goals, event.target.value] })
            }}
          >
            <option value="">Adicionar objetivo…</option>
            {catalog.courses.map((course) => (
              <optgroup key={course.id} label={course.title}>
                {course.modules
                  .filter((m) => !goals.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
    </section>
  )
}

export function LearnPage() {
  useDocumentTitle('Aprender')
  const progress = useProgress()
  const [params, setParams] = useSearchParams()
  if (!progress) return <Loading />

  const { studyMap: map, snapshot } = progress
  const overview = learningOverview(map)
  const currentModule = overview.currentModule
    ? catalog.moduleById.get(overview.currentModule)
    : undefined
  const currentCourse = currentModule ? catalog.courseById.get(currentModule.course) : undefined
  const nextLesson = overview.nextLesson ? catalog.lessonById.get(overview.nextLesson) : undefined
  const nextState = nextLesson ? snapshot.lessons.get(nextLesson.id) : undefined
  const moduleState = currentModule ? map.modules.get(currentModule.id) : undefined
  const selectedCourse =
    catalog.courseById.get(params.get('curso') ?? '') ?? currentCourse ?? catalog.courses[0]
  const toReview = [...map.lessons].filter(([, s]) => s === 'review').map(([id]) => id)

  return (
    <div className={styles.page}>
      <h1 className="visually-hidden">Aprender</h1>

      {currentModule && currentCourse && (
        <section className={styles.masthead} aria-labelledby="onde-estou">
          <div className={styles.headline}>
            <p className={styles.kicker}>
              Você está em <Link to={paths.course(currentCourse.id)}>{currentCourse.title}</Link>
            </p>
            <h2 id="onde-estou" className={styles.heroTitle}>
              <Link to={paths.module(currentModule.id)} className="plain">
                {currentModule.title}
              </Link>
            </h2>
            <p className={styles.lead}>{currentModule.summary}</p>
          </div>
          {nextLesson && (
            <div className={styles.cue}>
              <span className={styles.cueLabel}>
                {nextState?.status === 'in-progress' ? 'Continuar a aula' : 'Próxima aula'}
              </span>
              <span className={styles.cueTitle}>{nextLesson.title}</span>
              {moduleState && moduleState.lessonsTotal > 1 && (
                <Measures
                  done={currentModule.lessons.map(
                    (id) => snapshot.lessons.get(id)?.status === 'completed',
                  )}
                  total={moduleState.lessonsTotal}
                  current={currentModule.lessons.indexOf(nextLesson.id)}
                  label="Aulas concluídas no módulo"
                />
              )}
              <Link to={paths.lesson(nextLesson.id)} className="button primary lg">
                {nextState?.status === 'in-progress' ? 'Continuar' : 'Começar'}
                <Icon name="arrow" size={18} />
              </Link>
              {nextLesson.estimatedMinutes && (
                <span className={styles.quiet}>
                  cerca de {formatMinutes(nextLesson.estimatedMinutes)}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      <KeyRule />

      <div className={styles.columns}>
        <section className={styles.journey} aria-labelledby="percurso">
          <h2 id="percurso" className={styles.columnTitle}>
            Seu percurso
          </h2>
          <p className={styles.bigNumber}>
            <span className="num">{overview.lessonsCompleted}</span>
            <span className={styles.bigOf}>de {overview.lessonsTotal} aulas</span>
          </p>
          <p className={styles.quiet}>
            {overview.modulesCompleted} de {overview.modulesAvailable} módulos concluídos.
          </p>
        </section>

        <Goals map={map} />

        <section className={styles.review} aria-labelledby="revisar">
          <h2 id="revisar" className={styles.columnTitle}>
            Para revisar
          </h2>
          {toReview.length === 0 ? (
            <p className={styles.quiet}>
              Nada por enquanto. Aulas concluídas há mais de 30 dias aparecem aqui.
            </p>
          ) : (
            <ul className={styles.reviewList}>
              {toReview.map((id) => (
                <li key={id}>
                  <Link to={paths.lesson(id)}>{catalog.lessonById.get(id)?.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selectedCourse && (
        <section className={styles.map} aria-labelledby="mapa">
          <div className={styles.mapHead}>
            <h2 id="mapa" className={styles.mapTitle}>
              Mapa de estudo
            </h2>
            <div className={styles.tabs} role="tablist" aria-label="Cursos">
              {catalog.courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  role="tab"
                  id={`tab-${course.id}`}
                  aria-selected={course === selectedCourse}
                  aria-controls="curso-atual"
                  className={styles.tab}
                  onClick={() => setParams({ curso: course.id }, { replace: true })}
                >
                  {course.title}
                </button>
              ))}
            </div>
          </div>
          <div id="curso-atual" role="tabpanel" aria-labelledby={`tab-${selectedCourse.id}`}>
            <p className={styles.courseSummary}>{selectedCourse.summary}</p>
            <p className={styles.howTo}>
              <strong>Como funciona:</strong> cada curso tem <em>módulos</em>; cada módulo tem{' '}
              <em>aulas</em> em ordem; cada aula é dividida em partes curtas e termina com{' '}
              <em>prática</em> no teclado. Clique num módulo para ver as aulas dele.
            </p>
            <CourseMap course={selectedCourse} map={map} />
          </div>
        </section>
      )}
    </div>
  )
}
