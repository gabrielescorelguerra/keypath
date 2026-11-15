import { useState } from 'react'
import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { DEFAULT_SETTINGS, recordAttempt, useActiveSession, useSettings } from '@/data'
import type { Exercise, PerformanceExercise, QuizExercise } from '@/domain/catalog'
import { formatPitchClass, parseKey } from '@/domain/music'
import { gradeQuiz, type AttemptContext, type QuizGrade } from '@/domain/progress'
import { Badge } from '@/ui/Badges'
import { Markdown } from '@/ui/markdown/Markdown'
import { BackingTrack } from '@/ui/music/BackingTrack'
import { ListenButton } from '@/ui/music/ListenButton'
import { MetronomeControl } from '@/ui/music/MetronomeControl'
import { paths } from '@/ui/paths'
import styles from './Exercise.module.css'

const STAGE_LABEL = {
  recognition: 'Reconhecimento',
  execution: 'Execução',
  application: 'Aplicação',
  creativity: 'Criatividade',
} as const

const HANDS = { left: 'Mão esquerda', right: 'Mão direita', both: 'Duas mãos' } as const

/** Situação dos critérios que usam este exercício (o que a tentativa "conta"). */
function CountsFor({ exercise }: { readonly exercise: Exercise }) {
  const progress = useProgress()
  const uses = catalog.competencies.flatMap((competency) =>
    competency.mastery
      .filter((m) => m.exercise === exercise.id)
      .map((criterion) => ({ competency, criterion })),
  )
  if (uses.length === 0 || !progress) return null

  return (
    <ul className={styles.counts}>
      {uses.map(({ competency, criterion }) => {
        const cs = progress.snapshot.competencies.get(competency.id)
        const state = cs?.criteria.find((c) => c.criterionId === criterion.id)
        let text = 'pendente'
        if (state?.met) text = 'critério cumprido ✓'
        else if (state && state.requiredDays > 1)
          text = `${state.qualifyingDays} de ${state.requiredDays} dias`
        return (
          <li key={`${competency.id}-${criterion.id}`}>
            Conta para <Link to={paths.competency(competency.id)}>{competency.title}</Link>: {text}
            {cs?.status === 'mastered' && (
              <>
                {' '}
                <Badge tone="success">Competência dominada</Badge>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function QuizRunner({
  exercise,
  context,
}: {
  readonly exercise: QuizExercise
  readonly context: AttemptContext
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [grade, setGrade] = useState<QuizGrade | null>(null)
  const complete = exercise.questions.every((q) => (answers[q.id]?.length ?? 0) > 0)

  function choose(questionId: string, option: number, multiple: boolean) {
    if (grade) return
    setAnswers((current) => {
      const chosen = current[questionId] ?? []
      const next = multiple
        ? chosen.includes(option)
          ? chosen.filter((o) => o !== option)
          : [...chosen, option].sort()
        : [option]
      return { ...current, [questionId]: next }
    })
  }

  async function submit() {
    const result = gradeQuiz(exercise, answers)
    setGrade(result)
    await recordAttempt({
      exerciseId: exercise.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      context,
      result: { type: 'quiz', answers, score: result.score },
    })
  }

  function retry() {
    setAnswers({})
    setGrade(null)
    setStartedAt(new Date().toISOString())
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (complete && !grade) void submit()
      }}
    >
      {exercise.questions.map((question, index) => {
        const multiple = question.kind === 'multiple-choice'
        const result = grade?.questions.find((g) => g.questionId === question.id)
        return (
          <fieldset
            key={question.id}
            className={styles.question}
            data-result={result ? (result.correct ? 'ok' : 'wrong') : undefined}
          >
            <legend className={styles.prompt}>
              <span className={styles.qNumber}>{String(index + 1).padStart(2, '0')}</span>
              {question.prompt}
              {multiple && <span className="muted small"> (marque todas as corretas)</span>}
            </legend>
            {question.audio && <ListenButton audio={question.audio} />}
            {question.options.map((option, optionIndex) => {
              const checked = answers[question.id]?.includes(optionIndex) ?? false
              const isCorrect = question.correct.includes(optionIndex)
              return (
                <label
                  key={optionIndex}
                  className={styles.option}
                  data-checked={checked}
                  data-mark={
                    grade ? (isCorrect ? 'correct' : checked ? 'wrong' : undefined) : undefined
                  }
                >
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    name={`${exercise.id}-${question.id}`}
                    checked={checked}
                    disabled={grade !== null}
                    onChange={() => choose(question.id, optionIndex, multiple)}
                    className="visually-hidden"
                  />
                  <span className={styles.letter} aria-hidden="true" data-multiple={multiple}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </label>
              )
            })}
            {result && (
              <p className={result.correct ? styles.ok : styles.wrong}>
                {result.correct ? 'Certo!' : 'Não foi dessa vez.'}
                {question.explanation && ` ${question.explanation}`}
              </p>
            )}
          </fieldset>
        )
      })}

      {grade ? (
        <div className={styles.result} role="status">
          <strong>
            Você acertou {Math.round(grade.score * 100)}% (
            {grade.questions.filter((q) => q.correct).length} de {grade.questions.length}).
          </strong>
          <button type="button" className="button" onClick={retry}>
            Fazer de novo
          </button>
        </div>
      ) : (
        <button type="submit" className="button primary" disabled={!complete}>
          Corrigir
        </button>
      )}
    </form>
  )
}

function keyLabel(key: string, naming: Parameters<typeof formatPitchClass>[1]): string {
  try {
    const parsed = parseKey(key)
    return `${formatPitchClass(parsed.tonic, naming)}${parsed.mode === 'minor' ? ' menor' : ''}`
  } catch {
    return key
  }
}

/** "Comece a 60 bpm e suba 5 a cada execução limpa, até 90 bpm." */
function tempoPlan(p: PerformanceExercise['parameters']): string {
  if (p.startBpm && p.targetBpm && p.startBpm < p.targetBpm) {
    const step = p.bpmStep ? `, subindo ${p.bpmStep} a cada execução limpa` : ''
    return `de ${p.startBpm} a ${p.targetBpm} bpm${step}`
  }
  return `${p.targetBpm ?? p.startBpm} bpm`
}

function PerformanceRunner({
  exercise,
  context,
}: {
  readonly exercise: PerformanceExercise
  readonly context: AttemptContext
}) {
  const naming = (useSettings() ?? DEFAULT_SETTINGS).noteNaming
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [bpm, setBpm] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState<'complete' | 'partial' | null>(null)
  const { parameters } = exercise
  const allChecked = exercise.checklist.every((item) => checked[item.id])

  async function submit() {
    const bpmValue = Number(bpm)
    await recordAttempt({
      exerciseId: exercise.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      context,
      result: {
        type: 'self-assessment',
        checked,
        ...(bpm && bpmValue > 0 ? { bpm: bpmValue } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
    })
    setSaved(allChecked ? 'complete' : 'partial')
  }

  function again() {
    setChecked({})
    setBpm('')
    setNote('')
    setSaved(null)
    setStartedAt(new Date().toISOString())
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (!saved) void submit()
      }}
    >
      {(parameters.keys.length > 0 ||
        parameters.targetBpm ||
        parameters.startBpm ||
        parameters.hands) && (
        <dl className={styles.params}>
          {parameters.keys.length > 0 && (
            <div>
              <dt>Tonalidades</dt>
              <dd>{parameters.keys.map((k) => keyLabel(k, naming)).join(' · ')}</dd>
            </div>
          )}
          {(parameters.targetBpm || parameters.startBpm) && (
            <div>
              <dt>Andamento</dt>
              <dd>{tempoPlan(parameters)}</dd>
            </div>
          )}
          {parameters.hands && (
            <div>
              <dt>Mãos</dt>
              <dd>{HANDS[parameters.hands]}</dd>
            </div>
          )}
        </dl>
      )}

      {parameters.backing && (
        <BackingTrack
          backing={parameters.backing}
          initialBpm={parameters.startBpm ?? parameters.targetBpm ?? 70}
        />
      )}

      {(parameters.targetBpm || parameters.startBpm) && (
        <details className={styles.metronome}>
          <summary>Metrônomo ({parameters.startBpm ?? parameters.targetBpm} bpm)</summary>
          <MetronomeControl initialBpm={parameters.startBpm ?? parameters.targetBpm ?? 80} />
        </details>
      )}

      {exercise.routine && (
        <section className={styles.routine} aria-label="Como praticar">
          <h3 className={styles.routineTitle}>
            Como praticar
            {exercise.minutes && (
              <span className={styles.routineTime}>cerca de {exercise.minutes} min</span>
            )}
          </h3>
          <Markdown root={exercise.routine} />
        </section>
      )}

      {exercise.mistakes && (
        <section className={styles.mistakes} aria-label="Erros comuns">
          <h3 className={styles.routineTitle}>Cuidado com</h3>
          <Markdown root={exercise.mistakes} />
        </section>
      )}

      <fieldset className={styles.question}>
        <legend className={styles.prompt}>Depois de tocar, marque o que você conseguiu:</legend>
        {exercise.checklist.map((item) => (
          <label
            key={item.id}
            className={`${styles.option} ${styles.checkItem}`}
            data-checked={checked[item.id] ?? false}
          >
            <input
              type="checkbox"
              checked={checked[item.id] ?? false}
              disabled={saved !== null}
              onChange={(event) =>
                setChecked((current) => ({ ...current, [item.id]: event.target.checked }))
              }
            />
            {item.text}
          </label>
        ))}
      </fieldset>

      <div className={styles.extras}>
        <label>
          Andamento alcançado (bpm, opcional)
          <input
            type="number"
            inputMode="numeric"
            min={20}
            max={300}
            value={bpm}
            disabled={saved !== null}
            onChange={(event) => setBpm(event.target.value)}
          />
        </label>
        <label>
          Anotação (opcional)
          <input
            type="text"
            value={note}
            disabled={saved !== null}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      {saved ? (
        <div className={styles.result} role="status">
          <strong>
            {saved === 'complete'
              ? 'Registrado! Esta prática conta para o domínio.'
              : 'Registrado. Para contar para o domínio, todos os itens precisam estar marcados.'}
          </strong>
          <button type="button" className="button" onClick={again}>
            Registrar outra prática
          </button>
        </div>
      ) : (
        <button type="submit" className="button primary">
          Registrar prática
        </button>
      )}
    </form>
  )
}

/** Executa um exercício (quiz ou autoavaliação) e registra a tentativa. */
export function ExerciseRunner({
  exercise,
  context = {},
  embedded = false,
}: {
  readonly exercise: Exercise
  readonly context?: AttemptContext
  readonly embedded?: boolean
}) {
  const active = useActiveSession()
  const fullContext: AttemptContext = active ? { ...context, sessionId: active.id } : context
  return (
    <div className={embedded ? `card ${styles.embedded}` : styles.page}>
      {embedded && (
        <div className={styles.embeddedHeader}>
          <span className={styles.kicker}>
            {STAGE_LABEL[exercise.stage]} ·{' '}
            {exercise.type === 'quiz'
              ? exercise.questions.some((q) => q.audio)
                ? 'de ouvido'
                : 'quiz'
              : 'no teclado'}
          </span>
          <Link to={paths.exercise(exercise.id)} className="plain">
            <strong>{exercise.title}</strong>
          </Link>
        </div>
      )}
      {exercise.prompt && <Markdown root={exercise.prompt} />}
      {exercise.type === 'quiz' ? (
        <QuizRunner key={exercise.id} exercise={exercise} context={fullContext} />
      ) : (
        <PerformanceRunner key={exercise.id} exercise={exercise} context={fullContext} />
      )}
      {exercise.challenges.length > 0 && (
        <details className={styles.challenges}>
          <summary>Desafios extras</summary>
          <ul>
            {exercise.challenges.map((challenge) => (
              <li key={challenge}>{challenge}</li>
            ))}
          </ul>
        </details>
      )}
      <CountsFor exercise={exercise} />
    </div>
  )
}
