import { MusicParseError } from './errors'
import {
  alterPitchClass,
  chroma,
  midiToNote,
  noteToMidi,
  parseNote,
  parsePitchClass,
  spellChroma,
} from './notes'

describe('parsePitchClass', () => {
  it.each([
    ['C', 'C'],
    ['F#', 'F#'],
    ['Eb', 'Eb'],
    ['B♭', 'Bb'],
    ['F♯', 'F#'],
    ['Bbb', 'Bbb'],
    [' G ', 'G'],
  ])('aceita %j → %s', (input, expected) => {
    expect(parsePitchClass(input)).toBe(expected)
  })

  it.each(['H', 'c', 'C###', 'Do', '', 'C4'])('rejeita %j', (input) => {
    expect(() => parsePitchClass(input)).toThrow(MusicParseError)
  })
})

describe('parseNote / MIDI', () => {
  it('Dó central é C4 = 60', () => {
    expect(noteToMidi(parseNote('C4'))).toBe(60)
  })

  it('enarmônicas têm o mesmo MIDI', () => {
    expect(noteToMidi('C#4')).toBe(noteToMidi('Db4'))
    expect(noteToMidi('B#3')).toBe(60)
    expect(noteToMidi('Cb4')).toBe(59)
  })

  it('rejeita nota sem oitava', () => {
    expect(() => parseNote('C')).toThrow(MusicParseError)
  })
})

describe('chroma e alterações', () => {
  it('calcula o chroma', () => {
    expect(chroma('C')).toBe(0)
    expect(chroma('Eb')).toBe(3)
    expect(chroma('D#')).toBe(3)
    expect(chroma('B')).toBe(11)
  })

  it('altera mantendo a letra', () => {
    expect(alterPitchClass('E', -1)).toBe('Eb')
    expect(alterPitchClass('Eb', -1)).toBe('Ebb')
    expect(alterPitchClass('F#', -1)).toBe('F')
    expect(alterPitchClass('B', 1)).toBe('B#')
  })
})

describe('grafia no contexto da tônica', () => {
  it('usa as notas do tom maior', () => {
    expect(spellChroma(6, 'D')).toBe('F#')
    expect(spellChroma(6, 'Db')).toBe('Gb')
    expect(spellChroma(5, 'F#')).toBe('E#')
  })

  it('grafa notas de empréstimo com bemol (♭3, ♭6, ♭7)', () => {
    // Em Sol: Sib (♭3), Mib (♭6), Fá (♭7)
    expect(spellChroma(10, 'G')).toBe('Bb')
    expect(spellChroma(3, 'G')).toBe('Eb')
    expect(spellChroma(5, 'G')).toBe('F')
  })

  it('grafa o ♯4 com sustenido', () => {
    expect(spellChroma(1, 'G')).toBe('C#')
  })

  it('converte MIDI em nota com a oitava certa', () => {
    expect(midiToNote(60)).toBe('C4')
    expect(midiToNote(63, 'Eb')).toBe('Eb4')
    expect(midiToNote(63, 'E')).toBe('D#4')
    expect(midiToNote(65, 'F#')).toBe('E#4')
    expect(midiToNote(59, 'Gb')).toBe('Cb4')
  })

  it('rejeita MIDI fora da faixa', () => {
    expect(() => midiToNote(128)).toThrow(MusicParseError)
    expect(() => midiToNote(-1)).toThrow(MusicParseError)
  })
})
