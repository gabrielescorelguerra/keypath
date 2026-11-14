import { MusicParseError } from './errors'
import {
  intervalBetween,
  normalizeAccidentals,
  parsePitchClass,
  simplifyInterval,
  transpose,
  type PitchClass,
} from './notes'

export type ChordQualityId =
  | 'major'
  | 'minor'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | 'maj7'
  | '7'
  | 'm7'
  | 'm7b5'
  | 'dim7'
  | 'mMaj7'
  | 'maj7#5'
  | '7sus4'
  | 'add9'
  | 'madd9'
  | '69'
  | 'maj9'
  | '9'
  | 'm9'
  | '7b9'
  | '7#9'
  | '7#11'
  | '13'

export interface ChordQuality {
  readonly id: ChordQualityId
  /** Intervalos a partir da fundamental, na ordem de empilhamento. */
  readonly intervals: readonly string[]
  /** Sufixo canônico, usado nos arquivos de conteúdo ("maj7"). */
  readonly symbol: string
  /** Sufixo na cifra brasileira, usado na exibição ("7M"). */
  readonly brSymbol: string
  /** Outras grafias aceitas na leitura. */
  readonly aliases: readonly string[]
  /** Nome em português. */
  readonly name: string
}

const QUALITY_LIST: readonly ChordQuality[] = [
  q('major', ['1P', '3M', '5P'], '', '', ['M', 'maj'], 'maior'),
  q('minor', ['1P', '3m', '5P'], 'm', 'm', ['min', '-'], 'menor'),
  q('dim', ['1P', '3m', '5d'], 'dim', '°', ['°', 'o'], 'diminuto'),
  q('aug', ['1P', '3M', '5A'], 'aug', '+', ['+', '(#5)', '#5'], 'aumentado'),
  q('sus2', ['1P', '2M', '5P'], 'sus2', 'sus2', [], 'suspenso com segunda'),
  q('sus4', ['1P', '4P', '5P'], 'sus4', 'sus4', ['sus', '4', '(4)'], 'suspenso com quarta'),
  q('6', ['1P', '3M', '5P', '6M'], '6', '6', [], 'maior com sexta'),
  q('m6', ['1P', '3m', '5P', '6M'], 'm6', 'm6', ['min6', '-6'], 'menor com sexta'),
  q(
    'maj7',
    ['1P', '3M', '5P', '7M'],
    'maj7',
    '7M',
    ['7M', 'M7', 'Maj7', 'Δ', 'Δ7'],
    'maior com sétima maior',
  ),
  q('7', ['1P', '3M', '5P', '7m'], '7', '7', ['dom'], 'dominante (maior com sétima)'),
  q('m7', ['1P', '3m', '5P', '7m'], 'm7', 'm7', ['min7', '-7'], 'menor com sétima'),
  q(
    'm7b5',
    ['1P', '3m', '5d', '7m'],
    'm7b5',
    'm7(b5)',
    ['m7(b5)', 'ø', 'ø7', '-7b5'],
    'meio-diminuto',
  ),
  q('dim7', ['1P', '3m', '5d', '7d'], 'dim7', '°7', ['°7', 'o7'], 'diminuto com sétima'),
  q(
    'mMaj7',
    ['1P', '3m', '5P', '7M'],
    'mMaj7',
    'm(7M)',
    ['m(7M)', 'm7M', 'mmaj7', 'm(maj7)', 'mM7'],
    'menor com sétima maior',
  ),
  q(
    'maj7#5',
    ['1P', '3M', '5A', '7M'],
    'maj7#5',
    '7M(#5)',
    ['7M(#5)', 'maj7(#5)', '+7M', 'augmaj7'],
    'maior com sétima maior e quinta aumentada',
  ),
  q(
    '7sus4',
    ['1P', '4P', '5P', '7m'],
    '7sus4',
    '7(4)',
    ['7(4)', '7sus', '7/4'],
    'dominante com quarta suspensa',
  ),
  q('add9', ['1P', '3M', '5P', '9M'], 'add9', '(9)', ['(9)', 'add2'], 'maior com nona adicionada'),
  q(
    'madd9',
    ['1P', '3m', '5P', '9M'],
    'madd9',
    'm(9)',
    ['m(9)', 'm(add9)'],
    'menor com nona adicionada',
  ),
  q('69', ['1P', '3M', '5P', '6M', '9M'], '69', '6(9)', ['6(9)', '6/9'], 'maior com sexta e nona'),
  q(
    'maj9',
    ['1P', '3M', '5P', '7M', '9M'],
    'maj9',
    '7M(9)',
    ['7M(9)', 'maj7(9)'],
    'maior com sétima maior e nona',
  ),
  q('9', ['1P', '3M', '5P', '7m', '9M'], '9', '7(9)', ['7(9)'], 'dominante com nona'),
  q('m9', ['1P', '3m', '5P', '7m', '9M'], 'm9', 'm7(9)', ['m7(9)'], 'menor com sétima e nona'),
  q('7b9', ['1P', '3M', '5P', '7m', '9m'], '7b9', '7(b9)', ['7(b9)'], 'dominante com nona menor'),
  q(
    '7#9',
    ['1P', '3M', '5P', '7m', '9A'],
    '7#9',
    '7(#9)',
    ['7(#9)'],
    'dominante com nona aumentada',
  ),
  q(
    '7#11',
    ['1P', '3M', '5P', '7m', '11A'],
    '7#11',
    '7(#11)',
    ['7(#11)'],
    'dominante com décima primeira aumentada',
  ),
  q(
    '13',
    ['1P', '3M', '5P', '7m', '13M'],
    '13',
    '7(13)',
    ['7(13)'],
    'dominante com décima terceira',
  ),
]

