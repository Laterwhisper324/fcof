const fs = require('fs');

console.log('--- INICIANDO TESTE DE INTEGRAÇÃO COMPLETO FRONTEND + BACKEND (CoC 7e) ---');

// Setup mock browser environment
global.window = {};
global.document = {
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'light'
  },
  getElementById: (id) => ({
    innerHTML: '',
    appendChild: () => {}
  })
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// 1. Carregar scripts na ordem do index.html
require('../data/ficha-oficial-template.js');
require('../data/tabelas.js');
require('../data/pericias.js');
require('../data/ocupacoes.js');
require('../data/armas.js');
require('../regras.js');

// Mock PDFLib
global.PDFLib = {
  PDFDocument: {
    load: async () => ({
      getForm: () => ({
        getFields: () => [],
        getTextField: () => ({ setText: () => {} }),
        getCheckBox: () => ({ check: () => {}, uncheck: () => {} })
      }),
      save: async () => new Uint8Array([1, 2, 3])
    }),
    create: async () => ({
      addPage: () => ({
        drawText: () => {},
        drawLine: () => {},
        drawRectangle: () => {}
      }),
      embedFont: async () => ({
        widthOfTextAtSize: () => 10
      }),
      save: async () => new Uint8Array([1, 2, 3])
    }),
    StandardFonts: { Helvetica: 'Helvetica', HelveticaBold: 'HelveticaBold', TimesRoman: 'TimesRoman' },
    rgb: (r, g, b) => ({ r, g, b })
  }
};
require('../pdf-export.js');

const R = global.window.CoC7e.Regras;
const T = global.window.CoC7e.TABELAS;
const P = global.window.CoC7e.PERICIAS_BASE;
const O = global.window.CoC7e.OCUPACOES;
const A = global.window.CoC7e.ARMAS_LIVRO;
const PDF = global.window.CoC7e.PDFExport;

let erros = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('❌ FALHA: ' + msg);
    erros++;
  } else {
    console.log('✓ ' + msg);
  }
}

// Teste 1: Regras e Cálculos Básicos
assert(typeof R.calcularPVMaximo === 'function', 'calcularPVMaximo existe');
assert(R.calcularPVMaximo(50, 70) === 12, 'calcularPVMaximo(CON=50, TAM=70) == 12');
assert(R.calcularSanidadeInicial(65) === 65, 'calcularSanidadeInicial(POD=65) == 65');
assert(R.calcularSanidadeMaxima(14) === 85, 'calcularSanidadeMaxima(Mythos=14) == 85');
assert(R.calcularPMMaximo(65) === 13, 'calcularPMMaximo(POD=65) == 13');
assert(R.calcularPontosInteressePessoal(70) === 140, 'calcularPontosInteressePessoal(INT=70) == 140');

// Teste 2: Roladores
const rDados = R.rolarDados(3, 6, 0);
assert(rDados.rolagens.length === 3 && rDados.total >= 3 && rDados.total <= 18, 'rolarDados 3d6 dentro dos limites');

const r3d6 = R.rolarAtributo3D6();
assert(r3d6.valor >= 15 && r3d6.valor <= 90 && r3d6.valor % 5 === 0, 'rolarAtributo3D6 gera múltiplo de 5 entre 15 e 90');

const r2d6 = R.rolarAtributo2D6Mais6();
assert(r2d6.valor >= 40 && r2d6.valor <= 90 && r2d6.valor % 5 === 0, 'rolarAtributo2D6Mais6 gera múltiplo de 5 entre 40 e 90');

const rConjunto = R.rolarConjuntoAtributos('padrao');
assert(Object.keys(rConjunto.atributos).length === 8, 'rolarConjuntoAtributos gera 8 atributos');
assert(rConjunto.poolLivre.length === 8, 'poolLivre possui 8 valores');

// Teste 3: Sorte e Idade
const rSorteSimples = R.rolarSorteInicial(false);
assert(rSorteSimples.rolagens.length === 1 && rSorteSimples.valorEscolhido > 0, 'rolarSorteInicial simples funciona');

const rSorteDupla = R.rolarSorteInicial(true);
assert(rSorteDupla.rolagens.length === 2 && rSorteDupla.valorEscolhido >= rSorteDupla.rolagens[0].valor, 'rolarSorteInicial dupla escolhe o maior');

const rEDU = R.executarTestesMelhoriaEDU(60, 2);
assert(rEDU.historico.length === 2 && rEDU.eduFinal >= 60, 'executarTestesMelhoriaEDU executa 2 verificações');

