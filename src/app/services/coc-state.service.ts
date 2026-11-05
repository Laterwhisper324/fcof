import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Investigador,
  AtributosMap,
  PericiaInvestigador,
  ArmaInvestigador,
  RegistroRolagem,
  D100RollData,
  RollAvaliacao
} from '../models/coc.models';
import { ITEM_ICON_PRESETS, obterIconePadrao } from '../utils/item-icons';

const STORAGE_KEY = 'coc7e_investigadores_v2';
const ACTIVE_KEY = 'coc7e_ativo_id_v2';
const THEME_KEY = 'coc7e_theme_v2';

@Injectable({
  providedIn: 'root'
})
export class CocStateService {
  private get CoC7e(): any {
    return (window as any).CoC7e || {};
  }

  public get R(): any {
    return this.CoC7e.Regras || {};
  }

  public get T(): any {
    return this.CoC7e.TABELAS || {};
  }

  public get PERICIAS_BASE(): any[] {
    return this.CoC7e.PERICIAS_BASE || [];
  }

  public get OCUPACOES(): any[] {
    return this.CoC7e.OCUPACOES || [];
  }

  public get ARMAS_LIVRO(): any[] {
    return this.CoC7e.ARMAS_LIVRO || [];
  }

  public get PDFExport(): any {
    return this.CoC7e.PDFExport || {};
  }

  // --- SIGNALS DE ESTADO ---
  public readonly modoView = signal<'wizard' | 'sheet'>('wizard');
  public readonly etapaWizard = signal<number>(1);
  public readonly abaFicha = signal<'resumo' | 'pericias' | 'combate' | 'antecedentes' | 'inventario' | 'folha2p'>('resumo');
  public readonly subAbaAntecedentesWizard = signal<'essenciais' | 'mythos'>('essenciais');
  public readonly tema = signal<'light' | 'dark'>('light');
  public readonly dadosBonusPenalidade = signal<number>(0);

  // Modais e gavetas
  public readonly modalAberto = signal<string | null>(null);
  public readonly armaEmEdicao = signal<ArmaInvestigador | null>(null);
  public readonly localizacaoNovoItem = signal<'corpo' | 'mochila'>('corpo');
  public readonly gavetaDadosAberta = signal<boolean>(false);
  public readonly toastRolagemVisivel = signal<boolean>(false);
  public readonly painelVitaisAberto = signal<boolean>(false);
  public readonly cardAntecedenteAberto = signal<string | null>(null);
  public readonly exportandoPDF = signal<boolean>(false);
  public readonly rolandoDado = signal<boolean>(false);

  public dispararAnimacaoDado(duracaoMs: number = 850): void {
    this.rolandoDado.set(true);
    setTimeout(() => {
      this.rolandoDado.set(false);
    }, duracaoMs);
  }

  // Filtros
  public readonly filtroPericiaWizard = signal<string>('ocupacionais');
  public readonly buscaPericiaWizard = signal<string>('');
  public readonly buscaEscolhaOcupacional = signal<string>('');
  public readonly modoVisaoPericiasFicha = signal<'destaque' | 'todas'>('destaque');
  public readonly categoriaPericiaFicha = signal<string>('social');
  public readonly buscaPericiaFicha = signal<string>('');

  // Histórico de rolagens
  public readonly ultimaRolagem = signal<RegistroRolagem | null>(null);
  public readonly historicoRolagens = signal<RegistroRolagem[]>([]);
  public readonly avisoVital = signal<string | null>(null);
  public readonly resultadoDesenvolvimento = signal<string[]>([]);

  // Investigadores
  public readonly investigadores = signal<Investigador[]>([]);
  public readonly investigadorAtivoId = signal<string>('');

  // Investigador Ativo derivado
  public readonly inv = computed<Investigador>(() => {
    const list = this.investigadores();
    const activeId = this.investigadorAtivoId();
    const found = list.find((i) => i.id === activeId);
    if (found) return found;
    if (list.length > 0) return list[0];
    return this.criarInvestigadorPadrao();
  });

