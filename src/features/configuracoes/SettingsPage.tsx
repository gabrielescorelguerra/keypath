import { useProgress } from '@/app/progress'
import { updateSettings, useSettings } from '@/data'
import { formatPitchClass, type NoteNaming } from '@/domain/music'
import { Loading, PageHeader } from '@/ui/Page'
import { DataPanel } from '../dados/DataPanel.tsx'
import styles from './SettingsPage.module.css'

const NAMINGS: readonly { value: NoteNaming; label: string }[] = [
  { value: 'both', label: 'Os dois' },
  { value: 'latin', label: 'Dó, Ré, Mi' },
  { value: 'letters', label: 'C, D, E' },
]

export function SettingsPage() {
  const settings = useSettings()
  const progress = useProgress()
  if (!settings || !progress) return <Loading />

  return (
    <>
      <PageHeader title="Configurações" />

      <section className="section" aria-labelledby="notas">
        <h2 id="notas">Nomes das notas</h2>
        <fieldset className={`card ${styles.options}`}>
          <legend className="visually-hidden">Como exibir os nomes das notas</legend>
          {NAMINGS.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="radio"
                name="noteNaming"
                value={option.value}
                checked={settings.noteNaming === option.value}
                onChange={() => void updateSettings({ noteNaming: option.value })}
              />
              <span>
                {option.label}{' '}
                <span className="muted small">
                  — ex.: {formatPitchClass('C#', option.value)},{' '}
                  {formatPitchClass('Bb', option.value)}
                </span>
              </span>
            </label>
          ))}
          <p className="muted small" style={{ margin: 0 }}>
            Cifras usam sempre letras, no padrão brasileiro (C7M, Am7(♭5)).
          </p>
        </fieldset>
      </section>

      <section className="section" aria-labelledby="som">
        <h2 id="som">Som</h2>
        <div className={`card ${styles.options}`}>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(event) => void updateSettings({ soundEnabled: event.target.checked })}
            />
            Tocar os exemplos musicais
          </label>
          <label className={styles.option}>
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              disabled={!settings.soundEnabled}
              onChange={(event) => void updateSettings({ volume: Number(event.target.value) })}
            />
            <span className="muted small">{Math.round(settings.volume * 100)}%</span>
          </label>
        </div>
      </section>

      <section className="section" aria-labelledby="seus-dados">
        <h2 id="seus-dados">Seus dados</h2>
        <DataPanel facts={progress.facts} />
      </section>
    </>
  )
}
