import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { KeyRule } from './Notation.tsx'
import styles from './Page.module.css'
import { useDocumentTitle } from './useDocumentTitle.ts'

export interface Crumb {
  readonly label: string
  readonly to: string
}

/**
 * Cabeçalho de página: trilha de navegação (ou rótulo), título serifado,
 * subtítulo, ações à direita e meta (linha de badges). Define o título da aba.
 */
export function PageHeader({
  title,
  crumbs = [],
  eyebrow,
  subtitle,
  aside,
  meta,
}: {
  readonly title: string
  readonly crumbs?: readonly Crumb[]
  readonly eyebrow?: string
  readonly subtitle?: ReactNode
  readonly aside?: ReactNode
  readonly meta?: ReactNode
}) {
  useDocumentTitle(title)

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.main}>
          {crumbs.length > 0 ? (
            <nav aria-label="Você está em" className={styles.crumbs}>
              {crumbs.map((crumb, index) => (
                <span key={crumb.to}>
                  {index > 0 && (
                    <span aria-hidden="true" className={styles.sep}>
                      /
                    </span>
                  )}
                  <Link to={crumb.to}>{crumb.label}</Link>
                </span>
              ))}
            </nav>
          ) : (
            eyebrow && <span className="eyebrow accent">{eyebrow}</span>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          {meta && <div className={styles.meta}>{meta}</div>}
        </div>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
      <KeyRule className={styles.rule ?? ''} />
    </header>
  )
}

export function Loading() {
  return (
    <div className={styles.loading} role="status" aria-label="Carregando">
      <span />
      <span />
      <span />
    </div>
  )
}
