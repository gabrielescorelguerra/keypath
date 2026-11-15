import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import {
  backupReminder,
  lastActivity,
  useActiveSession,
  useLastBackupAt,
  usePastSessions,
} from '@/data'
import { weeklyPractice } from '@/domain/practice'
import { recommend, type ProgressSnapshot, type Recommendation } from '@/domain/progress'
import { LevelMeter } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { emptyLevels, levelName, trackLevelLabel } from '@/ui/labels'
import { KeyRule, Measures } from '@/ui/Notation'
import { Loading } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { useDocumentTitle } from '@/ui/useDocumentTitle'
import styles from './HomePage.module.css'

interface StepInfo {
  readonly kicker: string
  readonly title: string
  readonly detail: string
  readonly to: string
  readonly action: string
  readonly parts: { readonly done: readonly boolean[]; readonly current: number } | null
}

/** "Fundamentos › Intervalos · aula 1 de 3" — onde a aula fica no mapa de estudo. */
function whereIs(lessonId: string): string {
  const module = catalog.moduleByLesson.get(lessonId)
  if (!module) return ''
  const course = catalog.courseById.get(module.course)
  const index = module.lessons.indexOf(lessonId) + 1
  return `${course ? `${course.title} › ` : ''}${module.title} · aula ${index} de ${module.lessons.length}`
}

function describe(step: Recommendation, snapshot: ProgressSnapshot): StepInfo {
  switch (step.kind) {
    case 'continue-lesson': {
      const lesson = catalog.lessonById.get(step.lessonId)
      const state = snapshot.lessons.get(step.lessonId)
      const doneIds = new Set(state?.completedCheckpoints ?? [])
      const done = (lesson?.checkpoints ?? []).map((c) => doneIds.has(c.id))
      return {
        kicker: 'Continuar aula',
        title: lesson?.title ?? step.lessonId,
        detail: `${whereIs(step.lessonId)} — ${doneIds.size} de ${done.length} partes concluídas`,
        to: paths.lesson(step.lessonId),
        action: 'Continuar',
        parts: { done, current: done.indexOf(false) },
      }
    }
    case 'start-lesson': {
      const lesson = catalog.lessonById.get(step.lessonId)
      return {
        kicker: 'Começar aula',
        title: lesson?.title ?? step.lessonId,
        detail: whereIs(step.lessonId) || (lesson?.summary ?? ''),
        to: paths.lesson(step.lessonId),
        action: 'Começar',
        parts: lesson ? { done: lesson.checkpoints.map(() => false), current: 0 } : null,
      }
    }
    case 'demonstrate': {
      const competency = catalog.competencyById.get(step.competencyId)
      return {
        kicker: 'Demonstrar competência',
        title: competency?.title ?? step.competencyId,
        detail: 'Faça os exercícios para comprovar o domínio — ou declare, se já sabe.',
        to: paths.competency(step.competencyId),
        action: 'Ver competência',
        parts: null,
      }
    }
  }
}

