import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import { competenciesUpToLevel } from '@/domain/progress'
import type { LevelNumber } from '@/domain/catalog'
import { StatusBadge } from '@/ui/Badges'
import { levelName } from '@/ui/labels'
import { Loading, PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'
import styles from './DiagnosisPage.module.css'

/** Diagnóstico: declarar o que já sabe, competência a competência ou "tudo até o nível N". */
export function DiagnosisPage() {
  const progress = useProgress()
  if (!progress) return <Loading />
  const { snapshot } = progress
  const tracks = catalog.tracks.filter((t) => catalog.competenciesByTrack.get(t.id)?.length)

  return (
    <>
      <PageHeader
        title="O que já sei"
        subtitle="Marque o que você já domina. O KeyPath passa a recomendar a partir daí — e você pode demonstrar com exercícios quando quiser."
      />

      {tracks.map((track) => {
        const competencies = catalog.competenciesByTrack.get(track.id) ?? []
        const levels = [...new Set(competencies.map((c) => c.level))].sort()
        return (
          <section key={track.id} className="section" aria-labelledby={`diag-${track.id}`}>
            <h2 id={`diag-${track.id}`}>{track.name}</h2>
            <div className="stack">
              {levels.map((level) => {
                const atLevel = competencies.filter((c) => c.level === level)
                const allSatisfied = competenciesUpToLevel(catalog, track.id, level).every(
                  (id) => snapshot.competencies.get(id)?.satisfied,
                )
                return (
                  <fieldset key={level} className={`card ${styles.level}`}>
                    <legend className={styles.legend}>
                      Nível {level} · {levelName(level)}
                    </legend>
                    {atLevel.map((competency) => {
                      const state = snapshot.competencies.get(competency.id)
                      const mastered = state?.status === 'mastered'
                      const declared = state?.declaredAt != null
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
                          <span className={styles.title}>{competency.title}</span>
                          {state && state.status !== 'not-started' && (
                            <StatusBadge status={state.status} />
                          )}
                        </label>
                      )
                    })}
                    {!allSatisfied && (
                      <button
                        type="button"
                        className={`button ${styles.all}`}
                        onClick={() =>
                          void declareCompetencies(
                            competenciesUpToLevel(catalog, track.id, level as LevelNumber),
                          )
                        }
                      >
                        Já sei tudo de {track.name} até o nível {level}
                      </button>
                    )}
                  </fieldset>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="section muted small">
        Declarar não apaga nada: você pode desmarcar a qualquer momento. Competências dominadas
        (cumpridas pelos exercícios) não podem ser desmarcadas aqui. Veja os detalhes de cada uma na
        sua página — por exemplo, a partir das <Link to={paths.home}>trilhas no início</Link>.
      </p>
    </>
  )
}
