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

## 3. Status da Versão Estável
Todos os arquivos da arquitetura legada e dados (HTML, CSS, JS frontend e backend de regras/dados) estão 100% revisados, linkados e sincronizados, sem métodos ou classes faltantes, aprovados no linter e passando em todas as suítes de teste automatizado.

## 4. Refinamento e Modernização Angular v22 (Branch: `refactor/angular-modern-refinamentos`)

Implementadas com sucesso todas as 8 tarefas de refinamento solicitadas pelo usuário, mantendo 100% da fidelidade estética Arkham 1920 (0 FAIL no taste-skill) e 100% de adesão às regras do Livro Básico 7ª Edição:

1. **Características**:
   - Cada botão de rolagem possui rótulo visível claro, `aria-label` descritivo, ícone de dado `🎲` e tooltip indicativo.
   - Exibição explícita da fórmula canônica de rolagem para cada atributo: `3d6×5` para FOR, CON, DES, APA, POD e `(2d6+6)×5` para TAM, INT, EDU.

2. **Idade e Sorte**:
   - Unificação completa dos 3 blocos (modificadores de EDU, penalidades físicas/aparência e rolagem de Sorte) em um card visual coeso, sem sub-abas fragmentadas.
   - Aplicação reativa das regras de idade e preservação estrita da regra de juventude (15 a 19 anos rola Sorte 3d6×5 duas vezes e escolhe o maior).

3. **Derivados (Taxa de Movimento - MOV)**:
   - Corrigido o bug histórico onde `R.calcularMOV` retornava um objeto em vez de número, gerando `[object Object]` ou `NaN`.
   - Implementação estrita das regras das págs. 33–34:
     - Se DES < TAM e FOR < TAM: MOV = 7
     - Se DES ≥ TAM ou FOR ≥ TAM (ou todos iguais): MOV = 8
     - Se DES > TAM e FOR > TAM: MOV = 9
     - Penalidade por década de idade: 40–49 (-1), 50–59 (-2), 60–69 (-3), 70–79 (-4), 80+ (-5).
   - Recálculo reativo em tempo real via Signals sempre que FOR, DES, TAM ou idade mudam.

4. **Ocupação**:
   - Estilização de checkboxes personalizados vintage no padrão visual 1920s (`.custom-checkbox-input`, `.custom-checkbox-label`).
   - Scrollbar fina temática (`.custom-scrollbar`) com cores integradas às variáveis do tema.
   - Limite estrito de 8 perícias de ocupação (incluindo Nível de Crédito), desabilitando os checkboxes restantes ao atingir o limite e exibindo o contador visual `X/8`.

5. **Perícias**:
   - Controle estrito de pontos de ocupação (fórmula da ocupação) e interesse pessoal (`INT × 2`).
   - Teto inicial de 75% respeitado em todas as perícias (regra da pág. 48).
   - Nível de Crédito limitado estritamente à faixa da ocupação.
   - Mythos de Cthulhu travado em 0% na criação.
   - Saldos exibidos reativamente com bloqueio imediato e feedback visual de limite atingido.

6. **Antecedentes e Conexões**:
   - Remoção completa dos botões de sortear aleatório nessa etapa, mantendo a escrita livre do jogador.

7. **Bens e Armas (Modal Centralizado)**:
   - "Adicionar Arma" abre um modal centralizado com `backdrop-filter: blur(5px)` e overlay escuro semitransparente.
   - Fechamento por tecla `ESC`, clique no overlay ou botão Fechar.
   - Trava de rolagem no `body` (`body.modal-open`) e foco gerenciado para acessibilidade.
   - Catálogo pesquisável de armas da década de 1920 + campos customizáveis.

