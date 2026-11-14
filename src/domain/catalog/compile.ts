import type { ContentIssue } from './issues.ts'
import type {
  CompetencySource,
  ConceptFrontmatter,
  CourseSource,
  ExerciseSource,
  LessonFrontmatter,
  LevelSource,
  StyleSource,
  TrackSource,
} from './schemas.ts'
import type {
  Catalog,
  Competency,
  Concept,
  Exercise,
  Lesson,
  LevelNumber,
  LessonStage,
  MarkdownRoot,
  Module,
} from './types.ts'

/**
 * Compilação do catálogo: recebe o conteúdo já lido e validado arquivo a arquivo
 * (schemas e Markdown) e verifica o conjunto — referências, ciclos, coerência —
 * além de calcular os campos derivados. Função pura: não lê arquivos.
 */

export interface MarkdownRef {
  readonly kind: 'concept' | 'exercise'
  readonly id: string
  readonly line?: number
}

export interface ConfigInput<T> {
  readonly file: string
  readonly items: readonly T[]
}

export interface CompetencyInput {
  readonly file: string
  readonly data: CompetencySource
}

export interface ConceptInput {
  readonly file: string
  readonly frontmatter: ConceptFrontmatter
  readonly body: MarkdownRoot
  readonly refs: readonly MarkdownRef[]
}

export interface CheckpointInput {
  readonly id: string
  readonly title: string
  readonly stage: LessonStage | null
  readonly body: MarkdownRoot
  readonly line?: number
}

export interface LessonInput {
  readonly file: string
  readonly frontmatter: LessonFrontmatter
  readonly intro: MarkdownRoot
  readonly checkpoints: readonly CheckpointInput[]
  readonly refs: readonly MarkdownRef[]
}

export interface ExerciseInput {
  readonly file: string
  readonly data: ExerciseSource
  readonly prompt: MarkdownRoot | null
  readonly refs: readonly MarkdownRef[]
}

export interface CourseInput {
  readonly file: string
  readonly data: CourseSource
}

export interface CatalogSources {
  readonly tracks: ConfigInput<TrackSource>
  readonly levels: ConfigInput<LevelSource>
  readonly styles: ConfigInput<StyleSource>
  readonly competencies: readonly CompetencyInput[]
  readonly concepts: readonly ConceptInput[]
  readonly lessons: readonly LessonInput[]
  readonly exercises: readonly ExerciseInput[]
  readonly courses?: readonly CourseInput[]
}

export interface CompileResult {
  /** null quando há erros. */
  readonly catalog: Catalog | null
  readonly issues: readonly ContentIssue[]
}

