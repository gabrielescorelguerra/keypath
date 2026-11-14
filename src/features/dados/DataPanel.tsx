import { useEffect, useRef, useState } from 'react'
import {
  BackupError,
  backupReminder,
  downloadBackup,
  getPersistenceStatus,
  importBackup,
  lastActivity,
  parseBackup,
  useLastBackupAt,
  type PersistenceStatus,
} from '@/data'
import type { UserFacts } from '@/domain/progress'
import styles from './DataPanel.module.css'

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
const formatDate = (iso: string) => dateTime.format(new Date(iso))

const PERSISTENCE_TEXT: Record<PersistenceStatus, string> = {
  persisted: 'O navegador não vai apagar seus dados automaticamente.',
  'not-persisted':
    'O navegador pode apagar seus dados se faltar espaço. Faça backups com frequência.',
  unsupported:
    'Este navegador não informa se os dados são protegidos. Faça backups com frequência.',
}

type Message = { readonly kind: 'ok' | 'error'; readonly text: string }

/** Seus dados: resumo, backup (exportar/importar) e proteção do armazenamento. */
export function DataPanel({ facts }: { readonly facts: UserFacts }) {
  const lastBackupAt = useLastBackupAt()
  const [persistence, setPersistence] = useState<PersistenceStatus | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Reconsulta a cada gravação: a primeira gravação da sessão pede a proteção ao navegador.
  const writes = facts.attempts.length + facts.declarations.length + facts.lessonProgress.length
  useEffect(() => {
    if (writes >= 0) void getPersistenceStatus().then(setPersistence)
  }, [writes])

  const reminder =
    lastBackupAt === undefined
      ? 'none'
      : backupReminder({ lastBackupAt, lastActivityAt: lastActivity(facts) })

  async function handleExport() {
    try {
      await downloadBackup()
      setMessage({ kind: 'ok', text: 'Backup exportado. Guarde o arquivo em um lugar seguro.' })
    } catch {
      setMessage({ kind: 'error', text: 'Não foi possível exportar o backup.' })
    }
  }

  async function handleImport(file: File) {
    try {
      const backup = parseBackup(await file.text())
      const { attempts, declarations, lessonProgress } = backup.data
      const confirmed = window.confirm(
        `Substituir TODOS os seus dados pelo backup de ${formatDate(backup.exportedAt)}?\n\n` +
          `O backup tem ${attempts.length} tentativa(s), ${declarations.length} declaração(ões) ` +
          `e progresso em ${lessonProgress.length} aula(s).\n\n` +
          'Seus dados atuais serão perdidos. Se quiser guardá-los, exporte um backup antes.',
      )
      if (!confirmed) return
      await importBackup(backup)
      setMessage({ kind: 'ok', text: 'Backup importado.' })
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof BackupError ? error.message : 'Não foi possível importar o backup.',
      })
    }
  }

  return (
    <div className={styles.panel}>
      <dl className={styles.stats}>
        <div>
          <dt>Tentativas de exercício</dt>
          <dd>{facts.attempts.length}</dd>
        </div>
        <div>
          <dt>Competências declaradas</dt>
          <dd>{facts.declarations.length}</dd>
        </div>
        <div>
          <dt>Aulas com progresso</dt>
          <dd>{facts.lessonProgress.length}</dd>
        </div>
        <div>
          <dt>Último backup</dt>
          <dd>{lastBackupAt ? formatDate(lastBackupAt) : 'nunca'}</dd>
        </div>
      </dl>

      {reminder !== 'none' && (
        <p className={styles.reminder} role="status">
          {reminder === 'never'
            ? 'Você ainda não fez nenhum backup dos seus dados.'
            : 'Seu último backup tem mais de uma semana. Que tal exportar um novo?'}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className="button primary" onClick={() => void handleExport()}>
          Exportar backup
        </button>
        <button type="button" className="button" onClick={() => fileInput.current?.click()}>
          Importar backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Arquivo de backup"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleImport(file)
          }}
        />
      </div>

      {message && (
        <p className={message.kind === 'ok' ? styles.ok : styles.error} role="status">
          {message.text}
        </p>
      )}

      {persistence && <p className={styles.note}>{PERSISTENCE_TEXT[persistence]}</p>}
    </div>
  )
}
