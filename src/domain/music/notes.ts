import { Interval, Note as TonalNote } from 'tonal'
import { MusicParseError } from './errors.ts'

/**
 * Classe de nota na notação canônica: letra maiúscula + acidentes ASCII.
 * Exemplos: "C", "F#", "Eb", "Bbb".
 */
export type PitchClass = string

/** Nota com oitava na notação canônica. Exemplo: "C4" (dó central, MIDI 60). */
export type NoteName = string

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const PITCH_CLASS_RE = /^[A-G](?:##|bb|#|b)?$/
const NOTE_RE = /^([A-G](?:##|bb|#|b)?)(-?\d)$/

/** Troca ♯ ♭ 𝄪 𝄫 por # e b. */
export function normalizeAccidentals(input: string): string {
  return input
    .trim()
    .replaceAll('𝄪', '##')
    .replaceAll('𝄫', 'bb')
    .replaceAll('♯', '#')
    .replaceAll('♭', 'b')
}

export function isPitchClass(input: string): boolean {
  return PITCH_CLASS_RE.test(normalizeAccidentals(input))
}

/** Valida e normaliza uma classe de nota ("f♯" não é aceito: a letra deve ser maiúscula). */
export function parsePitchClass(input: string): PitchClass {
  const normalized = normalizeAccidentals(input)
  if (!PITCH_CLASS_RE.test(normalized)) {
    throw new MusicParseError('Nota', input)
  }
  return normalized
}

/** Valida e normaliza uma nota com oitava ("C4", "Bb3"). */
export function parseNote(input: string): NoteName {
  const normalized = normalizeAccidentals(input)
  if (!NOTE_RE.test(normalized)) {
    throw new MusicParseError('Nota', input)
  }
  return normalized
}

/** Posição da nota na oitava, de 0 (Dó) a 11 (Si). Enarmônicas têm o mesmo valor. */
export function chroma(pc: PitchClass): number {
  return TonalNote.get(pc).chroma
}

/** Letra da nota ("C" para "C#"). */
export function letterOf(pc: PitchClass): string {
  return pc.charAt(0)
}

/** Índice da letra: C = 0 … B = 6. */
export function letterIndex(pc: PitchClass): number {
  return LETTERS.indexOf(letterOf(pc) as (typeof LETTERS)[number])
}

/** Quantidade de acidentes: "#" = 1, "bb" = -2. */
export function alterationOf(pc: PitchClass): number {
  return TonalNote.get(pc).alt
}

/** Muda os acidentes mantendo a letra: alter("E", -1) = "Eb". */
export function alterPitchClass(pc: PitchClass, delta: number): PitchClass {
  const alt = alterationOf(pc) + delta
  const accidentals = alt >= 0 ? '#'.repeat(alt) : 'b'.repeat(-alt)
  return letterOf(pc) + accidentals
}

/** Transpõe uma nota ou classe de nota por um intervalo ("3m", "5P", "9M"). */
export function transpose<T extends PitchClass | NoteName>(note: T, interval: string): T {
  const result = TonalNote.transpose(note, interval)
  if (!result) {
    throw new MusicParseError('Intervalo', interval)
  }
  return result as T
}

/** Intervalo simples (dentro da oitava) de `from` até `to`. */
export function intervalBetween(from: PitchClass, to: PitchClass): string {
  return Interval.distance(from, to)
}

/** Reduz um intervalo composto à oitava: "9M" → "2M". */
export function simplifyInterval(interval: string): string {
  return Interval.simplify(interval)
}

export function noteToMidi(note: NoteName): number {
  const midi = TonalNote.midi(note)
  if (midi === null) {
    throw new MusicParseError('Nota', note)
  }
  return midi
}

export function pitchClassOf(note: NoteName): PitchClass {
  return TonalNote.get(note).pc
}

export function octaveOf(note: NoteName): number {
  const oct = TonalNote.get(note).oct
  if (oct === undefined) {
    throw new MusicParseError('Nota', note)
  }
  return oct
}

/**
 * Intervalo usado para grafar cada semitom em relação à tônica.
 * Notas fora do tom usam ♭2, ♭3, ♯4, ♭6 e ♭7 — a grafia natural de empréstimos
 * modais e notas de blues (em Sol: Láb, Sib, Dó♯, Mib, Fá).
 */
const SPELLING_FROM_TONIC = [
  '1P',
  '2m',
  '2M',
  '3m',
  '3M',
  '4P',
  '4A',
  '5P',
  '6m',
  '6M',
  '7m',
  '7M',
] as const

/** Grafia de uma classe de nota (por chroma) no contexto de uma tônica. */
export function spellChroma(value: number, tonic: PitchClass = 'C'): PitchClass {
  const semitones = (((value - chroma(tonic)) % 12) + 12) % 12
  return transpose(tonic, SPELLING_FROM_TONIC[semitones] ?? '1P')
}

/** Converte um número MIDI em nota grafada conforme a tônica (padrão: Dó). */
export function midiToNote(midi: number, tonic: PitchClass = 'C'): NoteName {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new MusicParseError('Número MIDI', String(midi))
  }
  const pc = spellChroma(midi % 12, tonic)
  // A oitava segue a letra: Si# 3 soa como Dó 4, Dób 4 soa como Si 3.
  const naiveOctave = Math.floor(midi / 12) - 1
  for (const octave of [naiveOctave, naiveOctave - 1, naiveOctave + 1]) {
    const candidate = `${pc}${octave}`
    if (TonalNote.midi(candidate) === midi) {
      return candidate
    }
  }
  throw new MusicParseError('Número MIDI', String(midi))
}
