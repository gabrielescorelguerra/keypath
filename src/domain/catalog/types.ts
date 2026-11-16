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
  readonly stage: LessonStage | null
  readonly body: MarkdownRoot
}

export type MaterialKind =
  'video' | 'article' | 'interactive' | 'course' | 'sheet' | 'backing-track' | 'song' | 'docs'

/** Para que serve o material: entender, ver aplicado, ouvir, praticar. */
export type MaterialPurpose = 'understand' | 'see' | 'listen' | 'practice'

export interface Material {
  readonly title: string
  readonly url: string
  readonly source: string
  readonly kind: MaterialKind
  readonly purpose: MaterialPurpose
  readonly language: 'pt' | 'en' | 'es'
  readonly note: string | null
}

/** Etapa da aula a que uma parte pertence (a introdução, o aprofundamento e o próximo passo são gerados). */
export type LessonStage = 'fundamentos' | 'visualizacao' | 'aplicacao' | 'pratica' | 'revisao'

/** Música para aprender, sugerida pela aula. */
export interface LessonSong {
  readonly title: string
  readonly artist: string
  readonly learn: string
  readonly key: string | null
  readonly publicDomain: boolean
}

export interface Lesson {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly track: string
  readonly competencies: readonly string[]
  readonly styles: readonly string[]
  readonly estimatedMinutes: number | null
  readonly why: string | null
  readonly materials: readonly Material[]
  readonly songs: readonly LessonSong[]
  readonly intro: MarkdownRoot
  readonly checkpoints: readonly Checkpoint[]
  /** Derivado: maior nível entre as competências trabalhadas. */
  readonly level: LevelNumber
  /** Derivado: pré-requisitos das competências trabalhadas, menos elas mesmas. */
  readonly prerequisites: readonly string[]
}

export type QuestionKind = 'single-choice' | 'multiple-choice'

export interface QuestionAudio {
  readonly notes: string | null
  readonly chord: string | null
  readonly play: 'together' | 'arpeggio' | 'melody'
}

export interface Question {
  readonly id: string
  readonly kind: QuestionKind
  readonly prompt: string
  /** Questão de percepção: o som a ouvir. */
  readonly audio: QuestionAudio | null
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

export interface Backing {
  readonly key: string
  readonly degrees: string
  readonly beatsPerChord: number
}

export interface PerformanceParameters {
  readonly keys: readonly string[]
  readonly targetBpm: number | null
  readonly startBpm: number | null
  readonly bpmStep: number | null
  readonly hands: Hands | null
  readonly backing: Backing | null
}

/** Reconhecimento → execução → aplicação → criatividade. */
export type ExerciseStage = 'recognition' | 'execution' | 'application' | 'creativity'

interface ExerciseBase {
  readonly id: string
  readonly title: string
  readonly prompt: MarkdownRoot | null
  readonly competencies: readonly string[]
  readonly styles: readonly string[]
  readonly stage: ExerciseStage
  readonly challenges: readonly string[]
}

export interface QuizExercise extends ExerciseBase {
  readonly type: 'quiz'
  readonly questions: readonly Question[]
}

export interface PerformanceExercise extends ExerciseBase {
  readonly type: 'performance'
  readonly parameters: PerformanceParameters
  /** Tempo estimado de uma sessão, em minutos. */
  readonly minutes: number | null
  /** Roteiro passo a passo (lista numerada). */
  readonly routine: MarkdownRoot | null
  /** Erros comuns (lista). */
  readonly mistakes: MarkdownRoot | null
  readonly checklist: readonly ChecklistItem[]
}

export type Exercise = QuizExercise | PerformanceExercise
export type ExerciseType = Exercise['type']

export interface Module {
  /** "<curso>.<módulo>" */
  readonly id: string
  readonly course: string
  readonly title: string
  readonly summary: string
  readonly level: LevelNumber
  readonly prerequisites: readonly string[]
  readonly lessons: readonly string[]
  readonly upcoming: readonly string[]
  readonly style: string | null
  /** Derivado: soma do tempo estimado das aulas (null se nenhuma informa). */
  readonly estimatedMinutes: number | null
}

/** Curso: uma área de estudo organizada em módulos, na ordem recomendada. */
export interface Course {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly modules: readonly Module[]
}

export interface Catalog {
  readonly tracks: readonly Track[]
  readonly levels: readonly Level[]
  readonly styles: readonly Style[]
  readonly competencies: readonly Competency[]
  readonly concepts: readonly Concept[]
  readonly lessons: readonly Lesson[]
  readonly exercises: readonly Exercise[]
  readonly courses: readonly Course[]
}
