import { parseChord } from './chords.ts'
import { parseDegree } from './degrees.ts'
import {
  chordQualityName,
  formatChord,
  formatDegree,
  formatPitchClass,
  prettyAccidentals,
} from './format.ts'

describe('formatPitchClass', () => {
  it('padrão: os dois nomes', () => {
    expect(formatPitchClass('C')).toBe('Dó (C)')
    expect(formatPitchClass('C#')).toBe('Dó♯ (C♯)')
    expect(formatPitchClass('Bb')).toBe('Si♭ (B♭)')
  })

  it('só latino ou só letras', () => {
    expect(formatPitchClass('Eb', 'latin')).toBe('Mi♭')
    expect(formatPitchClass('Eb', 'letters')).toBe('E♭')
    expect(formatPitchClass('F', 'latin')).toBe('Fá')
    expect(formatPitchClass('A', 'latin')).toBe('Lá')
  })

  it('dobrados', () => {
    expect(formatPitchClass('Bbb', 'letters')).toBe('B𝄫')
    expect(formatPitchClass('F##', 'latin')).toBe('Fá𝄪')
  })
})

describe('formatChord (cifra brasileira)', () => {
  it.each([
    ['Cmaj7', 'C7M'],
    ['Bbmaj7', 'B♭7M'],
    ['Am7b5', 'Am7(♭5)'],
    ['Bdim', 'B°'],
    ['Cdim7', 'C°7'],
    ['G7sus4', 'G7(4)'],
    ['Cadd9', 'C(9)'],
    ['C9', 'C7(9)'],
    ['CmMaj7', 'Cm(7M)'],
    ['F#m', 'F♯m'],
    ['C/E', 'C/E'],
    ['Eb/Bb', 'E♭/B♭'],
  ])('%s → %s', (symbol, expected) => {
    expect(formatChord(parseChord(symbol))).toBe(expected)
  })
})

describe('formatDegree', () => {
  it.each([
    ['iv', 'IVm'],
    ['bVI7M', '♭VI7M'],
    ['iiø', 'IIm7(♭5)'],
    ['vii°', 'VII°'],
    ['I/III', 'I/III'],
  ])('%s → %s', (input, expected) => {
    expect(formatDegree(parseDegree(input))).toBe(expected)
  })
})

it('prettyAccidentals', () => {
  expect(prettyAccidentals('m7(b5)')).toBe('m7(♭5)')
  expect(prettyAccidentals('7(#9)')).toBe('7(♯9)')
})

it('nome da qualidade em português', () => {
  expect(chordQualityName('m7b5')).toBe('meio-diminuto')
})
