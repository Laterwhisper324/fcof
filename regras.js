/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: regras.js
 *
 * Contém apenas funções puras e testáveis que implementam as regras do Livro Básico:
 * - Metade e Quinto (pág. 32 e 49)
 * - Atributos Derivados: PV, Sanidade, Pontos de Magia, Esquiva Base (págs. 31-35)
 * - Dano Extra (DX) e Corpo (pág. 33)
 * - Taxa de Movimento (MOV) com ajuste de idade (págs. 33-34)
 * - Modificadores de Idade e Verificação de Melhoria de EDU (pág. 32)
 * - Pontos de Perícias Ocupacionais e Interesses Pessoais (págs. 36 e 40-41)
 * - Dinheiro, Patrimônio e Nível de Gastos dos Anos 1920 (págs. 46-47)
 * - Avaliação de Nível de Sucesso e Desastre no 1d100 (págs. 89-91 e 407)
 * - Dados de Bônus e Penalidade (pág. 91)
 * - Gasto de Sorte (pág. 99)
 * - Teste de Sanidade e Insanidade Temporária / Indefinida (págs. 154-156 e 417)
 * - Lesão Grave, Inconsciente e Morrendo (págs. 119-121 e 413)
 * - Fase de Desenvolvimento dos Investigadores (pág. 94)
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.Regras = (function () {
  'use strict';

  /**
   * Calcula os valores Regular (integral), Difícil/Sólido (metade arredondada para baixo)
   * e Extremo (um quinto arredondado para baixo) conforme pág. 32 e Tabela da pág. 49.
   * @param {number} valor - Valor percentual do atributo ou perícia
   * @returns {{ regular: number, metade: number, quinto: number }}
   */
  function calcularMetadeQuinto(valor) {
    const v = Math.max(0, Math.floor(Number(valor) || 0));
    return {
      regular: v,
      metade: Math.floor(v / 2),
      quinto: Math.floor(v / 5)
    };
  }

  /**
   * Calcula os Pontos de Vida máximos: (CON + TAM) / 10 arredondado para baixo (pág. 33).
   * @param {number} con - Constituição
   * @param {number} tam - Tamanho
   * @returns {number}
   */
  function calcularPVMax(con, tam) {
    const c = Math.max(0, Number(con) || 0);
    const t = Math.max(0, Number(tam) || 0);
    return Math.floor((c + t) / 10);
  }

  /**
   * Calcula a Sanidade inicial (igual ao POD) e Sanidade máxima (99 - Mythos de Cthulhu) (págs. 31 e 70).
   * @param {number} pod - Poder
   * @param {number} [mythos=0] - Pontos na perícia Mythos de Cthulhu
   * @returns {{ inicial: number, maxima: number }}
   */
  function calcularSanidade(pod, mythos = 0) {
    const p = Math.max(0, Math.floor(Number(pod) || 0));
    const m = Math.max(0, Math.floor(Number(mythos) || 0));
    const maxima = Math.max(0, 99 - m);
    return {
      inicial: Math.min(p, maxima),
      maxima: maxima
    };
  }

  /**
   * Calcula os Pontos de Magia máximos: um quinto do POD arredondado para baixo (pág. 31).
   * @param {number} pod - Poder
   * @returns {number}
   */
  function calcularPontosMagiaMax(pod) {
    const p = Math.max(0, Number(pod) || 0);
    return Math.floor(p / 5);
  }

  /**
   * Calcula a Esquiva base: metade da DES arredondada para baixo (pág. 50 e 66).
   * @param {number} des - Destreza
   * @returns {number}
   */
  function calcularEsquivaBase(des) {
    const d = Math.max(0, Number(des) || 0);
    return Math.floor(d / 2);
  }

  /**
   * Calcula Dano Extra (DX / BD) e Corpo a partir de FOR + TAM (Tabela 1, pág. 33).
   * Acima de 524, adiciona +1D6 ao Dano Extra e +1 de Corpo para cada 80 pontos ou fração.
   * @param {number} forca - Força
   * @param {number} tam - Tamanho
   * @returns {{ soma: number, danoExtra: string, corpo: number }}
   */
  function calcularDanoExtraECorpo(forca, tam) {
    const f = Math.max(0, Number(forca) || 0);
    const t = Math.max(0, Number(tam) || 0);
    const soma = f + t;

    if (soma <= 64) return { soma, danoExtra: '-2', corpo: -2 };
    if (soma <= 84) return { soma, danoExtra: '-1', corpo: -1 };
    if (soma <= 124) return { soma, danoExtra: 'Nenhum', corpo: 0 };
    if (soma <= 164) return { soma, danoExtra: '+1D4', corpo: 1 };
    if (soma <= 204) return { soma, danoExtra: '+1D6', corpo: 2 };
    if (soma <= 284) return { soma, danoExtra: '+2D6', corpo: 3 };
    if (soma <= 364) return { soma, danoExtra: '+3D6', corpo: 4 };
    if (soma <= 444) return { soma, danoExtra: '+4D6', corpo: 5 };
    if (soma <= 524) return { soma, danoExtra: '+5D6', corpo: 6 };

    const excedente = soma - 524;
    const passosExtras = Math.ceil(excedente / 80);
    const dadosD6 = 5 + passosExtras;
    const corpo = 6 + passosExtras;
    return { soma, danoExtra: `+${dadosD6}D6`, corpo };
  }

  /**
   * Obtém a regra da faixa etária para a idade informada (págs. 32 e 34).
   * @param {number} idade - Idade do investigador (padrão 15 a 90)
   * @returns {object}
   */
  function obterRegraIdade(idade) {
    const id = Math.floor(Number(idade) || 25);
    const faixas = window.CoC7e.TABELAS.FAIXAS_IDADE;
    for (let i = 0; i < faixas.length; i++) {
      if (id >= faixas[i].min && id <= faixas[i].max) {
        return faixas[i];
      }
    }
    if (id < 15) return faixas[0];
    return faixas[faixas.length - 1];
  }

  /**
   * Calcula a Taxa de Movimento (MOV) considerando FOR, DES, TAM e a idade (págs. 33-34).
   * - FOR < TAM e DES < TAM: MOV base = 7
   * - FOR >= TAM ou DES >= TAM (ou todos iguais): MOV base = 8
   * - FOR > TAM e DES > TAM: MOV base = 9
   * Penalidade por década a partir dos 40 anos: 40s (-1), 50s (-2), 60s (-3), 70s (-4), 80s+ (-5).
   * @param {number} forca - Força (após ajustes de idade)
   * @param {number} des - Destreza (após ajustes de idade)
   * @param {number} tam - Tamanho (após ajustes de idade)
   * @param {number} idade - Idade em anos
   * @returns {{ movBase: number, penalidadeIdade: number, movFinal: number }}
   */
  function calcularMOV(forca, des, tam, idade) {
    const f = Number(forca) || 0;
    const d = Number(des) || 0;
    const t = Number(tam) || 0;

    let movBase = 8;
    if (f < t && d < t) {
      movBase = 7;
    } else if (f > t && d > t) {
      movBase = 9;
    } else {
      movBase = 8;
    }

    const regraIdade = obterRegraIdade(idade);
    const penalidadeIdade = regraIdade ? regraIdade.penalidadeMOV : 0;
    const movFinal = Math.max(0, movBase - penalidadeIdade);

    return {
      movBase,
      penalidadeIdade,
      movFinal
    };
  }

  /**
   * Resolve uma única verificação de melhoria de EDU (pág. 32).
   * Se a rolagem de 1D100 for estritamente maior que a EDU atual, soma 1D10 (máximo 99).
   * @param {number} eduAtual - Valor de EDU antes da verificação
   * @param {number} rolagemD100 - Resultado do 1D100 (1 a 100)
   * @param {number} rolagemD10 - Resultado do 1D10 (1 a 10) caso passe
   * @returns {{ eduAnterior: number, rolagemD100: number, melhorou: boolean, ganho: number, eduNova: number }}
   */
  function resolverMelhoriaEDU(eduAtual, rolagemD100, rolagemD10) {
    const atual = Math.min(99, Math.max(0, Math.floor(Number(eduAtual) || 0)));
    const d100 = Math.floor(Number(rolagemD100) || 1);
    const d10 = Math.floor(Number(rolagemD10) || 0);
    const melhorou = d100 > atual;
    const ganhoEfetivo = melhorou ? Math.min(99 - atual, Math.max(1, d10)) : 0;
    return {
      eduAnterior: atual,
      rolagemD100: d100,
      melhorou,
      ganho: ganhoEfetivo,
      eduNova: atual + ganhoEfetivo
    };
  }

  /**
   * Calcula os Pontos de Perícias Ocupacionais de acordo com a fórmula da ocupação (págs. 40-41).
   * Se a ocupação permitir escolher entre atributos secundários (ex.: DES × 2 ou FOR × 2),
   * usa o `atributoEscolhido` ou seleciona automaticamente o atributo de maior valor do investigador.
   * @param {object} ocupacao - Objeto da ocupação de `data/ocupacoes.js`
   * @param {object} atributos - Mapa `{ FOR, CON, TAM, DES, APA, INT, POD, EDU }`
   * @param {string} [atributoEscolhido] - Sigla do atributo escolhido pelo jogador nas opções
   * @returns {{ total: number, atributoOpcaoUsado: string|null, detalhamento: string }}
   */
  function calcularPontosOcupacao(ocupacao, atributos, atributoEscolhido) {
    if (!ocupacao || !ocupacao.formula) {
      const edu = Number(atributos?.EDU) || 0;
      return { total: edu * 4, atributoOpcaoUsado: null, detalhamento: `EDU (${edu}) × 4 = ${edu * 4}` };
    }

    let total = 0;
    const partes = [];
    const baseMap = ocupacao.formula.base || {};

    Object.keys(baseMap).forEach((atr) => {
      const mult = baseMap[atr];
      const val = Number(atributos?.[atr]) || 0;
      const subtotal = val * mult;
      total += subtotal;
      partes.push(`${atr} (${val}) × ${mult}`);
    });

    let atributoOpcaoUsado = null;
    const opcoes = ocupacao.formula.opcoes || [];
    if (opcoes.length > 0) {
      let escolhida = opcoes.find((o) => o.atr === atributoEscolhido);
      if (!escolhida) {
        // Escolhe automaticamente a que gera mais pontos
        escolhida = opcoes.reduce((melhor, atual) => {
          const vMelhor = (Number(atributos?.[melhor.atr]) || 0) * melhor.mult;
          const vAtual = (Number(atributos?.[atual.atr]) || 0) * atual.mult;
          return vAtual > vMelhor ? atual : melhor;
        }, opcoes[0]);
      }
      atributoOpcaoUsado = escolhida.atr;
      const valOp = Number(atributos?.[escolhida.atr]) || 0;
      const subOp = valOp * escolhida.mult;
      total += subOp;
      partes.push(`${escolhida.atr} (${valOp}) × ${escolhida.mult}`);
    }

    return {
      total,
      atributoOpcaoUsado,
      detalhamento: `${partes.join(' + ')} = ${total}`
    };
  }

  /**
   * Calcula os Pontos de Interesses Pessoais: INT × 2 (pág. 36).
   * @param {number} inteligencia - Atributo INT
   * @returns {number}
   */
  function calcularPontosInteresse(inteligencia) {
    return Math.max(0, Math.floor(Number(inteligencia) || 0)) * 2;
  }

  /**
   * Calcula Nível de Gastos, Dinheiro em Mãos, Patrimônio e Padrão de Vida para a Década de 1920
   * a partir do Nível de Crédito (Tabela II, págs. 46-47).
   * @param {number} nivelCredito - Valor total da perícia Nível de Crédito (0 a 99)
   * @returns {{ nivelCredito: number, padraoVida: string, nivelGastos: number, dinheiro: number, patrimonio: number, nivelGastosTexto: string, dinheiroTexto: string, patrimonioTexto: string, acomodacoes: string, viagem: string }}
   */
  function calcularFinancas1920(nivelCredito) {
    const nc = Math.min(99, Math.max(0, Math.floor(Number(nivelCredito) || 0)));
    const tabela = window.CoC7e.TABELAS.FINANCAS_1920;
    let faixa = tabela[0];
    for (let i = 0; i < tabela.length; i++) {
      if (nc >= tabela[i].min && nc <= tabela[i].max) {
        faixa = tabela[i];
        break;
      }
    }

    const dinheiro = faixa.calcularDinheiro(nc);
    const patrimonio = faixa.calcularPatrimonio(nc);
    const nivelGastos = faixa.nivelGastos;

    const formatarDolar = (v) => {
      if (v === 0) return 'Nenhum ($0)';
      if (nc === 99 && v === 5000000) return '$5.000.000+';
      if (Number.isInteger(v)) {
        return '$' + v.toLocaleString('pt-BR');
      }
      return '$' + v.toFixed(2).replace('.', ',');
    };

    return {
      nivelCredito: nc,
      padraoVida: faixa.padraoVida,
      nivelGastos,
      dinheiro,
      patrimonio,
      nivelGastosTexto: `${faixa.padraoVida} (${formatarDolar(nivelGastos)})`,
      dinheiroTexto: formatarDolar(dinheiro),
      patrimonioTexto: formatarDolar(patrimonio),
      acomodacoes: faixa.acomodacoes,
      viagem: faixa.viagem
    };
  }

  /**
   * Avalia o nível de sucesso de uma rolagem de 1D100 contra um valor de perícia ou atributo (págs. 89-91 e 407).
   * Regras:
   * - 01: Sucesso Crítico
   * - Desastre: 100 é sempre desastre; se o valor necessário para o sucesso for < 50, 96-100 é desastre.
   * - <= quinto (valor / 5): Sucesso Extremo
   * - <= metade (valor / 2): Sucesso Difícil (Sólido)
   * - <= valor: Sucesso Regular
   * - > valor (e não Desastre): Fracasso
   * @param {number} rolagem - Resultado do 1D100 (1 a 100)
   * @param {number} valorAlvo - Valor total da perícia ou atributo
   * @param {string} [dificuldadeExigida='regular'] - 'regular', 'dificil' ou 'extremo' (afeta limiar de desastre conforme pág. 89)
   * @returns {{ codigo: string, rotulo: string, sucesso: boolean, ordem: number, limiteDesastre: number, metade: number, quinto: number }}
   */
  function avaliarSucesso(rolagem, valorAlvo, dificuldadeExigida = 'regular') {
    const r = Math.min(100, Math.max(1, Math.floor(Number(rolagem) || 100)));
    const { regular, metade, quinto } = calcularMetadeQuinto(valorAlvo);

    // Página 89: "Se o resultado necessário para o sucesso do teste for igual ou superior a 50 e o dado cair em 100, um desastre acontece.
    // Se o resultado necessário para o sucesso do teste for inferior a 50 e os dados derem entre 96-100, um desastre acontece."
    let alvoNecessario = regular;
    if (dificuldadeExigida === 'dificil') alvoNecessario = metade;
    if (dificuldadeExigida === 'extremo') alvoNecessario = quinto;

    const limiteDesastre = alvoNecessario >= 50 ? 100 : 96;

    if (r === 1) {
      return { codigo: 'critico', rotulo: 'Sucesso Crítico', sucesso: true, ordem: 5, limiteDesastre, regular, metade, quinto };
    }
    if (r >= limiteDesastre) {
      return { codigo: 'desastre', rotulo: 'Desastre', sucesso: false, ordem: 0, limiteDesastre, regular, metade, quinto };
    }
    if (r <= quinto) {
      return { codigo: 'extremo', rotulo: 'Sucesso Extremo', sucesso: true, ordem: 4, limiteDesastre, regular, metade, quinto };
    }
    if (r <= metade) {
      return { codigo: 'dificil', rotulo: 'Sucesso Difícil (Sólido)', sucesso: true, ordem: 3, limiteDesastre, regular, metade, quinto };
    }
    if (r <= regular) {
      return { codigo: 'regular', rotulo: 'Sucesso Regular', sucesso: true, ordem: 2, limiteDesastre, regular, metade, quinto };
    }
    return { codigo: 'fracasso', rotulo: 'Fracasso', sucesso: false, ordem: 1, limiteDesastre, regular, metade, quinto };
  }

  /**
   * Combina um dado de unidade (0-9) com múltiplos dados de dezena (0-9, representando 00 a 90)
   * aplicando a regra de Dados de Bônus ou Penalidade (pág. 91).
   * Nota: dezena 0 + unidade 0 = 100!
   * @param {number} unidade - Algarismo da unidade (0 a 9)
   * @param {number[]} dezenas - Lista de algarismos das dezenas (cada um de 0 a 9)
   * @param {'normal'|'bonus'|'penalidade'} modo
   * @returns {{ resultadoFinal: number, todosResultados: number[], unidade: number, dezenas: number[] }}
   */
  function combinarDadosD100(unidade, dezenas, modo = 'normal') {
    const u = Math.max(0, Math.min(9, Math.floor(Number(unidade) || 0)));
    const listaDezenas = Array.isArray(dezenas) && dezenas.length > 0 ? dezenas : [0];

    const todosResultados = listaDezenas.map((d) => {
      const dez = Math.max(0, Math.min(9, Math.floor(Number(d) || 0)));
      const soma = dez * 10 + u;
      return soma === 0 ? 100 : soma;
    });

    let resultadoFinal = todosResultados[0];
    if (modo === 'bonus') {
      resultadoFinal = Math.min(...todosResultados);
    } else if (modo === 'penalidade') {
      resultadoFinal = Math.max(...todosResultados);
    }

    return {
      resultadoFinal,
      todosResultados,
      unidade: u,
      dezenas: listaDezenas
    };
  }

  /**
   * Calcula quantos pontos de Sorte são necessários para melhorar uma rolagem (pág. 99).
   * Restrições da pág. 99:
   * - Não pode gastar Sorte em Crítico (01), Desastre ou Defeito de Arma de Fogo.
   * - Não pode gastar Sorte em Testes de Sorte, Testes de Sanidade, Jogadas de Dano ou Testes Forçados.
   * @param {number} rolagem - Resultado obtido no 1D100
   * @param {number} valorAlvo - Valor da perícia/atributo
   * @param {number} sorteAtual - Pontos de Sorte atuais do investigador
   * @param {object} [opcoes={}] - `{ testeForcado, ehSanidade, ehSorte, defeitoArma }`
   * @returns {{ permitido: boolean, motivoBloqueio: string|null, opcoesGasto: Array<{ nivel: string, rotulo: string, alvo: number, custo: number, possivel: boolean }> }}
   */
  function calcularOpcoesGastoSorte(rolagem, valorAlvo, sorteAtual, opcoes = {}) {
    const avaliacao = avaliarSucesso(rolagem, valorAlvo);
    if (opcoes.ehSanidade) {
      return { permitido: false, motivoBloqueio: 'Pontos de Sorte não podem ser gastos em Testes de Sanidade (pág. 99).', opcoesGasto: [] };
    }
    if (opcoes.ehSorte) {
      return { permitido: false, motivoBloqueio: 'Pontos de Sorte não podem ser gastos em Testes de Sorte (pág. 99).', opcoesGasto: [] };
    }
    if (opcoes.testeForcado) {
      return { permitido: false, motivoBloqueio: 'Pontos de Sorte não podem ser usados para alterar um Teste Forçado (pág. 99).', opcoesGasto: [] };
    }
    if (avaliacao.codigo === 'critico') {
      return { permitido: false, motivoBloqueio: 'A rolagem já é um Sucesso Crítico (01).', opcoesGasto: [] };
    }
    if (avaliacao.codigo === 'desastre') {
      return { permitido: false, motivoBloqueio: 'Desastres não podem ser anulados com pontos de Sorte (pág. 99).', opcoesGasto: [] };
    }
    if (opcoes.defeitoArma && rolagem >= Number(opcoes.defeitoArma)) {
      return { permitido: false, motivoBloqueio: 'Defeitos de armas de fogo não podem ser alterados com Sorte (pág. 99).', opcoesGasto: [] };
    }

    const { regular, metade, quinto } = calcularMetadeQuinto(valorAlvo);
    const s = Math.max(0, Math.floor(Number(sorteAtual) || 0));
    const alvos = [
      { nivel: 'regular', rotulo: 'Sucesso Regular', alvo: regular },
      { nivel: 'dificil', rotulo: 'Sucesso Difícil (Sólido)', alvo: metade },
      { nivel: 'extremo', rotulo: 'Sucesso Extremo', alvo: quinto }
    ];

    const opcoesGasto = [];
    alvos.forEach((item) => {
      if (item.alvo > 0 && rolagem > item.alvo) {
        const custo = rolagem - item.alvo;
        opcoesGasto.push({
          nivel: item.nivel,
          rotulo: item.rotulo,
          alvo: item.alvo,
          custo,
          possivel: s >= custo
        });
      }
    });

    return {
      permitido: opcoesGasto.length > 0,
      motivoBloqueio: opcoesGasto.length === 0 ? 'Nenhum nível de sucesso superior disponível para compra.' : null,
      opcoesGasto
    };
  }

  /**
   * Avalia as consequências de um dano sofrido de um único ferimento (Fluxograma da pág. 413 e págs. 119-121).
   * @param {number} pvAtual - PV antes do dano
   * @param {number} pvMax - PV máximo do investigador
   * @param {number} dano - Dano sofrido de um único golpe
   * @param {boolean} jaTinhaLesaoGrave - Se a caixa Lesão Grave já estava marcada
   * @returns {{ pvNovo: number, lesaoGrave: boolean, inconsciente: boolean, morrendo: boolean, morteInstantanea: boolean, exigeTesteCON: boolean, resumo: string }}
   */
  function aplicarDanoCombate(pvAtual, pvMax, dano, jaTinhaLesaoGrave = false) {
    const atual = Math.max(0, Number(pvAtual) || 0);
    const max = Math.max(1, Number(pvMax) || 1);
    const d = Math.max(0, Math.floor(Number(dano) || 0));
    const pvNovo = Math.max(0, atual - d);

    if (d > max) {
      return {
        pvNovo: 0,
        lesaoGrave: true,
        inconsciente: true,
        morrendo: false,
        morteInstantanea: true,
        exigeTesteCON: false,
        resumo: `Dano (${d}) maior que PV Máximo (${max}): Morte Instantânea!`
      };
    }

    const causouLesaoGraveAgora = d >= Math.ceil(max / 2); // "perda de >= 1/2 do máximo de PVs em um único ataque" (pág. 51 e 120)
    const lesaoGrave = Boolean(jaTinhaLesaoGrave || causouLesaoGraveAgora);
    const chegouAZero = pvNovo === 0;
    const morrendo = chegouAZero && lesaoGrave;
    const inconsciente = chegouAZero;
    const exigeTesteCON = causouLesaoGraveAgora && !chegouAZero;

    let resumo = `Perdeu ${d} PV (PV: ${atual} → ${pvNovo}).`;
    if (morrendo) {
      resumo += ' LESÃO GRAVE + 0 PV: O investigador está MORRENDO e Inconsciente! Requer Primeiros Socorros imediato e teste de CON ao fim da rodada.';
    } else if (chegouAZero) {
      resumo += ' 0 PV sem Lesão Grave: O investigador cai INCONSCIENTE.';
    } else if (causouLesaoGraveAgora) {
      resumo += ' LESÃO GRAVE sofrida! Cai prostrado e deve fazer um Teste de CON para não desmaiar.';
    }

    return {
      pvNovo,
      lesaoGrave,
      inconsciente,
      morrendo,
      morteInstantanea: false,
      exigeTesteCON,
      resumo
    };
  }

  /**
   * Avalia a perda de Sanidade e verifica gatilhos de Insanidade Temporária (perda >= 5 em um teste + sucesso de INT)
   * e Insanidade Indefinida (perda acumulada no dia >= 1/5 da SAN inicial do dia) conforme págs. 154-156 e 417.
   * @param {number} sanAtual - Sanidade antes da perda
   * @param {number} perda - Pontos de Sanidade perdidos neste evento
   * @param {number} perdaDiaAnterior - Pontos de Sanidade já perdidos no mesmo dia antes deste evento
   * @param {number} sanInicioDia - Sanidade que o investigador tinha no começo do dia
   * @returns {{ sanNova: number, perdaDiaTotal: number, limiteIndefinida: number, gatilhoTemporaria: boolean, gatilhoIndefinida: boolean, permanentementeInsano: boolean }}
   */
  function avaliarPerdaSanidade(sanAtual, perda, perdaDiaAnterior = 0, sanInicioDia = sanAtual) {
    const atual = Math.max(0, Math.floor(Number(sanAtual) || 0));
    const p = Math.max(0, Math.floor(Number(perda) || 0));
    const sanNova = Math.max(0, atual - p);
    const perdaDiaTotal = Math.max(0, Math.floor(Number(perdaDiaAnterior) || 0)) + p;
    const inicioDia = Math.max(1, Math.floor(Number(sanInicioDia) || atual || 1));
    const limiteIndefinida = Math.floor(inicioDia / 5);

    const permanentementeInsano = sanNova === 0;
    const gatilhoIndefinida = !permanentementeInsano && limiteIndefinida > 0 && perdaDiaTotal >= limiteIndefinida;
    const gatilhoTemporaria = !permanentementeInsano && !gatilhoIndefinida && p >= 5;

    return {
      sanNova,
      perdaDiaTotal,
      limiteIndefinida,
      gatilhoTemporaria,
      gatilhoIndefinida,
      permanentementeInsano
    };
  }

  /**
   * Resolve uma rolagem da Fase de Desenvolvimento de Investigadores para uma perícia marcada (pág. 94 e 407).
   * Se o resultado no 1D100 for maior que o valor atual da perícia OU > 95 (96-100), aumenta +1D10.
   * Se o aumento fizer a perícia atingir ou cruzar 90% (ex.: < 90 para >= 90), concede +2D6 de Sanidade (pág. 94).
   * @param {number} valorAtual - Valor percentual atual da perícia
   * @param {number} rolagemD100 - Resultado do 1D100 (1 a 100)
   * @param {number} rolagemD10 - Resultado do 1D10 (1 a 10)
   * @returns {{ valorAnterior: number, rolagemD100: number, evoluiu: boolean, ganho: number, valorNovo: number, bonusSanidade2D6: boolean }}
   */
  function resolverDesenvolvimentoPericia(valorAtual, rolagemD100, rolagemD10) {
    const atual = Math.max(0, Math.floor(Number(valorAtual) || 0));
    const d100 = Math.min(100, Math.max(1, Math.floor(Number(rolagemD100) || 1)));
    const d10 = Math.min(10, Math.max(1, Math.floor(Number(rolagemD10) || 1)));

    const evoluiu = d100 > atual || d100 > 95;
    const ganho = evoluiu ? d10 : 0;
    const valorNovo = atual + ganho;
    const bonusSanidade2D6 = evoluiu && atual < 90 && valorNovo >= 90;

    return {
      valorAnterior: atual,
      rolagemD100: d100,
      evoluiu,
      ganho,
      valorNovo,
      bonusSanidade2D6
    };
  }

  /**
   * Formata o dano de uma arma combinando o dano base com o Dano Extra (DX) do investigador (pág. 401 e 405).
   * @param {string} danoBase - Ex.: '1D3', '1D8', '1D4+2'
   * @param {'nenhum'|'completo'|'metade'} somaDX - Como a arma aplica o Dano Extra
   * @param {string} danoExtraInvestigador - Ex.: 'Nenhum', '-1', '+1D4', '+1D6'
   * @returns {string}
   */
  function formatarDanoArma(danoBase, somaDX, danoExtraInvestigador) {
    const base = danoBase || '1D3';
    if (!somaDX || somaDX === 'nenhum') return base;

    const dx = danoExtraInvestigador || 'Nenhum';
    if (dx === 'Nenhum' || dx === '0') {
      return `${base}`;
    }

    if (somaDX === 'metade') {
      return `${base} + ½DX (${dx})`;
    }
    return `${base} ${dx.startsWith('-') ? dx : '+ ' + dx.replace(/^\+/, '')}`;
  }

  return {
    calcularMetadeQuinto,
    calcularPVMax,
    calcularSanidade,
    calcularPontosMagiaMax,
    calcularEsquivaBase,
    calcularDanoExtraECorpo,
    obterRegraIdade,
    calcularMOV,
    resolverMelhoriaEDU,
    calcularPontosOcupacao,
    calcularPontosInteresse,
    calcularFinancas1920,
    avaliarSucesso,
    combinarDadosD100,
    calcularOpcoesGastoSorte,
    aplicarDanoCombate,
    avaliarPerdaSanidade,
    resolverDesenvolvimentoPericia,
    formatarDanoArma
  };
})();
