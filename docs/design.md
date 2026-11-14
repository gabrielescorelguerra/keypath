# KeyPath — Direção de design

> Versão 1.1 · 14/11/2026 · Redesign visual: diagnóstico, proposta e sistema. **Status: implementado** (R1–R4).

## 1. Diagnóstico (antes)

Analisei as 11 páginas: Início, Trilha, Competência, Aula, Exercício, Biblioteca, Conceito, O que já sei, Prática, Repertório e Configurações.

| #   | Problema                                                                                                                                                                                                                    | Onde aparece                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | **Sem identidade.** Fonte do sistema, azul genérico (#3b5bdb), sem marca. Parece um template de painel administrativo.                                                                                                      | Todas                           |
| 2   | **Composição monótona.** Toda página é título + pilha de listas com borda, numa coluna só, do mesmo jeito. Nada distingue o principal do secundário.                                                                        | Todas                           |
| 3   | **Hierarquia fraca.** Título de seção (18 px) quase do tamanho do texto. Todos os status são pílulas cinza iguais. Três próximos passos com o mesmo peso, embora só um seja "o próximo".                                    | Início, Competência, Trilha     |
| 4   | **Espaço sem propósito.** Coluna limitada a 64rem e alinhada à esquerda: em telas largas sobra uma faixa vazia à direita, enquanto as informações de apoio ficam empilhadas lá embaixo. Barra lateral branca e quase vazia. | Competência, Repertório, Início |
| 5   | **Barra lateral passiva.** Só links de texto: sem ícones, sem estado (nível das trilhas, sessão em andamento) e com o mesmo fundo do conteúdo.                                                                              | Layout                          |
| 6   | **Dados mal representados.** O nível aparece só em texto. Barras de progresso finas e cinza. Números (bpm, tempo, graus) na mesma fonte do texto.                                                                           | Início, Trilha, Prática         |
| 7   | **Componentes genéricos.** Botões, campos, chips e badges com a mesma forma. Sem estados de hover e foco cuidados. Sem microinterações.                                                                                     | Todas                           |
| 8   | **Leitura cansativa.** Na aula e no verbete, a linha de texto passa de 120 caracteres. As partes da aula viram pílulas que quebram linha.                                                                                   | Aula, Conceito                  |
| 9   | **Blocos musicais "soltos".** O teclado é bom, mas fica num card genérico, com botão de texto e graus sem destaque.                                                                                                         | Aula, Biblioteca                |
| 10  | **Tabelas cruas.** Sem ritmo tipográfico nem alinhamento numérico. O repertório é uma lista sem colunas.                                                                                                                    | Conceito, Repertório            |

## 2. Direção: "Estúdio"

A ideia central é **console + partitura**:

- **Console:** a moldura do app (barra lateral, cabeçalhos, controles) se comporta como o painel de um software de música. É escura, precisa, com rótulos em fonte monoespaçada, medidores em segmentos e uma única cor de sinal.
- **Partitura:** o conteúdo (aulas, verbetes, listas) fica num papel claro e quente, com tipografia editorial, medida de leitura confortável e linhas finas no lugar de caixas.

O resultado deve transmitir **organização, precisão, criatividade e qualidade**, sem exagero: nada de gradientes chamativos nem sombras pesadas, e raios pequenos.

### 2.1 Cor

| Papel                    | Claro                             | Escuro                   | Uso                                    |
| ------------------------ | --------------------------------- | ------------------------ | -------------------------------------- |
| Papel (fundo)            | `#F4F2EC`                         | `#101114`                | fundo da página                        |
| Superfície               | `#FFFFFF`                         | `#17181C`                | painéis, listas                        |
| Superfície rebaixada     | `#ECE9E1`                         | `#0C0D10`                | trilhos, campos, teclado               |
| Tinta (texto)            | `#17181C`                         | `#ECEBE7`                | texto principal e botão primário       |
| Texto 2 / 3              | `#5B5D63` / `#8B8C90`             | `#A4A5AA` / `#6E7076`    | apoio, rótulos                         |
| Linha                    | `#E2DED4`                         | `#26282E`                | divisórias finas                       |
| **Sinal (âmbar)**        | `#D9822B`                         | `#F09A45`                | ativo, progresso, foco, destaque       |
| Sinal-texto              | `#9C5410`                         | `#F5B06A`                | texto sobre fundo claro (contraste AA) |
| Console                  | `#141519`                         | `#0A0B0D`                | barra lateral (escura nos dois temas)  |
| Sucesso / Atenção / Erro | `#2E7A4E` / `#A8660F` / `#B23A2B` | tons claros equivalentes | semântica                              |

