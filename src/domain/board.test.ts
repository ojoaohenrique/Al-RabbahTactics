import { describe, expect, it } from 'vitest'
import { positionsAt } from './animation'
import {
  BALL_ID,
  addFrame,
  applyFormation,
  changePitch,
  createPlay,
  deleteFrame,
  drawTeams,
  historyReducer,
  movePiece,
  type History,
} from './board'
import { FORMATIONS } from './formations'
import { PITCHES } from './pitches'
import { decodePlay, encodePlay, validatePlay } from './share'

describe('createPlay', () => {
  it('cria society com 7 titulares + 3 reservas por time', () => {
    const play = createPlay()
    expect(play.pitch).toBe('society')
    expect(play.players.filter((p) => p.team === 'home')).toHaveLength(10)
    expect(play.players.filter((p) => p.team === 'away')).toHaveLength(10)
    const onPitch = Object.values(play.frames[0].positions).filter(Boolean)
    expect(onPitch).toHaveLength(14)
    expect(play.frames[0].ball).toEqual({ x: 25, y: 15 })
  })

  it('o goleiro é o primeiro de cada time', () => {
    const play = createPlay({ pitch: 'campo' })
    const gks = play.players.filter((p) => p.goalkeeper)
    expect(gks.map((p) => p.id)).toEqual(['home-1', 'away-1'])
  })
})

describe('movePiece', () => {
  it('não altera a jogada original (imutabilidade)', () => {
    const play = createPlay()
    const before = JSON.stringify(play)
    const moved = movePiece(play, 0, 'home-2', { x: 1, y: 2 })
    expect(JSON.stringify(play)).toBe(before)
    expect(moved.frames[0].positions['home-2']).toEqual({ x: 1, y: 2 })
    expect(moved).not.toBe(play)
  })

  it('move a bola e manda jogador para o banco', () => {
    let play = createPlay()
    play = movePiece(play, 0, BALL_ID, { x: 3, y: 4 })
    play = movePiece(play, 0, 'away-3', null)
    expect(play.frames[0].ball).toEqual({ x: 3, y: 4 })
    expect(play.frames[0].positions['away-3']).toBeNull()
  })
})

describe('formações', () => {
  it('espelha o visitante', () => {
    const play = createPlay({ pitch: 'futsal' })
    const f = FORMATIONS.futsal[0]
    const p = applyFormation(play, 0, 'away', f)
    const spec = PITCHES.futsal
    expect(p.frames[0].positions['away-1']).toEqual({
      x: spec.length - f.slots[0].fx * spec.length,
      y: spec.width - f.slots[0].fy * spec.width,
    })
  })
})

describe('quadros', () => {
  it('adiciona e remove quadros sem apagar o último', () => {
    let play = createPlay()
    play = addFrame(play, 0)
    expect(play.frames).toHaveLength(2)
    expect(play.frames[1]).not.toBe(play.frames[0])
    play = deleteFrame(play, 1)
    play = deleteFrame(play, 0)
    expect(play.frames).toHaveLength(1)
  })

  it('interpola posições no meio do caminho', () => {
    let play = createPlay()
    play = movePiece(play, 0, 'home-2', { x: 0, y: 0 })
    play = addFrame(play, 0)
    play = movePiece(play, 1, 'home-2', { x: 10, y: 0 })
    expect(positionsAt(play, 0)['home-2']).toEqual({ x: 0, y: 0 })
    expect(positionsAt(play, 0.5)['home-2']).toEqual({ x: 5, y: 0 })
    expect(positionsAt(play, 1)['home-2']).toEqual({ x: 10, y: 0 })
  })
})

describe('changePitch', () => {
  it('mantém nomes e números ao trocar de campo', () => {
    let play = createPlay()
    play = { ...play, players: play.players.map((p) => (p.id === 'home-2' ? { ...p, name: 'João', number: 10 } : p)) }
    const campo = changePitch(play, 'campo')
    const j = campo.players.find((p) => p.id === 'home-2')!
    expect(j.name).toBe('João')
    expect(j.number).toBe(10)
    expect(campo.players.filter((p) => p.team === 'home')).toHaveLength(14)
  })

  it('grama vira quadra no futsal e volta a ser grama no society', () => {
    const futsal = changePitch(createPlay(), 'futsal')
    expect(futsal.pitchColor).toBe('quadra-azul')
    expect(changePitch(futsal, 'society').pitchColor).toBe('grama')
  })
})

describe('drawTeams (sorteio do racha)', () => {
  it('distribui todos os nomes, alternando os times', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F']
    const play = drawTeams(createPlay(), names, [], () => 0.5)
    const home = play.players.filter((p) => p.team === 'home' && p.name).map((p) => p.name)
    const away = play.players.filter((p) => p.team === 'away' && p.name).map((p) => p.name)
    expect(home).toHaveLength(3)
    expect(away).toHaveLength(3)
    expect([...home, ...away].sort()).toEqual(names)
  })

  it('coloca um goleiro em cada time', () => {
    const play = drawTeams(createPlay(), ['A', 'B', 'G1', 'G2'], ['G1', 'G2'], () => 0.1)
    const gks = play.players.filter((p) => p.goalkeeper).map((p) => p.name).sort()
    expect(gks).toEqual(['G1', 'G2'])
  })
})

describe('histórico (desfazer/refazer)', () => {
  it('desfaz e refaz', () => {
    const a = createPlay()
    const b = movePiece(a, 0, BALL_ID, null)
    let h: History = { past: [], present: a, future: [] }
    h = historyReducer(h, { type: 'commit', play: b })
    h = historyReducer(h, { type: 'undo' })
    expect(h.present).toBe(a)
    h = historyReducer(h, { type: 'redo' })
    expect(h.present).toBe(b)
  })

  it('arrasto gera UM passo só, e toque sem mover não gera nenhum', () => {
    const a = createPlay()
    let h: History = { past: [], present: a, future: [] }
    h = historyReducer(h, { type: 'begin' })
    h = historyReducer(h, { type: 'end' })
    expect(h.past).toHaveLength(0)

    h = historyReducer(h, { type: 'begin' })
    h = historyReducer(h, { type: 'live', play: movePiece(a, 0, BALL_ID, { x: 1, y: 1 }) })
    h = historyReducer(h, { type: 'live', play: movePiece(a, 0, BALL_ID, { x: 2, y: 2 }) })
    h = historyReducer(h, { type: 'end' })
    expect(h.past).toHaveLength(1)
    h = historyReducer(h, { type: 'undo' })
    expect(h.present).toBe(a)
  })
})

describe('compartilhar por link', () => {
  it('codifica e decodifica a mesma jogada', async () => {
    const play = { ...createPlay(), name: 'Saída de bola ção' }
    const code = await encodePlay(play)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(await decodePlay(code)).toEqual(play)
  })

  it('rejeita lixo', async () => {
    expect(await decodePlay('isso-nao-e-uma-jogada')).toBeNull()
    expect(validatePlay({ version: 2 })).toBeNull()
  })
})
