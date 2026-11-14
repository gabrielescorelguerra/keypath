/** Erro lançado quando uma nota, acorde, grau ou escala não pode ser interpretado. */
export class MusicParseError extends Error {
  readonly input: string

  constructor(kind: string, input: string) {
    super(`${kind} inválido: "${input}"`)
    this.name = 'MusicParseError'
    this.input = input
  }
}
