import { forwardRef, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { BALL_ID, addDrawing, movePiece, newId, removeDrawing } from '../domain/board'
import { PITCHES, benchLayout, isOnPitch, viewBoxFor } from '../domain/pitches'
import type { Drawing, Tool, Vec } from '../domain/types'
import { LOGO_URL } from '../config'
import type { BoardApi } from '../state/useBoard'
import { BallToken, DrawingShape, PlayerToken } from './Pieces'
import { NetPattern, PitchMarkings } from './PitchMarkings'

interface Props {
  board: BoardApi
  tool: Tool
  drawColor: string
  /** durante a animação: posições calculadas (substituem as do quadro) */
  animated: Record<string, Vec | null> | null
  onEditPlayer: (id: string) => void
  /** celular em pé: o campo é girado 90° para ocupar a tela */
  vertical: boolean
}

export interface BoardHandle {
  svg: SVGSVGElement | null
}

type Gesture =
  | { kind: 'drag'; pointerId: number; pieceId: string; offset: Vec; startClient: Vec; moved: boolean }
  | { kind: 'draw'; pointerId: number; drawing: Drawing }

/** Distância mínima (px na tela) para considerar que houve arrasto e não um toque. */
const TAP_SLOP = 6

export const Board = forwardRef<BoardHandle, Props>(function Board(
  { board, tool, drawColor, animated, onEditPlayer, vertical },
  ref,
) {
  const { play, frameIndex } = board
  const spec = PITCHES[play.pitch]
  const vb = viewBoxFor(spec)
  const bench = benchLayout(spec)
  const r = spec.tokenRadius
  const svgRef = useRef<SVGSVGElement>(null)
  const worldRef = useRef<SVGGElement>(null)
  const upright = vertical ? 90 : 0
  const gesture = useRef<Gesture | null>(null)
  const [draft, setDraft] = useState<Drawing | null>(null)

  useImperativeHandle(ref, () => ({ get svg() { return svgRef.current } }), [])

  const frame = play.frames[frameIndex]
  const prevFrame = frameIndex > 0 ? play.frames[frameIndex - 1] : null
  const isAnimating = animated !== null

  /**
   * Converte a posição do dedo/mouse (pixels) para metros no campo.
   * Usa a matriz do grupo do "mundo", que já inclui o giro no modo vertical.
   */
  function toWorld(e: { clientX: number; clientY: number }): Vec {
    const ctm = worldRef.current?.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  /** Onde a peça está desenhada agora (no campo ou no banco). */
  function piecePos(id: string): Vec {
    if (id === BALL_ID) return frame.ball ?? bench.ball
    const pos = frame.positions[id]
    if (pos) return pos
    // no banco: os reservas ficam lado a lado, sem buracos
    const player = play.players.find((p) => p.id === id)!
    const benched = play.players.filter((p) => p.team === player.team && !frame.positions[p.id])
    return bench.slot(player.team, benched.indexOf(player))
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (isAnimating || gesture.current) return // ignora um segundo dedo
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const target = e.target as Element
    const pieceId = target.closest('[data-piece]')?.getAttribute('data-piece') ?? null
    const drawingId = target.closest('[data-drawing]')?.getAttribute('data-drawing') ?? null
    const world = toWorld(e)

    if (tool === 'erase') {
      if (drawingId) board.commit(removeDrawing(play, drawingId))
      else if (pieceId && pieceId !== BALL_ID) board.commit(movePiece(play, frameIndex, pieceId, null))
      return
    }

    if (tool === 'select') {
      if (!pieceId) return
      const pos = piecePos(pieceId)
      gesture.current = {
        kind: 'drag',
        pointerId: e.pointerId,
        pieceId,
        offset: { x: world.x - pos.x, y: world.y - pos.y },
        startClient: { x: e.clientX, y: e.clientY },
        moved: false,
      }
    } else {
      const drawing: Drawing = { id: newId('d'), kind: tool, color: drawColor, points: [world, world] }
      gesture.current = { kind: 'draw', pointerId: e.pointerId, drawing }
      setDraft(drawing)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    const world = toWorld(e)

    if (g.kind === 'drag') {
      if (!g.moved) {
        const dist = Math.hypot(e.clientX - g.startClient.x, e.clientY - g.startClient.y)
        if (dist < TAP_SLOP) return
        g.moved = true
        board.begin()
      }
      const pos = { x: world.x - g.offset.x, y: world.y - g.offset.y }
      board.live(movePiece(board.playRef.current, frameIndex, g.pieceId, pos))
      return
    }

    // desenhando
    const d = g.drawing
    let points: Vec[]
    if (d.kind === 'free') {
      const last = d.points[d.points.length - 1]
      // só guarda pontos que se afastaram um pouco (deixa a linha leve e suave)
      points = Math.hypot(world.x - last.x, world.y - last.y) > r * 0.35 ? [...d.points, world] : d.points
    } else {
      points = [d.points[0], world]
    }
    g.drawing = { ...d, points }
    setDraft(g.drawing)
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null

    if (g.kind === 'drag') {
      if (!g.moved) {
        // foi um toque: abre a edição do jogador
        if (g.pieceId !== BALL_ID) onEditPlayer(g.pieceId)
        return
      }
      // soltou fora do campo → volta para o banco
      const current = board.playRef.current
      const pos = g.pieceId === BALL_ID ? current.frames[frameIndex].ball : current.frames[frameIndex].positions[g.pieceId]
      if (pos && !isOnPitch(spec, pos)) board.live(movePiece(current, frameIndex, g.pieceId, null))
      board.end()
      return
    }

    setDraft(null)
    const d = g.drawing
    const [a] = d.points
    const b = d.points[d.points.length - 1]
    // ignora "desenhos" minúsculos (um clique sem arrastar)
    if (Math.hypot(b.x - a.x, b.y - a.y) < r * 0.8) return
    board.commit(addDrawing(board.playRef.current, d))
  }

  function onPointerCancel(e: ReactPointerEvent<SVGSVGElement>) {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null
    setDraft(null)
    if (g.kind === 'drag' && g.moved) board.end()
  }

  const strokeW = r * 0.26
  // girar -90°: o ponto (x, y) vai para (y, -x); o retângulo visível gira junto
  const box = vertical ? { x: vb.y, y: -(vb.x + vb.width), width: vb.height, height: vb.width } : vb

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ cursor: tool === 'select' ? 'default' : tool === 'erase' ? 'not-allowed' : 'crosshair' }}
      fontFamily="system-ui, sans-serif"
    >
      <defs>
        <NetPattern size={Math.max(0.25, r * 0.35)} />
      </defs>

      <g ref={worldRef} data-world transform={vertical ? 'rotate(-90)' : undefined}>

      <PitchMarkings spec={spec} colorId={play.pitchColor} logoUrl={LOGO_URL} upright={upright} />

      {/* banco: fundo e rótulos (não vai para a imagem exportada) */}
      <g data-export-skip>
        <rect
          x={vb.x}
          y={bench.top - r * 0.6}
          width={vb.width}
          height={vb.y + vb.height - (bench.top - r * 0.6)}
          fill="#0b0b0b"
        />
        {!vertical && <text x={vb.x + vb.width - r * 0.6} y={bench.top + r * 0.3} textAnchor="end" fontSize={r * 0.75} fill="#8a8a8a">
          banco · arraste para o campo
        </text>}
      </g>

      {/* desenhos */}
      <g>
        {play.drawings.map((d) => (
          <DrawingShape key={d.id} d={d} width={strokeW} />
        ))}
        {draft && <DrawingShape d={draft} width={strokeW} />}
      </g>

      {/* "fantasmas" do quadro anterior + trilha do movimento */}
      {!isAnimating && prevFrame && (
        <g>
          {play.players.map((p) => {
            const a = prevFrame.positions[p.id]
            const b = frame.positions[p.id]
            if (!a || !b || (a.x === b.x && a.y === b.y)) return null
            return (
              <g key={p.id}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeOpacity={0.55} strokeWidth={r * 0.12} strokeDasharray={`${r * 0.3} ${r * 0.25}`} />
                <PlayerToken player={p} team={play.teams[p.team]} pos={a} r={r} ghost upright={upright} />
              </g>
            )
          })}
          {prevFrame.ball && frame.ball && (prevFrame.ball.x !== frame.ball.x || prevFrame.ball.y !== frame.ball.y) && (
            <g>
              <line x1={prevFrame.ball.x} y1={prevFrame.ball.y} x2={frame.ball.x} y2={frame.ball.y} stroke="#facc15" strokeOpacity={0.7} strokeWidth={r * 0.12} strokeDasharray={`${r * 0.3} ${r * 0.25}`} />
              <BallToken pos={prevFrame.ball} r={r} ghost upright={upright} />
            </g>
          )}
        </g>
      )}

      {/* jogadores */}
      <g>
        {play.players.map((p) => {
          const pos = animated ? animated[p.id] : frame.positions[p.id]
          const onBench = !pos
          if (onBench && animated) return null
          return (
            <PlayerToken
              key={p.id}
              player={p}
              team={play.teams[p.team]}
              pos={pos ?? piecePos(p.id)}
              r={r}
              onBench={onBench}
              upright={upright}
            />
          )
        })}
        {(() => {
          const ball = animated ? animated[BALL_ID] : frame.ball
          if (!ball && animated) return null
          return <BallToken pos={ball ?? bench.ball} r={r} upright={upright} />
        })()}
      </g>
      </g>
    </svg>
  )
})
