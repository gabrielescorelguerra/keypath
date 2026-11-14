import { screen, within } from '@testing-library/react'
import { createSong, db } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(async () => {
  await resetDatabase()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

/** Células da tabela cujo texto (inclusive o oculto para leitores de tela) é `text`. */
const cells = (container: HTMLElement, text: string) =>
  within(container).queryAllByText((_, el) => el?.tagName === 'TD' && el.textContent === text)

const pdf = (name: string) => new File(['%PDF-1.4 cifra'], name, { type: 'application/pdf' })

describe('Repertório', () => {
  it('adiciona uma música pelo título e abre a página dela', async () => {
    const { user } = renderRoute('/pratica/repertorio')
    await user.type(await screen.findByPlaceholderText('Nova música: título'), 'Oceanos')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Oceanos' })).toBeInTheDocument()
  })

  it('importa vários arquivos: uma música por arquivo, com o tom lido do nome', async () => {
    const { user } = renderRoute('/pratica/repertorio')
    await user.upload(await screen.findByLabelText('Arquivos para importar'), [
      pdf('Oceanos - D.pdf'),
      pdf('Bondade de Deus (G).pdf'),
      new File(['x'], 'audio.mp3', { type: 'audio/mpeg' }),
    ])
    // O seletor de arquivos já filtra pelo tipo aceito (o .mp3 nem chega).
    expect(await screen.findByText('2 músicas criadas.')).toBeInTheDocument()

    const list = await screen.findByRole('region', { name: 'Músicas' })
    expect(await within(list).findByRole('link', { name: 'Oceanos' })).toBeInTheDocument()
    expect(cells(list, 'Tom D')).toHaveLength(1)
    expect(cells(list, 'Tom G')).toHaveLength(1)
    expect(cells(list, '1 anexo')).toHaveLength(2)
  })

  it('filtra por situação e busca sem acento', async () => {
    await createSong({ title: 'Grande é o Senhor', status: 'repertoire' })
    await createSong({ title: 'Oceanos', status: 'learning' })
    const { user } = renderRoute('/pratica/repertorio')
    const list = await screen.findByRole('region', { name: 'Músicas' })

    await user.click(within(list).getByRole('button', { name: /No repertório \(1\)/ }))
    expect(within(list).queryByRole('link', { name: 'Oceanos' })).toBeNull()

    await user.click(within(list).getByRole('button', { name: /Todas/ }))
    await user.type(within(list).getByRole('searchbox'), 'grande e')
    expect(within(list).getByRole('link', { name: 'Grande é o Senhor' })).toBeInTheDocument()
    expect(within(list).queryByRole('link', { name: 'Oceanos' })).toBeNull()
  })
})

describe('Música', () => {
  it('edita os dados, anexa PDF e vídeo, remove anexo e apaga a música', async () => {
    const song = await createSong({ title: 'Oceanos' })
    const { user } = renderRoute(`/pratica/repertorio/${song.id}`)

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Tom' }), 'D')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'ready')
    await vi.waitFor(async () =>
      expect(await db.songs.get(song.id)).toMatchObject({ key: 'D', status: 'ready' }),
    )

    await user.upload(screen.getByLabelText('Arquivos para importar'), pdf('cifra.pdf'))
    expect(await screen.findByText('1 arquivo anexado.')).toBeInTheDocument()
    expect(await screen.findByText('cifra.pdf')).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: 'Link do YouTube' }),
      'https://youtu.be/abcdef12345?t=30',
    )
    await user.click(screen.getByRole('button', { name: 'Adicionar vídeo' }))
    const video = await screen.findByTitle('Vídeo no YouTube')
    expect(video).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abcdef12345?start=30',
    )

    const attachments = screen.getByRole('region', { name: 'Anexos' })
    await user.click(
      within(attachments).getAllByRole('button', { name: 'Remover' })[0] as HTMLElement,
    )
    await vi.waitFor(async () => expect(await db.attachments.count()).toBe(1))
    expect(await db.blobs.count()).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Apagar música' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Repertório' })).toBeInTheDocument()
    expect(await db.songs.count()).toBe(0)
  })

  it('marca competências exigidas e mostra a situação de cada uma', async () => {
    const song = await createSong({ title: 'Oceanos' })
    const { user } = renderRoute(`/pratica/repertorio/${song.id}`)
    await user.click(await screen.findByText('Escolher competências'))
    await user.click(screen.getByRole('checkbox', { name: 'Subdominante menor' }))
    const region = screen.getByRole('region', { name: 'O que esta música exige' })
    expect(
      await within(region).findByRole('link', { name: 'Subdominante menor' }),
    ).toBeInTheDocument()
    expect(within(region).getByText('Não iniciada')).toBeInTheDocument()
  })
})