- **Uma cor de sinal só.** O âmbar lembra LEDs e VU-meters de equipamento de áudio e aparece apenas onde há estado: item ativo, progresso, foco, nota destacada no teclado.
- **O botão primário é tinta (quase preto), não âmbar.** A ação principal fica forte sem disputar com os indicadores.

### 2.2 Tipografia

As fontes são hospedadas no próprio app (pacotes `@fontsource`), funcionam offline e não dependem de serviço externo.

| Papel                         | Fonte                                         | Por quê                                                                    |
| ----------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Títulos de página e destaques | **Fraunces** (serifa variável, ajuste óptico) | Caráter editorial de "escola de música", foge do visual de template        |
| Interface e texto             | **IBM Plex Sans**                             | Técnica e precisa, muito legível em tamanhos pequenos                      |
| Dados e rótulos               | **IBM Plex Mono**                             | bpm, tempo, graus, níveis e rótulos em maiúsculas: precisão de instrumento |

Escala modular de **1,250** (terça maior, o que convém a um app de música):

`12 · 13 · 14 (pequeno) · 16 (texto) · 20 · 25 · 31 · 39 (título) · 49 (destaque)`

Os pesos são 400 e 500 no texto, 600 nos rótulos e 500 a 600 na serifa. Altura de linha: 1,6 em leitura, 1,45 na interface e 1,1 em títulos.

### 2.3 Espaço, grade e forma

- Ritmo vertical em base de **4 px**, com espaços de 4, 8, 12, 16, 24, 32, 48 e 64.
- Raios de 6 px (controles) e 10 px (painéis). Nada de pílulas, exceto indicadores redondos.
- Linhas finas de 1 px separam blocos, no lugar de caixas.
- **Profundidade em duas camadas só:** superfície plana; e painel em destaque, com sombra muito curta e sutil. A barra lateral escura dá a terceira camada sem efeitos.
- **Grade da página:** área de conteúdo de até 76rem, com duas composições principais:
  - **Principal + painel lateral** (2fr / 1fr): Início, Competência e Prática.
  - **Coluna de rótulos + conteúdo** (10rem / 1fr): níveis da Trilha, grupos do Diagnóstico e seções de Configurações.
- **Medida de leitura** de 40rem (70 a 75 caracteres) em aulas e verbetes, com a navegação das partes numa coluna ao lado.

### 2.4 Elementos-assinatura

1. **Medidor de nível em 5 segmentos**, como um VU-meter. Mostra o nível de cada trilha na barra lateral, no Início e na Trilha. O segmento em andamento aparece parcialmente aceso.
2. **Rótulo de seção ("eyebrow")** em Plex Mono, maiúsculas e espaçado, acima de títulos serifados.
3. **Pontos de estado** no lugar de pílulas: ● dominada (verde), ◐ declarada, ● em andamento (âmbar), ○ não iniciada. Ficam mais leves e mais rápidos de ler.
4. **Barra de transporte** na sessão de prática, como num software de música: indicador de gravação, cronômetro em mono grande e metrônomo integrado.
5. **Graus e cifras em mono**, sempre alinhados.

### 2.5 Movimento

| Elemento          | Comportamento                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Duração           | 120 ms (hover), 180 ms (estado), 240 ms (entrada)                                                          |
| Curva             | `cubic-bezier(.2,.7,.2,1)`                                                                                 |
| Entrada de página | o conteúdo surge com opacidade e sobe 4 px                                                                 |
| Hover             | listas ganham fundo sutil e uma seta que desliza 2 px; botões escurecem; ao pressionar, encolhem para 0,98 |
| Progresso         | barras e medidores animam a mudança                                                                        |
| Indicadores       | a tecla destacada transiciona a cor; o ponto do metrônomo pulsa; a sessão ativa tem um ponto "gravando"    |

