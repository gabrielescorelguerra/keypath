import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { catalog } from '@/content'
import { SongItem } from '@/features/aulas/LessonSongs'
import { Icon } from '@/ui/Icon'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import { useDocumentTitle } from '@/ui/useDocumentTitle'
import styles from './Library.module.css'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** Todas as músicas sugeridas nas aulas, na ordem dos cursos. */
export function SongsPage() {
  useDocumentTitle('Músicas para aprender')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    return catalog.courses
      .map((course) => ({
        course,
        lessons: course.modules
          .flatMap((module) => module.lessons)
          .flatMap((id) => {
            const lesson = catalog.lessonById.get(id)
            if (!lesson) return []
            const songs = lesson.songs.filter(
              (song) =>
                !q ||
                normalize(`${song.title} ${song.artist} ${song.learn} ${lesson.title}`).includes(q),
            )
            return songs.length > 0 ? [{ lesson, songs }] : []
          }),
      }))
      .filter((group) => group.lessons.length > 0)
  }, [query])
  const total = catalog.lessons.reduce((sum, lesson) => sum + lesson.songs.length, 0)

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Biblioteca', to: paths.library }]}
        title="Músicas para aprender"
        subtitle="As gravações sugeridas nas aulas, cada uma com o que observar ou tocar nela."
        aside={<span className="xsmall faint num">{total} músicas</span>}
      />

      <search className={styles.search}>
        <Icon name="search" size={20} className={styles.searchIcon} />
        <label htmlFor="busca-musicas" className="visually-hidden">
          Buscar música
        </label>
        <input
          id="busca-musicas"
          type="search"
          placeholder="Buscar: artista, música, assunto (blues, dórico, 6/8…)"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value
            setParams(value ? { q: value } : {}, { replace: true })
          }}
        />
      </search>

      {groups.length === 0 && <p className="muted">Nada encontrado para “{query}”.</p>}

      <div className={styles.songGroups}>
        {groups.map(({ course, lessons }) => (
          <section key={course.id} aria-labelledby={`musicas-${course.id}`}>
            <h2 id={`musicas-${course.id}`} className={styles.groupTitle}>
              {course.title}
            </h2>
            {lessons.map(({ lesson, songs }) => (
              <div key={lesson.id} className={styles.songLesson}>
                <h3 className={styles.songLessonTitle}>
                  <Link to={paths.lesson(lesson.id)}>{lesson.title}</Link>
                </h3>
                <ul className={styles.songList}>
                  {songs.map((song) => (
                    <SongItem key={`${song.title}-${song.artist}`} song={song} lesson={lesson} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  )
}
