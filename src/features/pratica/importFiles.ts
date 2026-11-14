import { addFileAttachment, createSong } from '@/data'
import { attachmentKindOf, songFromFileName } from '@/domain/practice'

/** Maior arquivo aceito (o navegador guarda tudo localmente). */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

export interface ImportResult {
  readonly createdSongs: readonly string[]
  readonly attached: number
  readonly skipped: readonly { readonly name: string; readonly reason: string }[]
}

/**
 * Importa arquivos (PDF, imagem, MIDI). Com `songId`, anexa a essa música;
 * sem, cria uma música por arquivo, com título (e tom) tirados do nome do arquivo.
 */
export async function importFiles(files: readonly File[], songId?: string): Promise<ImportResult> {
  const createdSongs: string[] = []
  const skipped: { name: string; reason: string }[] = []
  let attached = 0

  for (const file of files) {
    const kind = attachmentKindOf(file.name, file.type)
    if (kind === null || kind === 'youtube') {
      skipped.push({ name: file.name, reason: 'tipo não suportado (use PDF, imagem ou MIDI)' })
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push({ name: file.name, reason: 'maior que 50 MB' })
      continue
    }
    let target = songId
    if (!target) {
      const { title, key } = songFromFileName(file.name)
      const song = await createSong({ title, key })
      createdSongs.push(song.title)
      target = song.id
    }
    await addFileAttachment(target, file, kind)
    attached++
  }
  return { createdSongs, attached, skipped }
}

export function describeImport(result: ImportResult): string {
  const parts: string[] = []
  if (result.createdSongs.length > 0) {
    parts.push(
      result.createdSongs.length === 1
        ? `Música criada: ${result.createdSongs[0]}.`
        : `${result.createdSongs.length} músicas criadas.`,
    )
  } else if (result.attached > 0) {
    parts.push(
      result.attached === 1 ? '1 arquivo anexado.' : `${result.attached} arquivos anexados.`,
    )
  }
  for (const s of result.skipped) parts.push(`${s.name}: ${s.reason}.`)
  return parts.join(' ')
}
