import { validatePlay } from '../domain/share'
import type { Play } from '../domain/types'

// localStorage pode falhar (aba anônima, armazenamento cheio, bloqueado).
// Por isso toda leitura/escrita passa por try/catch e o app segue funcionando.

const KEYS = {
  current: 'alrabbah:atual',
  library: 'alrabbah:biblioteca',
  roster: 'alrabbah:elenco',
} as const

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// ── jogada em edição (salva sozinha) ──────────────────────────
export function loadCurrent(): Play | null {
  return validatePlay(read(KEYS.current))
}

export function saveCurrent(play: Play): void {
  write(KEYS.current, play)
}

// ── biblioteca de jogadas ─────────────────────────────────────
export interface SavedPlay {
  id: string
  name: string
  updatedAt: number
  play: Play
}

export function listPlays(): SavedPlay[] {
  const list = read<SavedPlay[]>(KEYS.library) ?? []
  return list
    .filter((s) => validatePlay(s?.play))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function savePlay(play: Play): boolean {
  const list = listPlays().filter((s) => s.id !== play.id)
  list.unshift({ id: play.id, name: play.name || 'Sem nome', updatedAt: Date.now(), play })
  return write(KEYS.library, list)
}

export function deletePlay(id: string): void {
  write(
    KEYS.library,
    listPlays().filter((s) => s.id !== id),
  )
}

// ── elenco do Al-Rabbah ───────────────────────────────────────
export interface RosterEntry {
  name: string
  goalkeeper: boolean
  /** vai jogar hoje? (usado no sorteio) */
  present: boolean
}

export function loadRoster(): RosterEntry[] {
  const list = read<RosterEntry[]>(KEYS.roster)
  return Array.isArray(list) ? list.filter((r) => typeof r?.name === 'string') : []
}

export function saveRoster(list: RosterEntry[]): void {
  write(KEYS.roster, list)
}
