# KeyPath — Especificação do produto

> Versão 0.2 · 14/11/2026 · Status: **aprovada**
>
> Documentos relacionados: [Modelo de dados](modelo-de-dados.md) · [Arquitetura](arquitetura.md) · [Decisões](decisoes.md) · [Plano da fatia de Harmonia](plano-fatia-harmonia.md)

## 1. Visão

O KeyPath é uma escola de música digital pessoal para teclado e piano. Ele reúne três experiências sobre **uma mesma base de conhecimento**:

| Área                               | Pergunta que responde                          |
| ---------------------------------- | ---------------------------------------------- |
| **Aprendizado guiado**             | "O que eu estudo agora?"                       |
| **Biblioteca** (aprendizado livre) | "Como funciona X?"                             |
| **Prática**                        | "O que eu treino hoje e como estou evoluindo?" |

## 2. Usuário

Há um único usuário, o próprio autor do projeto:

- toca teclado e hoje atua na música gospel;
- conhece o básico: campos harmônicos e algumas técnicas;
- quer revisar a base, aprender empréstimo modal e conhecer outros estilos;
- tem um teclado MIDI;
- usa principalmente o computador, e o celular de forma secundária.

Não há autenticação, múltiplos usuários nem backend.

## 3. Princípios

1. **A competência é a unidade de progresso.** O progresso não é medido por aula concluída nem por nível declarado. É medido por habilidades pequenas e verificáveis.
2. **O nível é derivado, nunca definido à mão.** O nível de cada trilha é calculado a partir das competências dominadas.
3. **Uma fonte única de conhecimento.** A explicação de um conceito fica na Biblioteca. As aulas a incorporam e não a reescrevem.
4. **Profundidade antes de fragmentação.** São poucas aulas, completas, com pontos de verificação internos.
5. **Recomendar, nunca bloquear.** Os pré-requisitos orientam, mas não impedem o acesso a nenhum conteúdo.
6. **Domínio verificável.** Todo critério de domínio é observável: quiz, execução, autoavaliação estruturada ou, no futuro, revisão.
7. **O conteúdo vive no Git, os dados pessoais vivem no dispositivo.** Os dados pessoais têm backup exportável desde a primeira versão.
8. **Desktop primeiro.** A interface é pensada para o computador e continua utilizável no celular.

## 4. Estrutura pedagógica

### 4.1 Trilhas

São seis trilhas, que funcionam como os eixos de progresso. Repertório deixou de ser trilha e passou para a área de Prática (ver [D12](decisoes.md)).

| Trilha             | Natureza                          |
| ------------------ | --------------------------------- |
| Teoria musical     | Disciplina                        |
| Harmonia           | Disciplina                        |
| Técnica            | Disciplina                        |
| Percepção auditiva | Disciplina                        |
| Acompanhamento     | Aplicação: integra as disciplinas |
| Improvisação       | Aplicação: integra as disciplinas |

### 4.2 Níveis

1. Iniciante · 2. Básico desenvolvido · 3. Intermediário · 4. Intermediário avançado · 5. Avançado

O nível **não contém** conteúdo. Ele aparece de duas formas:

- como **atributo de dificuldade** de cada competência;
- como **resultado calculado** do aluno em cada trilha.

**Regra de cálculo:** o nível de uma trilha é o maior _N_ para o qual todas as competências _essenciais_ daquela trilha, do nível 1 até _N_, estão dominadas ou declaradas. Um nível sem nenhuma competência cadastrada interrompe a contagem. Se o nível 1 não estiver completo, a trilha aparece como "sem nível". A interface também mostra o progresso dentro do próximo nível, por exemplo "Nível 2 · 3 de 5 competências do nível 3".

### 4.3 Competências

Uma competência é uma habilidade pequena e verificável. Por exemplo: "forma e toca o campo harmônico maior em qualquer tonalidade".

Cada competência:

