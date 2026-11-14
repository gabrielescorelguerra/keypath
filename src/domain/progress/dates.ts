/** Dia do calendário local ("2026-11-14") — base da regra "em dias diferentes". */
export function localDayKey(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function latest(dates: readonly string[]): string | null {
  let result: string | null = null
  for (const date of dates) {
    if (result === null || Date.parse(date) > Date.parse(result)) result = date
  }
  return result
}
