/**
 * Transforma o SVG da prancheta numa imagem PNG e baixa o arquivo.
 *
 * Detalhe importante: quando um SVG vira imagem, o navegador NÃO carrega
 * arquivos externos que estão dentro dele (como o escudo). Por isso o escudo
 * é convertido em "data URL" (a imagem embutida como texto) antes.
 */

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export interface ExportOptions {
  viewBox: { x: number; y: number; width: number; height: number }
  title?: string
  fileName: string
  /** largura final da imagem em pixels */
  pixelWidth?: number
}

export async function exportSvgAsPng(svg: SVGSVGElement, opts: ExportOptions): Promise<void> {
  const width = opts.pixelWidth ?? 2000
  const height = Math.round((width * opts.viewBox.height) / opts.viewBox.width)
  const { x, y, width: vw, height: vh } = opts.viewBox

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-export-skip]').forEach((el) => el.remove())
  // se a tela estava em modo vertical, a imagem sai sempre com o campo deitado
  clone.querySelector('[data-world]')?.removeAttribute('transform')
  clone.querySelectorAll('[data-upright]').forEach((el) => {
    el.setAttribute('transform', (el.getAttribute('transform') ?? '').replace(/\s*rotate\([^)]*\)/, ''))
  })
  clone.setAttribute('viewBox', `${x} ${y} ${vw} ${vh}`)
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.removeAttribute('class')

  // embute o escudo
  for (const img of Array.from(clone.querySelectorAll('image'))) {
    const href = img.getAttribute('href')
    if (href && !href.startsWith('data:')) {
      try {
        img.setAttribute('href', await toDataUrl(href))
      } catch {
        img.remove()
      }
    }
  }

  // título da jogada no canto de cima
  if (opts.title) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    t.setAttribute('x', String(x + vw * 0.01))
    t.setAttribute('y', String(y + vh * 0.045))
    t.setAttribute('font-size', String(vh * 0.04))
    t.setAttribute('font-weight', '700')
    t.setAttribute('fill', '#fff')
    t.setAttribute('font-family', 'system-ui, sans-serif')
    t.textContent = opts.title
    clone.appendChild(t)
  }

  const svgText = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Não foi possível gerar a imagem'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(image, 0, 0, width, height)
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!png) throw new Error('Não foi possível gerar a imagem')
    download(png, opts.fileName)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function download(blob: Blob, fileName: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Nome de arquivo seguro a partir do nome da jogada. */
export function slug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'jogada'
  )
}
