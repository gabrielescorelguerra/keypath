import type { Root } from 'mdast'
import { compileCatalog, type CatalogSources, type MarkdownRef } from './compile.ts'
import type { CompetencySource, ExerciseSource } from './schemas.ts'

const EMPTY: Root = { type: 'root', children: [] }

function competency(
  id: string,
  overrides: Partial<CompetencySource> = {},
): { file: string; data: CompetencySource } {
  const track = id.split('.')[0] ?? 'harmonia'
  return {
    file: `competencias/${track}.yaml`,
    data: {
      id,
      track,
      level: 1,
      title: id,
      description: id,
      core: true,
      prerequisites: [],
      concepts: [],
      styles: [],
      mastery: [{ id: 'quiz', method: 'quiz', exercise: `${id}.quiz`, distinctDays: 1 }],
      ...overrides,
    },
  }
}

function quiz(
  id: string,
  competencies: string[],
): { file: string; data: ExerciseSource; prompt: null; refs: MarkdownRef[] } {
  return {
    file: `exercicios/${id}.yaml`,
    data: {
      id,
      title: id,
      type: 'quiz',
      competencies,
      styles: [],
      questions: [
        { id: 'q', kind: 'single-choice', prompt: '?', options: ['a', 'b'], correct: [0] },
      ],
    },
    prompt: null,
    refs: [],
  }
}

function performance(id: string, competencies: string[]) {
  return {
    file: `exercicios/${id}.yaml`,
    data: {
      id,
      title: id,
      type: 'performance' as const,
      competencies,
      styles: [],
      parameters: { keys: [] },
      checklist: [{ id: 'ok', text: 'ok' }],
    },
    prompt: null,
    refs: [],
  }
}

function lesson(id: string, competencies: string[], checkpoints = ['a'], refs: MarkdownRef[] = []) {
  return {
    file: `aulas/${id}.md`,
    frontmatter: {
      id,
      title: id,
      summary: id,
      track: 'harmonia',
      competencies,
      styles: [],
    },
    intro: EMPTY,
    checkpoints: checkpoints.map((c) => ({ id: c, title: c, body: EMPTY })),
    refs,
  }
}

function sources(overrides: Partial<CatalogSources> = {}): CatalogSources {
  return {
    tracks: {
      file: 'config/trilhas.yaml',
      items: [
        { id: 'teoria', name: 'Teoria', description: '-', kind: 'discipline' },
        { id: 'harmonia', name: 'Harmonia', description: '-', kind: 'discipline' },
      ],
    },
    levels: {
      file: 'config/niveis.yaml',
      items: ([1, 2, 3, 4, 5] as const).map((number) => ({ number, name: `N${number}` })),
    },
    styles: { file: 'config/estilos.yaml', items: [{ id: 'gospel', name: 'Gospel' }] },
    competencies: [
      competency('harmonia.triades', { prerequisites: ['teoria.intervalos'] }),
      competency('teoria.intervalos'),
      competency('harmonia.campo', { level: 2, prerequisites: ['harmonia.triades'] }),
    ],
    concepts: [],
    lessons: [lesson('harmonia.aula', ['harmonia.triades', 'harmonia.campo'])],
    exercises: [
      quiz('teoria.intervalos.quiz', ['teoria.intervalos']),
      quiz('harmonia.triades.quiz', ['harmonia.triades']),
      quiz('harmonia.campo.quiz', ['harmonia.campo']),
    ],
    ...overrides,
  }
}

const errorsOf = (s: CatalogSources) =>
  compileCatalog(s)
    .issues.filter((i) => i.severity === 'error')
    .map((i) => i.message)

