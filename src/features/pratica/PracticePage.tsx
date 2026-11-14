import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import {
  endSession,
  removeSessionSong,
  setSessionSong,
  startSession,
  updateSession,
  useActiveSession,
  usePastSessions,
  useSongs,
} from '@/data'
import {
  practiceSuggestions,
  weeklyPractice,
  type PracticeSession,
  type PracticeSuggestion,
} from '@/domain/practice'
import { MetronomeControl } from '@/ui/music/MetronomeControl'
import { formatDateTime, plural } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './Pratica.module.css'
import { formatDuration } from './format.ts'
import { practicePaths } from './paths.ts'

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function SuggestionItem({ suggestion }: { readonly suggestion: PracticeSuggestion }) {
  const songs = useSongs()
  if (suggestion.kind === 'song') {
    const song = songs?.find((s) => s.id === suggestion.songId)
    return (
      <li className="row">
        <span>
          <span className="muted small">Música · </span>
          <Link to={practicePaths.song(suggestion.songId)}>{song?.title ?? 'Música'}</Link>
        </span>
        <span className="muted small">
          {suggestion.lastPracticedAt
            ? `última prática: ${formatDateTime(suggestion.lastPracticedAt)}`
            : 'ainda não praticada numa sessão'}
        </span>
      </li>
    )
  }
  const exercise = catalog.exerciseById.get(suggestion.exerciseId)
  const competency = catalog.competencyById.get(suggestion.competencyId)
  let detail: string
  if (suggestion.method === 'self-assessment') {
    detail =
      suggestion.daysLeft === 1
        ? 'falta 1 dia para cumprir'
        : `faltam ${suggestion.daysLeft ?? '?'} dias para cumprir`
  } else {
    detail =
      suggestion.bestScore === null
        ? 'quiz ainda não feito'
        : `seu melhor: ${Math.round(suggestion.bestScore * 100)}%`
  }
  return (
    <li className="row">
      <span>
        <span className="muted small">{competency?.title} · </span>
        <Link to={paths.exercise(suggestion.exerciseId)}>
          {exercise?.title ?? suggestion.exerciseId}
        </Link>
      </span>
      <span className="muted small">{detail}</span>
    </li>
  )
}

