import MiniSearch from 'minisearch'
import type { Concept } from '@/domain/catalog'
import { plainText } from '@/ui/markdown/text'

/** Minúsculas e sem acentos: "Harmônico" → "harmonico". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

interface ConceptDocument {
  readonly id: string
  readonly title: string
  readonly aliases: string
  readonly summary: string
  readonly body: string
}

export interface ConceptSearch {
  search(query: string): readonly string[]
}

/** Índice de busca dos conceitos: título e sinônimos pesam mais que o texto. */
export function createConceptSearch(concepts: readonly Concept[]): ConceptSearch {
  const index = new MiniSearch<ConceptDocument>({
    fields: ['title', 'aliases', 'summary', 'body'],
    processTerm: (term) => normalize(term),
    searchOptions: {
      boost: { title: 4, aliases: 3, summary: 2 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  })
  index.addAll(
    concepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      aliases: concept.aliases.join(' '),
      summary: concept.summary,
      body: plainText(concept.body),
    })),
  )
  const titles = new Map(
    concepts.map((c) => [c.id, [c.title, ...c.aliases].map((t) => normalize(t))] as const),
  )
  // Título (ou sinônimo) igual à busca vem primeiro; depois, títulos que começam com ela.
  const rank = (id: string, query: string) => {
    const names = titles.get(id) ?? []
    if (names.includes(query)) return 0
    if (names.some((name) => name.startsWith(query))) return 1
    return 2
  }

  return {
    search: (query) => {
      const normalized = normalize(query.trim())
      if (!normalized) return []
      return index
        .search(query)
        .map((result, position) => ({ id: String(result.id), position }))
        .sort((a, b) => rank(a.id, normalized) - rank(b.id, normalized) || a.position - b.position)
        .map((result) => result.id)
    },
  }
}
