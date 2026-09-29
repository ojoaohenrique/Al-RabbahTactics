import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Relógio da animação. `time` vai de 0 até `frameCount - 1`
 * (ex.: 1.5 = metade do caminho entre o quadro 2 e o 3).
 * Usa requestAnimationFrame, que sincroniza com a tela (60 fps).
 */
export function usePlayback(frameCount: number, frameDurationMs: number) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const raf = useRef(0)

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    if (frameCount < 2) return
    setTime(0)
    setPlaying(true)
  }, [frameCount])

  useEffect(() => {
    if (!playing) return
    const end = frameCount - 1
    let last = performance.now()
    let current = 0
    let hold = 0
    const tick = (now: number) => {
      current = Math.min(end, current + (now - last) / frameDurationMs)
      last = now
      setTime(current)
      if (current >= end) {
        // segura o último quadro um instante e encerra
        hold = window.setTimeout(() => setPlaying(false), 600)
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      clearTimeout(hold)
    }
  }, [playing, frameCount, frameDurationMs])

  return { playing, time, start, stop }
}