Com `prefers-reduced-motion`, todo o movimento é desligado.

## 3. Composição por página

| Página                           | Antes                            | Depois                                                                                                                                                                                                                                                    |
| -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Barra lateral**                | Branca, só texto                 | Console escuro: marca com glifo de teclado, ícones, grupos com rótulo mono, trilhas com medidor de nível, indicador de sessão em andamento no rodapé                                                                                                      |
| **Início**                       | 3 cartões iguais + lista         | Saudação editorial. **Bloco principal** com o próximo passo em destaque (título serifado e ação primária) e os demais passos como lista compacta. **Painel lateral** com o nível das trilhas (medidores) e a semana de prática. Lembretes como faixa fina |
| **Trilha**                       | Pilha de listas por nível        | Cabeçalho com medidor grande. **Escada de níveis**: coluna fixa à esquerda (número grande em mono + nome) e competências à direita, com ponto de estado. Aulas como tabela compacta                                                                       |
| **Competência**                  | Tudo empilhado                   | **Principal:** descrição, critérios como checklist com estado e caminho (pré-requisitos → esta → libera). **Painel lateral fixo:** estado, ações de declarar, nível, estilos e onde estudar                                                               |
| **Aula**                         | Linhas longas, partes em pílulas | **Coluna de partes** à esquerda (linha do tempo vertical com marcação de concluída), texto em medida de leitura, barra de ação fixa no fim de cada parte                                                                                                  |
| **Exercício**                    | Opções como linhas simples       | Opções como linhas selecionáveis com letra (A, B, C) em mono; correção com barra lateral colorida; metrônomo integrado                                                                                                                                    |
| **Biblioteca**                   | Busca + listas                   | Busca grande no topo; índice em **duas colunas por trilha**, com título e resumo, em estilo de índice editorial                                                                                                                                           |
| **Conceito**                     | Linhas longas                    | Medida de leitura + painel "neste verbete" (sinônimos, relacionados, onde estudar)                                                                                                                                                                        |
| **Blocos musicais**              | Card genérico                    | "Instrumento": cabeçalho com cifra serifada e grau em mono, botão de tocar redondo, acordes como controle segmentado, teclado em moldura rebaixada                                                                                                        |
| **Prática**                      | Cartão + listas                  | **Barra de transporte** da sessão. Abaixo, duas colunas: sugestões e músicas à esquerda; metrônomo e semana à direita                                                                                                                                     |
| **Repertório**                   | Lista sem colunas                | **Tabela** de verdade (música · tom · anexos · situação), que vira lista no celular. Importação como faixa compacta                                                                                                                                       |
| **Configurações / O que já sei** | Cartões soltos                   | Coluna de rótulos + controles; nomenclatura com prévia ao vivo                                                                                                                                                                                            |

## 4. Princípios de implementação

- **Nenhuma funcionalidade nova** e nenhuma mudança de comportamento. Os testes existentes continuam valendo como rede de segurança, porque usam nomes acessíveis e não a aparência.
- Tokens em `src/styles/tokens.css`. Componentes globais em `src/styles/components.css`. Ícones SVG próprios em `src/ui/Icon.tsx`, com traço de 1,5 px e 16 a 20 px.
- Acessibilidade mantida: contraste AA, foco visível em âmbar e alvos de toque de pelo menos 36 px.
- Celular: a barra lateral vira uma barra superior compacta, as grades de duas colunas viram uma, e as tabelas viram listas.

## 5. Implementação (R1–R4)

| Etapa             | O que mudou                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1. Fundação**  | Tokens (claro e escuro), fontes hospedadas no app, componentes globais (`src/styles/components.css`), ícones (`src/ui/Icon.tsx`), console lateral, cabeçalho de página e entrada animada |
| **R2. Progresso** | Início assimétrico, escada de níveis na Trilha, Competência com painel fixo, Diagnóstico e Configurações em coluna de rótulos                                                            |
| **R3. Conteúdo**  | Aula com linha do tempo das partes e medida de leitura, quiz com opções por letra, índice editorial da Biblioteca, verbete com painel lateral, blocos musicais como instrumento          |
| **R4. Prática**   | Barra de transporte da sessão, metrônomo como equipamento, repertório em tabela (lista no celular), música com partitura em destaque                                                     |

