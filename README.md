# KeyPath

Plataforma pessoal de aprendizado de teclado e piano. Reúne três áreas:

- **aprendizado guiado:** trilhas, competências e aulas;
- **Biblioteca:** consulta livre de conceitos musicais;
- **Prática:** exercícios, sessões e repertório.

> Status: em desenvolvimento (MVP). Etapas 1–3 concluídas: estrutura, motor de teoria musical e catálogo de conteúdo.

## Documentação

- [Especificação do produto](docs/produto.md)
- [Modelo de dados](docs/modelo-de-dados.md)
- [Arquitetura técnica](docs/arquitetura.md)
- [Registro de decisões](docs/decisoes.md)
- [Plano da fatia de Harmonia](docs/plano-fatia-harmonia.md)

Conteúdo: veja [content/README.md](content/README.md) para o formato e os blocos especiais.

## Desenvolvimento

Requer Node 22 ou superior.

| Comando                 | O que faz                                           |
| ----------------------- | --------------------------------------------------- |
| `npm install`           | Instala as dependências                             |
| `npm run dev`           | Abre o app em modo de desenvolvimento               |
| `npm run content:check` | Valida a pasta `content/` e lista erros e avisos    |
| `npm test`              | Roda os testes                                      |
| `npm run check`         | Lint, formatação, tipos e testes (o mesmo que a CI) |
| `npm run build`         | Gera o site estático em `dist/`                     |
| `npm run format`        | Formata todos os arquivos                           |
