/// <reference types="mdast-util-directive" />
import type { Nodes, Parent, RootContent, TableCell, TableRow } from 'mdast'
import type { ReactNode } from 'react'
import type { MarkdownRoot } from '@/domain/catalog'
import { isScaleType } from '@/domain/music'
import {
  ArpeggioBlock,
  ChordBlock,
  ChordsBlock,
  ProgressionBlock,
  ScaleBlock,
} from '../music/MusicBlocks.tsx'
import styles from './Markdown.module.css'

/** Como mostrar os blocos que incorporam outras entidades (::concept, ::exercise). */
export interface EmbedRenderers {
  readonly concept?: (id: string) => ReactNode
  readonly exercise?: (id: string) => ReactNode
}

type Attributes = Readonly<Record<string, string | null | undefined>>

const attr = (attributes: Attributes | null | undefined, name: string) =>
  attributes?.[name] ?? undefined
const intAttr = (attributes: Attributes | null | undefined, name: string) => {
  const value = attr(attributes, name)
  return value === undefined ? undefined : Number(value)
}

const CALLOUTS: Readonly<Record<string, { readonly title: string; readonly className: string }>> = {
  'common-mistake': { title: 'Erro comum', className: styles.mistake ?? '' },
  note: { title: 'Observação', className: styles.note ?? '' },
}

function renderChildren(node: Parent, embeds: EmbedRenderers): ReactNode[] {
  return node.children.map((child, index) => renderNode(child, embeds, index))
}

function renderNode(node: Nodes | RootContent, embeds: EmbedRenderers, key: number): ReactNode {
  switch (node.type) {
    case 'root':
      return <>{renderChildren(node, embeds)}</>
    case 'text':
      return node.value
    case 'paragraph':
      return <p key={key}>{renderChildren(node, embeds)}</p>
    case 'heading': {
      // O h1 é o título da página; títulos do conteúdo começam em h2.
      const level = Math.min(6, node.depth + 1)
      const Tag = `h${level}` as 'h2'
      return <Tag key={key}>{renderChildren(node, embeds)}</Tag>
    }
    case 'emphasis':
      return <em key={key}>{renderChildren(node, embeds)}</em>
    case 'strong':
      return <strong key={key}>{renderChildren(node, embeds)}</strong>
    case 'delete':
      return <del key={key}>{renderChildren(node, embeds)}</del>
    case 'inlineCode':
      return <code key={key}>{node.value}</code>
    case 'code':
      return (
        <pre key={key}>
          <code>{node.value}</code>
        </pre>
      )
    case 'break':
      return <br key={key} />
    case 'thematicBreak':
      return <hr key={key} />
    case 'blockquote':
      return <blockquote key={key}>{renderChildren(node, embeds)}</blockquote>
    case 'list': {
      const items = renderChildren(node, embeds)
      return node.ordered ? (
        <ol key={key} start={node.start ?? undefined}>
          {items}
        </ol>
      ) : (
        <ul key={key}>{items}</ul>
      )
    }
    case 'listItem':
      return (
        <li key={key}>
          {node.spread
            ? renderChildren(node, embeds)
            : node.children.map((child, i) =>
                child.type === 'paragraph' ? (
                  <span key={i}>{renderChildren(child, embeds)}</span>
                ) : (
                  renderNode(child, embeds, i)
                ),
              )}
        </li>
      )
    case 'link': {
      const external = /^https?:\/\//.test(node.url)
      return (
        <a
          key={key}
          href={node.url}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderChildren(node, embeds)}
        </a>
      )
    }
    case 'image':
      return <img key={key} src={node.url} alt={node.alt ?? ''} />
    case 'table': {
      const [head, ...body] = node.children
      const align = node.align ?? []
      const cells = (row: TableRow, Cell: 'th' | 'td') =>
        row.children.map((cell: TableCell, i) => (
          <Cell key={i} style={{ textAlign: align[i] ?? undefined }}>
            {renderChildren(cell, embeds)}
          </Cell>
        ))
      return (
        <div key={key} className={styles.tableWrap}>
          <table>
            {head && (
              <thead>
                <tr>{cells(head, 'th')}</tr>
              </thead>
            )}
            <tbody>
              {body.map((row, i) => (
                <tr key={i}>{cells(row, 'td')}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'containerDirective': {
      const callout = CALLOUTS[node.name]
      if (callout) {
        return (
          <aside key={key} className={`${styles.callout} ${callout.className}`}>
            <strong className={styles.calloutTitle}>
              {attr(node.attributes, 'title') ?? callout.title}
            </strong>
            {renderChildren(node, embeds)}
          </aside>
        )
      }
      return <div key={key}>{renderChildren(node, embeds)}</div>
    }
    case 'leafDirective':
      return (
        <MusicOrEmbed key={key} name={node.name} attributes={node.attributes} embeds={embeds} />
      )
    default:
      // html bruto, definições e notas de rodapé não são exibidos.
      return null
  }
}

function MusicOrEmbed({
  name,
  attributes,
  embeds,
}: {
  readonly name: string
  readonly attributes: Attributes | null | undefined
  readonly embeds: EmbedRenderers
}) {
  const keyName = attr(attributes, 'key')
  switch (name) {
    case 'chord':
      return (
        <ChordBlock
          symbol={attr(attributes, 'symbol') ?? ''}
          inversion={intAttr(attributes, 'inversion') ?? 0}
          octave={intAttr(attributes, 'octave') ?? 4}
          {...(keyName ? { keyName } : {})}
        />
      )
    case 'chords':
      return (
        <ChordsBlock
          symbols={attr(attributes, 'symbols') ?? ''}
          {...(keyName ? { keyName } : {})}
        />
      )
    case 'arpeggio':
      return (
        <ArpeggioBlock
          symbol={attr(attributes, 'symbol') ?? ''}
          octaves={intAttr(attributes, 'octaves') ?? 2}
          inversion={intAttr(attributes, 'inversion') ?? 0}
        />
      )
    case 'progression':
      return (
        <ProgressionBlock keyName={keyName ?? 'C'} degrees={attr(attributes, 'degrees') ?? ''} />
      )
    case 'scale': {
      const type = attr(attributes, 'type') ?? 'major'
      return (
        <ScaleBlock
          root={attr(attributes, 'root') ?? 'C'}
          type={isScaleType(type) ? type : 'major'}
          octaves={intAttr(attributes, 'octaves') ?? 1}
        />
      )
    }
    case 'concept':
    case 'exercise': {
      const id = attr(attributes, 'id') ?? ''
      const render = embeds[name]
      return render ? <>{render(id)}</> : null
    }
    default:
      return null
  }
}

/** Renderiza Markdown já interpretado no build (mdast), com os blocos do KeyPath. */
export function Markdown({
  root,
  embeds = {},
}: {
  readonly root: MarkdownRoot
  readonly embeds?: EmbedRenderers
}) {
  return <div className={styles.prose}>{renderChildren(root, embeds)}</div>
}
