import { formatPitchClass, pitchClassOf, type NoteName, type NoteNaming } from '@/domain/music'

/** Lista de nomes de notas: "Dó (C) · Mi (E) · Sol (G)". */
export function noteList(notes: readonly NoteName[], naming: NoteNaming): string {
  return notes.map((n) => formatPitchClass(pitchClassOf(n), naming)).join(' · ')
}
