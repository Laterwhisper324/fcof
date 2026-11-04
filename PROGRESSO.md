# Progresso do Projeto — Criador e Gerenciador de Fichas: Chamado de Cthulhu 7ª Edição (Anos 1920 / PT-BR)

## 1. O que já foi feito (100% Concluído)
1. **Extração e Leitura Integral das Regras do Livro Básico (`chamado-de-cthulhu---livro-basico-7-edicao.pdf`)**:
   - Extraídos e inspecionados os Capítulos 3 (Criação de Investigadores, Idade, Atributos Derivados, Ocupações, Finanças 1920), 4 (Lista Completa de Perícias e Especializações), 5 (Sistema de Regras, Níveis de Sucesso, Desastre, Dados de Bônus/Penalidade, Gasto de Sorte, Fase de Desenvolvimento), 8 (Sanidade) e Apêndices (Equipamentos 1920, Tabela XVII de Armas e Ficha Oficial dos Anos 1920 das págs. 50–51).
2. **Camada de Dados (`data/`)**:
   - `data/tabelas.js`: Atributos principais (`3d6*5` e `(2d6+6)*5`), Conjunto Fixo do Método de Tiro Rápido (`40, 50, 50, 50, 60, 60, 70, 80`), Compra de Pontos (`460`), Faixas de Idade (15–19 até 80–90), Tabela 1 de Dano Extra e Corpo (com progressão de +80 acima de 524), Tabela II de Dinheiro e Patrimônio dos Anos 1920, Tabelas Aleatórias de Antecedentes (1d10), Acessos de Loucura (1d10) e Lista de Equipamentos de 1920.
   - `data/pericias.js`: Todas as perícias da ficha oficial em PT-BR com valores base exatos, suporte a perícias especializáveis (`Arte e Ofício`, `Ciência`, `Língua (Outra)`, `Pilotar`, `Sobrevivência`, `Armas de Fogo`, `Lutar`), cálculo dinâmico para `Esquivar (DES/2)` e `Língua Nativa (EDU)`, bloqueio de pontos iniciais e marcação em `Mythos de Cthulhu` e `Nível de Crédito`, mais perícias incomuns opcionais.
   - `data/ocupacoes.js`: Todas as 28 ocupações das páginas 40–41 do Livro Básico + Ocupação Personalizada, com fórmulas exatas de pontos (`EDU × 4`, `EDU × 2 + DES × 2 ou FOR × 2`, `EDU × 2 + APA × 2`, etc.), faixas de Nível de Crédito e escolhas estruturadas.
   - `data/armas.js`: Tabela XVII completa de Armas da Década de 1920 (corpo a corpo, arremesso, pistolas, rifles, espingardas, submetralhadoras, metralhadoras e explosivos), incluindo `Desarmado` padrão (`1D3 + DX`).
3. **Motor de Regras Puras (`regras.js`)**:
   - Funções puras e testáveis: `calcularMetadeQuinto`, `calcularPVMax`, `calcularSanidade`, `calcularPontosMagiaMax`, `calcularEsquivaBase`, `calcularDanoExtraECorpo`, `obterRegraIdade`, `calcularMOV`, `resolverMelhoriaEDU`, `calcularPontosOcupacao`, `calcularPontosInteresse`, `calcularFinancas1920`, `avaliarSucesso` (com regra de Desastre 96–100 se alvo < 50 ou 100 se alvo >= 50), `combinarDadosD100` (Bônus/Penalidade), `calcularOpcoesGastoSorte`, `aplicarDanoCombate` (Lesão Grave, Inconsciente, Morrendo), `avaliarPerdaSanidade` (Insanidade Temporária e Indefinida), `resolverDesenvolvimentoPericia` e `formatarDanoArma`.
