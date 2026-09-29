import { useEffect, useMemo, useRef, useState } from 'react'
import { positionsAt } from './domain/animation'
import {
  addFrame,
  applyFormation,
  changePitch,
  clearDrawings,
  createPlay,
  deleteFrame,
  drawTeams,
  movePiece,
  updatePlayer,
  updateTeam,
} from './domain/board'
import { FORMATIONS } from './domain/formations'
import { PITCHES, PITCH_ORDER } from './domain/pitches'
import { decodePlay, encodePlay } from './domain/share'
import type { PitchId, Tool } from './domain/types'
import { AnimationBar } from './components/AnimationBar'
import { Board, type BoardHandle } from './components/Board'
import { IconImage, IconMenu, IconRedo, IconShare, IconUndo } from './components/Icons'
import { PlayerDialog } from './components/PlayerDialog'
import { SidePanel, type PanelTab } from './components/SidePanel'
import { Toolbar } from './components/Toolbar'
import { DRAW_COLORS, LOGO_URL, exportViewBox } from './config'
import { Button, IconButton, Modal, inputClass } from './components/ui'
import { exportSvgAsPng, slug } from './lib/exportPng'
import { deletePlay, listPlays, loadRoster, savePlay, saveRoster, type RosterEntry, type SavedPlay } from './state/storage'
import { useBoard } from './state/useBoard'
import { useIsPortrait } from './state/useIsPortrait'
import { usePlayback } from './state/usePlayback'

type Confirm = { title: string; message: string; action: string; run: () => void } | null

