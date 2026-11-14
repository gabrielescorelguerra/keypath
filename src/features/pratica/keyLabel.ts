import { formatPitchClass, parseKey } from '@/domain/music'

/** Tom para exibição em cifra: "G", "F♯m", "B♭". */
export function keyLabel(key: string | null): string | null {
  if (!key) return null
  try {
    const parsed = parseKey(key)
    return `${formatPitchClass(parsed.tonic, 'letters')}${parsed.mode === 'minor' ? 'm' : ''}`
  } catch {
    return key
  }
}
