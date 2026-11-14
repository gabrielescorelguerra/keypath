/**
 * Motor de teoria musical do KeyPath.
 *
 * Toda a aplicação usa este módulo — nunca a biblioteca `tonal` diretamente —
 * para que grafia, cifras e graus sigam sempre as mesmas regras.
 *
 * Notação canônica (arquivos de conteúdo e código): letras com # e b ("Eb", "F#m7").
 * A conversão para "Dó (C)", cifra brasileira e símbolos ♯ ♭ acontece em `format`.
 */
export { MusicParseError } from './errors.ts'
export {
  alterPitchClass,
  chroma,
  isPitchClass,
  midiToNote,
  noteToMidi,
  octaveOf,
  parseNote,
  parsePitchClass,
  pitchClassOf,
  spellChroma,
  transpose,
  type NoteName,
  type PitchClass,
} from './notes.ts'
export {
  CHORD_QUALITIES,
  buildChord,
  getChordQuality,
  identifyChordQuality,
  parseChord,
  tryParseChord,
  type Chord,
  type ChordQuality,
  type ChordQualityId,
} from './chords.ts'
export { SCALE_TYPES, isScaleType, scaleNotes, type ScaleType } from './scales.ts'
export { MAJOR_KEYS, MINOR_KEYS, parseKey, type Key, type KeyMode } from './keys.ts'
export {
  chordToDegree,
  degreeToChord,
  degreeToPitchClass,
  degreeToString,
  parseDegree,
  pitchClassToDegree,
  progressionToChords,
  type ChordDegree,
  type DegreeNumber,
  type ScaleDegree,
} from './degrees.ts'
export {
  HARMONIC_FUNCTION_NAMES,
  harmonicField,
  type HarmonicFieldChord,
  type HarmonicFieldSize,
  type HarmonicFieldType,
  type HarmonicFunction,
} from './harmonicField.ts'
export {
  notesToMidi,
  voiceChord,
  voiceLead,
  voiceScale,
  type ChordVoicingOptions,
} from './voicing.ts'
export {
  DEFAULT_NOTE_NAMING,
  chordQualityName,
  formatChord,
  formatChordSuffix,
  formatDegree,
  formatPitchClass,
  prettyAccidentals,
  type NoteNaming,
} from './format.ts'
