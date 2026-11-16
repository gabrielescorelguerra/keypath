import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import { parse as parseYaml, YAMLParseError } from 'yaml'
import type * as z from 'zod'
import {
  competenciesFileSchema,
  conceptFrontmatterSchema,
  exerciseSchema,
  formatSchemaIssues,
  lessonFrontmatterSchema,
  levelsFileSchema,
  stylesFileSchema,
  tracksFileSchema,
  type CatalogSources,
  type CompetencyInput,
  type ConceptInput,
  type ContentIssue,
  type ExerciseInput,
  type LessonInput,
  courseSchema,
  type CourseInput,
} from '../../src/domain/catalog/index.ts'
import {
  noteToMidi,
  parseChord,
  parseKey,
  progressionToChords,
} from '../../src/domain/music/index.ts'
import { parseMarkdown, splitFrontmatter, splitLesson, stripPositions } from './markdown.ts'

/**
 * Estrutura de content/:
 *   config/trilhas.yaml · config/niveis.yaml · config/estilos.yaml
 *   competencias/<trilha>.yaml
 *   conceitos/<pasta>/<id>.md
 *   aulas/<trilha>/<nome>.md          → id "<trilha>.<nome>"
 *   exercicios/<trilha>/<nome>.yaml   → id "<trilha>.<nome>"
 *   cursos/<id>.yaml                  → curso com seus módulos
 */
export interface LoadResult {
  readonly sources: CatalogSources | null
  readonly issues: readonly ContentIssue[]
}

