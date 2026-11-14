import { parseChord } from './chords.ts'
import { chordToneLabels, degreeLabel, intervalLabel, labelNotes } from './intervals.ts'

it('degreeLabel lê intervalos como graus de cifra', () => {
  expect(
    ['1P', '3m', '3M', '5d', '5P', '5A', '7m', '7M', '7d', '9M', '9m', '11A', '13M'].map(
      degreeLabel,
    ),
  ).toEqual(['1', '♭3', '3', '♭5', '5', '♯5', '♭7', '7', '𝄫7', '9', '♭9', '♯11', '13'])
})

it('intervalLabel mede dentro da oitava', () => {
  expect(intervalLabel('C', 'Eb')).toBe('♭3')
  expect(intervalLabel('D', 'C')).toBe('♭7')
  expect(intervalLabel('E', 'A#')).toBe('♯4')
})

it('chordToneLabels mantém as extensões (9, não 2)', () => {
  const labels = chordToneLabels(parseChord('Cm9'))
  expect([...labels.values()]).toEqual(['1', '♭3', '5', '♭7', '9'])
  expect(labelNotes(['D5', 'Eb4'], labels)).toEqual(
    new Map([
      ['D5', '9'],
      ['Eb4', '♭3'],
    ]),
  )
})
