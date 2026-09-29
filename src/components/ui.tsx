import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { IconClose } from './Icons'

/** Botão de ícone com rótulo acessível (aparece como dica ao passar o mouse). */
export function IconButton({
  label,
  active,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`grid size-9 shrink-0 place-items-center sm:size-10 rounded-lg transition-colors disabled:opacity-35 ${
        active ? 'bg-brand text-ink' : 'text-neutral-200 hover:bg-white/10'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Button({
  variant = 'ghost',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-brand text-ink hover:bg-brand-light font-semibold',
    ghost: 'bg-white/8 text-neutral-100 hover:bg-white/15',
    danger: 'bg-red-600/90 text-white hover:bg-red-600',
  }[variant]
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  )
}

/** Janela modal usando o <dialog> nativo do navegador. */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // no celular, o toque que abriu a janela gera um "clique" logo depois;
  // só fechamos se o dedo/mouse DESCEU no fundo escuro, não apenas subiu nele
  const downOnBackdrop = useRef(false)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === ref.current
      }}
      onClick={(e) => {
        if (e.target === ref.current && downOnBackdrop.current) onClose() // clique fora fecha
        downOnBackdrop.current = false
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl bg-neutral-900 p-0 text-neutral-100 shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <IconButton label="Fechar" onClick={onClose}>
          <IconClose />
        </IconButton>
      </div>
      <div className="px-4 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">{footer}</div>}
    </dialog>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand'
