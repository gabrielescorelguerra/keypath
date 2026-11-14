import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('mostra o nome e as três áreas do KeyPath', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'KeyPath' })).toBeInTheDocument()

    const areas = screen.getByRole('list', { name: 'Áreas do KeyPath' })
    expect(areas.children).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Aprendizado guiado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Biblioteca' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prática' })).toBeInTheDocument()
  })
})
