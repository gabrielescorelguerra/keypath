import { NavLink, Outlet, ScrollRestoration } from 'react-router'
import { catalog } from '@/content'
import styles from './Layout.module.css'
import { ProgressProvider } from './ProgressProvider.tsx'

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/biblioteca', label: 'Biblioteca', end: false },
  { to: '/pratica', label: 'Prática', end: false },
  { to: '/diagnostico', label: 'O que já sei', end: false },
  { to: '/configuracoes', label: 'Configurações', end: false },
] as const

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export function Layout() {
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)

  return (
    <ProgressProvider>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <NavLink to="/" className={styles.brand ?? ''}>
            KeyPath
          </NavLink>
          <nav aria-label="Principal" className={styles.nav}>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          {tracks.length > 0 && (
            <nav aria-label="Trilhas" className={styles.tracks}>
              <span className={styles.navTitle}>Trilhas</span>
              {tracks.map((track) => (
                <NavLink key={track.id} to={`/trilhas/${track.id}`} className={navClass}>
                  {track.name}
                </NavLink>
              ))}
            </nav>
          )}
        </aside>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </ProgressProvider>
  )
}
