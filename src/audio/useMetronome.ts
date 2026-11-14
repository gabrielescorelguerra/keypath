import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, useSettings } from '@/data'
import { Metronome } from './metronome.ts'

export function useMetronome() {
  const [beat, setBeat] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const volume = (useSettings() ?? DEFAULT_SETTINGS).volume
  const metronome = useRef<Metronome | null>(null)
  metronome.current ??= new Metronome(setBeat)

  useEffect(() => {
    metronome.current?.setVolume(volume)
  }, [volume])

  useEffect(() => () => metronome.current?.stop(), [])

  return {
    beat,
    running,
    start(bpm: number, beatsPerBar: number) {
      metronome.current?.start(bpm, beatsPerBar)
      setRunning(true)
    },
    update(bpm: number, beatsPerBar: number) {
      metronome.current?.update(bpm, beatsPerBar)
    },
    stop() {
      metronome.current?.stop()
      setRunning(false)
      setBeat(null)
    },
  }
}
