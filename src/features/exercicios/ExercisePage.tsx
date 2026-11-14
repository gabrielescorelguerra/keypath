import { Link, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { StatusBadge } from '@/ui/Badges'
import { formatDateTime } from '@/ui/labels'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import { ExerciseRunner } from './ExerciseRunner.tsx'

export function ExercisePage() {
  const { exerciseId = '' } = useParams()
  const progress = useProgress()
  const exercise = catalog.exerciseById.get(exerciseId)
  if (!exercise) return <NotFoundPage />

  const first = catalog.competencyById.get(exercise.competencies[0] ?? '')
  const attempts = (progress?.facts.attempts ?? [])
    .filter((a) => a.exerciseId === exercise.id)
    .slice()
    .reverse()

  return (
    <>
      <PageHeader
        title={exercise.title}
        crumbs={[
          { label: 'Início', to: paths.home },
          ...(first ? [{ label: first.title, to: paths.competency(first.id) }] : []),
        ]}
        subtitle={exercise.type === 'quiz' ? 'Quiz' : 'Exercício no teclado (autoavaliação)'}
      />

      <ExerciseRunner exercise={exercise} />

      <section className="section" aria-labelledby="treina">
        <h2 id="treina">Treina</h2>
        <ul className="list">
          {exercise.competencies.map((id) => {
            const competency = catalog.competencyById.get(id)
            const state = progress?.snapshot.competencies.get(id)
            return (
              <li key={id} className="row">
                <Link to={paths.competency(id)} className="plain">
                  {competency?.title ?? id}
                </Link>
                {state && <StatusBadge status={state.status} />}
              </li>
            )
          })}
        </ul>
      </section>

      {attempts.length > 0 && (
        <section className="section" aria-labelledby="historico">
          <h2 id="historico">Suas tentativas</h2>
          <ul className="list">
            {attempts.map((attempt) => {
              const result = attempt.result
              let summary: string
              if (result.type === 'quiz') {
                summary = `${Math.round(result.score * 100)}% de acertos`
              } else {
                const total = exercise.type === 'performance' ? exercise.checklist.length : 0
                const done = Object.values(result.checked).filter(Boolean).length
                summary = `${done} de ${total} itens${result.bpm ? ` · ${result.bpm} bpm` : ''}${result.note ? ` · “${result.note}”` : ''}`
              }
              return (
                <li key={attempt.id} className="row">
                  <span>{summary}</span>
                  <span className="muted small">{formatDateTime(attempt.finishedAt)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
