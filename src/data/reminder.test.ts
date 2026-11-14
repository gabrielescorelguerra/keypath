import { backupReminder, lastActivity } from './reminder.ts'

const now = new Date('2026-11-20T12:00:00Z')

describe('backupReminder', () => {
  it('sem atividade, nada a lembrar', () => {
    expect(backupReminder({ lastBackupAt: null, lastActivityAt: null, now })).toBe('none')
  })

  it('há dados e nunca houve backup', () => {
    expect(
      backupReminder({ lastBackupAt: null, lastActivityAt: '2026-11-19T10:00:00Z', now }),
    ).toBe('never')
  })

  it('lembra só com atividade nova e backup com mais de 7 dias', () => {
    const old = '2026-11-10T10:00:00Z'
    expect(backupReminder({ lastBackupAt: old, lastActivityAt: '2026-11-19T10:00:00Z', now })).toBe(
      'stale',
    )
    expect(backupReminder({ lastBackupAt: old, lastActivityAt: '2026-11-09T10:00:00Z', now })).toBe(
      'none',
    )
    expect(
      backupReminder({
        lastBackupAt: '2026-11-18T10:00:00Z',
        lastActivityAt: '2026-11-19T10:00:00Z',
        now,
      }),
    ).toBe('none')
  })
})

it('lastActivity pega a data mais recente entre os fatos', () => {
  expect(
    lastActivity({
      attempts: [{ finishedAt: '2026-11-02T00:00:00Z' }],
      declarations: [{ declaredAt: '2026-11-05T00:00:00Z' }],
      lessonProgress: [{ lastVisitedAt: '2026-11-03T00:00:00Z' }],
    }),
  ).toBe('2026-11-05T00:00:00Z')
  expect(lastActivity({ attempts: [], declarations: [], lessonProgress: [] })).toBeNull()
})
