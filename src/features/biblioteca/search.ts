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
  return {
    search: (query) => (query.trim() ? index.search(query).map((result) => String(result.id)) : []),
  }
}
