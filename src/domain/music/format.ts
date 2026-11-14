import { getChordQuality, type Chord, type ChordQualityId } from './chords'
import { degreeToString, type ChordDegree } from './degrees'
import { letterOf, type PitchClass } from './notes'

/** Como exibir nomes de notas: "Dó", "C" ou "Dó (C)". */
export type NoteNaming = 'latin' | 'letters' | 'both'

export const DEFAULT_NOTE_NAMING: NoteNaming = 'both'

const LATIN: Readonly<Record<string, string>> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
}

/** Troca acidentes ASCII pelos símbolos musicais: "Bb" → "B♭", "m7(b5)" → "m7(♭5)". */
export function prettyAccidentals(text: string): string {
  return text.replaceAll('##', '𝄪').replaceAll('bb', '𝄫').replaceAll('#', '♯').replaceAll('b', '♭')
}

function prettyPitchClass(pc: PitchClass): string {
  return letterOf(pc) + prettyAccidentals(pc.slice(1))
}

/** Nome de uma nota para exibição: "Dó♯ (C♯)", "Dó♯" ou "C♯". */
export function formatPitchClass(pc: PitchClass, naming: NoteNaming = DEFAULT_NOTE_NAMING): string {
  const accidentals = prettyAccidentals(pc.slice(1))
  const latin = (LATIN[letterOf(pc)] ?? letterOf(pc)) + accidentals
  const letters = letterOf(pc) + accidentals
  switch (naming) {
    case 'latin':
      return latin
    case 'letters':
      return letters
    case 'both':
      return `${latin} (${letters})`
  }
}

/** Sufixo de acorde na cifra brasileira: "7M", "m7(♭5)", "°". */
export function formatChordSuffix(quality: ChordQualityId): string {
  return prettyAccidentals(getChordQuality(quality).brSymbol)
}

/**
 * Cifra brasileira para exibição: "B♭7M", "Am7(♭5)", "C/E".
 * Cifras sempre usam letras, qualquer que seja a preferência de nomes de notas.
 */
export function formatChord(chord: Chord): string {
  const bass = chord.bass ? `/${prettyPitchClass(chord.bass)}` : ''
  return prettyPitchClass(chord.root) + formatChordSuffix(chord.quality) + bass
}

/** Grau para exibição: "♭VI7M", "IVm", "IIm7(♭5)". */
export function formatDegree(degree: ChordDegree): string {
  return prettyAccidentals(degreeToString(degree))
}

/** Nome em português da qualidade do acorde ("meio-diminuto"). */
export function chordQualityName(quality: ChordQualityId): string {
  return getChordQuality(quality).name
}
