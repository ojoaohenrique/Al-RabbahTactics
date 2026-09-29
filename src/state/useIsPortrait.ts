import { useEffect, useState, type RefObject } from 'react'

/** A área da prancheta está mais alta do que larga? (celular em pé) */
export function useIsPortrait(ref: RefObject<HTMLElement | null>): boolean {
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setPortrait(el.clientHeight > el.clientWidth * 1.1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return portrait
}
