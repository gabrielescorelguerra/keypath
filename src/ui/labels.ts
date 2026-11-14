import { catalog } from '@/content'
import type { MasteryMethod } from '@/domain/catalog'
import type { CompetencyStatus, LessonStatus, StudyStatus } from '@/domain/progress'

export const COMPETENCY_STATUS: Record<
  CompetencyStatus,
  { readonly label: string; readonly tone: 'success' | 'accent' | 'warning' | 'neutral' }
> = {
  mastered: { label: 'Dominada', tone: 'success' },
  declared: { label: 'Declarada', tone: 'success' },
  'in-progress': { label: 'Em andamento', tone: 'accent' },
  'not-started': { label: 'Não iniciada', tone: 'neutral' },
}

export const LESSON_STATUS: Record<LessonStatus, string> = {
  completed: 'Concluída',
  'in-progress': 'Em andamento',
  'not-started': 'Não iniciada',
}

export const STUDY_STATUS: Record<
  StudyStatus,
  { readonly label: string; readonly tone: 'success' | 'accent' | 'review' | 'neutral' | 'muted' }
> = {
  new: { label: 'Novo', tone: 'neutral' },
  'in-progress': { label: 'Em andamento', tone: 'accent' },
  completed: { label: 'Concluído', tone: 'success' },
  review: { label: 'Revisar', tone: 'review' },
  advanced: { label: 'Avançado', tone: 'muted' },
  upcoming: { label: 'Em preparação', tone: 'muted' },
}

/** "cerca de 1 h 30 min" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export const METHOD_LABEL: Record<MasteryMethod, string> = {
  quiz: 'Quiz',
  'self-assessment': 'Autoavaliação no teclado',
}

export function levelName(level: number): string {
  return catalog.levels.find((l) => l.number === level)?.name ?? ''
}

/** "Sem nível" ou "Nível 2 · Básico desenvolvido". */
export function trackLevelLabel(level: number): string {
  return level === 0 ? 'Sem nível' : `Nível ${level} · ${levelName(level)}`
}

/** Níveis (1–5) sem nenhuma competência essencial cadastrada na trilha. */
export function emptyLevels(trackId: string): readonly number[] {
  const core = (catalog.competenciesByTrack.get(trackId) ?? []).filter((c) => c.core)
  return [1, 2, 3, 4, 5].filter((n) => !core.some((c) => c.level === n))
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
