---
id: timbre.efeitos-e-ambiencia
title: Reverb, delay, chorus e outros efeitos
summary: Efeitos de espaço (reverb, delay), de modulação (chorus, phaser, flanger) e de saturação — o que cada um faz, como ajustar e quanto usar.
track: timbre
competencies: [timbre.efeitos]
styles: [worship, rock-alternativo, post-hardcore, pop]
estimatedMinutes: 75
why: O mesmo timbre pode soar íntimo ou gigantesco dependendo dos efeitos. Em worship e rock alternativo, reverb e delay bem ajustados são metade do som do teclado.
materials:
  - title: Ultimate Guide to Audio Effects
    url: https://www.izotope.com/en/learn/guide-to-audio-effects.html
    source: iZotope
    kind: article
    purpose: understand
    note: Efeitos de tempo, de modulação e de dinâmica, com exemplos.
  - title: Multi-effects Explained (Part 1)
    url: https://www.soundonsound.com/techniques/multi-effects-explained-part-1
    source: Sound On Sound
    kind: article
    purpose: understand
    note: Como funcionam os processadores de efeitos — reverb, delay e modulação.
  - title: Using Effects With Keyboards
    url: https://www.soundonsound.com/techniques/using-effects-keyboards
    source: Sound On Sound
    kind: article
    purpose: see
    note: Efeitos aplicados especificamente a teclados.
  - title: Todos os efeitos de áudio explicados
    url: https://emastered.com/pt/blog/audio-effects-explained
    source: eMastered (em português)
    kind: article
    purpose: understand
    language: pt
    note: Efeitos de tempo, modulação e dinâmica.
  - title: 'Delay vs. reverb: qual é a diferença?'
    url: https://emastered.com/pt/blog/delay-vs-reverb
    source: eMastered (em português)
    kind: article
    purpose: understand
    language: pt
    note: Quando usar cada um e como combinar.
songs:
  - title: Where the Streets Have No Name
    artist: U2
    learn:
      A introdução usa **delay de colcheia pontuada** sincronizado com o andamento — o padrão rítmico
      nasce do eco.
  - title: Shine On You Crazy Diamond
    artist: Pink Floyd
    learn: 'Teclados com **reverb longo** e notas sustentadas: o espaço como parte da música.'
---

Os efeitos se dividem em três grupos:

- **Espaço (tempo):** reverb e delay — onde o som acontece e como ele ecoa.
- **Modulação:** chorus, flanger e phaser — movimento e largura.
- **Saturação e dinâmica:** drive, distorção, compressão — intensidade e "peso".

::::checkpoint{id="fundamentos" title="Os efeitos e seus controles" stage="fundamentos"}

| Efeito           | O que faz                     | Controles principais              | Uso típico                       |
| ---------------- | ----------------------------- | --------------------------------- | -------------------------------- |
| Reverb           | simula o espaço               | tamanho (decay), mix, pré-delay   | pads, piano, vozes               |
| Delay            | repete o som em ecos          | tempo, repetições (feedback), mix | plucks, leads, ambiência         |
| Chorus           | engrossa e alarga             | velocidade, profundidade, mix     | pianos elétricos, strings, órgão |
| Phaser / flanger | "varredura" de frequências    | velocidade, profundidade          | Rhodes, clavinet, pads           |
| Drive            | satura, acrescenta harmônicos | ganho, tom                        | órgão no rock, synths agressivos |

**Delay no tempo da música.** A semínima dura **60 ÷ bpm** segundos. A colcheia, metade; a colcheia pontuada, 0,75 da semínima — o delay mais usado no worship e no rock alternativo.

**Tabela de delay por andamento** (em milissegundos)

| bpm | Semínima | Colcheia | Colcheia pontuada |
| --- | -------- | -------- | ----------------- |
| 60  | 1000     | 500      | 750               |
| 70  | 857      | 429      | 643               |
| 80  | 750      | 375      | 563               |
| 90  | 667      | 333      | 500               |
| 100 | 600      | 300      | 450               |
| 120 | 500      | 250      | 375               |
| 140 | 429      | 214      | 321               |

Fórmula: **semínima = 60 000 ÷ bpm** (ms). Colcheia = metade; colcheia pontuada = 3/4 da semínima. Muitos teclados fazem isso sozinhos com **tap tempo** ou sincronia com o metrônomo — procure no manual.

::::

::::checkpoint{id="visualizacao" title="Efeitos no laboratório" stage="visualizacao"}

Comece do **Pluck** e ligue os efeitos um por vez: primeiro o delay (repare nas repetições), depois o reverb, por fim o chorus.

::synth{preset="pluck"}

::exercise{id="timbre.efeitos.reconhecer"}

::::

::::checkpoint{id="aplicacao" title="Quanto usar" stage="aplicacao"}

- **Worship:** pads com reverb longo (4 s ou mais); piano com reverb médio; pluck ou lead com delay de colcheia pontuada.
- **Rock alternativo e post-hardcore:** delays longos e repetitivos nas introduções, reverb enorme em pads escuros, drive no órgão e nos synths.
- **Neo-soul e funk:** chorus e phaser no Rhodes, pouco reverb — o som fica perto.
- **Baixo:** quase sempre seco. Reverb no grave embola a banda.

:::common-mistake{title="Reverb resolvendo tudo"}
Reverb demais afasta o teclado e embola os acordes. Teste: se ao desligar o reverb o som "chega mais perto" e fica mais claro, provavelmente estava alto demais.
:::

::::

::::checkpoint{id="pratica" title="Prática guiada" stage="pratica"}

::exercise{id="timbre.efeitos.ajustar"}

::exercise{id="timbre.efeitos.no-palco"}

::::

::::checkpoint{id="revisao" title="Revisão" stage="revisao"}

- Espaço (reverb, delay), modulação (chorus, phaser, flanger), saturação (drive).
- Semínima = 60 ÷ bpm; colcheia pontuada = 0,75 da semínima.
- Baixo seco; pads com reverb longo; delays sincronizados com a música.

::::
