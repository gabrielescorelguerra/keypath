import { clampBpm, scheduleBeats } from './metronomeSchedule.ts'

it('agenda as batidas no intervalo certo, com acento no 1º tempo', () => {
  const { beats, state } = scheduleBeats({ bpm: 120, beatsPerBar: 3, nextTime: 0, nextBeat: 0 }, 2)
  expect(beats.map((b) => [b.time, b.beat, b.accent])).toEqual([
    [0, 0, true],
    [0.5, 1, false],
    [1, 2, false],
    [1.5, 0, true],
  ])
  expect(state).toMatchObject({ nextTime: 2, nextBeat: 1 })
})

it('continua de onde parou entre chamadas', () => {
  const first = scheduleBeats({ bpm: 60, beatsPerBar: 4, nextTime: 0, nextBeat: 0 }, 1.5)
  const second = scheduleBeats(first.state, 3.5)
  expect([...first.beats, ...second.beats].map((b) => b.beat)).toEqual([0, 1, 2, 3])
})

it('limita o andamento', () => {
  expect(clampBpm(10)).toBe(30)
  expect(clampBpm(400)).toBe(240)
  expect(clampBpm(72.4)).toBe(72)
})
