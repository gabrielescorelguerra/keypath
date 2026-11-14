import { catalog } from './fixtures.ts'
import { gradeQuiz, isSelfAssessmentComplete, quizResult } from './grading.ts'

const quiz = catalog.exerciseById.get('harmonia.b.quiz')
const exec = catalog.exerciseById.get('harmonia.b.exec')
if (quiz?.type !== 'quiz' || exec?.type !== 'performance') throw new Error('fixture inválida')

describe('gradeQuiz', () => {
  it('conta acertos; múltipla escolha exige o conjunto exato', () => {
    expect(gradeQuiz(quiz, { q1: [0], q2: [2, 0] }).score).toBe(1)
    expect(gradeQuiz(quiz, { q1: [0], q2: [0] }).score).toBe(0.5)
    expect(gradeQuiz(quiz, { q1: [0], q2: [0, 1, 2] }).score).toBe(0.5)
    expect(gradeQuiz(quiz, {}).score).toBe(0)
  })

  it('detalha cada questão e monta o resultado salvo', () => {
    expect(gradeQuiz(quiz, { q1: [1], q2: [0, 2] }).questions).toEqual([
      { questionId: 'q1', correct: false },
      { questionId: 'q2', correct: true },
    ])
    expect(quizResult(quiz, { q1: [0] })).toEqual({
      type: 'quiz',
      answers: { q1: [0] },
      score: 0.5,
    })
  })
})

it('autoavaliação completa só com todos os itens marcados', () => {
  const result = (checked: Record<string, boolean>) => ({
    type: 'self-assessment' as const,
    checked,
  })
  expect(isSelfAssessmentComplete(exec, result({ um: true, dois: true }))).toBe(true)
  expect(isSelfAssessmentComplete(exec, result({ um: true, dois: false }))).toBe(false)
  expect(isSelfAssessmentComplete(exec, result({ um: true }))).toBe(false)
})
