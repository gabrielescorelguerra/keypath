import { bMastered, catalog, day, facts, quizAttempt, selfAttempt } from '../progress/fixtures.ts'
import { computeProgress } from '../progress/progress.ts'
import { practiceSuggestions, weeklyPractice } from './suggest.ts'
import type { PracticeSession, Song } from './types.ts'

const song = (id: string, status: Song['status'] = 'learning'): Song => ({
  id,
  title: id,
  artist: null,
  key: null,
  bpm: null,
  styles: [],
  competencies: [],
  status,
  notes: '',
  createdAt: day(1),
  updatedAt: day(1),
})

const session = (
  startedAt: string,
  endedAt: string | null,
  songs: string[] = [],
): PracticeSession => ({
  id: startedAt,
  startedAt,
  endedAt,
  focus: null,
  songs: songs.map((songId) => ({ songId, minutes: 10, note: '' })),
  notes: '',
})

const NOW = new Date(2026, 10, 10, 18)

describe('practiceSuggestions', () => {
  it('sugere critérios começados: primeiro os que só precisam de mais dias', () => {
    const f = facts({
      declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }],
      attempts: [
        quizAttempt('harmonia.b.quiz', 0.5, day(8)),
        selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(8)),
      ],
    })
    const list = practiceSuggestions(catalog, computeProgress(catalog, f), f, [], [], NOW)
    expect(list).toEqual([
      {
        kind: 'criterion',
        competencyId: 'harmonia.b',
        exerciseId: 'harmonia.b.exec',
        method: 'self-assessment',
        daysLeft: 1,
        bestScore: null,
      },
      {
        kind: 'criterion',
        competencyId: 'harmonia.b',
        exerciseId: 'harmonia.b.quiz',
        method: 'quiz',
        daysLeft: null,
        bestScore: 0.5,
      },
    ])
  })

  it('não sugere o que já foi praticado hoje nem competências não começadas', () => {
    const f = facts({
      declarations: [{ competencyId: 'teoria.a', declaredAt: day(1) }],
      attempts: [selfAttempt('harmonia.b.exec', { um: true, dois: true }, day(10, 9))],
    })
    const list = practiceSuggestions(catalog, computeProgress(catalog, f), f, [], [], NOW)
    expect(list.map((s) => (s.kind === 'criterion' ? s.exerciseId : s.songId))).toEqual([
      'harmonia.b.quiz',
    ])
  })

  it('sugere músicas em estudo sem prática recente, a mais esquecida primeiro, intercaladas', () => {
    const songs = [song('nunca'), song('ontem'), song('semana'), song('pronta', 'ready')]
    const sessions = [
      session(day(9), day(9, 11), ['ontem']),
      session(day(3), day(3, 11), ['semana']),
    ]
    const list = practiceSuggestions(
      catalog,
      computeProgress(catalog, bMastered),
      bMastered,
      songs,
      sessions,
      NOW,
    )
    expect(list).toEqual([
      { kind: 'song', songId: 'nunca', lastPracticedAt: null },
      { kind: 'song', songId: 'semana', lastPracticedAt: day(3) },
    ])
  })
})

it('weeklyPractice soma minutos e dias dos últimos 7 dias', () => {
  const sessions = [
    session(day(9, 10), new Date(2026, 10, 9, 10, 30).toISOString()),
    session(day(9, 20), new Date(2026, 10, 9, 20, 15).toISOString()),
    session(day(1, 10), new Date(2026, 10, 1, 11).toISOString()), // fora da semana
    session(day(10, 17), null), // em andamento
  ]
  expect(weeklyPractice(sessions, NOW)).toEqual({ minutes: 45, days: 1, sessions: 2 })
})