export default function App() {
  const board = useBoard()
  const { play, frameIndex, undo, redo, load } = board
  const boardRef = useRef<BoardHandle>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const vertical = useIsPortrait(areaRef)

  const [tool, setTool] = useState<Tool>('select')
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[1])
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('times')
  const [editing, setEditing] = useState<string | null>(null)
  const [roster, setRosterState] = useState<RosterEntry[]>(loadRoster)
  const [saved, setSaved] = useState<SavedPlay[]>(listPlays)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [toast, setToast] = useState<string | null>(null)

  const playback = usePlayback(play.frames.length, play.frameDurationMs)
  const animated = useMemo(() => (playback.playing ? positionsAt(play, playback.time) : null), [play, playback.playing, playback.time])

  function notify(msg: string) {
    setToast(msg)
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // abrir jogada recebida por link (#j=...)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#j=')) return
    decodePlay(hash.slice(3)).then((p) => {
      history.replaceState(null, '', window.location.pathname)
      if (p) {
        load(p)
        notify(p.name ? `Jogada "${p.name}" aberta` : 'Jogada aberta pelo link')
      } else {
        notify('Link de jogada inválido')
      }
    })
  }, [load]) // `load` nunca muda, então roda só uma vez

  // atalhos de teclado: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, dialog')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  function setRoster(r: RosterEntry[]) {
    setRosterState(r)
    saveRoster(r)
  }

  function askPitch(id: PitchId) {
    if (id === play.pitch) return
    const run = () => {
      board.commit(changePitch(play, id))
      board.setFrameIndex(0)
    }
    const hasWork = play.frames.length > 1 || play.drawings.length > 0
    if (!hasWork) return run()
    setConfirm({
      title: `Trocar para ${PITCHES[id].label}?`,
      message: 'As posições, quadros e desenhos são refeitos para o novo campo. Nomes e números são mantidos. Dá para desfazer com Ctrl+Z.',
      action: 'Trocar campo',
      run,
    })
  }

  async function exportPng() {
    const svg = boardRef.current?.svg
    if (!svg) return
    try {
      await exportSvgAsPng(svg, {
        viewBox: exportViewBox(play),
        title: play.name || undefined,
        fileName: `al-rabbah-${slug(play.name)}-q${frameIndex + 1}.png`,
      })
    } catch {
      notify('Não foi possível gerar a imagem')
    }
  }

  async function share() {
    const code = await encodePlay(play)
    setShareUrl(`${window.location.origin}${window.location.pathname}#j=${code}`)
  }

  function saveToLibrary() {
    const named = play.name.trim() ? play : { ...play, name: `Jogada ${new Date().toLocaleDateString('pt-BR')}` }
    if (named !== play) board.commit(named)
    if (savePlay(named)) {
      setSaved(listPlays())
      notify('Jogada salva na biblioteca')
    } else {
      notify('Não foi possível salvar (armazenamento do navegador cheio ou bloqueado)')
    }
  }

  const editingPlayer = play.players.find((p) => p.id === editing) ?? null

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {/* ── topo ─────────────────────────────────────── */}
      <header className="flex items-center gap-2 border-b border-white/10 px-2 py-1.5 sm:px-3">
        <img src={LOGO_URL} alt="" className="size-8 shrink-0 object-contain sm:size-9" />
        <h1 className="hidden text-base font-extrabold tracking-tight sm:block">
          Al-Rabbah <span className="text-brand">Tactics</span>
        </h1>
        <select
          aria-label="Tipo de campo"
          value={play.pitch}
          onChange={(e) => askPitch(e.target.value as PitchId)}
          className="h-9 min-w-0 max-w-36 shrink rounded-lg border border-white/10 bg-black/40 px-2 text-sm font-medium sm:ml-3 sm:max-w-none"
        >
          {PITCH_ORDER.map((id) => (
            <option key={id} value={id}>
              {PITCHES[id].label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex shrink-0 items-center">
          <IconButton label="Desfazer (Ctrl+Z)" onClick={board.undo} disabled={!board.canUndo || playback.playing}>
            <IconUndo />
          </IconButton>
          <IconButton label="Refazer (Ctrl+Y)" onClick={board.redo} disabled={!board.canRedo || playback.playing}>
            <IconRedo />
          </IconButton>
          <IconButton label="Baixar imagem (PNG)" onClick={exportPng}>
            <IconImage />
          </IconButton>
          <IconButton label="Compartilhar link" onClick={share}>
            <IconShare />
          </IconButton>
          <IconButton label="Times, elenco e jogadas" active={panelOpen} onClick={() => setPanelOpen((o) => !o)}>
            <IconMenu />
          </IconButton>
        </div>
      </header>

      {/* ── prancheta ────────────────────────────────── */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={areaRef} className="absolute inset-0 p-1 sm:p-3">
          <Board
            ref={boardRef}
            board={board}
            tool={playback.playing ? 'select' : tool}
            drawColor={drawColor}
            animated={animated}
            onEditPlayer={setEditing}
            vertical={vertical}
          />
        </div>
        <SidePanel
          open={panelOpen}
          tab={panelTab}
          onTab={setPanelTab}
          onClose={() => setPanelOpen(false)}
          play={play}
          onTeam={(side, patch) => (patch.name !== undefined ? board.live : board.commit)(updateTeam(play, side, patch))}
          onFormation={(side, id) => {
            const f = FORMATIONS[play.pitch].find((x) => x.id === id)
            if (f) board.commit(applyFormation(play, frameIndex, side, f))
          }}
          onPitchColor={(c) => board.commit({ ...play, pitchColor: c })}
          roster={roster}
          onRoster={setRoster}
          onDraw={() => {
            const present = roster.filter((r) => r.present)
            board.commit(
              drawTeams(
                play,
                present.map((r) => r.name),
                present.filter((r) => r.goalkeeper).map((r) => r.name),
              ),
            )
            notify('Times sorteados!')
          }}
          onClearNames={() => board.commit({ ...play, players: play.players.map((p) => ({ ...p, name: '' })) })}
          saved={saved}
          onRename={(name) => board.live({ ...play, name })}
          onSave={saveToLibrary}
          onOpen={(s) => {
            board.load(s.play)
            setPanelOpen(false)
            notify(`"${s.name}" aberta`)
          }}
          onDelete={(id) => {
            const s = saved.find((x) => x.id === id)
            setConfirm({
              title: 'Apagar jogada?',
              message: `"${s?.name ?? ''}" será removida da biblioteca deste navegador.`,
              action: 'Apagar',
              run: () => {
                deletePlay(id)
                setSaved(listPlays())
              },
            })
          }}
          onNew={() =>
            setConfirm({
              title: 'Nova jogada?',
              message: 'A jogada atual será substituída. Salve na biblioteca antes se quiser guardá-la.',
              action: 'Nova jogada',
              run: () => {
                board.load(createPlay({ pitch: play.pitch, teams: play.teams, pitchColor: play.pitchColor }))
                notify('Nova jogada criada')
              },
            })
          }
        />
      </main>

      {/* ── ferramentas + animação ───────────────────── */}
      <footer className="space-y-1 border-t border-white/10 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:gap-3 sm:space-y-0 sm:px-3">
        <Toolbar
          tool={tool}
          onTool={setTool}
          color={drawColor}
          onColor={setDrawColor}
          hasDrawings={play.drawings.length > 0}
          onClearDrawings={() => board.commit(clearDrawings(play))}
        />
        <div className="hidden h-8 w-px bg-white/15 sm:block" />
        <AnimationBar
          frameCount={play.frames.length}
          frameIndex={frameIndex}
          onSelect={(i) => board.setFrameIndex(Math.min(i, play.frames.length - 1))}
          onAdd={() => {
            board.commit(addFrame(play, frameIndex))
            board.setFrameIndex(frameIndex + 1)
            if (play.frames.length === 1) notify('Quadro 2 criado: mova os jogadores para montar o movimento')
          }}
          onDelete={() => {
            board.commit(deleteFrame(play, frameIndex))
            board.setFrameIndex(Math.max(0, frameIndex - 1))
          }}
          playing={playback.playing}
          progress={play.frames.length > 1 ? playback.time / (play.frames.length - 1) : 0}
          onPlay={() => {
            setPanelOpen(false)
            playback.start()
          }}
          onStop={playback.stop}
          durationMs={play.frameDurationMs}
          onDuration={(ms) => board.commit({ ...play, frameDurationMs: ms })}
        />
      </footer>

      {/* ── janelas ──────────────────────────────────── */}
      <PlayerDialog
        player={editingPlayer}
        team={editingPlayer ? play.teams[editingPlayer.team] : null}
        rosterNames={roster.map((r) => r.name)}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editingPlayer) board.commit(updatePlayer(play, editingPlayer.id, patch))
          setEditing(null)
        }}
        onBench={() => {
          if (editingPlayer) board.commit(movePiece(play, frameIndex, editingPlayer.id, null))
          setEditing(null)
        }}
      />

      <Modal open={shareUrl !== null} title="Compartilhar jogada" onClose={() => setShareUrl(null)}>
        <p className="mb-3 text-sm text-neutral-300">
          A jogada inteira vai dentro do link. Quem abrir vê exatamente o que você montou, inclusive a animação.
        </p>
        <input readOnly className={inputClass} value={shareUrl ?? ''} onFocus={(e) => e.currentTarget.select()} />
        <div className="mt-3 flex justify-end gap-2">
          {'share' in navigator && (
            <Button
              onClick={() => {
                navigator.share({ title: play.name || 'Jogada do Al-Rabbah', url: shareUrl ?? '' }).catch(() => {})
              }}
            >
              Enviar…
            </Button>
          )}
          <Button
            variant="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl ?? '')
                notify('Link copiado!')
                setShareUrl(null)
              } catch {
                notify('Não deu para copiar: selecione o link e copie manualmente')
              }
            }}
          >
            Copiar link
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirm !== null}
        title={confirm?.title ?? ''}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button
              variant={confirm?.action === 'Apagar' ? 'danger' : 'primary'}
              onClick={() => {
                confirm?.run()
                setConfirm(null)
              }}
            >
              {confirm?.action}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">{confirm?.message}</p>
      </Modal>

      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-28 z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-lg sm:bottom-20"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
