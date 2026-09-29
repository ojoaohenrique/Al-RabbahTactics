import { FORMATIONS, formationPositions, type Formation } from './formations'
import { PITCHES } from './pitches'
import type { Drawing, Frame, PitchColorId, PitchId, Play, Player, Team, TeamSide, Vec } from './types'

// ─────────────────────────────────────────────────────────────
// Funções PURAS: recebem uma jogada e devolvem uma jogada NOVA.
// Nunca alteram o objeto recebido. É isso que torna o "desfazer"
// trivial: basta guardar as versões antigas.
// ─────────────────────────────────────────────────────────────

export const BALL_ID = 'ball'

export const DEFAULT_TEAMS: Record<TeamSide, Team> = {
  home: { name: 'Al-Rabbah', color: '#E8661F', textColor: '#111111' },
  away: { name: 'Adversário', color: '#f5f5f5', textColor: '#111111' },
}

/** Cor do goleiro: um tom escuro para o time da casa, amarelo para o visitante. */
export const GOALKEEPER_COLORS: Record<TeamSide, Team> = {
  home: { name: '', color: '#111111', textColor: '#E8661F' },
  away: { name: '', color: '#facc15', textColor: '#111111' },
}

export function newId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function buildPlayers(pitch: PitchId, previous: Player[] = []): Player[] {
  const spec = PITCHES[pitch]
  const total = spec.playersPerTeam + spec.reserves
  const players: Player[] = []
  for (const team of ['home', 'away'] as const) {
    const old = previous.filter((p) => p.team === team)
    for (let i = 0; i < total; i++) {
      players.push({
        id: `${team}-${i + 1}`,
        team,
        number: old[i]?.number ?? i + 1,
        name: old[i]?.name ?? '',
        goalkeeper: i === 0,
      })
    }
  }
  return players
}

function emptyFrame(players: Player[]): Frame {
  return {
    positions: Object.fromEntries(players.map((p) => [p.id, null])),
    ball: null,
  }
}

export interface CreatePlayOptions {
  pitch?: PitchId
  pitchColor?: PitchColorId
  teams?: Record<TeamSide, Team>
  previousPlayers?: Player[]
}

/** Jogada nova: os dois times já posicionados na primeira formação e bola no centro. */
export function createPlay(opts: CreatePlayOptions = {}): Play {
  const pitch = opts.pitch ?? 'society'
  const spec = PITCHES[pitch]
  const players = buildPlayers(pitch, opts.previousPlayers)
  let play: Play = {
    version: 1,
    id: newId('jogada'),
    name: '',
    pitch,
    pitchColor: opts.pitchColor ?? (pitch === 'futsal' ? 'quadra-azul' : 'grama'),
    teams: opts.teams ?? DEFAULT_TEAMS,
    players,
    frames: [emptyFrame(players)],
    drawings: [],
    frameDurationMs: 1500,
  }
  const formation = FORMATIONS[pitch][0]
  play = applyFormation(play, 0, 'home', formation)
  play = applyFormation(play, 0, 'away', formation)
  play = movePiece(play, 0, BALL_ID, { x: spec.length / 2, y: spec.width / 2 })
  return play
}

/** Grama ↔ quadra acompanham o tipo de campo; cores escolhidas "de propósito" são mantidas. */
function colorForPitch(current: PitchColorId, pitch: PitchId): PitchColorId {
  if (pitch === 'futsal' && current === 'grama') return 'quadra-azul'
  if (pitch !== 'futsal' && current === 'quadra-azul') return 'grama'
  return current
}

/** Troca o tipo de campo mantendo nomes, números, cores e nome da jogada. */
export function changePitch(play: Play, pitch: PitchId): Play {
  const next = createPlay({
    pitch,
    teams: play.teams,
    previousPlayers: play.players,
    pitchColor: colorForPitch(play.pitchColor, pitch),
  })
  return { ...next, id: play.id, name: play.name, frameDurationMs: play.frameDurationMs }
}

function replaceFrame(play: Play, index: number, frame: Frame): Play {
  const frames = play.frames.slice()
  frames[index] = frame
  return { ...play, frames }
}

/** Move um jogador ou a bola no quadro `frameIndex`. `null` manda para o banco. */
export function movePiece(play: Play, frameIndex: number, pieceId: string, pos: Vec | null): Play {
  const frame = play.frames[frameIndex]
  if (!frame) return play
  if (pieceId === BALL_ID) return replaceFrame(play, frameIndex, { ...frame, ball: pos })
  if (!(pieceId in frame.positions)) return play
  return replaceFrame(play, frameIndex, {
    ...frame,
    positions: { ...frame.positions, [pieceId]: pos },
  })
}

