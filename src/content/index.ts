import compiled from 'virtual:keypath-catalog'
import { indexCatalog } from '@/domain/catalog'

/** Catálogo de conteúdo do app (somente leitura), com índices para consulta rápida. */
export const catalog = indexCatalog(compiled)
