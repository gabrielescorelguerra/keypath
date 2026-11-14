import { screen, within } from '@testing-library/react'
import { getSettings } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(resetDatabase)

describe('Aprender', () => {
  it('mostra onde estou, a próxima aula e o mapa de um curso por vez', async () => {
    const { user } = renderRoute('/aprender')
    const where = await screen.findByRole('region', { name: 'Intervalos' })
    expect(within(where).getByText('Próxima aula')).toBeInTheDocument()
    expect(within(where).getByRole('link', { name: /Começar/ })).toHaveAttribute(
      'href',
      '/aulas/teoria.intervalos-no-teclado-e-de-ouvido',
    )

    const tabs = screen.getByRole('tablist', { name: 'Cursos' })
    expect(within(tabs).getByRole('tab', { name: 'Fundamentos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(tabs).getByRole('tab', { name: 'Timbres e sound design' }))
    const map = screen.getByRole('list', { name: 'Módulos de Timbres e sound design' })
    expect(within(map).getByRole('link', { name: 'Fundamentos de síntese' })).toBeInTheDocument()
  })

  it('define um objetivo e mostra o caminho até ele', async () => {
    const { user } = renderRoute('/aprender')
    const goals = await screen.findByRole('region', { name: 'Objetivos de estudo' })
    await user.selectOptions(within(goals).getByRole('combobox'), 'harmonia-e-tecnica.tetrades')
    await vi.waitFor(async () =>
      expect((await getSettings()).goals).toEqual(['harmonia-e-tecnica.tetrades']),
    )
    const chain = await within(goals).findByRole('list', { name: 'Caminho até o objetivo' })
    expect(
      within(chain)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Intervalos', 'Tríades e campo harmônico maior', 'Tétrades'])
  })
})

describe('Módulo', () => {
  it('lista aulas em ordem, tópicos em preparação e pré-requisitos', async () => {
    renderRoute('/aprender/harmonia-e-tecnica.funcoes-e-progressoes')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Funções e progressões' }),
    ).toBeInTheDocument()
    const lessons = screen.getByRole('region', { name: 'Aulas, em ordem' })
    expect(within(lessons).getByRole('link', { name: 'Funções harmônicas' })).toBeInTheDocument()
    expect(within(lessons).getByText(/Progressões comuns/)).toBeInTheDocument()
    const before = screen.getByRole('region', { name: 'Antes deste módulo' })
    expect(within(before).getByRole('link', { name: 'Tétrades' })).toBeInTheDocument()
  })
})
