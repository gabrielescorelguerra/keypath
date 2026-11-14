export type PersistenceStatus = 'persisted' | 'not-persisted' | 'unsupported'

/** Situação atual do armazenamento persistente, sem pedir nada ao navegador. */
export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return 'unsupported'
  return (await navigator.storage.persisted()) ? 'persisted' : 'not-persisted'
}

let requested = false

/**
 * Pede ao navegador para não apagar os dados automaticamente quando faltar espaço.
 * Chamado na primeira gravação da sessão — no Firefox isso mostra uma pergunta,
 * então não é feito ao abrir o app.
 */
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return 'unsupported'
  if (requested) return getPersistenceStatus()
  requested = true
  try {
    return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted'
  } catch {
    return 'not-persisted'
  }
}
