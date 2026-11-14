import { CHORD_QUALITIES, identifyChordQuality, parseChord, tryParseChord } from './chords'
import { MusicParseError } from './errors'

describe('parseChord', () => {
  it.each([
    // [entrada, símbolo canônico, notas]
    ['C', 'C', 'C E G'],
    ['Cm', 'Cm', 'C Eb G'],
    ['F#m', 'F#m', 'F# A C#'],
    ['Bdim', 'Bdim', 'B D F'],
    ['B°', 'Bdim', 'B D F'],
    ['C+', 'Caug', 'C E G#'],
    ['Cmaj7', 'Cmaj7', 'C E G B'],
    ['C7M', 'Cmaj7', 'C E G B'],
    ['B♭7M', 'Bbmaj7', 'Bb D F A'],
    ['G7', 'G7', 'G B D F'],
    ['Am7', 'Am7', 'A C E G'],
    ['Am7(b5)', 'Am7b5', 'A C Eb G'],
    ['Aø', 'Am7b5', 'A C Eb G'],
    ['Cdim7', 'Cdim7', 'C Eb Gb Bbb'],
    ['Cm(7M)', 'CmMaj7', 'C Eb G B'],
    ['G7(4)', 'G7sus4', 'G C D F'],
    ['Gsus4', 'Gsus4', 'G C D'],
    ['C(9)', 'Cadd9', 'C E G D'],
    ['C9', 'C9', 'C E G Bb D'],
    ['C7(9)', 'C9', 'C E G Bb D'],
    ['C6(9)', 'C69', 'C E G A D'],
    ['C6/9', 'C69', 'C E G A D'],
    ['Dm7(9)', 'Dm9', 'D F A C E'],
    ['E7(b9)', 'E7b9', 'E G# B D F'],
    ['Eb7M(#5)', 'Ebmaj7#5', 'Eb G B D'],
  ])('%s → %s (%s)', (input, symbol, notes) => {
    const chord = parseChord(input)
    expect(chord.symbol).toBe(symbol)
    expect(chord.notes.join(' ')).toBe(notes)
    expect(chord.bass).toBeNull()
  })

  it('lê acordes com baixo', () => {
    const chord = parseChord('C/E')
    expect(chord.root).toBe('C')
    expect(chord.bass).toBe('E')
    expect(chord.symbol).toBe('C/E')
    expect(chord.notes.join(' ')).toBe('C E G')
  })

  it('lê baixo fora do acorde', () => {
    const chord = parseChord('D/C')
    expect(chord.bass).toBe('C')
  })

  it('ignora baixo igual à fundamental', () => {
    expect(parseChord('C/C').bass).toBeNull()
  })

  it.each(['H7', 'Cxyz', '', 'c', 'C/H', 'm7'])('rejeita %j', (input) => {
    expect(() => parseChord(input)).toThrow(MusicParseError)
    expect(tryParseChord(input)).toBeNull()
  })
})

describe('identifyChordQuality', () => {
  it('reconhece em qualquer ordem', () => {
    expect(identifyChordQuality('C', ['G', 'E', 'C'])).toBe('major')
    expect(identifyChordQuality('B', ['B', 'D', 'F', 'A'])).toBe('m7b5')
    expect(identifyChordQuality('G', ['G', 'B', 'D', 'F'])).toBe('7')
  })

  it('devolve null para conjuntos desconhecidos', () => {
    expect(identifyChordQuality('C', ['C', 'Db', 'D'])).toBeNull()
  })

  it('toda qualidade se reconhece a partir das próprias notas', () => {
    for (const quality of CHORD_QUALITIES.values()) {
      const chord = parseChord(`C${quality.symbol}`)
      expect(identifyChordQuality('C', chord.notes)).toBe(quality.id)
    }
  })
})
