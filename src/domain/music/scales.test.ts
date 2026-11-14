import { MusicParseError } from './errors'
import { MAJOR_KEYS, MINOR_KEYS, parseKey } from './keys'
import { chroma } from './notes'
import { SCALE_TYPES, isScaleType, scaleNotes, type ScaleType } from './scales'

describe('scaleNotes', () => {
  it.each<[string, ScaleType, string]>([
    ['C', 'major', 'C D E F G A B'],
    ['F#', 'major', 'F# G# A# B C# D# E#'],
    ['Db', 'major', 'Db Eb F Gb Ab Bb C'],
    ['A', 'natural-minor', 'A B C D E F G'],
    ['A', 'harmonic-minor', 'A B C D E F G#'],
    ['A', 'melodic-minor', 'A B C D E F# G#'],
    ['D', 'dorian', 'D E F G A B C'],
    ['G', 'mixolydian', 'G A B C D E F'],
    ['C', 'major-pentatonic', 'C D E G A'],
    ['A', 'minor-pentatonic', 'A C D E G'],
    ['A', 'blues', 'A C D Eb E G'],
  ])('%s %s', (root, type, expected) => {
    expect(scaleNotes(root, type).join(' ')).toBe(expected)
  })

  it('toda escala maior das 12 tonalidades usa as 7 letras uma vez', () => {
    for (const key of MAJOR_KEYS) {
      const notes = scaleNotes(key, 'major')
      expect(new Set(notes.map((n) => n[0])).size).toBe(7)
      const steps = notes.map((n, i) => (chroma(notes[(i + 1) % 7] ?? n) - chroma(n) + 12) % 12)
      expect(steps).toEqual([2, 2, 1, 2, 2, 2, 1])
    }
  })

  it('todos os tipos têm nome em português', () => {
    for (const type of Object.keys(SCALE_TYPES)) {
      expect(isScaleType(type)).toBe(true)
      expect(SCALE_TYPES[type as ScaleType].name).not.toBe('')
    }
    expect(isScaleType('xyz')).toBe(false)
  })
})

describe('parseKey', () => {
  it('lê maior e menor', () => {
    expect(parseKey('G')).toEqual({ tonic: 'G', mode: 'major' })
    expect(parseKey('Em')).toEqual({ tonic: 'E', mode: 'minor' })
    expect(parseKey('B♭')).toEqual({ tonic: 'Bb', mode: 'major' })
    expect(parseKey('F#m')).toEqual({ tonic: 'F#', mode: 'minor' })
  })

  it.each(['Gmaj', 'H', '', 'em'])('rejeita %j', (input) => {
    expect(() => parseKey(input)).toThrow(MusicParseError)
  })

  it('tem 12 tonalidades maiores e 12 menores, todas distintas', () => {
    expect(new Set(MAJOR_KEYS.map(chroma)).size).toBe(12)
    expect(new Set(MINOR_KEYS.map(chroma)).size).toBe(12)
  })
})
