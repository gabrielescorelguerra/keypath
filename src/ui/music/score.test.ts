import { chordScore, sequenceScore, stepStarts } from './score.ts'

describe('chordScore', () => {
  it('toca o acorde junto em tempo normal', () => {
    expect(chordScore([67, 60, 64], false)).toEqual([{ midis: [67, 60, 64], at: 0, seconds: 1.6 }])
  })

  it('em câmera lenta arpeja de baixo para cima e termina tudo junto', () => {
    const events = chordScore([67, 60, 64], true)
    expect(events.map((e) => e.midis[0])).toEqual([60, 64, 67])
    const ends = events.map((e) => +(e.at + e.seconds).toFixed(6))
    expect(new Set(ends).size).toBe(1)
    expect(events[1]?.at).toBeGreaterThan(0)
  })
})

describe('sequenceScore', () => {
  it('mantém o passo em tempo normal', () => {
    expect(sequenceScore([[60], [62]], 0.4, false).map((e) => e.at)).toEqual([0, 0.4])
  })

  it('estica o passo em câmera lenta', () => {
    const events = sequenceScore([[60], [62]], 0.4, true)
    expect(events.map((e) => e.at)).toEqual([0, 1])
    expect(stepStarts(2, 0.4, true)).toEqual([0, 1])
  })

  it('arpeja levemente os acordes em câmera lenta, sem passar do passo', () => {
    const events = sequenceScore([[64, 60, 67], [65]], 0.9, true)
    expect(events).toHaveLength(4)
    expect(events.slice(0, 3).map((e) => e.midis[0])).toEqual([60, 64, 67])
    expect(Math.max(...events.slice(0, 3).map((e) => e.at))).toBeLessThan(2.25)
  })
})
