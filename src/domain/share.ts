import { PITCHES } from './pitches'
import type { Play } from './types'

// Compartilhar SEM servidor: a jogada inteira vai comprimida dentro do link,
// depois do "#". O navegador comprime com CompressionStream (nativo).

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodePlay(play: Play): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(play))
  return toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export async function decodePlay(code: string): Promise<Play | null> {
  try {
    const bytes = await pipe(fromBase64Url(code), new DecompressionStream('deflate-raw'))
    return validatePlay(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

/** Confere se um objeto (vindo de link ou do localStorage) parece uma jogada válida. */
export function validatePlay(data: unknown): Play | null {
  if (!data || typeof data !== 'object') return null
  const p = data as Partial<Play>
  if (p.version !== 1) return null
  if (!p.pitch || !(p.pitch in PITCHES)) return null
  if (!Array.isArray(p.players) || !Array.isArray(p.frames) || p.frames.length === 0) return null
  if (!Array.isArray(p.drawings) || !p.teams?.home || !p.teams?.away) return null
  return p as Play
}
