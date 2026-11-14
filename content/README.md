# Conteúdo do KeyPath

Tudo o que o KeyPath ensina mora aqui, em arquivos de texto. O app lê esta pasta, valida tudo e mostra o resultado.

- Para conferir o conteúdo, rode `npm run content:check`. O comando lista erros e avisos, com arquivo e linha.
- Com `npm run dev` aberto, salvar um arquivo atualiza o app. Se houver erro, ele aparece na tela.

O formato completo está em [docs/modelo-de-dados.md](../docs/modelo-de-dados.md#7-formato-dos-arquivos-de-conteúdo).

## Onde fica cada coisa

| Pasta / arquivo                   | O que é                            | `id`              |
| --------------------------------- | ---------------------------------- | ----------------- |
| `config/trilhas.yaml`             | As 7 trilhas, na ordem de exibição | —                 |
| `config/niveis.yaml`              | Os 5 níveis                        | —                 |
| `config/estilos.yaml`             | Etiquetas de estilo                | —                 |
| `competencias/<trilha>.yaml`      | Competências da trilha, em ordem   | `<trilha>.<nome>` |
| `conceitos/<pasta>/<id>.md`       | Verbetes da Biblioteca             | nome do arquivo   |
| `aulas/<trilha>/<nome>.md`        | Aulas                              | `<trilha>.<nome>` |
| `exercicios/<trilha>/<nome>.yaml` | Exercícios (quiz ou execução)      | `<trilha>.<nome>` |
| `cursos/<id>.yaml`                | Cursos e seus módulos, em ordem    | nome do arquivo   |

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

::::checkpoint{id="pratica" title="Prática guiada" stage="pratica"} ← etapa opcional

::chord{symbol="Cm7" inversion="1"}
::arpeggio{symbol="Cmaj7" octaves="2"}
::interval{from="C4" to="Eb4"}
::synth{preset="pad"} ← laboratório de síntese (pad, pluck, lead, strings, organ, bass)
::chords{symbols="G G7 C Cm G" key="G"}
::progression{key="G" degrees="I I7 IV iv I"}
::scale{root="D" type="harmonic-minor" octaves="2"}

:::common-mistake{title="Opcional"}
Texto do erro comum.
:::
::::
```

Um bloco dentro de outro precisa de mais `:` no bloco de fora (`::::checkpoint` contém `:::common-mistake`).

Tipos de escala: `major`, `natural-minor`, `harmonic-minor`, `melodic-minor`, `ionian`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`, `major-pentatonic`, `minor-pentatonic`, `blues` (blues menor), `major-blues`, `phrygian-dominant`, `lydian-dominant`, `altered`, `whole-tone`, `diminished-wh`, `diminished-hw`, `chromatic`.

## Cursos, módulos e aulas

O **curso** organiza o estudo: módulos em ordem recomendada, cada um com nível, pré-requisitos (outros módulos), aulas em ordem e os tópicos ainda em preparação (`upcoming`). As trilhas e competências continuam medindo o progresso.

```yaml
id: harmonia-e-tecnica
title: Harmonia e técnica
summary: …
order: 2
modules:
  - id: arpejos # id completo: harmonia-e-tecnica.arpejos
    title: Arpejos
    summary: …
    level: 2
    prerequisites: [harmonia-e-tecnica.triades-e-campo-maior]
    lessons: [tecnica.arpejos-de-triades-e-tetrades]
    upcoming: [Arpejos em inversões e em movimento contrário]
    style: gospel # opcional, para módulos de estilo
```

**Aula em etapas.** O app gera a Introdução (com `why`, objetivos, pré-requisitos e roteiro), o Aprofundamento (`materials`) e o Próximo passo. As partes da aula declaram a etapa com `stage`: `fundamentos`, `visualizacao`, `aplicacao`, `pratica` ou `revisao`.

**Materiais externos** ficam no frontmatter da aula, separados por finalidade:

```yaml
materials:
  - title: Seventh Chords
    url: https://musictheory.net/lessons/45
    source: musictheory.net
    kind: interactive # video, article, interactive, course, sheet, backing-track, song, docs
    purpose: understand # understand (entender), see (ver aplicado), listen (ouvir), practice (praticar)
    language: en # pt, en, es (padrão en)
    note: Por que este material vale a pena.
```

Só entra link verificado: a página precisa existir e tratar do assunto. Prefira páginas específicas a páginas iniciais de canais e sites.

**Exercícios** declaram a etapa (`stage`: `recognition`, `execution`, `application`, `creativity`) e podem ter `challenges` (desafios extras). Os de execução aceitam `startBpm`, `targetBpm` e `bpmStep` (andamento progressivo) e `backing` (playback em loop: `{ key: G, degrees: I VIm IV V, beatsPerChord: 4 }`). Questões de quiz podem tocar um som com `audio: { notes: C4 E4, play: melody }` ou `audio: { chord: Cm7, play: arpeggio }` (`together`, `arpeggio` ou `melody`).

## Estado atual

- **Mapa curricular** com 5 cursos (Fundamentos, Harmonia e técnica, Escalas e modos, Estilos, Timbres e sound design) e 34 módulos. Os módulos sem aula mostram os tópicos em preparação.
- **12 aulas**, 20 competências, 16 conceitos e 50 exercícios. Além da fatia de Harmonia ([plano](../docs/plano-fatia-harmonia.md)), já há aulas completas, com etapas, exercícios nas quatro etapas e materiais externos, para Intervalos, Arpejos, Os sete modos, Fundamentos de síntese e Gospel contemporâneo.
- As 7 aulas da fatia de Harmonia ainda não têm materiais externos nem etapas marcadas.
- O conteúdo musical ainda precisa de **revisão do autor**.
