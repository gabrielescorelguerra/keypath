---
id: timbre.camadas-e-divisao
title: Camadas (layer) e divisão do teclado (split)
summary: Sobrepor timbres e dividir o teclado — baixo e piano, pad e piano, piano e strings — com volumes, regiões e efeitos equilibrados para tocar ao vivo.
track: timbre
competencies: [timbre.layer-split]
styles: [worship, pop, rock-alternativo]
estimatedMinutes: 60
why: Ao vivo, um tecladista muitas vezes faz o trabalho de dois — baixo e harmonia, ou piano e cordas. Layer e split são as ferramentas para isso, e só funcionam bem com equilíbrio de volume e de região.
materials:
  - title: 'Mastering YC: Splits and Layers'
    url: https://yamahasynth.com/learn/yc-series/mastering-yc61-splits-and-layers/
    source: Yamaha
    kind: docs
    purpose: see
    note: Como montar splits e layers num teclado de palco, com dicas de equilíbrio.
  - title: 'Basic Splits and Layers — Mastering CP'
    url: https://yamahasynth.com/learn/cp-series-stage-pianos/basic-splits-and-layers-mastering-cp/
    source: Yamaha
    kind: docs
    purpose: see
    note: O split mais usado (baixo à esquerda, piano à direita) e por que deixar o baixo sem reverb.
  - title: MainStage User Guide — key ranges and split points
    url: https://support.apple.com/en-in/guide/mainstage/mstgba9a04f8/mac
    source: Apple
    kind: docs
    purpose: practice
    note: Divisão do teclado e pontos de split no MainStage, para quem toca com instrumentos virtuais.
---

- **Layer (camada):** dois ou mais timbres soando juntos no teclado inteiro. Ex.: piano + strings.
- **Split (divisão):** timbres diferentes em regiões diferentes, separadas por um **ponto de divisão**. Ex.: baixo na esquerda, piano na direita.

::::checkpoint{id="fundamentos" title="Equilíbrio de volume, região e efeitos" stage="fundamentos"}

- **Volume:** no layer, uma camada é a principal e a outra dá corpo — normalmente mais baixa. No split, o baixo precisa ser tão firme quanto o baixista seria.
- **Região:** mantenha o **mesmo ponto de divisão** em todas as músicas (Dó3 é uma escolha comum), para a mão não precisar se readaptar.
- **Efeitos:** baixo seco; pad e piano com reverb. No layer, evite somar dois reverbs grandes.

**Por que algumas camadas embolam**

Cada timbre ocupa uma faixa de frequências. Quando dois timbres ocupam a **mesma faixa**, eles se mascaram; quando ocupam faixas diferentes, se completam.

| Faixa       | Frequências (aprox.) | Quem mora ali                           |
| ----------- | -------------------- | --------------------------------------- |
| Grave       | 40–250 Hz            | baixo, mão esquerda do piano, bumbo     |
| Médio-grave | 250–500 Hz           | corpo do piano e dos pads (onde embola) |
| Médio       | 500 Hz–2 kHz         | voz, guitarra, ataque do piano          |
| Agudo       | 2–8 kHz              | brilho, strings agudas, pratos          |

Dicas práticas: no layer piano + pad, **tire grave do pad** (filtro passa-alta ou região mais aguda); no split, deixe o baixo **seco e mono**; numa banda com guitarra, evite pads cheios entre Dó3 e Dó4 — é a região da guitarra.

::::

::::checkpoint{id="visualizacao" title="Split e layer no laboratório" stage="visualizacao"}

**Split:** baixo abaixo de Dó3, timbre editável (pad) acima.

::synth{preset="pad" split="bass"}

**Layer:** strings soando junto com o timbre editável (pad).

::synth{preset="pad" layer="strings"}

::exercise{id="timbre.layer-split.reconhecer"}

::::

::::checkpoint{id="aplicacao" title="Combinações usadas ao vivo" stage="aplicacao"}

| Combinação                               | Tipo              | Quando usar                                 |
| ---------------------------------------- | ----------------- | ------------------------------------------- |
| Baixo + piano                            | split             | banda sem baixista                          |
| Pad + piano                              | layer (pad baixo) | worship, baladas                            |
| Piano + strings                          | layer             | refrões, finais                             |
| Pad (esquerda) + lead ou piano (direita) | split             | introduções, momentos de oração com melodia |

::::

::::checkpoint{id="pratica" title="Prática guiada" stage="pratica"}

::exercise{id="timbre.layer-split.tocar"}

::exercise{id="timbre.layer-split.setlist"}

::::

::::checkpoint{id="revisao" title="Revisão" stage="revisao"}

- Layer = timbres juntos; split = timbres em regiões.
- Uma camada principal e outra de apoio; ponto de divisão fixo; baixo seco.
- Salve as combinações como registros e ensaie as trocas.

::::
