import {
  attachmentKindOf,
  formatFileSize,
  parseYouTube,
  songFromFileName,
  youTubeEmbedUrl,
} from './files.ts'

describe('attachmentKindOf', () => {
  it.each([
    ['cifra.pdf', '', 'pdf'],
    ['foto.JPG', '', 'image'],
    ['x', 'image/png', 'image'],
    ['arranjo.mid', '', 'midi'],
    ['arranjo.midi', 'audio/midi', 'midi'],
    ['x', 'application/pdf', 'pdf'],
    ['musica.mp3', 'audio/mpeg', null],
    ['texto.docx', '', null],
  ])('%s (%s) → %s', (name, mime, expected) => {
    expect(attachmentKindOf(name, mime)).toBe(expected)
  })
})

describe('songFromFileName', () => {
  it.each([
    ['Grande é o Senhor - G.pdf', 'Grande é o Senhor', 'G'],
    ['grande_e_o_senhor – Bb.pdf', 'grande e o senhor', 'Bb'],
    ['Oceanos (Em).png', 'Oceanos', 'Em'],
    ['Oceanos [tom D].jpg', 'Oceanos', 'D'],
    ['Bondade de Deus em F#.pdf', 'Bondade de Deus', 'F#'],
    ['Bondade de Deus tom B♭m.pdf', 'Bondade de Deus', 'Bbm'],
    ['Sem tom.pdf', 'Sem tom', null],
    ['Faixa - Ao Vivo.pdf', 'Faixa - Ao Vivo', null],
  ])('%s → %s / %s', (file, title, key) => {
    expect(songFromFileName(file)).toEqual({ title, key })
  })
})

describe('parseYouTube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', null],
    ['https://youtu.be/dQw4w9WgXcQ?t=90', 'dQw4w9WgXcQ', 90],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s', 'dQw4w9WgXcQ', 90],
    ['https://www.youtube.com/shorts/abcDEF12345', 'abcDEF12345', null],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', null],
  ])('%s', (url, videoId, startSeconds) => {
    expect(parseYouTube(url)).toEqual({ videoId, startSeconds })
  })

  it.each(['não é link', 'https://vimeo.com/123', 'https://youtube.com/watch'])(
    'rejeita %s',
    (url) => {
      expect(parseYouTube(url)).toBeNull()
    },
  )

  it('monta o endereço de incorporação', () => {
    expect(youTubeEmbedUrl('abc123xyz', 30)).toBe(
      'https://www.youtube-nocookie.com/embed/abc123xyz?start=30',
    )
  })
})

it('formatFileSize', () => {
  expect(formatFileSize(500)).toBe('500 B')
  expect(formatFileSize(2048)).toBe('2 KB')
  expect(formatFileSize(3.5 * 1024 * 1024)).toBe('3,5 MB')
})
