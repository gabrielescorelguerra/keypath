---
id: timbre.osciladores-filtro-adsr-e-lfo
title: Osciladores, filtro, ADSR e LFO
summary: Como um sintetizador cria som — da forma de onda ao envelope — com um laboratório para ouvir cada parâmetro e montar pads, plucks e leads.
track: timbre
competencies: [timbre.sintese-basica]
styles: [worship, rock-alternativo, post-hardcore, pop]
estimatedMinutes: 90
why: Quase todo timbre de teclado moderno — o pad do louvor, o lead do rock, o pluck do pop — é feito dos mesmos quatro blocos. Entendê-los é o que permite ajustar um timbre ao vivo em vez de ficar procurando presets.
materials:
  - title: Learning Synths
    url: https://learningsynths.ableton.com/
    source: Ableton
    kind: interactive
    purpose: understand
    note: Curso gratuito no navegador, do básico (volume e altura) a osciladores, filtros, envelopes e LFOs, com um sintetizador para mexer.
  - title: The Beginner's Guide to Synths for Music Production
    url: https://www.izotope.com/en/learn/the-beginners-guide-to-synths-for-music-production.html
    source: iZotope
    kind: article
    purpose: understand
    note: Visão geral dos tipos de síntese e dos blocos de um sintetizador.
  - title: ADSR explained
    url: https://blog.native-instruments.com/adsr-explained/
    source: Native Instruments
    kind: article
    purpose: understand
    note: Os quatro estágios do envelope, com exemplos de pads e plucks.
  - title: 'Learning Synthesis: Envelopes'
    url: https://perfectcircuit.com/signal/learning-synthesis-envelopes-1
    source: Perfect Circuit
    kind: article
    purpose: see
    note: Envelopes aplicados não só ao volume, mas também ao filtro.
  - title: 'Subtractor Synthesizer: Envelopes'
    url: https://docs.propellerheads.se/reason9/Subtractor.30.4.html
    source: Reason (manual)
    kind: docs
    purpose: practice
    note: Exemplo de como um manual de sintetizador descreve os envelopes — útil para achar os mesmos controles no seu.
songs:
  - title: Jump
    artist: Van Halen
    learn:
      O riff é um **brass de sintetizador** (dente de serra, ataque rápido, filtro aberto) — o timbre
      que define a música.
  - title: Lucky Man (solo final)
    artist: Emerson, Lake & Palmer
    learn: 'Solo de **Minimoog** com portamento (glide) e filtro: o lead monofônico clássico.'
  - title: Blinding Lights
    artist: The Weeknd
    learn:
      'Lead de sintetizador oitentista com ataque curto e muito brilho: compare com o pad que sustenta
      a harmonia.'
---

Um sintetizador subtrativo funciona como uma pequena linha de montagem:

1. o **oscilador** gera uma onda rica em harmônicos;
2. o **filtro** remove parte desses harmônicos — por isso "subtrativa";
3. o **envelope** molda o volume no tempo: como o som começa, se mantém e termina;
4. o **LFO** faz algum desses parâmetros oscilar devagar, dando movimento.

Nesta aula você vai ouvir cada bloco isoladamente no laboratório e montar três timbres básicos.

::::checkpoint{id="fundamentos" title="Os quatro blocos" stage="fundamentos"}

**Oscilador — a matéria-prima.** A forma de onda define quais harmônicos existem:

| Onda           | Harmônicos       | Som                                              |
| -------------- | ---------------- | ------------------------------------------------ |
| Senoide        | só a fundamental | puro, redondo, "flauta"                          |
| Triangular     | poucos, fracos   | suave                                            |
| Quadrada       | só os ímpares    | oco, "clarinete", videogame                      |
| Dente de serra | todos            | brilhante, cheio — base de pads, strings e leads |

**Filtro — o escultor.** O passa-baixa deixa passar o grave e corta o agudo a partir da frequência de **corte**. Baixar o corte escurece o som. A **ressonância** reforça a região do corte e dá o "pico" típico dos synths.

**Envelope (ADSR) — o tempo.**

- **Attack:** quanto tempo o som leva para chegar ao máximo.
- **Decay:** quanto tempo leva para cair até o nível de sustentação.
- **Sustain:** o **nível** mantido enquanto a tecla está pressionada.
- **Release:** quanto tempo o som leva para sumir depois que você solta a tecla.

**LFO — o movimento.** Um oscilador lento demais para ser ouvido como nota (normalmente abaixo de 20 Hz). Ligado ao filtro, faz o som "respirar"; à afinação, faz vibrato; ao volume, faz tremolo.

**As formas de onda e seus harmônicos**

