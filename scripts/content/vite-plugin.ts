import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { formatIssue } from '../../src/domain/catalog/index.ts'
import { buildCatalog } from './build.ts'

const VIRTUAL_ID = 'virtual:keypath-catalog'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

/**
 * Expõe o catálogo compilado como o módulo `virtual:keypath-catalog`.
 * Erros de conteúdo interrompem o build e aparecem na tela durante o desenvolvimento;
 * alterações em content/ recarregam a página.
 */
export function keypathContent(options: { contentDir?: string } = {}): Plugin {
  const contentDir = resolve(options.contentDir ?? 'content')

  return {
    name: 'keypath-content',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    async load(id) {
      if (id !== RESOLVED_ID) return undefined
      const { catalog, issues } = await buildCatalog(contentDir)
      const errors = issues.filter((issue) => issue.severity === 'error')
      if (!catalog || errors.length > 0) {
        throw new Error(
          `Conteúdo inválido (${errors.length} erro(s)):\n${errors.map(formatIssue).join('\n')}`,
        )
      }
      const warnings = issues.length - errors.length
      if (warnings > 0) {
        this.info(`${warnings} aviso(s) de conteúdo — rode "npm run content:check" para ver`)
      }
      return `export default ${JSON.stringify(catalog)}`
    },
    configureServer(server) {
      server.watcher.add(contentDir)
      const reload = (file: string) => {
        if (!resolve(file).startsWith(contentDir)) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', reload)
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}
