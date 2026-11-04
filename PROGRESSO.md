# Progresso do Projeto — Criador e Gerenciador de Fichas: Chamado de Cthulhu 7ª Edição (Anos 1920 / PT-BR)

## 1. O que já foi feito (100% Concluído)
1. **Extração e Leitura Integral das Regras do Livro Básico (`chamado-de-cthulhu---livro-basico-7-edicao.pdf`)**:
   - Extraídos e inspecionados os Capítulos 3 (Criação de Investigadores, Idade, Atributos Derivados, Ocupações, Finanças 1920), 4 (Lista Completa de Perícias e Especializações), 5 (Sistema de Regras, Níveis de Sucesso, Desastre, Dados de Bônus/Penalidade, Gasto de Sorte, Fase de Desenvolvimento), 8 (Sanidade) e Apêndices (Equipamentos 1920, Tabela XVII de Armas e Ficha Oficial dos Anos 1920 das págs. 50–51).
2. **Camada de Dados (`data/`)**:
   - `data/tabelas.js`: Atributos principais (`3d6*5` e `(2d6+6)*5` com `tipoDado` padronizado), Conjunto Fixo do Método de Tiro Rápido (`40, 50, 50, 50, 60, 60, 70, 80`), Compra de Pontos (`460`), Faixas de Idade (15–19 até 80–90 com propriedades canônicas e aliases `testesMelhoriaEDU` e `duplaSorte`), Tabela 1 de Dano Extra e Corpo (com progressão de +80 acima de 524), Tabela II de Dinheiro e Patrimônio dos Anos 1920, Tabelas Aleatórias de Antecedentes (1d10 com aliases diretos `ANTECEDENTES_IDEOLOGIA`, `ANTECEDENTES_PESSOAS_QUEM`, `ANTECEDENTES_PESSOAS_PORQUE`, `ANTECEDENTES_LOCAIS`, `ANTECEDENTES_PERTENCES`, `ANTECEDENTES_CARACTERISTICAS`), Acessos de Loucura (1d10) e Lista de Equipamentos de 1920.
   - `data/pericias.js`: Todas as perícias da ficha oficial em PT-BR com valores base exatos, suporte a perícias especializáveis (`Arte e Ofício`, `Ciência`, `Língua (Outra)`, `Pilotar`, `Sobrevivência`, `Armas de Fogo`, `Lutar`), cálculo dinâmico para `Esquivar (DES/2)` e `Língua Nativa (EDU)`, bloqueio de pontos iniciais e marcação em `Mythos de Cthulhu` e `Nível de Crédito`, mais perícias incomuns opcionais.
   - `data/ocupacoes.js`: Todas as 28 ocupações das páginas 40–41 do Livro Básico + Ocupação Personalizada, com fórmulas exatas de pontos (`EDU × 4`, `EDU × 2 + DES × 2 ou FOR × 2`, `EDU × 2 + APA × 2`, etc.), faixas de Nível de Crédito e escolhas estruturadas.
   - `data/armas.js`: Tabela XVII completa de Armas da Década de 1920 (corpo a corpo, arremesso, pistolas, rifles, espingardas, submetralhadoras, metralhadoras e explosivos), incluindo `Desarmado` padrão (`1D3 + DX`).
3. **Motor de Regras Puras e Ponte Frontend-Backend (`regras.js`)**:
   - Funções puras canônicas e testáveis: `calcularMetadeQuinto`, `calcularPVMax`, `calcularSanidade`, `calcularPontosMagiaMax`, `calcularEsquivaBase`, `calcularDanoExtraECorpo`, `obterRegraIdade`, `calcularMOV`, `resolverMelhoriaEDU`, `calcularPontosOcupacao`, `calcularPontosInteresse`, `calcularFinancas1920`, `avaliarSucesso` (com regra de Desastre 96–100 se alvo < 50 ou 100 se alvo >= 50, enriquecido com `nivel`, `classeCss`, `dificil`, `extremo`), `combinarDadosD100` (Bônus/Penalidade), `calcularOpcoesGastoSorte`, `aplicarDanoCombate` (Lesão Grave, Inconsciente, Morrendo), `avaliarPerdaSanidade` (Insanidade Temporária e Indefinida), `resolverDesenvolvimentoPericia` e `formatarDanoArma`.
   - **Ponte Total com o Frontend (`app.js`)**: implementados wrappers e métodos diretos correspondentes a 100% das chamadas da aplicação:
     - `calcularPVMaximo(con, tam)`
     - `calcularSanidadeInicial(pod)`
     - `calcularSanidadeMaxima(mythos)`
     - `calcularPMMaximo(pod)`
     - `calcularPontosInteressePessoal(int)`
     - `rolarDados(qtd, lados, mod)`
     - `rolarAtributo3D6()`
     - `rolarAtributo2D6Mais6()`
     - `rolarConjuntoAtributos(metodo)`
     - `executarTestesMelhoriaEDU(eduAtual, qtd)`
     - `rolarSorteInicial(duplaSorte)`
     - `sortearItemTabela(tabela)`
     - `rolar1d100ComBonusPenalidade(dadosBonusPenalidade)`
     - `aplicarDanoPV(pvAtual, pvMax, dano, lesaoGrave)`
     - `aplicarPerdaSanidade(sanAtual, perda, perdaDia, sanInicioDia)`
     - `executarDesenvolvimentoPericia(totalAtual)`
