/**
 * Repertório e sessões de prática — dados do usuário (D14): ficam no dispositivo,
 * entram no backup e nunca vão para o Git. Campos ausentes usam `null`.
 */

export type SongStatus = 'wishlist' | 'learning' | 'ready' | 'repertoire'

export const SONG_STATUSES: readonly SongStatus[] = ['learning', 'wishlist', 'ready', 'repertoire']

export const SONG_STATUS_LABEL: Readonly<Record<SongStatus, string>> = {
  wishlist: 'Quero aprender',
  learning: 'Estudando',
  ready: 'Pronta',
  repertoire: 'No repertório',
}

export interface Song {
  readonly id: string
  readonly title: string
  readonly artist: string | null
  /** Tom na notação canônica ("G", "Em"). */
  readonly key: string | null
  readonly bpm: number | null
  readonly styles: readonly string[]
  /** Competências que a música exige. */
  readonly competencies: readonly string[]
  readonly status: SongStatus
  readonly notes: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type AttachmentKind = 'pdf' | 'image' | 'midi' | 'youtube'

export interface Attachment {
  readonly id: string
  readonly songId: string
  readonly kind: AttachmentKind
  readonly name: string
  /** Arquivo guardado no banco (pdf, imagem, midi). */
  readonly blobId: string | null
  readonly mimeType: string | null
  readonly size: number | null
  /** Link (YouTube). */
  readonly url: string | null
  /** Segundo inicial do vídeo. */
  readonly startSeconds: number | null
  readonly createdAt: string
}

export interface SessionSong {
  readonly songId: string
  readonly minutes: number
  readonly note: string
}

export interface PracticeSession {
  readonly id: string
  readonly startedAt: string
  /** null enquanto a sessão está em andamento. */
  readonly endedAt: string | null
  readonly focus: string | null
  readonly songs: readonly SessionSong[]
  readonly notes: string
}
