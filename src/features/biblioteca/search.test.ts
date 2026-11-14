import { catalog } from '@/content'
import { createConceptSearch, normalize } from './search.ts'

const search = createConceptSearch(catalog.concepts)

it('normaliza acentos e maiúsculas', () => {
  expect(normalize('Harmônico Ação')).toBe('harmonico acao')
})

describe('busca de conceitos', () => {
  it('ignora acentos', () => {
    expect(search.search('harmonico')[0]).toBe('campo-harmonico')
    expect(search.search('triade')[0]).toBe('triade')
  })

  it('encontra por sinônimo e por prefixo', () => {
    expect(search.search('jônio')).toContain('escala-maior')
    expect(search.search('interv')[0]).toBe('intervalo')
  })

  it('combina termos (todos precisam aparecer)', () => {
    expect(search.search('campo harmonico')[0]).toBe('campo-harmonico')
    expect(search.search('campo xilofone')).toEqual([])
  })

  it('título igual à busca vem antes de títulos mais longos', () => {
    expect(search.search('campo harmonico menor')[0]).toBe('campo-harmonico-menor')
    expect(search.search('emprestimo modal')[0]).toBe('emprestimo-modal')
    expect(search.search('SDm')[0]).toBe('subdominante-menor')
  })

  it('consulta vazia não devolve nada', () => {
    expect(search.search('  ')).toEqual([])
  })
})
