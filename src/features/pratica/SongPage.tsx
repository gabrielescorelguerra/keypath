import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { addLinkAttachment, deleteSong, updateSong, useAttachments, useSong } from '@/data'
import { MAJOR_KEYS, MINOR_KEYS } from '@/domain/music'
import { parseYouTube, SONG_STATUS_LABEL, SONG_STATUSES, type Song } from '@/domain/practice'
import { StatusBadge } from '@/ui/Badges'
import { Icon } from '@/ui/Icon'
import { MetronomeControl } from '@/ui/music/MetronomeControl'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { NotFoundPage } from '../NotFoundPage.tsx'
import { AttachmentView } from './AttachmentView.tsx'
import { DropZone } from './DropZone.tsx'
import { describeImport, importFiles } from './importFiles.ts'
import styles from './Pratica.module.css'
import { practicePaths } from './paths.ts'
import { keyLabel } from './keyLabel.ts'

const KEYS = [...MAJOR_KEYS, ...MINOR_KEYS.map((k) => `${k}m`)]

/** Campo de texto que salva ao sair (blur). */
function TextField({
  label,
  value,
  onSave,
  type = 'text',
}: {
  readonly label: string
  readonly value: string
  readonly onSave: (value: string) => void
  readonly type?: 'text' | 'number'
}) {
  const [draft, setDraft] = useState(value)
  return (
    <label className={styles.field}>
      {label}
      <input
        className="input"
        type={type}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft)
        }}
      />
    </label>
  )
}

