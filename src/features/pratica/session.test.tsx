import { screen, within } from '@testing-library/react'
import { createSong, db, declareCompetencies, loadFacts } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(async () => {
  await resetDatabase()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('Sessão de prática', () => {
  it('começa uma sessão com foco, mostra o cronômetro e sugere músicas em estudo', async () => {
    await createSong({ title: 'Oceanos', status: 'learning' })
    const { user } = renderRoute('/pratica')

    await user.type(await screen.findByPlaceholderText(/Foco de hoje/), 'tríades')
    await user.click(screen.getByRole('button', { name: 'Começar sessão' }))
    expect(await screen.findByRole('timer', { name: 'Tempo da sessão' })).toBeInTheDocument()
    expect(screen.getByText(/foco: tríades/)).toBeInTheDocument()

    const suggestions = screen.getByRole('region', { name: 'O que treinar agora' })
    expect(await within(suggestions).findByRole('link', { name: 'Oceanos' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Metrônomo' })).toBeInTheDocument()
    expect(await db.practiceSessions.count()).toBe(1)
  })

  it('sem sessão, a tentativa não tem sessão', async () => {
    const { user } = renderRoute('/exercicios/harmonia.triades.quiz')
    // sem sessão: não há sessionId
    await user.click(await screen.findByRole('radio', { name: 'Fá Lá♭ Dó' }))
    await user.click(screen.getByRole('radio', { name: 'Terça menor + terça menor' }))
    await user.click(screen.getByRole('radio', { name: 'Aumentada' }))
    await user.click(screen.getByRole('button', { name: 'Corrigir' }))
    await screen.findByText(/Você acertou/)
    expect((await loadFacts()).attempts[0]?.context.sessionId).toBeUndefined()
  })

  it('percurso completo até o resumo', async () => {
    await createSong({ title: 'Oceanos', status: 'learning' })
    const session = await import('@/data').then((d) => d.startSession('campo'))
    const { user } = renderRoute('/exercicios/harmonia.triades.quiz')

    await user.click(await screen.findByRole('radio', { name: 'Fá Lá♭ Dó' }))
    await user.click(screen.getByRole('radio', { name: 'Terça menor + terça menor' }))
    await user.click(screen.getByRole('radio', { name: 'Aumentada' }))
    await user.click(screen.getByRole('button', { name: 'Corrigir' }))
    await screen.findByText(/Você acertou/)
    await vi.waitFor(async () =>
      expect((await loadFacts()).attempts[0]?.context.sessionId).toBe(session.id),
    )

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    await user.click(within(nav).getByRole('link', { name: 'Prática' }))
    expect(await screen.findByText(/1 exercício feito nesta sessão/)).toBeInTheDocument()

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Música' }), 'Oceanos')
    await user.clear(screen.getByRole('spinbutton', { name: 'Minutos' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Minutos' }), '15')
    await user.type(screen.getByRole('textbox', { name: 'O que trabalhou' }), 'introdução')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    const songs = screen.getByRole('region', { name: 'Músicas praticadas' })
    expect(await within(songs).findByText(/15 min · introdução/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Encerrar sessão' }))
    expect(await screen.findByRole('heading', { level: 1, name: /Sessão de/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tríades — quiz' })).toBeInTheDocument()
    expect(screen.getByText('100% de acertos')).toBeInTheDocument()
    expect(screen.getByText(/15 min · introdução/)).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('navigation', { name: 'Você está em' })).getByRole('link', {
        name: 'Prática',
      }),
    )
    expect(await screen.findByRole('button', { name: 'Começar sessão' })).toBeInTheDocument()
    expect(screen.getByText(/1 sessão/)).toBeInTheDocument()
  })

  it('o início avisa da sessão em andamento', async () => {
    await declareCompetencies(['teoria.intervalos'])
    await import('@/data').then((d) => d.startSession())
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Voltar para a sessão' })).toBeInTheDocument()
  })
})
