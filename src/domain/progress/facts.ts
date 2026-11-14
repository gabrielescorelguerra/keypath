/**
 * Fatos do usuário: o que aconteceu. São a única coisa persistida (D13);
 * domínio, nível, status e recomendação são derivados deles pelas regras deste módulo.
 * Datas em ISO 8601.
 */

export interface QuizResult {
  readonly type: 'quiz'
  /** Opções escolhidas (índices) por questão. */
  readonly answers: Readonly<Record<string, readonly number[]>>
  /** Aproveitamento de 0 a 1. */
  readonly score: number
}

export interface SelfAssessmentResult {
  readonly type: 'self-assessment'
  /** Itens do checklist marcados como "consigo". */
  readonly checked: Readonly<Record<string, boolean>>
  readonly keysPlayed?: readonly string[]
  readonly bpm?: number
  readonly note?: string
}

export type AttemptResult = QuizResult | SelfAssessmentResult

export interface AttemptContext {
  readonly lessonId?: string
  readonly checkpointId?: string
  /** Sessão de prática em andamento quando a tentativa foi feita. */
  readonly sessionId?: string
}

/** Uma tentativa de exercício. */
export interface Attempt {
  readonly id: string
  readonly exerciseId: string
  readonly startedAt: string
  readonly finishedAt: string
  readonly context: AttemptContext
  readonly result: AttemptResult
}

/** Declaração de conhecimento prévio — no máximo uma por competência. */
export interface Declaration {
  readonly competencyId: string
  readonly declaredAt: string
  readonly note?: string
}

/** Progresso em uma aula — um registro por aula. */
export interface LessonProgress {
  readonly lessonId: string
  readonly startedAt: string
  readonly lastVisitedAt: string
  /** Checkpoints concluídos: id → data. */
  readonly checkpoints: Readonly<Record<string, string>>
  /** Última revisão marcada pelo aluno, depois de concluir a aula. */
  readonly reviewedAt?: string
}

export interface UserFacts {
  readonly attempts: readonly Attempt[]
  readonly declarations: readonly Declaration[]
  readonly lessonProgress: readonly LessonProgress[]
}

export const NO_FACTS: UserFacts = { attempts: [], declarations: [], lessonProgress: [] }
