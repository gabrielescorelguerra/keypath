import { resetDatabase } from '@/test/db.ts'
import { db } from './db.ts'
import {
  addFileAttachment,
  addLinkAttachment,
  createSong,
  deleteAttachment,
  deleteSong,
  endSession,
  getActiveSession,
  getAttachmentBlob,
  removeSessionSong,
  setSessionSong,
  startSession,
  updateSong,
} from './practice.ts'

const at = (day: number, hour = 10) => new Date(2026, 10, day, hour)
const file = (name: string, type: string, text: string) => {
  const bytes = new TextEncoder().encode(text)
  return { name, type, size: bytes.byteLength, arrayBuffer: async () => bytes.slice().buffer }
}

beforeEach(resetDatabase)

describe('repertório', () => {
  it('cria com padrões e atualiza', async () => {
    const song = await createSong({ title: '  Oceanos ' }, at(1))
    expect(song).toMatchObject({
      title: 'Oceanos',
      status: 'learning',
      key: null,
      styles: [],
      notes: '',
    })
    await updateSong(song.id, { key: 'D', bpm: 68 }, at(2))
    expect(await db.songs.get(song.id)).toMatchObject({
      key: 'D',
      bpm: 68,
      updatedAt: at(2).toISOString(),
    })
  })

  it('guarda o arquivo do anexo e devolve como Blob', async () => {
    const song = await createSong({ title: 'Oceanos' })
    const attachment = await addFileAttachment(song.id, file('cifra.pdf', '', '%PDF'), 'pdf')
    expect(attachment).toMatchObject({
      kind: 'pdf',
      name: 'cifra.pdf',
      mimeType: 'application/pdf',
      size: 4,
    })
    const blob = await getAttachmentBlob(attachment)
    expect(blob?.type).toBe('application/pdf')
    expect(blob?.size).toBe(4)
  })

  it('apagar o anexo apaga o arquivo; apagar a música apaga tudo', async () => {
    const song = await createSong({ title: 'Oceanos' })
    const pdf = await addFileAttachment(song.id, file('a.pdf', 'application/pdf', 'x'), 'pdf')
    await addFileAttachment(song.id, file('b.png', 'image/png', 'y'), 'image')
    await addLinkAttachment(song.id, {
      name: 'Vídeo',
      url: 'https://youtu.be/abcdef12345',
      startSeconds: null,
    })

    await deleteAttachment(pdf.id)
    expect(await db.attachments.count()).toBe(2)
    expect(await db.blobs.count()).toBe(1)

    await deleteSong(song.id)
    expect(await db.songs.count()).toBe(0)
    expect(await db.attachments.count()).toBe(0)
    expect(await db.blobs.count()).toBe(0)
  })
})

describe('sessões', () => {
  it('só uma sessão ativa; músicas praticadas; encerrar', async () => {
    const first = await startSession('campo menor', at(1))
    const again = await startSession(null, at(1, 11))
    expect(again.id).toBe(first.id)
    expect(await getActiveSession()).toMatchObject({ id: first.id, focus: 'campo menor' })

    await setSessionSong(first.id, { songId: 's1', minutes: 10, note: '' })
    await setSessionSong(first.id, { songId: 's1', minutes: 15, note: 'refrão' })
    await setSessionSong(first.id, { songId: 's2', minutes: 5, note: '' })
    await removeSessionSong(first.id, 's2')
    expect((await db.practiceSessions.get(first.id))?.songs).toEqual([
      { songId: 's1', minutes: 15, note: 'refrão' },
    ])

    await endSession(first.id, at(1, 12))
    expect(await getActiveSession()).toBeNull()
    expect((await startSession(null, at(2))).id).not.toBe(first.id)
  })
})