/** Coloca os titulares de um time na formação; os reservas vão para o banco. */
export function applyFormation(play: Play, frameIndex: number, side: TeamSide, formation: Formation): Play {
  const frame = play.frames[frameIndex]
  if (!frame) return play
  const spec = PITCHES[play.pitch]
  const slots = formationPositions(spec, formation, side)
  const team = play.players.filter((p) => p.team === side)
  // goleiro primeiro, depois os outros na ordem da lista
  const ordered = [...team.filter((p) => p.goalkeeper), ...team.filter((p) => !p.goalkeeper)]
  const positions = { ...frame.positions }
  ordered.forEach((p, i) => {
    positions[p.id] = slots[i] ?? null
  })
  return replaceFrame(play, frameIndex, { ...frame, positions })
}

/** Cria um quadro novo logo depois de `afterIndex`, copiando as posições dele. */
export function addFrame(play: Play, afterIndex: number): Play {
  const base = play.frames[afterIndex]
  if (!base) return play
  const copy: Frame = { positions: { ...base.positions }, ball: base.ball }
  const frames = play.frames.slice()
  frames.splice(afterIndex + 1, 0, copy)
  return { ...play, frames }
}

export function deleteFrame(play: Play, index: number): Play {
  if (play.frames.length <= 1) return play
  return { ...play, frames: play.frames.filter((_, i) => i !== index) }
}

export function addDrawing(play: Play, drawing: Drawing): Play {
  return { ...play, drawings: [...play.drawings, drawing] }
}

export function removeDrawing(play: Play, id: string): Play {
  return { ...play, drawings: play.drawings.filter((d) => d.id !== id) }
}

export function clearDrawings(play: Play): Play {
  return { ...play, drawings: [] }
}

export function updatePlayer(play: Play, id: string, patch: Partial<Omit<Player, 'id' | 'team'>>): Play {
  return {
    ...play,
    players: play.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }
}

export function updateTeam(play: Play, side: TeamSide, patch: Partial<Team>): Play {
  return { ...play, teams: { ...play.teams, [side]: { ...play.teams[side], ...patch } } }
}

/** Embaralhamento de Fisher–Yates. `random` pode ser trocado nos testes. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Sorteio do racha: embaralha os nomes e distribui alternando entre os times
 * (1º casa, 2º visitante, 3º casa...). Quem sobra fica sem nome.
 * Os goleiros informados (se houver) vão um para cada lado.
 */
export function drawTeams(
  play: Play,
  names: string[],
  goalkeepers: string[] = [],
  random: () => number = Math.random,
): Play {
  const gks = shuffle(goalkeepers, random)
  const field = shuffle(names.filter((n) => !goalkeepers.includes(n)), random)
  const bySide: Record<TeamSide, string[]> = { home: [], away: [] }
  field.forEach((n, i) => bySide[i % 2 === 0 ? 'home' : 'away'].push(n))

  const players = play.players.map((p) => ({ ...p, name: '' }))
  for (const side of ['home', 'away'] as const) {
    const team = players.filter((p) => p.team === side)
    const gk = team.find((p) => p.goalkeeper)
    const gkName = gks[side === 'home' ? 0 : 1]
    if (gk && gkName) gk.name = gkName
    const others = team.filter((p) => !(p.goalkeeper && gkName))
    bySide[side].forEach((name, i) => {
      if (others[i]) others[i].name = name
    })
  }
  return { ...play, players }
}

// ─────────────────────────────────────────────────────────────
// Histórico (desfazer / refazer)
// ─────────────────────────────────────────────────────────────

export interface History {
  past: Play[]
  present: Play
  future: Play[]
}

const HISTORY_LIMIT = 100

export type HistoryAction =
  /** alteração pontual: entra no histórico */
  | { type: 'commit'; play: Play }
  /** início de um arrasto: guarda o estado antes do arrasto */
  | { type: 'begin' }
  /** durante o arrasto: atualiza a tela sem encher o histórico */
  | { type: 'live'; play: Play }
  /** fim do arrasto: se nada mudou, descarta o passo vazio do histórico */
  | { type: 'end' }
  | { type: 'undo' }
  | { type: 'redo' }
  /** abrir outra jogada: zera o histórico */
  | { type: 'load'; play: Play }

export function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case 'commit':
      if (action.play === state.present) return state
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.play,
        future: [],
      }
    case 'begin':
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: state.present,
        future: [],
      }
    case 'live':
      return { ...state, present: action.play }
    case 'end':
      if (state.past[state.past.length - 1] === state.present) {
        return { ...state, past: state.past.slice(0, -1) }
      }
      return state
    case 'undo': {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future] }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return { past: [...state.past, state.present], present: next, future: rest }
    }
    case 'load':
      return { past: [], present: action.play, future: [] }
  }
}
