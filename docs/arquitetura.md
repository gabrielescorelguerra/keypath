# KeyPath — Arquitetura técnica

> Versão 0.2 · 14/11/2026 · Status: **aprovada**
>
> As bibliotecas citadas são escolhas iniciais. Base instalada na etapa 1: Node 22+, TypeScript 7, React 19, Vite 8, Vitest 5.

## 1. Visão geral

O KeyPath é uma **aplicação web estática** (SPA), sem backend:

- o conteúdo é compilado no build;
- os dados do usuário ficam no IndexedDB do navegador;
- a hospedagem pode ser qualquer servidor estático. A sugestão é o GitHub Pages.

```
┌──────────────────────────────────────────────────────────────┐
│ app/ + features/   (React: telas, rotas, layout)              │
├──────────────────────────────────────────────────────────────┤
│ ui/                (componentes: teclado, bloco musical, quiz)│
├──────────────┬───────────────┬───────────────┬───────────────┤
│ content/     │ data/         │ audio/        │ input/ (MIDI⏳)│
│ catálogo     │ IndexedDB,    │ reprodução    │ entrada de    │
│ + busca      │ backup        │               │ notas         │
├──────────────┴───────────────┴───────────────┴───────────────┤
│ domain/  (TypeScript puro: teoria musical, tipos, regras)     │
└──────────────────────────────────────────────────────────────┘
```

**Regra de dependência:** cada camada só importa das camadas abaixo dela. `domain/` não conhece React, navegador, IndexedDB nem áudio. Toda a lógica que importa (domínio de competências, nível, recomendação, teoria musical) é testável com funções puras.

## 2. Stack

| Necessidade    | Escolha                                                                     | Motivo                                                                              |
| -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Linguagem      | TypeScript (modo estrito)                                                   | O modelo de dados é rico e os tipos protegem as relações                            |
| UI             | React + Vite                                                                | Ecossistema maduro e build estático simples                                         |
| Rotas          | React Router                                                                | Padrão de mercado                                                                   |
| Estilos        | CSS Modules + variáveis CSS (tokens)                                        | Sem dependência pesada, com tema claro e escuro                                     |
| Validação      | Zod                                                                         | Mesmos schemas para o conteúdo (build), o backup (importação) e a geração dos tipos |
| Markdown       | unified / remark + `remark-directive`                                       | O conteúdo continua sendo texto puro; as _directives_ viram componentes React       |
| Teoria musical | Tonal (`tonal`), **encapsulado** em `domain/music`                          | Grafia correta, acordes e escalas; o app nunca chama a biblioteca diretamente       |
| Áudio          | Web Audio com amostras de piano (`smplr`), atrás da interface `AudioPlayer` | Som de piano real, carregado sob demanda                                            |
| Persistência   | IndexedDB via Dexie                                                         | Guarda volume e arquivos (anexos na v0.2) e tem versionamento de schema             |
| Busca          | MiniSearch                                                                  | Busca de texto completo no cliente, ignorando acentos                               |
| Testes         | Vitest + Testing Library; Playwright depois                                 |                                                                                     |
| Qualidade      | oxlint + Prettier                                                           | oxlint é o linter padrão do template atual do Vite e muito rápido                   |
| Deploy         | GitHub Actions → GitHub Pages                                               | Gratuito e sem servidor                                                             |

## 3. Estrutura de diretórios

```
content/                   conteúdo autoral (versionado no Git)
  config/                  trilhas.yaml, niveis.yaml, estilos.yaml
  competencias/            <trilha>.yaml
  conceitos/<trilha>/      <id>.md
  aulas/<trilha>/          <id>.md
  exercicios/<trilha>/     <id>.yaml
scripts/
  content/                 leitura de content/ (YAML, Markdown), plugin do Vite
  check-content.ts         npm run content:check — lista erros e avisos do conteúdo
src/
  domain/
    music/                 notas, grafia, intervalos, acordes, escalas, campos, graus, formatação
    catalog/               tipos e schemas do conteúdo
    progress/              regras: critérios, domínio, nível, status de aula, recomendação
  content/                 carrega o catálogo compilado e monta o índice de busca
  data/                    banco (Dexie), repositórios, backup, migrações
  audio/                   AudioPlayer
  input/                   NoteInput (teclado na tela; MIDI ⏳)
  ui/                      componentes reutilizáveis
  features/                inicio, trilhas, competencias, aulas, exercicios, biblioteca, diagnostico, configuracoes
  app/                     rotas, layout, providers
docs/
```

