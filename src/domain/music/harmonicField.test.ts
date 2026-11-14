import { degreeToString } from './degrees.ts'
import { formatChord } from './format.ts'
import { harmonicField } from './harmonicField.ts'
import { MAJOR_KEYS, MINOR_KEYS } from './keys.ts'
import { scaleNotes } from './scales.ts'

const degreesOf = (field: ReturnType<typeof harmonicField>) =>
  field.map((c) => degreeToString(c.degree)).join(' ')

describe('harmonicField', () => {
  it('campo maior de Dó, tríades', () => {
    const field = harmonicField('C', 'major', 'triads')
    expect(field.map((c) => c.chord.symbol).join(' ')).toBe('C Dm Em F G Am Bdim')
    expect(degreesOf(field)).toBe('I IIm IIIm IV V VIm VII°')
  })

  it('campo maior de Dó, tétrades', () => {
    const field = harmonicField('C', 'major', 'sevenths')
    expect(field.map((c) => formatChord(c.chord)).join(' ')).toBe('C7M Dm7 Em7 F7M G7 Am7 Bm7(♭5)')
  })

  it('o mesmo padrão de graus nas 12 tonalidades maiores, com grafia da escala', () => {
    for (const tonic of MAJOR_KEYS) {
      const triads = harmonicField(tonic, 'major', 'triads')
      expect(degreesOf(triads)).toBe('I IIm IIIm IV V VIm VII°')
      expect(triads.map((c) => c.chord.root)).toEqual(scaleNotes(tonic, 'major'))

      const sevenths = harmonicField(tonic, 'major', 'sevenths')
      expect(degreesOf(sevenths)).toBe('I7M IIm7 IIIm7 IV7M V7 VIm7 VIIm7(b5)')
    }
  })

  it('campos menores nas 12 tonalidades menores', () => {
    for (const tonic of MINOR_KEYS) {
      expect(degreesOf(harmonicField(tonic, 'natural-minor', 'triads'))).toBe(
        'Im II° bIII IVm Vm bVI bVII',
      )
      expect(degreesOf(harmonicField(tonic, 'natural-minor', 'sevenths'))).toBe(
        'Im7 IIm7(b5) bIII7M IVm7 Vm7 bVI7M bVII7',
      )
      expect(degreesOf(harmonicField(tonic, 'harmonic-minor', 'triads'))).toBe(
        'Im II° bIII+ IVm V bVI VII°',
      )
      expect(degreesOf(harmonicField(tonic, 'harmonic-minor', 'sevenths'))).toBe(
        'Im(7M) IIm7(b5) bIII7M(#5) IVm7 V7 bVI7M VII°7',
      )
      expect(degreesOf(harmonicField(tonic, 'melodic-minor', 'sevenths'))).toBe(
        'Im(7M) IIm7 bIII7M(#5) IV7 V7 VIm7(b5) VIIm7(b5)',
      )
    }
  })

  it('o V7 de Lá menor harmônico é E7 (com Sol♯)', () => {
    const field = harmonicField('A', 'harmonic-minor', 'sevenths')
    expect(field[4]?.chord.notes.join(' ')).toBe('E G# B D')
  })

  it('funções harmônicas só no campo maior', () => {
    const major = harmonicField('C', 'major')
    expect(major.map((c) => c.function)).toEqual([
      'tonic',
      'subdominant',
      'tonic',
      'subdominant',
      'dominant',
      'tonic',
      'dominant',
    ])
    expect(harmonicField('A', 'natural-minor').every((c) => c.function === null)).toBe(true)
  })
})
