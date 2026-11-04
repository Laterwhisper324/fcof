/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: app.js
 *
 * Arquitetura Frontend em Angular (Módulo 'coc7eApp' com Services e Componentes):
 * - CocStateService: Gerenciamento reativo de estado, persistência em localStorage,
 *   cálculos automáticos da 7ª Edição, rolador 1D100 com dados de bônus/penalidade,
 *   rolagens forçadas, gasto de Sorte e fase de desenvolvimento.
 * - <coc-app>: Componente raiz que orquestra cabeçalho, assistente, ficha viva,
 *   gaveta deslizante de dados, toast flutuante, modais e folha de impressão.
 * - <coc-header>: Barra superior enxuta com seletor rápido de investigador e modo.
 * - <coc-wizard>: Assistente de 9 passos com Progressive Disclosure (regras do livro
 *   recolhíveis, sub-abas na Etapa 3,7 e 8, filtros de categoria nas Etapas 5 e 6).
 * - <coc-live-sheet>: Ficha Viva dividida em 6 abas focadas (Atributos, Perícias com
 *   modo Destaque, Combate, Antecedentes em Acordeão, Inventário/Finanças e Folha 2 Páginas)
 *   + HUD superior compacto para eliminar sobrecarga de informações simultâneas.
 * - <coc-dice-drawer> & <coc-roll-toast>: Gaveta lateral deslizante sob demanda e
 *   notificação flutuante de última rolagem.
 * - <coc-modals>: Modais de Gerenciamento de Investigadores, Exportação PDF/AcroForm,
 *   Fase de Desenvolvimento e Especializações.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'coc7e_investigadores_v1';
  const THEME_KEY = 'coc7e_tema_v1';

  const app = angular.module('coc7eApp', []);

  /* ==========================================================================
     SERVIÇO CENTRAL DE ESTADO E REGRAS (CocStateService)
     ========================================================================== */
  app.service('CocStateService', ['$window', function ($window) {
    const svc = this;
    const R = $window.CoC7e.Regras;
    const T = $window.CoC7e.TABELAS;

    svc.state = {
      modo: 'wizard', // 'wizard' | 'ficha'
      etapaWizard: 1, // 1 a 9
      mostrarRegraLivroWizard: false, // Progressive disclosure das notas de página do livro
      subAbaIdade: 'edu', // 'edu' | 'fisico' | 'sorte'
      mostrarEdicaoDerivados: false, // Oculta overrides de regras da casa por padrão
      filtroCategoriaOcupacao: 'todas',
      buscaOcupacao: '',
      buscaEscolhaOcupacional: '',
      filtroPericiaWizard: 'ocupacionais', // 'ocupacionais' | 'investidas' | 'combate' | 'investigacao' | 'social' | 'ciencias' | 'todas'
      buscaPericiaWizard: '',
      mostrarOpcoesRegraPericia: false,
      edicaoLivreOcupacional: false,
      subAbaAntecedentesWizard: 'essenciais', // 'essenciais' | 'mythos'
      cardAntecedenteAberto: 'ideologiaCrencas',
      subAbaEtapa8: 'financas', // 'financas' | 'armas' | 'equipamentos'

      // Estado da Ficha Viva (organizada para baixa carga cognitiva)
      abaFicha: 'resumo', // 'resumo' | 'pericias' | 'combate' | 'antecedentes' | 'inventario' | 'folha2p'
      painelVitaisAberto: false, // Expande calculadora de dano/sanidade e flags apenas sob demanda
      modoVisaoPericiasFicha: 'destaque', // 'destaque' | 'categorias' | 'grade3col'
      categoriaPericiaFicha: 'combate',
      buscaPericiaFicha: '',
      modoEdicaoPericiasFicha: false,

      // Estado do Rolador 1D100 (Gaveta deslizante + Toast flutuante)
      gavetaDadosAberta: false,
      toastRolagemVisivel: false,
      dadosBonusPenalidade: 0, // -2, -1, 0, +1, +2
      ultimaRolagem: null,
      historicoRolagens: [],

      // Estado de Modais e Investigadores
      tema: localStorage.getItem(THEME_KEY) || 'light',
      investigadores: [],
      ativoId: null,
      modalAberto: null, // null | 'investigadores' | 'pdf' | 'desenvolvimento' | 'especializacao'
      resultadoDesenvolvimento: null,
      statusAcroForm: ''
    };

    svc.ETAPAS_WIZARD = [
      {
        num: 1,
        curto: 'Identidade',
        titulo: 'Etapa 1: Identidade do Investigador (Anos 1920)',
        resumo: 'Defina nome, jogador(a), idade (15 a 90 anos), residência e local de nascimento.',
        regraLivro: 'Capítulo 3 (págs. 30–48): A idade escolhida determinará os modificadores automáticos de EDU, Sorte e atributos físicos na Etapa 3.'
      },
      {
        num: 2,
        curto: 'Características',
        titulo: 'Etapa 2: Características Principais (FOR, CON, TAM, DES, APA, INT, POD, EDU)',
        resumo: 'Escolha entre digitar valores, rolar os dados oficiais (3D6×5 e (2D6+6)×5) ou distribuir o Conjunto Fixo.',
        regraLivro: 'Página 31 e Páginas 47–48: FOR, CON, DES, APA e POD usam 3D6×5 (15–90). TAM, INT e EDU usam (2D6+6)×5 (40–90). O Conjunto Fixo (pág. 48) oferece 40, 50, 50, 50, 60, 60, 70, 80.'
      },
      {
        num: 3,
        curto: 'Idade & Sorte',
        titulo: 'Etapa 3: Modificadores de Idade & Sorte Inicial',
        resumo: 'Resolva em 3 passos simples: Melhoria de EDU, Penalidades Físicas da faixa etária e Rolagem de Sorte.',
        regraLivro: 'Tabela de Idade (pág. 32): Jovens (15–19) reduzem 5 de FOR/TAM, têm -5 EDU e rolam Sorte 2 vezes. Adultos e idosos fazem 1 a 4 testes de melhoria de EDU e distribuem reduções em FOR, CON ou DES.'
      },
      {
        num: 4,
        curto: 'Derivados',
        titulo: 'Etapa 4: Atributos Derivados (PV, SAN, PM, MOV, Dano Extra e Corpo)',
        resumo: 'Todos os atributos secundários são calculados automaticamente pelas tabelas do livro.',
        regraLivro: 'Páginas 33–34: PV = ⌊(CON+TAM)/10⌋; SAN Inicial = POD; PM = ⌊POD/5⌋; Esquiva Base = ⌊DES/2⌋; Dano Extra e Corpo vêm da soma FOR+TAM (Tabela I).'
      },
      {
        num: 5,
        curto: 'Ocupação',
        titulo: 'Etapa 5: Ocupação Clássica (Década de 1920)',
        resumo: 'Selecione uma das 73 ocupações do Livro Básico ou crie uma ocupação personalizada.',
        regraLivro: 'Páginas 36–39 e Apêndice II (págs. 392–395): Cada ocupação define a fórmula de Pontos de Ocupação (ex.: EDU×4 ou EDU×2 + DES×2), a faixa de Nível de Crédito e 8 perícias ocupacionais.'
      },
      {
        num: 6,
        curto: 'Perícias',
        titulo: 'Etapa 6: Distribuição de Pontos de Perícia',
        resumo: 'Aloque seus Pontos de Ocupação e Interesses Pessoais (INT×2) com filtros inteligentes por categoria.',
        regraLivro: 'Páginas 36–39 e Cap. 4 (págs. 54–78): É obrigatório alocar pontos em Nível de Crédito dentro da faixa da ocupação. Mythos de Cthulhu não recebe pontos iniciais (pág. 70).'
      },
      {
        num: 7,
        curto: 'Antecedentes',
        titulo: 'Etapa 7: Antecedentes & Conexão-Chave',
        resumo: 'Construa a história do investigador usando os cartões recolhíveis ou sorteie 1D10 nas tabelas do livro.',
        regraLivro: 'Páginas 40–45: Escolha uma Conexão-Chave (Ideologia, Pessoas Significativas, Locais Importantes ou Pertences Queridos) que permite recuperar 1D6 de Sanidade (pág. 45).'
      },
      {
        num: 8,
        curto: 'Bens & Armas',
        titulo: 'Etapa 8: Finanças (1920s), Arsenal & Equipamentos',
        resumo: 'Confira sua renda automática dos anos 1920 e selecione armas e equipamentos de época.',
        regraLivro: 'Tabela II (págs. 46–47) calcula Dinheiro, Patrimônio e Nível de Gastos pelo Nível de Crédito. Armas seguem a Tabela XVII (págs. 401–405).'
      },
      {
        num: 9,
        curto: 'Revisão',
        titulo: 'Etapa 9: Revisão de Regras & Conclusão',
        resumo: 'Verifique o checklist automático da 7ª Edição e abra sua Ficha Viva de Jogo.',
        regraLivro: 'Resumo completo pronto para sessão, exportação JSON ou geração de PDF (ficha oficial editável AcroForm ou PDF nativo de 2 páginas).'
      }
    ];

    svc.CAMPOS_ANTECEDENTES = [
      { chave: 'ideologiaCrencas', titulo: 'Ideologia / Crenças', grupo: 'essenciais', sorteavel: true, conexao: true, dica: 'Religião, filosofia, política, ciência ou ocultismo (1D10 na pág. 42).' },
      { chave: 'pessoasSignificativas', titulo: 'Pessoas Significativas', grupo: 'essenciais', sorteavel: true, conexao: true, dica: 'Quem é a pessoa mais importante (1D10) e por quê (1D10) (págs. 42–43).' },
      { chave: 'locaisImportantes', titulo: 'Locais Importantes', grupo: 'essenciais', sorteavel: true, conexao: true, dica: 'Lugar especial de estudo, paz ou memória marcante (1D10 na pág. 43).' },
      { chave: 'pertencesQueridos', titulo: 'Pertences Queridos', grupo: 'essenciais', sorteavel: true, conexao: true, dica: 'Objeto de maior valor sentimental ou profissional (1D10 na pág. 44).' },
      { chave: 'descricaoPessoal', titulo: 'Descrição Pessoal', grupo: 'essenciais', sorteavel: true, conexao: false, dica: 'Aparência física, vestimentas de 1920, porte e primeira impressão.' },
      { chave: 'caracteristicas', titulo: 'Características & Traços', grupo: 'essenciais', sorteavel: true, conexao: false, dica: 'Traço marcante de personalidade ou hábito (1D10 na pág. 44).' },
      { chave: 'ferimentosCicatrizes', titulo: 'Ferimentos & Cicatrizes', grupo: 'mythos', sorteavel: false, conexao: false, dica: 'Sequelas físicas adquiridas antes ou durante as investigações.' },
      { chave: 'fobiasManias', titulo: 'Fobias & Manias', grupo: 'mythos', sorteavel: false, conexao: false, dica: 'Medos irracionais ou compulsões adquiridas por trauma mental.' },
      { chave: 'tomosFeiticos', titulo: 'Tomos Arcanos, Feitiços & Artefatos', grupo: 'mythos', sorteavel: false, conexao: false, dica: 'Livros dos Mythos, magias aprendidas e relíquias estudadas.' },
      { chave: 'encontrosEntidades', titulo: 'Encontros com Entidades Estranhas', grupo: 'mythos', sorteavel: false, conexao: false, dica: 'Registros de criaturas e horrores cósmicos testemunhados.' }
    ];

    svc.gerarIdUnico = function () {
      return 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    };

    svc.obterCategoriaPericia = function (p) {
      const id = (p.id || '').toLowerCase();
      const fam = (p.familia || p.nome || '').toLowerCase();
      if (id.includes('lutar') || id.includes('armas_') || id === 'esquiva' || id === 'arremessar' || id === 'demolicoes' || id === 'artilharia') {
        return 'combate';
      }
      if (id === 'encontrar' || id === 'escutar' || id === 'usar_bibliotecas' || id === 'psicologia' || id === 'rastrear' || id === 'ocultismo' || id === 'mythos_de_cthulhu' || id === 'avaliacao' || id === 'leitura_labial') {
        return 'investigacao';
      }
      if (id === 'charme' || id === 'intimidacao' || id === 'labia' || id === 'persuasao' || id === 'nivel_de_credito' || id.includes('lingua') || fam.includes('língua')) {
        return 'social';
      }
      if (id.includes('ciencia') || fam.includes('ciência') || id === 'medicina' || id === 'primeiros_socorros' || id === 'psicanalise' || id === 'historia' || id === 'arqueologia' || id === 'antropologia' || id === 'mundo_natural' || id === 'contabilidade' || id === 'direito' || id.includes('arte_e_oficio') || fam.includes('arte e ofício') || id === 'hipnose') {
        return 'ciencias';
      }
      return 'acao';
    };

    svc.criarListaPericiasInicial = function (atributosFinais, usarNatacao10) {
      return $window.CoC7e.PERICIAS_BASE.map(function (p) {
        let valorBase = p.base;
        if (p.baseDinamica === 'METADE_DES') {
          valorBase = Math.floor((Number(atributosFinais.DES) || 0) / 2);
        } else if (p.baseDinamica === 'EDU') {
          valorBase = Number(atributosFinais.EDU) || 0;
        } else if (p.id === 'natacao' && usarNatacao10) {
          valorBase = 10;
        }

        const nomeFormatado = p.especializacaoPadrao
          ? p.familia + ' (' + p.especializacaoPadrao + ')'
          : p.nome;

        return {
          id: p.id,
          nome: nomeFormatado,
          familia: p.familia,
          especializavel: Boolean(p.especializavel),
          especializacao: p.especializacaoPadrao || '',
          permiteRotuloCustom: Boolean(p.permiteRotuloCustom),
          base: valorBase,
          baseOriginal: p.base,
          baseDinamica: p.baseDinamica,
          ocupacao: 0,
          interesse: 0,
          outros: 0,
          marcavel: p.marcavel !== false,
          marcada: false,
          bloqueadaNaCriacao: Boolean(p.bloqueadaNaCriacao),
          notaDivergencia: p.notaDivergencia || null
        };
      });
    };

    svc.criarInvestigadorPadrao = function () {
      const atributosBase = {
        FOR: 50, CON: 55, TAM: 60, DES: 60,
        APA: 50, INT: 70, POD: 60, EDU: 70
      };

      const inv = {
        id: svc.gerarIdUnico(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        identidade: {
          nome: 'Arthur Pendelton',
          jogador: '',
          idade: 28,
          sexo: 'Masculino',
          residencia: 'Arkham, Massachusetts',
          nascimento: 'Boston, Massachusetts'
        },
        metodoAtributos: 'manual',
        poolRolado: [],
        arranjoFixoRestante: [40, 50, 50, 50, 60, 60, 70, 80],
        atributosBase: angular.copy(atributosBase),
        idadeAjustes: {
          reducaoFOR: 0,
          reducaoCON: 0,
          reducaoDES: 0,
          reducaoTAM: 0,
          ganhoEDU: 0,
          historicoTestesEDU: [],
          sorteRolagem1: 55,
          sorteRolagem2: 0,
          sorteInicial: 55
        },
        atributosFinais: angular.copy(atributosBase),
        ocupacaoId: 'detetive_particular',
        ocupacaoNome: 'Detetive Particular',
        ocupacaoAtributoEscolhido: 'DES',
        ocupacaoPericiasEscolhidas: ['encontrar'],
        ocupacaoCustom: {
          ativa: false,
          nome: 'Ocupação Personalizada',
          multiplicadorEDU: 4,
          creditoMin: 9,
          creditoMax: 30
        },
        usarNatacao10: false,
        limitePericia75: true,
        pericias: [],
        derivados: {
          pvMax: 11, pvAtual: 11,
          sanInicial: 60, sanMax: 99, sanAtual: 60,
          pmMax: 12, pmAtual: 12,
          sorteInicial: 55, sorteAtual: 55,
          esquivaBase: 30, danoExtra: '0', corpo: 0, mov: 7,
          lesaoGrave: false, morrendo: false, inconsciente: false,
          insanidadeTemporaria: false, insanidadeIndefinida: false,
          overrideManual: false
        },
        armas: [
          {
            id: 'desarmado',
            nome: 'Desarmado (Briga)',
            periciaId: 'lutar_briga',
            periciaNome: 'Lutar (Briga)',
            danoBase: '1D3',
            somaDX: 'completo',
            alcance: 'Toque',
            ataques: '1',
            municao: '—',
            defeito: '—'
          },
          {
            id: 'revolver_38',
            nome: 'Revólver .38 ou 9mm',
            periciaId: 'armas_de_fogo_curtas',
            periciaNome: 'Armas de Fogo (Armas Curtas)',
            danoBase: '1D10',
            somaDX: 'nenhum',
            alcance: '15 m',
            ataques: '1 (3)',
            municao: '6',
            defeito: '100'
          }
        ],
        antecedentes: {
          descricaoPessoal: 'Sobretudo gasto de lã cinzenta, chapéu fedora sempre inclinado e olhos atentos.',
          ideologiaCrencas: 'Há forças ocultas operando nas sombras da sociedade racional.',
          pessoasSignificativas: 'Professor Henry Armitage (antigo consultor na Universidade Miskatonic).',
          locaisImportantes: 'Seu escritório enfumaçado no segundo andar na Rua Curwen, Arkham.',
          pertencesQueridos: 'Relógio de bolso de prata herdado do pai e uma lupa de latão.',
          caracteristicas: 'Cético até ver as provas com os próprios olhos; leal aos clientes.',
          conexaoChave: 'Locais Importantes',
          ferimentosCicatrizes: '',
          fobiasManias: '',
          tomosFeiticos: '',
          encontrosEntidades: ''
        },
        equipamentos: [
          'Lanterna de Bolso',
          'Caderno de Anotações e Lápis',
          'Câmera Fotográfica Portátil (Kodak)',
          'Par de Algemas',
          'Relógio de Bolso'
        ],
        financasCustom: {
          nivelGastos: '',
          dinheiro: '',
          patrimonio: ''
        },
        companheiros: []
      };

      inv.pericias = svc.criarListaPericiasInicial(inv.atributosFinais, inv.usarNatacao10);
      const pCredito = inv.pericias.find(function (p) { return p.id === 'nivel_de_credito'; });
      if (pCredito) pCredito.ocupacao = 15;

      svc.recalcularInvestigador(inv, { resetarAtuais: true });
      return inv;
    };

    svc.obterOcupacaoAtual = function (inv) {
      if (inv && inv.ocupacaoId === 'custom') {
        const c = inv.ocupacaoCustom || {};
        return {
          id: 'custom',
          nome: c.nome || 'Ocupação Personalizada',
          formulaTexto: 'EDU × ' + (c.multiplicadorEDU || 4),
          formula: {
            tipo: 'simples',
            atributos: [{ atr: 'EDU', mult: Number(c.multiplicadorEDU) || 4 }]
          },
          creditoMin: Number(c.creditoMin) || 0,
          creditoMax: Number(c.creditoMax) || 99,
          periciasFixas: [],
          escolhas: [{ qtd: 8, tipo: 'qualquer', rotulo: '8 perícias ocupacionais à sua escolha' }]
        };
      }
      const lista = $window.CoC7e.OCUPACOES || [];
      return lista.find(function (o) { return o.id === inv.ocupacaoId; }) || lista[0];
    };

    svc.recalcularInvestigador = function (inv, opcoes) {
      if (!inv) return;
      opcoes = opcoes || {};
      const idade = Number(inv.identidade && inv.identidade.idade) || 28;
      const regraIdade = R.obterRegraIdade(idade);
      const base = inv.atributosBase || {};
      const aj = inv.idadeAjustes || {};

      const finais = {
        FOR: Number(base.FOR) || 50,
        CON: Number(base.CON) || 50,
        TAM: Number(base.TAM) || 50,
        DES: Number(base.DES) || 50,
        APA: Number(base.APA) || 50,
        INT: Number(base.INT) || 50,
        POD: Number(base.POD) || 50,
        EDU: Number(base.EDU) || 50
      };

      finais.FOR = Math.max(1, finais.FOR - (Number(aj.reducaoFOR) || 0));
      finais.CON = Math.max(1, finais.CON - (Number(aj.reducaoCON) || 0));
      finais.DES = Math.max(1, finais.DES - (Number(aj.reducaoDES) || 0));
      finais.TAM = Math.max(1, finais.TAM - (Number(aj.reducaoTAM) || 0));
      finais.APA = Math.max(1, finais.APA - (regraIdade.penalidadeAPA || 0));

      if (regraIdade.penalidadeFixaEDU > 0) {
        finais.EDU = Math.max(1, finais.EDU - regraIdade.penalidadeFixaEDU);
      } else {
        finais.EDU = Math.min(99, finais.EDU + (Number(aj.ganhoEDU) || 0));
      }

      inv.atributosFinais = finais;

      let mythosTotal = 0;
      (inv.pericias || []).forEach(function (p) {
        if (p.baseDinamica === 'METADE_DES') {
          p.base = Math.floor(finais.DES / 2);
        } else if (p.baseDinamica === 'EDU') {
          p.base = finais.EDU;
        } else if (p.id === 'natacao') {
          p.base = inv.usarNatacao10 ? 10 : 20;
        }
        if (p.id === 'mythos_de_cthulhu') {
          mythosTotal = (Number(p.base) || 0) + (Number(p.ocupacao) || 0) + (Number(p.interesse) || 0) + (Number(p.outros) || 0);
        }
      });

      const ocup = svc.obterOcupacaoAtual(inv);
      inv.ocupacaoNome = ocup ? ocup.nome : 'Investigador';

      const pvMaxCalc = R.calcularPVMaximo(finais.CON, finais.TAM);
      const sanIniCalc = R.calcularSanidadeInicial(finais.POD);
      const sanMaxCalc = R.calcularSanidadeMaxima(mythosTotal);
      const pmMaxCalc = R.calcularPMMaximo(finais.POD);
      const esqBaseCalc = R.calcularEsquivaBase(finais.DES);
      const dxCorpo = R.calcularDanoExtraECorpo(finais.FOR, finais.TAM);
      const movCalc = R.calcularMOV(finais.FOR, finais.DES, finais.TAM, idade);

      const s1 = Number(aj.sorteRolagem1) || 50;
      const s2 = Number(aj.sorteRolagem2) || 0;
      const sorteIni = regraIdade.duplaSorte ? Math.max(s1, s2) : s1;
      aj.sorteInicial = sorteIni;

      if (!inv.derivados) inv.derivados = {};
      if (!inv.derivados.overrideManual) {
        const eraMaxPV = inv.derivados.pvAtual === inv.derivados.pvMax;
        const eraMaxPM = inv.derivados.pmAtual === inv.derivados.pmMax;
        const eraIniSAN = inv.derivados.sanAtual === inv.derivados.sanInicial;

        inv.derivados.pvMax = pvMaxCalc;
        inv.derivados.sanInicial = sanIniCalc;
        inv.derivados.sanMax = sanMaxCalc;
        inv.derivados.pmMax = pmMaxCalc;
        inv.derivados.sorteInicial = sorteIni;
        inv.derivados.esquivaBase = esqBaseCalc;
        inv.derivados.danoExtra = dxCorpo.danoExtra;
        inv.derivados.corpo = dxCorpo.corpo;
        inv.derivados.mov = movCalc;

        if (opcoes.resetarAtuais) {
          inv.derivados.pvAtual = pvMaxCalc;
          inv.derivados.sanAtual = Math.min(sanIniCalc, sanMaxCalc);
          inv.derivados.pmAtual = pmMaxCalc;
          inv.derivados.sorteAtual = sorteIni;
        } else {
          if (eraMaxPV || inv.derivados.pvAtual > pvMaxCalc) inv.derivados.pvAtual = pvMaxCalc;
          if (eraMaxPM || inv.derivados.pmAtual > pmMaxCalc) inv.derivados.pmAtual = pmMaxCalc;
          if (eraIniSAN) inv.derivados.sanAtual = Math.min(sanIniCalc, sanMaxCalc);
          if (inv.derivados.sanAtual > sanMaxCalc) inv.derivados.sanAtual = sanMaxCalc;
        }
      }
    };

    svc.ehPericiaOcupacional = function (inv, pericia) {
      const ocup = svc.obterOcupacaoAtual(inv);
      if (!ocup) return false;
      if (pericia.id === 'nivel_de_credito') return true;
      const fixas = ocup.periciasFixas || [];
      if (fixas.includes(pericia.id) || fixas.includes(pericia.familia)) return true;
      const escolhidas = inv.ocupacaoPericiasEscolhidas || [];
      return escolhidas.includes(pericia.id);
    };

    svc.obterTotalPericiaObj = function (p) {
      if (!p) return 0;
      return (Number(p.base) || 0) + (Number(p.ocupacao) || 0) + (Number(p.interesse) || 0) + (Number(p.outros) || 0);
    };

    svc.obterTotalPericia = function (inv, periciaId) {
      const p = (inv.pericias || []).find(function (x) { return x.id === periciaId; });
      return svc.obterTotalPericiaObj(p);
    };

    svc.calcularTotaisPericias = function (inv) {
      const ocup = svc.obterOcupacaoAtual(inv);
      const resOcup = R.calcularPontosOcupacao(ocup.formula, inv.atributosFinais, inv.ocupacaoAtributoEscolhido);
      const totalOcupacao = resOcup.total;
      const totalInteresse = R.calcularPontosInteressePessoal(inv.atributosFinais.INT);

      let gastosOcupacao = 0;
      let gastosInteresse = 0;
      (inv.pericias || []).forEach(function (p) {
        gastosOcupacao += Number(p.ocupacao) || 0;
        gastosInteresse += Number(p.interesse) || 0;
      });

      const pCred = (inv.pericias || []).find(function (p) { return p.id === 'nivel_de_credito'; });
      const nivelCredito = svc.obterTotalPericiaObj(pCred);
      const creditoValido = nivelCredito >= ocup.creditoMin && nivelCredito <= ocup.creditoMax;

      return {
        totalOcupacao: totalOcupacao,
        detalheOcupacao: resOcup.detalhe,
        gastosOcupacao: gastosOcupacao,
        restantesOcupacao: totalOcupacao - gastosOcupacao,
        totalInteresse: totalInteresse,
        gastosInteresse: gastosInteresse,
        restantesInteresse: totalInteresse - gastosInteresse,
        nivelCredito: nivelCredito,
        creditoMin: ocup.creditoMin,
        creditoMax: ocup.creditoMax,
        creditoValido: creditoValido
      };
    };

    svc.salvarEstado = function () {
      try {
        const inv = svc.obterInvestigadorAtivo();
        if (inv) inv.atualizadoEm = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ativoId: svc.state.ativoId,
          investigadores: svc.state.investigadores
        }));
      } catch (err) {
        console.warn('Aviso ao salvar em localStorage:', err);
      }
    };

    svc.carregarEstado = function () {
      try {
        const bruto = localStorage.getItem(STORAGE_KEY);
        if (!bruto) {
          const padrao = svc.criarInvestigadorPadrao();
          svc.state.investigadores = [padrao];
          svc.state.ativoId = padrao.id;
          svc.salvarEstado();
          return;
        }
        const parsed = JSON.parse(bruto);
        if (parsed && Array.isArray(parsed.investigadores) && parsed.investigadores.length > 0) {
          svc.state.investigadores = parsed.investigadores;
          svc.state.ativoId = parsed.ativoId || parsed.investigadores[0].id;
          svc.state.investigadores.forEach(function (inv) {
            svc.recalcularInvestigador(inv, { resetarAtuais: false });
          });
        } else {
          const padrao = svc.criarInvestigadorPadrao();
          svc.state.investigadores = [padrao];
          svc.state.ativoId = padrao.id;
        }
      } catch (e) {
        const padrao = svc.criarInvestigadorPadrao();
        svc.state.investigadores = [padrao];
        svc.state.ativoId = padrao.id;
      }
    };

    svc.obterInvestigadorAtivo = function () {
      return svc.state.investigadores.find(function (i) { return i.id === svc.state.ativoId; }) || svc.state.investigadores[0];
    };

    svc.aplicarTema = function (tema) {
      svc.state.tema = tema === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', svc.state.tema);
      localStorage.setItem(THEME_KEY, svc.state.tema);
    };

    svc.alternarTema = function () {
      svc.aplicarTema(svc.state.tema === 'dark' ? 'light' : 'dark');
    };

    /* --- ROLADOR 1D100, FORÇAR ROLAGEM E SORTE --- */
    svc.rolarPericiaOuAtributo = function (rotulo, valorAlvo, opcoes) {
      opcoes = opcoes || {};
      const inv = svc.obterInvestigadorAtivo();
      const d100 = R.rolar1d100ComBonusPenalidade(svc.state.dadosBonusPenalidade);
      const avaliacao = R.avaliarSucesso(d100.resultadoFinal, valorAlvo);
      const podeGastarSorte = !opcoes.ehTesteSorte && !opcoes.ehTesteSanidade && !avaliacao.sucesso && avaliacao.nivel !== 'DESASTRE';

      let sorteParaRegular = 0;
      let sorteParaDificil = 0;
      let sorteParaExtremo = 0;
      if (podeGastarSorte) {
        if (d100.resultadoFinal > avaliacao.regular) sorteParaRegular = d100.resultadoFinal - avaliacao.regular;
        if (d100.resultadoFinal > avaliacao.dificil) sorteParaDificil = d100.resultadoFinal - avaliacao.dificil;
        if (d100.resultadoFinal > avaliacao.extremo) sorteParaExtremo = d100.resultadoFinal - avaliacao.extremo;
      }

      const registro = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        investigador: (inv.identidade && inv.identidade.nome) || 'Investigador',
        rotulo: rotulo,
        valorAlvo: valorAlvo,
        d100: d100,
        avaliacao: avaliacao,
        forcada: Boolean(opcoes.forcada),
        ehTesteSorte: Boolean(opcoes.ehTesteSorte),
        ehTesteSanidade: Boolean(opcoes.ehTesteSanidade),
        periciaId: opcoes.periciaId || null,
        podeGastarSorte: podeGastarSorte,
        sorteParaRegular: sorteParaRegular,
        sorteParaDificil: sorteParaDificil,
        sorteParaExtremo: sorteParaExtremo,
        sorteGasta: 0
      };

      // Marca automaticamente perícia em caso de sucesso Regular ou melhor
      if (opcoes.periciaId && avaliacao.sucesso) {
        const perObj = (inv.pericias || []).find(function (p) { return p.id === opcoes.periciaId; });
        if (perObj && perObj.marcavel) {
          perObj.marcada = true;
          svc.salvarEstado();
        }
      }

      svc.state.ultimaRolagem = registro;
      svc.state.toastRolagemVisivel = true;
      svc.state.historicoRolagens.unshift(registro);
      if (svc.state.historicoRolagens.length > 40) svc.state.historicoRolagens.pop();
      return registro;
    };

    svc.forcarUltimaRolagem = function () {
      const ult = svc.state.ultimaRolagem;
      if (!ult || ult.avaliacao.sucesso || ult.forcada || ult.ehTesteSorte || ult.ehTesteSanidade) return;
      svc.rolarPericiaOuAtributo(ult.rotulo + ' [FORÇADA]', ult.valorAlvo, {
        forcada: true,
        periciaId: ult.periciaId
      });
    };

    svc.gastarSorteUltimaRolagem = function (meta) {
      const inv = svc.obterInvestigadorAtivo();
      const ult = svc.state.ultimaRolagem;
      if (!ult || !ult.podeGastarSorte || ult.sorteGasta > 0) return;

      let custo = 0;
      let novoValorRolado = ult.d100.resultadoFinal;
      if (meta === 'REGULAR') {
        custo = ult.sorteParaRegular;
        novoValorRolado = ult.avaliacao.regular;
      } else if (meta === 'DIFICIL') {
        custo = ult.sorteParaDificil;
        novoValorRolado = ult.avaliacao.dificil;
      } else if (meta === 'EXTREMO') {
        custo = ult.sorteParaExtremo;
        novoValorRolado = ult.avaliacao.extremo;
      }

      if (custo <= 0 || inv.derivados.sorteAtual < custo) return;

      inv.derivados.sorteAtual -= custo;
      ult.sorteGasta = custo;
      ult.d100.resultadoFinal = novoValorRolado;
      ult.avaliacao = R.avaliarSucesso(novoValorRolado, ult.valorAlvo);
      ult.podeGastarSorte = false;

      if (ult.periciaId && ult.avaliacao.sucesso) {
        const perObj = (inv.pericias || []).find(function (p) { return p.id === ult.periciaId; });
        if (perObj && perObj.marcavel) perObj.marcada = true;
      }
      svc.salvarEstado();
    };

    svc.rolarDanoArma = function (arma) {
      const inv = svc.obterInvestigadorAtivo();
      const expr = R.formatarDanoArma(arma.danoBase, arma.somaDX, inv.derivados.danoExtra);
      const partes = expr.toUpperCase().split('+').map(function (s) { return s.trim(); });
      let total = 0;
      const detalhes = [];

      partes.forEach(function (pt) {
        const mDado = pt.match(/^(\d+)D(\d+)$/);
        if (mDado) {
          const r = R.rolarDados(Number(mDado[1]), Number(mDado[2]), 0);
          total += r.total;
          detalhes.push(pt + '[' + r.rolagens.join(',') + ']');
        } else {
          const n = parseInt(pt, 10);
          if (!isNaN(n)) {
            total += n;
            detalhes.push(String(n));
          }
        }
      });

      const registro = {
        id: Date.now() + '_dmg',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        investigador: (inv.identidade && inv.identidade.nome) || 'Investigador',
        rotulo: 'Dano: ' + arma.nome + ' (' + expr + ')',
        valorAlvo: 100,
        d100: { resultadoFinal: Math.max(1, total), dezenaEscolhida: 0, unidade: 0, dezenasRoladas: [0], tipoModificador: 'DANO' },
        avaliacao: {
          nivel: 'REGULAR',
          rotulo: 'Dano Total: ' + Math.max(1, total) + ' PV (' + detalhes.join(' + ') + ')',
          sucesso: true,
          classeCss: 'nivel-critico',
          regular: 100, dificil: 50, extremo: 20
        },
        forcada: true,
        ehTesteSorte: true,
        podeGastarSorte: false,
        sorteGasta: 0
      };

      svc.state.ultimaRolagem = registro;
      svc.state.toastRolagemVisivel = true;
      svc.state.historicoRolagens.unshift(registro);
    };

    svc.baixarBytes = function (bytes, nomeArquivo, mimeType) {
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
    };

    svc.baixarFichaOficialPDF = function (inv, opcoes = {}) {
      const nomeLimpo = (((inv.identidade && inv.identidade.nome) || 'investigador'))
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'investigador';
      return $window.CoC7e.PDFExport.exportarNaFichaOficialAnexada(inv, opcoes).then(function (res) {
        const sufixo = opcoes.achatarCampos ? '-impressao' : '-editavel';
        svc.baixarBytes(res.bytes, 'ficha-oficial-coc7e-' + nomeLimpo + sufixo + '.pdf', 'application/pdf');
        return res;
      });
    };

    svc.exportarJSON = function (inv) {
      const nomeLimpo = ((inv.identidade && inv.identidade.nome) || 'investigador')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const jsonStr = JSON.stringify(inv, null, 2);
      svc.baixarBytes(new TextEncoder().encode(jsonStr), 'investigador-' + nomeLimpo + '.json', 'application/json');
    };

    // Inicialização imediata
    svc.aplicarTema(svc.state.tema);
    svc.carregarEstado();
  }]);

  /* ==========================================================================
     COMPONENTE RAIZ: <coc-app>
     ========================================================================== */
  app.component('cocApp', {
    controller: ['CocStateService', function (CocStateService) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };
    }],
    template: `
      <coc-header></coc-header>

      <main class="app-main no-print">
        <coc-wizard ng-if="$ctrl.state.modo === 'wizard'"></coc-wizard>
        <coc-live-sheet ng-if="$ctrl.state.modo === 'ficha'"></coc-live-sheet>
      </main>

      <!-- Folha Oficial de 2 Páginas exclusiva para @media print (funciona em qualquer aba) -->
      <div class="print-only-sheet">
        <coc-print-sheet></coc-print-sheet>
      </div>

      <!-- Toast Flutuante de Última Rolagem (Não ocupa espaço fixo na tela) -->
      <coc-roll-toast></coc-roll-toast>

      <!-- Gaveta Lateral Deslizante de Rolagens e Log -->
      <coc-dice-drawer></coc-dice-drawer>

      <!-- Modais do Sistema -->
      <coc-modals></coc-modals>
    `
  });

  /* ==========================================================================
     COMPONENTE DE CABEÇALHO COMPACTO: <coc-header>
     ========================================================================== */
  app.component('cocHeader', {
    controller: ['CocStateService', function (CocStateService) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };
      $ctrl.contarMarcadas = function () {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return 0;
        return inv.pericias.filter(function (p) { return p.marcada && p.marcavel; }).length;
      };
    }],
    template: `
      <header class="app-header no-print">
        <div class="header-inner">
          <!-- Marca + Pílula Rápida do Investigador Ativo -->
          <div class="brand-block">
            <div class="brand-seal" aria-hidden="true" title="Chamado de Cthulhu 7ª Edição"><svg class="brand-seal-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="12,3 15,9 21,9 16,13 18,19 12,15 6,19 8,13 3,9 9,9"/></svg></div>
            <div>
              <h1 class="brand-title">Chamado de Cthulhu • 7ª Ed.</h1>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.15rem;">
                <button type="button" class="active-inv-pill" ng-click="$ctrl.state.modalAberto = 'investigadores'" title="Trocar ou gerenciar investigadores salvos">
                  <span><strong>{{$ctrl.inv().identidade.nome || 'Sem Nome'}}</strong></span>
                  <span style="color:var(--text-muted);">• {{$ctrl.inv().ocupacaoNome}}</span>
                  <span class="segmented-badge">{{$ctrl.state.investigadores.length}}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Seletor Central de Modo (Assistente vs Ficha Viva) -->
          <div class="segmented-control" role="navigation" aria-label="Modo de Visualização">
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.modo === 'wizard'}"
              ng-click="$ctrl.state.modo = 'wizard'">
              <span>Assistente</span>
              <span class="segmented-badge">Etapa {{$ctrl.state.etapaWizard}}/9</span>
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.modo === 'ficha'}"
              ng-click="$ctrl.state.modo = 'ficha'">
              <span>Ficha Viva</span>
            </button>
          </div>

          <!-- Ações Rápidas à Direita -->
          <div class="header-actions">
            <button type="button" class="btn" ng-click="$ctrl.state.gavetaDadosAberta = !$ctrl.state.gavetaDadosAberta" title="Abrir Rolador 1D100 e Histórico da Sessão">
              Dados 1D100
              <span class="segmented-badge" ng-if="$ctrl.state.ultimaRolagem">
                {{$ctrl.state.ultimaRolagem.d100.resultadoFinal}}
              </span>
            </button>

            <button type="button" class="btn" ng-if="$ctrl.state.modo === 'ficha'" ng-click="$ctrl.state.modalAberto = 'desenvolvimento'" title="Fase de Desenvolvimento do Investigador (pág. 94)">
              Evolução
              <span class="segmented-badge" ng-if="$ctrl.contarMarcadas() > 0">{{$ctrl.contarMarcadas()}}</span>
            </button>

            <button type="button" class="btn btn-gold" ng-click="$ctrl.state.modalAberto = 'pdf'" title="Exportar PDF (AcroForm, Nativo 2 Páginas ou Impressão) e JSON">
              PDF Oficial
            </button>

            <button type="button" class="btn btn-sm" ng-click="$ctrl.svc.alternarTema()" title="Alternar entre Modo Claro (Sépia 1920) e Modo Escuro">
              {{$ctrl.state.tema === 'dark' ? 'Modo Claro' : 'Modo Escuro'}}
            </button>
          </div>
        </div>
      </header>
    `
  });

  /* ==========================================================================
     COMPONENTE DO ASSISTENTE EM 9 PASSOS: <coc-wizard>
     (Com Progressive Disclosure para reduzir sobrecarga de informações)
     ========================================================================== */
  app.component('cocWizard', {
    controller: ['CocStateService', '$window', function (CocStateService, $window) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.R = $window.CoC7e.Regras;
      $ctrl.T = $window.CoC7e.TABELAS;
      $ctrl.OCUPACOES = $window.CoC7e.OCUPACOES;
      $ctrl.ARMAS_LIVRO = $window.CoC7e.ARMAS_LIVRO;

      $ctrl.armaSelecionadaId = $ctrl.ARMAS_LIVRO[1] ? $ctrl.ARMAS_LIVRO[1].id : 'revolver_38';
      $ctrl.equipCatalogoSelecionado = $ctrl.T.EQUIPAMENTOS_1920[0] ? $ctrl.T.EQUIPAMENTOS_1920[0].nome : '';
      $ctrl.equipCustomTexto = '';

      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };

      $ctrl.etapaInfo = function () {
        return CocStateService.ETAPAS_WIZARD.find(function (e) {
          return e.num === $ctrl.state.etapaWizard;
        }) || CocStateService.ETAPAS_WIZARD[0];
      };

      $ctrl.irParaEtapa = function (n) {
        $ctrl.state.etapaWizard = Math.max(1, Math.min(9, n));
        $ctrl.state.mostrarRegraLivroWizard = false;
      };

      $ctrl.aoMudarCampo = function (resetarAtuais) {
        const inv = $ctrl.inv();
        CocStateService.recalcularInvestigador(inv, { resetarAtuais: Boolean(resetarAtuais) });
        CocStateService.salvarEstado();
      };

      $ctrl.mq = function (valor) {
        return $ctrl.R.calcularMetadeQuinto(Number(valor) || 0);
      };

      // Etapa 2: Rolagens de Atributos
      $ctrl.rolarTodosAtributos = function () {
        const inv = $ctrl.inv();
        const metodo = inv.metodoAtributos === 'arranjo_fixo' ? 'padrao' : inv.metodoAtributos;
        const res = $ctrl.R.rolarConjuntoAtributos(metodo);
        Object.keys(res.atributos).forEach(function (sigla) {
          inv.atributosBase[sigla] = res.atributos[sigla].valor;
        });
        inv.poolRolado = res.poolLivre || [];
        $ctrl.aoMudarCampo(true);
      };

      $ctrl.rolarAtributoUnico = function (sigla) {
        const inv = $ctrl.inv();
        const def = $ctrl.T.ATRIBUTOS.find(function (a) { return a.sigla === sigla; });
        if (def && def.tipoDado === '2D6+6') {
          inv.atributosBase[sigla] = $ctrl.R.rolarAtributo2D6Mais6().valor;
        } else {
          inv.atributosBase[sigla] = $ctrl.R.rolarAtributo3D6().valor;
        }
        $ctrl.aoMudarCampo(true);
      };

      $ctrl.aplicarArranjoPadrao = function () {
        const inv = $ctrl.inv();
        const padrao = { FOR: 50, CON: 50, TAM: 60, DES: 60, APA: 50, INT: 70, POD: 60, EDU: 80 };
        Object.assign(inv.atributosBase, padrao);
        $ctrl.aoMudarCampo(true);
      };

      // Etapa 3: Idade & Sorte
      $ctrl.regraIdade = function () {
        const inv = $ctrl.inv();
        return $ctrl.R.obterRegraIdade(Number(inv.identidade && inv.identidade.idade) || 28);
      };

      $ctrl.somaReducaoFisica = function () {
        const inv = $ctrl.inv();
        const reg = $ctrl.regraIdade();
        const aj = inv.idadeAjustes || {};
        return reg.atributosPenalidadeFisica.reduce(function (acc, s) {
          return acc + (Number(aj['reducao' + s]) || 0);
        }, 0);
      };

      $ctrl.rolarTestesMelhoriaEDU = function () {
        const inv = $ctrl.inv();
        const reg = $ctrl.regraIdade();
        const res = $ctrl.R.executarTestesMelhoriaEDU(inv.atributosBase.EDU, reg.testesMelhoriaEDU);
        inv.idadeAjustes.ganhoEDU = res.eduFinal - inv.atributosBase.EDU;
        inv.idadeAjustes.historicoTestesEDU = res.historico;
        $ctrl.aoMudarCampo(true);
      };

      $ctrl.rolarSorteInicial = function () {
        const inv = $ctrl.inv();
        const reg = $ctrl.regraIdade();
        const res = $ctrl.R.rolarSorteInicial(reg.duplaSorte);
        inv.idadeAjustes.sorteRolagem1 = res.rolagens[0].valor;
        inv.idadeAjustes.sorteRolagem2 = res.rolagens[1] ? res.rolagens[1].valor : 0;
        inv.idadeAjustes.sorteInicial = res.valorEscolhido;
        inv.derivados.sorteInicial = res.valorEscolhido;
        inv.derivados.sorteAtual = res.valorEscolhido;
        $ctrl.aoMudarCampo(false);
      };

      $ctrl.distribuirPenalidadeAutomatica = function () {
        const inv = $ctrl.inv();
        const reg = $ctrl.regraIdade();
        const atrs = reg.atributosPenalidadeFisica;
        const total = reg.penalidadeFisicaTotal;
        inv.idadeAjustes.reducaoFOR = 0;
        inv.idadeAjustes.reducaoCON = 0;
        inv.idadeAjustes.reducaoDES = 0;
        inv.idadeAjustes.reducaoTAM = 0;
        if (atrs.length > 0 && total > 0) {
          let rest = total;
          let i = 0;
          while (rest > 0) {
            const sigla = atrs[i % atrs.length];
            const passo = Math.min(5, rest);
            inv.idadeAjustes['reducao' + sigla] = (inv.idadeAjustes['reducao' + sigla] || 0) + passo;
            rest -= passo;
            i++;
          }
        }
        $ctrl.aoMudarCampo(true);
      };

      // Etapa 5: Ocupações
      $ctrl.ocupacaoAtual = function () {
        return CocStateService.obterOcupacaoAtual($ctrl.inv());
      };

      $ctrl.totaisPericias = function () {
        return CocStateService.calcularTotaisPericias($ctrl.inv());
      };

      $ctrl.totalEscolhasNecessarias = function () {
        const ocup = $ctrl.ocupacaoAtual();
        return (ocup.escolhas || []).reduce(function (acc, e) { return acc + (Number(e.qtd) || 0); }, 0);
      };

      $ctrl.aoMudarOcupacao = function () {
        const inv = $ctrl.inv();
        const novaOcup = $ctrl.ocupacaoAtual();
        inv.ocupacaoPericiasEscolhidas = [];
        if (novaOcup.especializacoesSugeridas) {
          novaOcup.especializacoesSugeridas.forEach(function (sug) {
            const pFam = (inv.pericias || []).find(function (p) { return p.familia === sug.familia; });
            if (pFam) {
              pFam.especializacao = sug.valor;
              pFam.nome = pFam.familia + ' (' + sug.valor + ')';
            }
          });
        }
        $ctrl.aoMudarCampo(false);
      };

      $ctrl.alternarEscolhaOcupacional = function (periciaId) {
        const inv = $ctrl.inv();
        inv.ocupacaoPericiasEscolhidas = inv.ocupacaoPericiasEscolhidas || [];
        const idx = inv.ocupacaoPericiasEscolhidas.indexOf(periciaId);
        if (idx >= 0) {
          inv.ocupacaoPericiasEscolhidas.splice(idx, 1);
        } else {
          inv.ocupacaoPericiasEscolhidas.push(periciaId);
        }
        CocStateService.salvarEstado();
      };

      $ctrl.periciasParaEscolhaOcupacional = function () {
        const inv = $ctrl.inv();
        const ocup = $ctrl.ocupacaoAtual();
        const fixas = ocup.periciasFixas || [];
        const termo = ($ctrl.state.buscaEscolhaOcupacional || '').toLowerCase().trim();
        return (inv.pericias || []).filter(function (p) {
          if (p.id === 'nivel_de_credito' || p.id === 'mythos_de_cthulhu') return false;
          if (fixas.includes(p.id)) return false;
          if (termo && !p.nome.toLowerCase().includes(termo)) return false;
          return true;
        });
      };

      // Etapa 6: Perícias Filtradas por Categoria / Tipo
      $ctrl.ehOcupacional = function (p) {
        return CocStateService.ehPericiaOcupacional($ctrl.inv(), p);
      };

      $ctrl.periciasFiltradasWizard = function () {
        const inv = $ctrl.inv();
        const filtro = $ctrl.state.filtroPericiaWizard;
        const busca = ($ctrl.state.buscaPericiaWizard || '').toLowerCase().trim();

        return (inv.pericias || []).filter(function (p) {
          if (busca && !p.nome.toLowerCase().includes(busca) && !(p.especializacao || '').toLowerCase().includes(busca)) {
            return false;
          }
          if (!busca) {
            if (filtro === 'ocupacionais') return $ctrl.ehOcupacional(p);
            if (filtro === 'investidas') return (Number(p.ocupacao) || 0) > 0 || (Number(p.interesse) || 0) > 0;
            if (filtro === 'combate' || filtro === 'investigacao' || filtro === 'social' || filtro === 'ciencias' || filtro === 'acao') {
              return CocStateService.obterCategoriaPericia(p) === filtro;
            }
          }
          return true;
        });
      };

      $ctrl.contarPericiasFiltro = function (tipo) {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return 0;
        if (tipo === 'ocupacionais') return inv.pericias.filter(function (p) { return $ctrl.ehOcupacional(p); }).length;
        if (tipo === 'investidas') return inv.pericias.filter(function (p) { return (Number(p.ocupacao) || 0) > 0 || (Number(p.interesse) || 0) > 0; }).length;
        return inv.pericias.length;
      };

      $ctrl.ajustarPontoPericia = function (p, campo, delta) {
        const inv = $ctrl.inv();
        const atual = Number(p[campo]) || 0;
        let novo = Math.max(0, atual + delta);
        const teto = inv.limitePericia75 ? 75 : 99;
        const outro = campo === 'ocupacao' ? (Number(p.interesse) || 0) : (Number(p.ocupacao) || 0);
        const maxPermitido = Math.max(0, teto - (Number(p.base) || 0) - outro - (Number(p.outros) || 0));
        if (novo > maxPermitido) novo = maxPermitido;
        p[campo] = novo;
        $ctrl.aoMudarCampo(false);
      };

      $ctrl.validarAlocacaoPericia = function (p, campo) {
        const inv = $ctrl.inv();
        let val = Math.max(0, Math.floor(Number(p[campo]) || 0));
        const teto = inv.limitePericia75 ? 75 : 99;
        const outro = campo === 'ocupacao' ? (Number(p.interesse) || 0) : (Number(p.ocupacao) || 0);
        const maxPermitido = Math.max(0, teto - (Number(p.base) || 0) - outro - (Number(p.outros) || 0));
        if (val > maxPermitido) val = maxPermitido;
        p[campo] = val;
        $ctrl.aoMudarCampo(false);
      };

      $ctrl.atualizarRotuloEspecializacao = function (p) {
        const esp = (p.especializacao || '').trim();
        if (p.id === 'lingua_nativa') {
          p.nome = esp ? 'Língua (Nativa: ' + esp + ')' : 'Língua (Nativa)';
        } else {
          p.nome = esp ? p.familia + ' (' + esp + ')' : p.familia;
        }
        CocStateService.salvarEstado();
      };

      $ctrl.removerPericiaCustom = function (p) {
        const inv = $ctrl.inv();
        inv.pericias = (inv.pericias || []).filter(function (x) { return x.id !== p.id; });
        CocStateService.salvarEstado();
      };

      // Etapa 7: Antecedentes em Acordeão
      $ctrl.sortearAntecedente = function (chave) {
        const inv = $ctrl.inv();
        inv.antecedentes = inv.antecedentes || {};
        if (chave === 'ideologiaCrencas') {
          inv.antecedentes.ideologiaCrencas = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_IDEOLOGIA).item;
        } else if (chave === 'pessoasSignificativas') {
          const quem = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_PESSOAS_QUEM).item;
          const porque = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_PESSOAS_PORQUE).item;
          inv.antecedentes.pessoasSignificativas = quem + ' — ' + porque;
        } else if (chave === 'locaisImportantes') {
          inv.antecedentes.locaisImportantes = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_LOCAIS).item;
        } else if (chave === 'pertencesQueridos') {
          inv.antecedentes.pertencesQueridos = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_PERTENCES).item;
        } else if (chave === 'caracteristicas') {
          inv.antecedentes.caracteristicas = $ctrl.R.sortearItemTabela($ctrl.T.ANTECEDENTES_CARACTERISTICAS).item;
        } else if (chave === 'descricaoPessoal') {
          const opcoes = [
            'Olhar atento, roupas clássicas de tweed bem passadas e voz grave.',
            'Postura ereta, cicatriz discreta no queixo e óculos de aro redondo.',
            'Trajes elegantes dos anos 1920, mãos manchadas de tinta e expressão curiosa.',
            'Sobretudo impermeável gasto, chapéu escuro e passos silenciosos.'
          ];
          inv.antecedentes.descricaoPessoal = $ctrl.R.sortearItemTabela(opcoes).item;
        }
        $ctrl.state.cardAntecedenteAberto = chave;
        CocStateService.salvarEstado();
      };

      $ctrl.sortearTodosAntecedentes = function () {
        ['descricaoPessoal', 'ideologiaCrencas', 'pessoasSignificativas', 'locaisImportantes', 'pertencesQueridos', 'caracteristicas'].forEach(function (ch) {
          $ctrl.sortearAntecedente(ch);
        });
      };

      // Etapa 8: Finanças, Armas e Equipamentos
      $ctrl.financas1920 = function () {
        const tot = $ctrl.totaisPericias();
        return $ctrl.R.calcularFinancas1920(tot.nivelCredito);
      };

      $ctrl.adicionarArmaCatalogo = function () {
        const inv = $ctrl.inv();
        const modelo = $ctrl.ARMAS_LIVRO.find(function (a) { return a.id === $ctrl.armaSelecionadaId; });
        if (!modelo) return;
        inv.armas = inv.armas || [];
        inv.armas.push(angular.copy(modelo));
        CocStateService.salvarEstado();
      };

      $ctrl.removerArma = function (idx) {
        const inv = $ctrl.inv();
        inv.armas.splice(idx, 1);
        CocStateService.salvarEstado();
      };

      $ctrl.adicionarEquipCatalogo = function () {
        const inv = $ctrl.inv();
        if ($ctrl.equipCatalogoSelecionado) {
          inv.equipamentos = inv.equipamentos || [];
          inv.equipamentos.push($ctrl.equipCatalogoSelecionado);
          CocStateService.salvarEstado();
        }
      };

      $ctrl.adicionarEquipCustom = function () {
        const inv = $ctrl.inv();
        const txt = ($ctrl.equipCustomTexto || '').trim();
        if (txt) {
          inv.equipamentos = inv.equipamentos || [];
          inv.equipamentos.push(txt);
          $ctrl.equipCustomTexto = '';
          CocStateService.salvarEstado();
        }
      };

      $ctrl.removerEquipamento = function (idx) {
        const inv = $ctrl.inv();
        inv.equipamentos.splice(idx, 1);
        CocStateService.salvarEstado();
      };

      // Etapa 9: Checklist de Revisão
      $ctrl.obterChecksRevisao = function () {
        const inv = $ctrl.inv();
        const tot = $ctrl.totaisPericias();
        const idade = Number(inv.identidade && inv.identidade.idade) || 28;
        const reg = $ctrl.regraIdade();
        const somaRed = $ctrl.somaReducaoFisica();

        return [
          {
            ok: Boolean(inv.identidade && inv.identidade.nome && inv.identidade.nome.trim().length > 0),
            texto: 'Identidade preenchida (' + (inv.identidade.nome || 'Sem nome') + ', ' + idade + ' anos, ' + inv.ocupacaoNome + ')'
          },
          {
            ok: somaRed === reg.penalidadeFisicaTotal,
            texto: 'Modificadores físicos de idade aplicados (' + somaRed + '/' + reg.penalidadeFisicaTotal + ' pts reduzidos)'
          },
          {
            ok: tot.restantesOcupacao === 0,
            texto: 'Pontos de Perícias Ocupacionais distribuídos (' + tot.gastosOcupacao + '/' + tot.totalOcupacao + ' pts)'
          },
          {
            ok: tot.restantesInteresse === 0,
            texto: 'Pontos de Interesses Pessoais distribuídos (' + tot.gastosInteresse + '/' + tot.totalInteresse + ' pts)'
          },
          {
            ok: tot.creditoValido,
            texto: 'Nível de Crédito (' + tot.nivelCredito + '%) na faixa de ' + inv.ocupacaoNome + ' (' + tot.creditoMin + '%–' + tot.creditoMax + '%)'
          },
          {
            ok: Boolean(inv.antecedentes && inv.antecedentes.conexaoChave),
            texto: 'Conexão-Chave definida nos Antecedentes ( ' + ((inv.antecedentes && inv.antecedentes.conexaoChave) || 'Não definida') + ')'
          }
        ];
      };
    }],
    template: `
      <!-- Barra de Progresso Enxuta -->
      <nav class="wizard-progress" aria-label="Etapas de Criação do Investigador">
        <ol class="wizard-steps-list">
          <li ng-repeat="e in $ctrl.svc.ETAPAS_WIZARD track by e.num">
            <button type="button"
              class="wizard-step-btn"
              ng-class="{'active': $ctrl.state.etapaWizard === e.num, 'completed': $ctrl.state.etapaWizard > e.num}"
              ng-click="$ctrl.irParaEtapa(e.num)">
              <span class="step-num">{{$ctrl.state.etapaWizard > e.num ? '' : e.num}}</span>
              <span>{{e.curto}}</span>
            </button>
          </li>
        </ol>
        <div class="wizard-progress-bar-track" aria-hidden="true">
          <div class="wizard-progress-bar-fill" ng-style="{'width': (($ctrl.state.etapaWizard / 9) * 100) + '%'}"></div>
        </div>
      </nav>

      <!-- Quadro Principal da Etapa -->
      <section class="deco-frame">
        <header class="step-header">
          <div>
            <h2 class="step-title">{{$ctrl.etapaInfo().titulo}}</h2>
            <p class="step-desc">{{$ctrl.etapaInfo().resumo}}</p>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn btn-sm"
              ng-click="$ctrl.state.mostrarRegraLivroWizard = !$ctrl.state.mostrarRegraLivroWizard">
              {{$ctrl.state.mostrarRegraLivroWizard ? 'Ocultar Regras do Livro' : 'Ver Regras do Livro'}}
            </button>
            <span class="attr-formula-badge">Passo {{$ctrl.state.etapaWizard}} de 9</span>
          </div>
        </header>

        <!-- Progressive Disclosure: Nota de Regra do Livro recolhida por padrão -->
        <div class="alert" ng-if="$ctrl.state.mostrarRegraLivroWizard">
          <strong>Referência do Livro Básico (7ª Edição):</strong> {{$ctrl.etapaInfo().regraLivro}}
        </div>

        <!-- ==================== ETAPA 1: IDENTIDADE ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 1">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="w-nome">Nome do Investigador</label>
              <input id="w-nome" type="text" class="form-input"
                ng-model="$ctrl.inv().identidade.nome"
                ng-change="$ctrl.svc.salvarEstado()"
                placeholder="Ex.: Arthur Pendelton, Evelyn Moore..." />
            </div>

            <div class="form-group">
              <label class="form-label" for="w-jogador">Nome do(a) Jogador(a)</label>
              <input id="w-jogador" type="text" class="form-input"
                ng-model="$ctrl.inv().identidade.jogador"
                ng-change="$ctrl.svc.salvarEstado()"
                placeholder="Seu nome na mesa" />
            </div>

            <div class="form-group">
              <label class="form-label" for="w-idade">
                <span>Idade (15 a 90 anos)</span>
                <span class="attr-formula-badge">{{$ctrl.regraIdade().rotulo}}</span>
              </label>
              <input id="w-idade" type="number" min="15" max="90" class="form-input"
                ng-model="$ctrl.inv().identidade.idade"
                ng-change="$ctrl.aoMudarCampo(false)" />
              <span class="form-hint">{{$ctrl.regraIdade().descricao}}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="w-sexo">Sexo / Pronomes</label>
              <input id="w-sexo" type="text" class="form-input"
                ng-model="$ctrl.inv().identidade.sexo"
                ng-change="$ctrl.svc.salvarEstado()" />
            </div>

            <div class="form-group">
              <label class="form-label" for="w-res">Residência Atual (Anos 1920)</label>
              <input id="w-res" type="text" class="form-input"
                ng-model="$ctrl.inv().identidade.residencia"
                ng-change="$ctrl.svc.salvarEstado()"
                placeholder="Ex.: Arkham, Massachusetts" />
            </div>

            <div class="form-group">
              <label class="form-label" for="w-nasc">Local de Nascimento</label>
              <input id="w-nasc" type="text" class="form-input"
                ng-model="$ctrl.inv().identidade.nascimento"
                ng-change="$ctrl.svc.salvarEstado()"
                placeholder="Ex.: Boston, Massachusetts" />
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 2: CARACTERÍSTICAS ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 2">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem; background:var(--bg-elevated); padding:0.65rem 0.85rem; border-radius:4px;">
            <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
              <strong>Método:</strong>
              <select class="form-select" style="padding:0.35rem 0.6rem; font-size:0.88rem;"
                ng-model="$ctrl.inv().metodoAtributos"
                ng-change="$ctrl.svc.salvarEstado()">
                <option value="manual">Digitar Manualmente</option>
                <option value="padrao">Rolagem Oficial (3D6×5 e (2D6+6)×5)</option>
                <option value="distribuicao_livre">Rolar Pool e Distribuir Livremente</option>
                <option value="arranjo_fixo">Conjunto Fixo (40, 50, 50, 50, 60, 60, 70, 80)</option>
                <option value="rolar_4d6_descartar_menor">Opcional: 4D6 descarta menor (pág. 48)</option>
              </select>
            </div>

            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary btn-sm" ng-click="$ctrl.rolarTodosAtributos()">
                Rolar Todas as Características
              </button>
              <button type="button" class="btn btn-sm" ng-if="$ctrl.inv().metodoAtributos === 'arranjo_fixo'" ng-click="$ctrl.aplicarArranjoPadrao()">
                Aplicar Conjunto Fixo
              </button>
            </div>
          </div>

          <div class="alert" ng-if="$ctrl.inv().metodoAtributos === 'arranjo_fixo'">
            <strong>Conjunto Fixo (pág. 48):</strong> Distribua os 8 valores oficiais:
            <code>40, 50, 50, 50, 60, 60, 70, 80</code> entre as características abaixo.
          </div>

          <div class="grid-4">
            <div class="attr-card" ng-repeat="atr in $ctrl.T.ATRIBUTOS track by atr.sigla">
              <div class="attr-card-header">
                <div>
                  <span class="attr-sigla">{{atr.sigla}}</span>
                  <div style="font-size:0.8rem; color:var(--text-muted);">{{atr.nome}}</div>
                </div>
                <span class="attr-formula-badge">{{atr.formula}}</span>
              </div>

              <div class="attr-main-row" style="justify-content:space-between; margin:0.25rem 0;">
                <input type="number" min="15" max="99" step="1"
                  class="attr-value-input"
                  aria-label="{{atr.nome}} Base"
                  ng-model="$ctrl.inv().atributosBase[atr.sigla]"
                  ng-change="$ctrl.aoMudarCampo(true)" />

                <div class="coc-fraction-boxes" title="Metade (Difícil) e Quinto (Extremo)">
                  <div class="coc-fraction-box">
                    <span class="coc-fraction-label">½</span>
                    <span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosBase[atr.sigla]).metade}}</span>
                  </div>
                  <div class="coc-fraction-box">
                    <span class="coc-fraction-label">⅕</span>
                    <span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosBase[atr.sigla]).quinto}}</span>
                  </div>
                </div>

                <button type="button" class="btn btn-sm"
                  ng-click="$ctrl.rolarAtributoUnico(atr.sigla)"
                  title="Rolar {{atr.formula}} para {{atr.sigla}}">
                  
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 3: IDADE & SORTE (EM 3 SUB-ABAS FOCADAS) ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 3">
          <!-- Sub-Abas para eliminar sobrecarga vertical -->
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
            <div class="segmented-control">
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaIdade === 'edu'}"
                ng-click="$ctrl.state.subAbaIdade = 'edu'">
                1. Educação (EDU)
                <span class="segmented-badge">{{$ctrl.inv().atributosFinais.EDU}}%</span>
              </button>
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaIdade === 'fisico'}"
                ng-click="$ctrl.state.subAbaIdade = 'fisico'">
                2. Penalidade Física
                <span class="segmented-badge">
                  {{$ctrl.somaReducaoFisica() === $ctrl.regraIdade().penalidadeFisicaTotal ? '' : ($ctrl.somaReducaoFisica() + '/' + $ctrl.regraIdade().penalidadeFisicaTotal)}}
                </span>
              </button>
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaIdade === 'sorte'}"
                ng-click="$ctrl.state.subAbaIdade = 'sorte'">
                3. Sorte Inicial
                <span class="segmented-badge">{{$ctrl.inv().derivados.sorteInicial}}%</span>
              </button>
            </div>

            <div class="attr-formula-badge">
              Idade: <strong>{{$ctrl.inv().identidade.idade}} anos</strong> ({{$ctrl.regraIdade().rotulo}})
            </div>
          </div>

          <!-- Sub-aba 3.1: EDU -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaIdade === 'edu'">
            <h3 class="sheet-section-title">
              <span>Passo 3.1 — Ajuste de Educação (EDU)</span>
              <span>EDU Base: {{$ctrl.inv().atributosBase.EDU}} → Final: {{$ctrl.inv().atributosFinais.EDU}}</span>
            </h3>

            <div ng-if="$ctrl.regraIdade().penalidadeFixaEDU > 0" class="alert alert-warning">
              Jovens de 15 a 19 anos sofrem redução automática de <strong>-5 pontos em EDU</strong> (EDU Final: <strong>{{$ctrl.inv().atributosFinais.EDU}}</strong>).
            </div>

            <div ng-if="$ctrl.regraIdade().penalidadeFixaEDU === 0">
              <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.75rem; margin-bottom:0.75rem;">
                <div>
                  Sua faixa etária concede <strong>{{$ctrl.regraIdade().testesMelhoriaEDU}} teste(s) de melhoria de EDU</strong> (role 1D100; se for maior que EDU atual, soma +1D10).
                </div>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.rolarTestesMelhoriaEDU()">
                  Rolar {{$ctrl.regraIdade().testesMelhoriaEDU}} Teste(s) de EDU
                </button>
              </div>

              <div class="form-group" style="max-width:260px; margin-bottom:0.75rem;">
                <label class="form-label">Bônus Total Ganho em EDU (Editável)</label>
                <input type="number" min="0" max="60" class="form-input"
                  ng-model="$ctrl.inv().idadeAjustes.ganhoEDU"
                  ng-change="$ctrl.aoMudarCampo(true)" />
              </div>

              <div class="alert alert-success" ng-if="$ctrl.inv().idadeAjustes.historicoTestesEDU.length > 0">
                <strong>Resultado das Rolagens de EDU:</strong>
                <ul style="margin:0.35rem 0 0; padding-left:1.2rem; font-variant-numeric:tabular-nums; font-size:0.82rem;">
                  <li ng-repeat="h in $ctrl.inv().idadeAjustes.historicoTestesEDU track by $index">
                    Teste #{{h.teste}}: 1D100 = {{h.rolagem1d100}} (vs EDU {{h.eduAntes}}) →
                    {{h.melhorou ? ('MELHOROU +' + h.ganho1d10 + ' (EDU = ' + h.eduDepois + ')') : 'Mantido'}}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Sub-aba 3.2: Penalidade Física -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaIdade === 'fisico'">
            <h3 class="sheet-section-title">
              <span>Passo 3.2 — Penalidades Físicas e de Aparência</span>
              <span>Reduzido: {{$ctrl.somaReducaoFisica()}} / {{$ctrl.regraIdade().penalidadeFisicaTotal}} pts</span>
            </h3>

            <div ng-if="$ctrl.regraIdade().penalidadeFisicaTotal === 0" class="alert alert-success">
               Investigadores entre 20 e 39 anos não sofrem penalidades físicas nem redução de APA.
            </div>

            <div ng-if="$ctrl.regraIdade().penalidadeFisicaTotal > 0">
              <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:0.85rem;">
                <div>
                  Deduzir um total de <strong>{{$ctrl.regraIdade().penalidadeFisicaTotal}} pontos</strong> distribuídos entre
                  <strong>{{$ctrl.regraIdade().atributosPenalidadeFisica.join(', ')}}</strong>.
                  <span ng-if="$ctrl.regraIdade().penalidadeAPA > 0"> (APA reduz automaticamente em -{{$ctrl.regraIdade().penalidadeAPA}}).</span>
                </div>
                <button type="button" class="btn btn-sm" ng-click="$ctrl.distribuirPenalidadeAutomatica()">
                  Distribuir Automaticamente
                </button>
              </div>

              <div class="grid-3">
                <div class="attr-card" ng-repeat="sigla in $ctrl.regraIdade().atributosPenalidadeFisica track by sigla">
                  <div class="attr-card-header">
                    <span class="attr-sigla">Reduzir de {{sigla}}</span>
                    <span class="attr-formula-badge">Base: {{$ctrl.inv().atributosBase[sigla]}}</span>
                  </div>
                  <input type="number" min="0" max="80" class="form-input"
                    ng-model="$ctrl.inv().idadeAjustes['reducao' + sigla]"
                    ng-change="$ctrl.aoMudarCampo(true)" />
                  <span class="form-hint">{{sigla}} Final após idade: <strong>{{$ctrl.inv().atributosFinais[sigla]}}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub-aba 3.3: Sorte -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaIdade === 'sorte'">
            <h3 class="sheet-section-title">
              <span>Passo 3.3 — Rolagem de Sorte Inicial (3D6×5)</span>
              <span>Sorte Inicial: {{$ctrl.inv().derivados.sorteInicial}}%</span>
            </h3>

            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <button type="button" class="btn btn-gold" ng-click="$ctrl.rolarSorteInicial()">
                 {{$ctrl.regraIdade().duplaSorte ? 'Rolar Sorte 2 Vezes (Jovem 15–19 anos)' : 'Rolar Sorte (3D6×5)'}}
              </button>

              <div style="display:flex; align-items:center; gap:0.5rem;">
                <label class="form-label" style="margin:0;">Rolagem 1:</label>
                <input type="number" min="15" max="99" class="attr-value-input"
                  ng-model="$ctrl.inv().idadeAjustes.sorteRolagem1"
                  ng-change="$ctrl.aoMudarCampo(true)" />
              </div>

              <div style="display:flex; align-items:center; gap:0.5rem;" ng-if="$ctrl.regraIdade().duplaSorte">
                <label class="form-label" style="margin:0;">Rolagem 2 (Jovem):</label>
                <input type="number" min="15" max="99" class="attr-value-input"
                  ng-model="$ctrl.inv().idadeAjustes.sorteRolagem2"
                  ng-change="$ctrl.aoMudarCampo(true)" />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 4: ATRIBUTOS DERIVADOS ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 4">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            <span class="form-hint">Calculados automaticamente pelas tabelas da pág. 33.</span>
            <label class="filter-chip" ng-class="{'active': $ctrl.inv().derivados.overrideManual}" style="cursor:pointer;">
              <input type="checkbox" style="display:none;"
                ng-model="$ctrl.inv().derivados.overrideManual"
                ng-change="$ctrl.aoMudarCampo(false)" />
               {{$ctrl.inv().derivados.overrideManual ? 'Modo Regras da Casa Ativo (Editável)' : 'Editar Manualmente (Regras da Casa)'}}
            </label>
          </div>

          <div class="grid-3">
            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Pontos de Vida (PV)</span>
                <span class="attr-formula-badge">(CON + TAM) ÷ 10</span>
              </div>
              <div class="vital-big-number">{{$ctrl.inv().derivados.pvMax}} PV</div>
              <input type="number" class="form-input" ng-if="$ctrl.inv().derivados.overrideManual"
                ng-model="$ctrl.inv().derivados.pvMax"
                ng-change="$ctrl.inv().derivados.pvAtual = $ctrl.inv().derivados.pvMax; $ctrl.svc.salvarEstado()" />
            </div>

            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Sanidade (SAN)</span>
                <span class="attr-formula-badge">Igual a POD</span>
              </div>
              <div class="vital-big-number">{{$ctrl.inv().derivados.sanInicial}} / {{$ctrl.inv().derivados.sanMax}}</div>
              <input type="number" class="form-input" ng-if="$ctrl.inv().derivados.overrideManual"
                ng-model="$ctrl.inv().derivados.sanInicial"
                ng-change="$ctrl.inv().derivados.sanAtual = $ctrl.inv().derivados.sanInicial; $ctrl.svc.salvarEstado()" />
            </div>

            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Pontos de Magia (PM)</span>
                <span class="attr-formula-badge">POD ÷ 5</span>
              </div>
              <div class="vital-big-number">{{$ctrl.inv().derivados.pmMax}} PM</div>
              <input type="number" class="form-input" ng-if="$ctrl.inv().derivados.overrideManual"
                ng-model="$ctrl.inv().derivados.pmMax"
                ng-change="$ctrl.inv().derivados.pmAtual = $ctrl.inv().derivados.pmMax; $ctrl.svc.salvarEstado()" />
            </div>

            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Dano Extra &amp; Corpo</span>
                <span class="attr-formula-badge">FOR+TAM = {{$ctrl.inv().atributosFinais.FOR + $ctrl.inv().atributosFinais.TAM}}</span>
              </div>
              <div class="vital-big-number">DX: {{$ctrl.inv().derivados.danoExtra}} | Corpo: {{$ctrl.inv().derivados.corpo}}</div>
              <input type="text" class="form-input" ng-if="$ctrl.inv().derivados.overrideManual"
                ng-model="$ctrl.inv().derivados.danoExtra"
                ng-change="$ctrl.svc.salvarEstado()" />
            </div>

            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Taxa de Movimento (MOV)</span>
                <span class="attr-formula-badge">Pág. 33</span>
              </div>
              <div class="vital-big-number">MOV {{$ctrl.inv().derivados.mov}}</div>
              <input type="number" class="form-input" ng-if="$ctrl.inv().derivados.overrideManual"
                ng-model="$ctrl.inv().derivados.mov"
                ng-change="$ctrl.svc.salvarEstado()" />
            </div>

            <div class="attr-card">
              <div class="attr-card-header">
                <span class="attr-sigla">Esquiva Base</span>
                <span class="attr-formula-badge">DES ÷ 2</span>
              </div>
              <div class="vital-big-number">{{$ctrl.inv().derivados.esquivaBase}}%</div>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 5: OCUPAÇÃO ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 5">
          <div class="grid-2" style="margin-bottom:1rem;">
            <div class="form-group">
              <label class="form-label" for="sel-ocup">Selecionar Ocupação Clássica (73 Ocupações do Livro)</label>
              <select id="sel-ocup" class="form-select"
                ng-model="$ctrl.inv().ocupacaoId"
                ng-change="$ctrl.aoMudarOcupacao()">
                <option ng-repeat="o in $ctrl.OCUPACOES track by o.id" value="{{o.id}}">
                  {{o.nome}} — [{{o.formulaTexto}} | Crédito {{o.creditoMin}}–{{o.creditoMax}}%]
                </option>
                <option value="custom">Ocupação Personalizada (Criar Nova)</option>
              </select>
            </div>

            <div class="form-group" ng-if="$ctrl.ocupacaoAtual().formula.tipo === 'escolha'">
              <label class="form-label" for="sel-atr-ocup">Atributo Secundário da Fórmula ({{$ctrl.ocupacaoAtual().formulaTexto}})</label>
              <select id="sel-atr-ocup" class="form-select"
                ng-model="$ctrl.inv().ocupacaoAtributoEscolhido"
                ng-change="$ctrl.svc.salvarEstado()">
                <option ng-repeat="op in $ctrl.ocupacaoAtual().formula.opcoes track by op.atr" value="{{op.atr}}">
                  {{op.atr}} (Atual: {{$ctrl.inv().atributosFinais[op.atr]}} × {{op.mult}} = {{$ctrl.inv().atributosFinais[op.atr] * op.mult}} pts)
                </option>
              </select>
            </div>
          </div>

          <!-- Resumo da Ocupação -->
          <div class="sheet-section-box" style="margin-bottom:1rem;">
            <h3 class="sheet-section-title">
              <span>{{$ctrl.ocupacaoAtual().nome}}</span>
              <span>Total: {{$ctrl.totaisPericias().totalOcupacao}} Pontos de Ocupação</span>
            </h3>
            <div style="display:flex; flex-wrap:wrap; gap:1rem; font-size:0.9rem;">
              <div><strong>Fórmula:</strong> <code>{{$ctrl.totaisPericias().detalheOcupacao}}</code></div>
              <div><strong>Nível de Crédito:</strong> <code>{{$ctrl.ocupacaoAtual().creditoMin}}% a {{$ctrl.ocupacaoAtual().creditoMax}}%</code></div>
            </div>
          </div>

          <!-- Escolhas Opcionais de Perícias da Ocupação -->
          <div class="sheet-section-box" ng-if="$ctrl.totalEscolhasNecessarias() > 0">
            <h3 class="sheet-section-title">
              <span>Escolhas de Perícias da Ocupação ({{$ctrl.ocupacaoAtual().escolhas[0].rotulo}})</span>
              <span>Selecionadas: {{$ctrl.inv().ocupacaoPericiasEscolhidas.length}} / {{$ctrl.totalEscolhasNecessarias()}}</span>
            </h3>

            <div style="margin-bottom:0.65rem;">
              <input type="search" class="form-input" style="max-width:320px; padding:0.35rem 0.6rem; font-size:0.86rem;"
                placeholder="Filtrar perícia para marcar como ocupacional..."
                ng-model="$ctrl.state.buscaEscolhaOcupacional" />
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:0.4rem; max-height:240px; overflow-y:auto; padding:0.25rem;">
              <label ng-repeat="p in $ctrl.periciasParaEscolhaOcupacional() track by p.id"
                style="display:flex; align-items:center; gap:0.4rem; font-size:0.84rem; padding:0.3rem 0.5rem; border:1px solid var(--border-color); border-radius:3px; cursor:pointer; background:var(--bg-paper);">
                <input type="checkbox"
                  ng-checked="$ctrl.inv().ocupacaoPericiasEscolhidas.indexOf(p.id) >= 0"
                  ng-click="$ctrl.alternarEscolhaOcupacional(p.id)" />
                <span>{{p.nome}} ({{p.base}}%)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 6: DISTRIBUIÇÃO DE PERÍCIAS (COM CHIPS DE CATEGORIA) ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 6">
          <!-- Barra Flutuante de Contadores -->
          <div class="skills-counters-bar">
            <div class="counter-pill" ng-class="{'over-budget': $ctrl.totaisPericias().restantesOcupacao < 0}">
              <span>Ocupação:</span>
              <strong>{{$ctrl.totaisPericias().gastosOcupacao}} / {{$ctrl.totaisPericias().totalOcupacao}}</strong>
              <span style="font-size:0.78rem;">(Restam: {{$ctrl.totaisPericias().restantesOcupacao}})</span>
            </div>

            <div class="counter-pill" ng-class="{'over-budget': $ctrl.totaisPericias().restantesInteresse < 0}">
              <span>Interesses (INT×2):</span>
              <strong>{{$ctrl.totaisPericias().gastosInteresse}} / {{$ctrl.totaisPericias().totalInteresse}}</strong>
              <span style="font-size:0.78rem;">(Restam: {{$ctrl.totaisPericias().restantesInteresse}})</span>
            </div>

            <div class="counter-pill" ng-class="{'over-budget': !$ctrl.totaisPericias().creditoValido}">
              <span>Crédito:</span>
              <strong>{{$ctrl.totaisPericias().nivelCredito}}%</strong>
              <span style="font-size:0.78rem;">(Faixa: {{$ctrl.totaisPericias().creditoMin}}–{{$ctrl.totaisPericias().creditoMax}}%)</span>
            </div>
          </div>

          <!-- Filtros Inteligentes por Chips (Evita exibir 55 perícias de uma só vez) -->
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.65rem; margin-bottom:0.85rem; background:var(--bg-elevated); padding:0.65rem 0.85rem; border-radius:4px;">
            <div class="filter-chips-row">
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'ocupacionais' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'ocupacionais'; $ctrl.state.buscaPericiaWizard = ''">
                ⭐ Ocupacionais ({{$ctrl.contarPericiasFiltro('ocupacionais')}})
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'investidas' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'investidas'; $ctrl.state.buscaPericiaWizard = ''">
                Com Pontos ({{$ctrl.contarPericiasFiltro('investidas')}})
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'investigacao' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'investigacao'; $ctrl.state.buscaPericiaWizard = ''">
                Investigação
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'combate' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'combate'; $ctrl.state.buscaPericiaWizard = ''">
                Combate
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'social' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'social'; $ctrl.state.buscaPericiaWizard = ''">
                Sociais &amp; Línguas
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'ciencias' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'ciencias'; $ctrl.state.buscaPericiaWizard = ''">
                Ciências &amp; Ofícios
              </button>
              <button type="button" class="filter-chip"
                ng-class="{'active': $ctrl.state.filtroPericiaWizard === 'todas' && !$ctrl.state.buscaPericiaWizard}"
                ng-click="$ctrl.state.filtroPericiaWizard = 'todas'; $ctrl.state.buscaPericiaWizard = ''">
                Todas ({{$ctrl.inv().pericias.length}})
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
              <input type="search" class="form-input" style="padding:0.3rem 0.6rem; font-size:0.85rem; width:190px;"
                placeholder="Buscar perícia..."
                ng-model="$ctrl.state.buscaPericiaWizard" />
              <button type="button" class="btn btn-sm btn-primary" ng-click="$ctrl.state.modalAberto = 'especializacao'">
                + Especialização
              </button>
              <button type="button" class="btn btn-sm" ng-click="$ctrl.state.mostrarOpcoesRegraPericia = !$ctrl.state.mostrarOpcoesRegraPericia">
                Opções
              </button>
            </div>
          </div>

          <!-- Opções de Regra Recolhíveis -->
          <div class="alert" ng-if="$ctrl.state.mostrarOpcoesRegraPericia" style="display:flex; flex-wrap:wrap; gap:1.2rem; align-items:center;">
            <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
              <input type="checkbox" ng-model="$ctrl.inv().limitePericia75" ng-change="$ctrl.svc.salvarEstado()" />
              <span>Teto Opcional de 75% na Criação (pág. 48)</span>
            </label>
            <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
              <input type="checkbox" ng-model="$ctrl.inv().usarNatacao10" ng-change="$ctrl.aoMudarCampo(false)" />
              <span>Natação Base 10% (Ficha Impressa pág. 50)</span>
            </label>
            <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
              <input type="checkbox" ng-model="$ctrl.state.edicaoLivreOcupacional" />
              <span>Liberar Pontos de Ocupação em Qualquer Perícia</span>
            </label>
          </div>

          <!-- Tabela Enxuta das Perícias Filtradas -->
          <div class="skills-table-wrapper">
            <table class="skills-table">
              <thead>
                <tr>
                  <th>Perícia</th>
                  <th>Base</th>
                  <th>Pts Ocupação</th>
                  <th>Pts Interesse</th>
                  <th>Total (Reg)</th>
                  <th>½ / ⅕</th>
                </tr>
              </thead>
              <tbody>
                <tr ng-repeat="p in $ctrl.periciasFiltradasWizard() track by p.id" ng-class="{'is-occupational': $ctrl.ehOcupacional(p)}">
                  <td>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.3rem;">
                      <strong>{{p.nome}}</strong>
                      <span class="badge-occ" ng-if="$ctrl.ehOcupacional(p)">OCUP</span>
                      <button type="button" class="btn btn-sm" style="padding:0.05rem 0.35rem; font-size:0.7rem;"
                        ng-if="p.customAdded" ng-click="$ctrl.removerPericiaCustom(p)" title="Remover"></button>
                    </div>
                    <div ng-if="p.especializavel || p.permiteRotuloCustom" style="margin-top:0.2rem;">
                      <input type="text" class="form-input" style="padding:0.15rem 0.4rem; font-size:0.76rem; width:180px;"
                        placeholder="Especialidade / Idioma..."
                        ng-model="p.especializacao"
                        ng-change="$ctrl.atualizarRotuloEspecializacao(p)" />
                    </div>
                  </td>
                  <td style="font-variant-numeric:tabular-nums;">{{p.base}}%</td>
                  <td>
                    <div style="display:inline-flex; align-items:center; gap:0.2rem;">
                      <button type="button" class="hud-mini-btn"
                        ng-disabled="p.bloqueadaNaCriacao || (!$ctrl.ehOcupacional(p) && !$ctrl.state.edicaoLivreOcupacional)"
                        ng-click="$ctrl.ajustarPontoPericia(p, 'ocupacao', -5)">-5</button>
                      <input type="number" min="0" max="99" class="skill-num-input"
                        ng-model="p.ocupacao"
                        ng-change="$ctrl.validarAlocacaoPericia(p, 'ocupacao')"
                        ng-disabled="p.bloqueadaNaCriacao || (!$ctrl.ehOcupacional(p) && !$ctrl.state.edicaoLivreOcupacional)" />
                      <button type="button" class="hud-mini-btn"
                        ng-disabled="p.bloqueadaNaCriacao || (!$ctrl.ehOcupacional(p) && !$ctrl.state.edicaoLivreOcupacional)"
                        ng-click="$ctrl.ajustarPontoPericia(p, 'ocupacao', 5)">+5</button>
                    </div>
                  </td>
                  <td>
                    <div style="display:inline-flex; align-items:center; gap:0.2rem;">
                      <button type="button" class="hud-mini-btn"
                        ng-disabled="p.bloqueadaNaCriacao"
                        ng-click="$ctrl.ajustarPontoPericia(p, 'interesse', -5)">-5</button>
                      <input type="number" min="0" max="99" class="skill-num-input"
                        ng-model="p.interesse"
                        ng-change="$ctrl.validarAlocacaoPericia(p, 'interesse')"
                        ng-disabled="p.bloqueadaNaCriacao" />
                      <button type="button" class="hud-mini-btn"
                        ng-disabled="p.bloqueadaNaCriacao"
                        ng-click="$ctrl.ajustarPontoPericia(p, 'interesse', 5)">+5</button>
                    </div>
                  </td>
                  <td style="font-variant-numeric:tabular-nums; font-weight:bold;">
                    {{$ctrl.svc.obterTotalPericiaObj(p)}}%
                  </td>
                  <td style="font-variant-numeric:tabular-nums; font-size:0.8rem; color:var(--text-muted);">
                    {{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}% / {{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== ETAPA 7: ANTECEDENTES EM ACORDEÃO ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 7">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem; background:var(--bg-elevated); padding:0.65rem 0.85rem; border-radius:4px;">
            <div class="segmented-control">
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaAntecedentesWizard === 'essenciais'}"
                ng-click="$ctrl.state.subAbaAntecedentesWizard = 'essenciais'">
                Essenciais &amp; Personalidade (6)
              </button>
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaAntecedentesWizard === 'mythos'}"
                ng-click="$ctrl.state.subAbaAntecedentesWizard = 'mythos'">
                Cicatrizes, Fobias &amp; Mythos (4)
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <label for="w-con-chave" style="font-size:0.85rem; font-weight:bold;">Conexão-Chave:</label>
              <select id="w-con-chave" class="form-select" style="padding:0.3rem 0.5rem; font-size:0.85rem;"
                ng-model="$ctrl.inv().antecedentes.conexaoChave"
                ng-change="$ctrl.svc.salvarEstado()">
                <option value="Ideologia / Crenças">Ideologia / Crenças</option>
                <option value="Pessoas Significativas">Pessoas Significativas</option>
                <option value="Locais Importantes">Locais Importantes</option>
                <option value="Pertences Queridos">Pertences Queridos</option>
              </select>

              <button type="button" class="btn btn-primary btn-sm" ng-click="$ctrl.sortearTodosAntecedentes()">
                Sortear Todos (1D10)
              </button>
            </div>
          </div>

          <!-- Cartões de Acordeão: Apenas o cartão clicado abre a textarea -->
          <div class="lore-accordion-grid">
            <div class="lore-card"
              ng-repeat="c in $ctrl.svc.CAMPOS_ANTECEDENTES | filter:{grupo: $ctrl.state.subAbaAntecedentesWizard} track by c.chave"
              ng-class="{'is-key-connection': $ctrl.inv().antecedentes.conexaoChave === c.titulo}">

              <div class="lore-card-header" ng-click="$ctrl.state.cardAntecedenteAberto = ($ctrl.state.cardAntecedenteAberto === c.chave ? null : c.chave)">
                <div>
                  <strong>{{c.titulo}}</strong>
                  <span class="badge-occ" style="background:var(--accent-gold);" ng-if="$ctrl.inv().antecedentes.conexaoChave === c.titulo"> CHAVE</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <button type="button" class="btn btn-sm" ng-if="c.sorteavel"
                    ng-click="$event.stopPropagation(); $ctrl.sortearAntecedente(c.chave)">
                    Sortear 1D10
                  </button>
                  <span style="font-size:0.8rem; color:var(--text-muted);">
                    {{$ctrl.state.cardAntecedenteAberto === c.chave ? '▲ Recolher' : 'Editar'}}
                  </span>
                </div>
              </div>

              <div class="lore-card-preview"
                ng-if="$ctrl.state.cardAntecedenteAberto !== c.chave"
                ng-class="{'is-empty': !$ctrl.inv().antecedentes[c.chave]}"
                ng-click="$ctrl.state.cardAntecedenteAberto = c.chave">
                {{$ctrl.inv().antecedentes[c.chave] || ('Clique para escrever: ' + c.dica)}}
              </div>

              <div class="lore-card-editor" ng-if="$ctrl.state.cardAntecedenteAberto === c.chave">
                <textarea class="form-textarea" style="width:100%;"
                  ng-model="$ctrl.inv().antecedentes[c.chave]"
                  ng-change="$ctrl.svc.salvarEstado()"
                  placeholder="{{c.dica}}"></textarea>
                <span class="form-hint">{{c.dica}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 8: FINANÇAS, ARMAS E BENS (EM SUB-ABAS) ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 8">
          <div style="margin-bottom:1rem;">
            <div class="segmented-control">
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaEtapa8 === 'financas'}"
                ng-click="$ctrl.state.subAbaEtapa8 = 'financas'">
                Finanças 1920 ({{$ctrl.financas1920().padraoVida}})
              </button>
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaEtapa8 === 'armas'}"
                ng-click="$ctrl.state.subAbaEtapa8 = 'armas'">
                Armas ({{$ctrl.inv().armas.length}})
              </button>
              <button type="button" class="segmented-btn"
                ng-class="{'active': $ctrl.state.subAbaEtapa8 === 'equipamentos'}"
                ng-click="$ctrl.state.subAbaEtapa8 = 'equipamentos'">
                Equipamentos ({{$ctrl.inv().equipamentos.length}})
              </button>
            </div>
          </div>

          <!-- 8.1 Finanças -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaEtapa8 === 'financas'">
            <h3 class="sheet-section-title">
              <span>Dinheiro &amp; Recursos — Anos 1920 (Tabela II, págs. 46–47)</span>
              <span>Nível de Crédito: {{$ctrl.financas1920().nivelCredito}}%</span>
            </h3>
            <div class="grid-3" style="margin-bottom:0.75rem;">
              <div class="attr-card">
                <span class="attr-sigla">Nível de Gastos Diário</span>
                <div class="vital-big-number">{{$ctrl.financas1920().nivelGastosTexto}}</div>
              </div>
              <div class="attr-card">
                <span class="attr-sigla">Dinheiro em Mãos</span>
                <div class="vital-big-number" style="color:var(--accent-primary);">{{$ctrl.financas1920().dinheiroTexto}}</div>
              </div>
              <div class="attr-card">
                <span class="attr-sigla">Patrimônio Total</span>
                <div class="vital-big-number" style="color:var(--accent-gold);">{{$ctrl.financas1920().patrimonioTexto}}</div>
              </div>
            </div>
            <div class="alert" style="margin:0;">
              <strong>Acomodações:</strong> {{$ctrl.financas1920().acomodacoes}}<br/>
              <strong>Viagens:</strong> {{$ctrl.financas1920().viagem}}
            </div>
          </div>

          <!-- 8.2 Armas -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaEtapa8 === 'armas'">
            <h3 class="sheet-section-title">
              <span>Arsenal do Investigador (Tabela XVII, págs. 401–405)</span>
              <span>Dano Extra: {{$ctrl.inv().derivados.danoExtra}}</span>
            </h3>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.85rem;">
              <select class="form-select" style="flex:1; min-width:240px;" ng-model="$ctrl.armaSelecionadaId">
                <option ng-repeat="a in $ctrl.ARMAS_LIVRO track by a.id" value="{{a.id}}">
                  [{{a.categoria}}] {{a.nome}} — Dano: {{a.danoBase}} | Alcance: {{a.alcance}} ({{a.custo1920}})
                </option>
              </select>
              <button type="button" class="btn btn-primary" ng-click="$ctrl.adicionarArmaCatalogo()">+ Adicionar Arma</button>
            </div>

            <div class="skills-table-wrapper">
              <table class="skills-table">
                <thead>
                  <tr>
                    <th>Arma</th>
                    <th>Perícia</th>
                    <th>Reg / ½ / ⅕</th>
                    <th>Dano</th>
                    <th>Alcance</th>
                    <th>Munição</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr ng-repeat="arma in $ctrl.inv().armas track by $index">
                    <td><strong>{{arma.nome}}</strong></td>
                    <td>{{arma.periciaNome}}</td>
                    <td style="font-variant-numeric:tabular-nums; font-weight:bold;">
                      {{$ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)}}% /
                      {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).metade}}% /
                      {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).quinto}}%
                    </td>
                    <td style="font-variant-numeric:tabular-nums;">
                      {{$ctrl.R.formatarDanoArma(arma.danoBase, arma.somaDX, $ctrl.inv().derivados.danoExtra)}}
                    </td>
                    <td>{{arma.alcance}}</td>
                    <td>{{arma.municao}}</td>
                    <td>
                      <button type="button" class="btn btn-sm btn-danger" ng-if="$index > 0 || arma.id !== 'desarmado'" ng-click="$ctrl.removerArma($index)">Remover</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 8.3 Equipamentos -->
          <div class="sheet-section-box" ng-if="$ctrl.state.subAbaEtapa8 === 'equipamentos'">
            <h3 class="sheet-section-title">
              <span>Equipamentos &amp; Pertences (Anos 1920)</span>
              <span>{{$ctrl.inv().equipamentos.length}} item(ns)</span>
            </h3>
            <div class="grid-2" style="margin-bottom:0.85rem;">
              <div style="display:flex; gap:0.4rem;">
                <select class="form-select" style="flex:1;" ng-model="$ctrl.equipCatalogoSelecionado">
                  <option ng-repeat="eq in $ctrl.T.EQUIPAMENTOS_1920 track by $index" value="{{eq.nome}}">
                    [{{eq.categoria}}] {{eq.nome}} ({{eq.preco}})
                  </option>
                </select>
                <button type="button" class="btn" ng-click="$ctrl.adicionarEquipCatalogo()">+ Catálogo</button>
              </div>
              <div style="display:flex; gap:0.4rem;">
                <input type="text" class="form-input" style="flex:1;" placeholder="Item personalizado..." ng-model="$ctrl.equipCustomTexto" />
                <button type="button" class="btn btn-primary" ng-click="$ctrl.adicionarEquipCustom()">+ Adicionar</button>
              </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.45rem;">
              <span ng-repeat="item in $ctrl.inv().equipamentos track by $index"
                style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.3rem 0.65rem; background:var(--bg-paper); border:1px solid var(--border-strong); border-radius:4px; font-size:0.86rem;">
                {{item}}
                <button type="button" style="border:none; background:none; cursor:pointer; color:var(--accent-crimson); font-weight:bold;" ng-click="$ctrl.removerEquipamento($index)"></button>
              </span>
            </div>
          </div>
        </div>

        <!-- ==================== ETAPA 9: REVISÃO & CONCLUSÃO ==================== -->
        <div ng-if="$ctrl.state.etapaWizard === 9">
          <div class="alert alert-success">
            <strong>Checklist Automático de Regras (7ª Edição):</strong>
            <ul style="margin:0.4rem 0 0; padding-left:1.25rem;">
              <li ng-repeat="ck in $ctrl.obterChecksRevisao() track by $index">
                {{ck.ok ? '' : '️'}} {{ck.texto}}
              </li>
            </ul>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:0.65rem; margin-bottom:1.1rem;">
            <button type="button" class="btn btn-primary" ng-click="$ctrl.state.modo = 'ficha'">
              Abrir Ficha Viva de Jogo
            </button>
            <button type="button" class="btn btn-gold" ng-click="$ctrl.state.modalAberto = 'pdf'">
              Baixar Ficha Oficial (PDF Editável)
            </button>
            <button type="button" class="btn" ng-click="$ctrl.svc.exportarJSON($ctrl.inv())">
              Baixar JSON
            </button>
          </div>

          <div class="sheet-section-box">
            <h3 class="sheet-section-title">Resumo Executivo do Investigador</h3>
            <p style="margin:0 0 0.45rem;">
              <strong>{{$ctrl.inv().identidade.nome}}</strong> — {{$ctrl.inv().ocupacaoNome}}, {{$ctrl.inv().identidade.idade}} anos ({{$ctrl.inv().identidade.residencia}})
            </p>
            <p style="margin:0; font-variant-numeric:tabular-nums; font-size:0.86rem;">
              FOR {{$ctrl.inv().atributosFinais.FOR}}% | CON {{$ctrl.inv().atributosFinais.CON}}% | TAM {{$ctrl.inv().atributosFinais.TAM}}% | DES {{$ctrl.inv().atributosFinais.DES}}% |
              APA {{$ctrl.inv().atributosFinais.APA}}% | INT {{$ctrl.inv().atributosFinais.INT}}% | POD {{$ctrl.inv().atributosFinais.POD}}% | EDU {{$ctrl.inv().atributosFinais.EDU}}%
            </p>
          </div>
        </div>

        <!-- Rodapé do Wizard -->
        <footer class="wizard-footer">
          <button type="button" class="btn" ng-disabled="$ctrl.state.etapaWizard <= 1" ng-click="$ctrl.irParaEtapa($ctrl.state.etapaWizard - 1)">
            ← Etapa Anterior
          </button>

          <div style="display:flex; gap:0.5rem;">
            <button type="button" class="btn" ng-click="$ctrl.state.modo = 'ficha'">
              Ver na Ficha Viva
            </button>
            <button type="button" class="btn btn-primary" ng-if="$ctrl.state.etapaWizard < 9" ng-click="$ctrl.irParaEtapa($ctrl.state.etapaWizard + 1)">
              Próxima Etapa →
            </button>
            <button type="button" class="btn btn-primary" ng-if="$ctrl.state.etapaWizard === 9" ng-click="$ctrl.state.modo = 'ficha'">
              Concluir e Abrir Ficha Viva
            </button>
          </div>
        </footer>
      </section>
    `
  });

  /* ==========================================================================
     COMPONENTE DA FICHA VIVA: <coc-live-sheet>
     (Dividida em HUD Compacto + 6 Abas Focadas para eliminar sobrecarga visual)
     ========================================================================== */
  app.component('cocLiveSheet', {
    controller: ['CocStateService', '$window', function (CocStateService, $window) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.R = $window.CoC7e.Regras;
      $ctrl.T = $window.CoC7e.TABELAS;
      $ctrl.ARMAS_LIVRO = $window.CoC7e.ARMAS_LIVRO;

      $ctrl.danoGolpeInput = 1;
      $ctrl.perdaSanInput = 1;
      $ctrl.avisoVital = '';
      $ctrl.armaRapidaId = $ctrl.ARMAS_LIVRO[1] ? $ctrl.ARMAS_LIVRO[1].id : 'revolver_38';
      $ctrl.novoEquipTexto = '';
      $ctrl.novoCompNome = '';
      $ctrl.novoCompNotas = '';

      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };

      $ctrl.mq = function (valor) {
        return $ctrl.R.calcularMetadeQuinto(Number(valor) || 0);
      };

      $ctrl.ajustarVital = function (campo, maxCampo, delta) {
        const inv = $ctrl.inv();
        const maxVal = Number(inv.derivados[maxCampo]) || 99;
        inv.derivados[campo] = Math.max(0, Math.min(maxVal, (Number(inv.derivados[campo]) || 0) + delta));
        if (campo === 'pvAtual' && inv.derivados.pvAtual === 0) {
          inv.derivados.inconsciente = true;
          if (inv.derivados.lesaoGrave) inv.derivados.morrendo = true;
        }
        CocStateService.salvarEstado();
      };

      $ctrl.aplicarGolpeUnico = function () {
        const inv = $ctrl.inv();
        const res = $ctrl.R.aplicarDanoPV(inv.derivados.pvAtual, inv.derivados.pvMax, Number($ctrl.danoGolpeInput) || 0, inv.derivados.lesaoGrave);
        inv.derivados.pvAtual = res.pvNovo;
        inv.derivados.lesaoGrave = res.lesaoGrave;
        if (res.inconsciente) inv.derivados.inconsciente = true;
        if (res.morrendo) inv.derivados.morrendo = true;
        $ctrl.avisoVital = res.avisos.length > 0 ? res.avisos.join(' | ') : ('Dano de ' + $ctrl.danoGolpeInput + ' PV aplicado.');
        CocStateService.salvarEstado();
      };

      $ctrl.aplicarPerdaSanidade = function () {
        const inv = $ctrl.inv();
        const res = $ctrl.R.aplicarPerdaSanidade(inv.derivados.sanAtual, Number($ctrl.perdaSanInput) || 0);
        inv.derivados.sanAtual = res.sanNova;
        if (res.insanidadeTemporaria) inv.derivados.insanidadeTemporaria = true;
        if (res.insanidadeIndefinida) inv.derivados.insanidadeIndefinida = true;
        $ctrl.avisoVital = res.avisos.length > 0 ? res.avisos.join(' | ') : ('Perda de ' + $ctrl.perdaSanInput + ' SAN registrada.');
        CocStateService.salvarEstado();
      };

      $ctrl.ehOcupacional = function (p) {
        return CocStateService.ehPericiaOcupacional($ctrl.inv(), p);
      };

      // Perícias em Destaque (Ocupacionais, Marcadas ou >= 25%)
      $ctrl.periciasDestaque = function () {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return [];
        return inv.pericias.filter(function (p) {
          const tot = CocStateService.obterTotalPericiaObj(p);
          return $ctrl.ehOcupacional(p) || p.marcada || tot >= 25;
        });
      };

      // Top 8 maiores perícias para o painel de Resumo
      $ctrl.topPericiasResumo = function () {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return [];
        const copia = inv.pericias.slice().sort(function (a, b) {
          return CocStateService.obterTotalPericiaObj(b) - CocStateService.obterTotalPericiaObj(a);
        });
        return copia.slice(0, 8);
      };

      $ctrl.periciasPorCategoriaFicha = function (cat) {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return [];
        return inv.pericias.filter(function (p) {
          return CocStateService.obterCategoriaPericia(p) === cat;
        });
      };

      $ctrl.periciasBuscaFicha = function () {
        const inv = $ctrl.inv();
        const termo = ($ctrl.state.buscaPericiaFicha || '').toLowerCase().trim();
        if (!inv || !inv.pericias) return [];
        const lista = inv.pericias.slice().sort(function (a, b) {
          return a.nome.localeCompare(b.nome, 'pt-BR');
        });
        if (!termo) return lista;
        return lista.filter(function (p) {
          return p.nome.toLowerCase().includes(termo) || (p.especializacao || '').toLowerCase().includes(termo);
        });
      };

      $ctrl.atualizarTotalPericiaDireto = function (p, novoTotal) {
        const val = Math.max(0, Math.min(99, Math.floor(Number(novoTotal) || 0)));
        const somaSemOutros = (Number(p.base) || 0) + (Number(p.ocupacao) || 0) + (Number(p.interesse) || 0);
        p.outros = val - somaSemOutros;
        CocStateService.recalcularInvestigador($ctrl.inv(), { resetarAtuais: false });
        CocStateService.salvarEstado();
      };

      $ctrl.financas1920 = function () {
        const inv = $ctrl.inv();
        const cred = CocStateService.obterTotalPericia(inv, 'nivel_de_credito');
        return $ctrl.R.calcularFinancas1920(cred);
      };

      $ctrl.adicionarArmaFicha = function () {
        const inv = $ctrl.inv();
        const modelo = $ctrl.ARMAS_LIVRO.find(function (a) { return a.id === $ctrl.armaRapidaId; });
        if (!modelo) return;
        inv.armas = inv.armas || [];
        inv.armas.push(angular.copy(modelo));
        CocStateService.salvarEstado();
      };

      $ctrl.adicionarEquipFicha = function () {
        const inv = $ctrl.inv();
        const txt = ($ctrl.novoEquipTexto || '').trim();
        if (txt) {
          inv.equipamentos = inv.equipamentos || [];
          inv.equipamentos.push(txt);
          $ctrl.novoEquipTexto = '';
          CocStateService.salvarEstado();
        }
      };

      $ctrl.adicionarCompanheiro = function () {
        const inv = $ctrl.inv();
        const nome = ($ctrl.novoCompNome || '').trim();
        if (!nome) return;
        inv.companheiros = inv.companheiros || [];
        inv.companheiros.push({ nome: nome, notas: ($ctrl.novoCompNotas || '').trim() });
        $ctrl.novoCompNome = '';
        $ctrl.novoCompNotas = '';
        CocStateService.salvarEstado();
      };
    }],
    template: `
      <div class="sheet-clean-container">
        <!-- 1. HUD COMPACTO DE STATUS VITAL (Sempre visível, sem ocupar meia tela) -->
        <section class="hud-status-bar" aria-label="Status Rápido do Investigador">
          <div class="hud-identity">
            <div class="hud-identity-name">{{$ctrl.inv().identidade.nome || 'Investigador Sem Nome'}}</div>
            <div class="hud-identity-sub">{{$ctrl.inv().ocupacaoNome}} • {{$ctrl.inv().identidade.idade}} anos • MOV {{$ctrl.inv().derivados.mov}}</div>
          </div>

          <!-- Pílula PV -->
          <div class="hud-vital-pill" ng-class="{'critical-state': $ctrl.inv().derivados.lesaoGrave || $ctrl.inv().derivados.morrendo}">
            <div class="hud-vital-info">
              <span class="hud-vital-label">Pontos de Vida (PV)</span>
              <span class="hud-vital-val">{{$ctrl.inv().derivados.pvAtual}} / {{$ctrl.inv().derivados.pvMax}}</span>
            </div>
            <div class="hud-vital-btns">
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('pvAtual', 'pvMax', -1)" title="-1 PV">−</button>
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('pvAtual', 'pvMax', 1)" title="+1 PV">+</button>
            </div>
          </div>

          <!-- Pílula Sanidade -->
          <div class="hud-vital-pill" ng-class="{'critical-state': $ctrl.inv().derivados.insanidadeTemporaria || $ctrl.inv().derivados.insanidadeIndefinida}">
            <div class="hud-vital-info">
              <button type="button" class="roll-trigger-btn hud-vital-label"
                ng-click="$ctrl.svc.rolarPericiaOuAtributo('Sanidade (SAN)', $ctrl.inv().derivados.sanAtual, {ehTesteSanidade: true})"
                title="Clique para Rolar Teste de Sanidade (1D100)">
                Sanidade (SAN)
              </button>
              <span class="hud-vital-val">{{$ctrl.inv().derivados.sanAtual}} / {{$ctrl.inv().derivados.sanMax}}</span>
            </div>
            <div class="hud-vital-btns">
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('sanAtual', 'sanMax', -1)" title="-1 SAN">−</button>
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('sanAtual', 'sanMax', 1)" title="+1 SAN">+</button>
            </div>
          </div>

          <!-- Pílula Magia -->
          <div class="hud-vital-pill">
            <div class="hud-vital-info">
              <span class="hud-vital-label">Pontos de Magia (PM)</span>
              <span class="hud-vital-val">{{$ctrl.inv().derivados.pmAtual}} / {{$ctrl.inv().derivados.pmMax}}</span>
            </div>
            <div class="hud-vital-btns">
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('pmAtual', 'pmMax', -1)" title="-1 PM">−</button>
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('pmAtual', 'pmMax', 1)" title="+1 PM">+</button>
            </div>
          </div>

          <!-- Pílula Sorte -->
          <div class="hud-vital-pill">
            <div class="hud-vital-info">
              <button type="button" class="roll-trigger-btn hud-vital-label"
                ng-click="$ctrl.svc.rolarPericiaOuAtributo('Sorte', $ctrl.inv().derivados.sorteAtual, {ehTesteSorte: true})"
                title="Clique para Rolar Teste de Sorte (1D100)">
                Sorte
              </button>
              <span class="hud-vital-val">{{$ctrl.inv().derivados.sorteAtual}}%</span>
            </div>
            <div class="hud-vital-btns">
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('sorteAtual', 'sanMax', -1)" title="-1 Sorte">−</button>
              <button type="button" class="hud-mini-btn" ng-click="$ctrl.ajustarVital('sorteAtual', 'sanMax', 1)" title="+1 Sorte">+</button>
            </div>
          </div>

          <!-- Botão de Expansão de Condições e Calculadora de Golpe/Trauma -->
          <div>
            <button type="button" class="btn btn-sm"
              ng-class="{'btn-danger': $ctrl.state.painelVitaisAberto}"
              ng-click="$ctrl.state.painelVitaisAberto = !$ctrl.state.painelVitaisAberto"
              title="Expandir calculadora de Golpe Único (Lesão Grave), Perda de Sanidade e Condições">
               {{$ctrl.state.painelVitaisAberto ? 'Fechar Condições' : 'Dano / Condições'}}
            </button>
          </div>
        </section>

        <!-- PAINEL RECOLHÍVEL DE GOLPE, TRAUMA DE SANIDADE E CONDIÇÕES (Progressive Disclosure) -->
        <div class="deco-frame" style="margin-bottom:0.9rem; padding:0.9rem;" ng-if="$ctrl.state.painelVitaisAberto">
          <div class="grid-2">
            <div>
              <strong style="display:block; margin-bottom:0.4rem;">Sofrer Golpe Único (Verifica Lesão Grave ≥ ½ PV Máx):</strong>
              <div style="display:flex; gap:0.4rem; align-items:center; margin-bottom:0.5rem;">
                <input type="number" min="1" max="99" class="form-input" style="width:80px; padding:0.3rem;" ng-model="$ctrl.danoGolpeInput" />
                <button type="button" class="btn btn-danger btn-sm" ng-click="$ctrl.aplicarGolpeUnico()">Aplicar Golpe em PV</button>
              </div>
              <div class="vital-flags">
                <label class="vital-flag-label" ng-class="{'flag-active': $ctrl.inv().derivados.lesaoGrave}">
                  <input type="checkbox" ng-model="$ctrl.inv().derivados.lesaoGrave" ng-change="$ctrl.svc.salvarEstado()" /> Lesão Grave
                </label>
                <label class="vital-flag-label" ng-class="{'flag-active': $ctrl.inv().derivados.inconsciente}">
                  <input type="checkbox" ng-model="$ctrl.inv().derivados.inconsciente" ng-change="$ctrl.svc.salvarEstado()" /> Inconsciente
                </label>
                <label class="vital-flag-label" ng-class="{'flag-active': $ctrl.inv().derivados.morrendo}">
                  <input type="checkbox" ng-model="$ctrl.inv().derivados.morrendo" ng-change="$ctrl.svc.salvarEstado()" /> Morrendo
                </label>
              </div>
            </div>

            <div>
              <strong style="display:block; margin-bottom:0.4rem;">Perda de Sanidade (Verifica ≥ 5 pts = Insanidade Temp.):</strong>
              <div style="display:flex; gap:0.4rem; align-items:center; margin-bottom:0.5rem;">
                <input type="number" min="1" max="99" class="form-input" style="width:80px; padding:0.3rem;" ng-model="$ctrl.perdaSanInput" />
                <button type="button" class="btn btn-primary btn-sm" ng-click="$ctrl.aplicarPerdaSanidade()">Registrar Perda SAN</button>
              </div>
              <div class="vital-flags">
                <label class="vital-flag-label" ng-class="{'flag-active': $ctrl.inv().derivados.insanidadeTemporaria}">
                  <input type="checkbox" ng-model="$ctrl.inv().derivados.insanidadeTemporaria" ng-change="$ctrl.svc.salvarEstado()" /> Insanidade Temporária
                </label>
                <label class="vital-flag-label" ng-class="{'flag-active': $ctrl.inv().derivados.insanidadeIndefinida}">
                  <input type="checkbox" ng-model="$ctrl.inv().derivados.insanidadeIndefinida" ng-change="$ctrl.svc.salvarEstado()" /> Insanidade Indefinida
                </label>
              </div>
            </div>
          </div>

          <div class="alert alert-warning" style="margin:0.65rem 0 0;" ng-if="$ctrl.avisoVital">
            <strong>Resultado:</strong> {{$ctrl.avisoVital}}
          </div>
        </div>

        <!-- 2. BARRA DE NAVEGAÇÃO EM 6 ABAS FOCADAS (Elimina sobrecarga de Página 1 + Página 2 simultâneas) -->
        <nav class="sheet-toolbar" aria-label="Seções da Ficha Viva">
          <div class="segmented-control">
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'resumo'}"
              ng-click="$ctrl.state.abaFicha = 'resumo'">
              Atributos &amp; Resumo
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'pericias'}"
              ng-click="$ctrl.state.abaFicha = 'pericias'">
              Perícias
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'combate'}"
              ng-click="$ctrl.state.abaFicha = 'combate'">
              Combate ({{$ctrl.inv().armas.length}})
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'antecedentes'}"
              ng-click="$ctrl.state.abaFicha = 'antecedentes'">
              Antecedentes
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'inventario'}"
              ng-click="$ctrl.state.abaFicha = 'inventario'">
              Inventário &amp; Finanças
            </button>
            <button type="button" class="segmented-btn"
              ng-class="{'active': $ctrl.state.abaFicha === 'folha2p'}"
              ng-click="$ctrl.state.abaFicha = 'folha2p'">
              Folha Oficial (2P)
            </button>
          </div>

          <!-- Seletor Rápido de Dados de Bônus / Penalidade -->
          <div style="display:flex; align-items:center; gap:0.35rem; font-size:0.82rem;">
            <span style="color:var(--text-muted); font-weight:bold;">Modificador 1D100:</span>
            <select class="form-select" style="padding:0.25rem 0.5rem; font-size:0.82rem;"
              ng-model="$ctrl.state.dadosBonusPenalidade"
              ng-options="v as (v === 0 ? 'Normal (0)' : (v > 0 ? '+' + v + ' Bônus' : v + ' Penalidade')) for v in [-2, -1, 0, 1, 2]">
            </select>
          </div>
        </nav>

        <!-- ==================== ABA 1: ATRIBUTOS & RESUMO ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'resumo'">
          <div class="deco-frame" style="margin-bottom:1rem;">
            <div class="sheet-top-grid" style="margin-bottom:0;">
              <!-- Características Clicáveis -->
              <div class="sheet-section-box">
                <h3 class="sheet-section-title">
                  <span>Características (Clique para Rolar 1D100)</span>
                  <span>Reg | ½ | ⅕</span>
                </h3>
                <div class="live-attrs-grid">
                  <div class="live-attr-box" ng-repeat="atr in $ctrl.T.ATRIBUTOS track by atr.sigla">
                    <div>
                      <button type="button" class="roll-trigger-btn"
                        ng-click="$ctrl.svc.rolarPericiaOuAtributo(atr.nome + ' (' + atr.sigla + ')', $ctrl.inv().atributosFinais[atr.sigla])">
                        <strong style="font-size:0.95rem;">{{atr.sigla}}</strong>
                      </button>
                      <div style="font-variant-numeric:tabular-nums; font-size:1.25rem; font-weight:bold;">
                        {{$ctrl.inv().atributosFinais[atr.sigla]}}%
                      </div>
                    </div>
                    <div class="coc-fraction-boxes">
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">½</span>
                        <span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosFinais[atr.sigla]).metade}}</span>
                      </div>
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">⅕</span>
                        <span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosFinais[atr.sigla]).quinto}}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Testes Clássicos Rápidos -->
                <div style="display:flex; flex-wrap:wrap; gap:0.45rem; margin-top:0.75rem;">
                  <button type="button" class="btn btn-sm"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo('Ideia (INT)', $ctrl.inv().atributosFinais.INT)">
                    Ideia ({{$ctrl.inv().atributosFinais.INT}}%)
                  </button>
                  <button type="button" class="btn btn-sm"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo('Conhecimento (EDU)', $ctrl.inv().atributosFinais.EDU)">
                    Conhecimento ({{$ctrl.inv().atributosFinais.EDU}}%)
                  </button>
                  <button type="button" class="btn btn-sm"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo('Sorte', $ctrl.inv().derivados.sorteAtual, {ehTesteSorte: true})">
                    Sorte ({{$ctrl.inv().derivados.sorteAtual}}%)
                  </button>
                  <button type="button" class="btn btn-sm"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo('Sanidade (SAN)', $ctrl.inv().derivados.sanAtual, {ehTesteSanidade: true})">
                    Sanidade ({{$ctrl.inv().derivados.sanAtual}}%)
                  </button>
                </div>
              </div>

              <!-- Identidade + Principais Perícias de Acesso Rápido -->
              <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <div class="sheet-section-box">
                  <h3 class="sheet-section-title">
                    <span>Dossiê do Investigador (1920s)</span>
                    <button type="button" class="btn btn-sm" style="padding:0.1rem 0.45rem; font-size:0.72rem;"
                      ng-click="$ctrl.state.modo = 'wizard'; $ctrl.state.etapaWizard = 1">Editar</button>
                  </h3>
                  <div class="grid-2" style="font-size:0.88rem; gap:0.4rem;">
                    <div><strong>Nome:</strong> {{$ctrl.inv().identidade.nome}}</div>
                    <div><strong>Ocupação:</strong> {{$ctrl.inv().ocupacaoNome}}</div>
                    <div><strong>Idade / Sexo:</strong> {{$ctrl.inv().identidade.idade}} anos • {{$ctrl.inv().identidade.sexo}}</div>
                    <div><strong>Residência:</strong> {{$ctrl.inv().identidade.residencia}}</div>
                    <div><strong>Nascimento:</strong> {{$ctrl.inv().identidade.nascimento}}</div>
                    <div><strong>Conexão-Chave:</strong> {{$ctrl.inv().antecedentes.conexaoChave}}</div>
                  </div>
                </div>

                <div class="sheet-section-box">
                  <h3 class="sheet-section-title">
                    <span>⭐ Perícias Mais Altas (Rolagem Rápida)</span>
                    <button type="button" class="btn btn-sm" style="padding:0.1rem 0.45rem; font-size:0.72rem;"
                      ng-click="$ctrl.state.abaFicha = 'pericias'">Ver Todas →</button>
                  </h3>
                  <div class="focus-skills-grid">
                    <div class="focus-skill-card is-occ" ng-repeat="p in $ctrl.topPericiasResumo() track by p.id">
                      <button type="button" class="roll-trigger-btn"
                        ng-click="$ctrl.svc.rolarPericiaOuAtributo(p.nome, $ctrl.svc.obterTotalPericiaObj(p), {periciaId: p.id})">
                        <strong>{{p.nome}}</strong>
                      </button>
                      <span style="font-variant-numeric:tabular-nums; font-weight:bold;">
                        {{$ctrl.svc.obterTotalPericiaObj(p)}}%
                        <small style="color:var(--text-muted);">({{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}/{{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}})</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ABA 2: PERÍCIAS (DESTAQUE / CATEGORIAS / 3 COLUNAS) ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'pericias'">
          <div class="deco-frame">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.65rem; margin-bottom:1rem; background:var(--bg-elevated); padding:0.65rem 0.85rem; border-radius:4px;">
              <!-- Alternador de Densidade Visual -->
              <div class="segmented-control">
                <button type="button" class="segmented-btn"
                  ng-class="{'active': $ctrl.state.modoVisaoPericiasFicha === 'destaque' && !$ctrl.state.buscaPericiaFicha}"
                  ng-click="$ctrl.state.modoVisaoPericiasFicha = 'destaque'; $ctrl.state.buscaPericiaFicha = ''">
                  ⭐ Principais &amp; Ocupacionais ({{$ctrl.periciasDestaque().length}})
                </button>
                <button type="button" class="segmented-btn"
                  ng-class="{'active': $ctrl.state.modoVisaoPericiasFicha === 'categorias' && !$ctrl.state.buscaPericiaFicha}"
                  ng-click="$ctrl.state.modoVisaoPericiasFicha = 'categorias'; $ctrl.state.buscaPericiaFicha = ''">
                  Por Categoria
                </button>
                <button type="button" class="segmented-btn"
                  ng-class="{'active': $ctrl.state.modoVisaoPericiasFicha === 'grade3col' || $ctrl.state.buscaPericiaFicha}"
                  ng-click="$ctrl.state.modoVisaoPericiasFicha = 'grade3col'">
                  Lista Completa ({{$ctrl.inv().pericias.length}})
                </button>
              </div>

              <!-- Busca + Modo Edição + Especialização -->
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <input type="search" class="form-input" style="padding:0.3rem 0.6rem; font-size:0.85rem; width:210px;"
                  placeholder="Buscar qualquer perícia..."
                  ng-model="$ctrl.state.buscaPericiaFicha" />

                <label class="filter-chip" ng-class="{'active': $ctrl.state.modoEdicaoPericiasFicha}" style="cursor:pointer;">
                  <input type="checkbox" style="display:none;" ng-model="$ctrl.state.modoEdicaoPericiasFicha" />
                  ️ {{$ctrl.state.modoEdicaoPericiasFicha ? 'Concluir Edição' : 'Editar Valores'}}
                </label>

                <button type="button" class="btn btn-sm" ng-click="$ctrl.state.modalAberto = 'especializacao'">
                  + Especialização
                </button>
              </div>
            </div>

            <!-- Visão 1: Cartões de Destaque (Foco sem sobrecarga!) -->
            <div ng-if="$ctrl.state.modoVisaoPericiasFicha === 'destaque' && !$ctrl.state.buscaPericiaFicha">
              <p class="form-hint" style="margin:0 0 0.65rem;">
                Exibindo suas perícias ocupacionais, marcadas com <code>[]</code> ou com 25%+. Use a busca acima ou clique em <strong>Lista Completa</strong> para ver perícia com valor base menor.
              </p>
              <div class="focus-skills-grid">
                <div class="focus-skill-card" ng-repeat="p in $ctrl.periciasDestaque() track by p.id" ng-class="{'is-occ': $ctrl.ehOcupacional(p)}">
                  <div class="live-skill-left">
                    <input type="checkbox" class="skill-check-mark" ng-if="p.marcavel"
                      ng-model="p.marcada" ng-change="$ctrl.svc.salvarEstado()"
                      title="Marcar perícia usada com sucesso para a Fase de Desenvolvimento" />
                    <button type="button" class="roll-trigger-btn"
                      ng-click="$ctrl.svc.rolarPericiaOuAtributo(p.nome, $ctrl.svc.obterTotalPericiaObj(p), {periciaId: p.id})">
                      <strong>{{p.nome}}</strong>
                    </button>
                  </div>
                  <div class="live-skill-right">
                    <span ng-if="!$ctrl.state.modoEdicaoPericiasFicha" style="font-weight:bold; font-size:0.95rem;">
                      {{$ctrl.svc.obterTotalPericiaObj(p)}}%
                    </span>
                    <input type="number" min="0" max="99" class="live-skill-total-input"
                      ng-if="$ctrl.state.modoEdicaoPericiasFicha"
                      ng-value="$ctrl.svc.obterTotalPericiaObj(p)"
                      ng-blur="$ctrl.atualizarTotalPericiaDireto(p, $event.target.value)" />
                    <span class="mini-frac">
                      {{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}/{{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visão 2: Por Categoria -->
            <div ng-if="$ctrl.state.modoVisaoPericiasFicha === 'categorias' && !$ctrl.state.buscaPericiaFicha">
              <div class="filter-chips-row" style="margin-bottom:0.85rem;">
                <button type="button" class="filter-chip" ng-class="{'active': $ctrl.state.categoriaPericiaFicha === 'investigacao'}" ng-click="$ctrl.state.categoriaPericiaFicha = 'investigacao'">Investigação &amp; Percepção</button>
                <button type="button" class="filter-chip" ng-class="{'active': $ctrl.state.categoriaPericiaFicha === 'combate'}" ng-click="$ctrl.state.categoriaPericiaFicha = 'combate'">Combate &amp; Armas</button>
                <button type="button" class="filter-chip" ng-class="{'active': $ctrl.state.categoriaPericiaFicha === 'social'}" ng-click="$ctrl.state.categoriaPericiaFicha = 'social'">️ Interpessoal &amp; Idiomas</button>
                <button type="button" class="filter-chip" ng-class="{'active': $ctrl.state.categoriaPericiaFicha === 'ciencias'}" ng-click="$ctrl.state.categoriaPericiaFicha = 'ciencias'"> Ciências, Artes &amp; Medicina</button>
                <button type="button" class="filter-chip" ng-class="{'active': $ctrl.state.categoriaPericiaFicha === 'acao'}" ng-click="$ctrl.state.categoriaPericiaFicha = 'acao'"> Ação, Furtividade &amp; Veículos</button>
              </div>

              <div class="focus-skills-grid">
                <div class="focus-skill-card" ng-repeat="p in $ctrl.periciasPorCategoriaFicha($ctrl.state.categoriaPericiaFicha) track by p.id" ng-class="{'is-occ': $ctrl.ehOcupacional(p)}">
                  <div class="live-skill-left">
                    <input type="checkbox" class="skill-check-mark" ng-if="p.marcavel"
                      ng-model="p.marcada" ng-change="$ctrl.svc.salvarEstado()" />
                    <button type="button" class="roll-trigger-btn"
                      ng-click="$ctrl.svc.rolarPericiaOuAtributo(p.nome, $ctrl.svc.obterTotalPericiaObj(p), {periciaId: p.id})">
                      <strong>{{p.nome}}</strong>
                    </button>
                  </div>
                  <div class="live-skill-right">
                    <span ng-if="!$ctrl.state.modoEdicaoPericiasFicha" style="font-weight:bold;">
                      {{$ctrl.svc.obterTotalPericiaObj(p)}}%
                    </span>
                    <input type="number" min="0" max="99" class="live-skill-total-input"
                      ng-if="$ctrl.state.modoEdicaoPericiasFicha"
                      ng-value="$ctrl.svc.obterTotalPericiaObj(p)"
                      ng-blur="$ctrl.atualizarTotalPericiaDireto(p, $event.target.value)" />
                    <span class="mini-frac">
                      {{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}/{{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visão 3: Grade Completa de 3 Colunas (Ou quando há busca ativa) -->
            <div class="live-skills-columns" ng-if="$ctrl.state.modoVisaoPericiasFicha === 'grade3col' || $ctrl.state.buscaPericiaFicha">
              <div class="live-skill-row" ng-repeat="p in $ctrl.periciasBuscaFicha() track by p.id">
                <div class="live-skill-left">
                  <input type="checkbox" class="skill-check-mark" ng-if="p.marcavel"
                    ng-model="p.marcada" ng-change="$ctrl.svc.salvarEstado()" />
                  <span style="width:15px; display:inline-block;" ng-if="!p.marcavel"></span>
                  <button type="button" class="roll-trigger-btn"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo(p.nome, $ctrl.svc.obterTotalPericiaObj(p), {periciaId: p.id})">
                    <span>{{p.nome}}</span>
                  </button>
                </div>
                <div class="live-skill-right">
                  <span ng-if="!$ctrl.state.modoEdicaoPericiasFicha" style="font-weight:bold;">
                    {{$ctrl.svc.obterTotalPericiaObj(p)}}%
                  </span>
                  <input type="number" min="0" max="99" class="live-skill-total-input"
                    ng-if="$ctrl.state.modoEdicaoPericiasFicha"
                    ng-value="$ctrl.svc.obterTotalPericiaObj(p)"
                    ng-blur="$ctrl.atualizarTotalPericiaDireto(p, $event.target.value)" />
                  <span class="mini-frac">
                    {{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}/{{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ABA 3: COMBATE & ARMAS ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'combate'">
          <div class="deco-frame">
            <div class="grid-4" style="margin-bottom:1rem;">
              <div class="attr-card">
                <span class="attr-sigla">Dano Extra (DX)</span>
                <div class="vital-big-number">{{$ctrl.inv().derivados.danoExtra}}</div>
              </div>
              <div class="attr-card">
                <span class="attr-sigla">Corpo</span>
                <div class="vital-big-number">{{$ctrl.inv().derivados.corpo}}</div>
              </div>
              <div class="attr-card">
                <span class="attr-sigla">Esquiva</span>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span class="vital-big-number">{{$ctrl.svc.obterTotalPericia($ctrl.inv(), 'esquiva')}}%</span>
                  <button type="button" class="btn btn-sm btn-primary"
                    ng-click="$ctrl.svc.rolarPericiaOuAtributo('Esquiva', $ctrl.svc.obterTotalPericia($ctrl.inv(), 'esquiva'), {periciaId: 'esquiva'})">
                    Esquivar
                  </button>
                </div>
              </div>
              <div class="attr-card">
                <span class="attr-sigla">Movimento (MOV)</span>
                <div class="vital-big-number">{{$ctrl.inv().derivados.mov}}</div>
              </div>
            </div>

            <div class="sheet-section-box">
              <h3 class="sheet-section-title">
                <span>Armas &amp; Ataques (Clique para Rolar Ataque 1D100 ou Dano)</span>
                <span>{{$ctrl.inv().armas.length}} arma(s)</span>
              </h3>

              <div class="skills-table-wrapper" style="margin-bottom:0.85rem;">
                <table class="skills-table">
                  <thead>
                    <tr>
                      <th>Arma (Rolar Ataque)</th>
                      <th>Perícia</th>
                      <th>Reg / ½ / ⅕</th>
                      <th>Dano (Rolar)</th>
                      <th>Alcance</th>
                      <th>Ataques</th>
                      <th>Munição</th>
                      <th>Defeito</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr ng-repeat="arma in $ctrl.inv().armas track by $index">
                      <td>
                        <button type="button" class="roll-trigger-btn"
                          ng-click="$ctrl.svc.rolarPericiaOuAtributo('Ataque: ' + arma.nome, $ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId), {periciaId: arma.periciaId})">
                          <strong>{{arma.nome}}</strong>
                        </button>
                      </td>
                      <td>{{arma.periciaNome}}</td>
                      <td style="font-variant-numeric:tabular-nums; font-weight:bold;">
                        {{$ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)}}% /
                        {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).metade}}% /
                        {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).quinto}}%
                      </td>
                      <td>
                        <button type="button" class="btn btn-sm" style="font-variant-numeric:tabular-nums;"
                          ng-click="$ctrl.svc.rolarDanoArma(arma)"
                          title="Clique para rolar o dano desta arma">
                          Dano: {{$ctrl.R.formatarDanoArma(arma.danoBase, arma.somaDX, $ctrl.inv().derivados.danoExtra)}}
                        </button>
                      </td>
                      <td>{{arma.alcance}}</td>
                      <td>{{arma.ataques}}</td>
                      <td>{{arma.municao}}</td>
                      <td>{{arma.defeito}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                <select class="form-select" style="flex:1; min-width:220px;" ng-model="$ctrl.armaRapidaId">
                  <option ng-repeat="a in $ctrl.ARMAS_LIVRO track by a.id" value="{{a.id}}">
                    [{{a.categoria}}] {{a.nome}} — Dano: {{a.danoBase}}
                  </option>
                </select>
                <button type="button" class="btn btn-primary btn-sm" ng-click="$ctrl.adicionarArmaFicha()">+ Adicionar Arma</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ABA 4: ANTECEDENTES & LORE (EM ACORDEÃO LIMPO) ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'antecedentes'">
          <div class="deco-frame">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
              <div>
                <h3 style="margin:0;">Antecedentes &amp; Registros Pessoais</h3>
                <span class="form-hint">Clique em qualquer cartão para expandir e editar o texto sem poluir a tela.</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge-occ" style="background:var(--accent-gold); font-size:0.82rem; padding:0.25rem 0.6rem;">
                  Conexão-Chave: {{$ctrl.inv().antecedentes.conexaoChave}}
                </span>
              </div>
            </div>

            <div class="lore-accordion-grid">
              <div class="lore-card"
                ng-repeat="c in $ctrl.svc.CAMPOS_ANTECEDENTES track by c.chave"
                ng-class="{'is-key-connection': $ctrl.inv().antecedentes.conexaoChave === c.titulo}">

                <div class="lore-card-header" ng-click="$ctrl.state.cardAntecedenteAberto = ($ctrl.state.cardAntecedenteAberto === c.chave ? null : c.chave)">
                  <div>
                    <strong>{{c.titulo}}</strong>
                    <span class="badge-occ" style="background:var(--accent-gold);" ng-if="$ctrl.inv().antecedentes.conexaoChave === c.titulo"> CHAVE</span>
                  </div>
                  <span style="font-size:0.78rem; color:var(--text-muted);">
                    {{$ctrl.state.cardAntecedenteAberto === c.chave ? '▲ Fechar' : '️ Expandir'}}
                  </span>
                </div>

                <div class="lore-card-preview"
                  ng-if="$ctrl.state.cardAntecedenteAberto !== c.chave"
                  ng-class="{'is-empty': !$ctrl.inv().antecedentes[c.chave]}"
                  ng-click="$ctrl.state.cardAntecedenteAberto = c.chave">
                  {{$ctrl.inv().antecedentes[c.chave] || 'Sem anotações registradas. Clique para adicionar.'}}
                </div>

                <div class="lore-card-editor" ng-if="$ctrl.state.cardAntecedenteAberto === c.chave">
                  <textarea class="form-textarea" style="width:100%;"
                    ng-model="$ctrl.inv().antecedentes[c.chave]"
                    ng-change="$ctrl.svc.salvarEstado()"
                    placeholder="{{c.dica}}"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ABA 5: INVENTÁRIO, FINANÇAS & COMPANHEIROS ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'inventario'">
          <div class="deco-frame">
            <div class="grid-2">
              <!-- Equipamentos -->
              <div class="sheet-section-box">
                <h3 class="sheet-section-title">
                  <span>Equipamentos &amp; Pertences</span>
                  <span>{{$ctrl.inv().equipamentos.length}} item(ns)</span>
                </h3>
                <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem;">
                  <input type="text" class="form-input" style="flex:1;" placeholder="Adicionar item ao inventário..." ng-model="$ctrl.novoEquipTexto" />
                  <button type="button" class="btn btn-primary btn-sm" ng-click="$ctrl.adicionarEquipFicha()">+ Adicionar</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                  <span ng-repeat="eq in $ctrl.inv().equipamentos track by $index"
                    style="display:inline-flex; align-items:center; gap:0.35rem; padding:0.28rem 0.6rem; background:var(--bg-paper); border:1px solid var(--border-strong); border-radius:4px; font-size:0.85rem;">
                    {{eq}}
                    <button type="button" style="border:none; background:none; cursor:pointer; color:var(--accent-crimson); font-weight:bold;"
                      ng-click="$ctrl.inv().equipamentos.splice($index, 1); $ctrl.svc.salvarEstado()"></button>
                  </span>
                </div>
              </div>

              <!-- Finanças 1920 -->
              <div class="sheet-section-box">
                <h3 class="sheet-section-title">
                  <span>Dinheiro &amp; Recursos (1920s)</span>
                  <span>Crédito: {{$ctrl.financas1920().nivelCredito}}% ({{$ctrl.financas1920().padraoVida}})</span>
                </h3>
                <div class="grid-3" style="margin-bottom:0.65rem;">
                  <div class="form-group">
                    <label class="form-label">Nível de Gastos</label>
                    <input type="text" class="form-input"
                      ng-model="$ctrl.inv().financasCustom.nivelGastos"
                      ng-change="$ctrl.svc.salvarEstado()"
                      placeholder="{{$ctrl.financas1920().nivelGastosTexto}}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Dinheiro Vivo</label>
                    <input type="text" class="form-input"
                      ng-model="$ctrl.inv().financasCustom.dinheiro"
                      ng-change="$ctrl.svc.salvarEstado()"
                      placeholder="{{$ctrl.financas1920().dinheiroTexto}}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Patrimônio</label>
                    <input type="text" class="form-input"
                      ng-model="$ctrl.inv().financasCustom.patrimonio"
                      ng-change="$ctrl.svc.salvarEstado()"
                      placeholder="{{$ctrl.financas1920().patrimonioTexto}}" />
                  </div>
                </div>
                <div class="form-hint">
                  Valor automático sugerido pela Tabela II: Gastos <strong>{{$ctrl.financas1920().nivelGastosTexto}}</strong> •
                  Dinheiro <strong>{{$ctrl.financas1920().dinheiroTexto}}</strong> •
                  Patrimônio <strong>{{$ctrl.financas1920().patrimonioTexto}}</strong>.
                </div>
              </div>
            </div>

            <!-- Companheiros Investigadores -->
            <div class="sheet-section-box" style="margin-top:1rem;">
              <h3 class="sheet-section-title">
                <span>Companheiros Investigadores</span>
                <span>{{$ctrl.inv().companheiros.length}} aliado(s)</span>
              </h3>
              <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <input type="text" class="form-input" style="flex:1; min-width:180px;" placeholder="Nome do companheiro..." ng-model="$ctrl.novoCompNome" />
                <input type="text" class="form-input" style="flex:2; min-width:220px;" placeholder="Ocupação / Notas..." ng-model="$ctrl.novoCompNotas" />
                <button type="button" class="btn btn-sm btn-primary" ng-click="$ctrl.adicionarCompanheiro()">+ Adicionar</button>
              </div>
              <div class="grid-3">
                <div class="attr-card" ng-repeat="comp in $ctrl.inv().companheiros track by $index">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>{{comp.nome}}</strong>
                    <button type="button" class="btn btn-sm btn-danger" style="padding:0.05rem 0.35rem;"
                      ng-click="$ctrl.inv().companheiros.splice($index, 1); $ctrl.svc.salvarEstado()"></button>
                  </div>
                  <span class="form-hint">{{comp.notas}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== ABA 6: FOLHA CLÁSSICA DE 2 PÁGINAS ==================== -->
        <div ng-if="$ctrl.state.abaFicha === 'folha2p'">
          <coc-print-sheet></coc-print-sheet>
        </div>
      </div>
    `
  });

  /* ==========================================================================
     COMPONENTE DO TOAST FLUTUANTE DE ROLAGEM: <coc-roll-toast>
     ========================================================================== */
  app.component('cocRollToast', {
    controller: ['CocStateService', function (CocStateService) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };
    }],
    template: `
      <aside class="floating-roll-toast no-print"
        ng-if="$ctrl.state.toastRolagemVisivel && $ctrl.state.ultimaRolagem && !$ctrl.state.gavetaDadosAberta"
        aria-live="assertive">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <strong style="font-size:0.86rem;">{{$ctrl.state.ultimaRolagem.rotulo}}</strong>
          <div style="display:flex; gap:0.35rem;">
            <button type="button" class="btn btn-sm" style="padding:0.1rem 0.45rem; font-size:0.72rem;"
              ng-click="$ctrl.state.gavetaDadosAberta = true">Histórico</button>
            <button type="button" class="btn btn-sm" style="padding:0.1rem 0.4rem; font-size:0.72rem;"
              ng-click="$ctrl.state.toastRolagemVisivel = false"></button>
          </div>
        </div>

        <div class="roll-result-banner {{$ctrl.state.ultimaRolagem.avaliacao.classeCss}}" style="margin-bottom:0.4rem; padding:0.55rem;">
          <div class="roll-d100-number" style="font-size:1.85rem;">{{$ctrl.state.ultimaRolagem.d100.resultadoFinal}}</div>
          <div style="font-weight:bold; font-size:0.9rem;">{{$ctrl.state.ultimaRolagem.avaliacao.rotulo}}</div>
          <div style="font-size:0.74rem; font-variant-numeric:tabular-nums;" ng-if="$ctrl.state.ultimaRolagem.d100.tipoModificador !== 'DANO'">
            Alvo: {{$ctrl.state.ultimaRolagem.avaliacao.regular}}% | ½: {{$ctrl.state.ultimaRolagem.avaliacao.dificil}}% | ⅕: {{$ctrl.state.ultimaRolagem.avaliacao.extremo}}%
          </div>
        </div>

        <!-- Ações Rápidas: Forçar Rolagem ou Gastar Sorte direto do Toast -->
        <div style="display:flex; flex-wrap:wrap; gap:0.35rem;" ng-if="!$ctrl.state.ultimaRolagem.avaliacao.sucesso">
          <button type="button" class="btn btn-sm btn-danger" style="flex:1;"
            ng-if="!$ctrl.state.ultimaRolagem.forcada && !$ctrl.state.ultimaRolagem.ehTesteSorte && !$ctrl.state.ultimaRolagem.ehTesteSanidade"
            ng-click="$ctrl.svc.forcarUltimaRolagem()">
            Forçar Rolagem (Push)
          </button>

          <button type="button" class="btn btn-sm btn-gold" style="flex:1;"
            ng-if="$ctrl.state.ultimaRolagem.podeGastarSorte && $ctrl.state.ultimaRolagem.sorteParaRegular > 0 && $ctrl.inv().derivados.sorteAtual >= $ctrl.state.ultimaRolagem.sorteParaRegular"
            ng-click="$ctrl.svc.gastarSorteUltimaRolagem('REGULAR')">
            Gastar {{$ctrl.state.ultimaRolagem.sorteParaRegular}} Sorte → Regular
          </button>
        </div>
      </aside>
    `
  });

  /* ==========================================================================
     COMPONENTE DA GAVETA DESLIZANTE DE DADOS E LOG: <coc-dice-drawer>
     ========================================================================== */
  app.component('cocDiceDrawer', {
    controller: ['CocStateService', function (CocStateService) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };
    }],
    template: `
      <div class="dice-drawer-backdrop no-print" ng-if="$ctrl.state.gavetaDadosAberta" ng-click="$ctrl.state.gavetaDadosAberta = false"></div>
      <aside class="dice-drawer no-print" ng-if="$ctrl.state.gavetaDadosAberta" aria-label="Rolador 1D100 e Histórico da Sessão">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--border-strong); padding-bottom:0.6rem; margin-bottom:0.85rem;">
          <h2 style="margin:0; font-size:1.15rem;">Rolador 1D100 &amp; Histórico</h2>
          <button type="button" class="btn btn-sm" ng-click="$ctrl.state.gavetaDadosAberta = false"> Fechar</button>
        </div>

        <!-- Dados de Bônus e Penalidade -->
        <div style="margin-bottom:0.85rem;">
          <div style="font-size:0.8rem; font-weight:bold; margin-bottom:0.3rem;">Dados de Bônus / Penalidade (pág. 91):</div>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:0.25rem;">
            <button type="button" class="btn btn-sm" ng-repeat="mod in [-2, -1, 0, 1, 2]"
              ng-class="{'btn-primary': $ctrl.state.dadosBonusPenalidade === mod}"
              ng-click="$ctrl.state.dadosBonusPenalidade = mod">
              {{mod === 0 ? '0' : (mod > 0 ? '+' + mod + 'B' : mod + 'P')}}
            </button>
          </div>
        </div>

        <button type="button" class="btn btn-primary" style="width:100%; margin-bottom:0.85rem;"
          ng-click="$ctrl.svc.rolarPericiaOuAtributo('Rolagem Livre 1D100', 50)">
          Rolar 1D100 Livre (Alvo 50%)
        </button>

        <!-- Resultado Atual Detalhado -->
        <div ng-if="$ctrl.state.ultimaRolagem" style="margin-bottom:1rem;">
          <div class="roll-result-banner {{$ctrl.state.ultimaRolagem.avaliacao.classeCss}}">
            <div style="font-size:0.82rem; font-weight:bold;">{{$ctrl.state.ultimaRolagem.rotulo}}</div>
            <div class="roll-d100-number">{{$ctrl.state.ultimaRolagem.d100.resultadoFinal}}</div>
            <div style="font-weight:bold; font-size:0.95rem;">{{$ctrl.state.ultimaRolagem.avaliacao.rotulo}}</div>
            <div style="font-size:0.75rem; font-variant-numeric:tabular-nums; margin-top:0.2rem;" ng-if="$ctrl.state.ultimaRolagem.d100.tipoModificador !== 'DANO'">
              Reg: {{$ctrl.state.ultimaRolagem.avaliacao.regular}}% | Dif: {{$ctrl.state.ultimaRolagem.avaliacao.dificil}}% | Ext: {{$ctrl.state.ultimaRolagem.avaliacao.extremo}}%
            </div>
          </div>

          <!-- Forçar Rolagem -->
          <button type="button" class="btn btn-danger btn-sm" style="width:100%; margin-bottom:0.45rem;"
            ng-if="!$ctrl.state.ultimaRolagem.avaliacao.sucesso && !$ctrl.state.ultimaRolagem.forcada && !$ctrl.state.ultimaRolagem.ehTesteSorte && !$ctrl.state.ultimaRolagem.ehTesteSanidade"
            ng-click="$ctrl.svc.forcarUltimaRolagem()">
            Forçar a Rolagem (Push Roll — pág. 87)
          </button>

          <!-- Gastar Sorte -->
          <div style="background:var(--bg-elevated); padding:0.55rem; border-radius:4px; font-size:0.8rem;"
            ng-if="$ctrl.state.ultimaRolagem.podeGastarSorte && $ctrl.state.ultimaRolagem.sorteGasta === 0">
            <strong>Gastar Sorte (Disponível: {{$ctrl.inv().derivados.sorteAtual}}%):</strong>
            <div style="display:flex; flex-direction:column; gap:0.3rem; margin-top:0.35rem;">
              <button type="button" class="btn btn-sm btn-gold"
                ng-if="$ctrl.state.ultimaRolagem.sorteParaRegular > 0"
                ng-disabled="$ctrl.inv().derivados.sorteAtual < $ctrl.state.ultimaRolagem.sorteParaRegular"
                ng-click="$ctrl.svc.gastarSorteUltimaRolagem('REGULAR')">
                Gastar {{$ctrl.state.ultimaRolagem.sorteParaRegular}} Sorte → Regular ({{$ctrl.state.ultimaRolagem.avaliacao.regular}}%)
              </button>
              <button type="button" class="btn btn-sm"
                ng-if="$ctrl.state.ultimaRolagem.sorteParaDificil > 0"
                ng-disabled="$ctrl.inv().derivados.sorteAtual < $ctrl.state.ultimaRolagem.sorteParaDificil"
                ng-click="$ctrl.svc.gastarSorteUltimaRolagem('DIFICIL')">
                Gastar {{$ctrl.state.ultimaRolagem.sorteParaDificil}} Sorte → Difícil ({{$ctrl.state.ultimaRolagem.avaliacao.dificil}}%)
              </button>
              <button type="button" class="btn btn-sm"
                ng-if="$ctrl.state.ultimaRolagem.sorteParaExtremo > 0"
                ng-disabled="$ctrl.inv().derivados.sorteAtual < $ctrl.state.ultimaRolagem.sorteParaExtremo"
                ng-click="$ctrl.svc.gastarSorteUltimaRolagem('EXTREMO')">
                Gastar {{$ctrl.state.ultimaRolagem.sorteParaExtremo}} Sorte → Extremo ({{$ctrl.state.ultimaRolagem.avaliacao.extremo}}%)
              </button>
            </div>
          </div>
        </div>

        <!-- Histórico da Sessão -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <strong style="font-size:0.86rem;">Histórico ({{$ctrl.state.historicoRolagens.length}})</strong>
          <button type="button" class="btn btn-sm" ng-if="$ctrl.state.historicoRolagens.length > 0"
            ng-click="$ctrl.state.historicoRolagens = []; $ctrl.state.ultimaRolagem = null">Limpar</button>
        </div>

        <div class="roll-log-list" style="flex:1; max-height:none;">
          <div class="roll-log-item" ng-repeat="item in $ctrl.state.historicoRolagens track by item.id">
            <div style="display:flex; justify-content:space-between; font-variant-numeric:tabular-nums; font-size:0.72rem; color:var(--text-muted);">
              <span>{{item.horario}} • {{item.investigador}}</span>
              <strong>1D100 = {{item.d100.resultadoFinal}}</strong>
            </div>
            <div style="font-weight:bold;">{{item.rotulo}} ({{item.valorAlvo}}%)</div>
            <div style="font-size:0.76rem;">→ {{item.avaliacao.rotulo}}</div>
          </div>
        </div>
      </aside>
    `
  });

  /* ==========================================================================
     COMPONENTE DA FOLHA CLÁSSICA DE 2 PÁGINAS E IMPRESSÃO: <coc-print-sheet>
     ========================================================================== */
  app.component('cocPrintSheet', {
    controller: ['CocStateService', '$window', function (CocStateService, $window) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.R = $window.CoC7e.Regras;
      $ctrl.T = $window.CoC7e.TABELAS;
      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };
      $ctrl.mq = function (v) {
        return $ctrl.R.calcularMetadeQuinto(Number(v) || 0);
      };
      $ctrl.financas1920 = function () {
        const cred = CocStateService.obterTotalPericia($ctrl.inv(), 'nivel_de_credito');
        return $ctrl.R.calcularFinancas1920(cred);
      };
    }],
    template: `
      <!-- PÁGINA 1 OFICIAL -->
      <section class="deco-frame" style="margin-bottom:1.25rem;">
        <div class="sheet-top-grid">
          <div class="sheet-section-box">
            <h3 class="sheet-section-title">
              <span>Investigador — Anos 1920</span>
              <span>Chamado de Cthulhu 7ª Ed.</span>
            </h3>
            <div style="font-size:0.88rem; display:grid; gap:0.25rem;">
              <div><strong>Nome:</strong> {{$ctrl.inv().identidade.nome}}</div>
              <div><strong>Jogador(a):</strong> {{$ctrl.inv().identidade.jogador || '—'}}</div>
              <div><strong>Ocupação:</strong> {{$ctrl.inv().ocupacaoNome}}</div>
              <div><strong>Idade / Sexo:</strong> {{$ctrl.inv().identidade.idade}} • {{$ctrl.inv().identidade.sexo}}</div>
              <div><strong>Residência / Nascimento:</strong> {{$ctrl.inv().identidade.residencia}} / {{$ctrl.inv().identidade.nascimento}}</div>
            </div>
          </div>

          <div class="sheet-section-box">
            <h3 class="sheet-section-title">
              <span>Características</span>
              <span>Reg | ½ | ⅕ • MOV {{$ctrl.inv().derivados.mov}}</span>
            </h3>
            <div class="live-attrs-grid">
              <div class="live-attr-box" ng-repeat="atr in $ctrl.T.ATRIBUTOS track by atr.sigla">
                <div>
                  <strong>{{atr.sigla}}</strong>
                  <div style="font-variant-numeric:tabular-nums; font-size:1.15rem; font-weight:bold;">
                    {{$ctrl.inv().atributosFinais[atr.sigla]}}%
                  </div>
                </div>
                <div class="coc-fraction-boxes">
                  <div class="coc-fraction-box"><span class="coc-fraction-label">½</span><span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosFinais[atr.sigla]).metade}}</span></div>
                  <div class="coc-fraction-box"><span class="coc-fraction-label">⅕</span><span class="coc-fraction-val">{{$ctrl.mq($ctrl.inv().atributosFinais[atr.sigla]).quinto}}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vitais Resumidos -->
        <div class="grid-4" style="margin-bottom:0.85rem;">
          <div class="attr-card"><strong>Pontos de Vida:</strong> {{$ctrl.inv().derivados.pvAtual}} / {{$ctrl.inv().derivados.pvMax}}</div>
          <div class="attr-card"><strong>Sanidade:</strong> {{$ctrl.inv().derivados.sanAtual}} / {{$ctrl.inv().derivados.sanMax}} (Ini: {{$ctrl.inv().derivados.sanInicial}})</div>
          <div class="attr-card"><strong>Pontos de Magia:</strong> {{$ctrl.inv().derivados.pmAtual}} / {{$ctrl.inv().derivados.pmMax}}</div>
          <div class="attr-card"><strong>Sorte:</strong> {{$ctrl.inv().derivados.sorteAtual}}%</div>
        </div>

        <!-- Perícias em 3 Colunas -->
        <div class="sheet-section-box" style="margin-bottom:0.85rem;">
          <h3 class="sheet-section-title"><span>Perícias do Investigador</span><span>Regular (½ / ⅕)</span></h3>
          <div class="live-skills-columns">
            <div class="live-skill-row" ng-repeat="p in $ctrl.inv().pericias track by p.id">
              <span>{{p.marcada ? '[X]' : '[ ]'}} {{p.nome}}</span>
              <span style="font-variant-numeric:tabular-nums;">
                <strong>{{$ctrl.svc.obterTotalPericiaObj(p)}}%</strong>
                ({{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).metade}}/{{$ctrl.mq($ctrl.svc.obterTotalPericiaObj(p)).quinto}})
              </span>
            </div>
          </div>
        </div>

        <!-- Armas e Combate -->
        <div class="sheet-section-box">
          <h3 class="sheet-section-title">
            <span>Armas &amp; Combate</span>
            <span>Dano Extra: {{$ctrl.inv().derivados.danoExtra}} | Corpo: {{$ctrl.inv().derivados.corpo}} | Esquiva: {{$ctrl.svc.obterTotalPericia($ctrl.inv(), 'esquiva')}}%</span>
          </h3>
          <table class="skills-table">
            <thead>
              <tr><th>Arma</th><th>Perícia</th><th>Reg / ½ / ⅕</th><th>Dano</th><th>Alcance</th><th>Ataques</th><th>Munição</th><th>Defeito</th></tr>
            </thead>
            <tbody>
              <tr ng-repeat="arma in $ctrl.inv().armas track by $index">
                <td><strong>{{arma.nome}}</strong></td>
                <td>{{arma.periciaNome}}</td>
                <td style="font-variant-numeric:tabular-nums;">{{$ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)}}% / {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).metade}}% / {{$ctrl.mq($ctrl.svc.obterTotalPericia($ctrl.inv(), arma.periciaId)).quinto}}%</td>
                <td style="font-variant-numeric:tabular-nums;">{{$ctrl.R.formatarDanoArma(arma.danoBase, arma.somaDX, $ctrl.inv().derivados.danoExtra)}}</td>
                <td>{{arma.alcance}}</td><td>{{arma.ataques}}</td><td>{{arma.municao}}</td><td>{{arma.defeito}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- PÁGINA 2 OFICIAL -->
      <section class="deco-frame print-page-break">
        <div class="sheet-section-box" style="margin-bottom:0.85rem;">
          <h3 class="sheet-section-title">
            <span>Antecedentes do Investigador (Página 2)</span>
            <span>Conexão-Chave: {{$ctrl.inv().antecedentes.conexaoChave}}</span>
          </h3>
          <div class="grid-2">
            <div ng-repeat="c in $ctrl.svc.CAMPOS_ANTECEDENTES track by c.chave" style="border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">
              <strong>{{c.titulo}} {{$ctrl.inv().antecedentes.conexaoChave === c.titulo ? '' : ''}}:</strong>
              <div style="font-size:0.86rem; white-space:pre-line;">{{$ctrl.inv().antecedentes[c.chave] || '—'}}</div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="sheet-section-box">
            <h3 class="sheet-section-title"><span>Equipamentos &amp; Pertences</span></h3>
            <div style="font-size:0.86rem;">{{$ctrl.inv().equipamentos.join(' • ') || 'Nenhum equipamento listado.'}}</div>
          </div>
          <div class="sheet-section-box">
            <h3 class="sheet-section-title"><span>Dinheiro &amp; Recursos (1920s)</span></h3>
            <div style="font-size:0.86rem;">
              <div><strong>Nível de Gastos:</strong> {{$ctrl.inv().financasCustom.nivelGastos || $ctrl.financas1920().nivelGastosTexto}}</div>
              <div><strong>Dinheiro em Mãos:</strong> {{$ctrl.inv().financasCustom.dinheiro || $ctrl.financas1920().dinheiroTexto}}</div>
              <div><strong>Patrimônio:</strong> {{$ctrl.inv().financasCustom.patrimonio || $ctrl.financas1920().patrimonioTexto}}</div>
            </div>
          </div>
        </div>
      </section>
    `
  });

  /* ==========================================================================
     COMPONENTE DE MODAIS: <coc-modals>
     ========================================================================== */
  app.component('cocModals', {
    controller: ['CocStateService', '$window', '$scope', function (CocStateService, $window, $scope) {
      const $ctrl = this;
      $ctrl.svc = CocStateService;
      $ctrl.state = CocStateService.state;
      $ctrl.R = $window.CoC7e.Regras;
      $ctrl.ESPECIALIZACOES_EXTRAS = $window.CoC7e.ESPECIALIZACOES_EXTRAS;

      $ctrl.familiaEsp = 'arte_e_oficio';
      $ctrl.nomeEsp = '';
      $ctrl.periciaExtraId = $ctrl.ESPECIALIZACOES_EXTRAS[0] ? $ctrl.ESPECIALIZACOES_EXTRAS[0].id : '';

      $ctrl.inv = function () {
        return CocStateService.obterInvestigadorAtivo();
      };

      $ctrl.fechar = function () {
        $ctrl.state.modalAberto = null;
        $ctrl.state.resultadoDesenvolvimento = null;
        $ctrl.state.statusAcroForm = '';
      };

      // Gerenciador de Investigadores
      $ctrl.criarNovoInvestigador = function () {
        const novo = CocStateService.criarInvestigadorPadrao();
        novo.identidade.nome = 'Novo Investigador #' + ($ctrl.state.investigadores.length + 1);
        $ctrl.state.investigadores.unshift(novo);
        $ctrl.state.ativoId = novo.id;
        $ctrl.state.modo = 'wizard';
        $ctrl.state.etapaWizard = 1;
        $ctrl.fechar();
        CocStateService.salvarEstado();
      };

      $ctrl.selecionarInvestigador = function (id) {
        $ctrl.state.ativoId = id;
        $ctrl.fechar();
        CocStateService.salvarEstado();
      };

      $ctrl.duplicarInvestigador = function (invOrig) {
        const copia = angular.copy(invOrig);
        copia.id = CocStateService.gerarIdUnico();
        copia.identidade.nome = (copia.identidade.nome || 'Investigador') + ' (Cópia)';
        $ctrl.state.investigadores.unshift(copia);
        $ctrl.state.ativoId = copia.id;
        CocStateService.salvarEstado();
      };

      $ctrl.excluirInvestigador = function (id) {
        if ($ctrl.state.investigadores.length <= 1) return;
        $ctrl.state.investigadores = $ctrl.state.investigadores.filter(function (i) { return i.id !== id; });
        if ($ctrl.state.ativoId === id) {
          $ctrl.state.ativoId = $ctrl.state.investigadores[0].id;
        }
        CocStateService.salvarEstado();
      };

      $ctrl.importarArquivoJSON = function (inputEl) {
        const file = inputEl.files && inputEl.files[0];
        if (!file) return;
        file.text().then(function (txt) {
          $scope.$apply(function () {
            try {
              const obj = JSON.parse(txt);
              const novo = Array.isArray(obj) ? obj[0] : obj;
              if (!novo || !novo.identidade) throw new Error('JSON inválido.');
              novo.id = CocStateService.gerarIdUnico();
              CocStateService.recalcularInvestigador(novo, { resetarAtuais: false });
              $ctrl.state.investigadores.unshift(novo);
              $ctrl.state.ativoId = novo.id;
              $ctrl.fechar();
              CocStateService.salvarEstado();
            } catch (err) {
              alert('Erro ao importar JSON: ' + err.message);
            }
          });
        });
      };

      // Exportação PDF
      $ctrl.imprimirDireto = function () {
        $ctrl.fechar();
        setTimeout(function () { $window.print(); }, 120);
      };

      $ctrl.baixarPDFOficial = function (achatar = false) {
        const inv = $ctrl.inv();
        $ctrl.state.statusAcroForm = 'Preenchendo campos AcroForm da Ficha Oficial...';
        $window.CoC7e.PDFExport.exportarNaFichaOficialAnexada(inv, { achatarCampos: achatar }).then(function (res) {
          $scope.$apply(function () {
            const nome = (((inv.identidade && inv.identidade.nome) || 'investigador'))
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') || 'investigador';
            const sufixo = achatar ? '-impressao' : '-editavel';
            CocStateService.baixarBytes(res.bytes, 'ficha-oficial-coc7e-' + nome + sufixo + '.pdf', 'application/pdf');
            $ctrl.state.statusAcroForm = 'Ficha Oficial gerada com sucesso! (' + res.preenchidos + ' de ' + res.totalCampos + ' campos preenchidos).';
          });
        }).catch(function (err) {
          $scope.$apply(function () {
            $ctrl.state.statusAcroForm = 'Erro ao exportar Ficha Oficial: ' + err.message;
          });
        });
      };

      $ctrl.baixarPDFNativo = function () {
        const inv = $ctrl.inv();
        $window.CoC7e.PDFExport.gerarPDFNativoDuasPaginas(inv).then(function (bytes) {
          const nome = ((inv.identidade && inv.identidade.nome) || 'investigador').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          CocStateService.baixarBytes(bytes, 'ficha-cthulhu-7e-' + nome + '.pdf', 'application/pdf');
        }).catch(function (err) {
          alert('Não foi possível gerar PDF via pdf-lib (use a opção Imprimir A4): ' + err.message);
        });
      };

      $ctrl.preencherPDFEditavel = function (inputEl) {
        const file = inputEl.files && inputEl.files[0];
        if (!file) return;
        const inv = $ctrl.inv();
        $ctrl.state.statusAcroForm = 'Inspecionando e preenchendo campos AcroForm do PDF...';
        file.arrayBuffer().then(function (buffer) {
          return $window.CoC7e.PDFExport.preencherPDFEditavel(buffer, inv);
        }).then(function (res) {
          $scope.$apply(function () {
            const nome = ((inv.identidade && inv.identidade.nome) || 'investigador').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            CocStateService.baixarBytes(res.bytes, 'ficha-coc7e-' + nome + '.pdf', 'application/pdf');
            $ctrl.state.statusAcroForm = ' PDF preenchido! ' + res.preenchidos + ' de ' + res.totalCampos + ' campos AcroForm mapeados.';
          });
        }).catch(function (err) {
          $scope.$apply(function () {
            $ctrl.state.statusAcroForm = 'Erro ao preencher PDF: ' + err.message;
          });
        });
      };

      // Fase de Desenvolvimento (pág. 94)
      $ctrl.periciasMarcadas = function () {
        const inv = $ctrl.inv();
        if (!inv || !inv.pericias) return [];
        return inv.pericias.filter(function (p) { return p.marcada && p.marcavel; });
      };

      $ctrl.executarFaseDesenvolvimento = function () {
        const inv = $ctrl.inv();
        const logs = [];
        $ctrl.periciasMarcadas().forEach(function (p) {
          const totalAtual = CocStateService.obterTotalPericiaObj(p);
          const res = $ctrl.R.executarDesenvolvimentoPericia(totalAtual);
          p.marcada = false;
          if (res.evoluiu) {
            p.outros = (Number(p.outros) || 0) + res.ganho1d10;
            let msg = ' ' + p.nome + ': rolou ' + res.rolagem1d100 + ' (vs ' + totalAtual + '%) → SUBIU +' + res.ganho1d10 + '% (Novo: ' + res.valorNovo + '%)';
            if (res.recuperouSanidade2d6 > 0) {
              inv.derivados.sanAtual = Math.min(inv.derivados.sanMax, inv.derivados.sanAtual + res.recuperouSanidade2d6);
              msg += ' [Alcançou 90%+! Recuperou +' + res.recuperouSanidade2d6 + ' SAN!]';
            }
            logs.push(msg);
          } else {
            logs.push('• ' + p.nome + ': rolou ' + res.rolagem1d100 + ' (vs ' + totalAtual + '%) → Manteve ' + totalAtual + '%');
          }
        });
        $ctrl.state.resultadoDesenvolvimento = logs;
        CocStateService.salvarEstado();
      };

      // Nova Especialização
      $ctrl.confirmarNovaEspecializacao = function () {
        const inv = $ctrl.inv();
        const nome = ($ctrl.nomeEsp || '').trim();
        if (!nome) return;
        const mapa = {
          arte_e_oficio: { familia: 'Arte e Ofício', base: 5 },
          ciencia: { familia: 'Ciência', base: 1 },
          lingua_outra: { familia: 'Língua (Outra)', base: 1 },
          pilotar: { familia: 'Pilotar', base: 1 },
          sobrevivencia: { familia: 'Sobrevivência', base: 10 }
        };
        const cfg = mapa[$ctrl.familiaEsp] || mapa.arte_e_oficio;
        inv.pericias.push({
          id: $ctrl.familiaEsp + '_' + Date.now().toString(36),
          nome: cfg.familia + ' (' + nome + ')',
          familia: cfg.familia,
          especializavel: true,
          especializacao: nome,
          base: cfg.base,
          ocupacao: 0,
          interesse: 0,
          outros: 0,
          marcavel: true,
          marcada: false,
          customAdded: true
        });
        $ctrl.nomeEsp = '';
        $ctrl.fechar();
        CocStateService.salvarEstado();
      };

      $ctrl.confirmarPericiaExtra = function () {
        const inv = $ctrl.inv();
        const ex = $ctrl.ESPECIALIZACOES_EXTRAS.find(function (x) { return x.id === $ctrl.periciaExtraId; });
        if (!ex) return;
        if (!inv.pericias.some(function (p) { return p.id === ex.id; })) {
          inv.pericias.push({
            id: ex.id,
            nome: ex.nome,
            familia: ex.familia,
            especializavel: false,
            especializacao: '',
            base: ex.base,
            ocupacao: 0,
            interesse: 0,
            outros: 0,
            marcavel: true,
            marcada: false,
            customAdded: true
          });
        }
        $ctrl.fechar();
        CocStateService.salvarEstado();
      };
    }],
    template: `
      <!-- MODAL 1: GERENCIADOR DE INVESTIGADORES -->
      <div class="modal-backdrop no-print" ng-if="$ctrl.state.modalAberto === 'investigadores'" role="dialog" aria-modal="true">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.2rem;">Investigadores Salvos ({{$ctrl.state.investigadores.length}})</h2>
            <button type="button" class="btn btn-sm" ng-click="$ctrl.fechar()"> Fechar</button>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            <button type="button" class="btn btn-primary" ng-click="$ctrl.criarNovoInvestigador()">+ Novo Investigador</button>
            <label class="btn" style="cursor:pointer;">
              Importar JSON
              <input type="file" accept=".json,application/json" style="display:none;"
                onchange="angular.element(this).scope().$ctrl.importarArquivoJSON(this)" />
            </label>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.55rem;">
            <div ng-repeat="item in $ctrl.state.investigadores track by item.id"
              style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.65rem; background:var(--bg-card); border:2px solid {{item.id === $ctrl.inv().id ? 'var(--accent-primary)' : 'var(--border-color)'}}; border-radius:4px;">
              <div>
                <strong>{{item.identidade.nome || 'Sem Nome'}}</strong>
                <span class="badge-occ" ng-if="item.id === $ctrl.inv().id">ATIVO</span>
                <div style="font-size:0.78rem; color:var(--text-muted);">
                  {{item.ocupacaoNome}} • {{item.identidade.idade}} anos • PV {{item.derivados.pvAtual}}/{{item.derivados.pvMax}} • SAN {{item.derivados.sanAtual}}/{{item.derivados.sanMax}}
                </div>
              </div>
              <div style="display:flex; gap:0.35rem;">
                <button type="button" class="btn btn-sm btn-primary" ng-click="$ctrl.selecionarInvestigador(item.id)">Abrir</button>
                <button type="button" class="btn btn-sm" ng-click="$ctrl.duplicarInvestigador(item)">Duplicar</button>
                <button type="button" class="btn btn-sm" ng-click="$ctrl.svc.exportarJSON(item)">JSON</button>
                <button type="button" class="btn btn-sm btn-danger" ng-if="$ctrl.state.investigadores.length > 1" ng-click="$ctrl.excluirInvestigador(item.id)"></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 2: EXPORTAR PDF / ACROFORM / JSON -->
      <div class="modal-backdrop no-print" ng-if="$ctrl.state.modalAberto === 'pdf'" role="dialog" aria-modal="true">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.2rem;">Exportar Ficha Oficial (PDF) &amp; JSON</h2>
            <button type="button" class="btn btn-sm" ng-click="$ctrl.fechar()"> Fechar</button>
          </div>

          <div class="sheet-section-box" style="margin-bottom:0.85rem;">
            <h3 class="sheet-section-title">Opção 1: Imprimir / Salvar PDF A4 de 2 Páginas (@media print)</h3>
            <p style="font-size:0.86rem; margin-top:0;">Imprime a Ficha Oficial completa de 2 páginas (mesmo estando em uma aba resumida).</p>
            <button type="button" class="btn btn-primary" ng-click="$ctrl.imprimirDireto()">️ Imprimir / Salvar como PDF Agora</button>
          </div>

          <div class="sheet-section-box" style="margin-bottom:0.85rem;">
            <h3 class="sheet-section-title">Opção 2: Gerar Arquivo .PDF Nativo de 2 Páginas (pdf-lib)</h3>
            <button type="button" class="btn btn-gold" ng-click="$ctrl.baixarPDFOficial()">Baixar na Ficha Oficial Anexada (PDF Editável)</button><button type="button" class="btn" ng-click="$ctrl.baixarPDFNativo()">Baixar PDF Vetorial Compacto (.pdf)</button>
          </div>

          <div class="sheet-section-box" style="margin-bottom:0.85rem;">
            <h3 class="sheet-section-title">Opção 3: Preencher Ficha PDF Editável Oficial (AcroForm)</h3>
            <label class="btn" style="cursor:pointer;">
              Selecionar Arquivo PDF Externo...
              <input type="file" accept=".pdf,application/pdf" style="display:none;"
                onchange="angular.element(this).scope().$ctrl.preencherPDFEditavel(this)" />
            </label>
            <div style="margin-top:0.45rem; font-size:0.8rem; font-variant-numeric:tabular-nums;" ng-if="$ctrl.state.statusAcroForm">
              {{$ctrl.state.statusAcroForm}}
            </div>
          </div>

          <div class="sheet-section-box">
            <h3 class="sheet-section-title">Opção 4: Backup em JSON</h3>
            <button type="button" class="btn" ng-click="$ctrl.svc.exportarJSON($ctrl.inv())"> Exportar Investigador (.json)</button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: FASE DE DESENVOLVIMENTO -->
      <div class="modal-backdrop no-print" ng-if="$ctrl.state.modalAberto === 'desenvolvimento'" role="dialog" aria-modal="true">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.2rem;">Fase de Desenvolvimento do Investigador (pág. 94)</h2>
            <button type="button" class="btn btn-sm" ng-click="$ctrl.fechar()"> Fechar</button>
          </div>

          <p style="font-size:0.86rem; margin-top:0;">
            Role <code>1D100</code> para cada perícia marcada com <code>[]</code>. Se o resultado for <strong>maior que o valor atual</strong> (ou 96–100), a perícia sobe <strong>+1D10%</strong>!
          </p>

          <div class="alert" ng-if="$ctrl.periciasMarcadas().length === 0">
            Nenhuma perícia marcada no momento.
          </div>

          <div ng-if="$ctrl.periciasMarcadas().length > 0" style="margin-bottom:1rem;">
            <ul style="font-size:0.88rem;">
              <li ng-repeat="p in $ctrl.periciasMarcadas() track by p.id">
                <strong>{{p.nome}}</strong> ({{$ctrl.svc.obterTotalPericiaObj(p)}}%)
              </li>
            </ul>
            <button type="button" class="btn btn-primary" ng-click="$ctrl.executarFaseDesenvolvimento()">
              Rolar Evolução para {{$ctrl.periciasMarcadas().length}} Perícia(s)
            </button>
          </div>

          <div class="alert alert-success" ng-if="$ctrl.state.resultadoDesenvolvimento">
            <ul style="margin:0; padding-left:1.2rem; font-variant-numeric:tabular-nums; font-size:0.8rem;">
              <li ng-repeat="r in $ctrl.state.resultadoDesenvolvimento track by $index">{{r}}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- MODAL 4: ADICIONAR ESPECIALIZAÇÃO -->
      <div class="modal-backdrop no-print" ng-if="$ctrl.state.modalAberto === 'especializacao'" role="dialog" aria-modal="true">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.2rem;">+ Adicionar Especialização ou Perícia Incomum</h2>
            <button type="button" class="btn btn-sm" ng-click="$ctrl.fechar()"> Fechar</button>
          </div>

          <div class="sheet-section-box" style="margin-bottom:1rem;">
            <h3 class="sheet-section-title">1. Nova Especialidade (Arte/Ofício, Ciência, Língua, Pilotar, Sobrevivência)</h3>
            <div class="grid-2" style="margin-bottom:0.65rem;">
              <select class="form-select" ng-model="$ctrl.familiaEsp">
                <option value="arte_e_oficio">Arte e Ofício (Base 5%)</option>
                <option value="ciencia">Ciência (Base 1%)</option>
                <option value="lingua_outra">Língua - Outra (Base 1%)</option>
                <option value="pilotar">Pilotar (Base 1%)</option>
                <option value="sobrevivencia">Sobrevivência (Base 10%)</option>
              </select>
              <input type="text" class="form-input" placeholder="Ex.: Química, Latim, Fotografia..." ng-model="$ctrl.nomeEsp" />
            </div>
            <button type="button" class="btn btn-primary" ng-click="$ctrl.confirmarNovaEspecializacao()">+ Criar Especialização</button>
          </div>

          <div class="sheet-section-box">
            <h3 class="sheet-section-title">2. Perícias de Combate &amp; Incomuns do Cap. 4</h3>
            <div style="display:flex; gap:0.5rem;">
              <select class="form-select" style="flex:1;" ng-model="$ctrl.periciaExtraId">
                <option ng-repeat="ex in $ctrl.ESPECIALIZACOES_EXTRAS track by ex.id" value="{{ex.id}}">
                  {{ex.nome}} (Base {{ex.base}}%)
                </option>
              </select>
              <button type="button" class="btn btn-gold" ng-click="$ctrl.confirmarPericiaExtra()">+ Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    `
  });

})();
