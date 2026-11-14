import type {
  Attachment,
  AttachmentKind,
  PracticeSession,
  SessionSong,
  Song,
} from '@/domain/practice'
import { db } from './db.ts'
import { requestPersistentStorage } from './storage.ts'

/** Operações do repertório e das sessões de prática. */

const iso = (date: Date) => date.toISOString()
const afterWrite = () => void requestPersistentStorage()

export type NewSong = Pick<Song, 'title'> & Partial<Omit<Song, 'id' | 'createdAt' | 'updatedAt'>>

export async function createSong(input: NewSong, now: Date = new Date()): Promise<Song> {
  const song: Song = {
    id: crypto.randomUUID(),
    title: input.title.trim() || 'Sem título',
    artist: input.artist ?? null,
    key: input.key ?? null,
    bpm: input.bpm ?? null,
    styles: input.styles ?? [],
    competencies: input.competencies ?? [],
    status: input.status ?? 'learning',
    notes: input.notes ?? '',
    createdAt: iso(now),
    updatedAt: iso(now),
  }
  await db.songs.add(song)
  afterWrite()
  return song
}

export async function updateSong(
  id: string,
  patch: Partial<Omit<Song, 'id' | 'createdAt'>>,
  now: Date = new Date(),
): Promise<void> {
  await db.songs.update(id, { ...patch, updatedAt: iso(now) })
}

/** Apaga a música com seus anexos e arquivos. */
export async function deleteSong(id: string): Promise<void> {
  await db.transaction('rw', [db.songs, db.attachments, db.blobs], async () => {
    const attachments = await db.attachments.where('songId').equals(id).toArray()
    await db.blobs.bulkDelete(attachments.flatMap((a) => (a.blobId ? [a.blobId] : [])))
    await db.attachments.bulkDelete(attachments.map((a) => a.id))
    await db.songs.delete(id)
  })
}

export interface FileInput {
  readonly name: string
  readonly type: string
  readonly size: number
  arrayBuffer(): Promise<ArrayBuffer>
}

/** Anexa um arquivo (PDF, imagem, MIDI) a uma música. */
export async function addFileAttachment(
  songId: string,
  file: FileInput,
  kind: Exclude<AttachmentKind, 'youtube'>,
  now: Date = new Date(),
): Promise<Attachment> {
  const data = await file.arrayBuffer()
  const blobId = crypto.randomUUID()
  const mimeType = file.type || defaultMime(kind)
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    songId,
    kind,
    name: file.name,
    blobId,
    mimeType,
    size: file.size,
    url: null,
    startSeconds: null,
    createdAt: iso(now),
  }
  await db.transaction('rw', [db.attachments, db.blobs, db.songs], async () => {
    await db.blobs.add({ id: blobId, data, mimeType })
    await db.attachments.add(attachment)
    await db.songs.update(songId, { updatedAt: iso(now) })
  })
  afterWrite()
  return attachment
}

function defaultMime(kind: Exclude<AttachmentKind, 'youtube'>): string {
  return kind === 'pdf' ? 'application/pdf' : kind === 'midi' ? 'audio/midi' : 'image/*'
}

export async function addLinkAttachment(
  songId: string,
  link: { readonly name: string; readonly url: string; readonly startSeconds: number | null },
  now: Date = new Date(),
): Promise<Attachment> {
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    songId,
    kind: 'youtube',
    name: link.name,
    blobId: null,
    mimeType: null,
    size: null,
    url: link.url,
    startSeconds: link.startSeconds,
    createdAt: iso(now),
  }
  await db.attachments.add(attachment)
  await db.songs.update(songId, { updatedAt: iso(now) })
  afterWrite()
  return attachment
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.transaction('rw', [db.attachments, db.blobs], async () => {
    const attachment = await db.attachments.get(id)
    if (attachment?.blobId) await db.blobs.delete(attachment.blobId)
    await db.attachments.delete(id)
  })
}

/** Conteúdo de um anexo como Blob (para abrir, mostrar ou baixar). */
export async function getAttachmentBlob(attachment: Attachment): Promise<Blob | null> {
  if (!attachment.blobId) return null
  const record = await db.blobs.get(attachment.blobId)
  return record ? new Blob([record.data], { type: record.mimeType }) : null
}

// --- Sessões de prática -------------------------------------------------------

/** Sessão em andamento (no máximo uma). */
export async function getActiveSession(): Promise<PracticeSession | null> {
  const open = await db.practiceSessions.filter((s) => s.endedAt === null).toArray()
  return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
}

export async function startSession(
  focus: string | null = null,
  now: Date = new Date(),
): Promise<PracticeSession> {
  const active = await getActiveSession()
  if (active) return active
  const session: PracticeSession = {
    id: crypto.randomUUID(),
    startedAt: iso(now),
    endedAt: null,
    focus,
    songs: [],
    notes: '',
  }
  await db.practiceSessions.add(session)
  afterWrite()
  return session
}

export async function updateSession(
  id: string,
  patch: Partial<Pick<PracticeSession, 'focus' | 'notes' | 'songs'>>,
): Promise<void> {
  await db.practiceSessions.update(id, patch)
}

export async function setSessionSong(sessionId: string, entry: SessionSong): Promise<void> {
  await db.transaction('rw', db.practiceSessions, async () => {
    const session = await db.practiceSessions.get(sessionId)
    if (!session) return
    const others = session.songs.filter((s) => s.songId !== entry.songId)
    await db.practiceSessions.update(sessionId, { songs: [...others, entry] })
  })
}

export async function removeSessionSong(sessionId: string, songId: string): Promise<void> {
  await db.transaction('rw', db.practiceSessions, async () => {
    const session = await db.practiceSessions.get(sessionId)
    if (!session) return
    await db.practiceSessions.update(sessionId, {
      songs: session.songs.filter((s) => s.songId !== songId),
    })
  })
}

export async function endSession(id: string, now: Date = new Date()): Promise<void> {
  await db.practiceSessions.update(id, { endedAt: iso(now) })
}

export async function deleteSession(id: string): Promise<void> {
  await db.practiceSessions.delete(id)
}
