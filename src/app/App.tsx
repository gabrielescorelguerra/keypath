import { catalog } from '@/content'
import styles from './App.module.css'

const AREAS = [
  { title: 'Aprendizado guiado', question: 'O que eu estudo agora?' },
  { title: 'Biblioteca', question: 'Como funciona X?' },
  { title: 'Prática', question: 'O que eu treino hoje?' },
] as const

export function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.brand}>KeyPath</h1>
        <p className={styles.tagline}>Sua escola de teclado e piano</p>
      </header>

      <main className={styles.main}>
        <ul className={styles.areas} aria-label="Áreas do KeyPath">
          {AREAS.map((area) => (
            <li key={area.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{area.title}</h2>
              <p className={styles.cardText}>{area.question}</p>
            </li>
          ))}
        </ul>

        <section className={styles.section} aria-labelledby="trilhas">
          <h2 id="trilhas" className={styles.sectionTitle}>
            Trilhas
          </h2>
          <ul className={styles.tracks}>
            {catalog.tracks.map((track) => {
              const count = catalog.competenciesByTrack.get(track.id)?.length ?? 0
              return (
                <li key={track.id} className={styles.track}>
                  <span className={styles.trackName}>{track.name}</span>
                  <span className={styles.trackCount}>
                    {count === 1 ? '1 competência' : `${count} competências`}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <p className={styles.status}>
          Em construção · catálogo com {catalog.concepts.length} conceitos, {catalog.lessons.length}{' '}
          {catalog.lessons.length === 1 ? 'aula' : 'aulas'} e {catalog.exercises.length} exercícios.
        </p>
      </main>
    </div>
  )
}