  // Campos de antecedentes
  public readonly CAMPOS_ANTECEDENTES = [
    { chave: 'descricaoPessoal', titulo: 'Descrição Pessoal', dica: 'Aparência, vestimenta, maneirismos, presença física.', grupo: 'essenciais' },
    { chave: 'ideologiaCrencas', titulo: 'Ideologia / Crenças', dica: 'Em que você acredita com fervor? Filosofia, política, religião.', grupo: 'essenciais' },
    { chave: 'pessoasSignificativas', titulo: 'Pessoas Significativas', dica: 'Quem importa para você e por qual motivo vital.', grupo: 'essenciais' },
    { chave: 'locaisImportantes', titulo: 'Locais Importantes', dica: 'Um lugar de refúgio, memórias de infância ou descoberta.', grupo: 'essenciais' },
    { chave: 'pertencesQueridos', titulo: 'Pertences Queridos', dica: 'Um item sentimental, amuleto, relíquia ou ferramenta indispensável.', grupo: 'essenciais' },
    { chave: 'caracteristicas', titulo: 'Características Pessoais', dica: 'Traços de personalidade marcantes, hábitos curiosos, defeitos.', grupo: 'essenciais' },
    { chave: 'ferimentosCicatrizes', titulo: 'Ferimentos & Cicatrizes', dica: 'Marcas de batalhas passadas, ferimentos permanentes, traumas corporais.', grupo: 'mythos' },
    { chave: 'fobiasManias', titulo: 'Fobias & Manias', dica: 'Medos irracionais e obsessões adquiridas em episódios de insanidade.', grupo: 'mythos' },
    { chave: 'tomosFeiticos', titulo: 'Tomos Arcanos, Feitiços & Artefatos', dica: 'Livros profanos de conhecimento oculto e magias aprendidas.', grupo: 'mythos' },
    { chave: 'encontrosEstranhos', titulo: 'Encontros com Criaturas Estranhas', dica: 'Entidades sobrenaturais testemunhadas e eventos inexplicáveis.', grupo: 'mythos' }
  ];

