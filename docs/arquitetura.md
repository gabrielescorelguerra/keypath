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
  build-content.ts         lê content/, valida e gera o catálogo
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

1. O `scripts/build-content.ts` lê YAML e Markdown (com frontmatter) de `content/`.
2. Valida cada arquivo com os schemas Zod de `domain/catalog`.
3. Interpreta o Markdown (remark + directives) e coleta as referências e os checkpoints.
4. Valida a **integridade** do conjunto ([modelo §8](modelo-de-dados.md#8-regras-de-integridade-validadas-no-build)):
   - referências;
   - ciclos no grafo de pré-requisitos;
   - coerência entre critérios e exercícios;
   - notação musical interpretável.
5. Gera `catalog.json` (as árvores de Markdown já interpretadas e os campos derivados prontos) e o índice da Biblioteca.

O script roda antes do `dev` e do `build`, e em modo de observação durante o desenvolvimento. Qualquer erro de conteúdo interrompe o build com a mensagem apontando arquivo e campo. No MVP o catálogo é pequeno (dezenas de entidades), então um único JSON basta. Separar por trilha fica para quando houver necessidade.

## 5. Teoria musical e nomenclatura

`domain/music` é a peça central:

- **Grafia correta:** a tecla 61 é Dó# ou Réb dependendo do tom e da função. Os blocos musicais sempre definem o contexto (`key`), então o motor grafa as notas corretamente, inclusive acordes emprestados (em G, o iv é Cm, com Eb e não D#).
- **Notação canônica nos arquivos:** letras com `#` e `b`.
- **Exibição:** é feita por formatadores:
  - nomes de nota `latin` (Dó), `letters` (C) ou `both` (Dó (C)), sendo `both` o padrão;
  - cifra no padrão brasileiro: C7M, Cm7(b5), C°, C/E.
- Toda a interface usa os formatadores. Nenhum componente monta o nome de uma nota por conta própria.

## 6. Persistência e backup

- **Dexie**, com estas tabelas no MVP: `attempts`, `declarations`, `lessonProgress`, `settings`. Na v0.2 entram `songs`, `attachments`, `blobs` e `practiceSessions`.
- A interface acessa os dados por **repositórios** em `data/`, com consultas reativas (`useLiveQuery`) que mantêm as telas atualizadas.
- Ao iniciar, o app pede ao navegador **armazenamento persistente** (`navigator.storage.persist()`) para reduzir o risco de os dados serem apagados automaticamente.
- **Backup:** exportação e importação descritas no [modelo §9](modelo-de-dados.md#9-formato-do-backup). A tela de Configurações mostra a data do último backup e lembra o usuário de fazer um quando passar muito tempo.
- **Arquivos pessoais** (v0.2) ficam no IndexedDB como Blob e nunca no repositório. O `.gitignore` também cobre arquivos de backup.

## 7. Áudio

- A interface `AudioPlayer` tem os métodos `playNotes`, `playChord`, `playSequence` e `stop`. A implementação usa amostras de piano carregadas sob demanda, no primeiro clique, como exigem os navegadores.
- O metrônomo (v0.2) usa o mesmo relógio do Web Audio.
- Quando o MIDI chegar, haverá a opção "não tocar som quando o teclado estiver conectado", porque o próprio teclado já produz o som.

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

| Alvo                    | Tipo                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `domain/music`          | Unitários extensos: grafia, campos e graus em todos os tons                                   |
| `domain/progress`       | Unitários com cenários: declarar, demonstrar, `distinctDays`, nível com lacunas, recomendação |
| `scripts/build-content` | Unitários com conteúdo inválido de propósito                                                  |
| `data/`                 | Ida e volta do backup e migrações                                                             |
| Telas                   | Testes de componente nos fluxos principais; Playwright (e2e) depois                           |

O próprio build de conteúdo funciona como teste: o conteúdo publicado sempre passa nas regras de integridade.
