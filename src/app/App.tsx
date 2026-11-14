import styles from './App.module.css'

const AREAS = [
  {
    title: 'Aprendizado guiado',
    question: 'O que eu estudo agora?',
  },
  {
    title: 'Biblioteca',
    question: 'Como funciona X?',
  },
  {
    title: 'Prática',
    question: 'O que eu treino hoje?',
  },
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
        <p className={styles.status}>Em construção.</p>
      </main>
    </div>
  )
}
