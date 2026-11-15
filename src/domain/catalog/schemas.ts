import * as z from 'zod'

/**
 * Schemas dos arquivos de content/. Objetos são estritos: chave desconhecida é erro
 * (pega erros de digitação como "prerequisite" no lugar de "prerequisites").
 */

z.config(z.locales.pt())

/** "harmonia", "campo-harmonico" */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** "harmonia.triades", "harmonia.campo-maior.quiz" */
export const DOTTED_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/

const slug = z
  .string()
  .regex(SLUG_RE, 'use letras minúsculas, números e hífens (ex.: "campo-harmonico")')
const dottedId = z
  .string()
  .regex(DOTTED_ID_RE, 'use o formato "<trilha>.<nome>" (ex.: "harmonia.triades")')
const text = z.string().trim().min(1)
const list = <T extends z.ZodType>(item: T) => z.array(item).default([])

export const trackSchema = z.strictObject({
  id: slug,
  name: text,
  description: text,
  kind: z.enum(['discipline', 'application']),
})
export const tracksFileSchema = z.array(trackSchema).min(1)

export const levelSchema = z.strictObject({
  number: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  name: text,
})
export const levelsFileSchema = z.array(levelSchema).length(5)

export const styleSchema = z.strictObject({ id: slug, name: text })
export const stylesFileSchema = z.array(styleSchema)

const reservedMethod = z.enum(['performance', 'review']).transform((_, ctx) => {
  ctx.addIssue({
    code: 'custom',
    message: 'método reservado para uma etapa futura (MIDI / revisão espaçada)',
  })
  return z.NEVER
})

export const masteryCriterionSchema = z.strictObject({
  id: slug,
  method: z.union([z.enum(['quiz', 'self-assessment']), reservedMethod]),
  exercise: dottedId,
  minScore: z.number().min(0).max(1).optional(),
  distinctDays: z.number().int().min(1).default(1),
})

export const competencySchema = z.strictObject({
  id: dottedId,
  track: slug,
  level: levelSchema.shape.number,
  title: text,
  description: text,
  core: z.boolean().default(true),
  prerequisites: list(dottedId),
  concepts: list(slug),
  styles: list(slug),
  mastery: z
    .array(masteryCriterionSchema)
    .min(1, 'toda competência precisa de pelo menos um critério'),
})
export const competenciesFileSchema = z.array(competencySchema)

export const conceptFrontmatterSchema = z.strictObject({
  id: slug,
  title: text,
  aliases: list(text),
  summary: text,
  tracks: list(slug),
  styles: list(slug),
  related: list(slug),
})

/** Material externo de aprofundamento (vídeo, artigo, partitura…), separado por finalidade. */
export const materialSchema = z.strictObject({
  title: text,
  url: z.url({ protocol: /^https$/, error: 'use um endereço https:// completo' }),
  source: text,
  kind: z.enum([
    'video',
    'article',
    'interactive',
    'course',
    'sheet',
    'backing-track',
    'song',
    'docs',
  ]),
  purpose: z.enum(['understand', 'see', 'listen', 'practice']),
  language: z.enum(['pt', 'en', 'es']).default('en'),
  note: text.optional(),
})

export const lessonFrontmatterSchema = z.strictObject({
  id: dottedId,
  title: text,
  summary: text,
  track: slug,
  competencies: z.array(dottedId).min(1),
  styles: list(slug),
  estimatedMinutes: z.number().int().positive().optional(),
  /** Por que isto importa — mostrado na introdução. */
  why: text.optional(),
  materials: list(materialSchema),
})

const moduleSchema = z.strictObject({
  id: slug,
  title: text,
  summary: text,
  level: levelSchema.shape.number,
  /** Módulos recomendados antes ("<curso>.<módulo>"). */
  prerequisites: list(dottedId),
  /** Aulas do módulo, na ordem de estudo. */
  lessons: list(dottedId),
  /** Tópicos planejados que ainda não têm aula. */
  upcoming: list(text),
  style: slug.optional(),
})

export const courseSchema = z.strictObject({
  id: slug,
  title: text,
  summary: text,
  order: z.number().int().min(0),
  modules: z.array(moduleSchema).min(1),
})

