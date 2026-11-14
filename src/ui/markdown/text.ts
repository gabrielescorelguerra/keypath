import type { Nodes } from 'mdast'

/** Texto puro de um trecho de Markdown (para busca e resumos). */
export function plainText(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node) return node.children.map((child) => plainText(child)).join(' ')
  return ''
}
