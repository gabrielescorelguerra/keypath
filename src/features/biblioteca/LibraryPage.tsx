import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { catalog } from '@/content'
import type { Concept } from '@/domain/catalog'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './Library.module.css'
import { createConceptSearch } from './search.ts'

const conceptSearch = createConceptSearch(catalog.concepts)

function ConceptItem({ concept }: { readonly concept: Concept }) {
  return (
    <li className="stack" style={{ gap: 'var(--space-1)' }}>
      <Link to={paths.concept(concept.id)} className="plain">
        <strong>{concept.title}</strong>
      </Link>
      <span className="muted small">{concept.summary}</span>
    </li>
  )
}

export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''

  const results = useMemo(
    () =>
      conceptSearch.search(query).flatMap((id) => {
        const concept = catalog.conceptById.get(id)
        return concept ? [concept] : []
      }),
    [query],
  )

  const byTrack = catalog.tracks
    .map((track) => ({
      track,
      concepts: catalog.concepts
        .filter((c) => (c.tracks[0] ?? '') === track.id)
        .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
    }))
    .filter((group) => group.concepts.length > 0)
  const general = catalog.concepts.filter((c) => c.tracks.length === 0)

  return (
    <>
      <PageHeader
        title="Biblioteca"
        subtitle="Consulte acordes, escalas, harmonia e teoria — a mesma fonte usada nas aulas."
      />

      <search className={styles.search}>
        <label htmlFor="busca" className="visually-hidden">
          Buscar na Biblioteca
        </label>
        <input
          id="busca"
          type="search"
          placeholder="Buscar: campo harmônico, tríade, intervalo…"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value
            setParams(value ? { q: value } : {}, { replace: true })
          }}
        />
      </search>

      {query ? (
        <section className="section" aria-label="Resultados da busca">
          {results.length === 0 ? (
            <p className="muted">Nada encontrado para “{query}”.</p>
          ) : (
            <ul className="list">
              {results.map((concept) => (
                <ConceptItem key={concept.id} concept={concept} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {byTrack.map(({ track, concepts }) => (
            <section key={track.id} className="section" aria-labelledby={`bib-${track.id}`}>
              <h2 id={`bib-${track.id}`}>{track.name}</h2>
              <ul className="list">
                {concepts.map((concept) => (
                  <ConceptItem key={concept.id} concept={concept} />
                ))}
              </ul>
            </section>
          ))}
          {general.length > 0 && (
            <section className="section" aria-labelledby="bib-geral">
              <h2 id="bib-geral">Geral</h2>
              <ul className="list">
                {general.map((concept) => (
                  <ConceptItem key={concept.id} concept={concept} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  )
}
