import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import { unsatisfiedPrerequisites, type CriterionState } from '@/domain/progress'
import { Badge, StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { formatDate, LESSON_STATUS, levelName, METHOD_LABEL } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import styles from './CompetencyPage.module.css'

function criterionDetail(state: CriterionState, minScore: number): string {
  const parts: string[] = []
  if (state.method === 'quiz') {
    parts.push(`mínimo de ${Math.round(minScore * 100)}% de acertos`)
    if (state.bestScore !== null) parts.push(`seu melhor: ${Math.round(state.bestScore * 100)}%`)
  } else {
    parts.push('todos os itens do checklist marcados')
  }
  if (state.requiredDays > 1) {
    parts.push(`em ${state.requiredDays} dias diferentes (${state.qualifyingDays} até agora)`)
  }
  return parts.join(' · ')
}

export function CompetencyPage() {
  const { competencyId = '' } = useParams()
  const progress = useProgress()
  const competency = catalog.competencyById.get(competencyId)
  if (!competency) return <NotFoundPage />
  if (!progress) return <Loading />

  const { snapshot } = progress
  const state = snapshot.competencies.get(competency.id)
  const track = catalog.trackById.get(competency.track)
  const lessons = catalog.lessonsByCompetency.get(competency.id) ?? []
  const dependents = catalog.dependentsByCompetency.get(competency.id) ?? []
  const missingAll = unsatisfiedPrerequisites(catalog, snapshot, competency.id)
  const isDeclared = state?.declaredAt != null
  const metCount = state?.criteria.filter((c) => c.met).length ?? 0

  return (
    <>
      <PageHeader
        title={competency.title}
        crumbs={[
          { label: 'Início', to: paths.home },
          { label: track?.name ?? competency.track, to: paths.track(competency.track) },
        ]}
        subtitle={competency.description}
        meta={
          <>
            <Badge>
              N{competency.level} · {levelName(competency.level)}
            </Badge>
            {!competency.core && <Badge>Não conta para o nível da trilha</Badge>}
            {competency.styles.map((id) => (
              <Badge key={id} tone="accent">
                {catalog.styleById.get(id)?.name ?? id}
              </Badge>
            ))}
          </>
        }
      />

      <div className="split aside-first">
        <div className={styles.main}>
          <section aria-labelledby="criterios">
            <h2 id="criterios" className="section-title">
              Critérios de domínio
              <span className="mono xsmall faint" aria-hidden="true">
                {metCount}/{competency.mastery.length}
              </span>
            </h2>
            <ol className={styles.criteria}>
              {competency.mastery.map((criterion, index) => {
                const cs = state?.criteria.find((c) => c.criterionId === criterion.id)
                const exercise = catalog.exerciseById.get(criterion.exercise)
                return (
                  <li key={criterion.id} className={styles.criterion} data-met={cs?.met ?? false}>
                    <span className={styles.check} aria-hidden="true">
                      {cs?.met ? (
                        <Icon name="check" size={14} />
                      ) : (
                        <span className="mono">{index + 1}</span>
                      )}
                    </span>
                    <div className={styles.criterionBody}>
                      <span className="eyebrow">{METHOD_LABEL[criterion.method]}</span>
                      <Link
                        to={paths.exercise(criterion.exercise)}
                        className={styles.criterionLink}
                      >
                        {exercise?.title ?? criterion.exercise}
                      </Link>
                      {cs && (
                        <span className="muted xsmall">
                          {criterionDetail(cs, criterion.minScore)}
                        </span>
                      )}
                    </div>
                    {cs?.met ? (
                      <Badge tone="success">Cumprido em {formatDate(cs.metAt ?? '')}</Badge>
                    ) : (
                      <Badge>Pendente</Badge>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>

          <div className={styles.path}>
            <section aria-labelledby="pre-requisitos">
              <h2 id="pre-requisitos" className="section-title">
                Pré-requisitos
              </h2>
              {competency.prerequisites.length === 0 ? (
                <p className="muted small">Nenhum — pode começar por aqui.</p>
              ) : (
                <ul className="list">
                  {competency.prerequisites.map((id) => {
                    const ps = snapshot.competencies.get(id)
                    return (
                      <li key={id} className={`link-row ${styles.pathItem}`}>
                        <Link to={paths.competency(id)} className="plain">
                          {catalog.competencyById.get(id)?.title ?? id}
                        </Link>
                        {ps && <StatusBadge status={ps.status} />}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <span className={styles.pathArrow} aria-hidden="true">
              <Icon name="arrow" />
            </span>

            <section aria-labelledby="libera">
              <h2 id="libera" className="section-title">
                Depois desta, você pode estudar
              </h2>
              {dependents.length === 0 ? (
                <p className="muted small">É um ponto de chegada nesta fatia do conteúdo.</p>
              ) : (
                <ul className="list">
                  {dependents.map((dependent) => (
                    <li key={dependent.id} className={`link-row ${styles.pathItem}`}>
                      <Link to={paths.competency(dependent.id)} className="plain">
                        {dependent.title}
                      </Link>
                      <span className="mono xsmall faint">
                        {catalog.trackById.get(dependent.track)?.name} · N{dependent.level}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="aside">
          <section className="panel raised" aria-label="Situação">
            <span className="eyebrow">Situação</span>
            <div className={styles.state}>{state && <StatusBadge status={state.status} />}</div>
            {state?.status === 'mastered' && state.masteredAt && (
              <p className={styles.stateText}>
                Você <strong>dominou</strong> esta competência em {formatDate(state.masteredAt)}.
              </p>
            )}
            {state?.status !== 'mastered' && isDeclared && (
              <p className={styles.stateText}>
                Você declarou que já sabe isto em {formatDate(state?.declaredAt ?? '')}. Para
                confirmar, faça os exercícios quando quiser.
              </p>
            )}
            {!state?.satisfied && (
              <p className={styles.stateText}>
                Para dominar, cumpra todos os critérios. Se já sabe, pode só declarar.
              </p>
            )}
            <div className={styles.actions}>
              {state?.status !== 'mastered' &&
                (isDeclared ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => void undeclareCompetencies([competency.id])}
                  >
                    Remover declaração
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => void declareCompetencies([competency.id])}
                  >
                    Já sei isto
                  </button>
                ))}
              {!state?.satisfied && missingAll.length > 0 && (
                <button
                  type="button"
                  className="button ghost sm"
                  onClick={() => void declareCompetencies([...missingAll, competency.id])}
                >
                  {missingAll.length === 1
                    ? 'Já sei isto e o pré-requisito'
                    : `Já sei isto e os ${missingAll.length} pré-requisitos`}
                </button>
              )}
            </div>
          </section>

          {lessons.length > 0 && (
            <section className="panel" aria-labelledby="aulas">
              <h2 id="aulas" className={`eyebrow ${styles.asideTitle}`}>
                Aulas que trabalham esta competência
              </h2>
              <ul className={styles.asideList}>
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link to={paths.lesson(lesson.id)} className="plain">
                      {lesson.title}
                    </Link>
                    <span className="xsmall faint">
                      {LESSON_STATUS[snapshot.lessons.get(lesson.id)?.status ?? 'not-started']}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {competency.concepts.length > 0 && (
            <section className="panel sunken" aria-labelledby="conceitos">
              <h2 id="conceitos" className={`eyebrow ${styles.asideTitle}`}>
                Na Biblioteca
              </h2>
              <ul className={styles.asideList}>
                {competency.concepts.map((id) => (
                  <li key={id}>
                    <Link to={paths.concept(id)} className="arrow-link small">
                      {catalog.conceptById.get(id)?.title ?? id}
                      <Icon name="arrow" size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
