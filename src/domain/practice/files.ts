import { parseKey } from '../music/index.ts'
import type { AttachmentKind } from './types.ts'

const EXTENSIONS: Readonly<Record<string, AttachmentKind>> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  heic: 'image',
  mid: 'midi',
  midi: 'midi',
}

/** Tipo do anexo pelo tipo MIME ou pela extensão; null se não for suportado. */
export function attachmentKindOf(fileName: string, mimeType = ''): AttachmentKind | null {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'audio/midi' || mimeType === 'audio/x-midi') return 'midi'
  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase() ?? ''
  return EXTENSIONS[extension] ?? null
}

const KEY_AT_END = [
  // "Nome - G", "Nome – Bb"
  /^(.*?)\s*[-–—]\s*([A-G][#b♯♭]?m?)$/,
  // "Nome (G)", "Nome [Em]"
  /^(.*?)\s*[([]\s*(?:tom\s*)?([A-G][#b♯♭]?m?)\s*[)\]]$/i,
  // "Nome em G", "Nome tom Bb"
  /^(.*?)\s+(?:em|tom)\s+([A-G][#b♯♭]?m?)$/i,
]

/**
 * Título (e tom, se estiver no fim do nome) a partir do nome do arquivo:
 * "grande_e_o_senhor - G.pdf" → { title: "grande e o senhor", key: "G" }.
 */
export function songFromFileName(fileName: string): { title: string; key: string | null } {
  const base = fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  for (const pattern of KEY_AT_END) {
    const match = pattern.exec(base)
    const title = match?.[1]?.trim()
    const key = match?.[2]
    if (title && key) {
      try {
        const parsed = parseKey(key)
        return { title, key: `${parsed.tonic}${parsed.mode === 'minor' ? 'm' : ''}` }
      } catch {
        // não é um tom: segue
      }
    }
  }
  return { title: base || fileName, key: null }
}

/** Reconhece links do YouTube (watch, youtu.be, shorts, embed), com tempo inicial opcional. */
export function parseYouTube(url: string): { videoId: string; startSeconds: number | null } | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '')
  let videoId: string | null = null
  if (host === 'youtu.be') {
    videoId = parsed.pathname.slice(1).split('/')[0] ?? null
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v')
    else {
      const match = /^\/(?:shorts|embed|live)\/([^/?]+)/.exec(parsed.pathname)
      videoId = match?.[1] ?? null
    }
  }
  if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) return null

  const t = parsed.searchParams.get('t') ?? parsed.searchParams.get('start')
  return { videoId, startSeconds: t ? parseTime(t) : null }
}

/** "90", "90s", "1m30s", "1h2m3s" → segundos. */
function parseTime(value: string): number | null {
  if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10)
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)
  if (!match || !value) return null
  const [, h = '0', m = '0', s = '0'] = match
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/** Endereço para incorporar o vídeo (domínio sem cookies). */
export function youTubeEmbedUrl(videoId: string, startSeconds: number | null): string {
  const start = startSeconds ? `?start=${startSeconds}` : ''
  return `https://www.youtube-nocookie.com/embed/${videoId}${start}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