8. **Migração Angular v22 & Hospedagem Vercel**:
   - Arquitetura moderna: componentes standalone, Signals (`signal`, `computed`, `effect`), fluxo de controle nativo (`@if`, `@for`), `provideZonelessChangeDetection()` nativo e injeção moderna via `inject()`.
   - Build de produção gerado com sucesso sem warnings e sem regressão funcional (`npm run build`).
   - Estética editorial 100% preservada (aprovada no `taste-skill` com 0 FAIL).
   - Suporte oficial de deploy configurado via `vercel.json` com reescrita SPA para `/index.html`, cache imutável para assets estáticos e cabeçalhos de segurança HTTP.

9. **Substituição Integral de Emojis por Ícones Animados em Angular (D20 3D & UI Vintage)**:
   - **Dado D20 (20 Lados) Animado em 3D (`app-d20-icon`)**:
     - Criação do componente standalone [`src/app/components/d20-icon/d20-icon.component.ts`](file:///C:/Users/nceci/.gemini/antigravity/scratch/fcof/src/app/components/d20-icon/d20-icon.component.ts) com geometria exata de icosaedro (projeção ortográfica de 10 facetas visíveis em tons de latão e dourado vintage com o número "20" gravado).
     - Rotação 3D contínua suave (`d20-rotacao-3d`) no hover de botões e ao rolar dados (`rolandoDado` signal).
     - Animação de tumulto e queda tridimensional de dados (`d20-tumulto-rolagem`) no clique ativo de todos os botões de rolagem de características, perícias, armas e rolador livre 1D100.
   - **Ícones Vetoriais Vintage Animados (`app-ui-icon`)**:
     - Criação do componente standalone [`src/app/components/ui-icon/ui-icon.component.ts`](file:///C:/Users/nceci/.gemini/antigravity/scratch/fcof/src/app/components/ui-icon/ui-icon.component.ts) substituindo todos os emojis por gráficos vetoriais SVG estilizados:
       - Alternador de tema: Sol com raios giratórios suaves (`sun`) e Lua com estrela cintilante (`moon`).
       - Fechamento de modais e gavetas: Cruz geométrica com rotação de 90° no hover (`close`).
       - Dano e vitais: Raio pulsante com brilho dourado (`lightning`).
       - Carregamento de imagens: Pasta vintage com aba de arquivo (`folder`) e câmera fotográfica de fole (`camera`).
       - Ações de inventário e lore: Caneta-tinteiro inclinando para escrita (`pen`) e lixeira abrindo a tampa (`trash`).
       - Destaques místicos: Signo Ancestral / Estrela oculta com aura cósmica (`elder-sign`).
       - Confirmação de conclusão: Marca de verificação dinâmica (`check`).
   - 0 emojis remanescentes em todo o código-fonte da aplicação Angular.

10. **Refatoração Completa do Sistema de Inventário do Arsenal (Drag & Drop, Imutabilidade Zoneless e Persistência)**:
    - **Correção da Reatividade Zoneless no Estado (`coc-state.service.ts`)**:
      - `atualizarInvestigadorAtivo` agora realiza clonagem profunda (`JSON.parse(JSON.stringify(list[idx]))`) antes de mutar, garantindo que o signal `inv()` emita uma nova referência de objeto e todos os computeds dependentes (`itensCorpo`, `itensMochila`, etc.) atualizem a view instantaneamente.
      - Métodos dedicados adicionados: `salvarArma`, `removerArma`, `moverArma` e `atualizarImagemArma`.
    - **Arrastar e Soltar com o Mouse (Drag and Drop Nativo HTML5)**:
      - Cards de armas/equipamentos agora são arrastáveis (`draggable="true"`) com feedback visual de arrasto (`.is-dragging`).
      - Zonas do **Corpo** e da **Mochila** atuam como drop targets dinâmicos (`.drag-target-active`), com destaque de borda e cor.
      - Respeito automático aos limites da 7ª Edição (máximo 3 itens no Corpo e 6 na Mochila) com mensagem de aviso contextual.
    - **Botão Direto de Transferência Rápida**:
      - Adicionado botão com ícone vetorial de transferência em cada card para mover de Corpo para Mochila (e vice-versa) com apenas 1 clique, além do arrasto com mouse.
    - **Troca e Upload de Imagens Confiável**:
      - Leitura assíncrona com `FileReader` integrada com `ChangeDetectorRef.markForCheck()` no modal de edição.
      - Possibilidade de troca direta de foto pelo overlay do card no próprio inventário ou via modal de edição.
    - **Exclusão Imediata pelo Ícone de Lixeira**:
      - Botão com ícone da lixeira executa a remoção imediata do item sem propagação indevida de eventos e com salvamento automático persistido.

---

## 5. Correções de Interface & Layout: Topbar e Footbar (Concluído)

Este bloco reúne a implementação concluída para as correções visuais de rolagem (scroll) e alinhamento vertical das barras superior (topbar) e inferior (footbar).

### Tarefa A: Correção de Sobreposição da Topbar no Scroll (z-index & Stacking Context) — ✅ Concluído
- **Problema Resolvido**:
  - Ao rolar a página verticalmente para baixo, os botões das etapas do assistente (`.wizard-step-btn`), números, textos e outros elementos da página não deslizam mais por cima da barra de cabeçalho (`.app-header`).
- **Implementação Realizada**:
  1. No `style.css`, `#app-root > app-header` e a classe `.app-header` foram configurados com prioridade alta de camada (`position: sticky; top: 0; z-index: 100; background: var(--ground); border-bottom: 1px solid var(--border-strong); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);`).
  2. Garantiu-se que `<app-wizard>`, `<app-sheet>` e seus containers internos permaneçam com `z-index: 1`, passando estritamente por baixo da topbar.

---

### Tarefa B: Correção da Footbar (Sticky Footer sem Vão Vazio na Parte Inferior) — ✅ Concluído
- **Problema Resolvido**:
  - A barra de rodapé (`.app-footer`) agora permanece sempre ancorada na base da viewport em telas grandes ou etapas com pouco conteúdo, eliminando o vão vazio em branco/fundo sob ela.
- **Implementação Realizada**:
  1. Configurado `#app-root` no `style.css` como flex container vertical de altura total (`min-height: 100vh; display: flex; flex-direction: column;`).
  2. Blocos principais `#app-root > app-wizard` e `#app-root > app-sheet` configurados com `flex: 1 0 auto; display: flex; flex-direction: column;` e seus containers (`.wizard-container`, `.sheet-clean-container`) com `flex: 1 0 auto; width: 100%;`.
  3. No rodapé `.app-footer`, configurado `margin-top: auto; width: 100%; position: relative; z-index: 10;`.

---

## 6. Exibição de Perícias com Valor Bruto (Remoção da Porcentagem)

- **Objetivo**: Substituir a exibição com símbolo de porcentagem (`%`) pelo valor numérico bruto (`número puro`) em todas as perícias (na Ficha Viva, no Assistente Wizard, na Gaveta de Dados e no Toast de Rolagem), facilitando a leitura e alinhando com a Ficha Oficial do Chamado de Cthulhu 7ª Edição (onde cada perícia apresenta seu valor base/alvo e frações ½ e ⅕ sem `%`).
- **Arquivos Atualizados**:
  - `src/app/components/sheet/sheet.component.ts`: Perícias em destaque, grade de perícias, Esquiva e Nível de Crédito sem `%`.
  - `src/app/components/wizard/wizard.component.ts`: Seleção de perícias ocupacionais, contadores de crédito, tabela da Etapa 6 (Base, Total e ½ / ⅕) e resumo de finanças sem `%`.
  - `src/app/components/dice-drawer/dice-drawer.component.ts`: Alvo de rolagem e frações regulares/difíceis/extremas sem `%`.
  - `src/app/components/roll-toast/roll-toast.component.ts`: Notificação flutuante de rolagem sem `%`.
  - `app.js`: Sincronização dos mesmos padrões de exibição sem `%`.


