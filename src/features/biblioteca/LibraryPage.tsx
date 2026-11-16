import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { catalog } from '@/content'
import type { Concept } from '@/domain/catalog'
import { Icon } from '@/ui/Icon'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './Library.module.css'
import { createConceptSearch } from './search.ts'

const conceptSearch = createConceptSearch(catalog.concepts)

function ConceptItem({ concept }: { readonly concept: Concept }) {
  return (
    <li className={styles.entry}>
      <Link to={paths.concept(concept.id)} className={`plain ${styles.entryTitle}`}>
        {concept.title}
      </Link>
      <span className={styles.entrySummary}>{concept.summary}</span>
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
        eyebrow="Consulta livre"
        title="Biblioteca"
        subtitle="Acordes, escalas, harmonia e teoria — a mesma fonte usada nas aulas."
        aside={<span className="xsmall faint num">{catalog.concepts.length} verbetes</span>}
      />

      <Link to={paths.songs} className={`plain ${styles.songsLink}`}>
        <Icon name="book" size={20} />
        <span>
          <strong>Músicas para aprender</strong>
          <span className={styles.songsLinkHint}>
            As gravações sugeridas nas aulas — o que ouvir em cada uma e como tocar.
          </span>
        </span>
        <Icon name="arrow" size={16} />
      </Link>

      <search className={styles.search}>
        <Icon name="search" size={20} className={styles.searchIcon} />
        <label htmlFor="busca" className="visually-hidden">
          Buscar na Biblioteca
        </label>
        <input
          id="busca"
          type="search"
          placeholder="Buscar: campo harmônico, tríade, empréstimo…"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value
            setParams(value ? { q: value } : {}, { replace: true })
          }}
        />
      </search>

      {query ? (
        <section className={styles.results} aria-label="Resultados da busca">
          <span className="eyebrow">
            {results.length === 0
              ? 'Nenhum resultado'
              : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}
          </span>
          {results.length === 0 ? (
            <p className="muted">Nada encontrado para “{query}”.</p>
          ) : (
            <ul className={styles.entries}>
              {results.map((concept) => (
                <ConceptItem key={concept.id} concept={concept} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className={styles.index}>
          {byTrack.map(({ track, concepts }) => (
            <section key={track.id} className={styles.group} aria-labelledby={`bib-${track.id}`}>
              <h2 id={`bib-${track.id}`} className={styles.groupTitle}>
                {track.name}
                <span className="xsmall faint num" aria-hidden="true">
                  {concepts.length}
                </span>
              </h2>
              <ul className={styles.entries}>
                {concepts.map((concept) => (
                  <ConceptItem key={concept.id} concept={concept} />
                ))}
              </ul>
            </section>
          ))}
          {general.length > 0 && (
            <section className={styles.group} aria-labelledby="bib-geral">
              <h2 id="bib-geral" className={styles.groupTitle}>
                Geral
              </h2>
              <ul className={styles.entries}>
                {general.map((concept) => (
                  <ConceptItem key={concept.id} concept={concept} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  )
}
