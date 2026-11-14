import { screen, within } from '@testing-library/react'
import { getSettings } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(resetDatabase)

describe('Início', () => {
  it('recomenda o primeiro passo, mostra as trilhas e convida ao diagnóstico', async () => {
    renderRoute('/')
    const steps = await screen.findByRole('region', { name: 'Próximos passos' })
    expect(
      within(steps).getByRole('link', { name: 'Intervalos no teclado e de ouvido' }),
    ).toHaveAttribute('href', '/aulas/teoria.intervalos-no-teclado-e-de-ouvido')
    const tracks = screen.getByRole('region', { name: 'Suas trilhas' })
    expect(within(tracks).getByText('Harmonia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o diagnóstico' })).toBeInTheDocument()
  })
})

describe('navegação', () => {
  it('menu lateral leva à trilha, e dela à competência', async () => {
    const { user } = renderRoute('/')
    const trackNav = await screen.findByRole('navigation', { name: 'Trilhas' })
    await user.click(within(trackNav).getByRole('link', { name: /^Harmonia/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Harmonia' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nível 1 · Iniciante' })).toBeInTheDocument()
    expect(screen.getByText('Antes, recomendado: Intervalos')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Tríades' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Tríades' })).toBeInTheDocument()
  })

  it('rota desconhecida mostra "não encontrada"', async () => {
    renderRoute('/competencias/nao-existe')
    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
  })
})

describe('Competência', () => {
  it('declarar e remover a declaração', async () => {
    const { user } = renderRoute('/competencias/teoria.intervalos')
    await user.click(await screen.findByRole('button', { name: 'Já sei isto' }))
    expect(await screen.findByText('Declarada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover declaração' }))
    const standing = screen.getByRole('region', { name: 'Situação' })
    expect(await within(standing).findByText('Não iniciada')).toBeInTheDocument()
  })

  it('declarar junto com os pré-requisitos libera a próxima', async () => {
    const { user } = renderRoute('/competencias/harmonia.triades')
    await user.click(await screen.findByRole('button', { name: 'Já sei isto e o pré-requisito' }))

    const prerequisites = await screen.findByRole('region', { name: 'Pré-requisitos' })
    expect(await within(prerequisites).findByText('Declarada')).toBeInTheDocument()
  })

  it('lista critérios com o exercício de cada um', async () => {
    renderRoute('/competencias/harmonia.campo-harmonico-maior-triades')
    const criteria = await screen.findByRole('region', { name: 'Critérios de domínio' })
    expect(
      within(criteria).getByRole('link', { name: 'Campo harmônico maior — quiz' }),
    ).toBeInTheDocument()
    expect(within(criteria).getByText(/em 2 dias diferentes \(0 até agora\)/)).toBeInTheDocument()
  })
})

describe('Diagnóstico', () => {
  it('"já sei tudo até o nível" declara o nível inteiro e sobe o nível da trilha', async () => {
    const { user } = renderRoute('/diagnostico')
    await user.click(
      await screen.findByRole('button', { name: 'Já sei tudo de Teoria musical até o nível 1' }),
    )
    await vi.waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Escala maior/ })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: /Intervalos/ })).toBeChecked()
    })

    await user.click(screen.getByRole('link', { name: 'Início' }))
    const tracks = await screen.findByRole('region', { name: 'Suas trilhas' })
    expect(await within(tracks).findByText('Nível 1 · Iniciante')).toBeInTheDocument()
  })
})

describe('Configurações', () => {
  it('muda a nomenclatura das notas e salva', async () => {
    const { user } = renderRoute('/configuracoes')
    await user.click(await screen.findByRole('radio', { name: /Dó, Ré, Mi/ }))
    await vi.waitFor(async () => expect((await getSettings()).noteNaming).toBe('latin'))
    await vi.waitFor(() => expect(screen.getByRole('radio', { name: /Dó, Ré, Mi/ })).toBeChecked())
  })

  it('mostra o painel de dados com o lembrete de backup', async () => {
    renderRoute('/configuracoes')
    expect(await screen.findByRole('button', { name: 'Exportar backup' })).toBeInTheDocument()
  })
})

describe('Biblioteca', () => {
  it('busca sem acento e abre o verbete com tabela e exemplo tocável', async () => {
    const { user } = renderRoute('/biblioteca')
    await user.type(await screen.findByRole('searchbox'), 'harmonico')
    const results = await screen.findByRole('region', { name: 'Resultados da busca' })
    await user.click(within(results).getByRole('link', { name: 'Campo harmônico' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Campo harmônico' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('group', { name: 'Acordes' }).length).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: 'Competência: Campo harmônico maior (tríades)' }),
    ).toBeInTheDocument()
  })

  it('sem busca, lista os conceitos por trilha', async () => {
    renderRoute('/biblioteca')
    expect(await screen.findByRole('heading', { name: 'Teoria musical' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Intervalo' })).toBeInTheDocument()
  })
})
