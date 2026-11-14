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
      <PageHeader eyebrow="Preferências" title="Configurações" />

      <div className={styles.groups}>
        <section className="ladder" aria-labelledby="notas">
          <div className="ladder-label">
            <h2 id="notas" className={styles.groupTitle}>
              Nomes das notas
            </h2>
            <p className={styles.groupText}>
              Como as notas aparecem nas aulas, no teclado e nos exercícios.
            </p>
          </div>
          <fieldset className={styles.options}>
            <legend className="visually-hidden">Como exibir os nomes das notas</legend>
            {NAMINGS.map((option) => (
              <label
                key={option.value}
                className={styles.option}
                data-checked={settings.noteNaming === option.value}
              >
                <input
                  type="radio"
                  name="noteNaming"
                  value={option.value}
                  checked={settings.noteNaming === option.value}
                  onChange={() => void updateSettings({ noteNaming: option.value })}
                />
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.preview}>
                  — ex.: {formatPitchClass('C#', option.value)},{' '}
                  {formatPitchClass('Bb', option.value)}
                </span>
              </label>
            ))}
            <p className={`xsmall faint ${styles.hint}`}>
              Cifras usam sempre letras, no padrão brasileiro (C7M, Am7(♭5)).
            </p>
          </fieldset>
        </section>

        <section className="ladder" aria-labelledby="som">
          <div className="ladder-label">
            <h2 id="som" className={styles.groupTitle}>
              Som
            </h2>
            <p className={styles.groupText}>Exemplos musicais e metrônomo.</p>
          </div>
          <div className={`panel ${styles.controls}`}>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(event) => void updateSettings({ soundEnabled: event.target.checked })}
              />
              <span>Tocar os exemplos musicais</span>
            </label>
            <label className={styles.volume}>
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                disabled={!settings.soundEnabled}
                onChange={(event) => void updateSettings({ volume: Number(event.target.value) })}
              />
              <span className="mono small">{Math.round(settings.volume * 100)}%</span>
            </label>
          </div>
        </section>

        <section className="ladder" aria-labelledby="seus-dados">
          <div className="ladder-label">
            <h2 id="seus-dados" className={styles.groupTitle}>
              Seus dados
            </h2>
            <p className={styles.groupText}>
              Tudo fica neste dispositivo. O backup é a sua cópia de segurança.
            </p>
          </div>
          <DataPanel facts={progress.facts} />
        </section>
      </div>
    </>
  )
}