Todo som "musical" é uma soma de frequências: a **fundamental** (a nota) e os **harmônicos** (múltiplos dela). A forma de onda decide quais harmônicos existem — e o filtro decide quais deles chegam ao ouvido.

| Onda           | Harmônicos         | Som                            | Uso típico                  |
| -------------- | ------------------ | ------------------------------ | --------------------------- |
| Senoide        | só a fundamental   | puro, \"flauta\"               | sub-bass, sinos suaves      |
| Triângulo      | ímpares, fracos    | suave, oco                     | leads doces                 |
| Quadrada       | só ímpares, fortes | oco, \"clarinete\", videogame  | leads, órgãos simples       |
| Dente de serra | todos              | brilhante, \"metais e cordas\" | pads, brass, strings, leads |

Por isso a dente de serra é o ponto de partida da maioria dos timbres: ela tem todos os harmônicos, e o filtro vai tirando o que sobra. É a síntese **subtrativa**.

::::

::::checkpoint{id="visualizacao" title="O laboratório" stage="visualizacao"}

Segure uma tecla e mexa em **um controle por vez**. Siga este roteiro:

1. Escolha **Órgão** e troque a forma de onda: senoide → triangular → quadrada → dente de serra.
2. Com a dente de serra, desça o **corte** devagar até o som ficar abafado. Depois suba a **ressonância**.
3. Aumente o **ataque** para 1 s: o som passa a "entrar" devagar. Aumente o **release** e solte a tecla.
4. Zere a **sustentação** e ajuste a **queda**: o som vira uma batida curta — um pluck.
5. Ligue o **LFO** com velocidade 0,3 Hz e profundidade 40%: o filtro abre e fecha sozinho.

::synth{preset="organ"}

:::note{title="O desenho do envelope"}
A curva laranja mostra o envelope: subida (ataque), descida (queda), platô (sustentação) e a cauda depois de soltar (release). Compare a curva do **Pad** com a do **Pluck**.
:::

::exercise{id="timbre.sintese.quiz"}

::::

::::checkpoint{id="aplicacao" title="Pads, plucks e leads" stage="aplicacao"}

Os timbres prontos do laboratório mostram receitas típicas — repare no que muda entre eles:

| Timbre  | Onda                           | Filtro                        | Envelope                            | LFO              |
| ------- | ------------------------------ | ----------------------------- | ----------------------------------- | ---------------- |
| Pad     | dente de serra, desafinada     | corte médio                   | ataque lento, release longo         | lento, no filtro |
| Pluck   | dente de serra                 | corte médio, ressonância      | ataque instantâneo, sem sustentação | —                |
| Lead    | quadrada                       | corte alto                    | ataque curto, sustentação alta      | rápido e sutil   |
| Strings | dente de serra, bem desafinada | corte médio-alto              | ataque médio                        | vibrato leve     |
| Órgão   | quadrada                       | corte médio                   | liga e desliga na hora              | leve             |
| Baixo   | dente de serra                 | corte baixo, ressonância alta | queda curta                         | —                |

**No louvor:** o pad é a "cama" que preenche o espaço entre a voz e a banda — ataque e release longos para que as trocas de acorde fiquem suaves.

**No rock alternativo e no post-hardcore:** leads de onda quadrada ou dente de serra dobrando a guitarra, e pads escuros com o filtro fechado que se abrem no refrão.

::synth{preset="pad"}

::::

::::checkpoint{id="pratica" title="Prática guiada" stage="pratica"}

**1. Execução — três timbres a partir do mesmo ponto.**

::exercise{id="timbre.sintese.recriar"}

**2. Aplicação — no seu instrumento.**

::exercise{id="timbre.sintese.no-seu-teclado"}

**3. Criatividade — um timbre assinatura.**

::exercise{id="timbre.sintese.assinatura"}

::::

::::checkpoint{id="revisao" title="Revisão" stage="revisao"}

**Resumo**

- Oscilador (matéria-prima) → filtro (escultor) → amplificador com envelope (tempo) + LFO (movimento).
- Dente de serra = todos os harmônicos; senoide = nenhum.
- Corte baixo = som escuro; ressonância = pico no corte.
- ADSR: três tempos (attack, decay, release) e um nível (sustain).
- Pad: ataque lento + release longo. Pluck: sem sustentação. Lead: ataque curto + sustentação alta.

**Pequenos desafios**

1. Só ouvindo um timbre do seu teclado, descreva o envelope dele (ataque rápido ou lento? tem sustentação?).
2. No laboratório, transforme o Pluck em Pad mexendo só no envelope. O que mais você precisou mudar?
3. Encontre no seu teclado o controle que abre o filtro ao vivo (knob, slider ou roda de modulação).

::::
