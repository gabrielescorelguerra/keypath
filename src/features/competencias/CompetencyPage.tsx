import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import { unsatisfiedPrerequisites, type CriterionState } from '@/domain/progress'
import { Badge, LevelMeter, StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { formatDate, LESSON_STATUS, levelName, METHOD_LABEL } from '@/ui/labels'
import { KeyRule } from '@/ui/Notation'
import { Loading } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { useDocumentTitle } from '@/ui/useDocumentTitle'
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
  const competency = catalog.competencyById.get(competencyId)
  useDocumentTitle(competency?.title ?? 'Competência')
  const progress = useProgress()
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
    <article className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.identity}>
          <nav aria-label="Você está em" className={styles.crumbs}>
            <Link to={paths.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <Link to={paths.track(competency.track)}>{track?.name ?? competency.track}</Link>
          </nav>
          <h1 className={styles.title}>{competency.title}</h1>
          <p className={styles.lead}>{competency.description}</p>
          <div className={styles.meta}>
            <span className={styles.level}>
              <LevelMeter level={competency.level} label="" size="sm" />
              Nível {competency.level} · {levelName(competency.level)}
            </span>
            {!competency.core && <Badge>Não conta para o nível da trilha</Badge>}
            {competency.styles.map((id) => (
              <Badge key={id} tone="accent">
                {catalog.styleById.get(id)?.name ?? id}
              </Badge>
            ))}
          </div>
        </div>

        <section className={styles.standing} aria-label="Situação">
          <span className={styles.standingLabel}>Situação</span>
          <div className={styles.standingStatus}>
            {state && <StatusBadge status={state.status} />}
          </div>
          {state?.status === 'mastered' && state.masteredAt && (
            <p className={styles.standingText}>Dominada em {formatDate(state.masteredAt)}.</p>
          )}
          {state?.status !== 'mastered' && isDeclared && (
            <p className={styles.standingText}>
              Você declarou que já sabe isto em {formatDate(state?.declaredAt ?? '')}. Para
              confirmar, faça os exercícios quando quiser.
            </p>
          )}
          {!state?.satisfied && (
            <p className={styles.standingText}>
              Para dominar, cumpra os critérios. Se já sabe, pode só declarar.
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
      </header>

      <KeyRule />

      <div className={styles.body}>
        <section className={styles.criteria} aria-labelledby="criterios">
          <h2 id="criterios" className={styles.sectionTitle}>
            Critérios de domínio
            <span className={styles.count} aria-hidden="true">
              {metCount} de {competency.mastery.length}
            </span>
          </h2>
          <ol className={styles.criteriaList}>
            {competency.mastery.map((criterion, index) => {
              const cs = state?.criteria.find((c) => c.criterionId === criterion.id)
              const exercise = catalog.exerciseById.get(criterion.exercise)
              return (
                <li key={criterion.id} className={styles.criterion} data-met={cs?.met ?? false}>
                  <span className={styles.numeral} aria-hidden="true">
                    {cs?.met ? <Icon name="check" size={22} /> : index + 1}
                  </span>
                  <div className={styles.criterionBody}>
                    <span className={styles.method}>{METHOD_LABEL[criterion.method]}</span>
                    <Link to={paths.exercise(criterion.exercise)} className={styles.criterionLink}>
                      {exercise?.title ?? criterion.exercise}
                    </Link>
                    {cs && (
                      <span className={styles.criterionDetail}>
                        {criterionDetail(cs, criterion.minScore)}
                      </span>
                    )}
                    {cs && cs.requiredDays > 1 && (
                      <span className={styles.days} aria-hidden="true">
                        {Array.from({ length: cs.requiredDays }, (_, i) => (
                          <span key={i} data-on={i < cs.qualifyingDays} />
                        ))}
                      </span>
                    )}
                  </div>
                  <span className={styles.criterionState}>
                    {cs?.met ? `Cumprido em ${formatDate(cs.metAt ?? '')}` : 'Pendente'}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        <aside className={styles.side}>
          <section aria-labelledby="caminho">
            <h2 id="caminho" className={styles.sectionTitle}>
              Caminho
            </h2>
            <div className={styles.path}>
              <section aria-labelledby="pre-requisitos" className={styles.pathGroup}>
                <h3 id="pre-requisitos" className={styles.pathLabel}>
                  Pré-requisitos
                </h3>
                {competency.prerequisites.length === 0 ? (
                  <p className={styles.pathEmpty}>Nenhum — pode começar por aqui.</p>
                ) : (
                  <ul className={styles.nodes}>
                    {competency.prerequisites.map((id) => {
                      const ps = snapshot.competencies.get(id)
                      return (
                        <li
                          key={id}
                          className={styles.node}
                          data-satisfied={ps?.satisfied ?? false}
                        >
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

              <div className={styles.here} aria-hidden="true">
                <span className={styles.hereNode} />
                {competency.title}
              </div>

              <section aria-labelledby="libera" className={styles.pathGroup}>
                <h3 id="libera" className={styles.pathLabel}>
                  Depois desta, você pode estudar
                </h3>
                {dependents.length === 0 ? (
                  <p className={styles.pathEmpty}>É um ponto de chegada nesta fatia do conteúdo.</p>
                ) : (
                  <ul className={styles.nodes}>
                    {dependents.map((dependent) => (
                      <li key={dependent.id} className={styles.node}>
                        <Link to={paths.competency(dependent.id)} className="plain">
                          {dependent.title}
                        </Link>
                        <span className={styles.nodeMeta}>
                          {catalog.trackById.get(dependent.track)?.name} · nível {dependent.level}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </section>

          {(lessons.length > 0 || competency.concepts.length > 0) && (
            <div className={styles.study}>
              {lessons.length > 0 && (
                <section aria-labelledby="aulas">
                  <h2 id="aulas" className={styles.studyTitle}>
                    Aulas que trabalham esta competência
                  </h2>
                  <ul className={styles.studyList}>
                    {lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link to={paths.lesson(lesson.id)} className="plain">
                          {lesson.title}
                        </Link>
                        <span className={styles.nodeMeta}>
                          {LESSON_STATUS[snapshot.lessons.get(lesson.id)?.status ?? 'not-started']}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {competency.concepts.length > 0 && (
                <section aria-labelledby="conceitos">
                  <h2 id="conceitos" className={styles.studyTitle}>
                    Na Biblioteca
                  </h2>
                  <ul className={styles.studyList}>
                    {competency.concepts.map((id) => (
                      <li key={id}>
                        <Link to={paths.concept(id)} className="arrow-link">
                          {catalog.conceptById.get(id)?.title ?? id}
                          <Icon name="arrow" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
