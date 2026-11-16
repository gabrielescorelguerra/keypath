import { screen, within } from '@testing-library/react'
import { db } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(resetDatabase)

describe('Músicas para aprender', () => {
  it('aparecem no Aprofundamento e vão para o repertório como "Quero aprender"', async () => {
    const { user } = renderRoute(
      '/aulas/teoria.escala-maior-e-escalas-menores?parte=aprofundamento',
    )
    const section = await screen.findByRole('region', { name: 'Músicas para aprender' })
    const item = within(section).getByText('Für Elise').closest('li')
    if (!item) throw new Error('música não encontrada')
    expect(within(item).getByRole('link', { name: /Ouvir no YouTube/ })).toHaveAttribute(
      'href',
      expect.stringContaining('youtube.com/results?search_query='),
    )
    expect(within(item).getByRole('link', { name: /Partitura no IMSLP/ })).toBeInTheDocument()

    await user.click(within(item).getByRole('button', { name: 'Adicionar ao repertório' }))
    expect(await within(item).findByRole('link', { name: /No seu repertório/ })).toBeInTheDocument()
    const [song] = await db.songs.toArray()
    expect(song).toMatchObject({
      title: 'Für Elise',
      artist: 'Ludwig van Beethoven',
      key: 'Am',
      status: 'wishlist',
    })
  })

  it('a Biblioteca reúne as músicas de todas as aulas, com busca', async () => {
    const { user } = renderRoute('/biblioteca')
    await user.click(await screen.findByRole('link', { name: /Músicas para aprender/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Músicas para aprender' }),
    ).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar música' }), 'beethoven')
    expect(screen.getByText('Für Elise')).toBeInTheDocument()
    expect(screen.queryByText('Oye Como Va')).not.toBeInTheDocument()
  })
})
