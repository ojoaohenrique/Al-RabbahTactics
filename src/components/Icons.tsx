import type { SVGProps } from 'react'

// Ícones simples em SVG (traço), sem biblioteca externa.
type P = SVGProps<SVGSVGElement>

function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconSelect = (p: P) => <Base {...p}><path d="M5 3l14 8-6 2-2 6z" /></Base>
export const IconArrow = (p: P) => <Base {...p}><path d="M5 19L19 5M10 5h9v9" /></Base>
export const IconDashed = (p: P) => <Base {...p}><path d="M5 19l2.5-2.5M10 14l2.5-2.5M15 9l4-4M11 5h8v8" /></Base>
export const IconFree = (p: P) => <Base {...p}><path d="M3 17c3-6 6 2 9-4s5-3 6-6M15 5h4v4" /></Base>
export const IconZone = (p: P) => <Base {...p}><rect x="4" y="5" width="16" height="14" rx="2" strokeDasharray="3 2" /></Base>
export const IconErase = (p: P) => <Base {...p}><path d="M20 20H9L4 15l10-10 7 7-8 8M9 10l6 6" /></Base>
export const IconUndo = (p: P) => <Base {...p}><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3" /></Base>
export const IconRedo = (p: P) => <Base {...p}><path d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3" /></Base>
export const IconTrash = (p: P) => <Base {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Base>
export const IconPlus = (p: P) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
export const IconPlay = (p: P) => <Base {...p}><path d="M7 4l13 8-13 8z" fill="currentColor" /></Base>
export const IconPause = (p: P) => <Base {...p}><path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" /></Base>
export const IconShare = (p: P) => <Base {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></Base>
export const IconImage = (p: P) => <Base {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 5 5 3-3 5 5" /><circle cx="15" cy="9" r="1.5" /></Base>
export const IconSave = (p: P) => <Base {...p}><path d="M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7" /></Base>
export const IconMenu = (p: P) => <Base {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Base>
export const IconClose = (p: P) => <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>
export const IconLeft = (p: P) => <Base {...p}><path d="M15 5l-7 7 7 7" /></Base>
export const IconRight = (p: P) => <Base {...p}><path d="M9 5l7 7-7 7" /></Base>
export const IconShuffle = (p: P) => <Base {...p}><path d="M4 7h3c5 0 5 10 10 10h3M17 20l3-3-3-3M4 17h3c1.5 0 2.5-.8 3.3-2M13.7 9c.8-1.2 1.8-2 3.3-2h3M17 4l3 3-3 3" /></Base>
export const IconFile = (p: P) => <Base {...p}><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" /></Base>
