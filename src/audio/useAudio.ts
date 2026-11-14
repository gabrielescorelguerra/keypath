import { useEffect, useMemo } from 'react'
import { DEFAULT_SETTINGS, useSettings } from '@/data'
import { audioPlayer, type AudioPlayer } from './player.ts'

const SILENT: AudioPlayer = {
  playChord: () => {},
  playSequence: () => {},
  playEvents: () => {},
  stop: () => {},
  setVolume: () => {},
}

/** Player conforme as configurações (som ligado/desligado e volume). */
export function useAudio(): { readonly player: AudioPlayer; readonly enabled: boolean } {
  const settings = useSettings() ?? DEFAULT_SETTINGS
  useEffect(() => {
    audioPlayer.setVolume(settings.volume)
  }, [settings.volume])
  return useMemo(
    () => ({
      player: settings.soundEnabled ? audioPlayer : SILENT,
      enabled: settings.soundEnabled,
    }),
    [settings.soundEnabled],
  )
}