export function compileCatalog(sources: CatalogSources): CompileResult {
  const issues: ContentIssue[] = []
  const error = (file: string, message: string, line?: number) =>
    issues.push({ severity: 'error', file, message, ...(line ? { line } : {}) })
  const warning = (file: string, message: string, line?: number) =>
    issues.push({ severity: 'warning', file, message, ...(line ? { line } : {}) })

  // --- Unicidade -------------------------------------------------------------
  const unique = <T>(
    label: string,
    entries: readonly { file: string; id: string; value: T }[],
  ): Map<string, { file: string; value: T }> => {
    const map = new Map<string, { file: string; value: T }>()
    for (const entry of entries) {
      const existing = map.get(entry.id)
      if (existing) {
        error(entry.file, `${label} "${entry.id}" duplicado (também em ${existing.file})`)
      } else {
        map.set(entry.id, { file: entry.file, value: entry.value })
      }
    }
    return map
  }

  const tracks = unique(
    'Trilha',
    sources.tracks.items.map((t) => ({ file: sources.tracks.file, id: t.id, value: t })),
  )
  const styles = unique(
    'Estilo',
    sources.styles.items.map((s) => ({ file: sources.styles.file, id: s.id, value: s })),
  )
  const competencies = unique(
    'Competência',
    sources.competencies.map((c) => ({ file: c.file, id: c.data.id, value: c.data })),
  )
  const concepts = unique(
    'Conceito',
    sources.concepts.map((c) => ({ file: c.file, id: c.frontmatter.id, value: c })),
  )
  const lessons = unique(
    'Aula',
    sources.lessons.map((l) => ({ file: l.file, id: l.frontmatter.id, value: l })),
  )
  const exercises = unique(
    'Exercício',
    sources.exercises.map((e) => ({ file: e.file, id: e.data.id, value: e })),
  )

  const levelNumbers = sources.levels.items.map((l) => l.number)
  if ([1, 2, 3, 4, 5].some((n) => !levelNumbers.includes(n as LevelNumber))) {
    error(sources.levels.file, 'os níveis devem ser exatamente 1, 2, 3, 4 e 5')
  }

  // --- Referências -----------------------------------------------------------
  const checkRefs = (
    file: string,
    label: string,
    ids: readonly string[],
    target: ReadonlyMap<string, unknown>,
    line?: number,
  ) => {
    for (const id of ids) {
      if (!target.has(id)) {
        error(file, `${label} "${id}" não existe`, line)
      }
    }
  }
  const checkMarkdownRefs = (file: string, refs: readonly MarkdownRef[]) => {
    for (const ref of refs) {
      const target = ref.kind === 'concept' ? concepts : exercises
      const label = ref.kind === 'concept' ? 'conceito' : 'exercício'
      checkRefs(file, label, [ref.id], target, ref.line)
    }
  }

  for (const { file, value: c } of competencies.values()) {
    if (!c.id.startsWith(`${c.track}.`)) {
      error(file, `o id "${c.id}" deve começar com a trilha: "${c.track}."`)
    }
    checkRefs(file, `${c.id}: trilha`, [c.track], tracks)
    checkRefs(file, `${c.id}: pré-requisito`, c.prerequisites, competencies)
    checkRefs(file, `${c.id}: conceito`, c.concepts, concepts)
    checkRefs(file, `${c.id}: estilo`, c.styles, styles)
    if (c.prerequisites.includes(c.id)) {
      error(file, `${c.id} não pode ser pré-requisito de si mesma`)
    }

    const criterionIds = new Set<string>()
    for (const criterion of c.mastery) {
      if (criterionIds.has(criterion.id)) {
        error(file, `${c.id}: critério "${criterion.id}" repetido`)
      }
      criterionIds.add(criterion.id)

      const exercise = exercises.get(criterion.exercise)?.value.data
      if (!exercise) {
        error(
          file,
          `${c.id}: critério "${criterion.id}" usa o exercício "${criterion.exercise}", que não existe`,
        )
        continue
      }
      const expectedType = criterion.method === 'quiz' ? 'quiz' : 'performance'
      if (exercise.type !== expectedType) {
        error(
          file,
          `${c.id}: critério "${criterion.id}" (${criterion.method}) precisa de um exercício do tipo "${expectedType}", mas "${exercise.id}" é "${exercise.type}"`,
        )
      }
      if (criterion.minScore !== undefined && criterion.method !== 'quiz') {
        error(file, `${c.id}: critério "${criterion.id}": minScore só vale para quiz`)
      }
      if (!exercise.competencies.includes(c.id)) {
        error(
          exercises.get(criterion.exercise)?.file ?? file,
          `o exercício "${exercise.id}" é critério de "${c.id}" e precisa listá-la em competencies`,
        )
      }
    }
  }

  for (const { file, value: concept } of concepts.values()) {
    const fm = concept.frontmatter
    checkRefs(file, 'trilha', fm.tracks, tracks)
    checkRefs(file, 'estilo', fm.styles, styles)
    checkRefs(file, 'conceito relacionado', fm.related, concepts)
    checkMarkdownRefs(file, concept.refs)
  }

  for (const { file, value: lesson } of lessons.values()) {
    const fm = lesson.frontmatter
    checkRefs(file, 'trilha', [fm.track], tracks)
    checkRefs(file, 'competência', fm.competencies, competencies)
    checkRefs(file, 'estilo', fm.styles, styles)
    checkMarkdownRefs(file, lesson.refs)
    if (lesson.checkpoints.length === 0) {
      error(file, 'a aula precisa de pelo menos um checkpoint (::::checkpoint{id="…" title="…"})')
    }
    const checkpointIds = new Set<string>()
    for (const checkpoint of lesson.checkpoints) {
      if (checkpointIds.has(checkpoint.id)) {
        error(file, `checkpoint "${checkpoint.id}" repetido`, checkpoint.line)
      }
      checkpointIds.add(checkpoint.id)
    }
  }

  for (const { file, value: exercise } of exercises.values()) {
    checkRefs(file, 'competência', exercise.data.competencies, competencies)
    checkRefs(file, 'estilo', exercise.data.styles, styles)
    checkMarkdownRefs(file, exercise.refs)
    if (exercise.data.type === 'quiz') {
      const ids = exercise.data.questions.map((q) => q.id)
      if (new Set(ids).size !== ids.length) {
        error(file, 'há questões com id repetido')
      }
    } else {
      const ids = exercise.data.checklist.map((item) => item.id)
      if (new Set(ids).size !== ids.length) {
        error(file, 'há itens do checklist com id repetido')
      }
    }
  }

  // --- Cursos e módulos -----------------------------------------------------
  const courseSources = sources.courses ?? []
  const courses = unique(
    'Curso',
    courseSources.map((c) => ({ file: c.file, id: c.data.id, value: c.data })),
  )
  const modules = unique(
    'Módulo',
    courseSources.flatMap((c) =>
      c.data.modules.map((m) => ({ file: c.file, id: `${c.data.id}.${m.id}`, value: m })),
    ),
  )
  const moduleOfLesson = new Map<string, string>()
  for (const [moduleId, { file, value: m }] of modules) {
    checkRefs(file, `${moduleId}: módulo pré-requisito`, m.prerequisites, modules)
    checkRefs(file, `${moduleId}: aula`, m.lessons, lessons)
    if (m.style !== undefined) checkRefs(file, `${moduleId}: estilo`, [m.style], styles)
    if (m.prerequisites.includes(moduleId)) {
      error(file, `${moduleId} não pode ser pré-requisito de si mesmo`)
    }
    if (m.lessons.length === 0 && m.upcoming.length === 0) {
      error(file, `${moduleId}: o módulo precisa de aulas ou de tópicos em upcoming`)
    }
    for (const lessonId of m.lessons) {
      const other = moduleOfLesson.get(lessonId)
      if (other) error(file, `a aula "${lessonId}" está em dois módulos: ${other} e ${moduleId}`)
      else moduleOfLesson.set(lessonId, moduleId)
    }
  }
  if (courseSources.length > 0) {
    for (const { file, value: lesson } of lessons.values()) {
      if (!moduleOfLesson.has(lesson.frontmatter.id)) {
        warning(file, `a aula "${lesson.frontmatter.id}" não está em nenhum módulo de curso`)
      }
    }
  }
  const visitingModules = new Set<string>()
  const doneModules = new Set<string>()
  const visitModule = (id: string, path: string[]): void => {
    if (doneModules.has(id)) return
    if (visitingModules.has(id)) {
      error(modules.get(id)?.file ?? '?', `ciclo de módulos: ${[...path, id].join(' → ')}`)
      return
    }
    visitingModules.add(id)
    for (const p of modules.get(id)?.value.prerequisites ?? []) {
      if (modules.has(p)) visitModule(p, [...path, id])
    }
    visitingModules.delete(id)
    doneModules.add(id)
  }
  for (const id of modules.keys()) visitModule(id, [])

  // --- Ciclos de pré-requisitos ----------------------------------------------
  const visiting = new Set<string>()
  const done = new Set<string>()
  const reportedCycles = new Set<string>()
  const visit = (id: string, path: string[]) => {
    if (done.has(id)) return
    if (visiting.has(id)) {
      const cycle = [...path.slice(path.indexOf(id)), id]
      const key = [...cycle].sort().join()
      if (!reportedCycles.has(key)) {
        reportedCycles.add(key)
        error(competencies.get(id)?.file ?? '?', `ciclo de pré-requisitos: ${cycle.join(' → ')}`)
      }
      return
    }
    visiting.add(id)
    for (const prerequisite of competencies.get(id)?.value.prerequisites ?? []) {
      if (competencies.has(prerequisite)) visit(prerequisite, [...path, id])
    }
    visiting.delete(id)
    done.add(id)
  }
  for (const id of competencies.keys()) visit(id, [])

  // --- Avisos ----------------------------------------------------------------
  const competenciesWithLesson = new Set(
    [...lessons.values()].flatMap((l) => l.value.frontmatter.competencies),
  )
  const referencedConcepts = new Set([
    ...[...competencies.values()].flatMap((c) => c.value.concepts),
    ...[...concepts.values()].flatMap((c) => c.value.frontmatter.related),
    ...[...sources.lessons, ...sources.concepts, ...sources.exercises]
      .flatMap((s) => s.refs)
      .filter((r) => r.kind === 'concept')
      .map((r) => r.id),
  ])
  const usedExercises = new Set([
    ...[...competencies.values()].flatMap((c) => c.value.mastery.map((m) => m.exercise)),
    ...[...sources.lessons, ...sources.concepts]
      .flatMap((s) => s.refs)
      .filter((r) => r.kind === 'exercise')
      .map((r) => r.id),
  ])

  for (const { file, value: c } of competencies.values()) {
    for (const prerequisite of c.prerequisites) {
      const level = competencies.get(prerequisite)?.value.level
      if (level !== undefined && level > c.level) {
        warning(
          file,
          `${c.id} (nível ${c.level}) tem pré-requisito de nível maior: ${prerequisite} (nível ${level})`,
        )
      }
    }
    if (c.core && !competenciesWithLesson.has(c.id)) {
      warning(
        file,
        `${c.id} ainda não é trabalhada por nenhuma aula (só pode ser declarada ou demonstrada)`,
      )
    }
  }
  for (const { file, value: concept } of concepts.values()) {
    if (!referencedConcepts.has(concept.frontmatter.id)) {
      warning(
        file,
        `o conceito "${concept.frontmatter.id}" não é referenciado por nenhuma competência, aula ou conceito`,
      )
    }
  }
  for (const { file, value: exercise } of exercises.values()) {
    if (!usedExercises.has(exercise.data.id)) {
      warning(file, `o exercício "${exercise.data.id}" não é usado em nenhum critério nem aula`)
    }
  }

  if (issues.some((issue) => issue.severity === 'error')) {
    return { catalog: null, issues }
  }

  // --- Montagem do catálogo --------------------------------------------------
  const trackOrder = new Map(sources.tracks.items.map((t, index) => [t.id, index]))
  const orderedCompetencies: Competency[] = [...competencies.values()]
    .map((entry, index) => ({ data: entry.value, index }))
    .sort(
      (a, b) =>
        (trackOrder.get(a.data.track) ?? 0) - (trackOrder.get(b.data.track) ?? 0) ||
        a.index - b.index,
    )
    .map(({ data }, order) => ({
      id: data.id,
      track: data.track,
      level: data.level,
      title: data.title,
      description: data.description,
      core: data.core,
      prerequisites: data.prerequisites,
      concepts: data.concepts,
      styles: data.styles,
      mastery: data.mastery.map((m) => ({
        id: m.id,
        method: m.method,
        exercise: m.exercise,
        minScore: m.minScore ?? 0.8,
        distinctDays: m.distinctDays,
      })),
      order,
    }))
  const competencyById = new Map(orderedCompetencies.map((c) => [c.id, c]))

  const catalogLessons: Lesson[] = [...lessons.values()].map(({ value: lesson }) => {
    const fm = lesson.frontmatter
    const worked = fm.competencies.flatMap((id) => {
      const competency = competencyById.get(id)
      return competency ? [competency] : []
    })
    const prerequisites = [...new Set(worked.flatMap((c) => c.prerequisites))]
      .filter((id) => !fm.competencies.includes(id))
      .sort((a, b) => (competencyById.get(a)?.order ?? 0) - (competencyById.get(b)?.order ?? 0))
    return {
      id: fm.id,
      title: fm.title,
      summary: fm.summary,
      track: fm.track,
      competencies: fm.competencies,
      styles: fm.styles,
      estimatedMinutes: fm.estimatedMinutes ?? null,
      why: fm.why ?? null,
      materials: fm.materials.map((m) => ({ ...m, note: m.note ?? null })),
      intro: lesson.intro,
      checkpoints: lesson.checkpoints.map(({ id, title, stage, body }) => ({
        id,
        title,
        stage,
        body,
      })),
      level: Math.max(...worked.map((c) => c.level)) as LevelNumber,
      prerequisites,
    }
  })

  // Ordem pedagógica: pela primeira competência trabalhada (ordem do grafo), depois pelo id.
  const firstOrder = (lesson: Lesson) =>
    Math.min(...lesson.competencies.map((id) => competencyById.get(id)?.order ?? Infinity))
  catalogLessons.sort((a, b) => firstOrder(a) - firstOrder(b) || a.id.localeCompare(b.id))

  const catalogConcepts: Concept[] = [...concepts.values()].map(({ value: concept }) => ({
    ...concept.frontmatter,
    body: concept.body,
  }))

  const catalogExercises: Exercise[] = [...exercises.values()].map(({ value }) => {
    const data = value.data
    const base = {
      id: data.id,
      title: data.title,
      prompt: value.prompt,
      competencies: data.competencies,
      styles: data.styles,
      stage: data.stage ?? (data.type === 'quiz' ? 'recognition' : 'execution'),
      challenges: data.challenges,
    } as const
    if (data.type === 'quiz') {
      return {
        ...base,
        type: 'quiz',
        questions: data.questions.map((q) => ({
          id: q.id,
          kind: q.kind,
          prompt: q.prompt,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation ?? null,
          audio: q.audio
            ? { notes: q.audio.notes ?? null, chord: q.audio.chord ?? null, play: q.audio.play }
            : null,
        })),
      }
    }
    return {
      ...base,
      type: 'performance',
      parameters: {
        keys: data.parameters.keys,
        targetBpm: data.parameters.targetBpm ?? null,
        startBpm: data.parameters.startBpm ?? null,
        bpmStep: data.parameters.bpmStep ?? null,
        hands: data.parameters.hands ?? null,
        backing: data.parameters.backing ?? null,
      },
      checklist: data.checklist,
    }
  })

  const lessonMinutes = new Map(catalogLessons.map((l) => [l.id, l.estimatedMinutes]))
  const catalogCourses = [...courses.values()]
    .map(({ value }) => value)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((course) => ({
      id: course.id,
      title: course.title,
      summary: course.summary,
      modules: course.modules.map((m): Module => {
        const minutes = m.lessons.map((id) => lessonMinutes.get(id) ?? null)
        return {
          id: `${course.id}.${m.id}`,
          course: course.id,
          title: m.title,
          summary: m.summary,
          level: m.level,
          prerequisites: m.prerequisites,
          lessons: m.lessons,
          upcoming: m.upcoming,
          style: m.style ?? null,
          estimatedMinutes: minutes.some((n) => n !== null)
            ? minutes.reduce<number>((sum, n) => sum + (n ?? 0), 0)
            : null,
        }
      }),
    }))

  return {
    catalog: {
      tracks: sources.tracks.items,
      levels: [...sources.levels.items].sort((a, b) => a.number - b.number),
      styles: sources.styles.items,
      competencies: orderedCompetencies,
      concepts: catalogConcepts,
      lessons: catalogLessons,
      exercises: catalogExercises,
      courses: catalogCourses,
    },
    issues,
  }
}
