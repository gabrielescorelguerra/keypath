import type { PerformanceExercise, QuizExercise } from '../catalog/index.ts'
import type { QuizResult, SelfAssessmentResult } from './facts.ts'

export interface QuestionGrade {
  readonly questionId: string
  readonly correct: boolean
}

export interface QuizGrade {
  readonly score: number
  readonly questions: readonly QuestionGrade[]
}

/** Uma questão está certa quando o conjunto escolhido é exatamente o conjunto correto. */
export function gradeQuiz(
  exercise: QuizExercise,
  answers: Readonly<Record<string, readonly number[]>>,
): QuizGrade {
  const questions = exercise.questions.map((question) => {
    const chosen = new Set(answers[question.id] ?? [])
    const correct =
      chosen.size === question.correct.length && question.correct.every((i) => chosen.has(i))
    return { questionId: question.id, correct }
  })
  const right = questions.filter((q) => q.correct).length
  return { score: questions.length === 0 ? 0 : right / questions.length, questions }
}

/** Monta o resultado de quiz que será salvo na tentativa. */
export function quizResult(
  exercise: QuizExercise,
  answers: Readonly<Record<string, readonly number[]>>,
): QuizResult {
  return { type: 'quiz', answers, score: gradeQuiz(exercise, answers).score }
}

/** A autoavaliação conta quando todos os itens do checklist (atual) foram marcados. */
export function isSelfAssessmentComplete(
  exercise: PerformanceExercise,
  result: SelfAssessmentResult,
): boolean {
  return exercise.checklist.every((item) => result.checked[item.id] === true)
}
