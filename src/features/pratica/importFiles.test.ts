import { db } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { describeImport, importFiles, MAX_FILE_BYTES } from './importFiles.ts'

beforeEach(resetDatabase)

it('pula tipos não suportados e arquivos grandes demais, explicando o motivo', async () => {
  const big = new File(['x'], 'enorme.pdf', { type: 'application/pdf' })
  Object.defineProperty(big, 'size', { value: MAX_FILE_BYTES + 1 })
  const result = await importFiles([
    new File(['%PDF'], 'Oceanos - D.pdf', { type: 'application/pdf' }),
    new File(['x'], 'audio.mp3', { type: 'audio/mpeg' }),
    big,
  ])
  expect(result.createdSongs).toEqual(['Oceanos'])
  expect(describeImport(result)).toBe(
    'Música criada: Oceanos. audio.mp3: tipo não suportado (use PDF, imagem ou MIDI). enorme.pdf: maior que 50 MB.',
  )
  expect(await db.songs.count()).toBe(1)
})

it('com uma música, só anexa', async () => {
  const result = await importFiles([new File(['x'], 'foto.png', { type: 'image/png' })], 'musica-1')
  expect(result).toMatchObject({ createdSongs: [], attached: 1 })
  expect(describeImport(result)).toBe('1 arquivo anexado.')
})
