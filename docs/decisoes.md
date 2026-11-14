# KeyPath — Registro de decisões

> Cada decisão tem um identificador estável para ser citada em outros documentos e em commits. Para mudar uma decisão, adicione uma nova entrada que substitui a anterior, em vez de apagar a antiga.

| # | Decisão | Motivo | Status |
|---|---|---|---|
| D01 | Uso pessoal: sem autenticação, múltiplos usuários ou backend | O público é uma única pessoa | Aceita |
| D02 | Aplicação web estática, desktop primeiro, utilizável no celular | O computador é o uso principal | Aceita |
| D03 | Conteúdo como arquivos de texto no Git, validados no build | Fica versionado, revisável e fácil de escrever com ajuda | Aceita |
| D04 | A **competência** é a unidade de progresso; o nível da trilha é **derivado** | O progresso é individual por assunto, com granularidade fina | Aceita |
| D05 | Pré-requisitos ligam competências; os pré-requisitos das aulas são derivados | Uma fonte só; quem já sabe não refaz o conteúdo introdutório | Aceita |
| D06 | Recomendar, nunca bloquear | Uso pessoal; bloquear só atrapalha | Aceita |
| D07 | Duas vias: **declarar** (conhecimento prévio) e **demonstrar** (cumprir os critérios sem a aula) | É o pedido explícito do usuário | Aceita |
| D08 | Os critérios de domínio pertencem à competência, são todos obrigatórios (E lógico) e usam os métodos quiz, autoavaliação, execução⏳ e revisão⏳ | Verificável; extensível para MIDI e revisão | Aceita |
| D09 | O conceito (Biblioteca) é a fonte única; as aulas incorporam os conceitos | Evita duplicar e divergir | Aceita |
| D10 | Exercícios são entidades independentes e reutilizáveis | Reuso em aulas, critérios e prática | Aceita |
| D11 | As aulas são profundas e divididas em checkpoints | Progresso parcial sem fragmentar o conteúdo | Aceita |
| D12 | São 6 trilhas; Repertório vai para a área de Prática; estilos são etiquetas | As trilhas viram eixos coerentes; o estilo é outra dimensão | Aceita |
| D13 | Só **fatos** são persistidos; o estado é derivado por funções puras | Mudar regras não exige migrar dados; MIDI e revisão entram como fatos novos | Aceita |
| D14 | Dados pessoais no IndexedDB, com backup exportável desde o MVP; anexos nunca no Git | Não há backend; os dados não podem se perder | Aceita |
| D15 | Notação canônica em letras nos arquivos; exibição configurável (padrão "Dó (C)"); cifra brasileira | Sem ambiguidade para o motor; formato familiar para o usuário | Aceita |
| D16 | A arquitetura prevê MIDI (`NoteInput`, `performance`), mas a integração não entra no MVP | Escopo controlado | Aceita |
| D17 | Cursos e módulos ficam no modelo, mas são implementados só na v0.2 | A fatia de Harmonia é organizada pelo grafo; o curso não tem estado próprio e entra depois sem migração | Proposta |
| D18 | Revisão espaçada adiada; as datas das tentativas já são registradas | Escopo controlado, sem perder dados para o futuro | Aceita |
| D19 | Estrutura em inglês (código, campos, chaves); conteúdo e interface em português; ids em português | Alinha os arquivos aos tipos TypeScript; o conteúdo fica legível | Proposta |
| D20 | Uma competência declarada vale como dominada para pré-requisitos e nível, mas aparece diferente na interface | Permite pular o básico sem perder a distinção | Proposta |
| D21 | No MVP, a importação de backup substitui todos os dados (sem mesclar) | Mais simples e suficiente para um usuário com um dispositivo principal | Proposta |
