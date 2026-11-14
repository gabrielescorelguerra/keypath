import { parseChord } from './chords'
import {
  chordToDegree,
  degreeToChord,
  degreeToString,
  parseDegree,
  pitchClassToDegree,
  progressionToChords,
} from './degrees'
import { MusicParseError } from './errors'
import { MAJOR_KEYS } from './keys'

const symbolsIn = (tonic: string, degrees: string) =>
  progressionToChords(tonic, degrees)
    .map((c) => c.symbol)
    .join(' ')

describe('graus → acordes', () => {
  it('campo maior em Sol (convenção brasileira)', () => {
    expect(symbolsIn('G', 'I IIm IIIm IV V VIm VII°')).toBe('G Am Bm C D Em F#dim')
    expect(symbolsIn('G', 'I7M IIm7 IIIm7 IV7M V7 VIm7 VIIm7(b5)')).toBe(
      'Gmaj7 Am7 Bm7 Cmaj7 D7 Em7 F#m7b5',
    )
  })

  it('aceita a convenção de caixa (minúsculas = menor)', () => {
    expect(symbolsIn('G', 'I ii iii IV V vi vii°')).toBe('G Am Bm C D Em F#dim')
    expect(symbolsIn('G', 'iiø iiø7 vii°7 ii7')).toBe('Am7b5 Am7b5 F#dim7 Am7')
  })

  it('empréstimos modais em Sol são grafados corretamente (Mib, não Ré#)', () => {
    expect(symbolsIn('G', 'I I7 IV iv I')).toBe('G G7 C Cm G')
    expect(symbolsIn('G', 'IVm6 bVI bVII I')).toBe('Cm6 Eb F G')
    expect(symbolsIn('G', 'bVI7M bVII7 bIII7M')).toBe('Ebmaj7 F7 Bbmaj7')
    expect(symbolsIn('G', '♭VI ♭VII')).toBe('Eb F')
  })

  it('funciona em tons com muitos acidentes', () => {
    expect(symbolsIn('Db', 'I IV iv bVI bVII')).toBe('Db Gb Gbm Bbb Cb')
    expect(symbolsIn('F#', 'I IV V7 VIm')).toBe('F# B C#7 D#m')
  })

  it('lê baixo invertido', () => {
    const chord = degreeToChord('G', 'I/III')
    expect(chord.symbol).toBe('G/B')
    expect(degreeToChord('C', 'IV/V').symbol).toBe('F/G')
  })

  it.each(['VIII', 'X', 'Ixyz', '', 'iv/H'])('rejeita %j', (input) => {
    expect(() => parseDegree(input)).toThrow(MusicParseError)
  })
})

describe('acordes → graus', () => {
  it.each([
    ['G', 'Cm', 'IVm'],
    ['G', 'Eb', 'bVI'],
    ['G', 'F', 'bVII'],
    ['G', 'Am7(b5)', 'IIm7(b5)'],
    ['G', 'G/B', 'I/III'],
    ['C', 'Bbmaj7', 'bVII7M'],
    ['C', 'F#m7b5', '#IVm7(b5)'],
    ['A', 'C', 'bIII'],
  ])('em %s, %s é %s', (tonic, symbol, expected) => {
    expect(degreeToString(chordToDegree(tonic, parseChord(symbol)))).toBe(expected)
  })

  it('identifica o grau de notas', () => {
    expect(pitchClassToDegree('G', 'Eb')).toEqual({ number: 6, alteration: -1 })
    expect(pitchClassToDegree('G', 'C#')).toEqual({ number: 4, alteration: 1 })
    expect(pitchClassToDegree('Db', 'C')).toEqual({ number: 7, alteration: 0 })
  })

  it('ida e volta em todas as tonalidades', () => {
    const degrees = [
      'I7M',
      'IIm7',
      'IIIm7',
      'IV7M',
      'V7',
      'VIm7',
      'VIIm7(b5)',
      'IVm',
      'bVI',
      'bVII7',
    ]
    for (const tonic of MAJOR_KEYS) {
      for (const degree of degrees) {
        const chord = degreeToChord(tonic, degree)
        expect(degreeToString(chordToDegree(tonic, chord))).toBe(degree)
      }
    }
  })
})
