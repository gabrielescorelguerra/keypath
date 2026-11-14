import { envelopePoints, isPresetId, PRESETS } from './patch.ts'

it('envelopePoints desenha ataque, queda, sustentação e release', () => {
  expect(envelopePoints({ attack: 0.5, decay: 0.25, sustain: 0.6, release: 1 }, 0.5)).toEqual([
    [0, 0],
    [0.5, 1],
    [0.75, 0.6],
    [1.25, 0.6],
    [2.25, 0],
  ])
})

it('presets válidos: pluck sem sustain, pad com ataque lento', () => {
  expect(isPresetId('pad')).toBe(true)
  expect(isPresetId('piano')).toBe(false)
  expect(PRESETS.pluck.patch.sustain).toBe(0)
  expect(PRESETS.pad.patch.attack).toBeGreaterThan(PRESETS.pluck.patch.attack)
})
