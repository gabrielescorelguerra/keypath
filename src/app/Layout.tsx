import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { catalog } from '@/content'
import { useActiveSession } from '@/data'
import { LevelMeter } from '@/ui/Badges'
import { BrandMark, Icon, type IconName } from '@/ui/Icon'
import styles from './Layout.module.css'
import { useProgress } from './progress.ts'
import { ProgressProvider } from './ProgressProvider.tsx'

const NAV: readonly { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/biblioteca', label: 'Biblioteca', icon: 'library', end: false },
  { to: '/pratica', label: 'Prática', icon: 'practice', end: false },
  { to: '/diagnostico', label: 'O que já sei', icon: 'checklist', end: false },
  { to: '/configuracoes', label: 'Configurações', icon: 'settings', end: false },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

function Sidebar() {
  const progress = useProgress()
  const activeSession = useActiveSession()
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)

  return (
    <aside className={styles.sidebar}>
      <NavLink to="/" className={styles.brand ?? ''} aria-label="KeyPath — início">
        <BrandMark />
        <span className={styles.brandName}>KeyPath</span>
      </NavLink>

      <nav aria-label="Principal" className={styles.nav}>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
            <Icon name={item.icon} className={styles.icon} />
            <span>{item.label}</span>
            {item.to === '/pratica' && activeSession && (
              <span className={styles.rec} title="Sessão em andamento">
                <span className="visually-hidden">(sessão em andamento)</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {tracks.length > 0 && (
        <nav aria-label="Trilhas" className={styles.tracks}>
          <span className={styles.navTitle}>Trilhas</span>
          {tracks.map((track) => {
            const state = progress?.snapshot.tracks.get(track.id)
            const next =
              state?.next && state.next.total > 0 ? state.next.satisfied / state.next.total : 0
            return (
              <NavLink key={track.id} to={`/trilhas/${track.id}`} className={navClass}>
                <span className={styles.trackName}>{track.name}</span>
                <span className="visually-hidden">, nível {state?.level ?? 0}</span>
                <span className={styles.trackMeter} aria-hidden="true">
                  <LevelMeter level={state?.level ?? 0} next={next} label="" size="sm" />
                </span>
              </NavLink>
            )
          })}
        </nav>
      )}
    </aside>
  )
}

/** Conteúdo com animação de entrada a cada troca de página. */
function Main() {
  const location = useLocation()
  return (
    <main className={styles.main}>
      <div key={location.pathname} className={`${styles.content} page-enter`}>
        <Outlet />
      </div>
    </main>
  )
}

export function Layout() {
  return (
    <ProgressProvider>
      <div className={styles.shell}>
        <Sidebar />
        <Main />
      </div>
      <ScrollRestoration />
    </ProgressProvider>
  )
}
