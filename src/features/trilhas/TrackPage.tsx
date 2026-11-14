import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { Badge, LevelMeter, StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { LESSON_STATUS, levelName } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './TrackPage.module.css'

export function TrackPage() {
  const { trackId = '' } = useParams()
  const progress = useProgress()
  const track = catalog.trackById.get(trackId)
  if (!track) return <NotFoundPage />
  if (!progress) return <Loading />

  const { snapshot } = progress
  const state = snapshot.tracks.get(track.id)
  const level = state?.level ?? 0
  const next = state?.next
  const fraction = next && next.total > 0 ? next.satisfied / next.total : 0
  const competencies = catalog.competenciesByTrack.get(track.id) ?? []
  const levels = [...new Set(competencies.map((c) => c.level))].sort()
  const lessons = catalog.lessons.filter(
    (l) =>
      l.track === track.id ||
      l.competencies.some((id) => catalog.competencyById.get(id)?.track === track.id),
  )

  return (
    <>
      <PageHeader
        title={track.name}
        crumbs={[{ label: 'Início', to: paths.home }]}
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
            <LevelMeter level={level} next={fraction} size="lg" label={`Nível ${level} de 5`} />
            {next && next.total > 0 && (
              <span className="muted small">
                Rumo ao nível {next.level} · {levelName(next.level)}:{' '}
                <strong className="num">
                  {next.satisfied} de {next.total}
                </strong>{' '}
                competências essenciais
              </span>
            )}
          </div>
        }
      />

      {competencies.length === 0 && <p className="muted">Esta trilha ainda não tem conteúdo.</p>}

      <div className={styles.levels}>
        {levels.map((lvl) => {
          const atLevel = competencies.filter((c) => c.level === lvl)
          const satisfied = atLevel.filter((c) => snapshot.competencies.get(c.id)?.satisfied).length
          const reached = lvl <= level
          return (
            <section
              key={lvl}
              className={`ladder ${styles.level}`}
              aria-labelledby={`nivel-${lvl}`}
              data-reached={reached}
            >
              <div className="ladder-label">
                <h2
                  id={`nivel-${lvl}`}
                  className={styles.levelLabel}
                  aria-label={`Nível ${lvl} · ${levelName(lvl)}`}
                >
                  <span className={styles.levelIndex}>{lvl}</span>
                  <span className={styles.levelTitle}>{levelName(lvl)}</span>
                </h2>
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
                        {!cs?.satisfied && missing && (
                          <span className={styles.missing}>Antes, recomendado: {missing}</span>
                        )}
                      </div>
                      <div className={styles.competencySide}>
                        {cs && <StatusBadge status={cs.status} />}
                        {cs?.ready && <Badge tone="accent">Pronta para estudar</Badge>}
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

      {lessons.length > 0 && (
        <section className="section" aria-labelledby="aulas">
          <h2 id="aulas">Aulas</h2>
          <div className={styles.tableWrap}>
            <table className="table">
              <thead>
                <tr>
                  <th>Aula</th>
                  <th className={styles.narrow}>Nível</th>
                  <th className={styles.narrow}>Partes</th>
                  <th className={styles.narrow}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const ls = snapshot.lessons.get(lesson.id)
                  return (
                    <tr key={lesson.id}>
                      <td>
                        <Link
                          to={paths.lesson(lesson.id)}
                          className={`plain ${styles.lessonTitle}`}
                        >
                          {lesson.title}
                        </Link>
                        <span className={`muted xsmall ${styles.lessonSummary}`}>
                          {lesson.summary}
                          {lesson.estimatedMinutes && ` · ~${lesson.estimatedMinutes} min`}
                        </span>
                      </td>
                      <td className="num">{lesson.level}</td>
                      <td className="num">
                        {ls?.completedCheckpoints.length ?? 0}/
                        {ls?.totalCheckpoints ?? lesson.checkpoints.length}
                      </td>
                      <td>
                        <span
                          className="status"
                          data-tone={
                            ls?.status === 'completed'
                              ? 'success'
                              : ls?.status === 'in-progress'
                                ? 'accent'
                                : 'neutral'
                          }
                        >
                          {LESSON_STATUS[ls?.status ?? 'not-started']}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="xsmall faint" style={{ marginTop: 'var(--space-3)' }}>
            <Icon name="book" size={14} style={{ verticalAlign: '-2px' }} /> Aulas estão em ordem
            pedagógica — siga de cima para baixo ou use as recomendações do início.
          </p>
        </section>
      )}
    </>
  )
}