**Verificações:**

- Os 300 testes automáticos passam. Os testes usam nomes acessíveis, então os ajustes feitos neles refletem mudanças intencionais de texto ou estrutura, não de comportamento.
- Todas as páginas foram conferidas nos temas claro e escuro e na largura de 390 px, sem rolagem horizontal.
- As classes globais antigas (`.card`, `.list`, `.row`, `.badge`…) foram mantidas e reestilizadas; novas páginas devem preferir os padrões `split`, `ladder`, `panel` e `section-title`.

---

# Direção v2: "Partitura noturna"

> 14/11/2026 · Segunda iteração, a partir da revisão do autor. Substitui as seções 2 e 3 quando houver conflito.

## 6. Diagnóstico da v1 (tema escuro)

| Problema                       | Evidência                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Cards demais, todos parecidos  | Início: 4 recipientes com 3 estilos de caixa diferentes. Competência: caixas dentro de caixas (critérios, situação, biblioteca) |
| Superfícies sem contraste real | Fundo `#101114`, superfície `#17181C` e console `#0A0B0D` são quase iguais; a borda é que separa tudo                           |
| Esqueleto único                | Título → linha → `split` 2fr/1fr em Início, Competência, Prática, Música e Sessão                                               |
| Mono maiúsculo em excesso      | 6 rótulos em caixa alta espaçada só no Início; trilha de navegação, tabelas e badges também em mono                             |
| Espaço sem intenção            | Coluna "Pré-requisitos: nenhum"; painel "0 · 0 · 0"; metade inferior do Início vazia                                            |
| Clichês de template            | Faixa colorida à esquerda do destaque, pílulas de status, ícone em círculo na área de importação                                |
| Pouca música                   | O teclado só aparece dentro dos blocos musicais. Nível e progresso não têm nada de musical                                      |

## 7. Sistema v2

**Ideia:** uma página de partitura vista à noite. O fundo é escuro e contínuo, o texto é marfim e as anotações vão nas margens. O teclado e a notação são a linguagem gráfica do produto, não peças avulsas.

### 7.1 Superfícies: tom, não borda

| Token                              | Escuro                            | Uso                                                      |
| ---------------------------------- | --------------------------------- | -------------------------------------------------------- |
| `--ink-0`                          | `#0B0B0D`                         | console lateral (o plano mais fundo)                     |
| `--bg`                             | `#121214`                         | página (área aberta, sem caixas)                         |
| `--ink-1`                          | `#18181B`                         | superfície rara: controles, teclas, painel de transporte |
| `--ink-2`                          | `#202024`                         | hover e item selecionado                                 |
| `--line` / `--line-strong`         | `#26262A` / `#36363C`             | divisórias finas: agrupam sem encaixotar                 |
| `--text` / `--text-2` / `--text-3` | `#ECE8DF` / `#A29E95` / `#6C6963` | marfim, dois níveis de apoio                             |
| `--accent`                         | `#EE8A3E`                         | laranja: ação, progresso, tecla acesa                    |
| `--sage` / `--slate` / `--rose`    | `#8DBF9B` / `#93AAC4` / `#E2867A` | dominada / declarada / erro                              |
| `--key-ivory` / `--felt`           | `#E7E1D2` / `#7A2E2A`             | teclas brancas / feltro vermelho do teclado              |

O tema claro segue a mesma lógica: papel `#F2EFE7` e tinta.

### 7.2 Tipografia

