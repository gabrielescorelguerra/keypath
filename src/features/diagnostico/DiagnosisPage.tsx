import { Link } from 'react-router'
import { useProgress } from '@/app/progress'
import { catalog } from '@/content'
import { declareCompetencies, undeclareCompetencies } from '@/data'
import type { LevelNumber } from '@/domain/catalog'
import { competenciesUpToLevel } from '@/domain/progress'
import { LevelMeter, StatusBadge } from '@/ui/Badges'
import { emptyLevels, levelName } from '@/ui/labels'
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
        eyebrow="Diagnóstico"
        title="O que já sei"
        subtitle="Marque o que você já domina. O KeyPath passa a recomendar a partir daí — e você pode demonstrar com exercícios quando quiser."
      />

      <div className={styles.tracks}>
        {tracks.map((track) => {
          const competencies = catalog.competenciesByTrack.get(track.id) ?? []
          const levels = [...new Set(competencies.map((c) => c.level))].sort()
          const state = snapshot.tracks.get(track.id)
          return (
            <section key={track.id} className="ladder" aria-labelledby={`diag-${track.id}`}>
              <div className="ladder-label">
                <h2 id={`diag-${track.id}`} className={styles.trackTitle}>
                  {track.name}
                </h2>
                <LevelMeter
                  level={state?.level ?? 0}
                  label={`Nível ${state?.level ?? 0} de 5`}
                  empty={emptyLevels(track.id)}
                />
              </div>
              <div className={styles.levels}>
                {levels.map((level) => {
                  const atLevel = competencies.filter((c) => c.level === level)
                  const allSatisfied = competenciesUpToLevel(catalog, track.id, level).every(
                    (id) => snapshot.competencies.get(id)?.satisfied,
                  )
                  return (
                    <fieldset key={level} className={styles.level}>
                      <legend className={styles.legend}>
                        <span className="num">Nível {level}</span> · {levelName(level)}
                      </legend>
                      <div className={styles.items}>
                        {atLevel.map((competency) => {
                          const cs = snapshot.competencies.get(competency.id)
                          const mastered = cs?.status === 'mastered'
                          const declared = cs?.declaredAt != null
                          return (
                            <label
                              key={competency.id}
                              className={styles.item}
                              data-checked={mastered || declared}
                            >
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
                              {cs && cs.status !== 'not-started' && (
                                <StatusBadge status={cs.status} />
                              )}
                            </label>
                          )
                        })}
                      </div>
                      {!allSatisfied && (
                        <button
                          type="button"
                          className={`button ghost sm ${styles.all}`}
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
      </div>

      <p className={`muted small ${styles.note}`}>
        Declarar não apaga nada: você pode desmarcar a qualquer momento. Competências dominadas
        pelos exercícios não podem ser desmarcadas aqui. Veja os detalhes de cada uma na sua página
        — por exemplo, a partir das <Link to={paths.home}>trilhas no início</Link>.
      </p>
    </>
  )
}
