import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { backupReminder, lastActivity, useActiveSession, useLastBackupAt } from '@/data'
import { recommend, type ProgressSnapshot, type Recommendation } from '@/domain/progress'
import { ProgressBar } from '@/ui/Badges'
import { trackLevelLabel } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './HomePage.module.css'

function describe(step: Recommendation, snapshot: ProgressSnapshot) {
  switch (step.kind) {
    case 'continue-lesson': {
      const lesson = catalog.lessonById.get(step.lessonId)
      const state = snapshot.lessons.get(step.lessonId)
      return {
        kicker: 'Continuar aula',
        title: lesson?.title ?? step.lessonId,
        detail: `${state?.completedCheckpoints.length ?? 0} de ${state?.totalCheckpoints ?? 0} partes concluídas`,
        to: paths.lesson(step.lessonId),
        action: 'Continuar',
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
      }
    }
  }
}

export function HomePage() {
  const progress = useProgress()
  const lastBackupAt = useLastBackupAt()
  const activeSession = useActiveSession()
  if (!progress) return <Loading />

  const { facts, snapshot } = progress
  const steps = recommend(catalog, snapshot)
  const isNew =
    facts.attempts.length + facts.declarations.length + facts.lessonProgress.length === 0
  const reminder =
    lastBackupAt === undefined
      ? 'none'
      : backupReminder({ lastBackupAt, lastActivityAt: lastActivity(facts) })
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)

  return (
    <>
      <PageHeader title="Início" subtitle="O que estudar agora e como você está em cada trilha." />

      {activeSession && (
        <p className="banner" role="status" style={{ borderColor: 'var(--color-accent)' }}>
          Você tem uma sessão de prática em andamento.{' '}
          <Link to="/pratica">Voltar para a sessão</Link>
        </p>
      )}

      {reminder !== 'none' && (
        <p className="banner" role="status">
          {reminder === 'never'
            ? 'Você ainda não fez backup dos seus dados. '
            : 'Seu último backup tem mais de uma semana. '}
          <Link to={paths.settings}>Fazer backup agora</Link>
        </p>
      )}

      {isNew && (
        <div className="card">
          <strong>Já sabe alguma coisa?</strong>{' '}
          <span className="muted">
            Marque o que você já domina para o KeyPath não recomendar o básico de novo.
          </span>{' '}
          <Link to={paths.diagnosis}>Fazer o diagnóstico</Link>
        </div>
      )}

      <section className="section" aria-labelledby="proximos-passos">
        <h2 id="proximos-passos">Próximos passos</h2>
        {steps.length === 0 ? (
          <p className="muted">Nada pendente: você satisfez todas as competências disponíveis.</p>
        ) : (
          <ol className={styles.steps}>
            {steps.map((step, index) => {
              const info = describe(step, snapshot)
              return (
                <li key={`${step.kind}-${info.to}`} className={`card ${styles.step}`}>
                  <span className={styles.kicker}>{info.kicker}</span>
                  <Link to={info.to} className={`plain ${styles.stepTitle}`}>
                    {info.title}
                  </Link>
                  <span className="muted small">{info.detail}</span>
                  <Link
                    to={info.to}
                    className={`button ${index === 0 ? 'primary' : ''} ${styles.stepAction}`}
                  >
                    {info.action}
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="section" aria-labelledby="trilhas">
        <h2 id="trilhas">Suas trilhas</h2>
        <ul className="list">
          {tracks.map((track) => {
            const state = snapshot.tracks.get(track.id)
            const next = state?.next
            return (
              <li key={track.id} className="stack">
                <div className="row">
                  <Link to={paths.track(track.id)} className="plain">
                    <strong>{track.name}</strong>
                  </Link>
                  <span className="muted small">{trackLevelLabel(state?.level ?? 0)}</span>
                </div>
                {next && next.total > 0 && (
                  <>
                    <ProgressBar
                      value={next.satisfied / next.total}
                      label={`Progresso no nível ${next.level} de ${track.name}`}
                    />
                    <span className="muted small">
                      Nível {next.level}: {next.satisfied} de {next.total} competências
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
