import { render, screen } from '@testing-library/react'
import type { Root } from 'mdast'
import { parseMarkdown } from '../../../scripts/content/markdown.ts'
import { resetDatabase } from '@/test/db.ts'
import { Markdown } from './Markdown.tsx'

beforeEach(resetDatabase)

const md = (source: string): Root => parseMarkdown(source, 'lesson').root

describe('Markdown', () => {
  it('renderiza texto, títulos (a partir de h2), listas, links e tabelas', () => {
    render(
      <Markdown
        root={md(
          '# Título\n\nTexto **forte** e *ênfase*.\n\n- um\n- dois\n\n[site](https://exemplo.com)\n\n| A | B |\n| - | - |\n| 1 | 2 |',
        )}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Título' })).toBeInTheDocument()
    expect(screen.getByText('forte').tagName).toBe('STRONG')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'site' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renderiza "erro comum" e "observação"', () => {
    render(
      <Markdown
        root={md(':::common-mistake\nCuidado.\n:::\n\n:::note{title="Dica"}\nOlha.\n:::')}
      />,
    )
    expect(screen.getByText('Erro comum')).toBeInTheDocument()
    expect(screen.getByText('Dica')).toBeInTheDocument()
  })

  it('renderiza blocos musicais e delega incorporações', () => {
    render(
      <Markdown
        root={md('::chord{symbol="C7M"}\n\n::concept{id="triade"}')}
        embeds={{ concept: (id) => <p>conceito {id}</p> }}
      />,
    )
    expect(screen.getByText('C7M')).toBeInTheDocument()
    expect(screen.getByText('conceito triade')).toBeInTheDocument()
  })

  it('não renderiza HTML bruto', () => {
    const { container } = render(<Markdown root={md('<script>alert(1)</script>\n\nTexto')} />)
    expect(container.querySelector('script')).toBeNull()
  })
})
