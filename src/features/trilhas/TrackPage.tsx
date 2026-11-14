import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { Badge, ProgressBar, StatusBadge } from '@/ui/Badges'
import { LESSON_STATUS, levelName, plural, trackLevelLabel } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'

export function TrackPage() {
  const { trackId = '' } = useParams()
  const progress = useProgress()
  const track = catalog.trackById.get(trackId)
  if (!track) return <NotFoundPage />
  if (!progress) return <Loading />

  const { snapshot } = progress
  const state = snapshot.tracks.get(track.id)
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
        aside={<Badge tone="accent">{trackLevelLabel(state?.level ?? 0)}</Badge>}
      />

      {state?.next && state.next.total > 0 && (
        <div className="card stack">
          <span>
            Rumo ao nível {state.next.level} · {levelName(state.next.level)}:{' '}
            <strong>
              {state.next.satisfied} de {state.next.total}
            </strong>{' '}
            competências essenciais
          </span>
          <ProgressBar
            value={state.next.satisfied / state.next.total}
            label={`Progresso no nível ${state.next.level}`}
          />
        </div>
      )}

      {competencies.length === 0 && <p className="muted">Esta trilha ainda não tem conteúdo.</p>}

      {levels.map((level) => (
        <section key={level} className="section" aria-labelledby={`nivel-${level}`}>
          <h2 id={`nivel-${level}`}>
            Nível {level} · {levelName(level)}
          </h2>
          <ul className="list">
            {competencies
              .filter((c) => c.level === level)
              .map((competency) => {
                const cs = snapshot.competencies.get(competency.id)
                const missing = (cs?.missingPrerequisites ?? [])
                  .map((id) => catalog.competencyById.get(id)?.title ?? id)
                  .join(', ')
                return (
                  <li key={competency.id} className="stack">
                    <div className="row">
                      <Link to={paths.competency(competency.id)} className="plain">
                        <strong>{competency.title}</strong>
                      </Link>
                      <span className="row">
                        {cs?.ready && <Badge tone="accent">Pronta para estudar</Badge>}
                        {!competency.core && <Badge>Não conta para o nível</Badge>}
                        {cs && <StatusBadge status={cs.status} />}
                      </span>
                    </div>
                    <span className="muted small">{competency.description}</span>
                    {!cs?.satisfied && missing && (
                      <span className="muted small">Antes, recomendado: {missing}</span>
                    )}
                  </li>
                )
              })}
          </ul>
        </section>
      ))}

      {lessons.length > 0 && (
        <section className="section" aria-labelledby="aulas">
          <h2 id="aulas">Aulas</h2>
          <ul className="list">
            {lessons.map((lesson) => {
              const ls = snapshot.lessons.get(lesson.id)
              return (
                <li key={lesson.id} className="stack">
                  <div className="row">
                    <Link to={paths.lesson(lesson.id)} className="plain">
                      <strong>{lesson.title}</strong>
                    </Link>
                    <span className="row">
                      <Badge>Nível {lesson.level}</Badge>
                      {ls && (
                        <Badge tone={ls.status === 'completed' ? 'success' : 'neutral'}>
                          {LESSON_STATUS[ls.status]}
                          {ls.status === 'in-progress' &&
                            ` · ${ls.completedCheckpoints.length}/${ls.totalCheckpoints}`}
                        </Badge>
                      )}
                    </span>
                  </div>
                  <span className="muted small">
                    {lesson.summary}
                    {lesson.estimatedMinutes &&
                      ` · cerca de ${plural(lesson.estimatedMinutes, 'minuto', 'minutos')}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
