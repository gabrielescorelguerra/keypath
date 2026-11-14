import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import { unsatisfiedPrerequisites, type CriterionState } from '@/domain/progress'
import { Badge, StatusBadge } from '@/ui/Badges'
import { formatDate, LESSON_STATUS, levelName, METHOD_LABEL } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'

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

  return (
    <>
      <PageHeader
        title={competency.title}
        crumbs={[
          { label: 'Início', to: paths.home },
          { label: track?.name ?? competency.track, to: paths.track(competency.track) },
        ]}
        subtitle={competency.description}
        aside={state && <StatusBadge status={state.status} />}
      />

      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <Badge>
          Nível {competency.level} · {levelName(competency.level)}
        </Badge>
        {!competency.core && <Badge>Não conta para o nível da trilha</Badge>}
        {competency.styles.map((id) => (
          <Badge key={id} tone="accent">
            {catalog.styleById.get(id)?.name ?? id}
          </Badge>
        ))}
      </div>

      <section className="section card stack" aria-label="Situação">
        {state?.status === 'mastered' && state.masteredAt && (
          <p style={{ margin: 0 }}>
            Você <strong>dominou</strong> esta competência em {formatDate(state.masteredAt)}.
          </p>
        )}
        {state?.status !== 'mastered' && isDeclared && (
          <p style={{ margin: 0 }}>
            Você declarou que já sabe isto em {formatDate(state?.declaredAt ?? '')}. Para confirmar,
            faça os exercícios abaixo quando quiser.
          </p>
        )}
        {!state?.satisfied && (
          <p style={{ margin: 0 }} className="muted">
            Para dominar, cumpra todos os critérios abaixo. Se já sabe, pode só declarar.
          </p>
        )}
        <div className="row" style={{ justifyContent: 'flex-start' }}>
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
              className="button"
              onClick={() => void declareCompetencies([...missingAll, competency.id])}
            >
              {missingAll.length === 1
                ? 'Já sei isto e o pré-requisito'
                : `Já sei isto e os ${missingAll.length} pré-requisitos`}
            </button>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="criterios">
        <h2 id="criterios">Critérios de domínio</h2>
        <ul className="list">
          {competency.mastery.map((criterion) => {
            const cs = state?.criteria.find((c) => c.criterionId === criterion.id)
            const exercise = catalog.exerciseById.get(criterion.exercise)
            return (
              <li key={criterion.id} className="stack">
                <div className="row">
                  <span>
                    <span className="muted small">{METHOD_LABEL[criterion.method]} · </span>
                    <Link to={paths.exercise(criterion.exercise)}>
                      {exercise?.title ?? criterion.exercise}
                    </Link>
                  </span>
                  {cs?.met ? (
                    <Badge tone="success">Cumprido em {formatDate(cs.metAt ?? '')}</Badge>
                  ) : (
                    <Badge>Pendente</Badge>
                  )}
                </div>
                {cs && (
                  <span className="muted small">{criterionDetail(cs, criterion.minScore)}</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="section" aria-labelledby="pre-requisitos">
        <h2 id="pre-requisitos">Pré-requisitos</h2>
        {competency.prerequisites.length === 0 ? (
          <p className="muted">Nenhum — pode começar por aqui.</p>
        ) : (
          <ul className="list">
            {competency.prerequisites.map((id) => {
              const prerequisite = catalog.competencyById.get(id)
              const ps = snapshot.competencies.get(id)
              return (
                <li key={id} className="row">
                  <Link to={paths.competency(id)} className="plain">
                    {prerequisite?.title ?? id}
                  </Link>
                  {ps && <StatusBadge status={ps.status} />}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {lessons.length > 0 && (
        <section className="section" aria-labelledby="aulas">
          <h2 id="aulas">Aulas que trabalham esta competência</h2>
          <ul className="list">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="row">
                <Link to={paths.lesson(lesson.id)} className="plain">
                  {lesson.title}
                </Link>
                <Badge>
                  {LESSON_STATUS[snapshot.lessons.get(lesson.id)?.status ?? 'not-started']}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {competency.concepts.length > 0 && (
        <section className="section" aria-labelledby="conceitos">
          <h2 id="conceitos">Na Biblioteca</h2>
          <ul className="list">
            {competency.concepts.map((id) => (
              <li key={id}>
                <Link to={paths.concept(id)} className="plain">
                  {catalog.conceptById.get(id)?.title ?? id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dependents.length > 0 && (
        <section className="section" aria-labelledby="libera">
          <h2 id="libera">Depois desta, você pode estudar</h2>
          <ul className="list">
            {dependents.map((dependent) => (
              <li key={dependent.id} className="row">
                <Link to={paths.competency(dependent.id)} className="plain">
                  {dependent.title}
                </Link>
                <span className="muted small">
                  {catalog.trackById.get(dependent.track)?.name} · nível {dependent.level}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
