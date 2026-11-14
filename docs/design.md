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
