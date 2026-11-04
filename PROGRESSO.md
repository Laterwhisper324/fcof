# Progresso do Projeto — Criador e Gerenciador de Fichas: Chamado de Cthulhu 7ª Edição (Anos 1920 / PT-BR)

## 1. O que já foi feito
1. **Extração e Leitura Integral das Regras do Livro Básico (`chamado-de-cthulhu---livro-basico-7-edicao.pdf`)**:
   - Extraídos e inspecionados os Capítulos 3 (Criação de Investigadores, Idade, Atributos Derivados, Ocupações, Finanças 1920), 4 (Lista Completa de Perícias e Especializações), 5 (Sistema de Regras, Níveis de Sucesso, Desastre, Dados de Bônus/Penalidade, Gasto de Sorte, Fase de Desenvolvimento), 8 (Sanidade) e Apêndices (Equipamentos 1920, Tabela XVII de Armas e Ficha Oficial dos Anos 1920 das págs. 50–51).
2. **Camada de Dados (`data/`)**:
   - `data/tabelas.js`: Atributos principais (`3d6*5` e `(2d6+6)*5`), Conjunto Fixo do Método de Tiro Rápido (`40, 50, 50, 50, 60, 60, 70, 80`), Compra de Pontos (`460`), Faixas de Idade (15–19 até 80–90), Tabela 1 de Dano Extra e Corpo (com progressão de +80 acima de 524), Tabela II de Dinheiro e Patrimônio dos Anos 1920, Tabelas Aleatórias de Antecedentes (1d10), Acessos de Loucura (1d10) e Lista de Equipamentos de 1920.
   - `data/pericias.js`: Todas as perícias da ficha oficial em PT-BR com valores base exatos, suporte a perícias especializáveis (`Arte e Ofício`, `Ciência`, `Língua (Outra)`, `Pilotar`, `Sobrevivência`, `Armas de Fogo`, `Lutar`), cálculo dinâmico para `Esquivar (DES/2)` e `Língua Nativa (EDU)`, bloqueio de pontos iniciais e marcação em `Mythos de Cthulhu` e `Nível de Crédito`, mais perícias incomuns opcionais.
   - `data/ocupacoes.js`: Todas as 28 ocupações das páginas 40–41 do Livro Básico + Ocupação Personalizada, com fórmulas exatas de pontos (`EDU × 4`, `EDU × 2 + DES × 2 ou FOR × 2`, `EDU × 2 + APA × 2`, etc.), faixas de Nível de Crédito e escolhas estruturadas.
   - `data/armas.js`: Tabela XVII completa de Armas da Década de 1920 (corpo a corpo, arremesso, pistolas, rifles, espingardas, submetralhadoras, metralhadoras e explosivos), incluindo `Desarmado` padrão (`1D3 + DX`).
3. **Motor de Regras Puras (`regras.js`)**:
   - Funções puras e testáveis: `calcularMetadeQuinto`, `calcularPVMax`, `calcularSanidade`, `calcularPontosMagiaMax`, `calcularEsquivaBase`, `calcularDanoExtraECorpo`, `obterRegraIdade`, `calcularMOV`, `resolverMelhoriaEDU`, `calcularPontosOcupacao`, `calcularPontosInteresse`, `calcularFinancas1920`, `avaliarSucesso` (com regra de Desastre 96–100 se alvo < 50 ou 100 se alvo >= 50), `combinarDadosD100` (Bônus/Penalidade), `calcularOpcoesGastoSorte`, `aplicarDanoCombate` (Lesão Grave, Inconsciente, Morrendo), `avaliarPerdaSanidade` (Insanidade Temporária e Indefinida), `resolverDesenvolvimentoPericia` e `formatarDanoArma`.
4. **Exportação PDF (`pdf-export.js`)**:
   - Suporte às duas abordagens: (a) inspeção e preenchimento de campos AcroForm da ficha PDF editável oficial via `pdf-lib` + geração direta de PDF de 2 páginas via `pdf-lib`; (b) folha de estilo `@media print` dedicada.
5. **Estilização Completa (`style.css`)**:
   - Tema Investigador Anos 1920 (papel envelhecido, molduras Art Déco, tipografia serifada e máquina de escrever, tons sépia e verde-escuro lovecraftiano) com **Modo Claro e Modo Escuro**, responsividade mobile, foco visível para acessibilidade e layout `@media print` de 2 páginas.

## 2. Divergências Identificadas e Marcadas com `// CONFERIR NO LIVRO`
- **`// CONFERIR NO LIVRO (pág. 41)` — Piloto (`data/ocupacoes.js`)**: Na edição brasileira impressa/PDF, o verbete *Piloto* repetiu por erro gráfico as perícias de *Parapsicólogo*. O sistema habilita tanto as perícias reais da 7ª Edição (Pilotar Aeronaves, Navegação, Consertos Elétricos/Mecânicos, Op. Maquinário, Astronomia) quanto as impressas na pág. 41.
- **`// CONFERIR NO LIVRO (pág. 41 vs pág. 50)` — Jornalista (`data/ocupacoes.js`)**: O verbete na pág. 41 repetiu parte de *Investigador de Polícia*, enquanto a ficha de exemplo de Harvey Walters (Jornalista, pág. 50) traz Fotografia, História, Língua Nativa, Usar Bibliotecas e Psicologia. Ambas foram habilitadas.
- **`// CONFERIR NO LIVRO (pág. 50 vs págs. 56 e 71)` — Natação (`data/pericias.js`)**: Na lista e texto do Capítulo 4 (págs. 56 e 71), a base de Natação é `20%`, mas na ficha impressa na pág. 50 consta `Natação (10%)`.
- **`// CONFERIR NO LIVRO (pág. 48)` — Limite Inicial de Perícia (`data/tabelas.js`)**: O teto de `75%` na criação é apresentado na pág. 48 como Regra Opcional.
- **`// CONFERIR NO LIVRO (pág. 401)` — Lança de Cavalaria (`data/armas.js`)**: Na tabela da pág. 401 consta dano `1D8+1` sem `+DX`.

## 3. Ponto Exato Onde Paramos e Próximos Passos Imediatos
Faltam apenas os 3 arquivos finais da camada de interface e testes para concluir 100% da entrega:
1. **`app.js`**: Estado da aplicação, persistência em `localStorage` (múltiplos investigadores), exportação/importação JSON, os 9 passos do Assistente de Criação (Wizard) com validação e rolagem/digitação em cada etapa, e a Ficha Viva de 2 páginas com rolador 1d100 (Bônus/Penalidade, Forçar Teste, Gasto de Sorte, Testes de Sanidade, Controle de PV/Lesão Grave/Insanidade e Fase de Desenvolvimento).
2. **`index.html`**: Estrutura HTML semântica e acessível em português do Brasil integrando `data/*.js`, `regras.js`, `pdf-export.js`, `app.js` e `style.css` (e CDN opcional do `pdf-lib`).
3. **`testes.html`**: Suíte de testes automatizados validando todas as funções puras de `regras.js` com os exemplos calculados à mão do livro (incluindo Harvey Walters das págs. 38 e 50–51).
