import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createSong, useAttachmentCounts, useSongs } from '@/data'
import { SONG_STATUS_LABEL, SONG_STATUSES, type SongStatus } from '@/domain/practice'
import { normalize } from '@/features/biblioteca/search'
import { Icon } from '@/ui/Icon'
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
        subtitle="Suas músicas, com cifras, partituras, arquivos MIDI e vídeos. Tudo fica só neste dispositivo e entra no backup."
        aside={
          <span className="xsmall faint num">{plural(songs.length, 'música', 'músicas')}</span>
        }
      />

      <div className={styles.addRow}>
        <form
          className={styles.addForm}
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
            className="input"
            placeholder="Nova música: título"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit" className="button primary" disabled={!title.trim()}>
            <Icon name="plus" size={16} />
            Adicionar
          </button>
        </form>

        <DropZone
          compact
          onFiles={(files) =>
            void importFiles(files).then((result) => setMessage(describeImport(result)))
          }
        >
          <strong>Importar vários de uma vez.</strong> Solte PDFs, imagens ou MIDI — cada arquivo
          vira uma música, e o tom é lido do nome (“Oceanos - D.pdf”).
        </DropZone>
      </div>
      {message && (
        <p className={`muted small ${styles.message}`} role="status">
          {message}
        </p>
      )}

      <section className={styles.listSection} aria-label="Músicas">
        {songs.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="note" size={28} />
            <p>Nenhuma música ainda. Adicione uma pelo título ou importe arquivos.</p>
          </div>
        ) : (
          <>
            <div className={styles.filterBar}>
              <span className={styles.searchBox}>
                <Icon name="search" size={16} />
                <label htmlFor="busca-musica" className="visually-hidden">
                  Buscar no repertório
                </label>
                <input
                  id="busca-musica"
                  type="search"
                  className="input"
                  placeholder="Buscar por título ou artista"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
              <span className={styles.segmented} role="group" aria-label="Filtrar por situação">
                <button
                  type="button"
                  aria-pressed={status === null}
                  onClick={() => setStatus(null)}
                >
                  Todas <span className="num faint">({songs.length})</span>
                </button>
                {SONG_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                  >
                    {SONG_STATUS_LABEL[s]}{' '}
                    <span className="mono">
                      ({songs.filter((song) => song.status === s).length})
                    </span>
                  </button>
                ))}
              </span>
            </div>

            <table className={`table ${styles.songTable}`}>
              <thead>
                <tr>
                  <th>Música</th>
                  <th>Tom</th>
                  <th>Anexos</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((song) => {
                  const attachments = counts?.get(song.id) ?? 0
                  return (
                    <tr key={song.id}>
                      <td>
                        <Link
                          to={practicePaths.song(song.id)}
                          className={`plain ${styles.songTitle}`}
                        >
                          {song.title}
                        </Link>
                        {song.artist && <span className={styles.artist}>{song.artist}</span>}
                      </td>
                      <td className="num">
                        {song.key ? (
                          <>
                            <span className="visually-hidden">Tom </span>
                            {keyLabel(song.key)}
                          </>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td className="num">
                        {attachments > 0 ? (
                          <>
                            {attachments}
                            <span className="visually-hidden">
                              {attachments === 1 ? ' anexo' : ' anexos'}
                            </span>
                          </>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="status"
                          data-tone={
                            song.status === 'learning'
                              ? 'accent'
                              : song.status === 'wishlist'
                                ? 'neutral'
                                : 'success'
                          }
                        >
                          {SONG_STATUS_LABEL[song.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Nenhuma música com esse filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </>
  )
}
