import { IconLeft, IconPause, IconPlay, IconPlus, IconRight, IconTrash } from './Icons'
import { IconButton } from './ui'

interface Props {
  frameCount: number
  frameIndex: number
  onSelect: (i: number) => void
  onAdd: () => void
  onDelete: () => void
  playing: boolean
  progress: number
  onPlay: () => void
  onStop: () => void
  durationMs: number
  onDuration: (ms: number) => void
}

const SPEEDS = [
  { ms: 800, label: 'Rápido' },
  { ms: 1500, label: 'Normal' },
  { ms: 2500, label: 'Lento' },
]

export function AnimationBar(props: Props) {
  const { frameCount, frameIndex, playing } = props
  return (
    <div className="scroll-thin flex items-center gap-1 overflow-x-auto">
      <span className="mr-1 hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-400 sm:inline">
        Quadros
      </span>
      <IconButton label="Quadro anterior" onClick={() => props.onSelect(frameIndex - 1)} disabled={playing || frameIndex === 0}>
        <IconLeft />
      </IconButton>
      <div className="flex gap-1">
        {Array.from({ length: frameCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onSelect(i)}
            disabled={playing}
            aria-label={`Quadro ${i + 1}`}
            aria-current={i === frameIndex}
            className={`h-8 min-w-8 shrink-0 rounded-md px-2 text-sm font-semibold transition-colors ${
              i === frameIndex ? 'bg-brand text-ink' : 'bg-white/8 text-neutral-200 hover:bg-white/15'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <IconButton label="Próximo quadro" onClick={() => props.onSelect(frameIndex + 1)} disabled={playing || frameIndex >= frameCount - 1}>
        <IconRight />
      </IconButton>
      <IconButton label="Novo quadro (copia o atual)" onClick={props.onAdd} disabled={playing}>
        <IconPlus />
      </IconButton>
      <IconButton label="Apagar este quadro" onClick={props.onDelete} disabled={playing || frameCount <= 1}>
        <IconTrash />
      </IconButton>
      <div className="mx-1 h-6 w-px shrink-0 bg-white/15" />
      <IconButton
        label={playing ? 'Parar animação' : 'Reproduzir animação'}
        onClick={playing ? props.onStop : props.onPlay}
        disabled={frameCount < 2}
        active={playing}
      >
        {playing ? <IconPause /> : <IconPlay />}
      </IconButton>
      <select
        aria-label="Velocidade"
        value={props.durationMs}
        onChange={(e) => props.onDuration(Number(e.target.value))}
        className="h-8 shrink-0 rounded-md border border-white/10 bg-black/40 px-2 text-sm"
      >
        {SPEEDS.map((s) => (
          <option key={s.ms} value={s.ms}>
            {s.label}
          </option>
        ))}
      </select>
      {playing && (
        <div className="ml-2 h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-brand" style={{ width: `${props.progress * 100}%` }} />
        </div>
      )}
    </div>
  )
}
