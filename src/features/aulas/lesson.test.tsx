import { screen, within } from '@testing-library/react'
import { loadFacts } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(resetDatabase)

const LESSON = '/aulas/harmonia.revisao-campo-harmonico-maior'

describe('Aula', () => {
  it('mostra objetivos, pré-requisitos, introdução e a primeira parte; registra a visita', async () => {
    renderRoute(LESSON)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Revisão: tríades e campo harmônico maior',
      }),
    ).toBeInTheDocument()
    const before = screen.getByRole('region', { name: 'Antes de começar' })
    expect(within(before).getByRole('link', { name: 'Tríades' })).toBeInTheDocument()
    expect(within(before).getByRole('link', { name: 'Intervalos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Parte 1 de 3/ })).toBeInTheDocument()
    // O conceito incorporado da Biblioteca e o exercício aparecem dentro da parte
    expect(screen.getByText('Da Biblioteca')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tríades — quiz' })).toBeInTheDocument()

    await vi.waitFor(async () =>
      expect((await loadFacts()).lessonProgress[0]?.lessonId).toBe(
        'harmonia.revisao-campo-harmonico-maior',
      ),
    )
  })

  it('concluir as partes avança e, no fim, mostra a aula concluída com os critérios', async () => {
    const { user } = renderRoute(LESSON)
    await user.click(await screen.findByRole('button', { name: 'Concluí esta parte · próxima →' }))
    expect(await screen.findByRole('heading', { name: /Parte 2 de 3/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Concluí esta parte · próxima →' }))
    expect(await screen.findByRole('heading', { name: /Parte 3 de 3/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Concluí esta parte' }))
    const completed = await screen.findByRole('region', { name: /Aula concluída/ })
    expect(
      within(completed).getByText(/não marca as competências como dominadas/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Concluída · 3\/3/)).toBeInTheDocument()

    // Desfazer a última parte
    await user.click(screen.getByRole('button', { name: '✓ Parte concluída (desfazer)' }))
    expect(await screen.findByText(/Em andamento · 2\/3/)).toBeInTheDocument()
  })

  it('a aula em andamento passa a ser recomendada no início', async () => {
    const { user } = renderRoute(LESSON)
    await user.click(await screen.findByRole('button', { name: 'Concluí esta parte · próxima →' }))
    await screen.findByRole('heading', { name: /Parte 2 de 3/ })

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    await user.click(within(nav).getByRole('link', { name: 'Início' }))
    const steps = await screen.findByRole('region', { name: 'Próximos passos' })
    expect(within(steps).getByText('Continuar aula')).toBeInTheDocument()
  })
})
