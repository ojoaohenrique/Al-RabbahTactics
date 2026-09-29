import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createPlay, historyReducer, type History } from '../domain/board'
import type { Play } from '../domain/types'
import { loadCurrent, saveCurrent } from './storage'

/**
 * Estado da prancheta: a jogada atual + histórico para desfazer/refazer
 * + o quadro que está sendo editado.
 */
export function useBoard() {
  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    (): History => ({ past: [], present: loadCurrent() ?? createPlay(), future: [] }),
  )
  const [frameIndex, setFrameIndexRaw] = useState(0)
  const play = history.present

  // se um "desfazer" remover quadros, não deixa o índice apontar para o nada
  const safeFrame = Math.min(frameIndex, play.frames.length - 1)

  const setFrameIndex = useCallback((i: number) => setFrameIndexRaw(Math.max(0, i)), [])

  // referência sempre atualizada (evita "closure velha" nos eventos de arrasto)
  const playRef = useRef(play)
  useLayoutEffect(() => {
    playRef.current = play
  }, [play])

  // salva automaticamente no navegador, com um pequeno atraso
  useEffect(() => {
    const t = setTimeout(() => saveCurrent(play), 300)
    return () => clearTimeout(t)
  }, [play])

  const actions = useMemo(
    () => ({
      commit: (next: Play) => dispatch({ type: 'commit', play: next }),
      begin: () => dispatch({ type: 'begin' }),
      live: (next: Play) => dispatch({ type: 'live', play: next }),
      end: () => dispatch({ type: 'end' }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      load: (next: Play) => {
        dispatch({ type: 'load', play: next })
        setFrameIndexRaw(0)
      },
    }),
    [],
  )

  return {
    play,
    playRef,
    frameIndex: safeFrame,
    setFrameIndex,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    ...actions,
  }
}

export type BoardApi = ReturnType<typeof useBoard>
