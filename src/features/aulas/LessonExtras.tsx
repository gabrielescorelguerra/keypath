import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { markLessonReviewed } from '@/data'
import type { Lesson, MaterialPurpose } from '@/domain/catalog'
import { nextInPath } from '@/domain/progress'
import { Icon } from '@/ui/Icon'
import { formatMinutes } from '@/ui/labels'
import { paths } from '@/ui/paths'
import styles from './Lesson.module.css'
import { KIND_LABEL, LANGUAGE_LABEL, PURPOSE_LABEL } from './stages.ts'

const PURPOSES: readonly MaterialPurpose[] = ['understand', 'see', 'listen', 'practice']

/** Aprofundamento: materiais externos, separados por finalidade. */
export function Materials({ lesson }: { readonly lesson: Lesson }) {
  return (
    <div className={styles.materials}>
      {PURPOSES.map((purpose) => {
        const items = lesson.materials.filter((m) => m.purpose === purpose)
        if (items.length === 0) return null
        return (
          <section key={purpose} aria-labelledby={`material-${purpose}`}>
            <h3 id={`material-${purpose}`} className={styles.materialsTitle}>
              {PURPOSE_LABEL[purpose].title}
            </h3>
            <ul className={styles.materialList}>
              {items.map((m) => (
                <li key={m.url}>
                  <a href={m.url} target="_blank" rel="noreferrer noopener">
                    {m.title}
                    <Icon name="external" size={13} className={styles.external} />
                  </a>
                  <span className={styles.materialMeta}>
                    {KIND_LABEL[m.kind]} · {m.source}
                    {m.language !== 'pt' ? ` · ${LANGUAGE_LABEL[m.language]}` : ''}
                  </span>
                  {m.note && <span className={styles.materialNote}>{m.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** Próximo passo: a aula seguinte no percurso e, para aula concluída, marcar a revisão. */
export function NextStep({ lesson }: { readonly lesson: Lesson }) {
  const progress = useProgress()
  const nextId = nextInPath(catalog, lesson)
  const next = nextId ? catalog.lessonById.get(nextId) : undefined
  const module = catalog.moduleByLesson.get(lesson.id)
  const nextModule = next ? catalog.moduleByLesson.get(next.id) : undefined
  const status = progress?.studyMap.lessons.get(lesson.id)
  const completed = progress?.snapshot.lessons.get(lesson.id)?.status === 'completed'

  return (
    <section className={styles.nextStep} aria-labelledby="proximo-passo">
      <h2 id="proximo-passo" className={styles.nextTitle}>
        Próximo passo
      </h2>
      {next ? (
        <div className={styles.nextBody}>
          <span className={styles.nextKicker}>
            {nextModule && nextModule !== module
              ? `Próximo módulo: ${nextModule.title}`
              : 'Próxima aula do módulo'}
          </span>
          <Link to={paths.lesson(next.id)} className={`plain ${styles.nextLesson}`}>
            {next.title}
          </Link>
          <span className={styles.nextSummary}>
            {next.summary}
            {next.estimatedMinutes ? ` · cerca de ${formatMinutes(next.estimatedMinutes)}` : ''}
          </span>
        </div>
      ) : (
        <p className="muted">Esta é a última aula publicada do percurso.</p>
      )}
      <div className={styles.nextActions}>
        {next && (
          <Link to={paths.lesson(next.id)} className="button primary">
            Ir para a próxima aula <Icon name="arrow" size={16} />
          </Link>
        )}
        {module && (
          <Link to={paths.module(module.id)} className="button ghost">
            Ver o módulo
          </Link>
        )}
        {completed && (
          <button
            type="button"
            className="button ghost"
            onClick={() => void markLessonReviewed(lesson.id)}
          >
            {status === 'review' ? 'Marcar como revisada' : 'Revisei esta aula'}
          </button>
        )}
      </div>
    </section>
  )
}
