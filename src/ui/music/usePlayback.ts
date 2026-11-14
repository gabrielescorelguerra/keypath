import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { PLAYBACK_LATENCY, useAudio, type NoteEvent } from '@/audio'

// --- Câmera lenta: escolha compartilhada pelos exemplos da página (não é salva) ---
let slowMotion = false
const listeners = new Set<() => void>()

export function setSlowMotion(value: boolean) {
  slowMotion = value
  for (const listener of listeners) listener()
}

export function useSlowMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => slowMotion,
  )
}

/** Conta quantos eventos mantêm cada tecla presa (a mesma nota pode se sobrepor). */
function bump(current: ReadonlyMap<number, number>, midis: readonly number[], delta: number) {
  const next = new Map(current)
  for (const midi of midis) {
    const count = (next.get(midi) ?? 0) + delta
    if (count > 0) next.set(midi, count)
    else next.delete(midi)
  }
  return next
}

/**
 * Reprodução sincronizada com o teclado: `pressed` são as teclas soando agora
 * (afundadas na tela). `play` toca uma partitura; `press`/`release` tocam a
 * tecla clicada enquanto ela é segurada.
 */
export function usePlayback() {
  const { player } = useAudio()
  const [scheduled, setScheduled] = useState<ReadonlyMap<number, number>>(new Map())
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set())
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }, [])
  useEffect(() => clearTimers, [clearTimers])

  const play = useCallback(
    (events: readonly NoteEvent[]) => {
      clearTimers()
      setScheduled(new Map())
      player.stop()
      player.playEvents(events)
      const latency = PLAYBACK_LATENCY * 1000
      for (const event of events) {
        const start = latency + event.at * 1000
        // A tecla sobe um pouco antes do fim do som, para repetições ficarem visíveis.
        const end = latency + (event.at + Math.max(0.12, event.seconds * 0.9)) * 1000
        timers.current.push(
          window.setTimeout(() => setScheduled((c) => bump(c, event.midis, 1)), start),
          window.setTimeout(() => setScheduled((c) => bump(c, event.midis, -1)), end),
        )
      }
    },
    [player, clearTimers],
  )

  const press = useCallback(
    (midi: number) => {
      setHeld((current) => new Set(current).add(midi))
      player.playEvents([{ midis: [midi], at: 0, seconds: 1.5 }])
    },
    [player],
  )

  const release = useCallback((midi: number) => {
    setHeld((current) => {
      if (!current.has(midi)) return current
      const next = new Set(current)
      next.delete(midi)
      return next
    })
  }, [])

  const pressed = new Set([...scheduled.keys(), ...held])
  return { pressed, play, press, release }
}