describe('compileCatalog', () => {
  it('compila conteúdo válido', () => {
    const result = compileCatalog(sources())
    expect(result.catalog).not.toBeNull()
    expect(errorsOf(sources())).toEqual([])
  })

  it('ordena competências pela ordem das trilhas e do arquivo', () => {
    const catalog = compileCatalog(sources()).catalog
    expect(catalog?.competencies.map((c) => [c.id, c.order])).toEqual([
      ['teoria.intervalos', 0],
      ['harmonia.triades', 1],
      ['harmonia.campo', 2],
    ])
  })

  it('aplica o minScore padrão de 0,8', () => {
    const catalog = compileCatalog(sources()).catalog
    expect(catalog?.competencies[0]?.mastery[0]?.minScore).toBe(0.8)
  })

  it('deriva nível e pré-requisitos da aula a partir das competências', () => {
    const aula = compileCatalog(sources()).catalog?.lessons[0]
    expect(aula?.level).toBe(2)
    // harmonia.triades é trabalhada na própria aula, então não é pré-requisito dela.
    expect(aula?.prerequisites).toEqual(['teoria.intervalos'])
  })

  it('ordena as aulas pela primeira competência trabalhada', () => {
    const catalog = compileCatalog(
      sources({
        lessons: [
          lesson('harmonia.a-depois', ['harmonia.campo']),
          lesson('harmonia.b-antes', ['harmonia.triades']),
        ],
      }),
    ).catalog
    expect(catalog?.lessons.map((l) => l.id)).toEqual(['harmonia.b-antes', 'harmonia.a-depois'])
  })

  it('aponta ids duplicados', () => {
    const s = sources()
    expect(
      errorsOf({ ...s, competencies: [...s.competencies, competency('harmonia.triades')] }),
    ).toContainEqual(expect.stringContaining('Competência "harmonia.triades" duplicado'))
  })

  it('aponta referências inexistentes', () => {
    const errors = errorsOf(
      sources({
        competencies: [
          competency('teoria.intervalos', {
            prerequisites: ['teoria.nada'],
            concepts: ['sem-verbete'],
            styles: ['funk'],
          }),
          competency('harmonia.triades'),
          competency('harmonia.campo'),
        ],
      }),
    )
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('pré-requisito "teoria.nada" não existe'),
        expect.stringContaining('conceito "sem-verbete" não existe'),
        expect.stringContaining('estilo "funk" não existe'),
      ]),
    )
  })

  it('aponta referências inexistentes dentro do Markdown, com a linha', () => {
    const result = compileCatalog(
      sources({
        lessons: [
          lesson(
            'harmonia.aula',
            ['harmonia.triades'],
            ['a'],
            [{ kind: 'exercise', id: 'harmonia.fantasma', line: 12 }],
          ),
        ],
      }),
    )
    expect(result.issues).toContainEqual(
      expect.objectContaining({ line: 12, message: 'exercício "harmonia.fantasma" não existe' }),
    )
  })

  it('detecta ciclos de pré-requisitos', () => {
    const errors = errorsOf(
      sources({
        competencies: [
          competency('teoria.intervalos', { prerequisites: ['harmonia.campo'] }),
          competency('harmonia.triades', { prerequisites: ['teoria.intervalos'] }),
          competency('harmonia.campo', { prerequisites: ['harmonia.triades'] }),
        ],
      }),
    )
    expect(errors.filter((e) => e.startsWith('ciclo de pré-requisitos'))).toHaveLength(1)
  })

  it('exige que o tipo do exercício combine com o método do critério', () => {
    const s = sources()
    const errors = errorsOf({
      ...s,
      exercises: [
        performance('teoria.intervalos.quiz', ['teoria.intervalos']),
        ...s.exercises.slice(1),
      ],
    })
    expect(errors).toContainEqual(expect.stringContaining('precisa de um exercício do tipo "quiz"'))
  })

  it('exige que o exercício de um critério liste a competência', () => {
    const s = sources()
    const errors = errorsOf({
      ...s,
      exercises: [quiz('teoria.intervalos.quiz', ['harmonia.triades']), ...s.exercises.slice(1)],
    })
    expect(errors).toContainEqual(expect.stringContaining('precisa listá-la em competencies'))
  })

  it('exige id de competência com o prefixo da trilha', () => {
    const errors = errorsOf(
      sources({
        competencies: [
          competency('teoria.intervalos', { track: 'harmonia' }),
          competency('harmonia.triades'),
          competency('harmonia.campo'),
        ],
      }),
    )
    expect(errors).toContainEqual(expect.stringContaining('deve começar com a trilha'))
  })

  it('exige checkpoints únicos e pelo menos um', () => {
    expect(
      errorsOf(sources({ lessons: [lesson('harmonia.aula', ['harmonia.triades'], [])] })),
    ).toContainEqual(expect.stringContaining('pelo menos um checkpoint'))
    expect(
      errorsOf(sources({ lessons: [lesson('harmonia.aula', ['harmonia.triades'], ['a', 'a'])] })),
    ).toContainEqual('checkpoint "a" repetido')
  })

  it('avisa (sem bloquear) sobre competência sem aula e pré-requisito de nível maior', () => {
    const result = compileCatalog(
      sources({
        competencies: [
          competency('teoria.intervalos', { level: 3 }),
          competency('harmonia.triades', { prerequisites: ['teoria.intervalos'] }),
          competency('harmonia.campo', { level: 2 }),
        ],
      }),
    )
    expect(result.catalog).not.toBeNull()
    const warnings = result.issues.filter((i) => i.severity === 'warning').map((i) => i.message)
    expect(warnings).toContainEqual(
      expect.stringContaining('teoria.intervalos ainda não é trabalhada'),
    )
    expect(warnings).toContainEqual(expect.stringContaining('pré-requisito de nível maior'))
  })
})
