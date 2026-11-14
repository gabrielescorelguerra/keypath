import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { indexCatalog } from '../../src/domain/catalog/index.ts'
import { computeProgress, NO_FACTS, recommend } from '../../src/domain/progress/index.ts'
import { buildCatalog } from './build.ts'

const CONTENT_DIR = resolve(__dirname, '../../content')

describe('conteúdo real (content/)', () => {
  it('compila sem erros', async () => {
    const { catalog, issues } = await buildCatalog(CONTENT_DIR)
    expect(issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(catalog?.tracks).toHaveLength(6)
    expect(catalog?.levels).toHaveLength(5)
  })

  it('as regras de progresso funcionam com o catálogo real', async () => {
    const { catalog } = await buildCatalog(CONTENT_DIR)
    if (!catalog) throw new Error('catálogo inválido')
    const index = indexCatalog(catalog)
    const snapshot = computeProgress(index, NO_FACTS)
    expect(snapshot.competencies.size).toBe(catalog.competencies.length)
    expect([...snapshot.tracks.values()].every((t) => t.level === 0)).toBe(true)
    expect(recommend(index, snapshot)[0]).toEqual({
      kind: 'demonstrate',
      competencyId: 'teoria.intervalos',
    })
  })
})

describe('conteúdo com erros', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'keypath-content-'))
    await cp(CONTENT_DIR, dir, { recursive: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('aponta arquivo e linha de um erro no Markdown', async () => {
    await writeFile(
      join(dir, 'conceitos/harmonia/triade.md'),
      '---\nid: triade\ntitle: Tríade\nsummary: x\n---\n\nTexto\n\n::chord{symbol="H7"}\n',
    )
    const { catalog, issues } = await buildCatalog(dir)
    expect(catalog).toBeNull()
    expect(issues).toContainEqual({
      severity: 'error',
      file: 'conceitos/harmonia/triade.md',
      line: 9,
      message: '::chord: Acorde inválido: "H7"',
    })
  })

  it('aponta chaves desconhecidas (erros de digitação)', async () => {
    await writeFile(
      join(dir, 'competencias/teoria.yaml'),
      '- id: teoria.intervalos\n  track: teoria\n  level: 1\n  title: x\n  description: x\n  prerequisite: []\n  mastery: []\n',
    )
    const { issues } = await buildCatalog(dir)
    const messages = issues.map((i) => i.message)
    expect(messages).toContainEqual(expect.stringContaining('"prerequisite"'))
    expect(messages).toContainEqual(expect.stringContaining('pelo menos um critério'))
  })

  it('exige id coerente com o caminho do arquivo', async () => {
    await writeFile(
      join(dir, 'exercicios/teoria/renomeado.yaml'),
      'id: teoria.outro-nome\ntitle: x\ntype: quiz\ncompetencies: [teoria.intervalos]\nquestions:\n  - id: q\n    kind: single-choice\n    prompt: "?"\n    options: [a, b]\n    correct: [0]\n',
    )
    const { issues } = await buildCatalog(dir)
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: 'exercicios/teoria/renomeado.yaml',
        message: 'o id deve ser "teoria.renomeado" (pasta + nome do arquivo)',
      }),
    )
  })

  it('aponta YAML malformado com a linha', async () => {
    await writeFile(join(dir, 'config/estilos.yaml'), '- id: gospel\n  name: [sem fechar\n')
    const { issues } = await buildCatalog(dir)
    expect(issues[0]).toMatchObject({ file: 'config/estilos.yaml', severity: 'error' })
    expect(issues[0]?.message).toMatch(/^YAML inválido/)
  })
})