  constructor() {
    this.carregarTema();
    this.carregarInvestigadores();

    // Auto-save no localStorage sempre que os investigadores mudarem
    effect(() => {
      const list = this.investigadores();
      const activeId = this.investigadorAtivoId();
      if (list.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
        } catch (e) {
          console.warn('Erro ao salvar no localStorage:', e);
        }
      }
    });
  }

  // --- GERENCIAMENTO DE TEMA ---
  public aplicarTema(t: 'light' | 'dark'): void {
    this.tema.set(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
  }

  public alternarTema(): void {
    this.aplicarTema(this.tema() === 'dark' ? 'light' : 'dark');
  }

  private carregarTema(): void {
    const salvo = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    if (salvo === 'dark' || salvo === 'light') {
      this.aplicarTema(salvo);
    } else {
      this.aplicarTema('light');
    }
  }

  // --- CRIAÇÃO E CARGA DE INVESTIGADORES ---
  public criarInvestigadorPadrao(): Investigador {
    const novo: Investigador = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      versao: '2.0.0',
      identidade: {
        nome: '',
        jogador: '',
        ocupacao: 'Jornalista',
        idade: 28,
        sexo: '',
        residencia: 'Arkham, MA',
        localNascimento: 'Boston, MA'
      },
      metodoAtributos: 'rolagem',
      atributosBase: {
        FOR: 50, CON: 50, TAM: 60, DES: 60, APA: 50, INT: 70, POD: 60, EDU: 70
      },
      idadeAjustes: {
        ganhoEDU: 0,
        reducaoFOR: 0,
        reducaoCON: 0,
        reducaoDES: 0,
        reducaoTAM: 0,
        reducaoAPA: 0,
        sorteRolagem1: 50,
        sorteRolagem2: 0,
        sorteInicial: 50,
        historicoTestesEDU: []
      },
      atributosFinais: {
        FOR: 50, CON: 50, TAM: 60, DES: 60, APA: 50, INT: 70, POD: 60, EDU: 70
      },
      derivados: {
        pvAtual: 11,
        pvMax: 11,
        sanAtual: 60,
        sanInicial: 60,
        sanMax: 99,
        pmAtual: 12,
        pmMax: 12,
        sorteAtual: 50,
        sorteInicial: 50,
        mov: 8,
        movBase: 8,
        penalidadeMOV: 0,
        danoExtra: 'Nenhum',
        corpo: 0,
        esquivaBase: 30,
        lesaoGrave: false,
        morrendo: false,
        inconsciente: false,
        insanidadeTemporaria: false,
        insanidadeIndefinida: false,
        overrideManual: false
      },
      ocupacaoId: 'jornalista',
      ocupacaoNome: 'Jornalista',
      ocupacaoAtributoEscolhido: '',
      ocupacaoPericiasEscolhidas: [],
      pericias: this.clonarPericiasBase(),
      armas: [
        {
          id: 'w_desarmado',
          nome: 'Desarmado (Briga)',
          periciaNome: 'Lutar (Briga)',
          danoBase: '1D3',
          alcance: 'Toque',
          disparos: '1',
          municao: 0,
          defeito: 100,
          somaDX: 'completo',
          categoria: 'Corpo a Corpo',
          localizacao: 'corpo',
          tipoItem: 'arma',
          imagemUrl: ITEM_ICON_PRESETS[4].svgDataUri
        },
        {
          id: 'w_revolver',
          nome: 'Revólver .38 Especial',
          periciaNome: 'Armas de Fogo (Pistola)',
          danoBase: '1D10',
          alcance: '15m',
          disparos: '1(3)',
          municao: 6,
          defeito: 100,
          somaDX: 'nenhum',
          categoria: 'Armas de Fogo',
          localizacao: 'corpo',
          tipoItem: 'arma',
          imagemUrl: ITEM_ICON_PRESETS[0].svgDataUri
        },
        {
          id: 'w_corda',
          nome: 'Corda (15 metros)',
          periciaNome: '',
          danoBase: '-',
          alcance: '15m',
          disparos: '-',
          municao: 0,
          defeito: 100,
          somaDX: 'nenhum',
          categoria: 'Equipamento',
          localizacao: 'mochila',
          tipoItem: 'geral',
          observacoes: 'Corda resistente de cânhamo',
          imagemUrl: ITEM_ICON_PRESETS[5].svgDataUri
        },
        {
          id: 'w_gazuas',
          nome: 'Gazuas',
          periciaNome: 'Chaveiro',
          danoBase: '-',
          alcance: 'Toque',
          disparos: '-',
          municao: 0,
          defeito: 100,
          somaDX: 'nenhum',
          categoria: 'Ferramenta',
          localizacao: 'mochila',
          tipoItem: 'geral',
          observacoes: 'Chaves-mestras e michas de arrombamento',
          imagemUrl: ITEM_ICON_PRESETS[6].svgDataUri
        },
        {
          id: 'w_lanterna',
          nome: 'Lanterna de Latão',
          periciaNome: '',
          danoBase: '-',
          alcance: '20m',
          disparos: '-',
          municao: 0,
          defeito: 100,
          somaDX: 'nenhum',
          categoria: 'Equipamento',
          localizacao: 'mochila',
          tipoItem: 'geral',
          observacoes: 'Lanterna portátil a pilha',
          imagemUrl: ITEM_ICON_PRESETS[8].svgDataUri
        }
      ],
      equipamentos: [
        'Caderno de Rascunho e Caneta-Tinteiro',
        'Câmera Kodak Dobrável No. 1 + Filme',
        'Relógio de Bolso'
      ],
      antecedentes: {
        descricaoPessoal: '',
        ideologiaCrencas: '',
        pessoasSignificativas: '',
        locaisImportantes: '',
        pertencesQueridos: '',
        caracteristicas: '',
        conexaoChave: 'Ideologia / Crenças',
        ferimentosCicatrizes: '',
        fobiasManias: '',
        tomosFeiticos: '',
        encontrosEstranhos: ''
      },
      financas: {
        nivelGastos: 10,
        dinheiro: 20,
        patrimonio: 500,
        padraoVida: 'Médio',
        acomodacoes: 'Casa ou apartamento comum, alugado ou próprio.',
        viagem: 'Formas padrão de viagem (trem, ônibus).'
      },
      limitePericia75: true,
      usarNatacao10: false
    };

    this.recalcularDerivadosEPericiasInterno(novo, { resetarAtuais: true });
    return novo;
  }

  private clonarPericiasBase(): PericiaInvestigador[] {
    const bases = this.PERICIAS_BASE;
    if (!bases || bases.length === 0) return [];
    return bases.map((p: any) => ({
      id: p.id,
      nome: p.nome,
      base: p.padrao,
      baseDinamica: p.baseDinamica,
      ocupacao: 0,
      interesse: 0,
      outros: 0,
      marcada: false,
      marcavel: p.marcavel !== false,
      especializavel: Boolean(p.especializavel),
      familia: p.familia || '',
      categoria: p.categoria || 'Geral',
      especializacao: '',
      bloqueadaNaCriacao: Boolean(p.bloqueadaNaCriacao)
    }));
  }

  private carregarInvestigadores(): void {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((inv) => {
            (inv.armas || []).forEach((a: any, idx: number) => {
              if (!a.localizacao) a.localizacao = idx < 2 ? 'corpo' : 'mochila';
              if (!a.imagemUrl) a.imagemUrl = obterIconePadrao(a.nome);
              if (!a.tipoItem) a.tipoItem = a.danoBase && a.danoBase !== '-' ? 'arma' : 'geral';
            });
            this.recalcularDerivadosEPericiasInterno(inv, { resetarAtuais: false });
          });
          this.investigadores.set(parsed);
          const act = parsed.find((i) => i.id === activeId) ? (activeId as string) : parsed[0].id;
          this.investigadorAtivoId.set(act);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
    }

    const padrao = this.criarInvestigadorPadrao();
    this.investigadores.set([padrao]);
    this.investigadorAtivoId.set(padrao.id);
  }

  public salvarEstado(): void {
    // Dispara a reavaliação dos signals criando uma nova referência
    const list = [...this.investigadores()];
    this.investigadores.set(list);
  }

  public atualizarInvestigadorAtivo(mutator: (inv: Investigador) => void): void {
    const list = [...this.investigadores()];
    const activeId = this.investigadorAtivoId();
    const idx = list.findIndex((i) => i.id === activeId);
    if (idx >= 0) {
      mutator(list[idx]);
      this.recalcularDerivadosEPericiasInterno(list[idx], { resetarAtuais: false });
      this.investigadores.set(list);
    }
  }

  public trocarInvestigadorAtivo(id: string): void {
    this.investigadorAtivoId.set(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }

  public criarNovoInvestigador(): void {
    const novo = this.criarInvestigadorPadrao();
    const list = [...this.investigadores(), novo];
    this.investigadores.set(list);
    this.investigadorAtivoId.set(novo.id);
    this.etapaWizard.set(1);
    this.modoView.set('wizard');
  }

  public duplicarInvestigadorAtivo(): void {
    const atual = this.inv();
    const copia: Investigador = JSON.parse(JSON.stringify(atual));
    copia.id = 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    copia.identidade.nome = (copia.identidade.nome || 'Investigador') + ' (Cópia)';
    const list = [...this.investigadores(), copia];
    this.investigadores.set(list);
    this.investigadorAtivoId.set(copia.id);
  }

  public excluirInvestigadorAtivo(): void {
    const list = this.investigadores().filter((i) => i.id !== this.investigadorAtivoId());
    if (list.length === 0) {
      const novo = this.criarInvestigadorPadrao();
      this.investigadores.set([novo]);
      this.investigadorAtivoId.set(novo.id);
    } else {
      this.investigadores.set(list);
      this.investigadorAtivoId.set(list[0].id);
    }
  }

  // --- REGRAS DERIVADAS & CÁLCULOS CENTRAIS ---
  public regraIdade(idade: number): any {
    return this.R.obterRegraIdade ? this.R.obterRegraIdade(idade) : { rotulo: 'Adulto', penalidadeMOV: 0, atributosPenalidadeFisica: [] };
  }

  public mq(valor: number): { regular: number; metade: number; quinto: number } {
    return this.R.calcularMetadeQuinto ? this.R.calcularMetadeQuinto(valor) : { regular: valor, metade: Math.floor(valor / 2), quinto: Math.floor(valor / 5) };
  }

  public obterTotalPericiaObj(p: PericiaInvestigador): number {
    return (Number(p.base) || 0) + (Number(p.ocupacao) || 0) + (Number(p.interesse) || 0) + (Number(p.outros) || 0);
  }

  public ehPericiaOcupacional(inv: Investigador, p: PericiaInvestigador): boolean {
    if (p.id === 'nivel_de_credito') return true;
    const ocup = this.OCUPACOES.find((o: any) => o.id === inv.ocupacaoId);
    if (!ocup) return false;
    if ((ocup.periciasFixas || []).includes(p.id)) return true;
    if ((inv.ocupacaoPericiasEscolhidas || []).includes(p.id)) return true;
    return false;
  }

  // --- RECALCULAR DERIVADOS E PERÍCIAS (COM A CORREÇÃO DE MOV REATIVO) ---
  public recalcularDerivadosEPericiasInterno(inv: Investigador, opcoes: { resetarAtuais?: boolean } = {}): void {
    if (!inv) return;
    const aj = inv.idadeAjustes || (inv.idadeAjustes = {} as any);
    const base = inv.atributosBase || (inv.atributosBase = {} as any);
    const finais: AtributosMap = (inv.atributosFinais = {} as any);
    const idade = Number(inv.identidade && inv.identidade.idade) || 28;
    const regIdade = this.regraIdade(idade);

    // 1. Aplicação de modificadores de idade nos atributos finais
    const siglaList = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
    siglaList.forEach((s) => {
      let v = Number(base[s]) || 50;
      if (s === 'EDU') {
        const ganho = Number(aj.ganhoEDU) || 0;
        const penFixa = Number(regIdade.penalidadeEDU) || 0;
        v = Math.min(99, Math.max(0, v - penFixa + ganho));
      } else if (s === 'APA') {
        const penAPA = Number(regIdade.penalidadeAPA) || 0;
        v = Math.max(0, v - penAPA);
      } else if (regIdade.atributosPenalidadeFisica && regIdade.atributosPenalidadeFisica.includes(s)) {
        const red = Number(aj['reducao' + s]) || 0;
        v = Math.max(0, v - red);
      }
      finais[s] = v;
    });

    // 2. Bases dinâmicas de perícias
    let mythosTotal = 0;
    (inv.pericias || []).forEach((p) => {
      if (p.baseDinamica === 'METADE_DES') {
        p.base = Math.floor(finais.DES / 2);
      } else if (p.baseDinamica === 'EDU') {
        p.base = finais.EDU;
      } else if (p.id === 'natacao') {
        p.base = inv.usarNatacao10 ? 10 : 20;
      }
      if (p.id === 'mythos_de_cthulhu') {
        mythosTotal = this.obterTotalPericiaObj(p);
      }
    });

    // 3. Ocupação e Nomes
    const ocup = this.OCUPACOES.find((o: any) => o.id === inv.ocupacaoId);
    inv.ocupacaoNome = ocup ? ocup.nome : 'Investigador';

    // 4. Derivados (Regras 7ª Edição)
    const pvMaxCalc = this.R.calcularPVMaximo ? this.R.calcularPVMaximo(finais.CON, finais.TAM) : Math.floor((finais.CON + finais.TAM) / 10);
    const sanIniCalc = this.R.calcularSanidadeInicial ? this.R.calcularSanidadeInicial(finais.POD) : finais.POD;
    const sanMaxCalc = this.R.calcularSanidadeMaxima ? this.R.calcularSanidadeMaxima(mythosTotal) : Math.max(0, 99 - mythosTotal);
    const pmMaxCalc = this.R.calcularPMMaximo ? this.R.calcularPMMaximo(finais.POD) : Math.floor(finais.POD / 5);
    const esqBaseCalc = this.R.calcularEsquivaBase ? this.R.calcularEsquivaBase(finais.DES) : Math.floor(finais.DES / 2);
    const dxCorpo = this.R.calcularDanoExtraECorpo ? this.R.calcularDanoExtraECorpo(finais.FOR, finais.TAM) : { danoExtra: 'Nenhum', corpo: 0 };

    // =========================================================================
    // CORREÇÃO CRUCIAL DA TAREFA 3: TAXA DE MOVIMENTO (MOV) REATIVO E NUMÉRICO!
    // =========================================================================
    const movObj = this.R.calcularMOV ? this.R.calcularMOV(finais.FOR, finais.DES, finais.TAM, idade) : { movBase: 8, penalidadeIdade: 0, movFinal: 8 };
    const movFinalNumerico = Number(movObj.movFinal ?? movObj) || 8;

    const s1 = Number(aj.sorteRolagem1) || 50;
    const s2 = Number(aj.sorteRolagem2) || 0;
    const sorteIni = regIdade.duplaSorte ? Math.max(s1, s2) : s1;
    aj.sorteInicial = sorteIni;

    if (!inv.derivados) inv.derivados = {} as any;
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

      // Atribuição correta numérica sem [object Object] ou NaN:
      inv.derivados.mov = movFinalNumerico;
      inv.derivados.movBase = movObj.movBase || 8;
      inv.derivados.penalidadeMOV = movObj.penalidadeIdade || 0;

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

    // 5. Finanças conforme Nível de Crédito
    const ncPer = (inv.pericias || []).find((p) => p.id === 'nivel_de_credito');
    const ncVal = ncPer ? this.obterTotalPericiaObj(ncPer) : 0;
    const finCalc = this.R.calcularFinancas1920 ? this.R.calcularFinancas1920(ncVal) : { nivelGastos: 10, dinheiro: 20, patrimonio: 500 };
    inv.financas = Object.assign(inv.financas || {}, finCalc);
  }

  // --- CÁLCULO DE SALDO DE PERÍCIAS (COMPUTED EM TEMPO REAL) ---
  public readonly totaisPericias = computed(() => {
    const inv = this.inv();
    if (!inv) {
      return {
        totalOcupacao: 0,
        gastosOcupacao: 0,
        restantesOcupacao: 0,
        totalInteresse: 0,
        gastosInteresse: 0,
        restantesInteresse: 0,
        creditoMin: 0,
        creditoMax: 99,
        nivelCredito: 0,
        creditoValido: true,
        detalheOcupacao: ''
      };
    }

    const ocup = this.OCUPACOES.find((o: any) => o.id === inv.ocupacaoId) || {
      creditoMin: 0,
      creditoMax: 99,
      formulaTexto: 'EDU × 4'
    };

    let totalOcup = 0;
    let detalheOcup = '';
    if (this.R.calcularPontosOcupacao) {
      const calcOcup = this.R.calcularPontosOcupacao(ocup, inv.atributosFinais, inv.ocupacaoAtributoEscolhido);
      totalOcup = calcOcup.total;
      detalheOcup = calcOcup.detalhamento || ocup.formulaTexto;
    } else {
      totalOcup = (Number(inv.atributosFinais.EDU) || 70) * 4;
      detalheOcup = 'EDU × 4';
    }

    const totalInt = this.R.calcularPontosInteressePessoal
      ? this.R.calcularPontosInteressePessoal(inv.atributosFinais.INT)
      : (Number(inv.atributosFinais.INT) || 70) * 2;

    let gastosOcup = 0;
    let gastosInt = 0;
    let nivelCredito = 0;

    (inv.pericias || []).forEach((p) => {
      gastosOcup += Number(p.ocupacao) || 0;
      gastosInt += Number(p.interesse) || 0;
      if (p.id === 'nivel_de_credito') {
        nivelCredito = this.obterTotalPericiaObj(p);
      }
    });

    const cMin = ocup.creditoMin ?? 0;
    const cMax = ocup.creditoMax ?? 99;
    const creditoValido = nivelCredito >= cMin && nivelCredito <= cMax;

    return {
      totalOcupacao: totalOcup,
      gastosOcupacao: gastosOcup,
      restantesOcupacao: totalOcup - gastosOcup,
      totalInteresse: totalInt,
      gastosInteresse: gastosInt,
      restantesInteresse: totalInt - gastosInt,
      creditoMin: cMin,
      creditoMax: cMax,
      nivelCredito: nivelCredito,
      creditoValido: creditoValido,
      detalheOcupacao: detalheOcup
    };
  });

  // --- ROLADOR 1D100, FORÇAR ROLAGEM E GASTO DE SORTE ---
  public rolarPericiaOuAtributo(rotulo: string, valorAlvo: number, opcoes: { ehTesteSorte?: boolean; ehTesteSanidade?: boolean; forcada?: boolean; periciaId?: string | null } = {}): RegistroRolagem {
    this.dispararAnimacaoDado();
    const inv = this.inv();
    const d100: D100RollData = this.R.rolar1d100ComBonusPenalidade
      ? this.R.rolar1d100ComBonusPenalidade(this.dadosBonusPenalidade())
      : { resultadoFinal: Math.floor(Math.random() * 100) + 1, unidade: 0, dezenaEscolhida: 0, dezenasRoladas: [0], tipoModificador: 'NORMAL' };

    const avaliacao: RollAvaliacao = this.R.avaliarSucesso
      ? this.R.avaliarSucesso(d100.resultadoFinal, valorAlvo)
      : { codigo: 'regular', nivel: 'REGULAR', rotulo: 'Sucesso', sucesso: d100.resultadoFinal <= valorAlvo, classeCss: 'nivel-regular', regular: valorAlvo, dificil: Math.floor(valorAlvo / 2), extremo: Math.floor(valorAlvo / 5) };

    const podeGastarSorte = !opcoes.ehTesteSorte && !opcoes.ehTesteSanidade && !avaliacao.sucesso && avaliacao.nivel !== 'DESASTRE';
    let sorteParaRegular = 0;
    let sorteParaDificil = 0;
    let sorteParaExtremo = 0;

    if (podeGastarSorte) {
      if (d100.resultadoFinal > avaliacao.regular) sorteParaRegular = d100.resultadoFinal - avaliacao.regular;
      if (d100.resultadoFinal > avaliacao.dificil) sorteParaDificil = d100.resultadoFinal - avaliacao.dificil;
      if (d100.resultadoFinal > avaliacao.extremo) sorteParaExtremo = d100.resultadoFinal - avaliacao.extremo;
    }

    const registro: RegistroRolagem = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      investigador: (inv.identidade && inv.identidade.nome) || 'Investigador',
      rotulo,
      valorAlvo,
      d100,
      avaliacao,
      forcada: Boolean(opcoes.forcada),
      ehTesteSorte: Boolean(opcoes.ehTesteSorte),
      ehTesteSanidade: Boolean(opcoes.ehTesteSanidade),
      periciaId: opcoes.periciaId || null,
      podeGastarSorte,
      sorteParaRegular,
      sorteParaDificil,
      sorteParaExtremo,
      sorteGasta: 0
    };

    // Marcação automática de perícia bem-sucedida para desenvolvimento futuro
    if (opcoes.periciaId && avaliacao.sucesso) {
      this.atualizarInvestigadorAtivo((curr) => {
        const per = (curr.pericias || []).find((p) => p.id === opcoes.periciaId);
        if (per && per.marcavel) per.marcada = true;
      });
    }

    this.ultimaRolagem.set(registro);
    this.toastRolagemVisivel.set(true);
    const hist = [registro, ...this.historicoRolagens()].slice(0, 40);
    this.historicoRolagens.set(hist);
    return registro;
  }

  public forcarUltimaRolagem(): void {
    const ult = this.ultimaRolagem();
    if (!ult || ult.forcada || ult.ehTesteSorte || ult.ehTesteSanidade) return;
    this.rolarPericiaOuAtributo(ult.rotulo + ' (FORÇADO)', ult.valorAlvo, {
      forcada: true,
      periciaId: ult.periciaId
    });
  }

  public gastarSorteUltimaRolagem(nivelDesejado: 'REGULAR' | 'DIFICIL' | 'EXTREMO'): void {
    const ult = this.ultimaRolagem();
    const inv = this.inv();
    if (!ult || !ult.podeGastarSorte) return;

    let custo = 0;
    let novoNivel = 'REGULAR';
    let novoValorRolado = ult.d100.resultadoFinal;

    if (nivelDesejado === 'REGULAR' && ult.sorteParaRegular && ult.sorteParaRegular > 0) {
      custo = ult.sorteParaRegular;
      novoNivel = 'REGULAR';
      novoValorRolado = ult.avaliacao.regular;
    } else if (nivelDesejado === 'DIFICIL' && ult.sorteParaDificil && ult.sorteParaDificil > 0) {
      custo = ult.sorteParaDificil;
      novoNivel = 'DIFICIL';
      novoValorRolado = ult.avaliacao.dificil;
    } else if (nivelDesejado === 'EXTREMO' && ult.sorteParaExtremo && ult.sorteParaExtremo > 0) {
      custo = ult.sorteParaExtremo;
      novoNivel = 'EXTREMO';
      novoValorRolado = ult.avaliacao.extremo;
    }

    if (custo <= 0 || inv.derivados.sorteAtual < custo) return;

    this.atualizarInvestigadorAtivo((curr) => {
      curr.derivados.sorteAtual = Math.max(0, curr.derivados.sorteAtual - custo);
    });

    const novaAval: RollAvaliacao = this.R.avaliarSucesso
      ? this.R.avaliarSucesso(novoValorRolado, ult.valorAlvo)
      : { ...ult.avaliacao, sucesso: true, nivel: novoNivel, rotulo: 'Sucesso ' + novoNivel };

    const atualizado: RegistroRolagem = {
      ...ult,
      d100: { ...ult.d100, resultadoFinal: novoValorRolado },
      avaliacao: novaAval,
      sorteGasta: (ult.sorteGasta || 0) + custo,
      podeGastarSorte: false
    };

    this.ultimaRolagem.set(atualizado);
    const hist = this.historicoRolagens().map((item) => (item.id === ult.id ? atualizado : item));
    this.historicoRolagens.set(hist);
  }

  public rolarAtaqueArma(arma: ArmaInvestigador): void {
    if (!arma.periciaNome) {
      this.rolarDanoArma(arma);
      return;
    }
    const per = (this.inv().pericias || []).find(
      (p) => p.nome.toLowerCase().trim() === arma.periciaNome.toLowerCase().trim()
    );
    const alvo = per ? this.obterTotalPericiaObj(per) : 25;
    this.rolarPericiaOuAtributo('Ataque: ' + arma.nome + ' (' + arma.periciaNome + ')', alvo, {
      periciaId: per?.id
    });
  }

  public rolarDanoArma(arma: ArmaInvestigador): void {
    const inv = this.inv();
    const expr = this.R.formatarDanoArma
      ? this.R.formatarDanoArma(arma.danoBase, arma.somaDX, inv.derivados.danoExtra)
      : arma.danoBase;

    const partes = expr.toUpperCase().split('+').map((s: string) => s.trim());
    let total = 0;
    const detalhes: string[] = [];

    partes.forEach((pt: string) => {
      const mDado = pt.match(/^(\d+)D(\d+)$/);
      if (mDado) {
        const r = this.R.rolarDados ? this.R.rolarDados(Number(mDado[1]), Number(mDado[2]), 0) : { total: Math.floor(Math.random() * Number(mDado[2])) + 1, rolagens: [1] };
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

    const registro: RegistroRolagem = {
      id: Date.now() + '_dmg',
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      investigador: (inv.identidade && inv.identidade.nome) || 'Investigador',
      rotulo: 'Dano: ' + arma.nome + ' (' + expr + ')',
      valorAlvo: 100,
      d100: { resultadoFinal: Math.max(1, total), dezenaEscolhida: 0, unidade: 0, dezenasRoladas: [0], tipoModificador: 'DANO' },
      avaliacao: {
        codigo: 'regular',
        nivel: 'REGULAR',
        rotulo: 'Dano Total: ' + Math.max(1, total) + ' PV (' + detalhes.join(' + ') + ')',
        sucesso: true,
        classeCss: 'nivel-critico',
        regular: 100,
        dificil: 50,
        extremo: 20
      },
      podeGastarSorte: false
    };

    this.ultimaRolagem.set(registro);
    this.toastRolagemVisivel.set(true);
    const hist = [registro, ...this.historicoRolagens()].slice(0, 40);
    this.historicoRolagens.set(hist);
  }

    // --- DOWNLOAD E EXPORTAÇÃO DE ARQUIVOS (PDF OFICIAL & JSON) ---
  public baixarBytes(bytes: Uint8Array | ArrayBuffer, nomeArquivo: string, mimeType = 'application/pdf'): void {
    const blob = new Blob([bytes as any], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1000);
  }

  public async exportarFichaOficialPDF(achatado = false): Promise<void> {
    const inv = this.inv();
    const nomeLimpo = (((inv.identidade && inv.identidade.nome) || 'investigador'))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'investigador';

    const sufixo = achatado ? '-impressao' : '-editavel';
    const nomeArquivo = `ficha-oficial-coc7e-${nomeLimpo}${sufixo}.pdf`;

    if (!this.PDFExport || !this.PDFExport.exportarNaFichaOficialAnexada) {
      alert('Módulo de exportação PDF ainda não está carregado no navegador. Por favor, aguarde alguns instantes e tente novamente.');
      return;
    }

    this.exportandoPDF.set(true);
    try {
      const res = await this.PDFExport.exportarNaFichaOficialAnexada(inv, { achatarCampos: achatado });
      if (res && res.bytes) {
        this.baixarBytes(res.bytes, nomeArquivo, 'application/pdf');
      } else {
        throw new Error('O gerador de PDF não retornou os bytes do arquivo.');
      }
    } catch (err: any) {
      console.error('Erro na exportação da ficha oficial:', err);
      alert('Erro ao exportar a ficha oficial em PDF: ' + (err?.message || err));
    } finally {
      this.exportandoPDF.set(false);
    }
  }

  public async gerarPDFNativo(): Promise<void> {
    const inv = this.inv();
    const nomeLimpo = (((inv.identidade && inv.identidade.nome) || 'investigador'))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'investigador';

    if (this.PDFExport && this.PDFExport.gerarPDFNativoDuasPaginas) {
      try {
        const bytes = await this.PDFExport.gerarPDFNativoDuasPaginas(inv);
        if (bytes) {
          this.baixarBytes(bytes, `ficha-coc7e-${nomeLimpo}.pdf`, 'application/pdf');
          return;
        }
      } catch (e) {
        console.warn('Falha no gerador nativo, usando impressão nativa:', e);
      }
    }
    window.print();
  }

  public exportarJSON(): void {
    const inv = this.inv();
    const nomeLimpo = (((inv.identidade && inv.identidade.nome) || 'investigador'))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'investigador';
    const jsonStr = JSON.stringify(inv, null, 2);
    const bytes = new TextEncoder().encode(jsonStr);
    this.baixarBytes(bytes, `investigador-${nomeLimpo}.json`, 'application/json');
  }
}