export function HomePage() {
  useDocumentTitle('Início')
  const progress = useProgress()
  const lastBackupAt = useLastBackupAt()
  const activeSession = useActiveSession()
  const pastSessions = usePastSessions()
  if (!progress) return <Loading />

  const { facts, snapshot } = progress
  const steps = recommend(catalog, snapshot).map((step) => ({
    step,
    info: describe(step, snapshot),
  }))
  const [featured, ...others] = steps
  const isNew =
    facts.attempts.length + facts.declarations.length + facts.lessonProgress.length === 0
  const reminder =
    lastBackupAt === undefined
      ? 'none'
      : backupReminder({ lastBackupAt, lastActivityAt: lastActivity(facts) })
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)
  const week = weeklyPractice(pastSessions ?? [])

  return (
    <section aria-labelledby="proximos-passos" className={styles.page}>
      <h2 id="proximos-passos" className="visually-hidden">
        Próximos passos
      </h2>

      {(activeSession || reminder !== 'none') && (
        <div className={styles.notes}>
          {activeSession && (
            <p className="banner info" role="status">
              Sessão de prática em andamento. <Link to="/pratica">Voltar para a sessão</Link>
            </p>
          )}
          {reminder !== 'none' && (
            <p className="banner" role="status">
              {reminder === 'never'
                ? 'Você ainda não fez backup dos seus dados.'
                : 'Seu último backup tem mais de uma semana.'}{' '}
              <Link to={paths.settings}>Fazer backup agora</Link>
            </p>
          )}
        </div>
      )}

      {/* Manchete: o próximo passo */}
      <header className={styles.masthead}>
        {featured ? (
          <>
            <div className={styles.headline}>
              <span className={styles.kicker}>{featured.info.kicker}</span>
              <h1 className={styles.heroTitle}>
                <Link to={featured.info.to} className="plain">
                  {featured.info.title}
                </Link>
              </h1>
              <p className={styles.lead}>{featured.info.detail}</p>
            </div>
            <div className={styles.cue}>
              {featured.info.parts && (
                <div className={styles.parts}>
                  <Measures
                    done={featured.info.parts.done}
                    total={featured.info.parts.done.length}
                    current={featured.info.parts.current}
                    label="Progresso na aula"
                  />
                  <span className={styles.partsLabel}>
                    {featured.info.parts.done.length} partes
                  </span>
                </div>
              )}
              <Link to={featured.info.to} className="button primary lg">
                {featured.info.action}
                <Icon name="arrow" size={16} />
              </Link>
              {isNew && (
                <span className={styles.diagnosis}>
                  Já sabe parte disso? <Link to={paths.diagnosis}>Fazer o diagnóstico</Link>
                </span>
              )}
            </div>
          </>
        ) : (
          <div className={styles.headline}>
            <span className={styles.kicker}>Tudo em dia</span>
            <h1 className={styles.heroTitle}>Você satisfez todas as competências disponíveis.</h1>
          </div>
        )}
      </header>

      <KeyRule />

      <div className={styles.columns}>
        <section className={styles.next} aria-labelledby="a-seguir">
          <h2 id="a-seguir" className={styles.columnTitle}>
            A seguir
          </h2>
          {others.length === 0 ? (
            <p className="muted small">Nada mais na fila por enquanto.</p>
          ) : (
            <ol className={styles.queue}>
              {others.map(({ step, info }, index) => (
                <li key={`${step.kind}-${info.to}`} className={styles.queueItem}>
                  <span className={styles.number} aria-hidden="true">
                    {index + 2}
                  </span>
                  <div className={styles.queueText}>
                    <span className={styles.queueKicker}>{info.kicker}</span>
                    <Link to={info.to} className={`plain ${styles.queueTitle}`}>
                      {info.title}
                    </Link>
                    <span className={styles.queueDetail}>{info.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.tracks} aria-labelledby="trilhas">
          <h2 id="trilhas" className={styles.columnTitle}>
            Seu nível por área
          </h2>
          <p className={styles.columnHint}>
            Não são aulas: é o quanto você já domina em cada área. As aulas ficam em{' '}
            <Link to={paths.learn}>Aprender</Link>.
          </p>
          <ul className={styles.trackList}>
            {tracks.map((track) => {
              const state = snapshot.tracks.get(track.id)
              const next = state?.next
              const fraction = next && next.total > 0 ? next.satisfied / next.total : 0
              return (
                <li key={track.id}>
                  <Link to={paths.track(track.id)} className={`plain ${styles.track}`}>
                    <LevelMeter
                      level={state?.level ?? 0}
                      next={fraction}
                      size="md"
                      label={`Nível ${state?.level ?? 0} de 5 em ${track.name}`}
                      empty={emptyLevels(track.id)}
                    />
                    <span className={styles.trackText}>
                      <strong>{track.name}</strong>
                      <span>{trackLevelLabel(state?.level ?? 0)}</span>
                      {next && next.total === 0 && (state?.level ?? 0) > 0 && (
                        <span className={styles.trackNext}>Todo o conteúdo atual concluído</span>
                      )}
                      {next && next.total > 0 && (
                        <span className={styles.trackNext}>
                          {next.satisfied} de {next.total} rumo ao{' '}
                          {levelName(next.level).toLowerCase()}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className={styles.week} aria-labelledby="semana">
          <h2 id="semana" className={styles.columnTitle}>
            Esta semana
          </h2>
          <p className={styles.weekFigure}>
            <span className={styles.big}>{week.minutes}</span>
            <span className={styles.unit}>min</span>
          </p>
          <p className={styles.weekText}>
            {week.sessions === 0
              ? 'Nenhuma sessão de prática nos últimos 7 dias.'
              : `em ${week.days} ${week.days === 1 ? 'dia' : 'dias'} e ${week.sessions} ${
                  week.sessions === 1 ? 'sessão' : 'sessões'
                } nos últimos 7 dias.`}
          </p>
          <Link to="/pratica" className="arrow-link small">
            Ir para a prática
            <Icon name="arrow" size={14} />
          </Link>
        </section>
      </div>
    </section>
  )
}
