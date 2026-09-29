import { PITCH_COLORS, pitchMargin, type PitchSpec } from '../domain/pitches'
import type { PitchColorId } from '../domain/types'

interface Props {
  spec: PitchSpec
  colorId: PitchColorId
  logoUrl: string
  /** giro que mantém o escudo em pé no modo vertical */
  upright?: number
}

/** Desenha o gramado, as linhas, os gols e o escudo no círculo central. */
export function PitchMarkings({ spec, colorId, logoUrl, upright = 0 }: Props) {
  const c = PITCH_COLORS[colorId]
  const L = spec.length
  const W = spec.width
  const lw = Math.max(0.1, L * 0.0022) // espessura da linha
  const m = pitchMargin(spec)
  const stripes = 10
  const cy = W / 2
  const logo = spec.centerCircleRadius * 1.45

  return (
    <g>
      {/* entorno e gramado com faixas de corte */}
      <rect x={-m} y={-m} width={L + m * 2} height={W + m * 2} fill={c.surround} />
      <rect x={0} y={0} width={L} height={W} fill={c.grass} />
      {c.stripe !== c.grass &&
        Array.from({ length: stripes }, (_, i) =>
          i % 2 === 1 ? <rect key={i} x={(L / stripes) * i} y={0} width={L / stripes} height={W} fill={c.stripe} /> : null,
        )}

      <g fill="none" stroke={c.line} strokeWidth={lw}>
        <rect x={0} y={0} width={L} height={W} />
        <line x1={L / 2} y1={0} x2={L / 2} y2={W} />
        <circle cx={L / 2} cy={cy} r={spec.centerCircleRadius} />
        <CornerArcs L={L} W={W} r={spec.cornerArcRadius} />
        <HalfMarkings spec={spec} line={c.line} lw={lw} />
        <g transform={`translate(${L} 0) scale(-1 1)`}>
          <HalfMarkings spec={spec} line={c.line} lw={lw} />
        </g>
      </g>
      <circle cx={L / 2} cy={cy} r={lw * 1.8} fill={c.line} />
      {/* escudo do time no centro, por cima das linhas, dentro do círculo central */}
      <image
        href={logoUrl}
        x={L / 2 - logo / 2}
        y={cy - logo / 2}
        width={logo}
        height={logo}
        opacity={0.92}
        transform={`rotate(${upright} ${L / 2} ${cy})`}
        data-upright
      />

    </g>
  )
}

function CornerArcs({ L, W, r }: { L: number; W: number; r: number }) {
  return (
    <>
      <path d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} />
      <path d={`M ${L - r} 0 A ${r} ${r} 0 0 0 ${L} ${r}`} />
      <path d={`M 0 ${W - r} A ${r} ${r} 0 0 1 ${r} ${W}`} />
      <path d={`M ${L} ${W - r} A ${r} ${r} 0 0 0 ${L - r} ${W}`} />
    </>
  )
}

/** Marcações de UM lado do campo (o outro lado é o espelho). */
function HalfMarkings({ spec, line, lw }: { spec: PitchSpec; line: string; lw: number }) {
  const cy = spec.width / 2
  const g = spec.goal
  const dot = lw * 1.8

  return (
    <>
      {/* gol com rede */}
      <rect x={-g.depth} y={cy - g.width / 2} width={g.depth} height={g.width} fill="url(#net)" stroke={line} />

      {spec.penaltyArea && (
        <rect x={0} y={cy - spec.penaltyArea.width / 2} width={spec.penaltyArea.depth} height={spec.penaltyArea.width} />
      )}
      {spec.goalArea && (
        <rect x={0} y={cy - spec.goalArea.width / 2} width={spec.goalArea.depth} height={spec.goalArea.width} />
      )}

      {/* meia-lua da grande área (só campo) */}
      {spec.penaltyArea && spec.penaltyArcRadius && (() => {
        const r = spec.penaltyArcRadius
        const dx = spec.penaltyArea.depth - spec.penaltySpot
        const dy = Math.sqrt(r * r - dx * dx)
        const x = spec.penaltyArea.depth
        return <path d={`M ${x} ${cy - dy} A ${r} ${r} 0 0 1 ${x} ${cy + dy}`} />
      })()}

      {/* área em "D" do futsal: dois quartos de círculo ligados por uma reta */}
      {spec.futsalAreaRadius && (() => {
        const R = spec.futsalAreaRadius
        const top = cy - g.width / 2
        const bottom = cy + g.width / 2
        return (
          <path
            d={`M 0 ${top - R} A ${R} ${R} 0 0 1 ${R} ${top} L ${R} ${bottom} A ${R} ${R} 0 0 1 0 ${bottom + R}`}
          />
        )
      })()}

      <circle cx={spec.penaltySpot} cy={cy} r={dot} fill={line} stroke="none" />
      {spec.secondPenaltySpot && <circle cx={spec.secondPenaltySpot} cy={cy} r={dot} fill={line} stroke="none" />}
    </>
  )
}

/** Padrão de rede usado nos gols (fica dentro do <defs> do SVG). */
export function NetPattern({ size }: { size: number }) {
  return (
    <pattern id="net" width={size} height={size} patternUnits="userSpaceOnUse">
      <rect width={size} height={size} fill="rgba(255,255,255,0.15)" />
      <path d={`M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}`} stroke="rgba(255,255,255,0.6)" strokeWidth={size * 0.08} />
    </pattern>
  )
}
