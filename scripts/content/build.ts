import { compileCatalog, type Catalog, type ContentIssue } from '../../src/domain/catalog/index.ts'
import { loadContent } from './load.ts'

export interface BuildResult {
  readonly catalog: Catalog | null
  readonly issues: readonly ContentIssue[]
}

/** Lê, valida e compila a pasta de conteúdo. */
export async function buildCatalog(contentDir: string): Promise<BuildResult> {
  const loaded = await loadContent(contentDir)
  if (!loaded.sources) {
    return { catalog: null, issues: loaded.issues }
  }
  const compiled = compileCatalog(loaded.sources)
  return { catalog: compiled.catalog, issues: [...loaded.issues, ...compiled.issues] }
}
