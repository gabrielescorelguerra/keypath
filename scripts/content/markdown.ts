import type { Nodes, Root, RootContent } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'
import type { CheckpointInput, LessonStage, MarkdownRef } from '../../src/domain/catalog/index.ts'
import { LESSON_STAGES, SLUG_RE } from '../../src/domain/catalog/index.ts'
import {
  isScaleType,
  parseChord,
  parseKey,
  parsePitchClass,
  progressionToChords,
} from '../../src/domain/music/index.ts'

/** Onde o Markdown aparece — define quais directives são permitidas. */
export type MarkdownContext = 'concept' | 'lesson' | 'exercise'

export interface MarkdownProblem {
  readonly message: string
  readonly line?: number
}

export interface ParsedMarkdown {
  readonly root: Root
  readonly refs: readonly MarkdownRef[]
  readonly problems: readonly MarkdownProblem[]
}

type DirectiveNode = Extract<Nodes, { type: 'leafDirective' | 'containerDirective' }>

interface DirectiveSpec {
  readonly kind: 'leafDirective' | 'containerDirective'
  readonly contexts: readonly MarkdownContext[]
  readonly required: readonly string[]
  readonly optional: readonly string[]
  /** Valida os atributos; devolve mensagens de erro. */
  readonly check?: (attrs: Readonly<Record<string, string>>) => string[]
}

const ALL: readonly MarkdownContext[] = ['concept', 'lesson', 'exercise']

const attempt = (fn: () => unknown): string[] => {
  try {
    fn()
    return []
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)]
  }
}

const intInRange = (name: string, value: string | undefined, min: number, max: number) =>
  value === undefined || (/^-?\d+$/.test(value) && +value >= min && +value <= max)
    ? []
    : [`${name} deve ser um número inteiro entre ${min} e ${max}`]

/**
 * Directives do KeyPath. Sintaxe:
 *   ::::checkpoint{id="..." title="..." stage="pratica"}  …  ::::  (só em aulas, no nível de cima)
 *   :::common-mistake{title="..."}  …  :::            (bloco de erro comum)
 *   :::note{title="..."}  …  :::                      (bloco de observação)
 *   ::concept{id="..."}                               (incorpora um conceito — só em aulas)
 *   ::exercise{id="..."}                              (incorpora um exercício — só em aulas)
 *   ::chord{symbol="Cm7" inversion="1" key="G" octave="4"}
 *   ::chords{symbols="G G7 C Cm G" key="G"}
 *   ::progression{key="G" degrees="I I7 IV iv I"}
 *   ::scale{root="D" type="harmonic-minor" octaves="2"}
 */
const DIRECTIVES: Readonly<Record<string, DirectiveSpec>> = {
  checkpoint: {
    kind: 'containerDirective',
    contexts: ['lesson'],
    required: ['id', 'title'],
    optional: ['stage'],
    check: (a) => [
      ...(SLUG_RE.test(a.id ?? '') ? [] : [`id de checkpoint inválido: "${a.id}"`]),
      ...(a.stage === undefined || (LESSON_STAGES as readonly string[]).includes(a.stage)
        ? []
        : [`stage deve ser um de: ${LESSON_STAGES.join(', ')}`]),
    ],
  },
  'common-mistake': {
    kind: 'containerDirective',
    contexts: ALL,
    required: [],
    optional: ['title'],
  },
  note: { kind: 'containerDirective', contexts: ALL, required: [], optional: ['title'] },
  concept: { kind: 'leafDirective', contexts: ['lesson'], required: ['id'], optional: [] },
  exercise: { kind: 'leafDirective', contexts: ['lesson'], required: ['id'], optional: [] },
  chord: {
    kind: 'leafDirective',
    contexts: ALL,
    required: ['symbol'],
    optional: ['inversion', 'key', 'octave'],
    check: (a) => [
      ...attempt(() => parseChord(a.symbol ?? '')),
      ...(a.key === undefined ? [] : attempt(() => parseKey(a.key ?? ''))),
      ...intInRange('inversion', a.inversion, 0, 6),
      ...intInRange('octave', a.octave, 1, 7),
    ],
  },
  chords: {
    kind: 'leafDirective',
    contexts: ALL,
    required: ['symbols'],
    optional: ['key'],
    check: (a) => [
      ...(a.symbols ?? '')
        .trim()
        .split(/\s+/)
        .flatMap((symbol) => attempt(() => parseChord(symbol))),
      ...(a.key === undefined ? [] : attempt(() => parseKey(a.key ?? ''))),
    ],
  },
  progression: {
    kind: 'leafDirective',
    contexts: ALL,
    required: ['key', 'degrees'],
    optional: [],
    check: (a) => attempt(() => progressionToChords(parseKey(a.key ?? '').tonic, a.degrees ?? '')),
  },
  scale: {
    kind: 'leafDirective',
    contexts: ALL,
    required: ['root', 'type'],
    optional: ['octaves'],
    check: (a) => [
      ...attempt(() => parsePitchClass(a.root ?? '')),
      ...(isScaleType(a.type ?? '') ? [] : [`tipo de escala desconhecido: "${a.type}"`]),
      ...intInRange('octaves', a.octaves, 1, 3),
    ],
  },
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)

