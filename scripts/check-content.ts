/**
 * Valida a pasta content/ e lista erros e avisos.
 * Uso: npm run content:check
 */
import { resolve } from 'node:path'
import { formatIssue } from '../src/domain/catalog/index.ts'
import { buildCatalog } from './content/build.ts'

const contentDir = resolve(process.argv[2] ?? 'content')
const { catalog, issues } = await buildCatalog(contentDir)

for (const issue of issues) {
  console.log(formatIssue(issue))
}

const errors = issues.filter((issue) => issue.severity === 'error').length
const warnings = issues.length - errors

if (catalog) {
  console.log(
    `\nConteúdo válido: ${catalog.competencies.length} competências, ${catalog.concepts.length} conceitos, ` +
      `${catalog.lessons.length} aulas, ${catalog.exercises.length} exercícios` +
      (warnings ? ` · ${warnings} aviso(s)` : ''),
  )
} else {
  console.log(`\nConteúdo inválido: ${errors} erro(s), ${warnings} aviso(s)`)
  process.exitCode = 1
}