4. **Revisão e Estilização Completa (`style.css` e `index.html`)**:
   - Mapeamento e estilização de todas as 44 classes utilizadas nos templates de `app.js` (HUD compacto de vitais `.hud-status-bar`, `.hud-vital-pill`, `.hud-mini-btn`, acordeão de lore `.lore-accordion-grid`, `.lore-card`, `.lore-card-preview`, grade de perícias em foco `.focus-skills-grid`, `.focus-skill-card`, `.is-occ`, `.filter-chip`, barra de navegação da ficha viva `.sheet-toolbar`, `.segmented-control`, `.segmented-btn`, toast flutuante `.floating-roll-toast`, gaveta lateral de dados `.dice-drawer`, `.print-only-sheet` para impressão).
   - Verificado com o linter `taste-skill` com **0 FAIL**.
5. **Exportação na Ficha PDF Oficial Editável (`pdf-export.js`, `data/ficha-oficial-template.js`, `data/ficha-oficial-1920.pdf`, `vendor/pdf-lib.min.js`)**:
   - Exportação com **1 clique** diretamente no formato exato do PDF oficial de 2 páginas (`FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf`), funcionando 100% offline mesmo via `file://`.
   - Mapeamento 1-para-1 de todos os **360 campos AcroForm** da Página 1 e Página 2.
6. **Suíte de Testes e Integração (`testes.html` e `tools/test-integration.js`)**:
   - **66 asserções matemáticas e de regras do livro** executadas em `testes.html` com 100% de aprovação (0 falhas).
   - Suíte de integração ponta a ponta (`tools/test-integration.js`) validando 25 métodos e propriedades entre backend e frontend.

## 2. Divergências Identificadas e Marcadas com `// CONFERIR NO LIVRO`
- **`// CONFERIR NO LIVRO (pág. 41)` — Piloto (`data/ocupacoes.js`)**: Na edição brasileira impressa/PDF, o verbete *Piloto* repetiu por erro gráfico as perícias de *Parapsicólogo*. O sistema habilita tanto as perícias reais da 7ª Edição (Pilotar Aeronaves, Navegação, Consertos Elétricos/Mecânicos, Op. Maquinário, Astronomia) quanto as impressas na pág. 41.
- **`// CONFERIR NO LIVRO (pág. 41 vs pág. 50)` — Jornalista (`data/ocupacoes.js`)**: O verbete na pág. 41 repetiu parte de *Investigador de Polícia*, enquanto a ficha de exemplo de Harvey Walters (Jornalista, pág. 50) traz Fotografia, História, Língua Nativa, Usar Bibliotecas e Psicologia. Ambas foram habilitadas.
- **`// CONFERIR NO LIVRO (pág. 50 vs págs. 56 e 71)` — Natação (`data/pericias.js`)**: Na lista e texto do Capítulo 4 (págs. 56 e 71), a base de Natação é `20%`, mas na ficha impressa na pág. 50 consta `Natação (10%)`.
- **`// CONFERIR NO LIVRO (pág. 48)` — Limite Inicial de Perícia (`data/tabelas.js`)**: O teto de `75%` na criação é apresentado na pág. 48 como Regra Opcional.
- **`// CONFERIR NO LIVRO (pág. 401)` — Lança de Cavalaria (`data/armas.js`)**: Na tabela da pág. 401 consta dano `1D8+1` sem `+DX`.

## 3. Status Final
Todos os arquivos da arquitetura (HTML, CSS, JS frontend e backend de regras/dados) estão 100% revisados, linkados e sincronizados, sem métodos ou classes faltantes, aprovados no linter e passando em todas as suítes de teste automatizado.
