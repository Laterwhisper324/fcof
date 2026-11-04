/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: pdf-export.js
 *
 * Implementa a exportação completa da ficha do investigador no formato exato do
 * PDF Oficial Editável de 2 páginas (FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf):
 * - Mapeamento 1:1 de todos os 360 campos AcroForm (Página 1 e Página 2, incluindo
 *   características, metades/quintos, vitais, checkboxes de lesão/insanidade,
 *   todas as perícias nas 4 colunas, linhas de especializações extras, armas,
 *   combate e os campos Texto1..Texto39 de antecedentes, equipamentos, finanças e companheiros).
 * - Exportação com 1 clique usando o template oficial embutido (`window.CoC7e.FICHA_OFICIAL_PDF_BASE64`),
 *   funcionando 100% offline mesmo via `file://`, além de aceitar upload de arquivo PDF externo.
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.PDFExport = (function () {
  'use strict';

  const R = window.CoC7e.Regras;

  /**
   * Converte uma string Base64 para Uint8Array.
   * @param {string} base64
   * @returns {Uint8Array}
   */
  function base64ParaUint8Array(base64) {
    const binStr = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Obtém os bytes do template PDF oficial embutido (ou via fetch se necessário).
   * @returns {Promise<Uint8Array>}
   */
  function obterPDFLib() {
    if (typeof window !== 'undefined' && window.PDFLib) return window.PDFLib;
    if (typeof self !== 'undefined' && self.PDFLib) return self.PDFLib;
    if (typeof globalThis !== 'undefined' && globalThis.PDFLib) return globalThis.PDFLib;
    return null;
  }

  function obterCoC7e() {
    if (typeof window !== 'undefined' && window.CoC7e) return window.CoC7e;
    if (typeof self !== 'undefined' && self.CoC7e) return self.CoC7e;
    if (typeof globalThis !== 'undefined' && globalThis.CoC7e) return globalThis.CoC7e;
    return {};
  }

  async function obterBytesTemplateOficial() {
    const coc = obterCoC7e();
    if (coc && coc.FICHA_OFICIAL_PDF_BASE64) {
      return base64ParaUint8Array(coc.FICHA_OFICIAL_PDF_BASE64);
    }
    const caminhos = ['data/ficha-oficial-1920.pdf', '/data/ficha-oficial-1920.pdf', './data/ficha-oficial-1920.pdf'];
    for (const caminho of caminhos) {
      try {
        const resp = await fetch(caminho);
        if (resp && resp.ok) {
          const buf = await resp.arrayBuffer();
          return new Uint8Array(buf);
        }
      } catch (_) {}
    }
    throw new Error('Não foi possível carregar o template da ficha oficial.');
  }

  /**
   * Inspeciona todos os campos de formulário (AcroForm) de um arquivo PDF usando pdf-lib.
   * @param {ArrayBuffer|Uint8Array} pdfBytes
   * @returns {Promise<Array<{ name: string, type: string }>>}
   */
  async function inspecionarCamposPDF(pdfBytes) {
    if (!window.PDFLib) {
      throw new Error('Biblioteca pdf-lib não carregada.');
    }
    const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    return fields.map((f) => ({
      name: f.getName(),
      type: f.constructor.name
    }));
  }

  function calcularTotalPericiaObj(p) {
    if (!p) return 0;
    return Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
  }

  function obterPericiaPorId(inv, id) {
    return (inv.pericias || []).find((x) => x.id === id) || null;
  }

  function obterValorPericia(inv, id) {
    return calcularTotalPericiaObj(obterPericiaPorId(inv, id));
  }

  function obterPericiasDaFamilia(inv, idBase) {
    return (inv.pericias || []).filter((p) => p.id === idBase || p.idBase === idBase);
  }

  function normalizarChave(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Sanitiza caracteres Unicode fora da tabela WinAnsi (CP1252) para evitar erros
   * ao gerar aparências de texto com StandardFonts.Helvetica no pdf-lib.
   * @param {string} str
   * @returns {string}
   */
  function sanitizarTextoWinAnsi(str) {
    return String(str ?? '')
      .replace(/★|☆|⚝/g, '*')
      .replace(/⅕/g, '1/5')
      .replace(/½/g, '1/2')
      .replace(/✓|✔|✅/g, '[X]')
      .replace(/✗|✘|❌/g, '[ ]')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—–]/g, '-')
      .replace(/•/g, '-')
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
  }

  /**
   * Constrói o mapeamento exato de textos e caixas de seleção (checkboxes)
   * para os 360 campos AcroForm de `FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf`.
   * @param {object} inv - Objeto completo do investigador
   * @returns {{ textosExatos: Record<string, string>, textosNormalizados: Record<string, string>, checksExatos: Record<string, boolean> }}
   */
  function criarMapaAcroFormOficial(inv) {
    const id = inv.identidade || {};
    const atr = inv.atributosFinais || inv.atributosBase || {};
    const deriv = inv.derivados || {};
    const ant = inv.antecedentes || {};
    const ncTotal = obterValorPericia(inv, 'nivel_de_credito');
    const financas = R.calcularFinancas1920(ncTotal);

    const textosExatos = {};
    const textosNormalizados = {};
    const checksExatos = {};

    const definirTexto = (nomesCampos, valor) => {
      const lista = Array.isArray(nomesCampos) ? nomesCampos : [nomesCampos];
      const strVal = String(valor ?? '');
      lista.forEach((nome) => {
        textosExatos[nome] = strVal;
        textosNormalizados[normalizarChave(nome)] = strVal;
      });
    };

    const definirCheck = (nomesCampos, marcado) => {
      const lista = Array.isArray(nomesCampos) ? nomesCampos : [nomesCampos];
      lista.forEach((nome) => {
        checksExatos[nome] = Boolean(marcado);
      });
    };

    // =========================================================================
    // PÁGINA 1 — IDENTIDADE (BLOCO "DÉCADA DE 1920")
    // =========================================================================
    definirTexto(['Nome', 'nome', 'investigator_name'], id.nome || '');
    definirTexto(['Jogador (a)', 'Jogador(a)', 'jogador', 'player_name'], id.jogador || '');
    definirTexto(['Ocupação', 'ocupacao', 'occupation'], inv.ocupacaoNome || '');
    definirTexto(['age', 'Idade', 'idade'], id.idade ?? '');
    definirTexto(['Sexo', 'sexo', 'sex'], id.sexo || '');
    definirTexto(['Residência', 'residencia', 'residence'], id.residencia || '');
    definirTexto(['Nascimento', 'nascimento', 'birthplace'], id.localNascimento || '');

    // =========================================================================
    // PÁGINA 1 — CARACTERÍSTICAS (8 ATRIBUTOS + METADE + QUINTO + MOV)
    // =========================================================================
    const mapaAtributos = [
      { sigla: 'FOR', reg: 'str', met: 'str 1/2', qui: 'str 1/5' },
      { sigla: 'CON', reg: 'con', met: 'con Metade', qui: 'con 1/5' },
      { sigla: 'TAM', reg: 'siz', met: 'siz Metade', qui: 'siz 1/5' },
      { sigla: 'DES', reg: 'dex', met: 'dex Metade', qui: 'dex 1/5' },
      { sigla: 'APA', reg: 'app', met: 'app Metade', qui: 'app 1/5' },
      { sigla: 'INT', reg: 'int', met: 'int Metade', qui: 'int 1/5' },
      { sigla: 'POD', reg: 'pow', met: 'pow Metade', qui: 'pow 1/5' },
      { sigla: 'EDU', reg: 'edu', met: 'edu Metade', qui: 'edu 1/5' }
    ];

    mapaAtributos.forEach(({ sigla, reg, met, qui }) => {
      const val = atr[sigla] ?? 50;
      const mq = R.calcularMetadeQuinto(val);
      definirTexto([reg, sigla.toLowerCase()], mq.regular);
      definirTexto([met, `${reg} Metade`, `${reg} 1/2`, `${sigla.toLowerCase()}_half`], mq.metade);
      definirTexto([qui, `${reg} 1/5`, `${sigla.toLowerCase()}_fifth`], mq.quinto);
    });

    const movInfo = R.calcularMOV(atr.FOR, atr.DES, atr.TAM, id.idade || 28);
    definirTexto(['MOV', 'mov', 'movement'], deriv.mov ?? movInfo.movFinal);
    definirCheck('movplus1', movInfo.movBase > 8);
    definirCheck('movminus1', movInfo.movBase < 8 || movInfo.penalidadeIdade > 0);

    // =========================================================================
    // PÁGINA 1 — RECURSOS VITAIS (PV, SANIDADE, MAGIA, SORTE E CHECKBOXES)
    // =========================================================================
    definirTexto(['MaxHP', 'pv_max'], deriv.pvMax ?? '');
    definirTexto(['Sanity_Start', 'san_inicial'], deriv.sanInicial ?? '');
    definirTexto(['Sanity_Max', 'san_max'], deriv.sanMax ?? '');
    definirTexto(['LuckTotal', 'sorte_atual'], deriv.sorteAtual ?? deriv.sorteInicial ?? '');

    // Checkboxes de estado vital na Página 1:
    // Caixa de seleção1 = Lesão Grave | Caixa de seleção2 = Insanidade Temporária | Caixa de seleção3 = Insanidade Indefinida
    definirCheck('Caixa de seleção1', Boolean(deriv.lesaoGrave));
    definirCheck('Caixa de seleção2', Boolean(deriv.insanidadeTemporaria));
    definirCheck('Caixa de seleção3', Boolean(deriv.insanidadeIndefinida));

    // =========================================================================
    // PÁGINA 1 — PERÍCIAS DO INVESTIGADOR (4 COLUNAS)
    // =========================================================================
    const preencherPericiaPDF = (periciaObj, campoReg, campoMet, campoQui, campoChk, campoRotulo, textoRotulo) => {
      if (!periciaObj) return;
      const total = calcularTotalPericiaObj(periciaObj);
      const mq = R.calcularMetadeQuinto(total);
      if (campoReg) definirTexto(campoReg, mq.regular);
      if (campoMet) definirTexto(campoMet, mq.metade);
      if (campoQui) definirTexto(campoQui, mq.quinto);
      if (campoChk) definirCheck(campoChk, Boolean(periciaObj.marcada));
      if (campoRotulo && textoRotulo !== undefined) {
        definirTexto(campoRotulo, textoRotulo);
      }
    };

    // Perícias fixas de linha única
    const periciasDiretas = [
      // Coluna 1
      { id: 'antropologia', reg: 'antropologia', met: 'antropologia1 Metade', qui: 'antropologia1 1/5', chk: 'antropologiachk' },
      { id: 'armas_de_fogo_pistolas', reg: 'pistolas', met: 'pistolasMetade', qui: 'pistolas1/5', chk: 'check armas de fogo pistolas' },
      { id: 'armas_de_fogo_rifles_espingardas', reg: 'rifles', met: 'a1 Metaderifles', qui: 'rifles 1/5', chk: 'check armas de fogo rifles' },
      { id: 'arqueologia', reg: 'arqueologia', met: 'arqueologiaMetade', qui: 'arqueologia1/5', chk: 'check arqueologia' },
      { id: 'arremessar', reg: 'arremessar', met: 'a1 Metadearremessar', qui: 'a1 1/5arremessar', chk: 'check arremessar' },
      { id: 'avaliacao', reg: 'avaliaçãoo', met: 'a1 Metadeavaliação', qui: 'a1 1/5avaliação', chk: 'check avaliação' },
      { id: 'cavalgar', reg: 'cavalgar', met: 'a1 Metadecavalgar', qui: 'a1 1/5cavalgar', chk: 'check cavalgar' },
      { id: 'charme', reg: 'charme', met: 'a1 Metadecharme', qui: 'a1 1/5charme', chk: 'check charme' },
      { id: 'chaveiro', reg: 'chaveiro', met: 'a1 Metadechaveiro', qui: 'a1 1/5chaveiro', chk: 'check chaveiro' },

      // Coluna 2
      { id: 'consertos_eletricos', reg: 'eletricos', met: 'eletricos Metade', qui: 'eletricos 1/5', chk: 'check eletricos' },
      { id: 'consertos_mecanicos', reg: 'mecanicos', met: 'mecanicos Metade', qui: 'mecanicos 1/5', chk: 'check mecanicos' },
      { id: 'contabilidade', reg: 'contabilidade', met: 'contabilidadeMetade', qui: 'contabilidade1/5', chk: 'check contabilidade' },
      { id: 'direito', reg: 'direito', met: 'a1 Metadedireito', qui: 'a1 1/5direito', chk: 'check direito' },
      { id: 'dirigir_automoveis', reg: 'dirigir', met: 'a1 Metadedirigir', qui: 'a1 1/5dirigir', chk: 'check dirigir' },
      { id: 'disfarce', reg: 'disfarce', met: 'a1 Metadedisfarce', qui: 'a1 1/5disfarce', chk: 'check disfarce' },
      { id: 'encontrar', reg: 'encontrar', met: 'a1 Metadeencontrar', qui: 'a1 1/5encontrar', chk: 'check encontrar' },
      { id: 'escutar', reg: 'escutar', met: 'a1 Metadeescutar', qui: 'a1 1/5escutar', chk: 'check escutar' },
      { id: 'escalar', reg: 'escalar', met: 'a1 Metadeescalar', qui: 'a1 1/5escalar', chk: 'check escalar' },
      { id: 'esquivar', reg: 'esquivar', met: 'esquivar metade', qui: 'esquivar quinto', chk: 'check esquivar' },
      { id: 'labia', reg: 'labia', met: 'a1 Metadelabia', qui: 'a1 1/5labia', chk: 'check labia' },
      { id: 'intimidacao', reg: 'intimidacao', met: 'a1 Metadeintimidacao', qui: 'a1 1/5intimidacao', chk: 'check intimidacao' },
      { id: 'historia', reg: 'historia', met: 'a1 Metadehistoria', qui: 'a1 1/5historia', chk: 'check historia' },

      // Coluna 3
      { id: 'furtividade', reg: 'furtividade', met: 'a1 Metadefurtividade', qui: 'a1 1/5furtividade', chk: 'check furtividade' },
      { id: 'lutar_briga', reg: 'lutara', met: 'a1 Metadelutar', qui: 'a1 1/5lutar', chk: 'check lutar' },
      { id: 'medicina', reg: 'medicinaa', met: 'medicinaaa', qui: 'medicinasd', chk: 'check medicina' },
      { id: 'mythos_de_cthulhu', reg: 'mythos', met: 'mythosaa', qui: 'mythosaaa', chk: null },
      { id: 'mundo_natural', reg: 'natural', met: 'naturalqq', qui: 'a1 1/5natural', chk: 'check natural' },
      { id: 'natacao', reg: 'natacaoa', met: 'a1 Metadenatacao', qui: 'a1 1/5natacao', chk: 'check natacao' },
      { id: 'navegacao', reg: 'navegacaoa', met: 'a1 Metadenavegacao', qui: 'a1 1/5navegacao', chk: 'check navegacao' },
      { id: 'nivel_de_credito', reg: 'crédito', met: 'a1 Metadecrédito', qui: 'a1 1/5crédito', chk: null },

      // Coluna 4
      { id: 'ocultismo', reg: 'ocultismoa', met: 'a1 Metadeocultismo', qui: 'a1 1/5ocultismo', chk: 'check ocultismo' },
      { id: 'operar_maquinario', reg: 'maquinario', met: 'a1 Metademaquinario', qui: 'a1 1/5maquinario', chk: 'check maquinario' },
      { id: 'persuasao', reg: 'persuasao', met: 'a1 Metadepersuasao', qui: 'a1 1/5persuasao', chk: 'check persuasao' },
      { id: 'prestidigitacao', reg: 'prestidigitacaoa', met: 'a1 Metadeprestidigitacao', qui: 'a1 1/5prestidigitacao', chk: 'check prestidigitacao' },
      { id: 'primeiros_socorros', reg: 'primeiros socorros', met: 'a1 Metadeprimeiros socorros', qui: 'a1 1/5primeiros socorros', chk: 'check primeiros socorros' },
      { id: 'psicanalise', reg: 'psicanalise', met: 'a1 Metadepsicanalise', qui: 'a1 1/5psicanalise', chk: 'check psicanalise' },
      { id: 'psicologia', reg: 'psicologia', met: 'a1 Metadepsicologia', qui: 'a1 1/5psicologia', chk: 'check psicologia' },
      { id: 'saltar', reg: 'saltar', met: 'a1 Metadesaltar', qui: 'a1 1/5saltar', chk: 'check saltar' },
      { id: 'rastrear', reg: 'rastrear', met: 'a1 Metaderastrear', qui: 'a1 1/5rastrear', chk: 'check rastrear' },
      // Na Coluna 4 (y=262.6), a linha impressa de "Usar Biblioteca (20%)" usa os campos 'abranco14a', 'a1 Metadedbranco2', 'a1 1/5dbranco2', 'check dbranco2'
      { id: 'usar_bibliotecas', reg: 'abranco14a', met: 'a1 Metadedbranco2', qui: 'a1 1/5dbranco2', chk: 'check dbranco2' }
    ];

    periciasDiretas.forEach((m) => {
      const pObj = obterPericiaPorId(inv, m.id);
      preencherPericiaPDF(pObj, m.reg, m.met, m.qui, m.chk);
    });

    // Língua Nativa (com rótulo do idioma em 'LINGUA NATURALL')
    const pLinguaNat = obterPericiaPorId(inv, 'lingua_nativa');
    if (pLinguaNat) {
      preencherPericiaPDF(
        pLinguaNat,
        'lingua natural',
        'a1 Metadelingua natural',
        'a1 1/5lingua natural',
        'check lingua natural',
        'LINGUA NATURALL',
        pLinguaNat.especializacao || 'Inglês / Português'
      );
    }

    // Arte e Ofício (até 4 slots na Coluna 1)
    const slotsArte = [
      { rotulo: 'ARTES OU OFICIOS', reg: 'arte', met: 'a1 Metadearte', qui: 'a1 1/5arte', chk: 'check arte' },
      { rotulo: 'abranco1a', reg: 'abranco', met: 'a1 Metadeabranco', qui: 'a1 1/5abranco', chk: 'check abranco' },
      { rotulo: 'abranco2a', reg: 'a1a1branco', met: 'a1 Metadea1a1branco', qui: 'a1 1/5a1a1branco', chk: 'check a1branco' },
      { rotulo: 'abranco3a', reg: 'abranco3', met: 'a1 Metadeaabranco3', qui: 'a1 1/5aabranco3', chk: 'check a2branco' }
    ];
    const periciasArte = obterPericiasDaFamilia(inv, 'arte_e_oficio');
    periciasArte.slice(0, 4).forEach((p, idx) => {
      const s = slotsArte[idx];
      preencherPericiaPDF(p, s.reg, s.met, s.qui, s.chk, s.rotulo, p.especializacao || '');
    });

    // Ciência (linha principal + 3 slots de especialização no fim da Coluna 1 e topo da Coluna 2)
    const periciasCiencia = obterPericiasDaFamilia(inv, 'ciencia');
    if (periciasCiencia.length > 0) {
      // Preenche a linha principal de Ciência com a primeira ciência
      preencherPericiaPDF(periciasCiencia[0], 'ciencia', 'a1 Metadeciencia', 'a1 1/5ciencia', 'check ciencia');
      const slotsCiencia = [
        { rotulo: 'abranco4', reg: '4branco', met: 'a1 Metade4branco', qui: 'a1 1/54branco', chk: 'check a4branco' },
        { rotulo: 'abranco6', reg: 'abranco6a', met: 'branco1 Metadeabranco6', qui: 'branco1 1/5abranco6', chk: 'check branco1' },
        { rotulo: 'abranco7', reg: 'abranco7a', met: 'branco2 Metadeabranco7a', qui: 'branco2 1/5abranco7a', chk: 'check branco2' }
      ];
      periciasCiencia.slice(0, 3).forEach((p, idx) => {
        const s = slotsCiencia[idx];
        preencherPericiaPDF(p, s.reg, s.met, s.qui, s.chk, s.rotulo, p.especializacao || '');
      });
    }

    // Língua (Outra) (até 4 slots na Coluna 3)
    const slotsLinguaOutra = [
      { rotulo: 'LINGUA OUTRASS', reg: 'lingua outra', met: 'a1 Metadelingua outra', qui: 'a1 1/5lingua outra', chk: 'check lingua outra' },
      { rotulo: 'abranco9', reg: 'abranco9a', met: 'abranco9aa', qui: 'abranco9aa', chk: 'check cbranco1' },
      { rotulo: 'abranco10', reg: 'abranco10a', met: 'abranco10aa', qui: 'abranco10aaa', chk: 'check cbranco2' },
      { rotulo: 'abranco11', reg: 'abranco11a', met: 'abranco11aa', qui: 'abranco11aaa', chk: 'check cbranco3' }
    ];
    const periciasLinguaOutra = obterPericiasDaFamilia(inv, 'lingua_outra');
    periciasLinguaOutra.slice(0, 4).forEach((p, idx) => {
      const s = slotsLinguaOutra[idx];
      preencherPericiaPDF(p, s.reg, s.met, s.qui, s.chk, s.rotulo, p.especializacao || '');
    });

    // Pilotar (linha principal + linha de especialização 'abranco13' na Coluna 4)
    const periciasPilotar = obterPericiasDaFamilia(inv, 'pilotar');
    if (periciasPilotar.length > 0) {
      const p0 = periciasPilotar[0];
      preencherPericiaPDF(p0, 'pilotar', 'a1 Metadepilotar', 'a1 1/5pilotar', 'check pilotar');
      preencherPericiaPDF(p0, 'abranco13a', 'a1 Metadedbranco13aa', 'a1 1/5dbranco13', 'check dbranco1', 'abranco13', p0.especializacao || '');
    }

    // Sobrevivência (com rótulo em 'abranco14' na Coluna 4)
    const periciasSobrev = obterPericiasDaFamilia(inv, 'sobrevivencia');
    if (periciasSobrev.length > 0) {
      const p0 = periciasSobrev[0];
      preencherPericiaPDF(p0, 'sobrevivencia', 'a1 Metadesobrevivencia', 'a1 1/5sobrevivencia', 'check sobrevivencia', 'abranco14', p0.especializacao || '');
    }

    // Especializações extras de Lutar, Armas de Fogo ou Perícias Incomuns nos slots livres da ficha
    const idsPadraoMapeados = new Set([
      ...periciasDiretas.map((x) => x.id),
      'lingua_nativa', 'arte_e_oficio', 'ciencia', 'lingua_outra', 'pilotar', 'sobrevivencia'
    ]);
    const periciasExtrasCustom = (inv.pericias || []).filter(
      (p) => !idsPadraoMapeados.has(p.id) && !idsPadraoMapeados.has(p.idBase)
    );
    const slotsExtrasLivres = [
      { rotulo: 'abranco15', reg: 'abranco15a', met: 'a1 Metadedbranco3', qui: 'a1 1/5dbranco3', chk: 'check dbranco3' },
      { rotulo: 'abranco8', reg: 'abranco8a', met: 'a1 Metadecbranco0a', qui: 'a1 1/5cbranco0a', chk: 'check cbranco0' },
      { rotulo: 'abranco12', reg: 'abranco12a', met: 'abranco12aa', qui: 'abranco12aaa', chk: 'check cbranco4' }
    ];
    periciasExtrasCustom.slice(0, slotsExtrasLivres.length).forEach((p, idx) => {
      const s = slotsExtrasLivres[idx];
      preencherPericiaPDF(p, s.reg, s.met, s.qui, s.chk, s.rotulo, p.nome);
    });

    // =========================================================================
    // PÁGINA 1 — ARMAS E COMBATE
    // =========================================================================
    // Combate: Bônus de Dano, Corpo e Esquiva
    const esqTotal = obterValorPericia(inv, 'esquivar') || R.calcularEsquivaBase(atr.DES);
    const esqMQ = R.calcularMetadeQuinto(esqTotal);
    definirTexto(['DamageBonus', 'dano_extra'], deriv.danoExtra || 'Nenhum');
    definirTexto(['Build', 'corpo'], deriv.corpo ?? 0);
    definirTexto(['Dodge', 'esquiva_combate'], esqMQ.regular);
    definirTexto(['Dodge_Copy_half', 'esquiva_combate_metade'], esqMQ.metade);
    definirTexto(['Dodge_Copy_fifth', 'esquiva_combate_quinto'], esqMQ.quinto);

    // Linha 1 de Armas: Desarmado (impresso na ficha)
    const brigaVal = obterValorPericia(inv, 'lutar_briga') || 25;
    const brigaMQ = R.calcularMetadeQuinto(brigaVal);
    definirTexto('regular1', brigaMQ.regular);
    definirTexto('dificil1', brigaMQ.metade);
    definirTexto('extremo1', brigaMQ.quinto);

    // Armas adicionais (excluindo o Desarmado inicial caso seja o item 0)
    const armasExtras = (inv.armas || []).filter((a, idx) => !(idx === 0 && a.id === 'desarmado'));
    const sufixosArmas = ['12', '13'];
    armasExtras.slice(0, 2).forEach((arma, idx) => {
      const suf = sufixosArmas[idx];
      const perVal = obterValorPericia(inv, arma.periciaId) || 25;
      const mq = R.calcularMetadeQuinto(perVal);
      const danoFmt = R.formatarDanoArma(arma.danoBase, arma.somaDX, deriv.danoExtra);

      definirTexto(`armas${suf}`, arma.nome || '');
      definirTexto(`regular${suf}`, mq.regular);
      definirTexto(`dificil${suf}`, mq.metade);
      definirTexto(`extremo${suf}`, mq.quinto);
      definirTexto(`dano${suf}`, danoFmt);
      definirTexto(`alcance${suf}`, arma.alcance || '-');
      definirTexto(`ataques${suf}`, arma.ataques || '1');
      definirTexto(`munição${suf}`, arma.municao || '-');
      definirTexto(`defeito${suf}`, arma.defeito || '-');
    });

    // =========================================================================
    // PÁGINA 2 — ANTECEDENTES, EQUIPAMENTOS, FINANÇAS E COMPANHEIROS (Texto1..Texto39)
    // =========================================================================
    const formatarAntecedente = (titulo, texto) => {
      const t = (texto || '').trim();
      if (!t) return '';
      return ant.conexaoChave === titulo ? `* [CONEXÃO-CHAVE] ${t}` : t;
    };

    // Antecedentes (10 blocos nas coordenadas exatas de Texto2..Texto11)
    definirTexto(['Texto2', 'descricao_pessoal'], ant.descricaoPessoal || '');
    definirTexto(['Texto3', 'caracteristicas'], ant.caracteristicas || '');
    definirTexto(['Texto6', 'ideologia_crencas'], formatarAntecedente('Ideologia / Crenças', ant.ideologiaCrencas));
    definirTexto(['Texto7', 'ferimentos_cicatrizes'], ant.ferimentosCicatrizes || '');
    definirTexto(['Texto8', 'pessoas_significativas'], formatarAntecedente('Pessoas Significativas', ant.pessoasSignificativas));
    definirTexto(['Texto9', 'fobias_manias'], ant.fobiasManias || '');
    definirTexto(['Texto10', 'locais_importantes'], formatarAntecedente('Locais Importantes', ant.locaisImportantes));
    definirTexto(['Texto11', 'tomos_arcanos'], ant.tomosFeiticos || '');
    definirTexto(['Texto5', 'pertences_queridos'], formatarAntecedente('Pertences Queridos', ant.pertencesQueridos));
    definirTexto(['Texto4', 'encontros_entidades'], ant.encontrosEntidades || '');

    // Equipamento e Pertences (duas colunas na Página 2: Texto1 à esquerda, Texto12 à direita)
    const listaEquip = inv.equipamentos || [];
    const meioEquip = Math.ceil(Math.max(1, listaEquip.length) / 2);
    const col1Equip = listaEquip.slice(0, Math.max(6, meioEquip)).map((item) => `- ${item}`).join('\n');
    const col2Equip = listaEquip.slice(Math.max(6, meioEquip)).map((item) => `- ${item}`).join('\n');
    definirTexto(['Texto1', 'equipamento'], col1Equip);
    definirTexto(['Texto12', 'equipamento_col2'], col2Equip);

    // Dinheiro e Recursos (Texto14 = Nível de Gastos, Texto15 = Dinheiro, Texto13 = Patrimônio)
    definirTexto(['Texto14', 'nivel_de_gastos'], inv.financasCustom?.nivelGastos || financas.nivelGastosTexto);
    definirTexto(['Texto15', 'dinheiro'], inv.financasCustom?.dinheiro || financas.dinheiroTexto);
    const textoPatrimonio = (inv.financasCustom?.patrimonio || financas.patrimonioTexto);
    definirTexto(['Texto13', 'patrimonio'], textoPatrimonio);

    // Companheiros Investigadores (8 blocos ao redor de "Eu" na Página 2: coordenadas verificadas)
    const slotsCompanheiros = [
      { p: 'Texto16', j: 'Texto17', r: 'Texto18' }, // Topo-Esquerda
      { p: 'Texto19', j: 'Texto20', r: 'Texto21' }, // Topo-Centro
      { p: 'Texto22', j: 'Texto23', r: 'Texto24' }, // Topo-Direita
      { p: 'Texto25', j: 'Texto26', r: 'Texto27' }, // Meio-Esquerda
      { p: 'Texto28', j: 'Texto29', r: 'Texto30' }, // Meio-Direita
      { p: 'Texto31', j: 'Texto32', r: 'Texto33' }, // Base-Esquerda
      { p: 'Texto34', j: 'Texto35', r: 'Texto36' }, // Base-Centro
      { p: 'Texto37', j: 'Texto38', r: 'Texto39' }  // Base-Direita
    ];
    (inv.companheiros || []).slice(0, 8).forEach((comp, idx) => {
      const slot = slotsCompanheiros[idx];
      definirTexto(slot.p, comp.personagem || comp.nome || '');
      definirTexto(slot.j, comp.jogador || '');
      definirTexto(slot.r, comp.relacao || comp.notas || '');
    });

    return {
      camposTexto: textosExatos,
      camposCheck: checksExatos,
      textosExatos,
      textosNormalizados,
      checksExatos
    };
  }

  /**
   * Preenche um PDF editável (AcroForm) com todos os dados do investigador.
   * @param {ArrayBuffer|Uint8Array} pdfBytes - Bytes do PDF original
   * @param {object} investigador - Objeto completo do investigador
   * @param {object} [opcoes={}] - `{ achatarCampos: boolean }`
   * @returns {Promise<{ bytes: Uint8Array, preenchidos: number, totalCampos: number, logCampos: string[] }>}
   */
  async function preencherPDFEditavel(pdfBytes, investigador, opcoes = {}) {
    if (!window.PDFLib) {
      throw new Error('Biblioteca pdf-lib não está disponível.');
    }

    const PDFLib = obterPDFLib();
    if (!PDFLib) throw new Error("Biblioteca pdf-lib não está disponível.");
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const { textosExatos, textosNormalizados, checksExatos } = criarMapaAcroFormOficial(investigador);

    let preenchidos = 0;
    const logCampos = [];

    fields.forEach((field) => {
      const rawName = field.getName();
      const normName = normalizarChave(rawName);
      logCampos.push(`${rawName} (${field.constructor.name})`);

      // 1. Campo de Texto (PDFTextField)
      if (typeof field.setText === 'function') {
        const valor = textosExatos[rawName] !== undefined
          ? textosExatos[rawName]
          : textosNormalizados[normName];

        if (valor !== undefined && valor !== '') {
          const textoLimpo = sanitizarTextoWinAnsi(valor);
          try {
            field.setText(textoLimpo);
            field.updateAppearances(fontHelvetica);
            preenchidos++;
          } catch (err) {
            try {
              field.setText(textoLimpo);
              preenchidos++;
            } catch (_) {
              // Ignora caso o widget tenha restrição específica
            }
          }
        }
      }
      // 2. Caixa de Seleção (PDFCheckBox)
      else if (typeof field.check === 'function' && typeof field.uncheck === 'function') {
        if (checksExatos[rawName] !== undefined) {
          try {
            if (checksExatos[rawName]) {
              field.check();
              preenchidos++;
            } else {
              field.uncheck();
            }
          } catch (_) {
            // Ignora botões que não são checkboxes padrão
          }
        }
      }
    });

    // 3. Caso o investigador tenha 4 ou 5 armas (além de Desarmado e das 2 linhas com AcroForm),
    // desenha diretamente nas linhas 4 e 5 da tabela de Armas da Página 1:
    const armasExtras = (investigador.armas || []).filter((a, idx) => !(idx === 0 && a.id === 'desarmado'));
    if (armasExtras.length > 2) {
      const page1 = pdfDoc.getPages()[0];
      const deriv = investigador.derivados || {};
      const coordsYLinhasExtras = [134.0, 119.5];
      armasExtras.slice(2, 4).forEach((arma, idx) => {
        const y = coordsYLinhasExtras[idx];
        const perVal = obterValorPericia(investigador, arma.periciaId) || 25;
        const mq = R.calcularMetadeQuinto(perVal);
        const danoFmt = R.formatarDanoArma(arma.danoBase, arma.somaDX, deriv.danoExtra);
        const cor = rgb(0.1, 0.1, 0.1);

        page1.drawText(String(arma.nome || '').slice(0, 18), { x: 46, y, size: 8, font: fontHelvetica, color: cor });
        page1.drawText(String(mq.regular), { x: 129, y, size: 8.5, font: fontHelvetica, color: cor });
        page1.drawText(String(mq.metade), { x: 168, y, size: 8.5, font: fontHelvetica, color: cor });
        page1.drawText(String(mq.quinto), { x: 207, y, size: 8.5, font: fontHelvetica, color: cor });
        page1.drawText(String(danoFmt).slice(0, 12), { x: 242, y, size: 8, font: fontHelvetica, color: cor });
        page1.drawText(String(arma.alcance || '-').slice(0, 8), { x: 304, y, size: 8, font: fontHelvetica, color: cor });
        page1.drawText(String(arma.ataques || '1').slice(0, 6), { x: 348, y, size: 8, font: fontHelvetica, color: cor });
        page1.drawText(String(arma.municao || '-').slice(0, 6), { x: 388, y, size: 8, font: fontHelvetica, color: cor });
        page1.drawText(String(arma.defeito || '-').slice(0, 6), { x: 427, y, size: 8, font: fontHelvetica, color: cor });
      });
    }

    if (opcoes.achatarCampos) {
      try {
        form.flatten();
      } catch (_) {
        // Caso algum botão de ação como Resetar impeça flatten total, mantém editável
      }
    }

    const bytes = await pdfDoc.save();
    return {
      bytes,
      preenchidos,
      totalCampos: fields.length,
      logCampos
    };
  }

  /**
   * Exporta o investigador diretamente no formato do PDF Oficial anexado
   * usando o template oficial embutido (1 clique, sem precisar enviar arquivo).
   * @param {object} investigador
   * @param {object} [opcoes={}] - `{ achatarCampos: boolean }`
   * @returns {Promise<{ bytes: Uint8Array, preenchidos: number, totalCampos: number }>}
   */
  async function exportarNaFichaOficialAnexada(investigador, opcoes = {}) {
    const templateBytes = await obterBytesTemplateOficial();
    return await preencherPDFEditavel(templateBytes, investigador, opcoes);
  }

  /**
   * Gera um arquivo PDF de 2 páginas resumo leve do zero usando `pdf-lib`.
   * @param {object} inv - Investigador
   * @returns {Promise<Uint8Array>}
   */
  async function gerarPDFNativoDuasPaginas(inv) {
    // Usa o template oficial embutido por padrão caso disponível
    if (window.CoC7e.FICHA_OFICIAL_PDF_BASE64) {
      const res = await exportarNaFichaOficialAnexada(inv);
      return res.bytes;
    }
    throw new Error('Template oficial não carregado.');
  }

  return {
    inspecionarCamposPDF,
    criarMapaAcroFormOficial,
    preencherPDFEditavel,
    exportarNaFichaOficialAnexada,
    gerarPDFNativoDuasPaginas
  };
})();
