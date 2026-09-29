import type { PitchColorId, PitchId } from './types'

/**
 * Medidas de cada tipo de campo, em metros.
 * O desenho das linhas (components/PitchMarkings.tsx) lê tudo daqui,
 * então para ajustar o campo de vocês basta mudar os números.
 */
export interface PitchSpec {
  id: PitchId
  label: string
  /** comprimento (eixo x) */
  length: number
  /** largura (eixo y) */
  width: number
  playersPerTeam: number
  /** reservas extras que aparecem no banco */
  reserves: number
  /** raio da bolinha do jogador, proporcional ao tamanho do campo */
  tokenRadius: number
  centerCircleRadius: number
  goal: { width: number; depth: number }
  /** área grande retangular (society/campo) */
  penaltyArea?: { width: number; depth: number }
  /** pequena área */
  goalArea?: { width: number; depth: number }
  /** área em "D" do futsal: raio dos quartos de círculo */
  futsalAreaRadius?: number
  penaltySpot: number
  /** segunda marca de pênalti (futsal: 10 m) */
  secondPenaltySpot?: number
  /** meia-lua da grande área (campo) */
  penaltyArcRadius?: number
  cornerArcRadius: number
}

export const PITCHES: Record<PitchId, PitchSpec> = {
  society: {
    id: 'society',
    label: 'Society (7x7)',
    length: 50,
    width: 30,
    playersPerTeam: 7,
    reserves: 3,
    tokenRadius: 0.95,
    centerCircleRadius: 4,
    goal: { width: 5, depth: 1.2 },
    penaltyArea: { width: 16, depth: 7 },
    goalArea: { width: 8, depth: 2.5 },
    penaltySpot: 6,
    cornerArcRadius: 0.6,
  },
  campo: {
    id: 'campo',
    label: 'Campo (11x11)',
    length: 105,
    width: 68,
    playersPerTeam: 11,
    reserves: 3,
    tokenRadius: 1.75,
    centerCircleRadius: 9.15,
    goal: { width: 7.32, depth: 2 },
    penaltyArea: { width: 40.32, depth: 16.5 },
    goalArea: { width: 18.32, depth: 5.5 },
    penaltySpot: 11,
    penaltyArcRadius: 9.15,
    cornerArcRadius: 1,
  },
  futsal: {
    id: 'futsal',
    label: 'Futsal (5x5)',
    length: 40,
    width: 20,
    playersPerTeam: 5,
    reserves: 3,
    tokenRadius: 0.75,
    centerCircleRadius: 3,
    goal: { width: 3, depth: 1 },
    futsalAreaRadius: 6,
    penaltySpot: 6,
    secondPenaltySpot: 10,
    cornerArcRadius: 0.25,
  },
}

export const PITCH_ORDER: PitchId[] = ['society', 'campo', 'futsal']

/** Espaço ao redor do campo (em múltiplos do raio da bolinha). */
export function pitchMargin(spec: PitchSpec): number {
  return spec.tokenRadius * 3
}

/**
 * Onde fica o banco: duas fileiras abaixo do campo (time da casa em cima,
 * visitante embaixo) e a bola à direita.
 */
export function benchLayout(spec: PitchSpec) {
  const r = spec.tokenRadius
  const top = spec.width + pitchMargin(spec) + r * 0.5
  const rowGap = r * 2.6
  const step = r * 2.35
  return {
    top,
    height: rowGap * 2 + r,
    slot(team: 'home' | 'away', index: number) {
      return {
        x: r * 1.2 + index * step,
        y: top + r + (team === 'home' ? 0 : rowGap),
      }
    },
    ball: { x: spec.length - r * 1.5, y: top + r + rowGap / 2 },
  }
}

/** Área total desenhada no SVG (campo + margem + banco). */
export function viewBoxFor(spec: PitchSpec) {
  const m = pitchMargin(spec)
  const bench = benchLayout(spec)
  return {
    x: -m,
    y: -m,
    width: spec.length + m * 2,
    height: bench.top + bench.height + m,
  }
}

export interface PitchColors {
  label: string
  grass: string
  stripe: string
  line: string
  surround: string
}

export const PITCH_COLORS: Record<PitchColorId, PitchColors> = {
  grama: { label: 'Grama', grass: '#3f8f3c', stripe: '#46993f', line: '#f4f4f4', surround: '#2f6e2d' },
  'grama-escura': { label: 'Sintético', grass: '#2d6a35', stripe: '#327339', line: '#f4f4f4', surround: '#224f28' },
  'quadra-azul': { label: 'Quadra', grass: '#0280c6', stripe: '#0280c6', line: '#ffffff', surround: '#b58a5a' },
  'al-rabbah': { label: 'Al-Rabbah', grass: '#1c1c1c', stripe: '#232323', line: '#E8661F', surround: '#0f0f0f' },
}

export const PITCH_COLOR_ORDER: PitchColorId[] = ['grama', 'grama-escura', 'quadra-azul', 'al-rabbah']

/** Um ponto está dentro do campo (com uma pequena folga para a linha lateral)? */
export function isOnPitch(spec: PitchSpec, p: { x: number; y: number }): boolean {
  const slack = pitchMargin(spec)
  return p.x >= -slack && p.x <= spec.length + slack && p.y >= -slack && p.y <= spec.width + slack
}
