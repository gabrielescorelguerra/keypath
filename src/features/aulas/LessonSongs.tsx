import { Link } from 'react-router'
import { createSong, useSongs } from '@/data'
import type { Lesson, LessonSong } from '@/domain/catalog'
import { keyLabel } from '@/features/pratica/keyLabel'
import { practicePaths } from '@/features/pratica/paths'
import { Icon } from '@/ui/Icon'
import { paths } from '@/ui/paths'
import styles from './LessonSongs.module.css'

/** Busca da gravação no YouTube — não depende de um vídeo específico continuar no ar. */
function listenUrl(song: LessonSong): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`
}

/** Busca da partitura no IMSLP (só para obras em domínio público). */
function scoreUrl(song: LessonSong): string {
  return `https://imslp.org/index.php?search=${encodeURIComponent(`${song.title} ${song.artist}`)}`
}

/** Negrito em linha (**assim**) — o único Markdown usado nas descrições das músicas. */
function Emphasis({ text }: { readonly text: string }) {
  return text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

const sameSong = (a: { title: string; artist: string | null }, b: LessonSong) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
  (a.artist ?? '').trim().toLowerCase() === b.artist.trim().toLowerCase()

/** Uma música sugerida: o que aprender com ela, onde ouvir e o botão para o repertório. */
export function SongItem({
  song,
  lesson,
  showLesson = false,
}: {
  readonly song: LessonSong
  readonly lesson: Lesson
  readonly showLesson?: boolean
}) {
  const repertoire = useSongs()
  const saved = repertoire?.find((s) => sameSong(s, song))
  const key = keyLabel(song.key)

  return (
    <li className={styles.song}>
      <div className={styles.head}>
        <span className={styles.title}>{song.title}</span>
        <span className={styles.artist}>
          {song.artist}
          {key && ` · tom de ${key}`}
          {song.publicDomain && ' · domínio público'}
        </span>
      </div>
      <p className={styles.learn}>
        <Emphasis text={song.learn} />
      </p>
      {showLesson && (
        <span className={styles.from}>
          Aula: <Link to={paths.lesson(lesson.id)}>{lesson.title}</Link>
        </span>
      )}
      <div className={styles.actions}>
        <a href={listenUrl(song)} target="_blank" rel="noreferrer noopener" className="arrow-link">
          Ouvir no YouTube
          <Icon name="external" size={13} />
        </a>
        {song.publicDomain && (
          <a href={scoreUrl(song)} target="_blank" rel="noreferrer noopener" className="arrow-link">
            Partitura no IMSLP
            <Icon name="external" size={13} />
          </a>
        )}
        {saved ? (
          <Link to={practicePaths.song(saved.id)} className={styles.saved}>
            ✓ No seu repertório
          </Link>
        ) : (
          <button
            type="button"
            className="button ghost sm"
            disabled={repertoire === undefined}
            onClick={() =>
              void createSong({
                title: song.title,
                artist: song.artist,
                key: song.key,
                status: 'wishlist',
                styles: lesson.styles,
                competencies: lesson.competencies,
                notes: `Sugerida na aula "${lesson.title}": ${song.learn.replaceAll('**', '')}`,
              })
            }
          >
            Adicionar ao repertório
          </button>
        )}
      </div>
    </li>
  )
}

/** "Músicas para aprender": as gravações sugeridas pela aula. */
export function LessonSongs({ lesson }: { readonly lesson: Lesson }) {
  if (lesson.songs.length === 0) return null
  return (
    <section aria-labelledby="musicas-para-aprender" className={styles.section}>
      <h3 id="musicas-para-aprender" className={styles.sectionTitle}>
        Músicas para aprender
      </h3>
      <p className={styles.hint}>
        Gravações em que o assunto da aula aparece. Ouça procurando o que está indicado e, se quiser
        tocar, adicione ao seu repertório — ela entra como “Quero aprender”.
      </p>
      <ul className={styles.list}>
        {lesson.songs.map((song) => (
          <SongItem key={`${song.title}-${song.artist}`} song={song} lesson={lesson} />
        ))}
      </ul>
    </section>
  )
}
