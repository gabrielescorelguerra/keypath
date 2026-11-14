/** Problema encontrado ao validar o conteúdo. Erros interrompem o build; avisos não. */
export interface ContentIssue {
  readonly severity: 'error' | 'warning'
  /** Arquivo relativo à pasta content/ (ex.: "aulas/harmonia/revisao.md"). */
  readonly file: string
  /** Linha no arquivo, quando conhecida. */
  readonly line?: number
  readonly message: string
}

export function formatIssue(issue: ContentIssue): string {
  const location = issue.line ? `${issue.file}:${issue.line}` : issue.file
  const label = issue.severity === 'error' ? 'erro' : 'aviso'
  return `[${label}] ${location} — ${issue.message}`
}
