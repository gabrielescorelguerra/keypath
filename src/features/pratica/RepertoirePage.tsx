import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createSong, useAttachmentCounts, useSongs } from '@/data'
import { SONG_STATUS_LABEL, SONG_STATUSES, type SongStatus } from '@/domain/practice'
import { normalize } from '@/features/biblioteca/search'
import { Badge } from '@/ui/Badges'
import { plural } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { DropZone } from './DropZone.tsx'
import { keyLabel } from './keyLabel.ts'
import { describeImport, importFiles } from './importFiles.ts'
import styles from './Pratica.module.css'
import { practicePaths } from './paths.ts'

export function RepertoirePage() {
  const songs = useSongs()
  const counts = useAttachmentCounts()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SongStatus | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (!songs) return <Loading />

  const q = normalize(query.trim())
  const visible = songs.filter(
    (song) =>
      (status === null || song.status === status) &&
      (!q || normalize(`${song.title} ${song.artist ?? ''}`).includes(q)),
  )

  return (
    <>
      <PageHeader
        title="Repertório"
        crumbs={[{ label: 'Prática', to: practicePaths.home }]}
        subtitle="Suas músicas, com cifras, partituras, áudios MIDI e vídeos. Tudo fica só neste dispositivo e entra no backup."
      />

      <div className="stack">
        <form
          className={styles.toolbar}
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim()) return
            void createSong({ title }).then((song) => navigate(practicePaths.song(song.id)))
          }}
        >
          <label htmlFor="nova-musica" className="visually-hidden">
            Título da nova música
          </label>
          <input
            id="nova-musica"
            className={styles.input}
            placeholder="Nova música: título"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit" className="button primary" disabled={!title.trim()}>
            Adicionar
          </button>
        </form>

        <DropZone
          onFiles={(files) =>
            void importFiles(files).then((result) => setMessage(describeImport(result)))
          }
        >
          <strong>Importar várias de uma vez:</strong> solte aqui PDFs, imagens ou arquivos MIDI.
          Cada arquivo vira uma música. O tom é lido do nome, como em “Oceanos - D.pdf”.
        </DropZone>
        {message && (
          <p className="muted small" role="status">
            {message}
          </p>
        )}
      </div>

      <section className="section" aria-label="Músicas">
        {songs.length === 0 ? (
          <p className="muted">
            Nenhuma música ainda. Adicione uma pelo título ou importe arquivos.
          </p>
        ) : (
          <>
            <div className={`${styles.toolbar} ${styles.filters}`}>
              <label htmlFor="busca-musica" className="visually-hidden">
                Buscar no repertório
              </label>
              <input
                id="busca-musica"
                type="search"
                className={styles.input}
                placeholder="Buscar por título ou artista"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span className={styles.filters} role="group" aria-label="Filtrar por situação">
                <button
                  type="button"
                  className={styles.chip}
                  aria-pressed={status === null}
                  onClick={() => setStatus(null)}
                >
                  Todas ({songs.length})
                </button>
                {SONG_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.chip}
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                  >
                    {SONG_STATUS_LABEL[s]} ({songs.filter((song) => song.status === s).length})
                  </button>
                ))}
              </span>
            </div>
            <ul className="list" style={{ marginTop: 'var(--space-3)' }}>
              {visible.map((song) => {
                const attachments = counts?.get(song.id) ?? 0
                return (
                  <li key={song.id} className="row">
                    <span>
                      <Link to={practicePaths.song(song.id)} className="plain">
                        <strong>{song.title}</strong>
                      </Link>
                      {song.artist && <span className="muted small"> · {song.artist}</span>}
                    </span>
                    <span className="row">
                      {song.key && <Badge>Tom {keyLabel(song.key)}</Badge>}
                      {attachments > 0 && <Badge>{plural(attachments, 'anexo', 'anexos')}</Badge>}
                      <Badge tone={song.status === 'learning' ? 'accent' : 'neutral'}>
                        {SONG_STATUS_LABEL[song.status]}
                      </Badge>
                    </span>
                  </li>
                )
              })}
              {visible.length === 0 && <li className="muted">Nenhuma música com esse filtro.</li>}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
