import { parseMarkdown, splitFrontmatter, splitLesson } from './markdown.ts'

const problemsOf = (source: string, context: 'concept' | 'lesson' | 'exercise' = 'lesson') =>
  parseMarkdown(source, context).problems.map((p) => p.message)

describe('parseMarkdown', () => {
  it('aceita os blocos musicais válidos', () => {
    const source = [
      '::chord{symbol="Am7(b5)" inversion="1" key="G"}',
      '::chords{symbols="G G7 C Cm G" key="G"}',
      '::progression{key="G" degrees="I I7 IV iv I"}',
      '::scale{root="D" type="harmonic-minor" octaves="2"}',
    ].join('\n\n')
    expect(problemsOf(source)).toEqual([])
  })

  it('aponta notação musical inválida', () => {
    expect(problemsOf('::chord{symbol="H7"}')).toEqual(['::chord: Acorde inválido: "H7"'])
    expect(problemsOf('::chords{symbols="C Xm G"}')).toEqual(['::chords: Acorde inválido: "Xm"'])
    expect(problemsOf('::progression{key="G" degrees="I VIII"}')).toEqual([
      '::progression: Grau inválido: "VIII"',
    ])
    expect(problemsOf('::scale{root="C" type="cromatica"}')).toEqual([
      '::scale: tipo de escala desconhecido: "cromatica"',
    ])
    expect(problemsOf('::chord{symbol="C" inversion="9"}')).toEqual([
      '::chord: inversion deve ser um número inteiro entre 0 e 6',
    ])
  })

  it('aponta atributos faltando ou desconhecidos', () => {
    expect(problemsOf('::progression{key="G"}')).toEqual([
      '::progression: falta o atributo "degrees"',
    ])
    expect(problemsOf('::chord{symbol="C" tom="G"}')).toEqual([
      '::chord: atributo desconhecido "tom"',
    ])
  })

  it('aponta directives desconhecidas ou com a sintaxe errada', () => {
    expect(problemsOf('::acorde{symbol="C"}')).toEqual(['directive desconhecida: ::acorde'])
    expect(problemsOf(':::chord{symbol="C"}\n:::')).toEqual([
      '::chord deve ser escrita com ::chord',
    ])
  })

  it('restringe directives por contexto', () => {
    expect(problemsOf('::concept{id="triade"}', 'concept')).toEqual([
      '::concept não é permitida aqui (concept)',
    ])
    expect(problemsOf('::exercise{id="x.y"}', 'exercise')).toEqual([
      '::exercise não é permitida aqui (exercise)',
    ])
  })

  it('coleta referências com a linha', () => {
    const { refs } = parseMarkdown(
      'Texto\n\n::concept{id="triade"}\n\n::exercise{id="harmonia.x"}',
      'lesson',
      10,
    )
    expect(refs).toEqual([
      { kind: 'concept', id: 'triade', line: 13 },
      { kind: 'exercise', id: 'harmonia.x', line: 15 },
    ])
  })

  it('não transforma "10:30" nem "Nota:Dó" em directive', () => {
    const { root, problems } = parseMarkdown('Às 10:30, Nota:Dó.', 'lesson')
    expect(problems).toEqual([])
    const paragraph = root.children[0]
    const text =
      paragraph && 'children' in paragraph
        ? paragraph.children.map((c) => ('value' in c ? c.value : '')).join('')
        : ''
    expect(text).toBe('Às 10:30, Nota:Dó.')
  })

  it('não permite checkpoint aninhado', () => {
    const source = ':::::note\n::::checkpoint{id="a" title="A"}\nx\n::::\n:::::'
    expect(problemsOf(source)).toContain(
      'checkpoints devem ficar no nível de cima da aula, sem aninhar',
    )
  })
})

describe('splitLesson', () => {
  const lessonSource = [
    'Introdução.',
    '',
    '::::checkpoint{id="um" title="Um"}',
    'Texto um.',
    '::::',
    '',
    '::::checkpoint{id="dois" title="Dois"}',
    'Texto dois.',
    '::::',
  ].join('\n')

  it('separa introdução e checkpoints, sem posições', () => {
    const { root } = parseMarkdown(lessonSource, 'lesson')
    const split = splitLesson(root, 5)
    expect(split.problems).toEqual([])
    expect(split.intro.children).toHaveLength(1)
    expect(split.checkpoints.map((c) => [c.id, c.title, c.line])).toEqual([
      ['um', 'Um', 8],
      ['dois', 'Dois', 12],
    ])
    expect(JSON.stringify(split)).not.toContain('"position"')
  })

  it('aponta conteúdo solto depois do primeiro checkpoint', () => {
    const { root } = parseMarkdown(`${lessonSource}\n\nSolto.`, 'lesson')
    expect(splitLesson(root).problems).toEqual([
      expect.objectContaining({ message: expect.stringContaining('conteúdo fora de checkpoint') }),
    ])
  })
})

describe('splitFrontmatter', () => {
  it('separa frontmatter e corpo, calculando o deslocamento de linhas', () => {
    const result = splitFrontmatter('---\nid: x\ntitle: y\n---\n\nCorpo')
    expect(result).toEqual({ frontmatter: 'id: x\ntitle: y', body: '\nCorpo', bodyLineOffset: 4 })
  })

  it('devolve null sem frontmatter', () => {
    expect(splitFrontmatter('Só corpo')).toBeNull()
  })
})
