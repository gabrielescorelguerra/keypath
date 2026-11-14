import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { addLinkAttachment, deleteSong, updateSong, useAttachments, useSong } from '@/data'
import { MAJOR_KEYS, MINOR_KEYS } from '@/domain/music'
import { parseYouTube, SONG_STATUS_LABEL, SONG_STATUSES, type Song } from '@/domain/practice'
import { StatusBadge } from '@/ui/Badges'
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
        className={styles.input}
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
        subtitle={[
          song.artist,
          song.key && `Tom ${keyLabel(song.key)}`,
          song.bpm && `${song.bpm} bpm`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <section className="card stack" aria-label="Dados da música">
        <div className={styles.fields}>
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
          <label className={styles.field}>
            Tom
            <select
              className={styles.select}
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
          <label className={styles.field}>
            Situação
            <select
              className={styles.select}
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
        </div>

        <fieldset className={styles.checks} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="muted small">Estilos</legend>
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
            className={styles.textarea}
            value={notes}
            placeholder="Estrutura, introdução, onde usar o IVm, combinados com a banda…"
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => notes !== song.notes && save({ notes })}
          />
        </label>
      </section>

      <section className="section" aria-label="Metrônomo da música">
        <MetronomeControl key={song.bpm ?? 'sem-bpm'} initialBpm={song.bpm ?? 80} />
      </section>

      <section className="section" aria-labelledby="anexos">
        <h2 id="anexos">Anexos</h2>
        <div className="stack">
          <DropZone
            onFiles={(files) =>
              void importFiles(files, song.id).then((result) => setMessage(describeImport(result)))
            }
          >
            Solte aqui cifras e partituras (PDF ou imagem) e arquivos MIDI.
          </DropZone>
          <form
            className={styles.toolbar}
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
              className={styles.input}
              placeholder="Colar link do YouTube (pode ter o tempo, ex.: ?t=90)"
              value={link}
              onChange={(event) => setLink(event.target.value)}
            />
            <button type="submit" className="button" disabled={!link.trim()}>
              Adicionar vídeo
            </button>
          </form>
          {message && (
            <p className="muted small" role="status" style={{ margin: 0 }}>
              {message}
            </p>
          )}
          {attachments && attachments.length > 0 && (
            <ul className="list">
              {attachments.map((attachment) => (
                <AttachmentView key={attachment.id} attachment={attachment} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="exige">
        <h2 id="exige">O que esta música exige</h2>
        <p className="muted small">
          Marque as competências que a música usa. Você vê na hora quais já domina.
        </p>
        <details className="card">
          <summary>
            {song.competencies.length === 0
              ? 'Escolher competências'
              : `${song.competencies.length} competência(s) marcada(s)`}
          </summary>
          {catalog.tracks.map((track) => {
            const list = catalog.competenciesByTrack.get(track.id) ?? []
            if (list.length === 0) return null
            return (
              <fieldset
                key={track.id}
                className={styles.checks}
                style={{ border: 0, padding: 'var(--space-2) 0' }}
              >
                <legend className="muted small">{track.name}</legend>
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
                <li key={id} className="row">
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

      <section className="section">
        <button
          type="button"
          className="button"
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
          Apagar música
        </button>
      </section>
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