- pertence a **uma** trilha e tem **um** nível;
- tem **pré-requisitos**, que são outras competências, inclusive de outras trilhas;
- tem **critérios de domínio**, que definem quando ela está dominada;
- referencia **conceitos** da Biblioteca;
- pode ser marcada como **não essencial**. Uma competência não essencial não entra no cálculo de nível. Isso serve, por exemplo, para competências específicas de um estilo.

### 4.4 Domínio de uma competência

| Situação         | Como se chega a ela                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **Dominada**     | Todos os critérios de domínio foram cumpridos.                                                  |
| **Declarada**    | O aluno afirmou que já sabe (conhecimento prévio).                                              |
| **Em andamento** | Há alguma atividade relacionada: uma tentativa de exercício ou um checkpoint de aula concluído. |
| **Não iniciada** | Nenhuma atividade.                                                                              |

Para fins de pré-requisitos e de cálculo de nível, **dominada e declarada valem igualmente**. Na interface, uma competência declarada aparece de forma distinta e pode ser **demonstrada** a qualquer momento.

O aluno tem dois caminhos para não precisar repetir conteúdo introdutório:

- **Declarar:** marcar a competência como já conhecida. Para agilizar, é possível declarar todas as competências de uma trilha até um certo nível de uma vez. Isso funciona como o diagnóstico inicial.
- **Demonstrar:** fazer diretamente os exercícios dos critérios da competência, sem passar pela aula.

**Métodos de verificação dos critérios:**

| Método                       | Situação no MVP                                                            |
| ---------------------------- | -------------------------------------------------------------------------- |
| Quiz                         | ✅ Corrigido automaticamente                                               |
| Autoavaliação                | ✅ Checklist com metas objetivas, opcionalmente exigida em dias diferentes |
| Execução verificada por MIDI | ⏳ Pós-MVP. O mesmo exercício de execução ganha correção automática.       |
| Revisão espaçada             | ⏳ Pós-MVP. As datas já ficam registradas desde o MVP.                     |

No MVP, os exercícios de execução são avaliados por **autoavaliação estruturada**. Por exemplo: "toquei nas 12 tonalidades a 60 bpm sem parar".

### 4.5 Conceitos (Biblioteca)

Um conceito é um verbete de referência: o que é, como se forma, tabelas, variações e sinônimos. A Biblioteca é a **fonte única** dessas explicações. Aulas e competências apontam para os conceitos.

### 4.6 Aulas

Uma aula é um percurso pedagógico profundo. Ela trabalha uma ou mais competências e é dividida em **pontos de verificação** (checkpoints), que permitem salvar o progresso parcial.

| Seção                     | Origem                                                          | Obrigatória |
| ------------------------- | --------------------------------------------------------------- | ----------- |
| Introdução                | Escrita na aula                                                 | Sim         |
| Objetivos de aprendizagem | **Gerados** das competências trabalhadas                        | Automática  |
| Pré-requisitos            | **Gerados** dos pré-requisitos das competências                 | Automática  |
| Explicação teórica        | Conceitos incorporados da Biblioteca e texto específico da aula | Não         |
| Exemplos musicais         | Blocos tocáveis (acordes, progressões, escalas)                 | Não         |
| Aplicação no teclado      | Escrita na aula                                                 | Não         |
| Exercícios                | Exercícios incorporados (entidades independentes)               | Não         |
| Erros comuns              | Blocos de destaque                                              | Não         |
| Critérios de domínio      | **Gerados** dos critérios das competências                      | Automática  |
| Referências               | Escrita na aula                                                 | Não         |

Concluir uma aula significa ter concluído todos os seus checkpoints. Isso **não** equivale a dominar as competências, porque o domínio vem dos critérios.

### 4.7 Exercícios

Um exercício é uma entidade independente e reutilizável: aparece em aulas, em critérios de domínio e, no futuro, em sessões de prática. Há dois tipos no MVP:

