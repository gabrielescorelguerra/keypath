import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDatabase } from '@/test/db.ts'
import { App } from './App'

beforeEach(resetDatabase)

describe('App', () => {
  it('mostra o nome e as três áreas do KeyPath', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'KeyPath' })).toBeInTheDocument()
    const areas = screen.getByRole('list', { name: 'Áreas do KeyPath' })
    expect(within(areas).getAllByRole('listitem')).toHaveLength(3)
  })

  it('lista as trilhas e recomenda o primeiro passo', async () => {
    render(<App />)
    const tracks = await screen.findByRole('region', { name: 'Trilhas' })
    expect(within(tracks).getAllByRole('listitem')).toHaveLength(6)

    const steps = screen.getByRole('region', { name: 'Próximos passos' })
    expect(within(steps).getByText('Demonstrar a competência: Intervalos')).toBeInTheDocument()
  })

  it('declarar uma competência salva, atualiza a recomendação e o nível', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('checkbox', { name: /Intervalos/ }))

    const steps = screen.getByRole('region', { name: 'Próximos passos' })
    expect(
      await within(steps).findByText('Demonstrar a competência: Escala maior'),
    ).toBeInTheDocument()
    expect(within(steps).getByText(/Começar a aula: Revisão/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Intervalos/ })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: /Escala maior/ }))
    const tracks = screen.getByRole('region', { name: 'Trilhas' })
    expect(await within(tracks).findByText(/Nível 1 · Iniciante/)).toBeInTheDocument()

    const data = screen.getByRole('region', { name: 'Seus dados' })
    expect(
      within(data).getByText('Você ainda não fez nenhum backup dos seus dados.'),
    ).toBeInTheDocument()
  })
})
