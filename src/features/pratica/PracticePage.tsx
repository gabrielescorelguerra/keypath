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
import { Icon } from '@/ui/Icon'
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
      <section className={styles.transport} aria-label="Sessão em andamento">
        <div className={styles.transportInfo}>
          <span className={styles.recLabel}>
            <span className={styles.recDot} aria-hidden="true" />
            Sessão em andamento{session.focus ? ` · foco: ${session.focus}` : ''}
          </span>
          <div className={styles.timer} role="timer" aria-label="Tempo da sessão">
            {formatDuration(now - Date.parse(session.startedAt))}
          </div>
          <span className={styles.transportMeta}>
            {plural(attemptsHere.length, 'exercício feito', 'exercícios feitos')} nesta sessão. Os
            exercícios que você fizer agora ficam ligados a ela.
          </span>
        </div>
        <button
          type="button"
          className={`button lg ${styles.endButton}`}
          onClick={() =>
            void updateSession(session.id, { notes })
              .then(() => endSession(session.id))
              .then(() => navigate(practicePaths.session(session.id)))
          }
        >
          <Icon name="stop" size={14} />
          Encerrar sessão
        </button>
      </section>

      <div className="split">
        <div className={styles.column}>
          <section aria-labelledby="sugestoes">
            <h2 id="sugestoes" className="section-title">
              O que treinar agora
            </h2>
            {suggestions.length === 0 ? (
              <p className="muted">
                Nada pendente por aqui. Que tal uma <Link to={paths.home}>aula nova</Link> ou uma
                música do <Link to={practicePaths.repertoire}>repertório</Link>?
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

          <section aria-labelledby="musicas-praticadas">
            <h2 id="musicas-praticadas" className="section-title">
              Músicas praticadas
            </h2>
            {(songs?.length ?? 0) === 0 ? (
              <p className="muted">
                Adicione músicas no <Link to={practicePaths.repertoire}>repertório</Link> para
                registrá-las aqui.
              </p>
            ) : (
              <form
                className={styles.logForm}
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
                  className="select"
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
                <span className={styles.minutes}>
                  <input
                    className="input mono"
                    type="number"
                    min={0}
                    value={minutes}
                    aria-label="Minutos"
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                  <span className="xsmall faint">min</span>
                </span>
                <input
                  className="input"
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
              <ul className={`list ${styles.logList}`}>
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
                      className="button ghost sm"
                      onClick={() => void removeSessionSong(session.id, entry.songId)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="anotacoes">
            <h2 id="anotacoes" className="section-title">
              Anotações da sessão
            </h2>
            <textarea
              className="textarea"
              aria-labelledby="anotacoes"
              value={notes}
              placeholder="O que funcionou, o que travou, o que fazer amanhã…"
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => notes !== session.notes && void updateSession(session.id, { notes })}
            />
          </section>
        </div>

        <aside className="aside">
          <section aria-label="Metrônomo da sessão">
            <MetronomeControl />
          </section>
        </aside>
      </div>
    </>
  )
}

function StartSession() {
  const [focus, setFocus] = useState('')
  return (
    <form
      className={styles.start}
      onSubmit={(event) => {
        event.preventDefault()
        void startSession(focus.trim() || null)
      }}
    >
      <div className={styles.startText}>
        <span className="eyebrow accent">Nova sessão</span>
        <p className={styles.startTitle}>Pronto para tocar?</p>
        <p className="muted small" style={{ margin: 0 }}>
          A sessão marca o tempo, sugere o que treinar e registra o que você fizer.
        </p>
      </div>
      <div className={styles.startForm}>
        <label htmlFor="foco" className="visually-hidden">
          Foco da sessão
        </label>
        <input
          id="foco"
          className="input"
          placeholder="Foco de hoje (opcional): ex. IVm em todos os tons"
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
        />
        <button type="submit" className="button primary lg">
          <Icon name="play" size={14} />
          Começar sessão
        </button>
      </div>
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
        eyebrow="Estúdio"
        title="Prática"
        subtitle="Sessões de estudo com cronômetro, sugestões do que treinar, metrônomo e seu repertório."
        aside={
          <Link to={practicePaths.repertoire} className="button">
            <Icon name="note" size={16} />
            Repertório
          </Link>
        }
      />

      {active ? <ActiveSession key={active.id} session={active} /> : <StartSession />}

      <div className={`split ${styles.history}`}>
        <section aria-labelledby="historico-sessoes">
          <h2 id="historico-sessoes" className="section-title">
            Sessões anteriores
          </h2>
          {past.length === 0 ? (
            <p className="muted small">Suas sessões encerradas aparecem aqui.</p>
          ) : (
            <ul className="list">
              {past.slice(0, 20).map((session) => {
                const attempts = progress.facts.attempts.filter(
                  (a) => a.context.sessionId === session.id,
                ).length
                return (
                  <li key={session.id} className={`link-row ${styles.sessionRow}`}>
                    <Link to={practicePaths.session(session.id)} className="plain">
                      <strong>{formatDateTime(session.startedAt)}</strong>
                      {session.focus && <span className="muted"> · {session.focus}</span>}
                    </Link>
                    <span className="xsmall faint num">
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
          )}
        </section>

        <aside className="aside">
          <section aria-labelledby="semana">
            <h2 id="semana" className="section-title">
              Últimos 7 dias
            </h2>
            <div className={styles.weekStats}>
              <div>
                <span className={styles.weekNumber}>{week.minutes}</span>
                <span>min</span>
              </div>
              <div>
                <span className={styles.weekNumber}>{week.days}</span>
                <span>{week.days === 1 ? 'dia' : 'dias'}</span>
              </div>
            </div>
            <p className="xsmall muted" style={{ margin: 'var(--space-3) 0 0' }}>
              {week.sessions === 0
                ? 'Nenhuma sessão encerrada nos últimos 7 dias.'
                : `${plural(week.sessions, 'sessão', 'sessões')} · ${week.minutes} min · praticou em ${plural(week.days, 'dia', 'dias')}`}
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
