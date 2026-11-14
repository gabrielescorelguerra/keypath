import { useAudio } from '@/audio'
import type { QuestionAudio } from '@/domain/catalog'
import { notesToMidi, parseChord, voiceChord, type NoteName } from '@/domain/music'
import { Link } from 'react-router'
import { Icon } from '../Icon.tsx'
import { paths } from '../paths.ts'
import styles from './Music.module.css'
import { sequenceScore } from './score.ts'
import { usePlayback } from './usePlayback.ts'

function notesOf(audio: QuestionAudio): readonly NoteName[] {
  if (audio.chord) return voiceChord(parseChord(audio.chord), { octave: 4 })
  return (audio.notes ?? '').trim().split(/\s+/).filter(Boolean)
}

/** Botão de uma questão de percepção: toca o som a reconhecer (quantas vezes quiser). */
export function ListenButton({ audio }: { readonly audio: QuestionAudio }) {
  const { enabled } = useAudio()
  const playback = usePlayback()
  if (!enabled) {
    return (
      <span className={styles.listenOff}>
        Questão de ouvido: ative o som em <Link to={paths.settings}>Configurações</Link>.
      </span>
    )
  }
  const midis = notesToMidi(notesOf(audio))
  const play = () => {
    if (audio.play === 'together') {
      playback.play([{ midis, at: 0, seconds: 1.8 }])
    } else if (audio.play === 'melody') {
      playback.play(
        sequenceScore(
          midis.map((m) => [m]),
          0.7,
          false,
        ),
      )
    } else {
      // Arpejo: nota por nota e depois juntas.
      const step = 0.45
      playback.play([
        ...midis.map((m, i) => ({ midis: [m], at: i * step, seconds: step * 0.95 })),
        { midis, at: midis.length * step + 0.1, seconds: 1.8 },
      ])
    }
  }
  return (
    <button type="button" className={styles.listen} onClick={play}>
      <span className={styles.playIcon} aria-hidden="true">
        <Icon name="play" size={14} />
      </span>
      Ouvir
    </button>
  )
}