export async function loadContent(contentDir: string): Promise<LoadResult> {
  const issues: ContentIssue[] = []
  const rel = (path: string) => relative(contentDir, path).split(sep).join('/')
  const error = (file: string, message: string, line?: number) =>
    issues.push({ severity: 'error', file, message, ...(line ? { line } : {}) })

  const readText = async (path: string): Promise<string | null> => {
    try {
      return await readFile(path, 'utf8')
    } catch {
      error(rel(path), 'arquivo não encontrado')
      return null
    }
  }

  const parseYamlText = (file: string, text: string): unknown => {
    try {
      return parseYaml(text)
    } catch (e) {
      if (e instanceof YAMLParseError) {
        error(file, `YAML inválido: ${e.message.split('\n')[0]}`, e.linePos?.[0].line)
      } else {
        error(file, `YAML inválido: ${String(e)}`)
      }
      return undefined
    }
  }

  const validate = <S extends z.ZodType>(file: string, schema: S, data: unknown) => {
    const result = schema.safeParse(data)
    if (!result.success) {
      for (const message of formatSchemaIssues(result.error)) error(file, message)
      return null
    }
    return result.data as z.output<S>
  }

  const loadYaml = async <S extends z.ZodType>(path: string, schema: S) => {
    const text = await readText(path)
    if (text === null) return null
    const data = parseYamlText(rel(path), text)
    return data === undefined ? null : validate(rel(path), schema, data)
  }

  const listFiles = async (dir: string, extension: string): Promise<string[]> => {
    try {
      const entries = await readdir(join(contentDir, dir), { recursive: true, withFileTypes: true })
      return entries
        .filter((entry) => entry.isFile() && extname(entry.name) === extension)
        .map((entry) => join(entry.parentPath, entry.name))
        .sort()
    } catch {
      return []
    }
  }

  // --- Configuração ----------------------------------------------------------
  const tracksPath = join(contentDir, 'config/trilhas.yaml')
  const levelsPath = join(contentDir, 'config/niveis.yaml')
  const stylesPath = join(contentDir, 'config/estilos.yaml')
  const tracks = await loadYaml(tracksPath, tracksFileSchema)
  const levels = await loadYaml(levelsPath, levelsFileSchema)
  const styles = await loadYaml(stylesPath, stylesFileSchema)

  // --- Competências ----------------------------------------------------------
  const competencies: CompetencyInput[] = []
  for (const path of await listFiles('competencias', '.yaml')) {
    const file = rel(path)
    const track = basename(path, '.yaml')
    for (const data of (await loadYaml(path, competenciesFileSchema)) ?? []) {
      if (data.track !== track) {
        error(file, `${data.id}: está em ${track}.yaml mas declara track "${data.track}"`)
      }
      competencies.push({ file, data })
    }
  }

  // --- Conceitos -------------------------------------------------------------
  const concepts: ConceptInput[] = []
  for (const path of await listFiles('conceitos', '.md')) {
    const file = rel(path)
    const text = await readText(path)
    const parts = text === null ? null : splitFrontmatter(text)
    if (text !== null && !parts) {
      error(file, 'falta o frontmatter (bloco entre linhas ---) no início do arquivo')
    }
    if (!parts) continue
    const frontmatter = validate(
      file,
      conceptFrontmatterSchema,
      parseYamlText(file, parts.frontmatter),
    )
    if (!frontmatter) continue
    if (frontmatter.id !== basename(path, '.md')) {
      error(file, `o id "${frontmatter.id}" deve ser igual ao nome do arquivo`)
    }
    const markdown = parseMarkdown(parts.body, 'concept', parts.bodyLineOffset)
    for (const p of markdown.problems) error(file, p.message, p.line)
    concepts.push({ file, frontmatter, body: stripPositions(markdown.root), refs: markdown.refs })
  }

  // --- Aulas -----------------------------------------------------------------
  const lessons: LessonInput[] = []
  for (const path of await listFiles('aulas', '.md')) {
    const file = rel(path)
    const text = await readText(path)
    const parts = text === null ? null : splitFrontmatter(text)
    if (text !== null && !parts) {
      error(file, 'falta o frontmatter (bloco entre linhas ---) no início do arquivo')
    }
    if (!parts) continue
    const frontmatter = validate(
      file,
      lessonFrontmatterSchema,
      parseYamlText(file, parts.frontmatter),
    )
    if (!frontmatter) continue
    const folder = basename(dirname(path))
    const expectedId = `${folder}.${basename(path, '.md')}`
    if (frontmatter.id !== expectedId) {
      error(file, `o id deve ser "${expectedId}" (pasta + nome do arquivo)`)
    }
    if (frontmatter.track !== folder) {
      error(file, `a aula está na pasta "${folder}" mas declara track "${frontmatter.track}"`)
    }
    for (const song of frontmatter.songs) {
      if (song.key === undefined) continue
      try {
        parseKey(song.key)
      } catch {
        error(file, `songs: tonalidade inválida "${song.key}" em "${song.title}"`)
      }
    }
    const markdown = parseMarkdown(parts.body, 'lesson', parts.bodyLineOffset)
    const split = splitLesson(markdown.root, parts.bodyLineOffset)
    for (const p of [...markdown.problems, ...split.problems]) error(file, p.message, p.line)
    lessons.push({
      file,
      frontmatter,
      intro: split.intro,
      checkpoints: split.checkpoints,
      refs: markdown.refs,
    })
  }

  // --- Exercícios ------------------------------------------------------------
  const exercises: ExerciseInput[] = []
  for (const path of await listFiles('exercicios', '.yaml')) {
    const file = rel(path)
    const data = await loadYaml(path, exerciseSchema)
    if (!data) continue
    const expectedId = `${basename(dirname(path))}.${basename(path, '.yaml')}`
    if (data.id !== expectedId) {
      error(file, `o id deve ser "${expectedId}" (pasta + nome do arquivo)`)
    }
    if (data.type === 'performance') {
      for (const key of data.parameters.keys) {
        try {
          parseKey(key)
        } catch {
          error(file, `parameters.keys: tonalidade inválida "${key}"`)
        }
      }
      const backing = data.parameters.backing
      if (backing) {
        try {
          progressionToChords(parseKey(backing.key).tonic, backing.degrees)
        } catch (e) {
          error(file, `parameters.backing: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      const { startBpm, targetBpm } = data.parameters
      if (startBpm !== undefined && targetBpm !== undefined && startBpm > targetBpm) {
        error(file, 'parameters.startBpm não pode ser maior que targetBpm')
      }
    } else {
      for (const question of data.questions) {
        const audio = question.audio
        if (!audio) continue
        try {
          if (audio.chord !== undefined) parseChord(audio.chord)
          for (const note of audio.notes?.trim().split(/\s+/) ?? []) noteToMidi(note)
        } catch (e) {
          error(file, `${question.id}.audio: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }
    let prompt = null
    let refs: ExerciseInput['refs'] = []
    if (data.prompt !== undefined) {
      const markdown = parseMarkdown(data.prompt, 'exercise')
      for (const p of markdown.problems) error(file, `prompt: ${p.message}`)
      prompt = stripPositions(markdown.root)
      refs = markdown.refs
    }
    const listRoot = (field: string, items: readonly string[], ordered: boolean) => {
      if (items.length === 0) return null
      const source = items
        .map((item, i) => `${ordered ? `${i + 1}.` : '-'} ${item.replace(/\s*\n\s*/g, ' ')}`)
        .join('\n')
      const markdown = parseMarkdown(source, 'exercise')
      for (const p of markdown.problems) error(file, `${field}: ${p.message}`)
      return stripPositions(markdown.root)
    }
    const routine = data.type === 'performance' ? listRoot('routine', data.routine, true) : null
    const mistakes = data.type === 'performance' ? listRoot('mistakes', data.mistakes, false) : null
    exercises.push({ file, data, prompt, refs, routine, mistakes })
  }

  // --- Cursos ----------------------------------------------------------------
  const courses: CourseInput[] = []
  for (const path of await listFiles('cursos', '.yaml')) {
    const file = rel(path)
    const data = await loadYaml(path, courseSchema)
    if (!data) continue
    if (data.id !== basename(path, '.yaml')) {
      error(file, `o id "${data.id}" deve ser igual ao nome do arquivo`)
    }
    courses.push({ file, data })
  }

  if (issues.length > 0 || !tracks || !levels || !styles) {
    return { sources: null, issues }
  }

  return {
    sources: {
      tracks: { file: rel(tracksPath), items: tracks },
      levels: { file: rel(levelsPath), items: levels },
      styles: { file: rel(stylesPath), items: styles },
      competencies,
      concepts,
      lessons,
      exercises,
      courses,
    },
    issues,
  }
}
