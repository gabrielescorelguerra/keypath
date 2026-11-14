import { db } from '@/data/db.ts'

/** Limpa o banco entre testes. */
export async function resetDatabase(): Promise<void> {
  await Promise.all(db.tables.map((table) => table.clear()))
}
