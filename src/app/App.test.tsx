import { render, screen, within } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('mostra o nome e as três áreas do KeyPath', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'KeyPath' })).toBeInTheDocument()
    const areas = screen.getByRole('list', { name: 'Áreas do KeyPath' })
    expect(within(areas).getAllByRole('listitem')).toHaveLength(3)
  })

  it('lista as trilhas do catálogo de conteúdo', () => {
    render(<App />)

    const section = screen.getByRole('region', { name: 'Trilhas' })
    expect(within(section).getAllByRole('listitem')).toHaveLength(6)
    expect(within(section).getByText('Harmonia')).toBeInTheDocument()
  })

  it('mostra os próximos passos recomendados', () => {
    render(<App />)

    const section = screen.getByRole('region', { name: 'Próximos passos' })
    expect(within(section).getByText('Demonstrar a competência: Intervalos')).toBeInTheDocument()
  })
})