function q(
  id: ChordQualityId,
  intervals: string[],
  symbol: string,
  brSymbol: string,
  aliases: string[],
  name: string,
): ChordQuality {
  return { id, intervals, symbol, brSymbol, aliases, name }
}

export const CHORD_QUALITIES: ReadonlyMap<ChordQualityId, ChordQuality> = new Map(
  QUALITY_LIST.map((quality) => [quality.id, quality]),
)

const QUALITY_BY_SUFFIX = new Map<string, ChordQualityId>()
for (const quality of QUALITY_LIST) {
  for (const suffix of [quality.symbol, quality.brSymbol, ...quality.aliases]) {
    const existing = QUALITY_BY_SUFFIX.get(suffix)
    if (existing && existing !== quality.id) {
      throw new Error(`Sufixo de acorde ambíguo: "${suffix}" (${existing} e ${quality.id})`)
    }
    QUALITY_BY_SUFFIX.set(suffix, quality.id)
  }
}

export function getChordQuality(id: ChordQualityId): ChordQuality {
  const quality = CHORD_QUALITIES.get(id)
  if (!quality) {
    throw new Error(`Qualidade de acorde desconhecida: ${id}`)
  }
  return quality
}

/** Interpreta só o sufixo de um acorde ("7M", "m7(b5)", "maj7"). */
export function parseChordSuffix(suffix: string): ChordQualityId | null {
  return QUALITY_BY_SUFFIX.get(normalizeAccidentals(suffix).replaceAll(' ', '')) ?? null
}

export interface Chord {
  /** Cifra canônica ("Bbmaj7/D"). */
  readonly symbol: string
  readonly root: PitchClass
  readonly quality: ChordQualityId
  /** Nota do baixo quando diferente da fundamental (acorde com baixo invertido). */
  readonly bass: PitchClass | null
  /** Notas na posição fundamental, sem o baixo. */
  readonly notes: readonly PitchClass[]
}

export function buildChord(
  root: PitchClass,
  quality: ChordQualityId,
  bass: PitchClass | null = null,
): Chord {
  const def = getChordQuality(quality)
  const notes = def.intervals.map((interval) => transpose(root, interval))
  const effectiveBass = bass !== null && bass !== root ? bass : null
  return {
    symbol: `${root}${def.symbol}${effectiveBass ? `/${effectiveBass}` : ''}`,
    root,
    quality,
    bass: effectiveBass,
    notes,
  }
}

const CHORD_RE = /^([A-G][#b]?)(.*)$/
const BASS_RE = /^[A-G][#b]?$/

/**
 * Lê uma cifra, na notação internacional ou brasileira.
 * Exemplos: "C", "F#m7", "Bbmaj7", "B♭7M", "Am7(b5)", "G7(4)", "C(9)", "C/E".
 *
 * Atenção: "C9" é dominante com nona (C7(9)); a nona adicionada é "C(9)" ou "Cadd9".
 */
export function parseChord(input: string): Chord {
  const normalized = normalizeAccidentals(input).replaceAll(' ', '')
  const match = CHORD_RE.exec(normalized)
  if (!match) {
    throw new MusicParseError('Acorde', input)
  }
  const root = match[1] ?? ''
  let rest = match[2] ?? ''
  let bass: PitchClass | null = null

  const slash = rest.lastIndexOf('/')
  if (slash !== -1) {
    const candidate = rest.slice(slash + 1)
    if (BASS_RE.test(candidate)) {
      bass = parsePitchClass(candidate)
      rest = rest.slice(0, slash)
    }
  }

  const quality = parseChordSuffix(rest)
  if (quality === null) {
    throw new MusicParseError('Acorde', input)
  }
  return buildChord(root, quality, bass)
}

export function tryParseChord(input: string): Chord | null {
  try {
    return parseChord(input)
  } catch {
    return null
  }
}

/** Reconhece a qualidade de um acorde a partir da fundamental e das notas (em qualquer ordem). */
export function identifyChordQuality(
  root: PitchClass,
  notes: readonly PitchClass[],
): ChordQualityId | null {
  const target = new Set(notes.map((note) => intervalBetween(root, note)))
  for (const quality of QUALITY_LIST) {
    const intervals = new Set(quality.intervals.map(simplifyInterval))
    if (intervals.size === target.size && [...intervals].every((i) => target.has(i))) {
      return quality.id
    }
  }
  return null
}
