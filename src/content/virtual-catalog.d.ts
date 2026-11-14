declare module 'virtual:keypath-catalog' {
  import type { Catalog } from '@/domain/catalog'

  /** Catálogo compilado de content/ pelo plugin scripts/content/vite-plugin.ts. */
  const catalog: Catalog
  export default catalog
}
