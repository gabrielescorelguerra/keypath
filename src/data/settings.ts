import type { NoteNaming } from '@/domain/music'

export interface Settings {
  /** Como exibir nomes de notas: "Dó", "C" ou "Dó (C)". */
  readonly noteNaming: NoteNaming
  readonly soundEnabled: boolean
  /** Volume de 0 a 1. */
  readonly volume: number
}

export const DEFAULT_SETTINGS: Settings = {
  noteNaming: 'both',
  soundEnabled: true,
  volume: 0.8,
}
