# Conteúdo do KeyPath

Tudo o que o KeyPath ensina mora aqui, em arquivos de texto. O app lê esta pasta, valida tudo e mostra o resultado.

- Para conferir o conteúdo, rode `npm run content:check`. O comando lista erros e avisos, com arquivo e linha.
- Com `npm run dev` aberto, salvar um arquivo atualiza o app. Se houver erro, ele aparece na tela.

O formato completo está em [docs/modelo-de-dados.md](../docs/modelo-de-dados.md#7-formato-dos-arquivos-de-conteúdo).

## Onde fica cada coisa

| Pasta / arquivo                   | O que é                            | `id`              |
| --------------------------------- | ---------------------------------- | ----------------- |
| `config/trilhas.yaml`             | As 6 trilhas, na ordem de exibição | —                 |
| `config/niveis.yaml`              | Os 5 níveis                        | —                 |
| `config/estilos.yaml`             | Etiquetas de estilo                | —                 |
| `competencias/<trilha>.yaml`      | Competências da trilha, em ordem   | `<trilha>.<nome>` |
| `conceitos/<pasta>/<id>.md`       | Verbetes da Biblioteca             | nome do arquivo   |
| `aulas/<trilha>/<nome>.md`        | Aulas                              | `<trilha>.<nome>` |
| `exercicios/<trilha>/<nome>.yaml` | Exercícios (quiz ou execução)      | `<trilha>.<nome>` |

> **Nunca renomeie um `id` publicado.** Seu progresso salvo aponta para os `id`. O build acusa erro se o `id` e o nome do arquivo não baterem.

## Notação

- Notas e cifras nos arquivos usam **letras com `#` e `b`**: `Eb`, `F#m7`, `Bbmaj7`. A cifra brasileira (`B♭7M`, `Am7(♭5)`) também é aceita. O app sempre **exibe** no padrão brasileiro e com "Dó (C)".
- `C9` é dominante com nona. A nona adicionada é `C(9)` ou `Cadd9`.
- Graus: `IVm`, `bVI7M`, `IIm7(b5)` (convenção brasileira) ou `iv`, `iiø` (minúsculas = menor). Os graus são sempre relativos à escala maior da tônica.

## Blocos especiais no Markdown

```markdown
::::checkpoint{id="campo" title="O campo harmônico"} ← só em aulas, no nível de cima
::concept{id="campo-harmonico"} ← só em aulas: incorpora o verbete
::exercise{id="harmonia.campo-maior.quiz"} ← só em aulas: incorpora o exercício

::chord{symbol="Cm7" inversion="1"}
::chords{symbols="G G7 C Cm G" key="G"}
::progression{key="G" degrees="I I7 IV iv I"}
::scale{root="D" type="harmonic-minor" octaves="2"}

:::common-mistake{title="Opcional"}
Texto do erro comum.
:::
::::
```

Um bloco dentro de outro precisa de mais `:` no bloco de fora (`::::checkpoint` contém `:::common-mistake`).

Tipos de escala: `major`, `natural-minor`, `harmonic-minor`, `melodic-minor`, `ionian`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`, `major-pentatonic`, `minor-pentatonic`, `blues`.

## Estado atual

A **fatia de Harmonia** está completa: 16 competências (Teoria, Harmonia e Acompanhamento), 16 conceitos, 7 aulas e 32 exercícios, do campo harmônico ao empréstimo modal, com exemplos gospel ([plano](../docs/plano-fatia-harmonia.md)). O conteúdo musical ainda precisa de **revisão do autor**.