/**
 * Lê Markdown do KeyPath: valida directives e notação musical, coleta referências
 * e remove posições (o catálogo fica menor). `lineOffset` corrige as linhas quando
 * o texto vem depois de um frontmatter.
 */
export function parseMarkdown(
  source: string,
  context: MarkdownContext,
  lineOffset = 0,
): ParsedMarkdown {
  const root = processor.parse(source)
  const refs: MarkdownRef[] = []
  const problems: MarkdownProblem[] = []
  const lineOf = (node: Nodes) => {
    const line = node.position?.start.line
    return line === undefined ? undefined : line + lineOffset
  }
  const problem = (node: Nodes, message: string) => {
    const line = lineOf(node)
    problems.push(line === undefined ? { message } : { message, line })
  }

  // O KeyPath não usa directives no meio do texto. "10:30" ou "Nota:Dó" viram
  // directives por engano na sintaxe — devolvemos como texto normal.
  visit(root, 'textDirective', (node, index, parent) => {
    if (!parent || index === undefined) return
    parent.children.splice(index, 1, { type: 'text', value: `:${node.name}` }, ...node.children)
    return [SKIP, index]
  })

  visit(root, (node, _index, parent) => {
    if (node.type !== 'leafDirective' && node.type !== 'containerDirective') return
    const directive = node as DirectiveNode
    const spec = DIRECTIVES[directive.name]
    const label = `::${directive.name}`

    if (!spec) {
      problem(directive, `directive desconhecida: ${label}`)
      return
    }
    if (spec.kind !== directive.type) {
      const colons = spec.kind === 'leafDirective' ? '::' : ':::'
      problem(directive, `${label} deve ser escrita com ${colons}${directive.name}`)
      return
    }
    if (!spec.contexts.includes(context)) {
      problem(directive, `${label} não é permitida aqui (${context})`)
      return
    }
    if (directive.name === 'checkpoint' && parent?.type !== 'root') {
      problem(directive, 'checkpoints devem ficar no nível de cima da aula, sem aninhar')
    }

    const attrs: Record<string, string> = {}
    for (const [key, value] of Object.entries(directive.attributes ?? {})) {
      if (value !== null && value !== undefined) attrs[key] = value
    }
    for (const name of spec.required) {
      if (!attrs[name]?.trim()) problem(directive, `${label}: falta o atributo "${name}"`)
    }
    for (const name of Object.keys(attrs)) {
      if (!spec.required.includes(name) && !spec.optional.includes(name)) {
        problem(directive, `${label}: atributo desconhecido "${name}"`)
      }
    }
    if (spec.required.every((name) => attrs[name]?.trim())) {
      for (const message of spec.check?.(attrs) ?? []) problem(directive, `${label}: ${message}`)
    }

    if (directive.name === 'concept' || directive.name === 'exercise') {
      const line = lineOf(directive)
      refs.push({
        kind: directive.name,
        id: attrs.id ?? '',
        ...(line === undefined ? {} : { line }),
      })
    }
  })

  return { root, refs, problems }
}

export function stripPositions<T extends Nodes>(node: T): T {
  visit(node, (child) => {
    delete child.position
  })
  return node
}

export interface SplitLesson {
  readonly intro: Root
  readonly checkpoints: readonly CheckpointInput[]
  readonly problems: readonly MarkdownProblem[]
}

/** Separa a introdução (antes do primeiro checkpoint) dos checkpoints. */
export function splitLesson(root: Root, lineOffset = 0): SplitLesson {
  const intro: RootContent[] = []
  const checkpoints: CheckpointInput[] = []
  const problems: MarkdownProblem[] = []

  for (const node of root.children) {
    const line = node.position?.start.line
    const at = line === undefined ? {} : { line: line + lineOffset }
    if (node.type === 'containerDirective' && node.name === 'checkpoint') {
      const stage = node.attributes?.stage
      checkpoints.push({
        id: node.attributes?.id ?? '',
        title: node.attributes?.title ?? '',
        stage: (LESSON_STAGES as readonly (string | null | undefined)[]).includes(stage)
          ? (stage as LessonStage)
          : null,
        body: stripPositions({ type: 'root', children: node.children }),
        ...at,
      })
    } else if (checkpoints.length === 0) {
      intro.push(node)
    } else {
      problems.push({
        message:
          'conteúdo fora de checkpoint: depois do primeiro checkpoint, tudo deve ficar dentro de um',
        ...at,
      })
    }
  }

  return { intro: stripPositions({ type: 'root', children: intro }), checkpoints, problems }
}

/** Separa o frontmatter YAML (entre linhas "---") do corpo. */
export function splitFrontmatter(
  source: string,
): { frontmatter: string; body: string; bodyLineOffset: number } | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source)
  if (!match) return null
  const consumed = match[0]
  return {
    frontmatter: match[1] ?? '',
    body: source.slice(consumed.length),
    bodyLineOffset: consumed.split('\n').length - 1,
  }
}
