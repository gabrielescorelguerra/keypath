import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import styles from './Page.module.css'

export interface Crumb {
  readonly label: string
  readonly to: string
}

/** Cabeçalho de página: trilha de navegação, título e subtítulo. Também define o título da aba. */
export function PageHeader({
  title,
  crumbs = [],
  subtitle,
  aside,
}: {
  readonly title: string
  readonly crumbs?: readonly Crumb[]
  readonly subtitle?: ReactNode
  readonly aside?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · KeyPath`
  }, [title])

  return (
    <header className={styles.header}>
      {crumbs.length > 0 && (
        <nav aria-label="Você está em" className={styles.crumbs}>
          {crumbs.map((crumb, index) => (
            <span key={crumb.to}>
              {index > 0 && <span aria-hidden="true"> / </span>}
              <Link to={crumb.to}>{crumb.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {aside}
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </header>
  )
}

export function Loading() {
  return <p className="muted">Carregando…</p>
}
