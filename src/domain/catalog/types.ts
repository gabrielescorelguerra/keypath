import type { Root } from 'mdast'

/**
 * Catálogo de conteúdo compilado — o que o app consome.
 * Gerado no build a partir de content/ (ver scripts/content). Somente leitura.
 */

export type MarkdownRoot = Root

export type TrackKind = 'discipline' | 'application'

export interface Track {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly kind: TrackKind
}

export type LevelNumber = 1 | 2 | 3 | 4 | 5

export interface Level {
  readonly number: LevelNumber
  readonly name: string
}

export interface Style {
  readonly id: string
  readonly name: string
}

/** Métodos de verificação. `performance` (MIDI) e `review` (revisão) estão reservados. */
export type MasteryMethod = 'quiz' | 'self-assessment'

export interface MasteryCriterion {
  readonly id: string
  readonly method: MasteryMethod
  readonly exercise: string
  /** Aproveitamento mínimo (0–1) — só para quiz. */
  readonly minScore: number
  /** Em quantos dias diferentes o critério precisa ser cumprido. */
  readonly distinctDays: number
}

export interface Competency {
  readonly id: string
  readonly track: string
  readonly level: LevelNumber
  readonly title: string
  readonly description: string
  readonly core: boolean
  readonly prerequisites: readonly string[]
  readonly concepts: readonly string[]
  readonly styles: readonly string[]
  readonly mastery: readonly MasteryCriterion[]
  /** Ordem de cadastro (trilhas na ordem da configuração, competências na ordem do arquivo). */
  readonly order: number
}

export interface Concept {
  readonly id: string
  readonly title: string
  readonly aliases: readonly string[]
  readonly summary: string
  readonly tracks: readonly string[]
  readonly styles: readonly string[]
  readonly related: readonly string[]
  readonly body: MarkdownRoot
}

export interface Checkpoint {
  readonly id: string
  readonly title: string
  readonly body: MarkdownRoot
}

export interface Lesson {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly track: string
  readonly competencies: readonly string[]
  readonly styles: readonly string[]
  readonly estimatedMinutes: number | null
  readonly intro: MarkdownRoot
  readonly checkpoints: readonly Checkpoint[]
  /** Derivado: maior nível entre as competências trabalhadas. */
  readonly level: LevelNumber
  /** Derivado: pré-requisitos das competências trabalhadas, menos elas mesmas. */
  readonly prerequisites: readonly string[]
}

export type QuestionKind = 'single-choice' | 'multiple-choice'

export interface Question {
  readonly id: string
  readonly kind: QuestionKind
  readonly prompt: string
  readonly options: readonly string[]
  /** Índices (a partir de 0) das opções corretas. */
  readonly correct: readonly number[]
  readonly explanation: string | null
}

export interface ChecklistItem {
  readonly id: string
  readonly text: string
}

export type Hands = 'left' | 'right' | 'both'

export interface PerformanceParameters {
  readonly keys: readonly string[]
  readonly targetBpm: number | null
  readonly hands: Hands | null
}

interface ExerciseBase {
  readonly id: string
  readonly title: string
  readonly prompt: MarkdownRoot | null
  readonly competencies: readonly string[]
  readonly styles: readonly string[]
}

export interface QuizExercise extends ExerciseBase {
  readonly type: 'quiz'
  readonly questions: readonly Question[]
}

export interface PerformanceExercise extends ExerciseBase {
  readonly type: 'performance'
  readonly parameters: PerformanceParameters
  readonly checklist: readonly ChecklistItem[]
}

export type Exercise = QuizExercise | PerformanceExercise
export type ExerciseType = Exercise['type']

export interface Catalog {
  readonly tracks: readonly Track[]
  readonly levels: readonly Level[]
  readonly styles: readonly Style[]
  readonly competencies: readonly Competency[]
  readonly concepts: readonly Concept[]
  readonly lessons: readonly Lesson[]
  readonly exercises: readonly Exercise[]
}
