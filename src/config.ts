import { PITCHES } from './domain/pitches'
import type { Play } from './domain/types'

/** Escudo do time (arquivo em public/). */
export const LOGO_URL = `${import.meta.env.BASE_URL}alrabbah-logo.png`

/** Cores disponíveis para setas, linhas e zonas. */
export const DRAW_COLORS = ['#ffffff', '#facc15', '#E8661F', '#ef4444', '#38bdf8', '#111111']

/** Área exportada na imagem PNG: só o campo, sem o banco. */
export function exportViewBox(play: Play) {
  const spec = PITCHES[play.pitch]
  const m = spec.tokenRadius * 3
  return { x: -m, y: -m, width: spec.length + m * 2, height: spec.width + m * 2 }
}
