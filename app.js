/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: app.js
 *
 * Controlador principal da aplicação:
 * - Gerenciamento de estado e persistência em localStorage (múltiplos investigadores)
 * - Investigador de exemplo oficial do Livro Básico: Harvey Walters (págs. 38 e 50-51)
 * - Assistente de Criação passo a passo (9 etapas com validação e rolagens)
 * - Ficha Viva de 2 páginas (Modo de Jogo) com Rolador 1d100 (Bônus/Penalidade,
 *   Forçar Teste, Gasto de Sorte, Combate/Lesão Grave, Sanidade/Loucura e Fase de Desenvolvimento)
 * - Exportação/Importação JSON e integração com PDFExport (pdf-lib e @media print)
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.App = (function () {
  'use strict';

  const STORAGE_KEY_LIST = 'coc7e_investigadores_v1';
  const STORAGE_KEY_ACTIVE = 'coc7e_investigador_ativo_v1';
  const STORAGE_KEY_THEME = 'coc7e_tema_v1';

  const ETAPAS_WIZARD = [
    { num: 1, titulo: 'Identidade', desc: 'Nome, jogador, idade (15–90), residência e conceito nos anos 1920.' },
    { num: 2, titulo: 'Atributos', desc: 'Geração de FOR, CON, TAM, DES, APA, INT, POD e EDU (3d6×5 e (2d6+6)×5).' },
    { num: 3, titulo: 'Idade & Sorte', desc: 'Verificações de melhoria de EDU, penalidades físicas/APA e Sorte (3d6×5).' },
    { num: 4, titulo: 'Derivados', desc: 'Pontos de Vida, Sanidade, Pontos de Magia, Esquiva, Dano Extra, Corpo e MOV.' },
    { num: 5, titulo: 'Ocupação', desc: 'Escolha da ocupação dos anos 1920, fórmula de pontos e escolhas ocupacionais.' },
    { num: 6, titulo: 'Perícias', desc: 'Distribuição de Pontos Ocupacionais e Interesses Pessoais (INT × 2).' },
    { num: 7, titulo: 'Antecedentes', desc: 'História, tabelas aleatórias (1d10) e escolha da Conexão-Chave (★).' },
    { num: 8, titulo: 'Armas & Bens', desc: 'Finanças da Década de 1920, Tabela XVII de Armas e Equipamentos.' },
    { num: 9, titulo: 'Revisão', desc: 'Checklist de validação das regras do livro, exportação PDF/JSON e Ficha Viva.' }
  ];

  // Estado em memória da sessão
  const state = {
    investigadores: [],
    ativoId: null,
    modo: 'ficha', // 'wizard' | 'ficha'
    etapaWizard: 1,
    abaFicha: 'ambas', // 'pagina1' | 'pagina2' | 'ambas'
    tema: 'light',
    // Filtros da Etapa 6
    filtroPericiaTexto: '',
    filtroPericiaTipo: 'todas', // 'todas' | 'ocupacionais' | 'investidas'
    edicaoLivreOcupacional: false,
    // Configuração do Rolador 1d100
    dadosBonusPenalidade: 0, // -2, -1, 0, +1, +2
    dificuldadeTeste: 'regular', // 'regular' | 'dificil' | 'extremo'
    ultimaRolagem: null,
    logRolagens: [],
    modalAberto: null, // null | 'investigadores' | 'pdf' | 'desenvolvimento' | 'especializacao'
    resultadoDesenvolvimento: null
  };

  /* ==========================================================================
     UTILITÁRIOS DE DADOS E FORMATAÇÃO
     ========================================================================== */

  function rolarDado(lados) {
    return Math.floor(Math.random() * lados) + 1;
  }

  function rolarMultiplosDados(qtd, lados, soma = 0, mult = 1) {
    const dados = [];
    for (let i = 0; i < qtd; i++) {
      dados.push(rolarDado(lados));
    }
    const somaDados = dados.reduce((acc, v) => acc + v, 0);
    const total = (somaDados + soma) * mult;
    return { dados, somaDados, soma, mult, total };
  }

  /**
   * Avalia e rola uma expressão de dano como "1D10+2", "1D3 + 1D4", "2D6+4", "1D6+1".
   */
  function rolarExpressaoDano(expressao) {
    const limpa = String(expressao || '1D3')
      .split('/')[0] // Caso espingarda "4D6 / 2D6 / 1D6", usa a primeira faixa (curto alcance)
      .replace(/½DX\s*\([^)]*\)/gi, '')
      .replace(/\+\s*queimar/gi, '')
      .replace(/\(raio[^)]*\)/gi, '')
      .trim();

    const regexToken = /([+-]?\s*(?:\d+[dD]\d+|\d+))/g;
    const tokens = limpa.match(regexToken);
    if (!tokens) {
      const d = rolarDado(3);
      return { total: d, detalhe: `1D3 (${d})` };
    }

    let total = 0;
    const partes = [];

    tokens.forEach((raw) => {
      const t = raw.replace(/\s+/g, '');
      const sinal = t.startsWith('-') ? -1 : 1;
      const semSinal = t.replace(/^[+-]/, '');
      if (/^\d+[dD]\d+$/i.test(semSinal)) {
        const [qtdStr, ladosStr] = semSinal.toLowerCase().split('d');
        const qtd = Math.max(1, parseInt(qtdStr, 10) || 1);
        const lados = Math.max(2, parseInt(ladosStr, 10) || 6);
        const rolagens = [];
        for (let i = 0; i < qtd; i++) rolagens.push(rolarDado(lados));
        const sub = rolagens.reduce((a, b) => a + b, 0) * sinal;
        total += sub;
        partes.push(`${sinal < 0 ? '-' : '+'}${qtd}D${lados}[${rolagens.join(',')}]`);
      } else {
        const num = (parseInt(semSinal, 10) || 0) * sinal;
        total += num;
        partes.push(`${num >= 0 ? '+' : ''}${num}`);
      }
    });

    total = Math.max(0, total);
    const detalhe = partes.join(' ').replace(/^\+/, '');
    return { total, detalhe };
  }

  function escaparHTML(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function gerarIdUnico() {
    return 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ==========================================================================
     CRIAÇÃO E RECÁLCULO DE INVESTIGADOR
     ========================================================================== */

  function criarListaPericiasPadrao(des = 50, edu = 60, usarNatacao10 = false) {
    const R = window.CoC7e.Regras;
    return window.CoC7e.PERICIAS_BASE.map((p) => {
      let baseNum = typeof p.base === 'number' ? p.base : 0;
      if (p.base === 'METADE_DES') baseNum = R.calcularEsquivaBase(des);
      if (p.base === 'EDU') baseNum = Number(edu) || 0;
      if (p.id === 'natacao' && usarNatacao10) baseNum = 10;

      let nomeExibicao = p.nome;
      let especializacao = '';
      if (p.id === 'lingua_nativa') {
        especializacao = 'Inglês';
        nomeExibicao = 'Língua (Nativa: Inglês)';
      } else if (p.especializavel) {
        especializacao = p.opcoesSugeridas ? p.opcoesSugeridas[0] : 'Geral';
        nomeExibicao = `${p.familia} (${especializacao})`;
      }

      return {
        id: p.id,
        nome: nomeExibicao,
        familia: p.familia || p.nome,
        especializacao,
        especializavel: Boolean(p.especializavel),
        permiteRotuloCustom: Boolean(p.permiteRotuloCustom),
        categoria: p.categoria,
        base: baseNum,
        ocupacao: 0,
        interesse: 0,
        outros: 0,
        marcada: false,
        marcavel: p.marcavel !== false,
        bloqueadaNaCriacao: Boolean(p.bloqueadaNaCriacao),
        interpessoal: Boolean(p.interpessoal)
      };
    });
  }

  function criarNovoInvestigadorVazio() {
    const id = gerarIdUnico();
    const inv = {
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      metodoAtributos: 'rolagem', // 'rolagem' | 'conjunto_fixo' | 'compra'
      limitePericia75: true,
      usarNatacao10: false,
      identidade: {
        nome: '',
        jogador: '',
        idade: 28,
        sexo: '',
        residencia: 'Arkham, Massachusetts',
        localNascimento: 'Boston, Massachusetts'
      },
      atributosBase: {
        FOR: 50,
        CON: 55,
        TAM: 60,
        DES: 60,
        APA: 50,
        INT: 65,
        POD: 55,
        EDU: 65
      },
      idadeAjustes: {
        ganhoEDU: 0,
        logMelhoriasEDU: [],
        reducaoFOR: 0,
        reducaoCON: 0,
        reducaoTAM: 0,
        reducaoDES: 0,
        sorteRolagem1: 50,
        sorteRolagem2: null
      },
      atributosFinais: {},
      ocupacaoId: 'detetive_particular',
      ocupacaoNome: 'Detetive Particular',
      ocupacaoAtributoEscolhido: 'DES',
      ocupacaoPericiasEscolhidas: ['persuasao', 'armas_de_fogo_pistolas'],
      ocupacaoCustom: {
        nome: 'Investigador Independente',
        creditoMin: 9,
        creditoMax: 50,
        formula: { base: { EDU: 4 }, opcoes: [] }
      },
      derivados: {
        pvAtual: 11,
        pvMax: 11,
        sanAtual: 55,
        sanInicial: 55,
        sanMax: 99,
        sanInicioDia: 55,
        perdaSanDia: 0,
        pmAtual: 11,
        pmMax: 11,
        sorteInicial: 50,
        sorteAtual: 50,
        esquivaBase: 30,
        danoExtra: 'Nenhum',
        corpo: 0,
        movBase: 8,
        mov: 8,
        lesaoGrave: false,
        inconsciente: false,
        morrendo: false,
        insanidadeTemporaria: false,
        insanidadeIndefinida: false
      },
      pericias: criarListaPericiasPadrao(60, 65, false),
      antecedentes: {
        descricaoPessoal: '',
        ideologiaCrencas: '',
        pessoasSignificativas: '',
        locaisImportantes: '',
        pertencesQueridos: '',
        caracteristicas: '',
        ferimentosCicatrizes: '',
        fobiasManias: '',
        tomosFeiticos: '',
        encontrosEntidades: '',
        conexaoChave: 'Pessoas Significativas'
      },
      armas: [
        JSON.parse(JSON.stringify(window.CoC7e.ARMAS_LIVRO[0])) // Desarmado
      ],
      equipamentos: [
        'Caderno de Rascunho e Caneta-Tinteiro',
        'Lanterna Elétrica (Tocha) + Baterias',
        'Relógio de Bolso'
      ],
      financasCustom: {
        nivelGastos: '',
        dinheiro: '',
        patrimonio: ''
      },
      companheiros: []
    };

    recalcularInvestigador(inv, { resetarAtuais: true });
    return inv;
  }

  /**
   * Cria o investigador oficial de exemplo do Livro Básico:
   * Harvey Walters (Jornalista, 42 anos — págs. 38, 50 e 51).
   */
  function criarHarveyWaltersExemplo() {
    const inv = criarNovoInvestigadorVazio();
    inv.id = 'inv_harvey_walters_1920';
    inv.identidade = {
      nome: 'Harvey Walters',
      jogador: 'Exemplo do Livro Básico (pág. 38 / 50–51)',
      idade: 42,
      sexo: 'Masc.',
      residencia: 'Nova Iorque',
      localNascimento: 'Boston'
    };
    inv.atributosBase = {
      FOR: 20,
      CON: 70,
      TAM: 80,
      DES: 60,
      APA: 85,
      INT: 85,
      POD: 45,
      EDU: 80
    };
    inv.idadeAjustes = {
      ganhoEDU: 4,
      logMelhoriasEDU: [
        '1ª verificação: rolou 86 (> 80) → melhorou +4 pontos (EDU 84).',
        '2ª verificação: rolou 82 (≤ 84) → sem melhoria.'
      ],
      reducaoFOR: 0,
      reducaoCON: 0,
      reducaoTAM: 0,
      reducaoDES: 5,
      sorteRolagem1: 45,
      sorteRolagem2: null
    };
    inv.ocupacaoId = 'jornalista';
    inv.ocupacaoNome = 'Jornalista';
    inv.ocupacaoPericiasEscolhidas = ['charme', 'persuasao', 'ocultismo', 'arqueologia', 'lingua_outra'];
    inv.limitePericia75 = false; // Harvey Walters possui Arqueologia 80% e Latim 84% na pág. 50

    // Ajusta perícias exatas da ficha da página 50
    inv.pericias = criarListaPericiasPadrao(55, 84, false);
    const definirPericiaHarvey = (id, ocupacao, interesse, esp) => {
      const p = inv.pericias.find((x) => x.id === id);
      if (!p) return;
      p.ocupacao = ocupacao;
      p.interesse = interesse;
      if (esp) {
        p.especializacao = esp;
        p.nome = p.id === 'lingua_nativa' ? `Língua (Nativa: ${esp})` : `${p.familia} (${esp})`;
      }
    };

    // Na pág. 38 e 50: 336 pts de ocupação (EDU 84 * 4) e 170 pts de interesse (INT 85 * 2)
    // Valores finais de Harvey na pág. 50:
    // Arqueologia 80% (base 1 + 79), Arte/Ofício (Fotografia) 25% (base 5 + 20),
    // Charme 25% (base 15 + 10), Nível de Crédito 41% (base 0 + 41),
    // História 66% (base 5 + 61), Língua Outra (Latim) 84% (base 1 + 83),
    // Língua Nativa 84% (base 84 + 0), Usar Bibliotecas 65% (base 20 + 45),
    // Ocultismo 62% (base 5 + 57), Persuasão 55% (base 10 + 45),
    // Pilotar (Aeronaves) 50% (base 1 + 49), Psicologia 70% (base 10 + 60)
    // Soma dos aumentos = 79+20+10+41+61+83+45+57+45+49+60 = 550 (ou com ajustes da ficha).
    // Vamos distribuir fielmente aos totais da página 50:
    definirPericiaHarvey('arte_e_oficio', 20, 0, 'Fotografia'); // Total 25%
    definirPericiaHarvey('nivel_de_credito', 41, 0); // Total 41%
    definirPericiaHarvey('historia', 61, 0); // Total 66%
    definirPericiaHarvey('usar_bibliotecas', 45, 0); // Total 65%
    definirPericiaHarvey('psicologia', 60, 0); // Total 70%
    definirPericiaHarvey('persuasao', 45, 0); // Total 55%
    definirPericiaHarvey('charme', 10, 0); // Total 25%
    definirPericiaHarvey('ocultismo', 54, 3); // Total 62%
    definirPericiaHarvey('arqueologia', 0, 79); // Total 80%
    definirPericiaHarvey('lingua_outra', 0, 83, 'Latim'); // Total 84%
    definirPericiaHarvey('pilotar', 0, 5, 'Aeronaves'); // Base 1 + 5 interesse + 44 outros = 50% na ficha impressa
    const pPilotar = inv.pericias.find((x) => x.id === 'pilotar');
    if (pPilotar) pPilotar.outros = 44; // Na ficha impressa da pág. 50 consta Pilotar (Aeronaves) 50%

    inv.antecedentes = {
      descricaoPessoal: 'Bonito, bem vestido e um pouco acima do peso.',
      ideologiaCrencas: 'Destino. Procura por sinais e presságios.',
      pessoasSignificativas: 'Tio Theodore, que inspirou o seu amor pela arqueologia. Harvey buscará se provar um homem melhor do que seu tio, que enlouqueceu com suas obsessões.',
      locaisImportantes: 'Estúdio no andar superior de sua casa.',
      pertencesQueridos: 'Artefatos arqueológicos que pertenciam a seu tio, que agora estão no estúdio de Harvey.',
      caracteristicas: 'Galanteador.',
      ferimentosCicatrizes: '',
      fobiasManias: '',
      tomosFeiticos: '',
      encontrosEntidades: '',
      conexaoChave: 'Pertences Queridos'
    };

    inv.equipamentos = [
      'Caderno e caneta',
      'Câmera fotográfica',
      'Moeda da sorte',
      'Apartamento alugado em Nova Iorque'
    ];

    recalcularInvestigador(inv, { resetarAtuais: true });
    return inv;
  }

  /**
   * Recalcula atributos finais (pós-idade), atributos derivados e bases dinâmicas de perícias.
   */
  function recalcularInvestigador(inv, opcoes = {}) {
    const R = window.CoC7e.Regras;
    const idade = Math.max(15, Math.min(90, Number(inv.identidade?.idade) || 28));
    const regraIdade = R.obterRegraIdade(idade);

    const base = inv.atributosBase || {};
    const aj = inv.idadeAjustes || {};

    // Calcula Atributos Finais aplicando modificadores de idade (pág. 32)
    const redFOR = regraIdade.atributosPenalidadeFisica.includes('FOR') ? (Number(aj.reducaoFOR) || 0) : 0;
    const redCON = regraIdade.atributosPenalidadeFisica.includes('CON') ? (Number(aj.reducaoCON) || 0) : 0;
    const redTAM = regraIdade.atributosPenalidadeFisica.includes('TAM') ? (Number(aj.reducaoTAM) || 0) : 0;
    const redDES = regraIdade.atributosPenalidadeFisica.includes('DES') ? (Number(aj.reducaoDES) || 0) : 0;
    const redAPA = regraIdade.penalidadeAPA || 0;
    const redEDU = regraIdade.penalidadeEDU || 0;
    const ganhoEDU = regraIdade.melhoriasEDU > 0 ? (Number(aj.ganhoEDU) || 0) : 0;

    inv.atributosFinais = {
      FOR: Math.max(1, (Number(base.FOR) || 0) - redFOR),
      CON: Math.max(1, (Number(base.CON) || 0) - redCON),
      TAM: Math.max(1, (Number(base.TAM) || 0) - redTAM),
      DES: Math.max(1, (Number(base.DES) || 0) - redDES),
      APA: Math.max(1, (Number(base.APA) || 0) - redAPA),
      INT: Math.max(1, Number(base.INT) || 0),
      POD: Math.max(1, Number(base.POD) || 0),
      EDU: Math.min(99, Math.max(1, (Number(base.EDU) || 0) - redEDU + ganhoEDU))
    };

    const atr = inv.atributosFinais;

    // Atualiza base de Esquivar (DES / 2), Língua Nativa (EDU) e Natação (20% ou 10%)
    (inv.pericias || []).forEach((p) => {
      if (p.id === 'esquivar') {
        p.base = R.calcularEsquivaBase(atr.DES);
      } else if (p.id === 'lingua_nativa') {
        p.base = atr.EDU;
      } else if (p.id === 'natacao') {
        p.base = inv.usarNatacao10 ? 10 : 20;
      }
    });

    const mythosPericia = (inv.pericias || []).find((p) => p.id === 'mythos_de_cthulhu');
    const mythosTotal = mythosPericia
      ? Number(mythosPericia.base || 0) + Number(mythosPericia.ocupacao || 0) + Number(mythosPericia.interesse || 0) + Number(mythosPericia.outros || 0)
      : 0;

    const pvMax = R.calcularPVMax(atr.CON, atr.TAM);
    const san = R.calcularSanidade(atr.POD, mythosTotal);
    const pmMax = R.calcularPontosMagiaMax(atr.POD);
    const esquivaBase = R.calcularEsquivaBase(atr.DES);
    const dxc = R.calcularDanoExtraECorpo(atr.FOR, atr.TAM);
    const movObj = R.calcularMOV(atr.FOR, atr.DES, atr.TAM, idade);

    const s1 = Number(aj.sorteRolagem1) || 50;
    const s2 = regraIdade.sorteDupla && aj.sorteRolagem2 !== null ? Number(aj.sorteRolagem2) : s1;
    const sorteInicial = regraIdade.sorteDupla ? Math.max(s1, s2) : s1;

    const d = inv.derivados || {};
    const pvAntigoMax = d.pvMax || pvMax;
    const pmAntigoMax = d.pmMax || pmMax;

    d.pvMax = pvMax;
    d.sanInicial = san.inicial;
    d.sanMax = san.maxima;
    d.pmMax = pmMax;
    d.esquivaBase = esquivaBase;
    d.danoExtra = dxc.danoExtra;
    d.corpo = dxc.corpo;
    d.movBase = movObj.movBase;
    d.mov = movObj.movFinal;
    d.sorteInicial = sorteInicial;

    if (opcoes.resetarAtuais || d.pvAtual === undefined) {
      d.pvAtual = pvMax;
      d.sanAtual = san.inicial;
      d.sanInicioDia = san.inicial;
      d.perdaSanDia = 0;
      d.pmAtual = pmMax;
      d.sorteAtual = sorteInicial;
    } else {
      if (d.pvAtual === pvAntigoMax) d.pvAtual = pvMax;
      else d.pvAtual = Math.min(d.pvAtual, pvMax);
      d.sanAtual = Math.min(d.sanAtual, san.maxima);
      if (d.pmAtual === pmAntigoMax) d.pmAtual = pmMax;
      else d.pmAtual = Math.min(d.pmAtual, pmMax);
    }

    inv.derivados = d;

    // Atualiza nome da ocupação
    const ocupObj = obterOcupacaoAtual(inv);
    inv.ocupacaoNome = ocupObj.personalizada ? (inv.ocupacaoCustom?.nome || 'Ocupação Personalizada') : ocupObj.nome;
    inv.atualizadoEm = new Date().toISOString();
  }

  function obterOcupacaoAtual(inv) {
    const encontrada = window.CoC7e.OCUPACOES.find((o) => o.id === inv.ocupacaoId) || window.CoC7e.OCUPACOES[0];
    if (encontrada.personalizada && inv.ocupacaoCustom) {
      return {
        ...encontrada,
        nome: inv.ocupacaoCustom.nome || encontrada.nome,
        creditoMin: Number(inv.ocupacaoCustom.creditoMin) || 0,
        creditoMax: Number(inv.ocupacaoCustom.creditoMax) || 99,
        formula: inv.ocupacaoCustom.formula || encontrada.formula
      };
    }
    return encontrada;
  }

  function ehPericiaOcupacional(inv, pericia) {
    if (pericia.id === 'nivel_de_credito') return true;
    const ocup = obterOcupacaoAtual(inv);
    if (ocup.periciasFixas && ocup.periciasFixas.includes(pericia.id)) return true;
    // Também verifica família base (ex.: especializações criadas de arte_e_oficio, ciencia, lingua_outra)
    const idBase = pericia.idBase || pericia.id;
    if (ocup.periciasFixas && ocup.periciasFixas.includes(idBase)) return true;
    if ((inv.ocupacaoPericiasEscolhidas || []).includes(pericia.id) || (inv.ocupacaoPericiasEscolhidas || []).includes(idBase)) {
      return true;
    }
    return false;
  }

  function calcularTotaisPericias(inv) {
    const R = window.CoC7e.Regras;
    const ocup = obterOcupacaoAtual(inv);
    const calcOcup = R.calcularPontosOcupacao(ocup, inv.atributosFinais, inv.ocupacaoAtributoEscolhido);
    const totalOcupacao = calcOcup.total;
    const totalInteresse = R.calcularPontosInteresse(inv.atributosFinais.INT);

    let gastosOcupacao = 0;
    let gastosInteresse = 0;

    (inv.pericias || []).forEach((p) => {
      gastosOcupacao += Math.max(0, Number(p.ocupacao) || 0);
      gastosInteresse += Math.max(0, Number(p.interesse) || 0);
    });

    const pCred = (inv.pericias || []).find((p) => p.id === 'nivel_de_credito');
    const nivelCredito = pCred
      ? Number(pCred.base || 0) + Number(pCred.ocupacao || 0) + Number(pCred.interesse || 0) + Number(pCred.outros || 0)
      : 0;

    return {
      totalOcupacao,
      gastosOcupacao,
      restantesOcupacao: totalOcupacao - gastosOcupacao,
      detalhamentoOcupacao: calcOcup.detalhamento,
      atributoOpcaoUsado: calcOcup.atributoOpcaoUsado,
      totalInteresse,
      gastosInteresse,
      restantesInteresse: totalInteresse - gastosInteresse,
      nivelCredito,
      creditoMin: ocup.creditoMin,
      creditoMax: ocup.creditoMax,
      creditoValido: nivelCredito >= ocup.creditoMin && nivelCredito <= ocup.creditoMax
    };
  }

  /* ==========================================================================
     PERSISTÊNCIA (LOCALSTORAGE) E GERENCIAMENTO DE MÚLTIPLOS INVESTIGADORES
     ========================================================================== */

  function carregarEstadoLocalStorage() {
    try {
      const temaSalvo = localStorage.getItem(STORAGE_KEY_THEME);
      if (temaSalvo === 'dark' || temaSalvo === 'light') {
        state.tema = temaSalvo;
      }
      aplicarTemaDOM();

      const rawList = localStorage.getItem(STORAGE_KEY_LIST);
      if (rawList) {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.investigadores = parsed;
        }
      }

      if (state.investigadores.length === 0) {
        const harvey = criarHarveyWaltersExemplo();
        state.investigadores = [harvey];
        state.ativoId = harvey.id;
        state.modo = 'ficha';
        salvarEstadoLocalStorage();
      } else {
        const ativoSalvo = localStorage.getItem(STORAGE_KEY_ACTIVE);
        const existe = state.investigadores.find((x) => x.id === ativoSalvo);
        state.ativoId = existe ? existe.id : state.investigadores[0].id;
      }

      const invAtivo = obterInvestigadorAtivo();
      if (invAtivo) {
        recalcularInvestigador(invAtivo, { resetarAtuais: false });
      }
    } catch (err) {
      console.error('Erro ao carregar localStorage:', err);
      const harvey = criarHarveyWaltersExemplo();
      state.investigadores = [harvey];
      state.ativoId = harvey.id;
    }
  }

  function salvarEstadoLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(state.investigadores));
      if (state.ativoId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE, state.ativoId);
      }
      localStorage.setItem(STORAGE_KEY_THEME, state.tema);
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  }

  function obterInvestigadorAtivo() {
    return state.investigadores.find((x) => x.id === state.ativoId) || state.investigadores[0];
  }

  function aplicarTemaDOM() {
    document.documentElement.setAttribute('data-theme', state.tema);
  }

  function alternarTema() {
    state.tema = state.tema === 'dark' ? 'light' : 'dark';
    aplicarTemaDOM();
    salvarEstadoLocalStorage();
    renderizarApp();
  }

  /* ==========================================================================
     SISTEMA DE ROLAGENS 1D100 (BÔNUS/PENALIDADE, FORÇAR TESTE, GASTAR SORTE)
     ========================================================================== */

  /**
   * Executa uma rolagem de 1D100 seguindo as regras do Capítulo 5 (págs. 89-99).
   */
  function executarRolagem1D100({ nome, valorAlvo, tipo = 'pericia', periciaId = null, defeitoArma = null, testeForcado = false }) {
    const R = window.CoC7e.Regras;
    const inv = obterInvestigadorAtivo();

    const qtdExtras = Math.abs(state.dadosBonusPenalidade);
    const modoDados = state.dadosBonusPenalidade > 0 ? 'bonus' : state.dadosBonusPenalidade < 0 ? 'penalidade' : 'normal';

    const unidade = Math.floor(Math.random() * 10); // 0 a 9
    const dezenas = [];
    for (let i = 0; i < 1 + qtdExtras; i++) {
      dezenas.push(Math.floor(Math.random() * 10)); // 0 a 9
    }

    const comb = R.combinarDadosD100(unidade, dezenas, modoDados);
    const avaliacao = R.avaliarSucesso(comb.resultadoFinal, valorAlvo, state.dificuldadeTeste);

    const ehSanidade = tipo === 'sanidade';
    const ehSorte = tipo === 'sorte';
    const ehCombate = tipo === 'combate';

    const houveDefeitoArma = defeitoArma && !isNaN(Number(defeitoArma)) && comb.resultadoFinal >= Number(defeitoArma);

    // Se teve sucesso em uma perícia elegível durante o jogo, marca automaticamente a caixa de experiência (pág. 94)
    let marcouExperiencia = false;
    if (avaliacao.sucesso && periciaId) {
      const perObj = (inv.pericias || []).find((p) => p.id === periciaId);
      if (perObj && perObj.marcavel && !perObj.marcada) {
        perObj.marcada = true;
        marcouExperiencia = true;
        salvarEstadoLocalStorage();
      }
    }

    const opcoesSorte = R.calcularOpcoesGastoSorte(comb.resultadoFinal, valorAlvo, inv.derivados.sorteAtual, {
      testeForcado,
      ehSanidade,
      ehSorte,
      defeitoArma: defeitoArma && !isNaN(Number(defeitoArma)) ? Number(defeitoArma) : null
    });

    const registro = {
      id: 'roll_' + Date.now(),
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nome,
      valorAlvo,
      tipo,
      periciaId,
      defeitoArma,
      houveDefeitoArma,
      testeForcado,
      modoDados,
      qtdExtras,
      dificuldadeExigida: state.dificuldadeTeste,
      unidade: comb.unidade,
      dezenas: comb.dezenas,
      todosResultados: comb.todosResultados,
      resultadoFinal: comb.resultadoFinal,
      avaliacao,
      opcoesSorte,
      sorteGasta: 0,
      marcouExperiencia,
      podeForcar: !avaliacao.sucesso && !testeForcado && !ehSanidade && !ehSorte && !ehCombate
    };

    state.ultimaRolagem = registro;
    state.logRolagens.unshift(registro);
    if (state.logRolagens.length > 40) state.logRolagens.pop();

    renderizarApp();
  }

  /**
   * Gasta pontos de Sorte para melhorar a última rolagem (pág. 99).
   */
  function gastarSorteNaUltimaRolagem(custo, nivelAlvo) {
    const R = window.CoC7e.Regras;
    const inv = obterInvestigadorAtivo();
    const roll = state.ultimaRolagem;
    if (!roll || inv.derivados.sorteAtual < custo) return;

    inv.derivados.sorteAtual -= custo;
    roll.resultadoFinal = Math.max(1, roll.resultadoFinal - custo);
    roll.sorteGasta += custo;
    roll.avaliacao = R.avaliarSucesso(roll.resultadoFinal, roll.valorAlvo, roll.dificuldadeExigida);
    roll.opcoesSorte = { permitido: false, motivoBloqueio: `Você gastou ${custo} ponto(s) de Sorte para alcançar ${nivelAlvo}.`, opcoesGasto: [] };
    roll.podeForcar = false;

    // Marca perícia se passou a ter sucesso
    if (roll.avaliacao.sucesso && roll.periciaId) {
      const perObj = (inv.pericias || []).find((p) => p.id === roll.periciaId);
      if (perObj && perObj.marcavel && !perObj.marcada) {
        perObj.marcada = true;
        roll.marcouExperiencia = true;
      }
    }

    salvarEstadoLocalStorage();
    renderizarApp();
  }

  /* ==========================================================================
     RENDERIZAÇÃO PRINCIPAL
     ========================================================================== */

  function renderizarApp() {
    const root = document.getElementById('app-root');
    if (!root) return;

    const inv = obterInvestigadorAtivo();
    if (!inv) return;

    root.innerHTML = `
      ${renderizarCabecalho(inv)}
      <main class="app-main" id="conteudo-principal">
        ${state.modo === 'wizard' ? renderizarWizard(inv) : renderizarFichaViva(inv)}
      </main>
      ${renderizarModalAtivo(inv)}
    `;

    vincularEventosDOM(inv);
  }

  function renderizarCabecalho(inv) {
    const nomeInv = inv.identidade?.nome?.trim() || 'Investigador Sem Nome';
    const ocupInv = inv.ocupacaoNome || 'Sem Ocupação';
    return `
      <header class="app-header no-print">
        <div class="header-inner">
          <div class="brand-block">
            <div class="brand-seal" aria-hidden="true">⚝</div>
            <div>
              <h1 class="brand-title">Chamado de Cthulhu — 7ª Edição</h1>
              <p class="brand-subtitle">Criador &amp; Ficha Viva de Investigador (Anos 1920 • PT-BR) — Ativo: <strong>${escaparHTML(nomeInv)}</strong> (${escaparHTML(ocupInv)})</p>
            </div>
          </div>

          <div class="header-actions" role="toolbar" aria-label="Ações Principais">
            <button type="button" class="btn ${state.modo === 'wizard' ? 'btn-primary' : ''}" data-action="ir-wizard">
              🧭 Assistente (9 Passos)
            </button>
            <button type="button" class="btn ${state.modo === 'ficha' ? 'btn-primary' : ''}" data-action="ir-ficha">
              📜 Ficha Viva (2 Páginas)
            </button>
            <button type="button" class="btn" data-action="abrir-modal" data-modal="investigadores">
              🗂️ Investigadores (${state.investigadores.length})
            </button>
            <button type="button" class="btn btn-gold" data-action="abrir-modal" data-modal="pdf">
              🖨️ Exportar / PDF
            </button>
            <button type="button" class="btn" data-action="alternar-tema" title="Alternar entre Modo Claro (Papel Envelhecido) e Modo Escuro">
              ${state.tema === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
            </button>
          </div>
        </div>
      </header>
    `;
  }

  /* ==========================================================================
     RENDERIZAÇÃO DO ASSISTENTE DE CRIAÇÃO (9 ETAPAS)
     ========================================================================== */

  function renderizarWizard(inv) {
    const pct = Math.round((state.etapaWizard / ETAPAS_WIZARD.length) * 100);
    const etapaObj = ETAPAS_WIZARD.find((e) => e.num === state.etapaWizard) || ETAPAS_WIZARD[0];

    let conteudoEtapa = '';
    switch (state.etapaWizard) {
      case 1: conteudoEtapa = renderizarEtapa1Identidade(inv); break;
      case 2: conteudoEtapa = renderizarEtapa2Atributos(inv); break;
      case 3: conteudoEtapa = renderizarEtapa3IdadeESorte(inv); break;
      case 4: conteudoEtapa = renderizarEtapa4Derivados(inv); break;
      case 5: conteudoEtapa = renderizarEtapa5Ocupacao(inv); break;
      case 6: conteudoEtapa = renderizarEtapa6Pericias(inv); break;
      case 7: conteudoEtapa = renderizarEtapa7Antecedentes(inv); break;
      case 8: conteudoEtapa = renderizarEtapa8ArmasEBens(inv); break;
      case 9: conteudoEtapa = renderizarEtapa9Revisao(inv); break;
      default: conteudoEtapa = renderizarEtapa1Identidade(inv);
    }

    return `
      <nav class="wizard-progress no-print" aria-label="Etapas de Criação do Investigador">
        <ol class="wizard-steps-list">
          ${ETAPAS_WIZARD.map((e) => `
            <li>
              <button type="button"
                class="wizard-step-btn ${e.num === state.etapaWizard ? 'active' : e.num < state.etapaWizard ? 'completed' : ''}"
                data-action="mudar-etapa" data-etapa="${e.num}">
                <span class="step-num">Passo ${e.num}</span>
                ${escaparHTML(e.titulo)}
              </button>
            </li>
          `).join('')}
        </ol>
        <div class="wizard-progress-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="wizard-progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </nav>

      <section class="deco-frame">
        <header class="step-header">
          <div>
            <h2 class="step-title">Passo ${etapaObj.num} de 9 — ${escaparHTML(etapaObj.titulo)}</h2>
            <p class="step-desc">${escaparHTML(etapaObj.desc)}</p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm" data-action="novo-em-branco">✨ Novo em Branco</button>
            <button type="button" class="btn btn-sm" data-action="carregar-harvey">📖 Exemplo do Livro (Harvey Walters)</button>
          </div>
        </header>

        ${conteudoEtapa}

        <footer class="wizard-footer">
          <button type="button" class="btn" data-action="etapa-anterior" ${state.etapaWizard <= 1 ? 'disabled' : ''}>
            ← Passo Anterior
          </button>
          <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-muted);">
            Salvamento automático ativo • Passo ${state.etapaWizard}/9
          </span>
          ${state.etapaWizard < 9
            ? `<button type="button" class="btn btn-primary" data-action="proxima-etapa">Próximo Passo →</button>`
            : `<button type="button" class="btn btn-primary" data-action="ir-ficha">📜 Concluir e Abrir Ficha Viva →</button>`
          }
        </footer>
      </section>
    `;
  }

  /* --- PASSO 1: IDENTIDADE --- */
  function renderizarEtapa1Identidade(inv) {
    const R = window.CoC7e.Regras;
    const id = inv.identidade || {};
    const regraIdade = R.obterRegraIdade(id.idade || 28);

    return `
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="inp-nome">
            Nome do Investigador
            <button type="button" class="btn btn-sm" data-action="sortear-nome-1920">🎲 Sugerir Nome 1920s</button>
          </label>
          <input id="inp-nome" type="text" class="form-input" data-bind-identidade="nome" value="${escaparHTML(id.nome)}" placeholder="Ex.: Harvey Walters, Evelyn Clarke..." />
        </div>

        <div class="form-group">
          <label class="form-label" for="inp-jogador">Nome do(a) Jogador(a)</label>
          <input id="inp-jogador" type="text" class="form-input" data-bind-identidade="jogador" value="${escaparHTML(id.jogador)}" placeholder="Seu nome" />
        </div>

        <div class="form-group">
          <label class="form-label" for="inp-idade">Idade (15 a 90 anos — pág. 32)</label>
          <input id="inp-idade" type="number" min="15" max="90" class="form-input" data-bind-identidade="idade" value="${Number(id.idade) || 28}" />
          <span class="form-hint">A idade define verificações de melhoria de EDU, penalidades físicas/APA e MOV.</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="inp-sexo">Sexo / Pronomes</label>
          <input id="inp-sexo" type="text" class="form-input" data-bind-identidade="sexo" value="${escaparHTML(id.sexo)}" placeholder="Ex.: Masc., Fem., Não-binário..." />
        </div>

        <div class="form-group">
          <label class="form-label" for="inp-residencia">Residência (Década de 1920)</label>
          <input id="inp-residencia" type="text" class="form-input" data-bind-identidade="residencia" value="${escaparHTML(id.residencia)}" placeholder="Ex.: Arkham, MA / Nova Iorque / Londres" />
        </div>

        <div class="form-group">
          <label class="form-label" for="inp-nascimento">Local de Nascimento</label>
          <input id="inp-nascimento" type="text" class="form-input" data-bind-identidade="localNascimento" value="${escaparHTML(id.localNascimento)}" placeholder="Ex.: Boston, MA / São Paulo / Providence" />
        </div>
      </div>

      <div class="alert" style="margin-top: 1.15rem;">
        <strong>Faixa Etária Selecionada — ${escaparHTML(regraIdade.rotulo)} (pág. 32):</strong><br/>
        ${escaparHTML(regraIdade.descricao)}
      </div>
    `;
  }

  /* --- PASSO 2: ATRIBUTOS PRINCIPAIS --- */
  function renderizarEtapa2Atributos(inv) {
    const R = window.CoC7e.Regras;
    const T = window.CoC7e.TABELAS;
    const base = inv.atributosBase || {};
    const somaPontos = Object.values(base).reduce((acc, v) => acc + (Number(v) || 0), 0);

    // Verifica aderência ao Conjunto Fixo (40, 50, 50, 50, 60, 60, 70, 80)
    const valoresAtuaisOrd = Object.values(base).map((v) => Number(v) || 0).sort((a, b) => a - b);
    const fixoOrd = [...T.CONJUNTO_FIXO_ATRIBUTOS].sort((a, b) => a - b);
    const bateConjuntoFixo = JSON.stringify(valoresAtuaisOrd) === JSON.stringify(fixoOrd);

    return `
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem; background:var(--bg-elevated); padding:0.75rem; border-radius:4px; border:1px solid var(--border-color);">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.6rem;">
          <label for="sel-metodo-atr" style="font-weight:bold; font-size:0.9rem;">Método de Geração (págs. 30 e 48):</label>
          <select id="sel-metodo-atr" class="form-select" data-action="mudar-metodo-atributos">
            <option value="rolagem" ${inv.metodoAtributos === 'rolagem' ? 'selected' : ''}>Rolagem Clássica (3d6×5 e (2d6+6)×5)</option>
            <option value="conjunto_fixo" ${inv.metodoAtributos === 'conjunto_fixo' ? 'selected' : ''}>Tiro Rápido — Conjunto Fixo (40, 50, 50, 50, 60, 60, 70, 80)</option>
            <option value="compra" ${inv.metodoAtributos === 'compra' ? 'selected' : ''}>Compra de Pontos (460 pontos)</option>
          </select>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" data-action="rolar-todos-atributos">
            🎲 Rolar Todos os Atributos
          </button>
          <button type="button" class="btn" data-action="aplicar-conjunto-fixo">
            📋 Aplicar Conjunto Fixo Padrão
          </button>
        </div>
      </div>

      ${inv.metodoAtributos === 'conjunto_fixo' ? `
        <div class="alert ${bateConjuntoFixo ? 'alert-success' : 'alert-warning'}">
          <strong>Método do Tiro Rápido (pág. 48):</strong> Distribua os 8 valores fixos <code>40, 50, 50, 50, 60, 60, 70, 80</code> entre os atributos.
          <br/>Valores atuais ordenados: <code>${valoresAtuaisOrd.join(', ')}</code> — ${bateConjuntoFixo ? '✓ Conjunto Fixo exato!' : '⚠️ Os valores atuais divergem do conjunto fixo.'}
        </div>
      ` : ''}

      ${inv.metodoAtributos === 'compra' ? `
        <div class="alert ${somaPontos === T.PONTOS_COMPRA_ATRIBUTOS ? 'alert-success' : 'alert-warning'}">
          <strong>Compra de Pontos (pág. 48):</strong> Distribua <strong>${T.PONTOS_COMPRA_ATRIBUTOS}</strong> pontos entre os 8 atributos (mínimo recomendado 15 para 3d6×5 e 40 para (2d6+6)×5; máximo 90).
          <br/>Total Distribuído: <strong>${somaPontos} / ${T.PONTOS_COMPRA_ATRIBUTOS}</strong> (${T.PONTOS_COMPRA_ATRIBUTOS - somaPontos >= 0 ? `Faltam ${T.PONTOS_COMPRA_ATRIBUTOS - somaPontos} pts` : `Excedeu em ${Math.abs(T.PONTOS_COMPRA_ATRIBUTOS - somaPontos)} pts`}).
        </div>
      ` : ''}

      <div class="grid-4">
        ${T.ATRIBUTOS.map((meta) => {
          const valor = Number(base[meta.sigla]) || 50;
          const mq = R.calcularMetadeQuinto(valor);
          return `
            <div class="attr-card">
              <div class="attr-card-header">
                <div>
                  <span class="attr-sigla">${meta.sigla}</span>
                  <div style="font-size:0.82rem; font-weight:bold;">${escaparHTML(meta.nome)}</div>
                </div>
                <span class="attr-formula-badge" title="Fórmula do Livro Básico">${meta.formula}</span>
              </div>

              <div class="attr-main-row">
                <input type="number" min="15" max="99" step="1"
                  class="attr-value-input"
                  aria-label="${escaparHTML(meta.nome)} Base"
                  data-bind-atr-base="${meta.sigla}"
                  value="${valor}" />

                <div class="coc-fraction-boxes" title="Metade (Difícil) e Quinto (Extremo)">
                  <div class="coc-fraction-box">
                    <span class="coc-fraction-label">½</span>
                    <span class="coc-fraction-val">${mq.metade}</span>
                  </div>
                  <div class="coc-fraction-box">
                    <span class="coc-fraction-label">⅕</span>
                    <span class="coc-fraction-val">${mq.quinto}</span>
                  </div>
                </div>

                <button type="button" class="btn btn-sm" data-action="rolar-atributo-individual" data-atr="${meta.sigla}" title="Rolar ${meta.formula} para ${meta.sigla}">
                  🎲 Rolar
                </button>
              </div>

              <div class="form-hint">${escaparHTML(meta.descricao)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* --- PASSO 3: MODIFICADORES DE IDADE & SORTE --- */
  function renderizarEtapa3IdadeESorte(inv) {
    const R = window.CoC7e.Regras;
    const idade = Number(inv.identidade?.idade) || 28;
    const regra = R.obterRegraIdade(idade);
    const aj = inv.idadeAjustes || {};
    const base = inv.atributosBase || {};
    const fin = inv.atributosFinais || {};

    const somaRedFisica = regra.atributosPenalidadeFisica.reduce((acc, s) => acc + (Number(aj['reducao' + s]) || 0), 0);
    const faltaRedFisica = regra.penalidadeFisicaTotal - somaRedFisica;

    return `
      <div class="alert">
        <strong>Idade Atual: ${idade} anos — ${escaparHTML(regra.rotulo)} (pág. 32)</strong><br/>
        ${escaparHTML(regra.descricao)}
      </div>

      <div class="grid-2" style="margin-bottom: 1.15rem;">
        <!-- Bloco 1: Verificações de Melhoria de EDU -->
        <div class="sheet-section-box">
          <h3 class="sheet-section-title">
            <span>1. Educação (EDU) e Experiência de Vida</span>
            <span>EDU Base: ${base.EDU}% → Final: ${fin.EDU}%</span>
          </h3>

          ${regra.penalidadeEDU > 0 ? `
            <p style="font-size:0.9rem;">
              Jovens de 15 a 19 anos sofrem uma redução automática de <strong>-${regra.penalidadeEDU} pontos em EDU</strong> (EDU: ${base.EDU} → ${fin.EDU}).
            </p>
          ` : `
            <p style="font-size:0.88rem; margin-top:0;">
              Esta faixa etária concede <strong>${regra.melhoriasEDU} verificação(ões) de melhoria de EDU</strong> (role 1d100: se o resultado for <em>maior</em> que a EDU atual, some +1d10, até o máximo de 99).
            </p>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.65rem;">
              <button type="button" class="btn btn-primary btn-sm" data-action="rolar-melhorias-edu">
                🎲 Rolar ${regra.melhoriasEDU} Verificação(ões) de EDU
              </button>
              <button type="button" class="btn btn-sm" data-action="zerar-melhorias-edu">
                ↺ Zerar Bônus de EDU
              </button>
            </div>
            <div class="form-group" style="margin-bottom:0.5rem;">
              <label class="form-label" for="inp-ganho-edu">Bônus Total Ganho nas Verificações de EDU</label>
              <input id="inp-ganho-edu" type="number" min="0" max="60" class="form-input" data-bind-idade-ajuste="ganhoEDU" value="${Number(aj.ganhoEDU) || 0}" />
            </div>
            ${(aj.logMelhoriasEDU || []).length > 0 ? `
              <div style="font-family:var(--font-mono); font-size:0.8rem; background:var(--bg-elevated); padding:0.5rem; border-radius:3px;">
                ${aj.logMelhoriasEDU.map((l) => `<div>• ${escaparHTML(l)}</div>`).join('')}
              </div>
            ` : ''}
          `}
        </div>

        <!-- Bloco 2: Sorte Inicial -->
        <div class="sheet-section-box">
          <h3 class="sheet-section-title">
            <span>2. Rolagem de Sorte (3d6 × 5)</span>
            <span>Sorte Inicial: ${inv.derivados.sorteInicial}%</span>
          </h3>

          <p style="font-size:0.88rem; margin-top:0;">
            ${regra.sorteDupla
              ? '<strong>Bônus de Juventude (15–19 anos):</strong> Role <code>3d6 × 5</code> <strong>duas vezes</strong> e fique automaticamente com o maior resultado!'
              : 'Role <code>3d6 × 5</code> para determinar seus pontos iniciais de Sorte (pág. 31).'}
          </p>

          <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-bottom:0.75rem;">
            <button type="button" class="btn btn-primary btn-sm" data-action="rolar-sorte-inicial">
              🎲 Rolar Sorte (${regra.sorteDupla ? '2× 3d6×5 — Maior' : '3d6×5'})
            </button>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="inp-sorte-1">1ª Rolagem de Sorte</label>
              <input id="inp-sorte-1" type="number" min="15" max="99" class="form-input" data-bind-idade-ajuste="sorteRolagem1" value="${Number(aj.sorteRolagem1) || 50}" />
            </div>
            ${regra.sorteDupla ? `
              <div class="form-group">
                <label class="form-label" for="inp-sorte-2">2ª Rolagem de Sorte (Jovem)</label>
                <input id="inp-sorte-2" type="number" min="15" max="99" class="form-input" data-bind-idade-ajuste="sorteRolagem2" value="${Number(aj.sorteRolagem2 ?? aj.sorteRolagem1) || 50}" />
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Bloco 3: Penalidades Físicas Distribuíveis -->
      <div class="sheet-section-box" style="margin-bottom: 1.15rem;">
        <h3 class="sheet-section-title">
          <span>3. Penalidades Físicas e de Aparência pela Idade</span>
          <span>Exigido: -${regra.penalidadeFisicaTotal} pts físicos | APA: -${regra.penalidadeAPA}</span>
        </h3>

        ${regra.penalidadeFisicaTotal === 0 ? `
          <p style="margin:0; font-size:0.9rem;">Investigadores entre 20 e 39 anos não sofrem penalidades físicas nem redução de Aparência.</p>
        ` : `
          <div class="alert ${faltaRedFisica === 0 ? 'alert-success' : 'alert-warning'}" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div>
              Distribua <strong>${regra.penalidadeFisicaTotal} pontos</strong> de redução entre <strong>${regra.atributosPenalidadeFisica.join(', ')}</strong>.
              Distribuído: <strong>${somaRedFisica} / ${regra.penalidadeFisicaTotal}</strong>
              ${faltaRedFisica === 0 ? ' ✓ Correto!' : faltaRedFisica > 0 ? ` (Faltam ${faltaRedFisica} pts)` : ` (Excedeu em ${Math.abs(faltaRedFisica)} pts)`}
            </div>
            <button type="button" class="btn btn-sm" data-action="distribuir-penalidade-idade">⚡ Distribuir Automaticamente</button>
          </div>

          <div class="grid-3">
            ${regra.atributosPenalidadeFisica.map((sigla) => `
              <div class="form-group">
                <label class="form-label" for="inp-red-${sigla}">Redução em ${sigla} (Base: ${base[sigla]} → Final: ${fin[sigla]})</label>
                <input id="inp-red-${sigla}" type="number" min="0" max="${regra.penalidadeFisicaTotal}"
                  class="form-input" data-bind-idade-ajuste="reducao${sigla}"
                  value="${Number(aj['reducao' + sigla]) || 0}" />
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Tabela Resumo Pós-Idade -->
      <div class="sheet-section-box">
        <h3 class="sheet-section-title">
          <span>Resumo dos Atributos Finais (Após Modificadores de Idade)</span>
          <span>Regular (½ / ⅕)</span>
        </h3>
        <div class="grid-4">
          ${window.CoC7e.TABELAS.ATRIBUTOS.map((m) => {
            const vBase = base[m.sigla];
            const vFin = fin[m.sigla];
            const diff = vFin - vBase;
            const mq = R.calcularMetadeQuinto(vFin);
            return `
              <div style="background:var(--bg-paper); border:1px solid var(--border-color); padding:0.5rem 0.65rem; border-radius:3px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${m.sigla}</strong>
                  <span style="font-size:0.78rem; color:var(--text-muted);">(${vBase}${diff !== 0 ? (diff > 0 ? `+${diff}` : diff) : ''})</span>
                </div>
                <div style="font-family:var(--font-mono); font-weight:bold;">
                  ${mq.regular}% <span style="font-weight:normal; font-size:0.78rem; color:var(--text-muted);">(${mq.metade}/${mq.quinto})</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* --- PASSO 4: ATRIBUTOS DERIVADOS --- */
  function renderizarEtapa4Derivados(inv) {
    const R = window.CoC7e.Regras;
    const atr = inv.atributosFinais;
    const d = inv.derivados;
    const idade = Number(inv.identidade?.idade) || 28;
    const movInfo = R.calcularMOV(atr.FOR, atr.DES, atr.TAM, idade);
    const esqMQ = R.calcularMetadeQuinto(d.esquivaBase);

    return `
      <p style="margin-top:0; font-size:0.92rem; color:var(--text-muted);">
        Todos os atributos derivados abaixo são calculados automaticamente a partir dos seus Atributos Finais conforme as regras das páginas 31 a 35 do Livro Básico.
      </p>

      <div class="grid-3">
        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Pontos de Vida (PV)</span>
            <span class="attr-formula-badge">⌊(CON + TAM) / 10⌋</span>
          </div>
          <div style="font-size:2rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-crimson);">
            ${d.pvMax} PV
          </div>
          <div class="form-hint">
            Cálculo: <code>⌊(${atr.CON} + ${atr.TAM}) / 10⌋ = ⌊${atr.CON + atr.TAM} / 10⌋ = ${d.pvMax}</code>.<br/>
            Limiar de Lesão Grave (≥ ½ PV Máx em 1 golpe): <strong>${Math.ceil(d.pvMax / 2)} de dano</strong>.
          </div>
        </div>

        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Sanidade (SAN)</span>
            <span class="attr-formula-badge">Igual ao POD</span>
          </div>
          <div style="font-size:2rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-eldritch);">
            ${d.sanInicial} / ${d.sanMax}
          </div>
          <div class="form-hint">
            Sanidade Inicial igual ao POD (<code>${atr.POD}</code>). Sanidade Máxima igual a <code>99 - Mythos de Cthulhu = ${d.sanMax}</code>.
            Limiar de Insanidade Indefinida diária (⅕): <strong>${Math.floor(d.sanInicial / 5)} pts</strong>.
          </div>
        </div>

        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Pontos de Magia (PM)</span>
            <span class="attr-formula-badge">⌊POD / 5⌋</span>
          </div>
          <div style="font-size:2rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-primary);">
            ${d.pmMax} PM
          </div>
          <div class="form-hint">
            Cálculo: <code>⌊${atr.POD} / 5⌋ = ${d.pmMax}</code>. Usados para conjurar feitiços e ativar artefatos dos Mythos.
          </div>
        </div>

        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Esquiva Base</span>
            <span class="attr-formula-badge">⌊DES / 2⌋</span>
          </div>
          <div style="font-size:1.8rem; font-family:var(--font-mono); font-weight:bold;">
            ${esqMQ.regular}% <span style="font-size:1rem; color:var(--text-muted);">(${esqMQ.metade} / ${esqMQ.quinto})</span>
          </div>
          <div class="form-hint">
            Cálculo: metade de DES (<code>⌊${atr.DES} / 2⌋ = ${d.esquivaBase}%</code>). Pode receber pontos adicionais na Etapa 6.
          </div>
        </div>

        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Dano Extra &amp; Corpo</span>
            <span class="attr-formula-badge">FOR + TAM = ${atr.FOR + atr.TAM}</span>
          </div>
          <div style="font-size:1.6rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-gold);">
            DX: ${d.danoExtra} | Corpo: ${d.corpo}
          </div>
          <div class="form-hint">
            Consultado na Tabela 1 (pág. 33) para <code>FOR (${atr.FOR}) + TAM (${atr.TAM}) = ${atr.FOR + atr.TAM}</code>. Aplicado em ataques corpo a corpo e manobras.
          </div>
        </div>

        <div class="attr-card">
          <div class="attr-card-header">
            <span class="attr-sigla">Movimento (MOV)</span>
            <span class="attr-formula-badge">Base ${movInfo.movBase} - Idade ${movInfo.penalidadeIdade}</span>
          </div>
          <div style="font-size:2rem; font-family:var(--font-mono); font-weight:bold;">
            ${d.mov}
          </div>
          <div class="form-hint">
            FOR (${atr.FOR}) e DES (${atr.DES}) comparados a TAM (${atr.TAM}) → MOV base <strong>${movInfo.movBase}</strong>, menos <strong>${movInfo.penalidadeIdade}</strong> pela idade (${idade} anos) = <strong>${d.mov}</strong>.
          </div>
        </div>
      </div>
    `;
  }

  /* --- PASSO 5: OCUPAÇÃO --- */
  function renderizarEtapa5Ocupacao(inv) {
    const ocup = obterOcupacaoAtual(inv);
    const totais = calcularTotaisPericias(inv);
    const opcoesFormula = ocup.formula?.opcoes || [];

    return `
      <div class="grid-2" style="margin-bottom: 1rem;">
        <div class="form-group">
          <label class="form-label" for="sel-ocupacao">Ocupação do Investigador (págs. 40–41)</label>
          <select id="sel-ocupacao" class="form-select" data-action="selecionar-ocupacao">
            ${window.CoC7e.OCUPACOES.map((o) => `
              <option value="${o.id}" ${o.id === inv.ocupacaoId ? 'selected' : ''}>
                ${escaparHTML(o.nome)} ${o.lovecraftiana ? '★ [Lovecraftiana]' : ''} (${o.formulaTexto} | Créd. ${o.creditoMin}–${o.creditoMax}%)
              </option>
            `).join('')}
          </select>
          <span class="form-hint">★ Ocupações marcadas com estrela são destacadas na pág. 39 como clássicas dos contos de H.P. Lovecraft.</span>
        </div>

        ${opcoesFormula.length > 0 ? `
          <div class="form-group">
            <label class="form-label" for="sel-atr-ocup">Atributo Secundário da Fórmula (${escaparHTML(ocup.formulaTexto)})</label>
            <select id="sel-atr-ocup" class="form-select" data-action="selecionar-atributo-ocupacao">
              ${opcoesFormula.map((op) => {
                const valAtr = inv.atributosFinais[op.atr] || 0;
                return `
                  <option value="${op.atr}" ${totais.atributoOpcaoUsado === op.atr ? 'selected' : ''}>
                    ${op.atr} (${valAtr}) × ${op.mult} = ${valAtr * op.mult} pontos
                  </option>
                `;
              }).join('')}
            </select>
            <span class="form-hint">Você pode escolher o atributo secundário que lhe der mais pontos ocupacionais.</span>
          </div>
        ` : `
          <div class="form-group">
            <span class="form-label">Fórmula de Pontos de Perícias Ocupacionais</span>
            <div class="form-input" style="background:var(--bg-elevated); font-family:var(--font-mono); font-weight:bold;">
              ${escaparHTML(ocup.formulaTexto)} → ${escaparHTML(totais.detalhamentoOcupacao)}
            </div>
          </div>
        `}
      </div>

      ${ocup.notaDivergenciaLivro ? `
        <div class="alert alert-warning">
          <strong>📋 Nota da Edição Brasileira:</strong> ${escaparHTML(ocup.notaDivergenciaLivro)}
        </div>
      ` : ''}

      ${ocup.personalizada ? `
        <div class="sheet-section-box" style="margin-bottom: 1rem;">
          <h3 class="sheet-section-title">Configurar Ocupação Personalizada (pág. 40)</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Nome da Ocupação</label>
              <input type="text" class="form-input" data-bind-ocup-custom="nome" value="${escaparHTML(inv.ocupacaoCustom?.nome || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Nível de Crédito Mínimo (%)</label>
              <input type="number" min="0" max="99" class="form-input" data-bind-ocup-custom="creditoMin" value="${Number(inv.ocupacaoCustom?.creditoMin) || 9}" />
            </div>
            <div class="form-group">
              <label class="form-label">Nível de Crédito Máximo (%)</label>
              <input type="number" min="0" max="99" class="form-input" data-bind-ocup-custom="creditoMax" value="${Number(inv.ocupacaoCustom?.creditoMax) || 50}" />
            </div>
          </div>
        </div>
      ` : ''}

      <div class="grid-3" style="margin-bottom: 1rem;">
        <div class="attr-card">
          <span class="attr-sigla">Pontos Ocupacionais</span>
          <div style="font-size:1.75rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-primary);">
            ${totais.totalOcupacao} pts
          </div>
          <div class="form-hint">${escaparHTML(totais.detalhamentoOcupacao)}</div>
        </div>

        <div class="attr-card">
          <span class="attr-sigla">Interesses Pessoais</span>
          <div style="font-size:1.75rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-gold);">
            ${totais.totalInteresse} pts
          </div>
          <div class="form-hint">INT (${inv.atributosFinais.INT}) × 2 = ${totais.totalInteresse} pontos para qualquer perícia.</div>
        </div>

        <div class="attr-card">
          <span class="attr-sigla">Nível de Crédito Exigido</span>
          <div style="font-size:1.75rem; font-family:var(--font-mono); font-weight:bold;">
            ${ocup.creditoMin}% a ${ocup.creditoMax}%
          </div>
          <div class="form-hint">Você deve alocar pontos ocupacionais em Nível de Crédito dentro desta faixa.</div>
        </div>
      </div>

      <div class="sheet-section-box">
        <h3 class="sheet-section-title">
          <span>Perícias Ocupacionais de ${escaparHTML(ocup.nome)}</span>
          <span>Selecionadas extras: ${(inv.ocupacaoPericiasEscolhidas || []).length}</span>
        </h3>
        <p style="font-size:0.9rem; margin-top:0;">
          <strong>Lista do Livro Básico (págs. 40–41):</strong> ${escaparHTML(ocup.descricaoLivro)}
        </p>

        <div style="margin-bottom:0.85rem;">
          <strong>Perícias Ocupacionais Fixas:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.35rem;">
            ${(ocup.periciasFixas || []).length === 0 ? '<span class="form-hint">Nenhuma fixa (selecione abaixo).</span>' : (ocup.periciasFixas || []).map((pid) => {
              const pObj = (inv.pericias || []).find((x) => x.id === pid) || window.CoC7e.PERICIAS_BASE.find((x) => x.id === pid);
              return `<span class="badge-occ" style="font-size:0.8rem; padding:0.2rem 0.55rem;">✓ ${escaparHTML(pObj ? pObj.nome : pid)}</span>`;
            }).join('')}
            <span class="badge-occ" style="font-size:0.8rem; padding:0.2rem 0.55rem; background:var(--accent-gold);">✓ Nível de Crédito (${ocup.creditoMin}–${ocup.creditoMax}%)</span>
          </div>
        </div>

        <div>
          <strong>Marque suas Escolhas Ocupacionais Extras (${(ocup.escolhas || []).map((e) => e.rotulo).join(' • ')}):</strong>
          <p class="form-hint" style="margin-top:0.2rem;">
            As perícias marcadas abaixo receberão o selo <strong>OCUPACIONAL</strong> na Etapa 6 para que você possa gastar seus Pontos de Ocupação nelas.
          </p>
          <div class="grid-4" style="max-height:260px; overflow-y:auto; padding:0.5rem; border:1px solid var(--border-color); background:var(--bg-paper);">
            ${(inv.pericias || [])
              .filter((p) => !p.bloqueadaNaCriacao && p.id !== 'nivel_de_credito' && !(ocup.periciasFixas || []).includes(p.id))
              .map((p) => {
                const marcada = (inv.ocupacaoPericiasEscolhidas || []).includes(p.id);
                return `
                  <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.83rem; cursor:pointer;">
                    <input type="checkbox" data-action="toggle-escolha-ocupacional" data-pericia-id="${p.id}" ${marcada ? 'checked' : ''} />
                    <span>${escaparHTML(p.nome)} ${p.interpessoal ? '<em>(Interp.)</em>' : ''}</span>
                  </label>
                `;
              }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* --- PASSO 6: DISTRIBUIÇÃO DE PERÍCIAS --- */
  function renderizarEtapa6Pericias(inv) {
    const R = window.CoC7e.Regras;
    const totais = calcularTotaisPericias(inv);
    const tetoCriacao = inv.limitePericia75 ? 75 : 99;

    const termo = (state.filtroPericiaTexto || '').trim().toLowerCase();
    const listaFiltrada = (inv.pericias || []).filter((p) => {
      if (termo && !p.nome.toLowerCase().includes(termo) && !p.categoria.toLowerCase().includes(termo)) {
        return false;
      }
      if (state.filtroPericiaTipo === 'ocupacionais') {
        return ehPericiaOcupacional(inv, p);
      }
      if (state.filtroPericiaTipo === 'investidas') {
        return (Number(p.ocupacao) || 0) > 0 || (Number(p.interesse) || 0) > 0;
      }
      return true;
    });

    return `
      <!-- Barra Flutuante de Contadores -->
      <div class="skills-counters-bar">
        <div class="counter-pill ${totais.restantesOcupacao < 0 ? 'over-budget' : ''}">
          <span>Pontos de Ocupação:</span>
          <strong>${totais.gastosOcupacao} / ${totais.totalOcupacao}</strong>
          <span style="font-size:0.8rem;">(Restam: ${totais.restantesOcupacao})</span>
        </div>

        <div class="counter-pill ${totais.restantesInteresse < 0 ? 'over-budget' : ''}">
          <span>Interesses Pessoais (INT×2):</span>
          <strong>${totais.gastosInteresse} / ${totais.totalInteresse}</strong>
          <span style="font-size:0.8rem;">(Restam: ${totais.restantesInteresse})</span>
        </div>

        <div class="counter-pill ${!totais.creditoValido ? 'over-budget' : ''}">
          <span>Nível de Crédito:</span>
          <strong>${totais.nivelCredito}%</strong>
          <span style="font-size:0.8rem;">(Faixa: ${totais.creditoMin}–${totais.creditoMax}%)</span>
        </div>
      </div>

      <!-- Opções e Filtros da Tabela de Perícias -->
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:0.85rem; background:var(--bg-elevated); padding:0.65rem 0.85rem; border-radius:4px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
          <input type="search" class="form-input" style="padding:0.35rem 0.6rem; font-size:0.88rem;"
            placeholder="🔍 Buscar perícia..."
            data-action="filtrar-pericia-texto"
            value="${escaparHTML(state.filtroPericiaTexto)}" />

          <select class="form-select" style="padding:0.35rem 0.5rem; font-size:0.88rem;" data-action="filtrar-pericia-tipo">
            <option value="todas" ${state.filtroPericiaTipo === 'todas' ? 'selected' : ''}>Todas as Perícias (${inv.pericias.length})</option>
            <option value="ocupacionais" ${state.filtroPericiaTipo === 'ocupacionais' ? 'selected' : ''}>Apenas Ocupacionais</option>
            <option value="investidas" ${state.filtroPericiaTipo === 'investidas' ? 'selected' : ''}>Com Pontos Alocados</option>
          </select>

          <button type="button" class="btn btn-sm btn-primary" data-action="abrir-modal" data-modal="especializacao">
            + Adicionar Especialização / Perícia Incomum
          </button>
        </div>

        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.85rem; font-size:0.82rem;">
          <label style="display:inline-flex; align-items:center; gap:0.3rem; cursor:pointer;" title="Regra Opcional da pág. 48: limita perícias iniciais a 75%">
            <input type="checkbox" data-action="toggle-limite-75" ${inv.limitePericia75 ? 'checked' : ''} />
            <span>Teto Opcional 75% (pág. 48)</span>
          </label>

          <label style="display:inline-flex; align-items:center; gap:0.3rem; cursor:pointer;" title="Divergência do Livro: Natação é 20% no Cap. 4 (págs. 56 e 71), mas 10% na ficha impressa (pág. 50)">
            <input type="checkbox" data-action="toggle-natacao-10" ${inv.usarNatacao10 ? 'checked' : ''} />
            <span>Natação Base 10% (Ficha pág. 50)</span>
          </label>

          <label style="display:inline-flex; align-items:center; gap:0.3rem; cursor:pointer;">
            <input type="checkbox" data-action="toggle-edicao-livre-ocup" ${state.edicaoLivreOcupacional ? 'checked' : ''} />
            <span>Liberar Ocupação em Todas</span>
          </label>
        </div>
      </div>

      <div class="skills-table-wrapper">
        <table class="skills-table">
          <thead>
            <tr>
              <th>Perícia</th>
              <th>Base</th>
              <th>Pts Ocupação</th>
              <th>Pts Interesse</th>
              <th>Total (Regular)</th>
              <th>Difícil (½)</th>
              <th>Extremo (⅕)</th>
            </tr>
          </thead>
          <tbody>
            ${listaFiltrada.map((p) => {
              const ehOcup = ehPericiaOcupacional(inv, p);
              const baseVal = Number(p.base) || 0;
              const ocupVal = Number(p.ocupacao) || 0;
              const intVal = Number(p.interesse) || 0;
              const outVal = Number(p.outros) || 0;
              const total = baseVal + ocupVal + intVal + outVal;
              const mq = R.calcularMetadeQuinto(total);
              const bloqueadaOcup = p.bloqueadaNaCriacao || (!ehOcup && !state.edicaoLivreOcupacional);
              const bloqueadaInt = p.bloqueadaNaCriacao;
              const excedeuTeto = total > tetoCriacao && (ocupVal > 0 || intVal > 0);

              return `
                <tr class="${ehOcup ? 'is-occupational' : ''}">
                  <td>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.3rem;">
                      <strong>${escaparHTML(p.nome)}</strong>
                      ${ehOcup ? '<span class="badge-occ">OCUPACIONAL</span>' : ''}
                      ${p.bloqueadaNaCriacao ? '<span class="attr-formula-badge" title="Página 70: Nenhum ponto pode ser investido em Mythos de Cthulhu durante a criação.">Bloqueada na Criação (pág. 70)</span>' : ''}
                      ${p.customAdded ? `<button type="button" class="btn btn-sm" style="padding:0.05rem 0.35rem; font-size:0.7rem;" data-action="remover-pericia-custom" data-pericia-id="${p.id}" title="Remover especialização">✕</button>` : ''}
                    </div>
                    ${(p.especializavel || p.permiteRotuloCustom) ? `
                      <div style="margin-top:0.25rem;">
                        <input type="text" class="form-input" style="padding:0.15rem 0.4rem; font-size:0.78rem; width:190px;"
                          placeholder="Especialidade / Idioma..."
                          data-action="editar-especializacao-pericia"
                          data-pericia-id="${p.id}"
                          value="${escaparHTML(p.especializacao || '')}" />
                      </div>
                    ` : ''}
                  </td>
                  <td style="font-family:var(--font-mono);">${baseVal}%</td>
                  <td>
                    <input type="number" min="0" max="99"
                      class="skill-num-input"
                      data-action="alocar-ponto-pericia"
                      data-pericia-id="${p.id}"
                      data-campo="ocupacao"
                      value="${ocupVal}"
                      ${bloqueadaOcup ? 'disabled title="Esta perícia não faz parte da sua ocupação (marque na Etapa 5 ou ative Liberar Ocupação em Todas)"' : ''} />
                  </td>
                  <td>
                    <input type="number" min="0" max="99"
                      class="skill-num-input"
                      data-action="alocar-ponto-pericia"
                      data-pericia-id="${p.id}"
                      data-campo="interesse"
                      value="${intVal}"
                      ${bloqueadaInt ? 'disabled title="Mythos de Cthulhu não recebe pontos iniciais (pág. 70)"' : ''} />
                  </td>
                  <td style="font-family:var(--font-mono); font-weight:bold; ${excedeuTeto ? 'color:var(--accent-crimson);' : ''}">
                    ${mq.regular}% ${excedeuTeto ? `<span title="Acima do limite de ${tetoCriacao}%">⚠️</span>` : ''}
                  </td>
                  <td style="font-family:var(--font-mono);">${mq.metade}%</td>
                  <td style="font-family:var(--font-mono);">${mq.quinto}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* --- PASSO 7: ANTECEDENTES & CONEXÃO-CHAVE --- */
  function renderizarEtapa7Antecedentes(inv) {
    const ant = inv.antecedentes || {};
    const opcoesConexao = [
      'Ideologia / Crenças',
      'Pessoas Significativas',
      'Locais Importantes',
      'Pertences Queridos'
    ];

    const campos = [
      { chave: 'descricaoPessoal', titulo: 'Descrição Pessoal', sorteavel: true, dica: 'Aparência física, porte e primeira impressão.' },
      { chave: 'ideologiaCrencas', titulo: 'Ideologia / Crenças', sorteavel: true, dica: 'Religião, filosofia, política, ciência ou ocultismo (1d10 na pág. 42).' },
      { chave: 'pessoasSignificativas', titulo: 'Pessoas Significativas', sorteavel: true, dica: 'Quem é a pessoa mais importante (1d10) e por que (1d10) (págs. 42–43).' },
      { chave: 'locaisImportantes', titulo: 'Locais Importantes', sorteavel: true, dica: 'Um lugar especial de aprendizado, paz ou memória (1d10 na pág. 43).' },
      { chave: 'pertencesQueridos', titulo: 'Pertences Queridos', sorteavel: true, dica: 'Item de maior valor sentimental ou profissional (1d10 na pág. 44).' },
      { chave: 'caracteristicas', titulo: 'Características', sorteavel: true, dica: 'Traço marcante de personalidade (1d10 na pág. 44).' },
      { chave: 'ferimentosCicatrizes', titulo: 'Ferimentos & Cicatrizes', sorteavel: false, dica: 'Sequelas físicas adquiridas antes ou durante as investigações.' },
      { chave: 'fobiasManias', titulo: 'Fobias & Manias', sorteavel: false, dica: 'Medos irracionais ou compulsões adquiridas por trauma mental.' },
      { chave: 'tomosFeiticos', titulo: 'Tomos Arcanos, Feitiços & Artefatos', sorteavel: false, dica: 'Livros dos Mythos, magias aprendidas e relíquias.' },
      { chave: 'encontrosEntidades', titulo: 'Encontros com Entidades Estranhas', sorteavel: false, dica: 'Registros de criaturas e horrores cósmicos testemunhados.' }
    ];

    return `
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem; background:var(--bg-elevated); padding:0.75rem; border-radius:4px;">
        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <label for="sel-conexao-chave" style="font-weight:bold;">★ Conexão-Chave nos Antecedentes (pág. 45):</label>
          <select id="sel-conexao-chave" class="form-select" data-bind-antecedente="conexaoChave">
            ${opcoesConexao.map((op) => `<option value="${op}" ${ant.conexaoChave === op ? 'selected' : ''}>★ ${op}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-action="sortear-todos-antecedentes">
          🎲 Sortear Todos nas Tabelas do Livro (1d10)
        </button>
      </div>

      <div class="grid-2">
        ${campos.map((c) => {
          const ehChave = ant.conexaoChave === c.titulo;
          return `
            <div class="form-group" style="background:var(--bg-card); border:1px solid ${ehChave ? 'var(--accent-gold)' : 'var(--border-color)'}; padding:0.75rem; border-radius:4px;">
              <label class="form-label" for="ant-${c.chave}">
                <span>${escaparHTML(c.titulo)} ${ehChave ? '<span class="badge-occ" style="background:var(--accent-gold);">★ CONEXÃO-CHAVE</span>' : ''}</span>
                ${c.sorteavel ? `<button type="button" class="btn btn-sm" data-action="sortear-antecedente" data-campo="${c.chave}">🎲 Sortear 1d10</button>` : ''}
              </label>
              <textarea id="ant-${c.chave}" class="form-textarea" data-bind-antecedente="${c.chave}" placeholder="${escaparHTML(c.dica)}">${escaparHTML(ant[c.chave] || '')}</textarea>
              <span class="form-hint">${escaparHTML(c.dica)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* --- PASSO 8: FINANÇAS (1920s), ARMAS E EQUIPAMENTOS --- */
  function renderizarEtapa8ArmasEBens(inv) {
    const R = window.CoC7e.Regras;
    const totais = calcularTotaisPericias(inv);
    const fin = R.calcularFinancas1920(totais.nivelCredito);

    return `
      <!-- Finanças 1920 -->
      <div class="sheet-section-box" style="margin-bottom:1.15rem;">
        <h3 class="sheet-section-title">
          <span>1. Dinheiro &amp; Recursos — Década de 1920 (Tabela II, págs. 46–47)</span>
          <span>Nível de Crédito: ${fin.nivelCredito}% (${escaparHTML(fin.padraoVida)})</span>
        </h3>
        <div class="grid-3" style="margin-bottom:0.75rem;">
          <div class="attr-card">
            <span class="attr-sigla">Nível de Gastos Diário</span>
            <div style="font-size:1.35rem; font-family:var(--font-mono); font-weight:bold;">${escaparHTML(fin.nivelGastosTexto)}</div>
            <span class="form-hint">Despesas cotidianas cobertas sem precisar anotar trocados.</span>
          </div>
          <div class="attr-card">
            <span class="attr-sigla">Dinheiro em Mãos</span>
            <div style="font-size:1.35rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-primary);">${escaparHTML(fin.dinheiroTexto)}</div>
            <span class="form-hint">Dinheiro vivo prontamente disponível no bolso ou cofre pessoal.</span>
          </div>
          <div class="attr-card">
            <span class="attr-sigla">Patrimônio Total</span>
            <div style="font-size:1.35rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-gold);">${escaparHTML(fin.patrimonioTexto)}</div>
            <span class="form-hint">Imóveis, investimentos, veículos e bens de capital.</span>
          </div>
        </div>
        <div class="alert" style="margin-bottom:0;">
          <strong>Acomodações:</strong> ${escaparHTML(fin.acomodacoes)}<br/>
          <strong>Viagens:</strong> ${escaparHTML(fin.viagem)}
        </div>
      </div>

      <!-- Armas (Tabela XVII) -->
      <div class="sheet-section-box" style="margin-bottom:1.15rem;">
        <h3 class="sheet-section-title">
          <span>2. Armas do Investigador (Tabela XVII, págs. 401–405)</span>
          <span>Dano Extra do Investigador: ${inv.derivados.danoExtra}</span>
        </h3>

        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; margin-bottom:0.85rem;">
          <select id="sel-adicionar-arma" class="form-select" style="flex:1; min-width:240px;">
            ${window.CoC7e.ARMAS_LIVRO.map((a) => `
              <option value="${a.id}">[${escaparHTML(a.categoria)}] ${escaparHTML(a.nome)} — Dano: ${a.danoBase}${a.somaDX === 'completo' ? '+DX' : a.somaDX === 'metade' ? '+½DX' : ''} | Alc: ${a.alcance} | Custo 1920: ${a.custo1920}</option>
            `).join('')}
          </select>
          <button type="button" class="btn btn-primary" data-action="adicionar-arma-catalogo">+ Adicionar Arma à Ficha</button>
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
                <th>Ataques</th>
                <th>Munição</th>
                <th>Defeito</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${(inv.armas || []).map((arma, idx) => {
                const perObj = (inv.pericias || []).find((p) => p.id === arma.periciaId);
                const valPer = perObj
                  ? Number(perObj.base || 0) + Number(perObj.ocupacao || 0) + Number(perObj.interesse || 0) + Number(perObj.outros || 0)
                  : 25;
                const mq = R.calcularMetadeQuinto(valPer);
                const danoFinal = R.formatarDanoArma(arma.danoBase, arma.somaDX, inv.derivados.danoExtra);
                return `
                  <tr>
                    <td><strong>${escaparHTML(arma.nome)}</strong></td>
                    <td>${escaparHTML(arma.periciaNome || (perObj ? perObj.nome : arma.periciaId))}</td>
                    <td style="font-family:var(--font-mono); font-weight:bold;">${mq.regular}% / ${mq.metade}% / ${mq.quinto}%</td>
                    <td style="font-family:var(--font-mono);">${escaparHTML(danoFinal)}</td>
                    <td>${escaparHTML(arma.alcance)}</td>
                    <td>${escaparHTML(arma.ataques)}</td>
                    <td>${escaparHTML(arma.municao)}</td>
                    <td>${escaparHTML(arma.defeito)}</td>
                    <td>
                      ${arma.id === 'desarmado' && idx === 0
                        ? '<span class="form-hint">Padrão</span>'
                        : `<button type="button" class="btn btn-sm btn-danger" data-action="remover-arma" data-index="${idx}">Remover</button>`
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Equipamentos 1920 -->
      <div class="sheet-section-box">
        <h3 class="sheet-section-title">
          <span>3. Equipamentos &amp; Pertences (Anos 1920 — págs. 396–398)</span>
          <span>${(inv.equipamentos || []).length} item(ns)</span>
        </h3>

        <div class="grid-2" style="margin-bottom:0.85rem;">
          <div style="display:flex; gap:0.4rem;">
            <select id="sel-equip-1920" class="form-select" style="flex:1;">
              ${window.CoC7e.TABELAS.EQUIPAMENTOS_1920.map((eq) => `
                <option value="${escaparHTML(eq.nome)}">[${escaparHTML(eq.categoria)}] ${escaparHTML(eq.nome)} (${eq.preco})</option>
              `).join('')}
            </select>
            <button type="button" class="btn" data-action="adicionar-equip-catalogo">+ Catálogo</button>
          </div>

          <div style="display:flex; gap:0.4rem;">
            <input id="inp-equip-custom" type="text" class="form-input" style="flex:1;" placeholder="Digite um item personalizado..." />
            <button type="button" class="btn btn-primary" data-action="adicionar-equip-custom">+ Adicionar Item</button>
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:0.45rem;">
          ${(inv.equipamentos || []).map((item, idx) => `
            <span style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.3rem 0.65rem; background:var(--bg-paper); border:1px solid var(--border-strong); border-radius:4px; font-size:0.88rem;">
              ${escaparHTML(item)}
              <button type="button" style="border:none; background:none; cursor:pointer; color:var(--accent-crimson); font-weight:bold;" data-action="remover-equipamento" data-index="${idx}" title="Remover item">✕</button>
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* --- PASSO 9: REVISÃO FINAL & EXPORTAÇÃO --- */
  function renderizarEtapa9Revisao(inv) {
    const R = window.CoC7e.Regras;
    const totais = calcularTotaisPericias(inv);
    const idade = Number(inv.identidade?.idade) || 28;
    const regraIdade = R.obterRegraIdade(idade);
    const aj = inv.idadeAjustes || {};
    const somaRedFisica = regraIdade.atributosPenalidadeFisica.reduce((acc, s) => acc + (Number(aj['reducao' + s]) || 0), 0);

    const checks = [
      {
        ok: Boolean(inv.identidade?.nome && inv.identidade.nome.trim().length > 0),
        texto: `Identidade do Investigador preenchida (${inv.identidade?.nome || 'Sem nome'}, ${idade} anos, ${inv.ocupacaoNome})`
      },
      {
        ok: somaRedFisica === regraIdade.penalidadeFisicaTotal,
        texto: `Modificadores físicos de idade aplicados corretamente (${somaRedFisica}/${regraIdade.penalidadeFisicaTotal} pontos reduzidos)`
      },
      {
        ok: totais.restantesOcupacao === 0,
        texto: `Pontos de Perícias Ocupacionais distribuídos (${totais.gastosOcupacao}/${totais.totalOcupacao} pontos)`
      },
      {
        ok: totais.restantesInteresse === 0,
        texto: `Pontos de Interesses Pessoais distribuídos (${totais.gastosInteresse}/${totais.totalInteresse} pontos)`
      },
      {
        ok: totais.creditoValido,
        texto: `Nível de Crédito (${totais.nivelCredito}%) dentro da faixa de ${inv.ocupacaoNome} (${totais.creditoMin}%–${totais.creditoMax}%)`
      },
      {
        ok: Boolean(inv.antecedentes?.conexaoChave),
        texto: `Conexão-Chave definida nos Antecedentes (★ ${inv.antecedentes?.conexaoChave || 'Não definida'})`
      }
    ];

    const todosOk = checks.every((c) => c.ok);

    return `
      <div class="alert ${todosOk ? 'alert-success' : 'alert-warning'}">
        <strong>${todosOk ? '✓ Investigador 100% Validado pelas Regras da 7ª Edição!' : '⚠️ Revisão de Regras — Alguns itens têm pontos pendentes ou ajustes opcionais:'}</strong>
        <ul style="margin:0.4rem 0 0; padding-left:1.25rem;">
          ${checks.map((c) => `<li>${c.ok ? '✅' : '⚠️'} ${escaparHTML(c.texto)}</li>`).join('')}
        </ul>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:0.65rem; margin-bottom:1.2rem;">
        <button type="button" class="btn btn-primary" data-action="ir-ficha">
          📜 Abrir Ficha Viva de Jogo (2 Páginas + Rolador 1d100)
        </button>
        <button type="button" class="btn btn-gold" data-action="abrir-modal" data-modal="pdf">
          🖨️ Exportar PDF (Nativo 2 Páginas / Ficha Editável / Impressão)
        </button>
        <button type="button" class="btn" data-action="exportar-json-atual">
          💾 Baixar Arquivo JSON do Investigador
        </button>
      </div>

      <div class="sheet-section-box">
        <h3 class="sheet-section-title">Resumo Executivo do Investigador</h3>
        <p style="margin:0 0 0.5rem;">
          <strong>${escaparHTML(inv.identidade?.nome || 'Investigador Sem Nome')}</strong> —
          ${escaparHTML(inv.ocupacaoNome)}, ${idade} anos (${escaparHTML(inv.identidade?.residencia || 'Anos 1920')})
        </p>
        <p style="margin:0 0 0.5rem; font-family:var(--font-mono); font-size:0.88rem;">
          FOR ${inv.atributosFinais.FOR}% | CON ${inv.atributosFinais.CON}% | TAM ${inv.atributosFinais.TAM}% | DES ${inv.atributosFinais.DES}% |
          APA ${inv.atributosFinais.APA}% | INT ${inv.atributosFinais.INT}% | POD ${inv.atributosFinais.POD}% | EDU ${inv.atributosFinais.EDU}%
        </p>
        <p style="margin:0; font-family:var(--font-mono); font-size:0.88rem;">
          PV: ${inv.derivados.pvAtual}/${inv.derivados.pvMax} | SAN: ${inv.derivados.sanAtual}/${inv.derivados.sanMax} |
          PM: ${inv.derivados.pmAtual}/${inv.derivados.pmMax} | Sorte: ${inv.derivados.sorteAtual}% |
          MOV: ${inv.derivados.mov} | DX: ${inv.derivados.danoExtra} | Corpo: ${inv.derivados.corpo}
        </p>
      </div>
    `;
  }

  /* ==========================================================================
     RENDERIZAÇÃO DA FICHA VIVA (MODO DE JOGO — 2 PÁGINAS + ROLADOR 1D100)
     ========================================================================== */

  function renderizarFichaViva(inv) {
    return `
      <!-- Barra de Ferramentas da Ficha Viva -->
      <div class="sheet-toolbar no-print">
        <div class="sheet-tabs" role="tablist" aria-label="Páginas da Ficha Oficial">
          <button type="button" class="btn ${state.abaFicha === 'ambas' ? 'btn-primary' : ''}" data-action="mudar-aba-ficha" data-aba="ambas">
            📄📄 Ficha Completa (Págs. 1 e 2)
          </button>
          <button type="button" class="btn ${state.abaFicha === 'pagina1' ? 'btn-primary' : ''}" data-action="mudar-aba-ficha" data-aba="pagina1">
            📄 Página 1: Atributos, Perícias &amp; Combate
          </button>
          <button type="button" class="btn ${state.abaFicha === 'pagina2' ? 'btn-primary' : ''}" data-action="mudar-aba-ficha" data-aba="pagina2">
            📄 Página 2: Antecedentes, Bens &amp; Finanças
          </button>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn-gold btn-sm" data-action="abrir-modal" data-modal="desenvolvimento">
            🌟 Fase de Desenvolvimento (pág. 94)
          </button>
          <button type="button" class="btn btn-sm" data-action="ir-wizard">
            ✏️ Editar no Assistente
          </button>
          <button type="button" class="btn btn-sm" data-action="imprimir-direto">
            🖨️ Imprimir 2 Páginas
          </button>
        </div>
      </div>

      <div class="sheet-layout">
        <!-- Coluna Esquerda: Ficha de 2 Páginas -->
        <div>
          ${(state.abaFicha === 'pagina1' || state.abaFicha === 'ambas') ? renderizarFichaPagina1(inv) : ''}
          ${(state.abaFicha === 'pagina2' || state.abaFicha === 'ambas') ? renderizarFichaPagina2(inv) : ''}
        </div>

        <!-- Coluna Direita: Rolador 1d100 e Log da Sessão -->
        ${renderizarPainelRoladorLateral(inv)}
      </div>
    `;
  }

  function renderizarFichaPagina1(inv) {
    const R = window.CoC7e.Regras;
    const id = inv.identidade || {};
    const atr = inv.atributosFinais || {};
    const d = inv.derivados || {};

    const pvPct = Math.min(100, Math.round(((d.pvAtual || 0) / Math.max(1, d.pvMax)) * 100));
    const sanPct = Math.min(100, Math.round(((d.sanAtual || 0) / Math.max(1, d.sanMax)) * 100));
    const pmPct = Math.min(100, Math.round(((d.pmAtual || 0) / Math.max(1, d.pmMax)) * 100));
    const sortePct = Math.min(100, d.sorteAtual || 0);

    const periciasOrdenadas = [...(inv.pericias || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return `
      <article class="deco-frame" aria-label="Página 1 da Ficha de Investigador" style="margin-bottom: 1.5rem;">
        <!-- Topo: Identidade + Características (8 Atributos) -->
        <div class="sheet-top-grid">
          <!-- Bloco Identidade (Estilo Anos 1920) -->
          <div class="sheet-section-box">
            <h2 class="sheet-section-title">
              <span>Investigador — Década de 1920</span>
              <span style="font-family:var(--font-mono); font-size:0.76rem;">PÁG. 1</span>
            </h2>
            <div class="grid-2" style="gap:0.5rem;">
              <div class="form-group">
                <label class="form-label" style="font-size:0.76rem;">Nome</label>
                <input type="text" class="form-input" style="padding:0.28rem 0.45rem; font-weight:bold;" data-bind-identidade="nome" value="${escaparHTML(id.nome)}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.76rem;">Jogador(a)</label>
                <input type="text" class="form-input" style="padding:0.28rem 0.45rem;" data-bind-identidade="jogador" value="${escaparHTML(id.jogador)}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.76rem;">Ocupação</label>
                <input type="text" class="form-input" style="padding:0.28rem 0.45rem;" value="${escaparHTML(inv.ocupacaoNome)}" readonly title="Altere a ocupação no Passo 5 do Assistente" />
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.76rem;">Idade</label>
                  <input type="number" min="15" max="90" class="form-input" style="padding:0.28rem 0.45rem;" data-bind-identidade="idade" value="${Number(id.idade) || 28}" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.76rem;">Sexo</label>
                  <input type="text" class="form-input" style="padding:0.28rem 0.45rem;" data-bind-identidade="sexo" value="${escaparHTML(id.sexo)}" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.76rem;">Residência</label>
                <input type="text" class="form-input" style="padding:0.28rem 0.45rem;" data-bind-identidade="residencia" value="${escaparHTML(id.residencia)}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.76rem;">Local de Nascimento</label>
                <input type="text" class="form-input" style="padding:0.28rem 0.45rem;" data-bind-identidade="localNascimento" value="${escaparHTML(id.localNascimento)}" />
              </div>
            </div>
          </div>

          <!-- Bloco Características (8 Atributos com Metade e Quinto clicáveis) -->
          <div class="sheet-section-box">
            <h2 class="sheet-section-title">
              <span>Características (Clique para Rolar 1d100)</span>
              <span style="font-size:0.75rem; font-weight:normal;">Reg / ½ / ⅕</span>
            </h2>
            <div class="live-attrs-grid">
              ${window.CoC7e.TABELAS.ATRIBUTOS.map((m) => {
                const val = atr[m.sigla] ?? 50;
                const mq = R.calcularMetadeQuinto(val);
                const rotuloExtra = m.sigla === 'INT' ? ' (Ideia)' : m.sigla === 'EDU' ? ' (Saber)' : '';
                return `
                  <div class="live-attr-box">
                    <div>
                      <button type="button" class="roll-trigger-btn"
                        data-action="rolar-teste-1d100"
                        data-nome="${escaparHTML(m.nome + rotuloExtra)} (${m.sigla})"
                        data-alvo="${mq.regular}"
                        data-tipo="atributo"
                        title="Rolar teste de ${escaparHTML(m.nome)}">
                        <strong>🎲 ${m.sigla}</strong>
                      </button>
                      <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:bold;">${mq.regular}%</div>
                    </div>
                    <div class="coc-fraction-boxes">
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">½</span>
                        <span class="coc-fraction-val">${mq.metade}</span>
                      </div>
                      <div class="coc-fraction-box">
                        <span class="coc-fraction-label">⅕</span>
                        <span class="coc-fraction-val">${mq.quinto}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-top:0.6rem; padding-top:0.45rem; border-top:1px solid var(--border-color); font-size:0.84rem; font-family:var(--font-mono);">
              <span><strong>MOV:</strong> ${d.mov}</span>
              <span><strong>Dano Extra (DX):</strong> ${d.danoExtra}</span>
              <span><strong>Corpo:</strong> ${d.corpo}</span>
              <button type="button" class="btn btn-sm" data-action="rolar-teste-1d100" data-nome="Teste de Ideia (INT)" data-alvo="${atr.INT}" data-tipo="atributo">💡 Rolagem de Ideia (${atr.INT}%)</button>
              <button type="button" class="btn btn-sm" data-action="rolar-teste-1d100" data-nome="Teste de Saber (EDU)" data-alvo="${atr.EDU}" data-tipo="atributo">📚 Rolagem de Saber (${atr.EDU}%)</button>
            </div>
          </div>
        </div>

        <!-- Painel de Recursos Vitais: PV, Sanidade, Magia e Sorte -->
        <div class="vitals-grid">
          <!-- PONTOS DE VIDA -->
          <div class="vital-card">
            <div class="vital-header">
              <span>❤️ Pontos de Vida (PV)</span>
              <span style="font-size:0.78rem; color:var(--text-muted);">Máx: ${d.pvMax} (LG ≥ ${Math.ceil(d.pvMax / 2)})</span>
            </div>
            <div class="vital-controls">
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="pvAtual" data-delta="-1">−1</button>
              <span class="vital-big-number" style="color:var(--accent-crimson);">${d.pvAtual} / ${d.pvMax}</span>
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="pvAtual" data-delta="1">+1</button>
            </div>
            <div class="vital-bar">
              <div class="vital-bar-fill" style="width:${pvPct}%; background:var(--accent-crimson);"></div>
            </div>
            <div style="display:flex; gap:0.35rem; margin-bottom:0.5rem;" class="no-print">
              <input id="inp-dano-golpe" type="number" min="1" max="99" class="form-input" style="padding:0.2rem 0.4rem; width:74px; font-size:0.82rem;" placeholder="Dano" />
              <button type="button" class="btn btn-sm btn-danger" style="flex:1;" data-action="aplicar-dano-golpe" title="Aplica dano verificando Lesão Grave (≥ ½ PV Máx), Inconsciente e Morrendo">
                💥 Sofrer Golpe
              </button>
            </div>
            <div class="vital-flags">
              <label class="vital-flag-label ${d.lesaoGrave ? 'flag-active' : ''}">
                <input type="checkbox" data-action="toggle-flag-vital" data-flag="lesaoGrave" ${d.lesaoGrave ? 'checked' : ''} />
                Lesão Grave
              </label>
              <label class="vital-flag-label ${d.inconsciente ? 'flag-active' : ''}">
                <input type="checkbox" data-action="toggle-flag-vital" data-flag="inconsciente" ${d.inconsciente ? 'checked' : ''} />
                Inconsciente
              </label>
              <label class="vital-flag-label ${d.morrendo ? 'flag-active' : ''}">
                <input type="checkbox" data-action="toggle-flag-vital" data-flag="morrendo" ${d.morrendo ? 'checked' : ''} />
                Morrendo
              </label>
            </div>
          </div>

          <!-- SANIDADE -->
          <div class="vital-card">
            <div class="vital-header">
              <button type="button" class="roll-trigger-btn"
                data-action="rolar-teste-1d100"
                data-nome="Teste de Sanidade (SAN)"
                data-alvo="${d.sanAtual}"
                data-tipo="sanidade">
                <span>🎲 🧠 Sanidade (SAN)</span>
              </button>
              <span style="font-size:0.76rem; color:var(--text-muted);">Inic: ${d.sanInicial} | Máx: ${d.sanMax}</span>
            </div>
            <div class="vital-controls">
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="sanAtual" data-delta="-1">−1</button>
              <span class="vital-big-number" style="color:var(--accent-eldritch);">${d.sanAtual} / ${d.sanMax}</span>
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="sanAtual" data-delta="1">+1</button>
            </div>
            <div class="vital-bar">
              <div class="vital-bar-fill" style="width:${sanPct}%; background:var(--accent-eldritch);"></div>
            </div>
            <div style="display:flex; gap:0.35rem; margin-bottom:0.45rem;" class="no-print">
              <input id="inp-perda-san" type="number" min="1" max="99" class="form-input" style="padding:0.2rem 0.4rem; width:68px; font-size:0.82rem;" placeholder="Perda" />
              <button type="button" class="btn btn-sm" style="flex:1;" data-action="aplicar-perda-sanidade" title="Avalia Insanidade Temporária (≥5 pts) e Indefinida (≥1/5 da SAN do dia)">
                😱 Perder SAN
              </button>
              <button type="button" class="btn btn-sm" data-action="sortear-acesso-loucura" title="Tabela VII: Acessos de Loucura em Tempo Real (1d10, pág. 418)">
                🎲 Loucura
              </button>
            </div>
            <div class="vital-flags" style="justify-content:space-between; align-items:center;">
              <label class="vital-flag-label ${d.insanidadeTemporaria ? 'flag-active' : ''}">
                <input type="checkbox" data-action="toggle-flag-vital" data-flag="insanidadeTemporaria" ${d.insanidadeTemporaria ? 'checked' : ''} />
                Insan. Temp.
              </label>
              <label class="vital-flag-label ${d.insanidadeIndefinida ? 'flag-active' : ''}">
                <input type="checkbox" data-action="toggle-flag-vital" data-flag="insanidadeIndefinida" ${d.insanidadeIndefinida ? 'checked' : ''} />
                Insan. Indef.
              </label>
              <button type="button" class="btn btn-sm no-print" style="font-size:0.7rem; padding:0.1rem 0.35rem;" data-action="novo-dia-sanidade" title="Perda hoje: ${d.perdaSanDia || 0}/${Math.floor((d.sanInicioDia || d.sanAtual || 1) / 5)}. Clique para iniciar um novo dia.">
                Dia: -${d.perdaSanDia || 0}/${Math.floor((d.sanInicioDia || d.sanAtual || 1) / 5)} ↺
              </button>
            </div>
          </div>

          <!-- PONTOS DE MAGIA -->
          <div class="vital-card">
            <div class="vital-header">
              <span>✨ Pontos de Magia (PM)</span>
              <span style="font-size:0.78rem; color:var(--text-muted);">Máx: ${d.pmMax} (POD/5)</span>
            </div>
            <div class="vital-controls">
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="pmAtual" data-delta="-1">−1</button>
              <span class="vital-big-number" style="color:var(--accent-primary);">${d.pmAtual} / ${d.pmMax}</span>
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="pmAtual" data-delta="1">+1</button>
            </div>
            <div class="vital-bar">
              <div class="vital-bar-fill" style="width:${pmPct}%; background:var(--accent-primary);"></div>
            </div>
            <div class="form-hint">Regenera 1 PM por hora de descanso normal.</div>
          </div>

          <!-- SORTE -->
          <div class="vital-card">
            <div class="vital-header">
              <button type="button" class="roll-trigger-btn"
                data-action="rolar-teste-1d100"
                data-nome="Teste de Sorte"
                data-alvo="${d.sorteAtual}"
                data-tipo="sorte">
                <span>🎲 🍀 Sorte</span>
              </button>
              <span style="font-size:0.78rem; color:var(--text-muted);">Inic: ${d.sorteInicial}%</span>
            </div>
            <div class="vital-controls">
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="sorteAtual" data-delta="-1">−1</button>
              <span class="vital-big-number" style="color:var(--accent-gold);">${d.sorteAtual}%</span>
              <button type="button" class="btn btn-sm" data-action="ajustar-vital" data-campo="sorteAtual" data-delta="1">+1</button>
            </div>
            <div class="vital-bar">
              <div class="vital-bar-fill" style="width:${sortePct}%; background:var(--accent-gold);"></div>
            </div>
            <div class="form-hint">Gaste Sorte após rolar no painel ao lado para melhorar níveis de sucesso (pág. 99).</div>
          </div>
        </div>

        <!-- Perícias do Investigador (3 Colunas estilo Ficha Oficial pág. 50) -->
        <div class="sheet-section-box" style="margin-bottom: 1rem;">
          <h2 class="sheet-section-title">
            <span>Perícias do Investigador — Clique no Nome para Rolar 1d100</span>
            <span style="font-size:0.76rem; font-weight:normal;">[✓] Marca de Experiência | Regular% (½ / ⅕)</span>
          </h2>

          <div class="live-skills-columns">
            ${periciasOrdenadas.map((p) => {
              const total = Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
              const mq = R.calcularMetadeQuinto(total);
              const temPontos = total > (Number(p.base) || 0);
              return `
                <div class="live-skill-row">
                  <div class="live-skill-left">
                    ${p.marcavel ? `
                      <input type="checkbox" class="skill-check-mark"
                        title="Marcar para a Fase de Desenvolvimento (pág. 94)"
                        data-action="toggle-marca-pericia"
                        data-pericia-id="${p.id}"
                        ${p.marcada ? 'checked' : ''} />
                    ` : `<span style="width:15px; display:inline-block; text-align:center; color:var(--text-faint);" title="Esta perícia não possui caixa de melhoria">—</span>`}

                    <button type="button" class="roll-trigger-btn"
                      style="${temPontos ? 'font-weight:bold;' : ''}"
                      data-action="rolar-teste-1d100"
                      data-nome="${escaparHTML(p.nome)}"
                      data-alvo="${mq.regular}"
                      data-pericia-id="${p.id}"
                      data-tipo="pericia">
                      🎲 ${escaparHTML(p.nome)}
                    </button>
                  </div>

                  <div class="live-skill-right">
                    <input type="number" min="0" max="99"
                      class="live-skill-total-input"
                      aria-label="Total de ${escaparHTML(p.nome)}"
                      data-action="editar-total-pericia-ficha"
                      data-pericia-id="${p.id}"
                      value="${mq.regular}" />
                    <span class="mini-frac">${mq.metade}/${mq.quinto}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Armas e Combate no rodapé da Página 1 -->
        <div class="sheet-section-box">
          <h2 class="sheet-section-title">
            <span>Combate &amp; Armas (Página 1 — Rodapé)</span>
            <span>Dano Extra (DX): ${d.danoExtra} | Corpo: ${d.corpo} | Esquiva: ${R.calcularMetadeQuinto(obterTotalPericia(inv, 'esquivar')).regular}%</span>
          </h2>

          <div class="skills-table-wrapper">
            <table class="skills-table">
              <thead>
                <tr>
                  <th>Arma</th>
                  <th>Regular</th>
                  <th>Difícil (½)</th>
                  <th>Extremo (⅕)</th>
                  <th>Dano</th>
                  <th>Alcance</th>
                  <th>Ataques</th>
                  <th>Munição</th>
                  <th>Defeito</th>
                  <th class="no-print">Rolagens</th>
                </tr>
              </thead>
              <tbody>
                ${(inv.armas || []).map((arma) => {
                  const valPer = obterTotalPericia(inv, arma.periciaId) || 25;
                  const mq = R.calcularMetadeQuinto(valPer);
                  const danoFmt = R.formatarDanoArma(arma.danoBase, arma.somaDX, d.danoExtra);
                  return `
                    <tr>
                      <td><strong>${escaparHTML(arma.nome)}</strong></td>
                      <td style="font-family:var(--font-mono); font-weight:bold;">${mq.regular}%</td>
                      <td style="font-family:var(--font-mono);">${mq.metade}%</td>
                      <td style="font-family:var(--font-mono);">${mq.quinto}%</td>
                      <td style="font-family:var(--font-mono); font-weight:bold;">${escaparHTML(danoFmt)}</td>
                      <td>${escaparHTML(arma.alcance)}</td>
                      <td>${escaparHTML(arma.ataques)}</td>
                      <td>${escaparHTML(arma.municao)}</td>
                      <td>${escaparHTML(arma.defeito)}</td>
                      <td class="no-print" style="white-space:nowrap;">
                        <button type="button" class="btn btn-sm btn-primary"
                          data-action="rolar-teste-1d100"
                          data-nome="Ataque: ${escaparHTML(arma.nome)}"
                          data-alvo="${mq.regular}"
                          data-pericia-id="${arma.periciaId}"
                          data-defeito="${arma.defeito}"
                          data-tipo="combate">
                          🎲 Atacar
                        </button>
                        <button type="button" class="btn btn-sm"
                          data-action="rolar-dano-arma"
                          data-arma="${escaparHTML(arma.nome)}"
                          data-dano="${escaparHTML(danoFmt)}">
                          💥 Dano
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    `;
  }

  function renderizarFichaPagina2(inv) {
    const R = window.CoC7e.Regras;
    const ant = inv.antecedentes || {};
    const nc = obterTotalPericia(inv, 'nivel_de_credito');
    const fin = R.calcularFinancas1920(nc);

    const blocosAnt = [
      { chave: 'descricaoPessoal', titulo: 'Descrição Pessoal' },
      { chave: 'ideologiaCrencas', titulo: 'Ideologia / Crenças' },
      { chave: 'pessoasSignificativas', titulo: 'Pessoas Significativas' },
      { chave: 'locaisImportantes', titulo: 'Locais Importantes' },
      { chave: 'pertencesQueridos', titulo: 'Pertences Queridos' },
      { chave: 'caracteristicas', titulo: 'Características' },
      { chave: 'ferimentosCicatrizes', titulo: 'Ferimentos & Cicatrizes' },
      { chave: 'fobiasManias', titulo: 'Fobias & Manias' },
      { chave: 'tomosFeiticos', titulo: 'Tomos Arcanos, Feitiços & Artefatos' },
      { chave: 'encontrosEntidades', titulo: 'Encontros com Entidades Estranhas' }
    ];

    return `
      <article class="deco-frame print-page-break" aria-label="Página 2 da Ficha de Investigador">
        <div class="sheet-section-box" style="margin-bottom: 1rem;">
          <h2 class="sheet-section-title">
            <span>Antecedentes do Investigador (Página 2)</span>
            <span style="font-size:0.78rem;">★ Conexão-Chave: ${escaparHTML(ant.conexaoChave || 'Nenhuma')}</span>
          </h2>

          <div class="grid-2">
            ${blocosAnt.map((b) => {
              const ehChave = ant.conexaoChave === b.titulo;
              return `
                <div class="form-group">
                  <label class="form-label" style="font-size:0.82rem;">
                    <span>${escaparHTML(b.titulo)} ${ehChave ? '<span class="badge-occ" style="background:var(--accent-gold);">★ CONEXÃO-CHAVE</span>' : ''}</span>
                  </label>
                  <textarea class="form-textarea" style="min-height:62px;" data-bind-antecedente="${b.chave}">${escaparHTML(ant[b.chave] || '')}</textarea>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <!-- Equipamentos & Pertences -->
          <div class="sheet-section-box">
            <h2 class="sheet-section-title">Equipamento &amp; Pertences</h2>
            <div style="display:flex; gap:0.4rem; margin-bottom:0.65rem;" class="no-print">
              <input id="inp-equip-ficha" type="text" class="form-input" style="flex:1; padding:0.3rem 0.5rem;" placeholder="Adicionar equipamento ou pertence..." />
              <button type="button" class="btn btn-sm btn-primary" data-action="adicionar-equip-ficha">+ Adicionar</button>
            </div>
            <ul style="margin:0; padding-left:1.2rem; font-size:0.9rem;">
              ${(inv.equipamentos || []).length === 0 ? '<li style="color:var(--text-muted);">Nenhum equipamento listado.</li>' : (inv.equipamentos || []).map((eq, idx) => `
                <li style="margin-bottom:0.25rem;">
                  ${escaparHTML(eq)}
                  <button type="button" class="no-print" style="border:none; background:none; color:var(--accent-crimson); cursor:pointer; font-size:0.75rem;" data-action="remover-equipamento" data-index="${idx}">[remover]</button>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Dinheiro & Recursos (1920s) -->
          <div class="sheet-section-box">
            <h2 class="sheet-section-title">
              <span>Dinheiro &amp; Recursos (Anos 1920)</span>
              <span>Créd. ${fin.nivelCredito}% (${escaparHTML(fin.padraoVida)})</span>
            </h2>
            <div class="grid-3" style="margin-bottom:0.65rem;">
              <div class="form-group">
                <label class="form-label" style="font-size:0.78rem;">Nível de Gastos</label>
                <input type="text" class="form-input" style="padding:0.3rem 0.45rem;" data-bind-financas="nivelGastos" value="${escaparHTML(inv.financasCustom?.nivelGastos || fin.nivelGastosTexto)}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.78rem;">Dinheiro</label>
                <input type="text" class="form-input" style="padding:0.3rem 0.45rem;" data-bind-financas="dinheiro" value="${escaparHTML(inv.financasCustom?.dinheiro || fin.dinheiroTexto)}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.78rem;">Patrimônio</label>
                <input type="text" class="form-input" style="padding:0.3rem 0.45rem;" data-bind-financas="patrimonio" value="${escaparHTML(inv.financasCustom?.patrimonio || fin.patrimonioTexto)}" />
              </div>
            </div>
            <div style="font-size:0.82rem; color:var(--text-muted);">
              <strong>Acomodações:</strong> ${escaparHTML(fin.acomodacoes)}<br/>
              <strong>Viagens:</strong> ${escaparHTML(fin.viagem)}
            </div>
          </div>
        </div>

        <!-- Referência Rápida (igual ao rodapé da pág. 51 da Ficha Oficial) -->
        <div class="sheet-section-box" style="font-size:0.8rem;">
          <h2 class="sheet-section-title">Referências Rápidas (Ficha Oficial — pág. 51)</h2>
          <div class="grid-2">
            <div>
              <strong>Níveis de Sucesso (1d100):</strong><br/>
              • <strong>Crítico:</strong> <code>01</code> | <strong>Extremo:</strong> <code>≤ ⅕</code> | <strong>Difícil (Sólido):</strong> <code>≤ ½</code> | <strong>Regular:</strong> <code>≤ Perícia</code><br/>
              • <strong>Fracasso:</strong> <code>&gt; Perícia</code> | <strong>Desastre:</strong> <code>96–100</code> (se alvo &lt; 50%) ou <code>100</code> (se alvo ≥ 50%)<br/>
              • <strong>Forçando Testes:</strong> Deve justificar a re-jogada; não é possível forçar testes de Combate, Sanidade ou Sorte.
            </div>
            <div>
              <strong>Ferimentos &amp; Cura (págs. 51 e 120):</strong><br/>
              • <strong>Primeiros Socorros:</strong> cura 1 PV | <strong>Medicina:</strong> cura +1D3 PVs<br/>
              • <strong>Lesão Grave:</strong> perda de ≥ ½ do máximo de PVs em um único ataque.<br/>
              • <strong>0 PV sem Lesão Grave:</strong> Inconsciente | <strong>0 PV com Lesão Grave:</strong> Morrendo.
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /* ==========================================================================
     PAINEL LATERAL: ROLADOR 1D100 (BÔNUS/PENALIDADE, FORÇAR, SORTE)
     ========================================================================== */

  function renderizarPainelRoladorLateral(inv) {
    const roll = state.ultimaRolagem;

    return `
      <aside class="dice-roller-sidebar no-print" aria-label="Rolador de Dados 1d100">
        <div class="sheet-section-box">
          <h2 class="sheet-section-title">
            <span>🎲 Rolador 1d100 (CoC 7e)</span>
            <span>Sorte: ${inv.derivados.sorteAtual}%</span>
          </h2>

          <!-- Seletor de Dados de Bônus / Penalidade -->
          <div class="form-group" style="margin-bottom:0.65rem;">
            <span class="form-label" style="font-size:0.8rem;">Dados de Bônus / Penalidade (pág. 91):</span>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:0.25rem;">
              ${[
                { v: -2, r: '-2 Pen' },
                { v: -1, r: '-1 Pen' },
                { v: 0, r: 'Normal' },
                { v: 1, r: '+1 Bôn' },
                { v: 2, r: '+2 Bôn' }
              ].map((b) => `
                <button type="button"
                  class="btn btn-sm ${state.dadosBonusPenalidade === b.v ? 'btn-primary' : ''}"
                  style="padding:0.25rem 0.15rem; font-size:0.74rem;"
                  data-action="definir-bonus-penalidade"
                  data-valor="${b.v}">
                  ${b.r}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Seletor de Dificuldade Exigida -->
          <div class="form-group" style="margin-bottom:0.75rem;">
            <span class="form-label" style="font-size:0.8rem;">Dificuldade Exigida (afeta Desastre — pág. 89):</span>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.25rem;">
              ${[
                { k: 'regular', r: 'Regular' },
                { k: 'dificil', r: 'Difícil (½)' },
                { k: 'extremo', r: 'Extremo (⅕)' }
              ].map((d) => `
                <button type="button"
                  class="btn btn-sm ${state.dificuldadeTeste === d.k ? 'btn-primary' : ''}"
                  style="padding:0.25rem 0.2rem; font-size:0.74rem;"
                  data-action="definir-dificuldade-teste"
                  data-dificuldade="${d.k}">
                  ${d.r}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Resultado da Última Rolagem -->
          ${roll ? `
            <div class="roll-result-banner nivel-${roll.avaliacao.codigo}">
              <div style="font-size:0.82rem; font-weight:bold; margin-bottom:0.15rem;">
                ${escaparHTML(roll.nome)} ${roll.testeForcado ? '⚠️ [FORÇADO]' : ''}
              </div>
              <div class="roll-d100-number">${roll.resultadoFinal}</div>
              <div style="font-size:1rem; font-weight:bold; text-transform:uppercase; letter-spacing:0.04em;">
                ${escaparHTML(roll.avaliacao.rotulo)}
              </div>
              <div style="font-size:0.76rem; font-family:var(--font-mono); margin-top:0.25rem;">
                Alvo: ${roll.avaliacao.regular}% (½:${roll.avaliacao.metade} | ⅕:${roll.avaliacao.quinto}) | Desastre ≥ ${roll.avaliacao.limiteDesastre}
              </div>
              ${roll.todosResultados && roll.todosResultados.length > 1 ? `
                <div style="font-size:0.74rem; font-family:var(--font-mono); margin-top:0.2rem;">
                  Dados (${roll.modoDados === 'bonus' ? '+' + roll.qtdExtras + ' Bônus' : '-' + roll.qtdExtras + ' Penalidade'}): [${roll.todosResultados.join(', ')}] → <strong>${roll.resultadoFinal}</strong>
                </div>
              ` : ''}
              ${roll.houveDefeitoArma ? `
                <div style="margin-top:0.35rem; padding:0.2rem; background:var(--accent-crimson); color:#fff; font-weight:bold; font-size:0.78rem; border-radius:3px;">
                  🔧 DEFEITO DA ARMA! (Rolagem ≥ ${roll.defeitoArma})
                </div>
              ` : ''}
              ${roll.marcouExperiencia ? `
                <div style="margin-top:0.25rem; font-size:0.74rem;">
                  ✓ Perícia marcada [✓] para a Fase de Desenvolvimento!
                </div>
              ` : ''}
            </div>

            <!-- Botão Forçar o Teste (Push the Roll - pág. 92) -->
            ${roll.podeForcar ? `
              <button type="button" class="btn btn-danger btn-sm" style="width:100%; margin-bottom:0.55rem;"
                data-action="forcar-ultimo-teste"
                title="Página 92: Descreva como você tenta novamente; se falhar, consequências terríveis acontecerão!">
                ⚠️ Forçar o Teste (Re-rolar com Risco Grave)
              </button>
            ` : ''}

            <!-- Opções de Gasto de Sorte (pág. 99) -->
            ${roll.opcoesSorte && roll.opcoesSorte.permitido ? `
              <div style="background:var(--bg-elevated); border:1px solid var(--border-color); padding:0.5rem; border-radius:3px; margin-bottom:0.55rem;">
                <div style="font-size:0.78rem; font-weight:bold; margin-bottom:0.35rem;">
                  🍀 Gastar Sorte para melhorar (Atual: ${inv.derivados.sorteAtual} pts):
                </div>
                <div style="display:flex; flex-direction:column; gap:0.3rem;">
                  ${roll.opcoesSorte.opcoesGasto.map((op) => `
                    <button type="button" class="btn btn-sm ${op.possivel ? 'btn-gold' : ''}"
                      ${!op.possivel ? 'disabled' : ''}
                      data-action="gastar-sorte-rolagem"
                      data-custo="${op.custo}"
                      data-rotulo="${escaparHTML(op.rotulo)}">
                      Alcançar ${escaparHTML(op.rotulo)} (Alvo ${op.alvo}%) — Custo: ${op.custo} Sorte
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : roll.opcoesSorte && roll.opcoesSorte.motivoBloqueio ? `
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.55rem;">
                🍀 ${escaparHTML(roll.opcoesSorte.motivoBloqueio)}
              </div>
            ` : ''}
          ` : `
            <div class="alert" style="text-align:center; font-size:0.85rem;">
              Clique em qualquer <strong>Característica</strong>, <strong>Perícia</strong>, <strong>Sanidade</strong>, <strong>Sorte</strong> ou <strong>Arma</strong> na ficha para rolar <code>1d100</code>.
            </div>
          `}

          <!-- Dados Avulsos Rápidos -->
          <div style="border-top:1px solid var(--border-color); padding-top:0.55rem;">
            <span style="font-size:0.78rem; font-weight:bold; display:block; margin-bottom:0.35rem;">Rolagem Rápida de Dados:</span>
            <div style="display:flex; flex-wrap:wrap; gap:0.25rem;">
              ${['1D3', '1D4', '1D6', '1D8', '1D10', '1D20', '1D100'].map((dExpr) => `
                <button type="button" class="btn btn-sm" style="padding:0.2rem 0.45rem; font-family:var(--font-mono); font-size:0.76rem;"
                  data-action="rolar-dado-avulso" data-expr="${dExpr}">
                  ${dExpr}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Histórico de Rolagens da Sessão -->
        <div class="sheet-section-box">
          <h3 class="sheet-section-title">
            <span>Histórico de Rolagens (${state.logRolagens.length})</span>
            ${state.logRolagens.length > 0 ? `<button type="button" class="btn btn-sm" style="padding:0.05rem 0.35rem; font-size:0.7rem;" data-action="limpar-log-rolagens">Limpar</button>` : ''}
          </h3>
          <div class="roll-log-list">
            ${state.logRolagens.length === 0
              ? '<div style="font-size:0.8rem; color:var(--text-muted);">Nenhuma rolagem nesta sessão.</div>'
              : state.logRolagens.map((item) => `
                <div class="roll-log-item">
                  <div style="display:flex; justify-content:space-between; font-weight:bold;">
                    <span>${escaparHTML(item.nome)}</span>
                    <span style="font-family:var(--font-mono);">${item.horario}</span>
                  </div>
                  <div style="font-family:var(--font-mono); font-size:0.78rem;">
                    Resultado: <strong>${item.resultadoFinal}</strong> ${item.valorAlvo ? `(Alvo ${item.valorAlvo}%)` : ''} — <strong>${escaparHTML(item.avaliacao?.rotulo || item.detalhe || '')}</strong>
                    ${item.sorteGasta > 0 ? ` <em>(-${item.sorteGasta} Sorte)</em>` : ''}
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </aside>
    `;
  }

  function obterTotalPericia(inv, id) {
    const p = (inv.pericias || []).find((x) => x.id === id);
    if (!p) return 0;
    return Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
  }

  /* ==========================================================================
     MODAIS (GERENCIADOR DE INVESTIGADORES, PDF EXPORT, DESENVOLVIMENTO, ESPECIALIZAÇÃO)
     ========================================================================== */

  function renderizarModalAtivo(inv) {
    if (!state.modalAberto) return '';

    if (state.modalAberto === 'investigadores') {
      return `
        <div class="modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Gerenciar Investigadores">
          <div class="modal-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
              <h2 style="margin:0; font-size:1.25rem;">🗂️ Meus Investigadores Salvos (localStorage)</h2>
              <button type="button" class="btn btn-sm" data-action="fechar-modal">✕ Fechar</button>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
              <button type="button" class="btn btn-primary" data-action="novo-em-branco">+ Novo Investigador em Branco</button>
              <button type="button" class="btn" data-action="carregar-harvey">📖 Carregar Harvey Walters (Livro pág. 50)</button>
              <button type="button" class="btn" data-action="exportar-json-atual">💾 Exportar JSON (Atual)</button>
              <label class="btn" style="cursor:pointer;">
                📂 Importar JSON
                <input type="file" accept=".json,application/json" style="display:none;" data-action="importar-json" />
              </label>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${state.investigadores.map((item) => {
                const ehAtivo = item.id === inv.id;
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; padding:0.65rem; background:var(--bg-card); border:2px solid ${ehAtivo ? 'var(--accent-primary)' : 'var(--border-color)'}; border-radius:4px;">
                    <div>
                      <strong>${escaparHTML(item.identidade?.nome || 'Investigador Sem Nome')}</strong>
                      ${ehAtivo ? '<span class="badge-occ">ATIVO</span>' : ''}
                      <div style="font-size:0.8rem; color:var(--text-muted);">
                        ${escaparHTML(item.ocupacaoNome || 'Sem Ocupação')} • Idade: ${item.identidade?.idade || 28} • PV ${item.derivados?.pvAtual}/${item.derivados?.pvMax} • SAN ${item.derivados?.sanAtual}/${item.derivados?.sanMax}
                      </div>
                    </div>
                    <div style="display:flex; gap:0.35rem;">
                      ${!ehAtivo ? `<button type="button" class="btn btn-sm btn-primary" data-action="ativar-investigador" data-id="${item.id}">Selecionar</button>` : ''}
                      <button type="button" class="btn btn-sm" data-action="duplicar-investigador" data-id="${item.id}">Duplicar</button>
                      ${state.investigadores.length > 1 ? `<button type="button" class="btn btn-sm btn-danger" data-action="excluir-investigador" data-id="${item.id}">Excluir</button>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (state.modalAberto === 'pdf') {
      return `
        <div class="modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Exportar Ficha em PDF">
          <div class="modal-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
              <h2 style="margin:0; font-size:1.25rem;">🖨️ Exportar / Imprimir Ficha de 2 Páginas (PDF)</h2>
              <button type="button" class="btn btn-sm" data-action="fechar-modal">✕ Fechar</button>
            </div>

            <div class="sheet-section-box" style="margin-bottom:0.85rem;">
              <h3 class="sheet-section-title">Opção 1: Impressão / Salvar como PDF de 2 Páginas (@media print)</h3>
              <p style="font-size:0.88rem; margin-top:0;">
                Formata automaticamente a Página 1 (Atributos, Perícias em 3 colunas e Combate) e a Página 2 (Antecedentes, Equipamentos e Finanças) em duas páginas A4 prontas para salvar como PDF no navegador.
              </p>
              <button type="button" class="btn btn-primary" data-action="imprimir-direto">
                🖨️ Imprimir / Salvar como PDF Agora
              </button>
            </div>

            <div class="sheet-section-box" style="margin-bottom:0.85rem;">
              <h3 class="sheet-section-title">Opção 2: Gerar Arquivo .PDF Nativo de 2 Páginas (via pdf-lib)</h3>
              <p style="font-size:0.88rem; margin-top:0;">
                Gera diretamente um arquivo <code>.pdf</code> de 2 páginas completo no navegador e faz o download imediato.
              </p>
              <button type="button" class="btn btn-gold" data-action="baixar-pdf-nativo">
                📄 Gerar e Baixar PDF de 2 Páginas (.pdf)
              </button>
            </div>

            <div class="sheet-section-box">
              <h3 class="sheet-section-title">Opção 3: Preencher Ficha PDF Editável Oficial (AcroForm)</h3>
              <p style="font-size:0.88rem; margin-top:0;">
                Selecione o arquivo <code>FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf</code> do seu computador para inspecionar e preencher os campos AcroForm automaticamente com os dados de <strong>${escaparHTML(inv.identidade?.nome || 'seu investigador')}</strong>.
              </p>
              <label class="btn" style="cursor:pointer;">
                📎 Selecionar PDF Editável Oficial...
                <input type="file" accept=".pdf,application/pdf" style="display:none;" data-action="preencher-pdf-editavel" />
              </label>
              <div id="pdf-acroform-status" style="margin-top:0.5rem; font-size:0.82rem; font-family:var(--font-mono);"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (state.modalAberto === 'desenvolvimento') {
      const marcadas = (inv.pericias || []).filter((p) => p.marcada && p.marcavel);
      return `
        <div class="modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Fase de Desenvolvimento do Investigador">
          <div class="modal-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
              <h2 style="margin:0; font-size:1.25rem;">🌟 Fase de Desenvolvimento do Investigador (pág. 94)</h2>
              <button type="button" class="btn btn-sm" data-action="fechar-modal">✕ Fechar</button>
            </div>

            <p style="font-size:0.88rem; margin-top:0;">
              Ao final de um cenário, faça uma rolagem de <code>1D100</code> para cada perícia marcada com <code>[✓]</code>.
              Se o resultado for <strong>maior que o valor atual da perícia</strong> (ou <strong>96–100</strong>), a perícia aumenta em <strong>+1D10</strong> pontos!
              Se uma perícia alcançar ou ultrapassar <strong>90%</strong>, o investigador recupera <strong>+2D6 pontos de Sanidade</strong>.
            </p>

            <div style="margin-bottom:1rem;">
              <strong>Perícias Marcadas Atualmente (${marcadas.length}):</strong>
              ${marcadas.length === 0
                ? '<div class="alert" style="margin-top:0.4rem;">Nenhuma perícia marcada no momento. Marque a caixa [✓] ao lado das perícias em que obtiver sucesso durante a sessão!</div>'
                : `
                  <ul style="margin:0.4rem 0; padding-left:1.2rem; font-size:0.9rem;">
                    ${marcadas.map((p) => `<li><strong>${escaparHTML(p.nome)}</strong> (${obterTotalPericia(inv, p.id)}%)</li>`).join('')}
                  </ul>
                  <button type="button" class="btn btn-primary" data-action="executar-fase-desenvolvimento">
                    🎲 Rolar Melhoria para Todas as ${marcadas.length} Perícias Marcadas
                  </button>
                `
              }
            </div>

            ${state.resultadoDesenvolvimento ? `
              <div class="alert alert-success">
                <strong>Resultado da Fase de Desenvolvimento:</strong>
                <ul style="margin:0.4rem 0 0; padding-left:1.2rem; font-family:var(--font-mono); font-size:0.82rem;">
                  ${state.resultadoDesenvolvimento.map((r) => `<li>${escaparHTML(r)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    if (state.modalAberto === 'especializacao') {
      return `
        <div class="modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Adicionar Especialização ou Perícia Incomum">
          <div class="modal-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">
              <h2 style="margin:0; font-size:1.25rem;">+ Adicionar Especialização ou Perícia Incomum (Cap. 4)</h2>
              <button type="button" class="btn btn-sm" data-action="fechar-modal">✕ Fechar</button>
            </div>

            <div class="sheet-section-box" style="margin-bottom:1rem;">
              <h3 class="sheet-section-title">1. Nova Especialização (Arte/Ofício, Ciência, Língua, Pilotar, Sobrevivência)</h3>
              <div class="grid-2" style="margin-bottom:0.65rem;">
                <div class="form-group">
                  <label class="form-label">Família de Perícia</label>
                  <select id="sel-familia-esp" class="form-select">
                    <option value="arte_e_oficio">Arte e Ofício (Base 5%)</option>
                    <option value="ciencia">Ciência (Base 1%)</option>
                    <option value="lingua_outra">Língua - Outra (Base 1%)</option>
                    <option value="pilotar">Pilotar (Base 1%)</option>
                    <option value="sobrevivencia">Sobrevivência (Base 10%)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Nome da Especialidade</label>
                  <input id="inp-nome-esp" type="text" class="form-input" placeholder="Ex.: Química, Francês, Fotografia, Barco..." />
                </div>
              </div>
              <button type="button" class="btn btn-primary" data-action="confirmar-nova-especializacao">
                + Criar Especialização
              </button>
            </div>

            <div class="sheet-section-box">
              <h3 class="sheet-section-title">2. Especializações de Combate &amp; Perícias Incomuns (págs. 56–78)</h3>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <select id="sel-pericia-extra" class="form-select" style="flex:1;">
                  ${window.CoC7e.ESPECIALIZACOES_EXTRAS.map((ex) => `
                    <option value="${ex.id}">${escaparHTML(ex.nome)} (Base ${ex.base}%)</option>
                  `).join('')}
                </select>
                <button type="button" class="btn btn-gold" data-action="confirmar-pericia-extra">
                  + Adicionar à Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  /* ==========================================================================
     EVENTOS E INTERAÇÕES DO DOM
     ========================================================================== */

  function vincularEventosDOM(inv) {
    const root = document.getElementById('app-root');
    if (!root) return;

    // 1. Bindings diretos de Identidade
    root.querySelectorAll('[data-bind-identidade]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const campo = el.getAttribute('data-bind-identidade');
        inv.identidade = inv.identidade || {};
        inv.identidade[campo] = campo === 'idade' ? Math.max(15, Math.min(90, Number(e.target.value) || 28)) : e.target.value;
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 2. Bindings de Atributos Base
    root.querySelectorAll('[data-bind-atr-base]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const sigla = el.getAttribute('data-bind-atr-base');
        const val = Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 50)));
        inv.atributosBase[sigla] = val;
        recalcularInvestigador(inv, { resetarAtuais: state.modo === 'wizard' });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 3. Bindings de Ajustes de Idade e Sorte
    root.querySelectorAll('[data-bind-idade-ajuste]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const campo = el.getAttribute('data-bind-idade-ajuste');
        inv.idadeAjustes[campo] = Math.max(0, Math.floor(Number(e.target.value) || 0));
        recalcularInvestigador(inv, { resetarAtuais: state.modo === 'wizard' });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 4. Bindings de Ocupação Personalizada
    root.querySelectorAll('[data-bind-ocup-custom]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const campo = el.getAttribute('data-bind-ocup-custom');
        inv.ocupacaoCustom = inv.ocupacaoCustom || {};
        inv.ocupacaoCustom[campo] = campo === 'nome' ? e.target.value : Number(e.target.value) || 0;
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 5. Bindings de Antecedentes
    root.querySelectorAll('[data-bind-antecedente]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const campo = el.getAttribute('data-bind-antecedente');
        inv.antecedentes = inv.antecedentes || {};
        inv.antecedentes[campo] = e.target.value;
        salvarEstadoLocalStorage();
        if (campo === 'conexaoChave') renderizarApp();
      });
    });

    // 6. Bindings de Finanças Customizadas
    root.querySelectorAll('[data-bind-financas]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const campo = el.getAttribute('data-bind-financas');
        inv.financasCustom = inv.financasCustom || {};
        inv.financasCustom[campo] = e.target.value;
        salvarEstadoLocalStorage();
      });
    });

    // 7. Alocação de Pontos de Perícia na Etapa 6
    root.querySelectorAll('[data-action="alocar-ponto-pericia"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const pid = el.getAttribute('data-pericia-id');
        const campo = el.getAttribute('data-campo'); // 'ocupacao' | 'interesse'
        const p = (inv.pericias || []).find((x) => x.id === pid);
        if (!p) return;

        let novoVal = Math.max(0, Math.floor(Number(e.target.value) || 0));
        const teto = inv.limitePericia75 ? 75 : 99;
        const outroCampo = campo === 'ocupacao' ? (Number(p.interesse) || 0) : (Number(p.ocupacao) || 0);
        const maxPermitido = Math.max(0, teto - (Number(p.base) || 0) - outroCampo - (Number(p.outros) || 0));

        if (novoVal > maxPermitido) {
          novoVal = maxPermitido;
        }
        p[campo] = novoVal;
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 8. Editar especialização de perícia
    root.querySelectorAll('[data-action="editar-especializacao-pericia"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const pid = el.getAttribute('data-pericia-id');
        const p = (inv.pericias || []).find((x) => x.id === pid);
        if (!p) return;
        const esp = e.target.value.trim();
        p.especializacao = esp;
        if (p.id === 'lingua_nativa') {
          p.nome = esp ? `Língua (Nativa: ${esp})` : 'Língua (Nativa)';
        } else {
          p.nome = esp ? `${p.familia} (${esp})` : p.familia;
        }
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 9. Editar total de perícia direto na Ficha Viva
    root.querySelectorAll('[data-action="editar-total-pericia-ficha"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const pid = el.getAttribute('data-pericia-id');
        const p = (inv.pericias || []).find((x) => x.id === pid);
        if (!p) return;
        const novoTotal = Math.max(0, Math.min(99, Math.floor(Number(e.target.value) || 0)));
        const somaAtualSemOutros = Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0);
        p.outros = novoTotal - somaAtualSemOutros;
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // 10. Filtros e Selects com data-action
    const selMetodo = root.querySelector('[data-action="mudar-metodo-atributos"]');
    if (selMetodo) {
      selMetodo.addEventListener('change', (e) => {
        inv.metodoAtributos = e.target.value;
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    }

    const selOcup = root.querySelector('[data-action="selecionar-ocupacao"]');
    if (selOcup) {
      selOcup.addEventListener('change', (e) => {
        inv.ocupacaoId = e.target.value;
        const novaOcup = obterOcupacaoAtual(inv);
        inv.ocupacaoPericiasEscolhidas = [];
        // Aplica especializações sugeridas pela ocupação
        if (novaOcup.especializacoesSugeridas) {
          novaOcup.especializacoesSugeridas.forEach((sug) => {
            const pFam = (inv.pericias || []).find((p) => p.familia === sug.familia);
            if (pFam) {
              pFam.especializacao = sug.valor;
              pFam.nome = `${pFam.familia} (${sug.valor})`;
            }
          });
        }
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    }

    const selAtrOcup = root.querySelector('[data-action="selecionar-atributo-ocupacao"]');
    if (selAtrOcup) {
      selAtrOcup.addEventListener('change', (e) => {
        inv.ocupacaoAtributoEscolhido = e.target.value;
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    }

    const inpFiltroTexto = root.querySelector('[data-action="filtrar-pericia-texto"]');
    if (inpFiltroTexto) {
      inpFiltroTexto.addEventListener('input', (e) => {
        state.filtroPericiaTexto = e.target.value;
        const pos = e.target.selectionStart;
        renderizarApp();
        const novoInput = document.querySelector('[data-action="filtrar-pericia-texto"]');
        if (novoInput) {
          novoInput.focus();
          novoInput.setSelectionRange(pos, pos);
        }
      });
    }

    const selFiltroTipo = root.querySelector('[data-action="filtrar-pericia-tipo"]');
    if (selFiltroTipo) {
      selFiltroTipo.addEventListener('change', (e) => {
        state.filtroPericiaTipo = e.target.value;
        renderizarApp();
      });
    }

    // Checkboxes de configuração e escolhas
    root.querySelectorAll('[data-action="toggle-escolha-ocupacional"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const pid = el.getAttribute('data-pericia-id');
        inv.ocupacaoPericiasEscolhidas = inv.ocupacaoPericiasEscolhidas || [];
        if (e.target.checked) {
          if (!inv.ocupacaoPericiasEscolhidas.includes(pid)) inv.ocupacaoPericiasEscolhidas.push(pid);
        } else {
          inv.ocupacaoPericiasEscolhidas = inv.ocupacaoPericiasEscolhidas.filter((x) => x !== pid);
        }
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    root.querySelectorAll('[data-action="toggle-limite-75"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        inv.limitePericia75 = e.target.checked;
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    root.querySelectorAll('[data-action="toggle-natacao-10"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        inv.usarNatacao10 = e.target.checked;
        recalcularInvestigador(inv, { resetarAtuais: false });
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    root.querySelectorAll('[data-action="toggle-edicao-livre-ocup"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        state.edicaoLivreOcupacional = e.target.checked;
        renderizarApp();
      });
    });

    root.querySelectorAll('[data-action="toggle-marca-pericia"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const pid = el.getAttribute('data-pericia-id');
        const p = (inv.pericias || []).find((x) => x.id === pid);
        if (p && p.marcavel) {
          p.marcada = e.target.checked;
          salvarEstadoLocalStorage();
        }
      });
    });

    root.querySelectorAll('[data-action="toggle-flag-vital"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const flag = el.getAttribute('data-flag');
        inv.derivados[flag] = e.target.checked;
        salvarEstadoLocalStorage();
        renderizarApp();
      });
    });

    // Upload de JSON
    const inpImportJSON = root.querySelector('[data-action="importar-json"]');
    if (inpImportJSON) {
      inpImportJSON.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const txt = await file.text();
          const obj = JSON.parse(txt);
          const novo = Array.isArray(obj) ? obj[0] : obj;
          if (!novo || !novo.identidade) throw new Error('JSON inválido.');
          novo.id = gerarIdUnico();
          recalcularInvestigador(novo, { resetarAtuais: false });
          state.investigadores.unshift(novo);
          state.ativoId = novo.id;
          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
        } catch (err) {
          alert('Não foi possível importar o arquivo JSON: ' + err.message);
        }
      });
    }

    // Upload de PDF Editável AcroForm
    const inpPDFEditavel = root.querySelector('[data-action="preencher-pdf-editavel"]');
    if (inpPDFEditavel) {
      inpPDFEditavel.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const statusEl = document.getElementById('pdf-acroform-status');
        if (statusEl) statusEl.textContent = 'Processando e inspecionando campos AcroForm do PDF...';
        try {
          const buffer = await file.arrayBuffer();
          const res = await window.CoC7e.PDFExport.preencherPDFEditavel(buffer, inv);
          baixarBytesComoArquivo(
            res.bytes,
            `ficha-coc7e-${(inv.identidade?.nome || 'investigador').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
            'application/pdf'
          );
          if (statusEl) {
            statusEl.textContent = `✓ PDF processado! ${res.preenchidos} de ${res.totalCampos} campos AcroForm preenchidos automaticamente.`;
          }
        } catch (err) {
          if (statusEl) statusEl.textContent = 'Erro ao preencher PDF: ' + err.message;
        }
      });
    }
  }

  /* ==========================================================================
     DELEGAÇÃO GLOBAL DE CLIQUES (BOTÕES DATA-ACTION)
     ========================================================================== */

  function configurarDelegacaoCliques() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const inv = obterInvestigadorAtivo();
      const R = window.CoC7e.Regras;
      const T = window.CoC7e.TABELAS;

      switch (action) {
        case 'ir-wizard':
          state.modo = 'wizard';
          renderizarApp();
          break;

        case 'ir-ficha':
          state.modo = 'ficha';
          renderizarApp();
          break;

        case 'alternar-tema':
          alternarTema();
          break;

        case 'mudar-etapa':
          state.etapaWizard = Number(btn.getAttribute('data-etapa')) || 1;
          renderizarApp();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;

        case 'etapa-anterior':
          if (state.etapaWizard > 1) {
            state.etapaWizard--;
            renderizarApp();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          break;

        case 'proxima-etapa':
          if (state.etapaWizard < 9) {
            state.etapaWizard++;
            renderizarApp();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          break;

        case 'mudar-aba-ficha':
          state.abaFicha = btn.getAttribute('data-aba') || 'ambas';
          renderizarApp();
          break;

        case 'abrir-modal':
          state.modalAberto = btn.getAttribute('data-modal');
          state.resultadoDesenvolvimento = null;
          renderizarApp();
          break;

        case 'fechar-modal':
          state.modalAberto = null;
          renderizarApp();
          break;

        case 'novo-em-branco': {
          const novo = criarNovoInvestigadorVazio();
          state.investigadores.unshift(novo);
          state.ativoId = novo.id;
          state.modo = 'wizard';
          state.etapaWizard = 1;
          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'carregar-harvey': {
          let harvey = state.investigadores.find((x) => x.id === 'inv_harvey_walters_1920');
          if (!harvey) {
            harvey = criarHarveyWaltersExemplo();
            state.investigadores.unshift(harvey);
          } else {
            const novoHarvey = criarHarveyWaltersExemplo();
            Object.assign(harvey, novoHarvey);
          }
          state.ativoId = harvey.id;
          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'ativar-investigador':
          state.ativoId = btn.getAttribute('data-id');
          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;

        case 'duplicar-investigador': {
          const orig = state.investigadores.find((x) => x.id === btn.getAttribute('data-id'));
          if (orig) {
            const copia = JSON.parse(JSON.stringify(orig));
            copia.id = gerarIdUnico();
            copia.identidade.nome = (copia.identidade.nome || 'Investigador') + ' (Cópia)';
            state.investigadores.unshift(copia);
            state.ativoId = copia.id;
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'excluir-investigador': {
          if (state.investigadores.length <= 1) return;
          const idDel = btn.getAttribute('data-id');
          state.investigadores = state.investigadores.filter((x) => x.id !== idDel);
          if (state.ativoId === idDel) state.ativoId = state.investigadores[0].id;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'sortear-nome-1920': {
          const nomes = [
            'Arthur Pendelton', 'Evelyn Clarke', 'Walter Armitage', 'Clara Vance',
            'Raymond Carter', 'Eleanor Marsh', 'Henry Derby', 'Beatrice Gilman',
            'thomas Malone', 'Abigail Whateley', 'Silas Peabody', 'Miriam Tillinghast'
          ];
          inv.identidade.nome = nomes[Math.floor(Math.random() * nomes.length)];
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'rolar-todos-atributos': {
          T.ATRIBUTOS.forEach((m) => {
            const r = rolarMultiplosDados(m.dados, 6, m.soma, m.mult);
            inv.atributosBase[m.sigla] = r.total;
          });
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'rolar-atributo-individual': {
          const sigla = btn.getAttribute('data-atr');
          const meta = T.ATRIBUTOS.find((m) => m.sigla === sigla);
          if (meta) {
            const r = rolarMultiplosDados(meta.dados, 6, meta.soma, meta.mult);
            inv.atributosBase[sigla] = r.total;
            recalcularInvestigador(inv, { resetarAtuais: true });
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'aplicar-conjunto-fixo': {
          inv.metodoAtributos = 'conjunto_fixo';
          // Distribuicao clássica equilibrada dos 8 valores: 40, 50, 50, 50, 60, 60, 70, 80
          const valores = [...T.CONJUNTO_FIXO_ATRIBUTOS];
          const siglas = ['FOR', 'APA', 'CON', 'TAM', 'DES', 'POD', 'INT', 'EDU'];
          siglas.forEach((s, idx) => {
            inv.atributosBase[s] = valores[idx];
          });
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'rolar-melhorias-edu': {
          const idade = Number(inv.identidade?.idade) || 28;
          const regra = R.obterRegraIdade(idade);
          let eduTemp = Number(inv.atributosBase.EDU) || 60;
          let ganhoTotal = 0;
          const logs = [];

          for (let i = 1; i <= regra.melhoriasEDU; i++) {
            const d100 = rolarDado(100);
            const d10 = rolarDado(10);
            const res = R.resolverMelhoriaEDU(eduTemp, d100, d10);
            eduTemp = res.eduNova;
            ganhoTotal += res.ganho;
            logs.push(
              res.melhorou
                ? `${i}ª verificação: rolou ${d100} (> ${res.eduAnterior}) → melhorou +${res.ganho} pts (EDU ${res.eduNova}%)`
                : `${i}ª verificação: rolou ${d100} (≤ ${res.eduAnterior}) → não melhorou (EDU ${res.eduNova}%)`
            );
          }

          inv.idadeAjustes.ganhoEDU = ganhoTotal;
          inv.idadeAjustes.logMelhoriasEDU = logs;
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'zerar-melhorias-edu':
          inv.idadeAjustes.ganhoEDU = 0;
          inv.idadeAjustes.logMelhoriasEDU = [];
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;

        case 'rolar-sorte-inicial': {
          const idade = Number(inv.identidade?.idade) || 28;
          const regra = R.obterRegraIdade(idade);
          const r1 = rolarMultiplosDados(3, 6, 0, 5).total;
          inv.idadeAjustes.sorteRolagem1 = r1;
          if (regra.sorteDupla) {
            inv.idadeAjustes.sorteRolagem2 = rolarMultiplosDados(3, 6, 0, 5).total;
          } else {
            inv.idadeAjustes.sorteRolagem2 = null;
          }
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'distribuir-penalidade-idade': {
          const idade = Number(inv.identidade?.idade) || 28;
          const regra = R.obterRegraIdade(idade);
          inv.idadeAjustes.reducaoFOR = 0;
          inv.idadeAjustes.reducaoCON = 0;
          inv.idadeAjustes.reducaoTAM = 0;
          inv.idadeAjustes.reducaoDES = 0;

          let restante = regra.penalidadeFisicaTotal;
          const atrs = regra.atributosPenalidadeFisica;
          let idx = 0;
          while (restante > 0 && atrs.length > 0) {
            const s = atrs[idx % atrs.length];
            const passo = Math.min(5, restante);
            inv.idadeAjustes['reducao' + s] += passo;
            restante -= passo;
            idx++;
          }
          recalcularInvestigador(inv, { resetarAtuais: true });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'confirmar-nova-especializacao': {
          const selFam = document.getElementById('sel-familia-esp');
          const inpEsp = document.getElementById('inp-nome-esp');
          if (!selFam || !inpEsp) return;
          const famId = selFam.value;
          const espNome = inpEsp.value.trim() || 'Especialidade';
          const molde = window.CoC7e.PERICIAS_BASE.find((p) => p.id === famId);
          if (!molde) return;

          const novoId = `${famId}_${espNome.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-3)}`;
          inv.pericias.push({
            id: novoId,
            idBase: famId,
            nome: `${molde.familia} (${espNome})`,
            familia: molde.familia,
            especializacao: espNome,
            especializavel: true,
            categoria: molde.categoria,
            base: molde.base,
            ocupacao: 0,
            interesse: 0,
            outros: 0,
            marcada: false,
            marcavel: true,
            customAdded: true
          });

          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'confirmar-pericia-extra': {
          const selEx = document.getElementById('sel-pericia-extra');
          if (!selEx) return;
          const extra = window.CoC7e.ESPECIALIZACOES_EXTRAS.find((x) => x.id === selEx.value);
          if (!extra) return;
          if (!inv.pericias.some((p) => p.id === extra.id)) {
            inv.pericias.push({
              id: extra.id,
              nome: extra.nome,
              familia: extra.familia,
              especializacao: extra.subtipo || '',
              especializavel: false,
              categoria: extra.categoria,
              base: extra.base,
              ocupacao: 0,
              interesse: 0,
              outros: 0,
              marcada: false,
              marcavel: true,
              customAdded: true
            });
          }
          state.modalAberto = null;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'remover-pericia-custom': {
          const pid = btn.getAttribute('data-pericia-id');
          inv.pericias = (inv.pericias || []).filter((p) => p.id !== pid);
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'sortear-antecedente': {
          const campo = btn.getAttribute('data-campo');
          sortearCampoAntecedente(inv, campo);
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'sortear-todos-antecedentes': {
          ['descricaoPessoal', 'ideologiaCrencas', 'pessoasSignificativas', 'locaisImportantes', 'pertencesQueridos', 'caracteristicas'].forEach((c) => {
            sortearCampoAntecedente(inv, c);
          });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'adicionar-arma-catalogo': {
          const sel = document.getElementById('sel-adicionar-arma');
          if (!sel) return;
          const armaMolde = window.CoC7e.ARMAS_LIVRO.find((a) => a.id === sel.value);
          if (armaMolde) {
            inv.armas = inv.armas || [];
            inv.armas.push(JSON.parse(JSON.stringify(armaMolde)));
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'remover-arma': {
          const idx = Number(btn.getAttribute('data-index'));
          inv.armas.splice(idx, 1);
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'adicionar-equip-catalogo': {
          const sel = document.getElementById('sel-equip-1920');
          if (sel && sel.value) {
            inv.equipamentos = inv.equipamentos || [];
            inv.equipamentos.push(sel.value);
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'adicionar-equip-custom': {
          const inp = document.getElementById('inp-equip-custom');
          if (inp && inp.value.trim()) {
            inv.equipamentos = inv.equipamentos || [];
            inv.equipamentos.push(inp.value.trim());
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'adicionar-equip-ficha': {
          const inp = document.getElementById('inp-equip-ficha');
          if (inp && inp.value.trim()) {
            inv.equipamentos = inv.equipamentos || [];
            inv.equipamentos.push(inp.value.trim());
            salvarEstadoLocalStorage();
            renderizarApp();
          }
          break;
        }

        case 'remover-equipamento': {
          const idx = Number(btn.getAttribute('data-index'));
          inv.equipamentos.splice(idx, 1);
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        /* --- AÇÕES DA FICHA VIVA E ROLAGENS --- */
        case 'definir-bonus-penalidade':
          state.dadosBonusPenalidade = Number(btn.getAttribute('data-valor')) || 0;
          renderizarApp();
          break;

        case 'definir-dificuldade-teste':
          state.dificuldadeTeste = btn.getAttribute('data-dificuldade') || 'regular';
          renderizarApp();
          break;

        case 'rolar-teste-1d100': {
          const nome = btn.getAttribute('data-nome') || 'Teste';
          const valorAlvo = Number(btn.getAttribute('data-alvo')) || 50;
          const tipo = btn.getAttribute('data-tipo') || 'pericia';
          const periciaId = btn.getAttribute('data-pericia-id') || null;
          const defeitoArma = btn.getAttribute('data-defeito') || null;
          executarRolagem1D100({ nome, valorAlvo, tipo, periciaId, defeitoArma, testeForcado: false });
          break;
        }

        case 'forcar-ultimo-teste': {
          const r = state.ultimaRolagem;
          if (!r || !r.podeForcar) return;
          executarRolagem1D100({
            nome: r.nome,
            valorAlvo: r.valorAlvo,
            tipo: r.tipo,
            periciaId: r.periciaId,
            defeitoArma: r.defeitoArma,
            testeForcado: true
          });
          break;
        }

        case 'gastar-sorte-rolagem': {
          const custo = Number(btn.getAttribute('data-custo')) || 0;
          const rotulo = btn.getAttribute('data-rotulo') || 'Sucesso';
          gastarSorteNaUltimaRolagem(custo, rotulo);
          break;
        }

        case 'rolar-dano-arma': {
          const armaNome = btn.getAttribute('data-arma') || 'Arma';
          const exprDano = btn.getAttribute('data-dano') || '1D3';
          const res = rolarExpressaoDano(exprDano);
          state.logRolagens.unshift({
            id: 'dmg_' + Date.now(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            nome: `💥 Dano: ${armaNome}`,
            resultadoFinal: `${res.total} PV`,
            detalhe: `${exprDano} → ${res.detalhe}`
          });
          renderizarApp();
          break;
        }

        case 'rolar-dado-avulso': {
          const expr = btn.getAttribute('data-expr') || '1D6';
          const res = rolarExpressaoDano(expr);
          state.logRolagens.unshift({
            id: 'die_' + Date.now(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            nome: `🎲 Dado ${expr}`,
            resultadoFinal: res.total,
            detalhe: res.detalhe
          });
          renderizarApp();
          break;
        }

        case 'limpar-log-rolagens':
          state.logRolagens = [];
          state.ultimaRolagem = null;
          renderizarApp();
          break;

        case 'ajustar-vital': {
          const campo = btn.getAttribute('data-campo');
          const delta = Number(btn.getAttribute('data-delta')) || 0;
          const d = inv.derivados;
          if (campo === 'pvAtual') {
            d.pvAtual = Math.max(0, Math.min(d.pvMax, (Number(d.pvAtual) || 0) + delta));
          } else if (campo === 'sanAtual') {
            d.sanAtual = Math.max(0, Math.min(d.sanMax, (Number(d.sanAtual) || 0) + delta));
          } else if (campo === 'pmAtual') {
            d.pmAtual = Math.max(0, Math.min(d.pmMax, (Number(d.pmAtual) || 0) + delta));
          } else if (campo === 'sorteAtual') {
            d.sorteAtual = Math.max(0, Math.min(99, (Number(d.sorteAtual) || 0) + delta));
          }
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'aplicar-dano-golpe': {
          const inp = document.getElementById('inp-dano-golpe');
          const dano = Number(inp?.value) || 0;
          if (dano <= 0) return;
          const d = inv.derivados;
          const res = R.aplicarDanoCombate(d.pvAtual, d.pvMax, dano, d.lesaoGrave);
          d.pvAtual = res.pvNovo;
          d.lesaoGrave = res.lesaoGrave;
          d.inconsciente = res.inconsciente;
          d.morrendo = res.morrendo;

          state.logRolagens.unshift({
            id: 'hit_' + Date.now(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            nome: '🩸 Dano Sofrido',
            resultadoFinal: `-${dano} PV`,
            detalhe: res.resumo
          });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'aplicar-perda-sanidade': {
          const inp = document.getElementById('inp-perda-san');
          const perda = Number(inp?.value) || 0;
          if (perda <= 0) return;
          const d = inv.derivados;
          const res = R.avaliarPerdaSanidade(d.sanAtual, perda, d.perdaSanDia || 0, d.sanInicioDia || d.sanAtual);
          d.sanAtual = res.sanNova;
          d.perdaSanDia = res.perdaDiaTotal;
          if (res.gatilhoIndefinida) d.insanidadeIndefinida = true;
          if (res.gatilhoTemporaria) d.insanidadeTemporaria = true;

          let msg = `Perdeu ${perda} SAN (Dia: ${res.perdaDiaTotal}/${res.limiteIndefinida}).`;
          if (res.permanentementeInsano) msg += ' 0 SAN: INSANIDADE PERMANENTE!';
          else if (res.gatilhoIndefinida) msg += ' Gatilho de INSANIDADE INDEFINIDA atingido (≥ 1/5 da SAN do dia)!';
          else if (res.gatilhoTemporaria) msg += ' Perda ≥ 5 SAN: faça um Teste de INT; se tiver sucesso, sofre INSANIDADE TEMPORÁRIA (1D10 horas)!';

          state.logRolagens.unshift({
            id: 'san_' + Date.now(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            nome: '😱 Perda de Sanidade',
            resultadoFinal: `-${perda} SAN`,
            detalhe: msg
          });
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'novo-dia-sanidade': {
          inv.derivados.perdaSanDia = 0;
          inv.derivados.sanInicioDia = inv.derivados.sanAtual;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'sortear-acesso-loucura': {
          const lista = T.ACESSOS_LOUCURA_TEMPO_REAL;
          const idx = Math.floor(Math.random() * lista.length);
          const rodadas = rolarDado(10);
          const texto = lista[idx];
          state.logRolagens.unshift({
            id: 'mad_' + Date.now(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            nome: `🌀 Acesso de Loucura (${rodadas} rodadas)`,
            resultadoFinal: `1D10 = ${idx + 1}`,
            detalhe: texto
          });
          renderizarApp();
          break;
        }

        case 'executar-fase-desenvolvimento': {
          const marcadas = (inv.pericias || []).filter((p) => p.marcada && p.marcavel);
          const relatorio = [];

          marcadas.forEach((p) => {
            const totalAtual = obterTotalPericia(inv, p.id);
            const d100 = rolarDado(100);
            const d10 = rolarDado(10);
            const res = R.resolverDesenvolvimentoPericia(totalAtual, d100, d10);
            p.marcada = false;

            if (res.evoluiu) {
              p.outros = (Number(p.outros) || 0) + res.ganho;
              let linha = `✓ ${p.nome}: rolou ${d100} (> ${totalAtual}%) → subiu +${res.ganho}% (Novo: ${res.valorNovo}%)`;
              if (res.bonusSanidade2D6) {
                const bonusSan = rolarDado(6) + rolarDado(6);
                inv.derivados.sanAtual = Math.min(inv.derivados.sanMax, inv.derivados.sanAtual + bonusSan);
                linha += ` ★ Atingiu 90%+: recuperou +${bonusSan} SAN (2D6)!`;
              }
              relatorio.push(linha);
            } else {
              relatorio.push(`✗ ${p.nome}: rolou ${d100} (≤ ${totalAtual}%) → manteve ${totalAtual}%`);
            }
          });

          state.resultadoDesenvolvimento = relatorio;
          salvarEstadoLocalStorage();
          renderizarApp();
          break;
        }

        case 'imprimir-direto': {
          state.modalAberto = null;
          state.modo = 'ficha';
          state.abaFicha = 'ambas';
          renderizarApp();
          setTimeout(() => window.print(), 120);
          break;
        }

        case 'baixar-pdf-nativo': {
          try {
            const bytes = await window.CoC7e.PDFExport.gerarPDFNativoDuasPaginas(inv);
            baixarBytesComoArquivo(
              bytes,
              `ficha-coc7e-1920-${(inv.identidade?.nome || 'investigador').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
              'application/pdf'
            );
          } catch (err) {
            alert('Erro ao gerar PDF nativo: ' + err.message);
          }
          break;
        }

        case 'exportar-json-atual': {
          const jsonStr = JSON.stringify(inv, null, 2);
          const bytes = new TextEncoder().encode(jsonStr);
          baixarBytesComoArquivo(
            bytes,
            `investigador-coc7e-${(inv.identidade?.nome || 'sem-nome').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
            'application/json'
          );
          break;
        }
      }
    });
  }

  function sortearCampoAntecedente(inv, campo) {
    const tab = window.CoC7e.TABELAS.ANTECEDENTES;
    inv.antecedentes = inv.antecedentes || {};

    if (campo === 'descricaoPessoal') {
      const lista = tab.descricaoPessoal;
      const a = lista[Math.floor(Math.random() * lista.length)];
      const b = lista[Math.floor(Math.random() * lista.length)];
      inv.antecedentes.descricaoPessoal = a === b ? a : `${a}, aparência ${b.toLowerCase()}.`;
    } else if (campo === 'pessoasSignificativas') {
      const quem = tab.pessoasSignificativasQuem[Math.floor(Math.random() * tab.pessoasSignificativasQuem.length)];
      const porque = tab.pessoasSignificativasPorque[Math.floor(Math.random() * tab.pessoasSignificativasPorque.length)];
      inv.antecedentes.pessoasSignificativas = `Quem: ${quem}\nPor quê: ${porque}`;
    } else if (tab[campo]) {
      const lista = tab[campo];
      inv.antecedentes[campo] = lista[Math.floor(Math.random() * lista.length)];
    }
  }

  function baixarBytesComoArquivo(bytes, nomeArquivo, mimeType) {
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function init() {
    carregarEstadoLocalStorage();
    configurarDelegacaoCliques();
    renderizarApp();
  }

  return {
    init,
    state,
    criarNovoInvestigadorVazio,
    criarHarveyWaltersExemplo,
    recalcularInvestigador
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.CoC7e.App.init();
});