## 4. Pipeline de conteúdo

1. `scripts/content/load.ts` lê YAML e Markdown (com frontmatter) de `content/` e valida cada arquivo com os schemas Zod de `domain/catalog` (mensagens em português).
2. `scripts/content/markdown.ts` interpreta o Markdown (remark + GFM + directives), valida directives e notação musical com `domain/music`, coleta referências e separa a introdução dos checkpoints.
3. `domain/catalog/compile.ts` (função pura, testada) valida a **integridade** do conjunto ([modelo §8](modelo-de-dados.md#8-regras-de-integridade-validadas-no-build)) e calcula os campos derivados.
4. O plugin `scripts/content/vite-plugin.ts` entrega o catálogo ao app como o módulo virtual `virtual:keypath-catalog` (JSON com as árvores de Markdown já interpretadas). `src/content` o importa e monta os índices de consulta.

Não há arquivo gerado no repositório. No `npm run dev`, qualquer alteração em `content/` recarrega a página; um erro de conteúdo aparece na tela com arquivo, linha e motivo. No `npm run build`, um erro interrompe o build. `npm run content:check` lista erros **e avisos** no terminal (também roda na CI).

O código de `domain/` e `scripts/` usa extensão `.ts` explícita nos imports relativos. Assim ele roda direto no Node e na configuração do Vite, sem passar por um bundler.

## 5. Teoria musical e nomenclatura

`domain/music` é a peça central:

- **Grafia correta:** a tecla 61 é Dó# ou Réb dependendo do tom e da função. Os blocos musicais sempre definem o contexto (`key`), então o motor grafa as notas corretamente, inclusive acordes emprestados (em G, o iv é Cm, com Eb e não D#).
- **Notação canônica nos arquivos:** letras com `#` e `b`.
- **Exibição:** é feita por formatadores:
  - nomes de nota `latin` (Dó), `letters` (C) ou `both` (Dó (C)), sendo `both` o padrão;
  - cifra no padrão brasileiro: C7M, Cm7(b5), C°, C/E.
- Toda a interface usa os formatadores. Nenhum componente monta o nome de uma nota por conta própria.

## 6. Persistência e backup

- **Dexie** (`src/data/db.ts`), banco `keypath`, versão 1, com as tabelas `attempts`, `declarations`, `lessonProgress`, `settings` e `meta` (metadados do dispositivo, como a data do último backup, que não entram no backup). Na v0.2 entram `songs`, `attachments`, `blobs` e `practiceSessions`. Para mudar o formato, crie uma nova `version(n)` com `.upgrade()` e nunca altere uma versão publicada.
- Toda gravação passa pelos **repositórios** em `src/data/repositories.ts`. A interface lê por hooks reativos (`useUserFacts`, `useSettings`, `useLastBackupAt`, baseados em `useLiveQuery`), e `useProgress` (em `src/app`) recalcula o estado derivado a cada gravação.
- O pedido de **armazenamento persistente** (`navigator.storage.persist()`) é feito na **primeira gravação** da sessão, e não ao abrir o app, porque o Firefox mostra uma pergunta ao usuário. O Chrome decide sozinho, com base no uso do site. A situação aparece em "Seus dados".
- **Backup** (`src/data/backup.ts`): exportação e importação descritas no [modelo §9](modelo-de-dados.md#9-formato-do-backup). A importação valida com Zod, aplica as migrações (`MIGRATIONS`, por versão de origem), recusa backups de versão mais nova e substitui tudo depois de uma confirmação.
- **Lembrete de backup** (`src/data/reminder.ts`): aparece quando há dados e nunca houve backup, ou quando há atividade nova e o último backup tem mais de 7 dias.
- **Arquivos pessoais** (v0.2) ficam no IndexedDB como Blob e nunca no repositório. O `.gitignore` também cobre arquivos de backup.
- **Testes:** usam `fake-indexeddb`, um IndexedDB simulado em memória. `src/test/db.ts` limpa o banco entre os testes.

## 7. Áudio

- `src/audio/player.ts` implementa a interface `AudioPlayer` (`playChord`, `playSequence`, `stop`, `setVolume`). O `AudioContext` é criado no primeiro toque, como exigem os navegadores.
- **Piano de verdade:** amostras do `smplr` (SplendidGrandPiano), baixadas da internet no primeiro toque. Para carregar rápido, só uma camada de dinâmica e as notas de C2 a C7.
- **Sem espera e sem internet:** enquanto as amostras carregam, ou se o download falhar, o player toca com um sintetizador simples de Web Audio (seno e triângulo com decaimento). O som sempre responde. Para uso offline de verdade (PWA), as amostras precisarão ser hospedadas no próprio app.
- `useAudio()` aplica as Configurações: com o som desligado, os botões de tocar nem aparecem; o volume vem do controle.
- **Condução de vozes:** sequências de acordes usam `voiceLead` (`domain/music`), que escolhe a inversão mais próxima do acorde anterior.
- **Metrônomo** (`src/audio/metronome.ts`): agenda cada clique com antecedência no relógio do Web Audio (olha 120 ms à frente a cada 25 ms), o que mantém o tempo preciso mesmo com a aba ocupada. A agenda é uma função pura com testes (`metronomeSchedule.ts`), e o indicador visual acompanha cada batida. Piano e metrônomo compartilham um único `AudioContext` (`src/audio/context.ts`).
- Quando o MIDI chegar, haverá a opção "não tocar som quando o teclado estiver conectado".

## 7.1 Markdown e blocos musicais

- `src/ui/markdown/Markdown.tsx` renderiza a árvore já interpretada no build (mdast) com componentes React próprios. HTML bruto do conteúdo nunca é exibido. Títulos do conteúdo começam em `h2`, porque o `h1` é o título da página.
- Blocos musicais (`src/ui/music`): `::chord`, `::chords`, `::progression` e `::scale` mostram o teclado em SVG com as notas destacadas e nomeadas conforme a configuração, a cifra brasileira, os graus e o botão de tocar. Em sequências, clicar num acorde mostra e toca aquele acorde, e "Tocar a sequência" acompanha o destaque.
- `::concept` e `::exercise` são resolvidos por quem usa o renderizador (a página da aula), por meio de `embeds`.

## 7.2 Biblioteca e busca

- MiniSearch no navegador, com índice montado uma vez a partir dos conceitos (título, sinônimos, resumo e texto).
- Ignora acentos e maiúsculas ("harmonico" encontra "harmônico"), busca por prefixo, aceita erro de digitação em palavras de mais de 4 letras e exige todos os termos. O título vale mais que os sinônimos, que valem mais que o texto.
- A busca fica no endereço (`#/biblioteca?q=...`), então dá para voltar a ela pelo histórico.

## 8. Preparação para MIDI (sem implementação no MVP)

O MVP deixa três pontos de extensão prontos:

1. **`input/NoteInput`:** uma fonte de eventos `{ midi, velocity, on/off, time }`. No MVP existe apenas o teclado na tela, clicável, que toca o som. A fonte Web MIDI vai implementar a mesma interface.
2. **`MasteryCriterion.method = 'performance'`:** o valor já está reservado no schema.
3. **`Exercise.verification`** (a ser adicionado): regras flexíveis, como "estas classes de nota em qualquer inversão" ou "baixo obrigatório". Elas vão comparar os eventos capturados com o alvo usando `domain/music`.

Restrições conhecidas: o Web MIDI funciona em Chrome, Edge e Firefox, **mas não no Safari nem no iOS**. No Android, funciona no Chrome com USB OTG. Os recursos que dependem de MIDI precisam degradar com elegância.

## 9. Interface e dispositivos

- O layout é pensado primeiro para o desktop (navegação lateral e leitura em coluna) e responde até a largura de celular.
- O teclado visual mostra uma janela de oitavas adaptável e rola horizontalmente em telas pequenas.
- PWA e uso offline ficam para o futuro. Antes disso, as amostras de áudio precisam ser hospedadas no próprio app.

## 10. Testes

| Alvo                                | Tipo                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `domain/music`                      | Unitários extensos: grafia, campos e graus em todos os tons                                        |
| `domain/progress`                   | Unitários com cenários: declarar, demonstrar, `distinctDays`, nível com lacunas, recomendação      |
| `domain/catalog`, `scripts/content` | Unitários com conteúdo inválido de propósito; o conteúdo real de `content/` é compilado nos testes |
| `data/`                             | Ida e volta do backup e migrações                                                                  |
| Telas                               | Testes de componente nos fluxos principais; Playwright (e2e) depois                                |

O próprio build de conteúdo funciona como teste: o conteúdo publicado sempre passa nas regras de integridade.
