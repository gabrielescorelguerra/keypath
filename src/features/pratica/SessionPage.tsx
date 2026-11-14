import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { deleteSession, updateSession, useSession, useSongs } from '@/data'
import type { PracticeSession } from '@/domain/practice'
import { formatDateTime } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import { formatDuration } from './format.ts'
import styles from './Pratica.module.css'
import { practicePaths } from './paths.ts'

function Summary({ session }: { readonly session: PracticeSession }) {
  const progress = useProgress()
  const songs = useSongs()
  const navigate = useNavigate()
  const [notes, setNotes] = useState(session.notes)
  const attempts = progress?.facts.attempts.filter((a) => a.context.sessionId === session.id) ?? []
  const songById = new Map((songs ?? []).map((s) => [s.id, s]))
  const duration = session.endedAt
    ? Date.parse(session.endedAt) - Date.parse(session.startedAt)
    : null

  return (
    <>
      <PageHeader
        title={`Sessão de ${formatDateTime(session.startedAt)}`}
        crumbs={[{ label: 'Prática', to: practicePaths.home }]}
        subtitle={[
          duration === null ? 'Em andamento' : `Duração: ${formatDuration(duration)}`,
          session.focus && `Foco: ${session.focus}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <section className="section" aria-labelledby="exercicios-sessao">
        <h2 id="exercicios-sessao">Exercícios</h2>
        {attempts.length === 0 ? (
          <p className="muted">Nenhum exercício registrado nesta sessão.</p>
        ) : (
          <ul className="list">
            {attempts.map((attempt) => {
              const exercise = catalog.exerciseById.get(attempt.exerciseId)
              const result = attempt.result
              const summary =
                result.type === 'quiz'
                  ? `${Math.round(result.score * 100)}% de acertos`
                  : `${Object.values(result.checked).filter(Boolean).length} de ${
                      exercise?.type === 'performance' ? exercise.checklist.length : '?'
                    } itens${result.bpm ? ` · ${result.bpm} bpm` : ''}`
              return (
                <li key={attempt.id} className="row">
                  <Link to={paths.exercise(attempt.exerciseId)} className="plain">
                    {exercise?.title ?? attempt.exerciseId}
                  </Link>
                  <span className="muted small">{summary}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="musicas-sessao">
        <h2 id="musicas-sessao">Músicas</h2>
        {session.songs.length === 0 ? (
          <p className="muted">Nenhuma música registrada nesta sessão.</p>
        ) : (
          <ul className="list">
            {session.songs.map((entry) => (
              <li key={entry.songId} className="row">
                <Link to={practicePaths.song(entry.songId)} className="plain">
                  {songById.get(entry.songId)?.title ?? 'Música removida'}
                </Link>
                <span className="muted small">
                  {entry.minutes} min{entry.note ? ` · ${entry.note}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="anotacoes-sessao">
        <h2 id="anotacoes-sessao">Anotações</h2>
        <textarea
          className={styles.textarea}
          aria-labelledby="anotacoes-sessao"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes !== session.notes && void updateSession(session.id, { notes })}
        />
      </section>

      <section className="section">
        <button
          type="button"
          className="button"
          onClick={() => {
            if (
              window.confirm(
                'Apagar o registro desta sessão? Os exercícios feitos continuam contando.',
              )
            ) {
              void deleteSession(session.id).then(() => navigate(practicePaths.home))
            }
          }}
        >
          Apagar sessão
        </button>
      </section>
    </>
  )
}

export function SessionPage() {
  const { sessionId = '' } = useParams()
  const session = useSession(sessionId)
  if (session === undefined) return <Loading />
  if (session === null) return <NotFoundPage />
  return <Summary key={session.id} session={session} />
}
