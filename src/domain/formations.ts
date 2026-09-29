import type { PitchId, Vec } from './types'
import type { PitchSpec } from './pitches'

/**
 * Uma formação é uma lista de posições relativas para o time da CASA,
 * que ataca da esquerda para a direita.
 *   fx: 0 = linha do próprio gol · 0.5 = meio-campo
 *   fy: 0 = lateral de cima · 1 = lateral de baixo
 * O primeiro item é sempre o goleiro. O visitante usa o espelho.
 */
export interface Formation {
  id: string
  label: string
  slots: { fx: number; fy: number }[]
}

const GK = { fx: 0.04, fy: 0.5 }

export const FORMATIONS: Record<PitchId, Formation[]> = {
  society: [
    { id: '2-3-1', label: '2-3-1', slots: [GK, { fx: 0.16, fy: 0.3 }, { fx: 0.16, fy: 0.7 }, { fx: 0.3, fy: 0.15 }, { fx: 0.28, fy: 0.5 }, { fx: 0.3, fy: 0.85 }, { fx: 0.44, fy: 0.5 }] },
    { id: '3-2-1', label: '3-2-1', slots: [GK, { fx: 0.15, fy: 0.2 }, { fx: 0.14, fy: 0.5 }, { fx: 0.15, fy: 0.8 }, { fx: 0.3, fy: 0.33 }, { fx: 0.3, fy: 0.67 }, { fx: 0.44, fy: 0.5 }] },
    { id: '2-2-2', label: '2-2-2', slots: [GK, { fx: 0.15, fy: 0.32 }, { fx: 0.15, fy: 0.68 }, { fx: 0.29, fy: 0.25 }, { fx: 0.29, fy: 0.75 }, { fx: 0.43, fy: 0.35 }, { fx: 0.43, fy: 0.65 }] },
    { id: '3-1-2', label: '3-1-2', slots: [GK, { fx: 0.15, fy: 0.2 }, { fx: 0.14, fy: 0.5 }, { fx: 0.15, fy: 0.8 }, { fx: 0.28, fy: 0.5 }, { fx: 0.43, fy: 0.33 }, { fx: 0.43, fy: 0.67 }] },
  ],
  campo: [
    { id: '4-4-2', label: '4-4-2', slots: [GK, { fx: 0.14, fy: 0.15 }, { fx: 0.12, fy: 0.38 }, { fx: 0.12, fy: 0.62 }, { fx: 0.14, fy: 0.85 }, { fx: 0.28, fy: 0.15 }, { fx: 0.27, fy: 0.38 }, { fx: 0.27, fy: 0.62 }, { fx: 0.28, fy: 0.85 }, { fx: 0.43, fy: 0.38 }, { fx: 0.43, fy: 0.62 }] },
    { id: '4-3-3', label: '4-3-3', slots: [GK, { fx: 0.14, fy: 0.15 }, { fx: 0.12, fy: 0.38 }, { fx: 0.12, fy: 0.62 }, { fx: 0.14, fy: 0.85 }, { fx: 0.26, fy: 0.3 }, { fx: 0.24, fy: 0.5 }, { fx: 0.26, fy: 0.7 }, { fx: 0.42, fy: 0.18 }, { fx: 0.45, fy: 0.5 }, { fx: 0.42, fy: 0.82 }] },
    { id: '3-5-2', label: '3-5-2', slots: [GK, { fx: 0.12, fy: 0.25 }, { fx: 0.11, fy: 0.5 }, { fx: 0.12, fy: 0.75 }, { fx: 0.28, fy: 0.1 }, { fx: 0.24, fy: 0.35 }, { fx: 0.22, fy: 0.5 }, { fx: 0.24, fy: 0.65 }, { fx: 0.28, fy: 0.9 }, { fx: 0.43, fy: 0.38 }, { fx: 0.43, fy: 0.62 }] },
    { id: '4-2-3-1', label: '4-2-3-1', slots: [GK, { fx: 0.14, fy: 0.15 }, { fx: 0.12, fy: 0.38 }, { fx: 0.12, fy: 0.62 }, { fx: 0.14, fy: 0.85 }, { fx: 0.23, fy: 0.38 }, { fx: 0.23, fy: 0.62 }, { fx: 0.34, fy: 0.18 }, { fx: 0.34, fy: 0.5 }, { fx: 0.34, fy: 0.82 }, { fx: 0.45, fy: 0.5 }] },
  ],
  futsal: [
    { id: '1-2-1', label: '1-2-1 (losango)', slots: [GK, { fx: 0.16, fy: 0.5 }, { fx: 0.3, fy: 0.2 }, { fx: 0.3, fy: 0.8 }, { fx: 0.44, fy: 0.5 }] },
    { id: '2-2', label: '2-2 (quadrado)', slots: [GK, { fx: 0.18, fy: 0.3 }, { fx: 0.18, fy: 0.7 }, { fx: 0.4, fy: 0.3 }, { fx: 0.4, fy: 0.7 }] },
    { id: '3-1', label: '3-1', slots: [GK, { fx: 0.2, fy: 0.2 }, { fx: 0.17, fy: 0.5 }, { fx: 0.2, fy: 0.8 }, { fx: 0.44, fy: 0.5 }] },
  ],
}

/** Converte uma formação em posições reais (metros), espelhando para o visitante. */
export function formationPositions(spec: PitchSpec, formation: Formation, side: 'home' | 'away'): Vec[] {
  return formation.slots.map(({ fx, fy }) => {
    const x = fx * spec.length
    const y = fy * spec.width
    return side === 'home' ? { x, y } : { x: spec.length - x, y: spec.width - y }
  })
}