function ActiveSession({ session }: { readonly session: PracticeSession }) {
  const now = useNow()
  const navigate = useNavigate()
  const progress = useProgress()
  const songs = useSongs()
  const pastSessions = usePastSessions()
  const [songId, setSongId] = useState('')
  const [minutes, setMinutes] = useState('10')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState(session.notes)

  const suggestions = useMemo(
    () =>
      progress && songs && pastSessions
        ? practiceSuggestions(catalog, progress.snapshot, progress.facts, songs, pastSessions)
        : [],
    [progress, songs, pastSessions],
  )
  const attemptsHere =
    progress?.facts.attempts.filter((a) => a.context.sessionId === session.id) ?? []
  const songById = new Map((songs ?? []).map((s) => [s.id, s]))
  const learningFirst = [...(songs ?? [])].sort(
    (a, b) => Number(b.status === 'learning') - Number(a.status === 'learning'),
  )

  return (
    <>
      <section className="card stack" aria-label="Sessão em andamento">
        <div className="row">
          <div>
            <span className="muted small">
              Sessão em andamento{session.focus ? ` · foco: ${session.focus}` : ''}
            </span>
            <div className={styles.timer} role="timer" aria-label="Tempo da sessão">
              {formatDuration(now - Date.parse(session.startedAt))}
            </div>
          </div>
          <button
            type="button"
            className="button primary"
            onClick={() =>
              void updateSession(session.id, { notes })
                .then(() => endSession(session.id))
                .then(() => navigate(practicePaths.session(session.id)))
            }
          >
            Encerrar sessão
          </button>
        </div>
        <span className="muted small">
          {plural(attemptsHere.length, 'exercício feito', 'exercícios feitos')} nesta sessão. Os
          exercícios que você fizer agora ficam ligados a ela.
        </span>
      </section>

      <section className="section" aria-labelledby="sugestoes">
        <h2 id="sugestoes">O que treinar agora</h2>
        {suggestions.length === 0 ? (
          <p className="muted">
            Nada pendente por aqui. Que tal uma <Link to={paths.home}>aula nova</Link> ou uma música
            do <Link to={practicePaths.repertoire}>repertório</Link>?
          </p>
        ) : (
          <ul className="list">
            {suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.kind === 'song' ? suggestion.songId : suggestion.exerciseId}
                suggestion={suggestion}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-label="Metrônomo da sessão">
        <MetronomeControl />
      </section>

      <section className="section" aria-labelledby="musicas-praticadas">
        <h2 id="musicas-praticadas">Músicas praticadas</h2>
        {(songs?.length ?? 0) === 0 ? (
          <p className="muted">
            Adicione músicas no <Link to={practicePaths.repertoire}>repertório</Link> para
            registrá-las aqui.
          </p>
        ) : (
          <form
            className={styles.toolbar}
            onSubmit={(event) => {
              event.preventDefault()
              if (!songId) return
              void setSessionSong(session.id, {
                songId,
                minutes: Math.max(0, Number(minutes) || 0),
                note: note.trim(),
              }).then(() => {
                setSongId('')
                setNote('')
              })
            }}
          >
            <select
              className={styles.select}
              value={songId}
              aria-label="Música"
              onChange={(event) => setSongId(event.target.value)}
            >
              <option value="">Escolher música…</option>
              {learningFirst.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <input
              className={styles.select}
              type="number"
              min={0}
              value={minutes}
              aria-label="Minutos"
              style={{ width: '5rem' }}
              onChange={(event) => setMinutes(event.target.value)}
            />
            <span className="muted small">min</span>
            <input
              className={styles.input}
              placeholder="O que trabalhou (opcional)"
              value={note}
              aria-label="O que trabalhou"
              onChange={(event) => setNote(event.target.value)}
            />
            <button type="submit" className="button" disabled={!songId}>
              Registrar
            </button>
          </form>
        )}
        {session.songs.length > 0 && (
          <ul className="list" style={{ marginTop: 'var(--space-3)' }}>
            {session.songs.map((entry) => (
              <li key={entry.songId} className="row">
                <span>
                  <strong>{songById.get(entry.songId)?.title ?? 'Música removida'}</strong>
                  <span className="muted small">
                    {' '}
                    · {entry.minutes} min{entry.note ? ` · ${entry.note}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  className="button"
                  onClick={() => void removeSessionSong(session.id, entry.songId)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="anotacoes">
        <h2 id="anotacoes">Anotações da sessão</h2>
        <textarea
          className={styles.textarea}
          aria-labelledby="anotacoes"
          value={notes}
          placeholder="O que funcionou, o que travou, o que fazer amanhã…"
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes !== session.notes && void updateSession(session.id, { notes })}
        />
      </section>
    </>
  )
}

function StartSession() {
  const [focus, setFocus] = useState('')
  return (
    <form
      className={`card ${styles.toolbar}`}
      onSubmit={(event) => {
        event.preventDefault()
        void startSession(focus.trim() || null)
      }}
    >
      <label htmlFor="foco" className="visually-hidden">
        Foco da sessão
      </label>
      <input
        id="foco"
        className={styles.input}
        placeholder="Foco de hoje (opcional): ex. IVm em todos os tons"
        value={focus}
        onChange={(event) => setFocus(event.target.value)}
      />
      <button type="submit" className="button primary">
        Começar sessão
      </button>
    </form>
  )
}

export function PracticePage() {
  const active = useActiveSession()
  const past = usePastSessions()
  const progress = useProgress()
  if (active === undefined || !past || !progress) return <Loading />

  const week = weeklyPractice(past)

  return (
    <>
      <PageHeader
        title="Prática"
        subtitle="Sessões de estudo com cronômetro, sugestões do que treinar, metrônomo e seu repertório."
        aside={
          <Link to={practicePaths.repertoire} className="button">
            Repertório
          </Link>
        }
      />

      {active ? <ActiveSession key={active.id} session={active} /> : <StartSession />}

      <section className="section" aria-labelledby="semana">
        <h2 id="semana">Últimos 7 dias</h2>
        <p className="muted" style={{ margin: 0 }}>
          {week.sessions === 0
            ? 'Nenhuma sessão encerrada nos últimos 7 dias.'
            : `${plural(week.sessions, 'sessão', 'sessões')} · ${week.minutes} min · praticou em ${plural(week.days, 'dia', 'dias')}`}
        </p>
      </section>

      {past.length > 0 && (
        <section className="section" aria-labelledby="historico-sessoes">
          <h2 id="historico-sessoes">Sessões anteriores</h2>
          <ul className="list">
            {past.slice(0, 20).map((session) => {
              const attempts = progress.facts.attempts.filter(
                (a) => a.context.sessionId === session.id,
              ).length
              return (
                <li key={session.id} className="row">
                  <Link to={practicePaths.session(session.id)} className="plain">
                    <strong>{formatDateTime(session.startedAt)}</strong>
                    {session.focus && <span className="muted"> · {session.focus}</span>}
                  </Link>
                  <span className="muted small">
                    {formatDuration(
                      Date.parse(session.endedAt ?? session.startedAt) -
                        Date.parse(session.startedAt),
                    )}
                    {' · '}
                    {plural(attempts, 'exercício', 'exercícios')} ·{' '}
                    {plural(session.songs.length, 'música', 'músicas')}
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