- **Quiz:** questões de escolha única ou múltipla, com correção automática.
- **Execução:** uma tarefa no teclado com parâmetros (tonalidades, bpm) e um checklist de autoavaliação.

### 4.8 Estilos

Estilos (gospel, MPB, pop, jazz…) são **etiquetas**. Podem ser aplicados a competências, conceitos, aulas, exercícios e músicas, e servem para filtrar e priorizar. Não são trilhas e não têm progresso próprio.

### 4.9 Cursos e módulos _(pós-MVP)_

Um curso é uma sequência curada de aulas, organizada em módulos, que pode passar por várias trilhas. Exemplo: "Harmonia Gospel". O curso não tem estado próprio: o progresso dele é derivado das aulas e competências que contém. Ficou fora do MVP porque a fatia de Harmonia é organizada naturalmente pelo grafo de competências.

### 4.10 Músicas e repertório _(pós-MVP, área de Prática)_

Uma música faz parte do repertório pessoal. Tem título, artista, tom, estilos, situação (quero aprender, estudando, pronta), anotações e **anexos**: PDF, imagem, arquivo MIDI ou link do YouTube. Pode indicar as competências que exige. É dado pessoal: fica no dispositivo e **nunca** vai para o Git.

## 5. Recomendação (MVP)

A ordem de prioridade é:

1. **Continuar** a aula em andamento acessada mais recentemente.
2. Entre as competências **prontas** (pré-requisitos atendidos, mas ainda não dominadas nem declaradas), escolher a de menor nível e, em caso de empate, a que vem antes na ordem de cadastro.
   - Se existir uma aula não concluída que trabalha essa competência, recomendar a aula.
   - Se não existir, recomendar **demonstrar** a competência pelos exercícios.

É possível filtrar por trilha e por estilo. Objetivos pessoais ("quero chegar ao empréstimo modal") ficam para depois do MVP.

## 6. Escopo por etapa

### MVP (v0.1)

- Catálogo de conteúdo validado no build: trilhas, níveis, estilos, competências, conceitos, aulas e exercícios.
- **Fatia de Harmonia**, da revisão de campo harmônico ao empréstimo modal, com aplicações no gospel ([plano](plano-fatia-harmonia.md)).
- Telas:
  - **Início:** recomendação, aula em andamento e níveis por trilha.
  - **Trilha:** competências por nível, com status.
  - **Competência:** critérios e seu estado, pré-requisitos, aulas e conceitos, e as ações declarar e demonstrar.
  - **Aula:** leitura por checkpoints, exemplos tocáveis e exercícios incorporados.
  - **Exercício:** quiz ou autoavaliação.
  - **Biblioteca:** busca e verbetes.
  - **Diagnóstico:** declarar conhecimentos por trilha e nível.
  - **Configurações:** nomenclatura das notas, som e backup.
- Teclado visual e **reprodução de som** nos exemplos musicais.
- Nomes de notas configuráveis (Dó, C ou "Dó (C)"). O padrão é **ambos**.
- Exportação e importação de backup (JSON).

### v0.2

- ✅ Área de Prática:
  - **Repertório:** músicas com anexos (PDF, imagem, MIDI, YouTube), importação em lote e competências exigidas.
  - **Sessões:** cronômetro, sugestões do que treinar, músicas praticadas, anotações e histórico.
  - **Backup:** passa a ser um ZIP com os arquivos.
- ✅ Metrônomo, na sessão, nos exercícios no teclado e na página de cada música.
- ⏳ Cursos e módulos (pendente).

### Futuro

- Integração MIDI: verificação de notas e acordes e, depois, de ritmo.
- Revisão espaçada.
- Objetivos pessoais na recomendação.
- Outras trilhas e estilos.
- Partitura.
- PWA e uso offline.
- Sincronização entre dispositivos.

## 7. Fora de escopo

Autenticação, múltiplos usuários, backend, edição de conteúdo pela interface, importação a partir de sites de cifras e conteúdo protegido por direitos autorais dentro do repositório.