/** Som tocado numa questão de percepção: notas (C4 E4 G4) ou uma cifra. */
const questionAudioSchema = z
  .strictObject({
    notes: text.optional(),
    chord: text.optional(),
    play: z.enum(['together', 'arpeggio', 'melody']).default('together'),
  })
  .refine((a) => (a.notes === undefined) !== (a.chord === undefined), {
    message: 'informe notes ou chord (um dos dois)',
  })

const questionSchema = z
  .strictObject({
    id: slug,
    kind: z.enum(['single-choice', 'multiple-choice']),
    prompt: text,
    audio: questionAudioSchema.optional(),
    options: z.array(text).min(2),
    correct: z.array(z.number().int().min(0)).min(1),
    explanation: text.optional(),
  })
  .superRefine((question, ctx) => {
    if (question.correct.some((index) => index >= question.options.length)) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct'],
        message: `índice fora das opções (há ${question.options.length} opções, contando a partir de 0)`,
      })
    }
    if (new Set(question.correct).size !== question.correct.length) {
      ctx.addIssue({ code: 'custom', path: ['correct'], message: 'índice repetido' })
    }
    if (question.kind === 'single-choice' && question.correct.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct'],
        message: 'escolha única precisa de exatamente uma resposta correta',
      })
    }
  })

export const LESSON_STAGES = [
  'fundamentos',
  'visualizacao',
  'aplicacao',
  'pratica',
  'revisao',
] as const

export const EXERCISE_STAGES = ['recognition', 'execution', 'application', 'creativity'] as const

const exerciseBase = {
  id: dottedId,
  title: text,
  prompt: text.optional(),
  competencies: z.array(dottedId).min(1),
  styles: list(slug),
  /** Etapa: reconhecimento, execução, aplicação ou criatividade. */
  stage: z.enum(EXERCISE_STAGES).optional(),
  /** Desafios extras, para quem já cumpriu o exercício. */
  challenges: list(text),
}

export const quizExerciseSchema = z.strictObject({
  ...exerciseBase,
  type: z.literal('quiz'),
  questions: z.array(questionSchema).min(1),
})

export const performanceExerciseSchema = z.strictObject({
  ...exerciseBase,
  type: z.literal('performance'),
  parameters: z
    .strictObject({
      keys: list(text),
      targetBpm: z.number().int().min(20).max(300).optional(),
      /** Andamento para começar; sobe `bpmStep` a cada execução limpa até o alvo. */
      startBpm: z.number().int().min(20).max(300).optional(),
      bpmStep: z.number().int().min(1).max(40).optional(),
      hands: z.enum(['left', 'right', 'both']).optional(),
      /** Acompanhamento para tocar junto: progressão em graus, em loop. */
      backing: z
        .strictObject({
          key: text,
          degrees: text,
          beatsPerChord: z.number().int().min(1).max(8).default(4),
        })
        .optional(),
    })
    .default({ keys: [] }),
  /** Tempo estimado de uma sessão do exercício, em minutos. */
  minutes: z.number().int().min(1).max(120).optional(),
  /** Roteiro: os passos de uma sessão, em ordem (Markdown em linha). */
  routine: list(text),
  /** Erros comuns e como evitá-los (Markdown em linha). */
  mistakes: list(text),
  checklist: z.array(z.strictObject({ id: slug, text })).min(1),
})

export const exerciseSchema = z.discriminatedUnion('type', [
  quizExerciseSchema,
  performanceExerciseSchema,
])

export type TrackSource = z.output<typeof trackSchema>
export type LevelSource = z.output<typeof levelSchema>
export type StyleSource = z.output<typeof styleSchema>
export type CompetencySource = z.output<typeof competencySchema>
export type ConceptFrontmatter = z.output<typeof conceptFrontmatterSchema>
export type LessonFrontmatter = z.output<typeof lessonFrontmatterSchema>
export type ExerciseSource = z.output<typeof exerciseSchema>
export type CourseSource = z.output<typeof courseSchema>

/** Converte os erros do Zod em mensagens "campo.subcampo: mensagem". */
export function formatSchemaIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}