// Teste 4: Antecedentes
const rTabela = R.sortearItemTabela(T.ANTECEDENTES_IDEOLOGIA);
assert(Boolean(rTabela.item), 'sortearItemTabela sorteia item válido: ' + rTabela.item);

// Teste 5: Rolagens D100 com Bônus/Penalidade
const rD100Normal = R.rolar1d100ComBonusPenalidade(0);
assert(rD100Normal.resultadoFinal >= 1 && rD100Normal.resultadoFinal <= 100, 'rolar1d100 normal entre 1 e 100');

const rD100Bonus = R.rolar1d100ComBonusPenalidade(1);
assert(rD100Bonus.dezenasRoladas.length === 2, 'rolar1d100 com +1 bônus rola 2 dezenas');

const rD100Penalidade = R.rolar1d100ComBonusPenalidade(-2);
assert(rD100Penalidade.dezenasRoladas.length === 3, 'rolar1d100 com -2 penalidade rola 3 dezenas');

// Teste 6: Avaliação de Sucesso
const aval = R.avaliarSucesso(15, 60);
assert(aval.sucesso === true && aval.nivel === 'DIFICIL' && aval.classeCss === 'nivel-dificil', 'avaliarSucesso retorna nivel e classeCss');
assert(aval.dificil === 30 && aval.extremo === 12, 'avaliarSucesso retorna dificil e extremo');

// Teste 7: Dano PV e Sanidade
const danoRes = R.aplicarDanoPV(12, 12, 7, false);
assert(danoRes.pvNovo === 5 && danoRes.lesaoGrave === true && danoRes.avisos.length > 0, 'aplicarDanoPV detecta Lesão Grave e gera avisos');

const sanRes = R.aplicarPerdaSanidade(60, 6);
assert(sanRes.sanNova === 54 && sanRes.insanidadeTemporaria === true && sanRes.avisos.length > 0, 'aplicarPerdaSanidade detecta Insanidade Temporária (perda >= 5)');

// Teste 8: Desenvolvimento de Perícia
const devRes = R.executarDesenvolvimentoPericia(40);
assert(typeof devRes.evoluiu === 'boolean' && devRes.rolagem1d100 >= 1 && devRes.rolagem1d100 <= 100, 'executarDesenvolvimentoPericia executa rolagem');

// Teste 9: Exportação de PDF
const mockInv = {
  identidade: { nome: 'Harvey Walters', ocupacao: 'Jornalista', idade: 32, residencia: 'Boston', cidadeNatal: 'Arkham' },
  atributosFinais: { FOR: 50, CON: 60, TAM: 65, DES: 70, APA: 45, INT: 80, POD: 60, EDU: 75 },
  derivados: { pvAtual: 12, pvMax: 12, sanAtual: 60, sanMax: 99, pmAtual: 12, pmMax: 12, sorteAtual: 55, sorteInicial: 55, mov: 8, danoExtra: '0', corpo: 0 },
  pericias: P.slice(0, 10).map(p => ({ id: p.id, nome: p.nome, base: p.padrao, ocupacional: 20, interesse: 0, outros: 0, marcada: false, marcavel: true })),
  armas: [{ nome: 'Revólver .38', periciaNome: 'Armas de Fogo (Pistola)', danoBase: '1D10', alcance: '15m', disparos: '1(3)', municao: 6, defeito: 100 }],
  antecedentes: { ideologiaCrencas: 'Verdade jornalística a todo custo', conexaoChave: 'Ideologia/Crenças' },
  equipamentos: ['Caderno', 'Câmera Kodak'],
  financas: { nivelGastos: 10, dinheiro: 50, patrimonio: 1000 }
};

const mapaAcro = PDF.criarMapaAcroFormOficial(mockInv);
assert(mapaAcro.textosExatos['Nome'] === 'Harvey Walters', 'criarMapaAcroFormOficial mapeia nome corretamente');
assert(mapaAcro.textosExatos['str'] === '50' && mapaAcro.textosExatos['str 1/2'] === '25' && mapaAcro.textosExatos['str 1/5'] === '10', 'criarMapaAcroFormOficial calcula metade e quinto de STR');

console.log('-------------------------------------------------------------');
if (erros === 0) {
  console.log('✅ TODOS OS TESTES DE INTEGRAÇÃO FRONTEND-BACKEND PASSARAM COM SUCESSO!');
} else {
  console.error('❌ TOTAL DE FALHAS: ' + erros);
  process.exit(1);
}
