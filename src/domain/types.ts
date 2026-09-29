// Tipos centrais da prancheta. Tudo aqui é "dado puro": sem classes, sem métodos.
// Isso permite copiar, salvar em JSON, comparar e desfazer (undo) com facilidade.

/** Um ponto no campo, em METROS. (0,0) é o canto superior esquerdo do campo. */
export interface Vec {
  x: number
  y: number
}

export type PitchId = 'society' | 'campo' | 'futsal'

export type TeamSide = 'home' | 'away'

export interface Team {
  name: string
  /** cor da camisa */
  color: string
  /** cor do número dentro da bolinha */
  textColor: string
}

export interface Player {
  id: string
  team: TeamSide
  number: number
  name: string
  goalkeeper: boolean
}

/**
 * Um quadro (frame) da jogada: onde cada peça está naquele momento.
 * `null` significa "no banco" (fora do campo).
 */
export interface Frame {
  positions: Record<string, Vec | null>
  ball: Vec | null
}

export type DrawingKind = 'arrow' | 'dashed' | 'free' | 'zone'

export interface Drawing {
  id: string
  kind: DrawingKind
  color: string
  /** arrow/dashed: [início, fim] · zone: [canto, canto oposto] · free: vários pontos */
  points: Vec[]
}

export interface Play {
  version: 1
  id: string
  name: string
  pitch: PitchId
  pitchColor: PitchColorId
  teams: Record<TeamSide, Team>
  players: Player[]
  frames: Frame[]
  drawings: Drawing[]
  /** duração de cada transição entre quadros, em milissegundos */
  frameDurationMs: number
}

export type PitchColorId = 'grama' | 'grama-escura' | 'quadra-azul' | 'al-rabbah'

export type Tool = 'select' | 'arrow' | 'dashed' | 'free' | 'zone' | 'erase'