| Papel                   | Estilo                                                         |
| ----------------------- | -------------------------------------------------------------- |
| Destaque (título-herói) | Fraunces 400, 56–72 px, `opsz` alto, entrelinha 1,02           |
| Título de página        | Fraunces 400, 40–48 px                                         |
| Título de seção         | Fraunces 500, 22 px, **sem caixa alta e sem linha decorativa** |
| Subtítulo / lead        | Plex Sans 400, 18 px, `--text-2`                               |
| Corpo                   | Plex Sans 400, 16 px / 1,6                                     |
| Rótulo                  | Plex Sans 500, 13 px, **sentence case**, `--text-3`            |
| Dados                   | Plex Mono **só para números**: bpm, tempo, graus, contagens    |

Rótulos em mono maiúsculo deixam de existir. A hierarquia vem de tamanho, peso e cor.

### 7.3 Composição

- **Grade de 12 colunas** com variações por página, em vez de um `split` fixo.
- **Margem anotada:** números, contagens e rótulos de seção ficam na coluna da margem, como anotações de partitura, e não acima dos títulos.
- **Áreas abertas:** conteúdo direto no fundo, agrupado por divisórias e proximidade. Superfície (`--ink-1`) só onde há controle a manipular.
- **Régua de teclado:** o cabeçalho das páginas termina numa faixa de teclas, no lugar da linha divisória genérica.

### 7.4 Elementos musicais (assinatura)

| Elemento              | Substitui                  | Desenho                                                                                                                                |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Medidor de oitava** | barra de 5 segmentos       | Uma oitava de teclado em que as **5 teclas pretas são os 5 níveis**: acesas em laranja até o nível atual, a próxima parcialmente acesa |
| **Compassos**         | barra de progresso da aula | Uma parte por compasso, separados por barras de compasso, com barra dupla final; compasso concluído preenchido                         |
| **Régua de teclado**  | linha sob o cabeçalho      | Faixa fina com o padrão das teclas de uma oitava                                                                                       |
| **Feltro**            | moldura do teclado         | Linha vermelho-escura no topo dos diagramas, como o feltro de um piano                                                                 |
| **Tecla-botão**       | botão primário genérico    | Laranja, cantos de 3 px e uma sombra interna inferior que afunda 1 px ao pressionar                                                    |

### 7.5 Páginas-piloto

- **Início:** o próximo passo vira a manchete da página (título-herói com compassos e tecla-botão). Abaixo da régua de teclado, três colunas abertas de larguras diferentes: "A seguir" (lista numerada em serifa), "Trilhas" (medidores de oitava) e "Semana" (frase com números em destaque e o lembrete de backup como nota de margem).
- **Competência:** cabeçalho em duas partes (título e descrição | situação e ação, separados por um fio vertical). O corpo tem duas colunas: "Para dominar" (critérios numerados na margem, sem caixas) e "Caminho" (diagrama vertical: pré-requisitos → esta competência → o que libera), seguido de "Onde estudar".

## 8. Resultado da v2

**Comparação lado a lado.** Antes e depois de Início, Intervalos, Trilha, Aula e Prática, no tema escuro:

- **Cartões:** de cerca de 4 a 6 recipientes por página para **zero ou um**. Superfície só onde há controle: transporte da sessão, campos e opções do quiz.
- **Mono e caixa alta:** a caixa alta foi eliminada. O mono ficou restrito ao cronômetro, ao bpm e ao campo de andamento do metrônomo.
- **Composição:** cada página-chave tem uma estrutura própria:
  - Início: manchete com três colunas de pesos 5/4/3.
  - Competência: cabeçalho em duas partes e o diagrama "caminho".
  - Trilha: escada de níveis.
  - Aula: compassos e leitura.
- **Identidade musical:** medidor de oitava (barra lateral, Início, Trilha, Competência), compassos (Início, Aula), régua de teclado (todos os cabeçalhos) e feltro sobre os teclados dos exemplos.

**Teste do critério de sucesso**, sem o logotipo e o nome:

- O medidor de oitava, os compassos, a régua de teclado e a tecla laranja tornam o produto reconhecível como uma ferramenta de música.
- A manchete serifada sobre fundo contínuo afasta a leitura de "dashboard SaaS".

**Limites que permanecem:**

- Páginas de formulário (Configurações, Repertório) continuam mais convencionais por natureza.
- O tema claro foi verificado, mas a direção de arte foi desenhada primeiro para o escuro.
