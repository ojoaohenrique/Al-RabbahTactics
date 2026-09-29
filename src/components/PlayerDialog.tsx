import { useState } from 'react'
import type { Player, Team } from '../domain/types'
import { Button, Field, Modal, inputClass } from './ui'

interface Props {
  player: Player | null
  team: Team | null
  rosterNames: string[]
  onClose: () => void
  onSave: (patch: { name: string; number: number; goalkeeper: boolean }) => void
  onBench: () => void
}

export function PlayerDialog({ player, team, rosterNames, onClose, onSave, onBench }: Props) {
  return (
    <Modal open={player !== null} title={player ? `Jogador · ${team?.name ?? ''}` : ''} onClose={onClose}>
      {/* `key` recria o formulário a cada jogador aberto, com os valores dele */}
      {player && (
        <PlayerForm key={player.id} player={player} rosterNames={rosterNames} onSave={onSave} onBench={onBench} onClose={onClose} />
      )}
    </Modal>
  )
}

function PlayerForm({
  player,
  rosterNames,
  onSave,
  onBench,
  onClose,
}: Omit<Props, 'player' | 'team'> & { player: Player }) {
  const [name, setName] = useState(player.name)
  const [number, setNumber] = useState(String(player.number))
  const [goalkeeper, setGoalkeeper] = useState(player.goalkeeper)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number.parseInt(number, 10)
    onSave({ name: name.trim(), number: Number.isFinite(n) ? Math.max(0, Math.min(99, n)) : player.number, goalkeeper })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          list="elenco-nomes"
          placeholder="Nome ou apelido"
          maxLength={24}
          autoFocus
        />
        <datalist id="elenco-nomes">
          {rosterNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>
      <div className="flex items-end gap-4">
        <Field label="Número">
          <input
            className={`${inputClass} w-24`}
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
          />
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={goalkeeper} onChange={(e) => setGoalkeeper(e.target.checked)} className="size-4 accent-brand" />
          Goleiro
        </label>
      </div>
      <div className="flex flex-wrap justify-between gap-2 pt-2">
        <Button onClick={onBench}>Mandar pro banco</Button>
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">
            Salvar
          </Button>
        </div>
      </div>
    </form>
  )
}
