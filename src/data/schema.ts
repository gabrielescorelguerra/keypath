import * as z from 'zod'

/**
 * Schemas dos dados do usuário — usados para validar backups importados.
 * Objetos não estritos: campos extras são descartados.
 */

const isoDate = z.iso.datetime({ offset: true, message: 'data inválida' })
const id = z.string().min(1)

const quizResultSchema = z.object({
  type: z.literal('quiz'),
  answers: z.record(z.string(), z.array(z.number().int().min(0))),
  score: z.number().min(0).max(1),
})

const selfAssessmentResultSchema = z.object({
  type: z.literal('self-assessment'),
  checked: z.record(z.string(), z.boolean()),
  keysPlayed: z.array(z.string()).optional(),
  bpm: z.number().positive().optional(),
  note: z.string().optional(),
})

export const attemptSchema = z.object({
  id,
  exerciseId: id,
  startedAt: isoDate,
  finishedAt: isoDate,
  context: z.object({ lessonId: id.optional(), checkpointId: id.optional() }).default({}),
  result: z.discriminatedUnion('type', [quizResultSchema, selfAssessmentResultSchema]),
})

export const declarationSchema = z.object({
  competencyId: id,
  declaredAt: isoDate,
  note: z.string().optional(),
})

export const lessonProgressSchema = z.object({
  lessonId: id,
  startedAt: isoDate,
  lastVisitedAt: isoDate,
  checkpoints: z.record(z.string(), isoDate),
})

export const settingsSchema = z.object({
  noteNaming: z.enum(['latin', 'letters', 'both']).default('both'),
  soundEnabled: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(0.8),
})

const nullableText = z.string().nullable().default(null)

export const songSchema = z.object({
  id,
  title: z.string().min(1),
  artist: nullableText,
  key: nullableText,
  bpm: z.number().positive().nullable().default(null),
  styles: z.array(z.string()).default([]),
  competencies: z.array(z.string()).default([]),
  status: z.enum(['wishlist', 'learning', 'ready', 'repertoire']).default('learning'),
  notes: z.string().default(''),
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const attachmentSchema = z.object({
  id,
  songId: id,
  kind: z.enum(['pdf', 'image', 'midi', 'youtube']),
  name: z.string(),
  blobId: z.string().nullable().default(null),
  mimeType: nullableText,
  size: z.number().nonnegative().nullable().default(null),
  url: nullableText,
  startSeconds: z.number().nonnegative().nullable().default(null),
  createdAt: isoDate,
})

export const practiceSessionSchema = z.object({
  id,
  startedAt: isoDate,
  endedAt: isoDate.nullable().default(null),
  focus: nullableText,
  songs: z
    .array(
      z.object({ songId: id, minutes: z.number().nonnegative(), note: z.string().default('') }),
    )
    .default([]),
  notes: z.string().default(''),
})

export const backupDataSchema = z.object({
  attempts: z.array(attemptSchema),
  declarations: z.array(declarationSchema),
  lessonProgress: z.array(lessonProgressSchema),
  settings: settingsSchema.default({ noteNaming: 'both', soundEnabled: true, volume: 0.8 }),
  songs: z.array(songSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  practiceSessions: z.array(practiceSessionSchema).default([]),
})
