export interface AtributosMap {
  FOR: number;
  CON: number;
  TAM: number;
  DES: number;
  APA: number;
  INT: number;
  POD: number;
  EDU: number;
  [key: string]: number;
}

export interface DerivadosInvestigador {
  pvAtual: number;
  pvMax: number;
  sanAtual: number;
  sanInicial: number;
  sanMax: number;
  pmAtual: number;
  pmMax: number;
  sorteAtual: number;
  sorteInicial: number;
  mov: number;
  movBase?: number;
  penalidadeMOV?: number;
  danoExtra: string;
  corpo: number;
  esquivaBase: number;
  lesaoGrave: boolean;
  morrendo: boolean;
  inconsciente: boolean;
  insanidadeTemporaria: boolean;
  insanidadeIndefinida: boolean;
  overrideManual?: boolean;
}

export interface IdentidadeInvestigador {
  nome: string;
  jogador: string;
  ocupacao: string;
  idade: number;
  sexo: string;
  residencia: string;
  localNascimento: string;
}

export interface IdadeAjustes {
  ganhoEDU: number;
  reducaoFOR: number;
  reducaoCON: number;
  reducaoDES: number;
  reducaoTAM?: number;
  reducaoAPA?: number;
  sorteRolagem1: number;
  sorteRolagem2: number;
  sorteInicial: number;
  historicoTestesEDU?: Array<{
    teste: number;
    d100: number;
    d10: number;
    melhorou: boolean;
    ganho: number;
    eduNova: number;
  }>;
  [key: string]: any;
}

export interface PericiaInvestigador {
  id: string;
  nome: string;
  base: number;
  baseDinamica?: string;
  ocupacao: number;
  interesse: number;
  outros: number;
  marcada: boolean;
  marcavel: boolean;
  especializavel?: boolean;
  familia?: string;
  especializacao?: string;
  customAdded?: boolean;
  permiteRotuloCustom?: boolean;
  bloqueadaNaCriacao?: boolean;
  categoria?: string;
}

export interface ArmaInvestigador {
  id: string;
  nome: string;
  periciaNome: string;
  danoBase: string;
  alcance: string;
  disparos: string;
  municao: number;
  defeito: number;
  somaDX?: 'nenhum' | 'completo' | 'metade';
  observacoes?: string;
  categoria?: string;
  custo1920?: string;
}

export interface AntecedentesInvestigador {
  descricaoPessoal: string;
  ideologiaCrencas: string;
  pessoasSignificativas: string;
  locaisImportantes: string;
  pertencesQueridos: string;
  caracteristicas: string;
  conexaoChave: string;
  ferimentosCicatrizes: string;
  fobiasManias: string;
  tomosFeiticos: string;
  encontrosEstranhos: string;
  [key: string]: string;
}

export interface FinancasInvestigador {
  nivelGastos: number;
  dinheiro: number;
  patrimonio: number;
  padraoVida?: string;
  acomodacoes?: string;
  viagem?: string;
}

export interface Investigador {
  id: string;
  versao: string;
  identidade: IdentidadeInvestigador;
  metodoAtributos: 'rolagem' | 'arranjo_fixo' | 'compra_pontos';
  atributosBase: AtributosMap;
  idadeAjustes: IdadeAjustes;
  atributosFinais: AtributosMap;
  derivados: DerivadosInvestigador;
  ocupacaoId: string;
  ocupacaoNome: string;
  ocupacaoAtributoEscolhido: string;
  ocupacaoPericiasEscolhidas: string[];
  pericias: PericiaInvestigador[];
  armas: ArmaInvestigador[];
  equipamentos: string[];
  antecedentes: AntecedentesInvestigador;
  financas: FinancasInvestigador;
  limitePericia75?: boolean;
  usarNatacao10?: boolean;
  poolRolado?: number[];
}

export interface D100RollData {
  resultadoFinal: number;
  unidade: number;
  dezenaEscolhida: number;
  dezenasRoladas: number[];
  tipoModificador: string;
}

export interface RollAvaliacao {
  codigo: string;
  nivel: string;
  rotulo: string;
  sucesso: boolean;
  classeCss: string;
  regular: number;
  dificil: number;
  extremo: number;
  limiteDesastre?: number;
}

export interface RegistroRolagem {
  id: string;
  horario: string;
  investigador: string;
  rotulo: string;
  valorAlvo: number;
  d100: D100RollData;
  avaliacao: RollAvaliacao;
  forcada?: boolean;
  ehTesteSorte?: boolean;
  ehTesteSanidade?: boolean;
  periciaId?: string | null;
  podeGastarSorte?: boolean;
  sorteParaRegular?: number;
  sorteParaDificil?: number;
  sorteParaExtremo?: number;
  sorteGasta?: number;
}
