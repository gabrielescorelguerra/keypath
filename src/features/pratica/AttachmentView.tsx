import { useEffect, useState } from 'react'
import { deleteAttachment, getAttachmentBlob } from '@/data'
import { formatFileSize, parseYouTube, youTubeEmbedUrl, type Attachment } from '@/domain/practice'
import { Badge } from '@/ui/Badges'
import styles from './Pratica.module.css'

const KIND_LABEL = { pdf: 'PDF', image: 'Imagem', midi: 'MIDI', youtube: 'YouTube' } as const

/** URL temporária para o arquivo do anexo (liberada ao sair da tela). */
function useObjectUrl(attachment: Attachment): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let created: string | null = null
    let cancelled = false
    void getAttachmentBlob(attachment).then((blob) => {
      if (cancelled || !blob || typeof URL.createObjectURL !== 'function') return
      created = URL.createObjectURL(blob)
      setUrl(created)
    })
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [attachment])
  return url
}

function FileContent({ attachment }: { readonly attachment: Attachment }) {
  const url = useObjectUrl(attachment)
  if (!url) return null
  return (
    <>
      {attachment.kind === 'image' && (
        <img src={url} alt={attachment.name} className={styles.image} />
      )}
      {attachment.kind === 'pdf' && (
        <object
          data={url}
          type="application/pdf"
          className={styles.viewer}
          aria-label={attachment.name}
        >
          <p className="muted small">
            Não foi possível mostrar o PDF aqui. Use “Abrir em outra aba”.
          </p>
        </object>
      )}
      {attachment.kind === 'midi' && (
        <p className="muted small" style={{ margin: 0 }}>
          A reprodução de arquivos MIDI chega junto com a integração MIDI. Por enquanto, baixe o
          arquivo para abrir em outro programa.
        </p>
      )}
      <span className="row" style={{ justifyContent: 'flex-start' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="small">
          Abrir em outra aba
        </a>
        <a href={url} download={attachment.name} className="small">
          Baixar
        </a>
      </span>
    </>
  )
}

export function AttachmentView({ attachment }: { readonly attachment: Attachment }) {
  const video =
    attachment.kind === 'youtube' && attachment.url ? parseYouTube(attachment.url) : null

  return (
    <li className={styles.attachment}>
      <div className="row">
        <span>
          <Badge>{KIND_LABEL[attachment.kind]}</Badge> <strong>{attachment.name}</strong>
          {attachment.size !== null && (
            <span className="muted small"> · {formatFileSize(attachment.size)}</span>
          )}
        </span>
        <button
          type="button"
          className="button"
          onClick={() => {
            if (window.confirm(`Remover o anexo "${attachment.name}"?`)) {
              void deleteAttachment(attachment.id)
            }
          }}
        >
          Remover
        </button>
      </div>
      {video ? (
        // O player é de outra origem (youtube-nocookie.com), então scripts + same-origin
        // não dão acesso ao app; o player do YouTube precisa dos dois.
        <iframe
          className={styles.video}
          src={youTubeEmbedUrl(video.videoId, attachment.startSeconds ?? video.startSeconds)}
          title={attachment.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // oxlint-disable-next-line react/iframe-missing-sandbox
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          loading="lazy"
        />
      ) : (
        attachment.kind !== 'youtube' && <FileContent attachment={attachment} />
      )}
    </li>
  )
}
