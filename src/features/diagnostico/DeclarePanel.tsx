import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import type { ProgressSnapshot } from '@/domain/progress'
import styles from './DeclarePanel.module.css'

const STATUS_TEXT = {
  mastered: 'dominada',
  declared: 'declarada',
  'in-progress': 'em andamento',
  'not-started': '',
} as const

/** Diagnóstico provisório: marcar o que já sabe (declarar conhecimento prévio). */
export function DeclarePanel({ snapshot }: { readonly snapshot: ProgressSnapshot }) {
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)

  return (
    <div className={styles.groups}>
      {tracks.map((track) => (
        <fieldset key={track.id} className={styles.group}>
          <legend className={styles.legend}>{track.name}</legend>
          {(catalog.competenciesByTrack.get(track.id) ?? []).map((competency) => {
            const state = snapshot.competencies.get(competency.id)
            const mastered = state?.status === 'mastered'
            const declared = state?.declaredAt !== null && state?.declaredAt !== undefined
            return (
              <label key={competency.id} className={styles.item}>
                <input
                  type="checkbox"
                  checked={mastered || declared}
                  disabled={mastered}
                  onChange={(event) =>
                    void (event.target.checked
                      ? declareCompetencies([competency.id])
                      : undeclareCompetencies([competency.id]))
                  }
                />
                <span className={styles.title}>
                  {competency.title}
                  <span className={styles.level}> · nível {competency.level}</span>
                </span>
                {state && STATUS_TEXT[state.status] && (
                  <span className={styles.status}>{STATUS_TEXT[state.status]}</span>
                )}
              </label>
            )
          })}
        </fieldset>
      ))}
    </div>
  )
}
