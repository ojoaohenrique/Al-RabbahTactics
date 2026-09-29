import { memo } from 'react'
import { GOALKEEPER_COLORS } from '../domain/board'
import type { Drawing, Player, Team, Vec } from '../domain/types'

interface PlayerTokenProps {
  player: Player
  team: Team
  pos: Vec
  r: number
  ghost?: boolean
  onBench?: boolean
  /** rotação que mantém número e nome "em pé" quando o campo está girado */
  upright?: number
}

/** Bolinha do jogador: cor do time, número e nome embaixo. */
export const PlayerToken = memo(function PlayerToken({ player, team, pos, r, ghost, onBench, upright = 0 }: PlayerTokenProps) {
  const colors = player.goalkeeper ? GOALKEEPER_COLORS[player.team] : team
  const label = player.name.trim()
  return (
    <g
      transform={`translate(${pos.x} ${pos.y}) rotate(${upright})`}
      data-upright
      data-piece={ghost ? undefined : player.id}
      opacity={ghost ? 0.3 : onBench ? 0.8 : 1}
      style={{ cursor: ghost ? undefined : 'grab' }}
      pointerEvents={ghost ? 'none' : undefined}
    >
      {/* área de toque maior que a bolinha, para facilitar no celular */}
      {!ghost && <circle r={r * 1.5} fill="transparent" />}
      <circle r={r} fill={colors.color} stroke="#111" strokeWidth={r * 0.1} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 1.05}
        fontWeight={800}
        fill={colors.textColor}
        style={{ userSelect: 'none' }}
      >
        {player.number}
      </text>
      {label && !ghost && (
        <text
          y={r * 1.85}
          textAnchor="middle"
          fontSize={r * 0.78}
          fontWeight={700}
          fill="#fff"
          stroke="#111"
          strokeWidth={r * 0.22}
          paintOrder="stroke"
          style={{ userSelect: 'none' }}
        >
          {label.length > 12 ? label.slice(0, 11) + '…' : label}
        </text>
      )}
    </g>
  )
})

export function BallToken({ pos, r, ghost, upright = 0 }: { pos: Vec; r: number; ghost?: boolean; upright?: number }) {
  const s = r * 0.62
  return (
    <g
      transform={`translate(${pos.x} ${pos.y}) rotate(${upright})`}
      data-upright
      data-piece={ghost ? undefined : 'ball'}
      opacity={ghost ? 0.3 : 1}
      pointerEvents={ghost ? 'none' : undefined}
      style={{ cursor: ghost ? undefined : 'grab' }}
    >
      {!ghost && <circle r={r * 1.3} fill="transparent" />}
      <circle r={s} fill="#fff" stroke="#111" strokeWidth={s * 0.12} />
      <polygon points={pentagon(s * 0.42)} fill="#111" />
    </g>
  )
}

function pentagon(r: number): string {
  return Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return `${(Math.cos(a) * r).toFixed(3)},${(Math.sin(a) * r).toFixed(3)}`
  }).join(' ')
}

// ── desenhos (setas, linhas, zonas) ──────────────────────────

function arrowHead(from: Vec, to: Vec, size: number): string {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const a1 = ang + Math.PI * 0.85
  const a2 = ang - Math.PI * 0.85
  return [
    `${to.x},${to.y}`,
    `${to.x + Math.cos(a1) * size},${to.y + Math.sin(a1) * size}`,
    `${to.x + Math.cos(a2) * size},${to.y + Math.sin(a2) * size}`,
  ].join(' ')
}

/** Caminho suave passando pelos pontos (curvas quadráticas pelos pontos médios). */
function smoothPath(pts: Vec[]): string {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`
  }
  const last = pts[pts.length - 1]
  return d + ` L ${last.x} ${last.y}`
}

/** Encurta o fim da linha para a ponta da seta não ficar "grossa". */
function trimEnd(from: Vec, to: Vec, by: number): Vec {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const k = Math.max(0, len - by) / len
  return { x: from.x + dx * k, y: from.y + dy * k }
}

export const DrawingShape = memo(function DrawingShape({ d, width }: { d: Drawing; width: number }) {
  const head = width * 3.2
  const hit = { 'data-drawing': d.id }

  if (d.kind === 'zone') {
    const [a, b] = d.points
    if (!a || !b) return null
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(a.x - b.x)
    const h = Math.abs(a.y - b.y)
    return (
      <rect
        {...hit}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={width * 2}
        fill={d.color}
        fillOpacity={0.22}
        stroke={d.color}
        strokeWidth={width * 0.7}
        strokeDasharray={`${width * 2.5} ${width * 1.5}`}
      />
    )
  }

  const pts = d.points
  if (pts.length < 2) return null
  const end = pts[pts.length - 1]
  // direção da ponta: usa um ponto um pouco antes do fim (mais estável no desenho livre)
  const before = pts[Math.max(0, pts.length - 4)]
  const trimmed = [...pts.slice(0, -1), trimEnd(before, end, head * 0.6)]
  const path = d.kind === 'free' ? smoothPath(trimmed) : `M ${pts[0].x} ${pts[0].y} L ${trimmed[trimmed.length - 1].x} ${trimmed[trimmed.length - 1].y}`

  return (
    <g {...hit}>
      {/* traço invisível e grosso: facilita tocar para apagar */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={width * 5} />
      <path
        d={path}
        fill="none"
        stroke={d.color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={d.kind === 'dashed' ? `${width * 2.2} ${width * 1.6}` : undefined}
      />
      <polygon points={arrowHead(before, end, head)} fill={d.color} />
    </g>
  )
})
