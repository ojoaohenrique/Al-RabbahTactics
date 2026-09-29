import { useState } from 'react'
import { FORMATIONS } from '../domain/formations'
import { PITCH_COLORS, PITCH_COLOR_ORDER } from '../domain/pitches'
import type { PitchColorId, Play, TeamSide } from '../domain/types'
import type { RosterEntry, SavedPlay } from '../state/storage'
import { IconClose, IconShuffle, IconTrash } from './Icons'
import { Button, Field, IconButton, inputClass } from './ui'

const TEAM_COLORS = ['#E8661F', '#111111', '#f5f5f5', '#ef4444', '#2563eb', '#16a34a', '#facc15', '#7c3aed']

export type PanelTab = 'times' | 'elenco' | 'jogadas'

interface Props {
  open: boolean
  tab: PanelTab
  onTab: (t: PanelTab) => void
  onClose: () => void
  play: Play
  // times
  onTeam: (side: TeamSide, patch: { name?: string; color?: string; textColor?: string }) => void
  onFormation: (side: TeamSide, formationId: string) => void
  onPitchColor: (c: PitchColorId) => void
  // elenco
  roster: RosterEntry[]
  onRoster: (r: RosterEntry[]) => void
  onDraw: () => void
  onClearNames: () => void
  // jogadas
  saved: SavedPlay[]
  onRename: (name: string) => void
  onSave: () => void
  onOpen: (s: SavedPlay) => void
  onDelete: (id: string) => void
  onNew: () => void
}

/** Texto legível sobre a cor da camisa (preto em cores claras, branco nas escuras). */
function contrastText(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111111' : '#ffffff'
}

export function SidePanel(props: Props) {
  const { open, tab } = props
  return (
    <aside
      className={`absolute inset-y-0 right-0 z-20 flex w-[min(100%,22rem)] flex-col border-l border-white/10 bg-neutral-950/97 shadow-2xl backdrop-blur transition-transform duration-200 ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center gap-1 border-b border-white/10 p-2">
        {(
          [
            ['times', 'Times'],
            ['elenco', 'Elenco'],
            ['jogadas', 'Jogadas'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === id ? 'bg-white/12 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
        <IconButton label="Fechar painel" onClick={props.onClose} className="ml-auto">
          <IconClose />
        </IconButton>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {tab === 'times' && <TeamsTab {...props} />}
        {tab === 'elenco' && <RosterTab {...props} />}
        {tab === 'jogadas' && <PlaysTab {...props} />}
      </div>
    </aside>
  )
}

function TeamsTab({ play, onTeam, onFormation, onPitchColor }: Props) {
  return (
    <>
      {(['home', 'away'] as const).map((side) => {
        const team = play.teams[side]
        return (
          <section key={side} className="space-y-3">
            <Field label={side === 'home' ? 'Time da casa' : 'Visitante'}>
              <input className={inputClass} value={team.name} maxLength={20} onChange={(e) => onTeam(side, { name: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Camisa ${c}`}
                  onClick={() => onTeam(side, { color: c, textColor: contrastText(c) })}
                  className={`size-7 rounded-full border-2 ${team.color.toLowerCase() === c.toLowerCase() ? 'border-brand' : 'border-white/25'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">Formação</p>
              <div className="flex flex-wrap gap-1.5">
                {FORMATIONS[play.pitch].map((f) => (
                  <Button key={f.id} className="px-2.5 py-1.5" onClick={() => onFormation(side, f.id)}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )
      })}
      <section>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">Cor do campo</p>
        <div className="grid grid-cols-2 gap-2">
          {PITCH_COLOR_ORDER.map((id) => {
            const c = PITCH_COLORS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPitchColor(id)}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${play.pitchColor === id ? 'border-brand' : 'border-white/10'}`}
              >
                <span className="size-5 rounded" style={{ background: c.grass, outline: `2px solid ${c.line}`, outlineOffset: -4 }} />
                {c.label}
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}

function RosterTab({ roster, onRoster, onDraw, onClearNames }: Props) {
  const [name, setName] = useState('')
  const present = roster.filter((r) => r.present)

  function add(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n || roster.some((r) => r.name.toLowerCase() === n.toLowerCase())) return
    onRoster([...roster, { name: n, goalkeeper: false, present: true }])
    setName('')
  }

  const update = (i: number, patch: Partial<RosterEntry>) => onRoster(roster.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <>
      <form onSubmit={add} className="flex gap-2">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Adicionar jogador" maxLength={24} />
        <Button type="submit" variant="primary">
          Adicionar
        </Button>
      </form>

      {roster.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Cadastre a galera do Al-Rabbah. Os nomes ficam salvos neste navegador e aparecem como sugestão ao editar um jogador.
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {roster.map((r, i) => (
            <li key={r.name} className="flex items-center gap-2 py-1.5">
              <label className="flex flex-1 items-center gap-2 text-sm" title="Vai jogar hoje?">
                <input type="checkbox" checked={r.present} onChange={(e) => update(i, { present: e.target.checked })} className="size-4 accent-brand" />
                <span className={r.present ? '' : 'text-neutral-500 line-through'}>{r.name}</span>
              </label>
              <button
                type="button"
                onClick={() => update(i, { goalkeeper: !r.goalkeeper })}
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${r.goalkeeper ? 'bg-yellow-400 text-ink' : 'bg-white/8 text-neutral-400'}`}
                title="Goleiro"
              >
                GOL
              </button>
              <IconButton label={`Remover ${r.name}`} className="size-8" onClick={() => onRoster(roster.filter((_, j) => j !== i))}>
                <IconTrash width={16} height={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-2 rounded-xl bg-white/5 p-3">
        <p className="text-sm font-semibold">Sorteio do racha</p>
        <p className="text-xs text-neutral-400">
          {present.length} marcado(s) para hoje. Os marcados com GOL vão um para cada time; o resto é sorteado alternando.
        </p>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onDraw} disabled={present.length < 2}>
            <IconShuffle /> Sortear times
          </Button>
          <Button onClick={onClearNames}>Limpar nomes</Button>
        </div>
      </section>
    </>
  )
}

function PlaysTab({ play, saved, onRename, onSave, onOpen, onDelete, onNew }: Props) {
  return (
    <>
      <section className="space-y-2">
        <Field label="Nome da jogada">
          <input className={inputClass} value={play.name} maxLength={40} placeholder="Ex.: Saída de bola 2-3-1" onChange={(e) => onRename(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onSave}>
            Salvar na biblioteca
          </Button>
          <Button onClick={onNew}>Nova jogada</Button>
        </div>
      </section>
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Biblioteca ({saved.length})</p>
        {saved.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma jogada salva ainda. Elas ficam guardadas neste navegador.</p>
        ) : (
          <ul className="space-y-1.5">
            {saved.map((s) => (
              <li key={s.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${s.id === play.id ? 'bg-brand/15' : 'bg-white/5'}`}>
                <button type="button" onClick={() => onOpen(s)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-neutral-400">
                    {s.play.pitch} · {s.play.frames.length} quadro(s) · {new Date(s.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </button>
                <IconButton label={`Apagar ${s.name}`} className="size-8" onClick={() => onDelete(s.id)}>
                  <IconTrash width={16} height={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
