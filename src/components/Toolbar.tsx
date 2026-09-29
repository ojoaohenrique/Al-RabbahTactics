import { DRAW_COLORS } from '../config'
import type { Tool } from '../domain/types'
import { IconArrow, IconDashed, IconErase, IconFree, IconSelect, IconTrash, IconZone } from './Icons'
import { IconButton } from './ui'

const TOOLS: { id: Tool; label: string; icon: typeof IconSelect }[] = [
  { id: 'select', label: 'Mover jogadores (toque para editar)', icon: IconSelect },
  { id: 'arrow', label: 'Seta (passe / chute)', icon: IconArrow },
  { id: 'dashed', label: 'Seta tracejada (movimentação)', icon: IconDashed },
  { id: 'free', label: 'Desenho livre (condução)', icon: IconFree },
  { id: 'zone', label: 'Zona / área', icon: IconZone },
  { id: 'erase', label: 'Apagar (toque no desenho ou manda jogador ao banco)', icon: IconErase },
]

interface Props {
  tool: Tool
  onTool: (t: Tool) => void
  color: string
  onColor: (c: string) => void
  onClearDrawings: () => void
  hasDrawings: boolean
}

export function Toolbar({ tool, onTool, color, onColor, onClearDrawings, hasDrawings }: Props) {
  return (
    <div className="scroll-thin flex items-center gap-1 overflow-x-auto">
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <IconButton key={id} label={label} active={tool === id} onClick={() => onTool(id)}>
          <Icon />
        </IconButton>
      ))}
      <div className="mx-1 h-6 w-px shrink-0 bg-white/15" />
      {DRAW_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Cor ${c}`}
          title="Cor do desenho"
          onClick={() => onColor(c)}
          className={`size-7 shrink-0 rounded-full border-2 transition-transform ${
            color === c ? 'scale-110 border-brand' : 'border-white/25'
          }`}
          style={{ background: c }}
        />
      ))}
      <div className="mx-1 h-6 w-px shrink-0 bg-white/15" />
      <IconButton label="Apagar todos os desenhos" onClick={onClearDrawings} disabled={!hasDrawings}>
        <IconTrash />
      </IconButton>
    </div>
  )
}
