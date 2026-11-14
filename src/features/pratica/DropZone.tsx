import { useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/ui/Icon'
import styles from './Pratica.module.css'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.mid,.midi,application/pdf,image/*,audio/midi'

/** Área para soltar arquivos (ou escolher no computador/celular). */
export function DropZone({
  onFiles,
  children,
  label = 'Escolher arquivos',
  compact = false,
}: {
  readonly onFiles: (files: File[]) => void
  readonly children?: ReactNode
  readonly label?: string
  readonly compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <div
      className={styles.dropZone}
      data-over={over}
      data-compact={compact}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        const files = [...event.dataTransfer.files]
        if (files.length > 0) onFiles(files)
      }}
    >
      <span className={styles.dropIcon} aria-hidden="true">
        <Icon name="upload" size={20} />
      </span>
      <div className={styles.dropText}>{children}</div>
      <button type="button" className="button sm" onClick={() => input.current?.click()}>
        {label}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        aria-label="Arquivos para importar"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])]
          event.target.value = ''
          if (files.length > 0) onFiles(files)
        }}
      />
    </div>
  )
}
