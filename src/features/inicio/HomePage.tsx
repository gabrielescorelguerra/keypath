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
import { LevelMeter, ProgressBar } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { levelName, plural, trackLevelLabel } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './HomePage.module.css'

interface StepInfo {
  readonly kicker: string
  readonly title: string
  readonly detail: string
  readonly to: string
  readonly action: string
  readonly progress: number | null
}

function describe(step: Recommendation, snapshot: ProgressSnapshot): StepInfo {
  switch (step.kind) {
    case 'continue-lesson': {
      const lesson = catalog.lessonById.get(step.lessonId)
      const state = snapshot.lessons.get(step.lessonId)
      const done = state?.completedCheckpoints.length ?? 0
      const total = state?.totalCheckpoints ?? 0
      return {
        kicker: 'Continuar aula',
        title: lesson?.title ?? step.lessonId,
        detail: `${done} de ${total} partes concluídas`,
        to: paths.lesson(step.lessonId),
        action: 'Continuar',
        progress: total > 0 ? done / total : null,
      }
    }
    case 'start-lesson': {
      const lesson = catalog.lessonById.get(step.lessonId)
      const worked = lesson?.competencies
        .map((id) => catalog.competencyById.get(id)?.title)
        .filter(Boolean)
        .join(', ')
      return {
        kicker: 'Começar aula',
        title: lesson?.title ?? step.lessonId,
        detail: `Trabalha: ${worked ?? ''}`,
        to: paths.lesson(step.lessonId),
        action: 'Começar',
        progress: null,
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
        progress: null,
      }
    }
  }
}

export function HomePage() {
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
    <>
      <PageHeader
        eyebrow="Painel"
        title="O que estudar agora"
        subtitle="Seu próximo passo, o nível de cada trilha e a sua semana de prática."
      />

      <div className="split">
        <div className={styles.main}>
          {(activeSession || reminder !== 'none') && (
            <div className="stack">
              {activeSession && (
                <p className="banner info" role="status">
                  <span className={styles.rec} aria-hidden="true" />
                  Você tem uma sessão de prática em andamento.{' '}
                  <Link to="/pratica">Voltar para a sessão</Link>
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

          <section aria-labelledby="proximos-passos">
            <h2 id="proximos-passos" className="visually-hidden">
              Próximos passos
            </h2>
            {!featured ? (
              <div className="panel">
                <span className="eyebrow accent">Tudo em dia</span>
                <p className={styles.emptyTitle}>
                  Você satisfez todas as competências disponíveis.
                </p>
              </div>
            ) : (
              <ol className={styles.steps}>
                <li className={`panel raised ${styles.featured}`}>
                  <span className="eyebrow accent">{featured.info.kicker}</span>
                  <Link to={featured.info.to} className={`plain ${styles.featuredTitle}`}>
                    {featured.info.title}
                  </Link>
                  <span className={styles.detail}>{featured.info.detail}</span>
                  {featured.info.progress !== null && (
                    <ProgressBar value={featured.info.progress} label="Progresso na aula" />
                  )}
                  <div className={styles.featuredFooter}>
                    <Link to={featured.info.to} className="button primary lg">
                      {featured.info.action}
                      <Icon name="arrow" size={16} />
                    </Link>
                    {isNew && (
                      <span className={styles.secondaryLink}>
                        Já sabe parte disso? <Link to={paths.diagnosis}>Fazer o diagnóstico</Link>
                      </span>
                    )}
                  </div>
                </li>
                {others.map(({ step, info }) => (
                  <li key={`${step.kind}-${info.to}`} className={`link-row ${styles.step}`}>
                    <span className={styles.stepIndex} aria-hidden="true" />
                    <span className={styles.stepText}>
                      <span className="eyebrow">{info.kicker}</span>
                      <Link to={info.to} className={`plain ${styles.stepTitle}`}>
                        {info.title}
                      </Link>
                      <span className={styles.detail}>{info.detail}</span>
                    </span>
                    <Link to={info.to} className="arrow-link xsmall" aria-label={info.action}>
                      {info.action}
                      <Icon name="arrow" size={14} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="aside">
          <section className="panel" aria-labelledby="trilhas">
            <h2 id="trilhas" className={`eyebrow ${styles.panelTitle}`}>
              Suas trilhas
            </h2>
            <ul className={styles.tracks}>
              {tracks.map((track) => {
                const state = snapshot.tracks.get(track.id)
                const next = state?.next
                const fraction = next && next.total > 0 ? next.satisfied / next.total : 0
                return (
                  <li key={track.id}>
                    <Link to={paths.track(track.id)} className={`plain ${styles.track}`}>
                      <span className={styles.trackHead}>
                        <strong>{track.name}</strong>
                        <span className={`mono ${styles.levelNumber}`}>N{state?.level ?? 0}</span>
                      </span>
                      <LevelMeter
                        level={state?.level ?? 0}
                        next={fraction}
                        size="lg"
                        label={`Nível ${state?.level ?? 0} de 5 em ${track.name}`}
                      />
                      <span className={styles.trackMeta}>
                        <span>{trackLevelLabel(state?.level ?? 0)}</span>
                        {next && next.total > 0 && (
                          <span className="faint">
                            {' '}
                            · rumo ao {next.level} ({levelName(next.level).toLowerCase()}):{' '}
                            {next.satisfied}/{next.total}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="panel sunken" aria-labelledby="semana">
            <h2 id="semana" className={`eyebrow ${styles.panelTitle}`}>
              Últimos 7 dias
            </h2>
            <div className={styles.stats}>
              <div>
                <span className={`mono ${styles.statValue}`}>{week.minutes}</span>
                <span className={styles.statLabel}>minutos</span>
              </div>
              <div>
                <span className={`mono ${styles.statValue}`}>{week.days}</span>
                <span className={styles.statLabel}>{week.days === 1 ? 'dia' : 'dias'}</span>
              </div>
              <div>
                <span className={`mono ${styles.statValue}`}>{week.sessions}</span>
                <span className={styles.statLabel}>
                  {plural(week.sessions, 'sessão', 'sessões').replace(/^\d+ /, '')}
                </span>
              </div>
            </div>
            <Link to="/pratica" className="arrow-link xsmall">
              Ir para a prática
              <Icon name="arrow" size={14} />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