function SongDetails({ song }: { readonly song: Song }) {
  const attachments = useAttachments(song.id)
  const progress = useProgress()
  const navigate = useNavigate()
  const [link, setLink] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState(song.notes)
  const save = (patch: Partial<Song>) => void updateSong(song.id, patch)

  const toggle = (list: readonly string[], id: string, on: boolean) =>
    on ? [...list, id] : list.filter((x) => x !== id)

  return (
    <>
      <PageHeader
        title={song.title}
        crumbs={[
          { label: 'Prática', to: practicePaths.home },
          { label: 'Repertório', to: practicePaths.repertoire },
        ]}
        subtitle={song.artist ?? undefined}
        meta={
          <>
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
            {song.key && <span className="badge">Tom {keyLabel(song.key)}</span>}
            {song.bpm && <span className="badge">{song.bpm} bpm</span>}
          </>
        }
      />

      <div className="split">
        <div className={styles.column}>
          <section aria-labelledby="anexos">
            <h2 id="anexos" className="section-title">
              Anexos
            </h2>
            <div className="stack">
              {attachments && attachments.length > 0 && (
                <ul className={styles.attachments}>
                  {attachments.map((attachment) => (
                    <AttachmentView key={attachment.id} attachment={attachment} />
                  ))}
                </ul>
              )}
              <DropZone
                compact
                onFiles={(files) =>
                  void importFiles(files, song.id).then((result) =>
                    setMessage(describeImport(result)),
                  )
                }
              >
                Solte aqui cifras e partituras (PDF ou imagem) e arquivos MIDI.
              </DropZone>
              <form
                className={styles.addForm}
                onSubmit={(event) => {
                  event.preventDefault()
                  const video = parseYouTube(link)
                  if (!video) {
                    setMessage('Link do YouTube não reconhecido.')
                    return
                  }
                  void addLinkAttachment(song.id, {
                    name: 'Vídeo no YouTube',
                    url: link.trim(),
                    startSeconds: video.startSeconds,
                  }).then(() => {
                    setLink('')
                    setMessage('Vídeo adicionado.')
                  })
                }}
              >
                <label htmlFor="link-youtube" className="visually-hidden">
                  Link do YouTube
                </label>
                <input
                  id="link-youtube"
                  className="input"
                  placeholder="Colar link do YouTube (pode ter o tempo, ex.: ?t=90)"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                />
                <button type="submit" className="button" disabled={!link.trim()}>
                  <Icon name="video" size={16} />
                  Adicionar vídeo
                </button>
              </form>
              {message && (
                <p className="muted small" role="status" style={{ margin: 0 }}>
                  {message}
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="exige">
            <h2 id="exige" className="section-title">
              O que esta música exige
            </h2>
            <details className={styles.picker}>
              <summary>
                {song.competencies.length === 0
                  ? 'Escolher competências'
                  : `${song.competencies.length} competência(s) marcada(s)`}
              </summary>
              {catalog.tracks.map((track) => {
                const list = catalog.competenciesByTrack.get(track.id) ?? []
                if (list.length === 0) return null
                return (
                  <fieldset key={track.id} className={styles.checks}>
                    <legend className="eyebrow">{track.name}</legend>
                    {list.map((competency) => (
                      <label key={competency.id}>
                        <input
                          type="checkbox"
                          checked={song.competencies.includes(competency.id)}
                          onChange={(event) =>
                            save({
                              competencies: toggle(
                                song.competencies,
                                competency.id,
                                event.target.checked,
                              ),
                            })
                          }
                        />
                        {competency.title}
                      </label>
                    ))}
                  </fieldset>
                )
              })}
            </details>
            {song.competencies.length > 0 && (
              <ul className="list" style={{ marginTop: 'var(--space-3)' }}>
                {song.competencies.map((id) => {
                  const state = progress?.snapshot.competencies.get(id)
                  return (
                    <li key={id} className="row link-row">
                      <Link to={paths.competency(id)} className="plain">
                        {catalog.competencyById.get(id)?.title ?? id}
                      </Link>
                      {state && <StatusBadge status={state.status} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="aside">
          <section className={`panel ${styles.details}`} aria-label="Dados da música">
            <TextField
              key={`t-${song.title}`}
              label="Título"
              value={song.title}
              onSave={(v) => v.trim() && save({ title: v.trim() })}
            />
            <TextField
              key={`a-${song.artist}`}
              label="Artista"
              value={song.artist ?? ''}
              onSave={(v) => save({ artist: v.trim() || null })}
            />
            <div className={styles.pair}>
              <label className={styles.field}>
                Tom
                <select
                  className="select"
                  value={song.key ?? ''}
                  onChange={(event) => save({ key: event.target.value || null })}
                >
                  <option value="">—</option>
                  {KEYS.map((key) => (
                    <option key={key} value={key}>
                      {keyLabel(key)}
                    </option>
                  ))}
                </select>
              </label>
              <TextField
                key={`b-${song.bpm}`}
                label="Andamento (bpm)"
                type="number"
                value={song.bpm ? String(song.bpm) : ''}
                onSave={(v) => save({ bpm: Number(v) > 0 ? Math.round(Number(v)) : null })}
              />
            </div>
            <label className={styles.field}>
              Situação
              <select
                className="select"
                value={song.status}
                onChange={(event) => save({ status: event.target.value as Song['status'] })}
              >
                {SONG_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SONG_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className={styles.checks}>
              <legend className={styles.fieldLegend}>Estilos</legend>
              {catalog.styles.map((style) => (
                <label key={style.id}>
                  <input
                    type="checkbox"
                    checked={song.styles.includes(style.id)}
                    onChange={(event) =>
                      save({ styles: toggle(song.styles, style.id, event.target.checked) })
                    }
                  />
                  {style.name}
                </label>
              ))}
            </fieldset>
            <label className={styles.field}>
              Anotações
              <textarea
                className="textarea"
                value={notes}
                placeholder="Estrutura, introdução, onde usar o IVm, combinados com a banda…"
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => notes !== song.notes && save({ notes })}
              />
            </label>
          </section>

          <section aria-label="Metrônomo da música">
            <MetronomeControl key={song.bpm ?? 'sem-bpm'} initialBpm={song.bpm ?? 80} />
          </section>

          <button
            type="button"
            className={`button ghost sm ${styles.danger}`}
            onClick={() => {
              if (
                window.confirm(
                  `Apagar "${song.title}" e todos os anexos? Isso não pode ser desfeito.`,
                )
              ) {
                void deleteSong(song.id).then(() => navigate(practicePaths.repertoire))
              }
            }}
          >
            <Icon name="trash" size={16} />
            Apagar música
          </button>
        </aside>
      </div>
    </>
  )
}

export function SongPage() {
  const { songId = '' } = useParams()
  const song = useSong(songId)
  if (song === undefined) return <Loading />
  if (song === null) return <NotFoundPage />
  return <SongDetails key={song.id} song={song} />
}
