import { BALL_ID } from './board'
import type { Play, Vec } from './types'

/** Suaviza o início e o fim do movimento (fica mais natural que linear). */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function between(a: Vec | null, b: Vec | null, t: number): Vec | null {
  if (a && b) return lerp(a, b, t)
  // entrou ou saiu do campo nesse trecho: troca na metade
  return t < 0.5 ? a : b
}

/**
 * Posições de todas as peças num instante da animação.
 * `time` vai de 0 (primeiro quadro) até frames.length - 1 (último quadro);
 * 1.5 significa "no meio do caminho entre o quadro 2 e o 3".
 */
export function positionsAt(play: Play, time: number): Record<string, Vec | null> {
  const last = play.frames.length - 1
  const clamped = Math.max(0, Math.min(time, last))
  const i = Math.min(Math.floor(clamped), Math.max(0, last - 1))
  const a = play.frames[i]
  const b = play.frames[Math.min(i + 1, last)]
  const t = last === 0 ? 0 : easeInOut(clamped - i)
  const out: Record<string, Vec | null> = {}
  for (const p of play.players) {
    out[p.id] = between(a.positions[p.id] ?? null, b.positions[p.id] ?? null, t)
  }
  out[BALL_ID] = between(a.ball, b.ball, t)
  return out
}

/** Duração total da animação, em ms. */
export function totalDuration(play: Play): number {
  return Math.max(0, play.frames.length - 1) * play.frameDurationMs
}
