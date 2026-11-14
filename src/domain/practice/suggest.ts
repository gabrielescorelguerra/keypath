import type { CatalogIndex } from '../catalog/index.ts'
import { localDayKey } from '../progress/dates.ts'
import type { ProgressSnapshot, UserFacts } from '../progress/index.ts'
import type { PracticeSession, Song } from './types.ts'

export type PracticeSuggestion =
  /** Um critério de domínio começado e ainda não cumprido. */
  | {
      readonly kind: 'criterion'
      readonly competencyId: string
      readonly exerciseId: string
      readonly method: 'quiz' | 'self-assessment'
      /** Para autoavaliação em vários dias: quantos faltam. */
      readonly daysLeft: number | null
      readonly bestScore: number | null
    }
  /** Uma música em estudo que não é praticada há algum tempo. */
  | { readonly kind: 'song'; readonly songId: string; readonly lastPracticedAt: string | null }

/** Dias sem praticar uma música em estudo até ela ser sugerida. */
export const SONG_REST_DAYS = 2

/**
 * O que treinar numa sessão de prática:
 * 1. critérios de competências em andamento — autoavaliações que só precisam de mais dias
 *    primeiro (as que já contaram hoje ficam de fora), depois quizzes abaixo do mínimo;
 * 2. músicas "Estudando" sem prática há SONG_REST_DAYS dias ou mais (a mais esquecida antes).
 */
export function practiceSuggestions(
  catalog: CatalogIndex,
  snapshot: ProgressSnapshot,
  facts: UserFacts,
  songs: readonly Song[],
  sessions: readonly PracticeSession[],
  now: Date = new Date(),
  limit = 6,
): readonly PracticeSuggestion[] {
  const today = localDayKey(now.toISOString())
  const practicedToday = new Set(
    facts.attempts.filter((a) => localDayKey(a.finishedAt) === today).map((a) => a.exerciseId),
  )

  const moreDays: PracticeSuggestion[] = []
  const retry: PracticeSuggestion[] = []
  for (const competency of catalog.competencies) {
    const state = snapshot.competencies.get(competency.id)
    if (state?.status !== 'in-progress') continue
    for (const criterion of state.criteria) {
      if (criterion.met || practicedToday.has(criterion.exerciseId)) continue
      if (criterion.method === 'self-assessment') {
        const target = criterion.qualifyingDays > 0 ? moreDays : retry
        target.push({
          kind: 'criterion',
          competencyId: competency.id,
          exerciseId: criterion.exerciseId,
          method: 'self-assessment',
          daysLeft: criterion.requiredDays - criterion.qualifyingDays,
          bestScore: null,
        })
      } else {
        retry.push({
          kind: 'criterion',
          competencyId: competency.id,
          exerciseId: criterion.exerciseId,
          method: 'quiz',
          daysLeft: null,
          bestScore: criterion.bestScore,
        })
      }
    }
  }

  const lastPracticed = new Map<string, string>()
  for (const session of sessions) {
    for (const entry of session.songs) {
      const previous = lastPracticed.get(entry.songId)
      if (!previous || session.startedAt > previous)
        lastPracticed.set(entry.songId, session.startedAt)
    }
  }
  const restMs = SONG_REST_DAYS * 86_400_000
  const songSuggestions: PracticeSuggestion[] = songs
    .filter((song) => song.status === 'learning')
    .map((song) => ({ song, last: lastPracticed.get(song.id) ?? null }))
    .filter(({ last }) => last === null || now.getTime() - Date.parse(last) >= restMs)
    .sort((a, b) => (a.last ?? '').localeCompare(b.last ?? ''))
    .map(({ song, last }) => ({ kind: 'song', songId: song.id, lastPracticedAt: last }))

  // Intercala para a lista não ser só de exercícios nem só de músicas.
  const exercises = [...moreDays, ...retry]
  const result: PracticeSuggestion[] = []
  while (result.length < limit && (exercises.length > 0 || songSuggestions.length > 0)) {
    const exercise = exercises.shift()
    if (exercise) result.push(exercise)
    const song = songSuggestions.shift()
    if (song && result.length < limit) result.push(song)
  }
  return result
}

/** Minutos e dias com prática nos últimos 7 dias (sessões encerradas). */
export function weeklyPractice(
  sessions: readonly PracticeSession[],
  now: Date = new Date(),
): { readonly minutes: number; readonly days: number; readonly sessions: number } {
  const since = now.getTime() - 7 * 86_400_000
  const recent = sessions.filter((s) => s.endedAt !== null && Date.parse(s.startedAt) >= since)
  const minutes = recent.reduce(
    (sum, s) => sum + (Date.parse(s.endedAt ?? s.startedAt) - Date.parse(s.startedAt)) / 60_000,
    0,
  )
  return {
    minutes: Math.round(minutes),
    days: new Set(recent.map((s) => localDayKey(s.startedAt))).size,
    sessions: recent.length,
  }
}