4. **Exportação na Ficha PDF Oficial Editável (`pdf-export.js`, `data/ficha-oficial-template.js`, `data/ficha-oficial-1920.pdf`, `vendor/pdf-lib.min.js`)**:
   - Exportação com **1 clique** diretamente no formato exato do PDF oficial de 2 páginas (`FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf`), funcionando 100% offline mesmo via `file://`.
   - Mapeamento 1-para-1 de todos os **360 campos AcroForm** da Página 1 (Identidade, Características `str`..`edu` com metades e quintos, `MOV`, `MaxHP`, `Sanity_Start`, `Sanity_Max`, `LuckTotal`, checkboxes de Lesão Grave/Insanidade, todas as Perícias das 4 colunas incluindo campos não padronizados como `abranco14a` para *Usar Bibliotecas*, especializações de Arte/Ofício, Ciência, Línguas, Pilotar e Sobrevivência, e tabela de Armas/Combate) e da Página 2 (`Texto1`..`Texto39` para Antecedentes, Equipamentos em 2 colunas, Nível de Gastos/Dinheiro/Patrimônio e os 8 quadros de Companheiros Investigadores).
   - Suporte tanto à exportação com **campos AcroForm editáveis preservados** quanto à versão **achatada (pronta para impressão)**, além de `@media print` e upload de arquivo `.pdf` externo.
5. **Redesign Editorial Completo via `taste-skill` (`Leonxlnx/taste-skill`)**:
   - Instalada e integrada a skill anti-slop `design-taste-frontend` (`.agents/skills/design-taste-frontend`).
   - **Eliminação de 100% dos tells de IA**: removidos mais de 130 emojis soltos em botões e cabeçalhos, eliminados gradientes radiais/lineares artificiais, sombras espúrias em repouso e monospace descontextualizado.
   - **Novo Design System Tonal "Dossiê de Miskatonic (Arkham 1926)"**:
     - Modo Claro inspirado em papel linho de arquivo histórico (`#f4efe6`, `#eae3d2`, `#faf7f2`), tinta profunda (`#191816`), verde abissal (`#1a4233`) e latão envelhecido (`#966f33`).
     - Modo Escuro inspirado em gabinete noturno de carvalho e lâmpada de gás (`#101214`, `#171b1e`, `#20262b`).
     - Tipografia editorial autêntica com `Instrument Serif` para títulos, `Instrument Sans` para interface e `tabular-nums` obrigatório para todos os números, atributos e perícias.
     - Linter oficial da skill (`scripts/lint.mjs`) verificado e passando com **0 FAIL**.
6. **Arquitetura de Componentes Angular & Progressive Disclosure**:
   - Módulo `coc7eApp` com `CocStateService`, `<coc-header>`, `<coc-wizard>` (9 passos), `<coc-live-sheet>` (com 6 abas focadas e HUD compacto de vitais), `<coc-roll-toast>`, `<coc-dice-drawer>` (gaveta deslizante de rolagem 1D100) e `<coc-modals>`.
7. **Suíte de Testes Automatizados (`testes.html`)**:
   - **66 asserções matemáticas e de mapeamento PDF oficial** executadas e passando com 100% de sucesso.

## 2. Divergências Identificadas e Marcadas com `// CONFERIR NO LIVRO`
- **`// CONFERIR NO LIVRO (pág. 41)` — Piloto (`data/ocupacoes.js`)**: Na edição brasileira impressa/PDF, o verbete *Piloto* repetiu por erro gráfico as perícias de *Parapsicólogo*. O sistema habilita tanto as perícias reais da 7ª Edição (Pilotar Aeronaves, Navegação, Consertos Elétricos/Mecânicos, Op. Maquinário, Astronomia) quanto as impressas na pág. 41.
- **`// CONFERIR NO LIVRO (pág. 41 vs pág. 50)` — Jornalista (`data/ocupacoes.js`)**: O verbete na pág. 41 repetiu parte de *Investigador de Polícia*, enquanto a ficha de exemplo de Harvey Walters (Jornalista, pág. 50) traz Fotografia, História, Língua Nativa, Usar Bibliotecas e Psicologia. Ambas foram habilitadas.
- **`// CONFERIR NO LIVRO (pág. 50 vs págs. 56 e 71)` — Natação (`data/pericias.js`)**: Na lista e texto do Capítulo 4 (págs. 56 e 71), a base de Natação é `20%`, mas na ficha impressa na pág. 50 consta `Natação (10%)`.
- **`// CONFERIR NO LIVRO (pág. 48)` — Limite Inicial de Perícia (`data/tabelas.js`)**: O teto de `75%` na criação é apresentado na pág. 48 como Regra Opcional.
- **`// CONFERIR NO LIVRO (pág. 401)` — Lança de Cavalaria (`data/armas.js`)**: Na tabela da pág. 401 consta dano `1D8+1` sem `+DX`.

## 3. Status Final
Todos os arquivos da arquitetura e design estão implementados, integrados, com 0 falhas no linter de design e verificados com 66 testes automatizados passando.
