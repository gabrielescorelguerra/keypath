import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import type { Module } from '@/domain/catalog'
import { Badge, LevelMeter, StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { emptyLevels, levelName, STUDY_STATUS } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './TrackPage.module.css'

/** Módulos (de qualquer curso) cujas aulas trabalham competências desta área. */
function modulesOfTrack(trackId: string): readonly Module[] {
  return catalog.modules.filter((module) =>
    module.lessons.some((lessonId) => {
      const lesson = catalog.lessonById.get(lessonId)
      return (
        lesson?.track === trackId ||
        lesson?.competencies.some((id) => catalog.competencyById.get(id)?.track === trackId)
      )
    }),
  )
}

/** Módulos que ensinam uma competência. */
function modulesOfCompetency(competencyId: string): readonly Module[] {
  return catalog.modules.filter((module) =>
    module.lessons.some((lessonId) =>
      catalog.lessonById.get(lessonId)?.competencies.includes(competencyId),
    ),
  )
}

export function TrackPage() {
  const { trackId = '' } = useParams()
  const progress = useProgress()
  const track = catalog.trackById.get(trackId)
  if (!track) return <NotFoundPage />
  if (!progress) return <Loading />

  const { snapshot, studyMap } = progress
  const state = snapshot.tracks.get(track.id)
  const level = state?.level ?? 0
  const next = state?.next
  const fraction = next && next.total > 0 ? next.satisfied / next.total : 0
  const competencies = catalog.competenciesByTrack.get(track.id) ?? []
  const empty = emptyLevels(track.id)
  const levels = [...new Set(competencies.map((c) => c.level))].sort()
  const modules = modulesOfTrack(track.id)
  // A próxima aula desta área: a do primeiro módulo em andamento, senão a do primeiro novo.
  const current =
    modules.find((m) => studyMap.modules.get(m.id)?.status === 'in-progress') ??
    modules.find((m) => {
      const status = studyMap.modules.get(m.id)?.status
      return status === 'new' || status === 'review'
    }) ??
    modules.find((m) => studyMap.modules.get(m.id)?.status === 'advanced')
  const nextLessonId = current ? studyMap.modules.get(current.id)?.nextLesson : undefined
  const nextLesson = nextLessonId ? catalog.lessonById.get(nextLessonId) : undefined

  return (
    <>
      <PageHeader
        title={track.name}
        crumbs={[
          { label: 'Início', to: paths.home },
          { label: 'Seu nível por área', to: paths.home },
        ]}
        subtitle={track.description}
        aside={
          <div className={styles.levelBox}>
            <span className="eyebrow">Seu nível</span>
            <span className={styles.levelValue}>
              <span className={styles.levelNumber}>{level}</span>
              <span className={styles.levelOf}>/ 5</span>
            </span>
            <span className={styles.levelName}>{level === 0 ? 'Sem nível' : levelName(level)}</span>
          </div>
        }
        meta={
          <div className={styles.meterRow}>
            <LevelMeter
              level={level}
              next={fraction}
              size="lg"
              label={`Nível ${level} de 5`}
              empty={empty}
            />
            {next && next.total > 0 && (
              <span className="muted small">
                Rumo ao nível {next.level} · {levelName(next.level)}:{' '}
                <strong className="num">
                  {next.satisfied} de {next.total}
                </strong>{' '}
                competências essenciais
              </span>
            )}
            {next && next.total === 0 && level > 0 && (
              <span className="muted small">
                Você concluiu todo o conteúdo atual desta área. O nível {next.level} ainda não tem
                competências cadastradas (teclas tracejadas).
              </span>
            )}
          </div>
        }
      />

      <div className={styles.explain} role="note">
        <Icon name="book" size={18} />
        <p>
          <strong>Esta página não é uma aula.</strong> Ela mostra seu nível em {track.name} e o que
          falta para subir. Para estudar, abra um dos módulos abaixo — as aulas ficam neles — ou vá
          direto para a próxima aula.
        </p>
        {nextLesson && (
          <Link to={paths.lesson(nextLesson.id)} className={`button primary ${styles.nextButton}`}>
            Próxima aula: {nextLesson.title}
            <Icon name="arrow" size={16} />
          </Link>
        )}
      </div>

      {competencies.length === 0 && <p className="muted">Esta área ainda não tem conteúdo.</p>}

      {modules.length > 0 && (
        <section className="section" aria-labelledby="onde-estudar">
          <h2 id="onde-estudar">Onde estudar</h2>
          <p className="muted small">
            Os módulos que ensinam {track.name.toLowerCase()}, na ordem dos cursos. Cada módulo tem
            aulas curtas, divididas em partes, com prática no teclado.
          </p>
          <ol className={styles.modules}>
            {modules.map((module) => {
              const ms = studyMap.modules.get(module.id)
              const status = ms?.status ?? 'new'
              const course = catalog.courseById.get(module.course)
              return (
                <li key={module.id}>
                  <Link to={paths.module(module.id)} className={`plain ${styles.moduleCard}`}>
                    <span className={styles.moduleCourse}>
                      {course?.title} · nível {module.level}
                    </span>
                    <strong className={styles.moduleTitle}>{module.title}</strong>
                    <span className={styles.moduleFacts}>
                      <span className="status" data-tone={STUDY_STATUS[status].tone}>
                        {STUDY_STATUS[status].label}
                      </span>
                      <span className="num">
                        {ms?.lessonsCompleted ?? 0} de {module.lessons.length}{' '}
                        {module.lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {levels.length > 0 && (
        <section className="section" aria-labelledby="o-que-conta">
          <h2 id="o-que-conta">O que conta para o nível</h2>
          <p className="muted small">
            Cada nível exige as competências marcadas como essenciais. Uma competência fica dominada
            quando você cumpre os exercícios dela — ou quando declara que já sabe.
          </p>
          <div className={styles.levels}>
            {levels.map((lvl) => {
              const atLevel = competencies.filter((c) => c.level === lvl)
              const satisfied = atLevel.filter(
                (c) => snapshot.competencies.get(c.id)?.satisfied,
              ).length
              const reached = lvl <= level
              return (
                <section
                  key={lvl}
                  className={`ladder ${styles.level}`}
                  aria-labelledby={`nivel-${lvl}`}
                  data-reached={reached}
                >
                  <div className="ladder-label">
                    <h3
                      id={`nivel-${lvl}`}
                      className={styles.levelLabel}
                      aria-label={`Nível ${lvl} · ${levelName(lvl)}`}
                    >
                      <span className={styles.levelIndex}>{lvl}</span>
                      <span className={styles.levelTitle}>{levelName(lvl)}</span>
                    </h3>
                    <span className="xsmall faint num">
                      {satisfied}/{atLevel.length} {reached && '· alcançado'}
                    </span>
                  </div>
                  <ul className={`list ${styles.competencies}`}>
                    {atLevel.map((competency) => {
                      const cs = snapshot.competencies.get(competency.id)
                      const missing = (cs?.missingPrerequisites ?? [])
                        .map((id) => catalog.competencyById.get(id)?.title ?? id)
                        .join(', ')
                      const where = modulesOfCompetency(competency.id)
                      return (
                        <li key={competency.id} className={`link-row ${styles.competency}`}>
                          <div className={styles.competencyMain}>
                            <Link
                              to={paths.competency(competency.id)}
                              className={`plain ${styles.competencyTitle}`}
                            >
                              {competency.title}
                            </Link>
                            <span className="muted small">{competency.description}</span>
                            {where.length > 0 && (
                              <span className={styles.where}>
                                Estude em:{' '}
                                {where.map((m, i) => (
                                  <span key={m.id}>
                                    {i > 0 && ', '}
                                    <Link to={paths.module(m.id)}>{m.title}</Link>
                                  </span>
                                ))}
                              </span>
                            )}
                            {!cs?.satisfied && missing && (
                              <span className={styles.missing}>Antes, recomendado: {missing}</span>
                            )}
                          </div>
                          <div className={styles.competencySide}>
                            {cs && <StatusBadge status={cs.status} />}
                            {!competency.core && <Badge>Não conta para o nível</Badge>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
