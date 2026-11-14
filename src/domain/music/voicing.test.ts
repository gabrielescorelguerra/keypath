import { parseChord } from './chords.ts'
import { notesToMidi, voiceChord, voiceLead, voiceScale } from './voicing.ts'

describe('voiceChord', () => {
  it('posição fundamental na oitava 4', () => {
    const notes = voiceChord(parseChord('C'))
    expect(notes).toEqual(['C4', 'E4', 'G4'])
    expect(notesToMidi(notes)).toEqual([60, 64, 67])
  })

  it('inversões', () => {
    const chord = parseChord('C')
    expect(voiceChord(chord, { inversion: 1 })).toEqual(['E4', 'G4', 'C5'])
    expect(voiceChord(chord, { inversion: 2 })).toEqual(['G4', 'C5', 'E5'])
    expect(voiceChord(chord, { inversion: 3 })).toEqual(['C4', 'E4', 'G4'])
  })

  it('baixo invertido uma oitava abaixo', () => {
    expect(voiceChord(parseChord('Cmaj7/E'), { octave: 4 })).toEqual(['E3', 'C4', 'E4', 'G4', 'B4'])
  })

  it('extensões acima da oitava', () => {
    expect(voiceChord(parseChord('C9'))).toEqual(['C4', 'E4', 'G4', 'Bb4', 'D5'])
  })

  it('notas sempre ascendentes', () => {
    for (const symbol of ['F#m7b5', 'Bbmaj7', 'Ebdim7', 'B13', 'Ab7#9']) {
      for (const inversion of [0, 1, 2, 3]) {
        const midi = notesToMidi(voiceChord(parseChord(symbol), { inversion }))
        expect([...midi].sort((a, b) => a - b)).toEqual(midi)
      }
    }
  })
})

describe('voiceScale', () => {
  it('Dó maior, uma oitava', () => {
    expect(voiceScale('C', 'major')).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
  })

  it('Si maior cruza a oitava corretamente', () => {
    const notes = voiceScale('B', 'major', { octave: 3 })
    expect(notes).toEqual(['B3', 'C#4', 'D#4', 'E4', 'F#4', 'G#4', 'A#4', 'B4'])
  })

  it('duas oitavas', () => {
    const midi = notesToMidi(voiceScale('D', 'harmonic-minor', { octaves: 2 }))
    expect(midi).toHaveLength(15)
    expect(midi[0]).toBe(62)
    expect(midi.at(-1)).toBe(86)
    expect([...midi].sort((a, b) => a - b)).toEqual(midi)
  })
})

describe('voiceLead', () => {
  const lead = (symbols: string) => voiceLead(symbols.split(' ').map((s) => parseChord(s)))

  it('I–IV–V–I em Dó com o menor movimento', () => {
    expect(lead('C F G C')).toEqual([
      ['C4', 'E4', 'G4'],
      ['C4', 'F4', 'A4'],
      ['B3', 'D4', 'G4'],
      ['C4', 'E4', 'G4'],
    ])
  })

  it('mantém o baixo dos acordes com baixo invertido', () => {
    const [, second = []] = lead('C G/B')
    expect(second[0]?.startsWith('B')).toBe(true)
    const midis = notesToMidi(second)
    expect(Math.min(...midis)).toBe(midis[0])
  })

  it('nenhum acorde se afasta muito do anterior', () => {
    const voicings = lead('G G7 C Cm G Eb F G')
    const centers = voicings.map((v) => notesToMidi(v).reduce((a, b) => a + b, 0) / v.length)
    for (let i = 1; i < centers.length; i++) {
      expect(Math.abs((centers[i] ?? 0) - (centers[i - 1] ?? 0))).toBeLessThanOrEqual(4)
    }
  })
})
