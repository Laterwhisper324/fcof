/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: pdf-export.js
 *
 * Implementa as duas opções de exportação em PDF solicitadas:
 * (A) Preenchimento do PDF Oficial Editável (`FICHA-EDITAVEL-CHAMADO-DE-CTHULHU.pdf`) usando `pdf-lib`,
 *     com inspeção dos campos AcroForm do formulário PDF + geração direta em 2 páginas via `pdf-lib`.
 * (B) Impressão / Salvar como PDF via `@media print` imitando o layout oficial de 2 páginas (págs. 50-51).
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.PDFExport = (function () {
  'use strict';

  const R = window.CoC7e.Regras;

  /**
   * Inspeciona todos os campos de formulário (AcroForm) de um arquivo PDF ArrayBuffer usando pdf-lib.
   * @param {ArrayBuffer} pdfBytes
   * @returns {Promise<Array<{ name: string, type: string }>>}
   */
  async function inspecionarCamposPDF(pdfBytes) {
    if (!window.PDFLib) {
      throw new Error('Biblioteca pdf-lib não carregada. Verifique sua conexão ou use a impressão nativa.');
    }
    const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    return fields.map((f) => ({
      name: f.getName(),
      type: f.constructor.name
    }));
  }

  /**
   * Constrói um dicionário normalizado de valores do investigador para casar com nomes de campos
   * em português ou inglês da ficha editável oficial (New Order / Chaosium).
   */
  function criarMapaValoresFormulario(inv) {
    const atr = inv.atributosFinais || inv.atributos || {};
    const deriv = inv.derivados || {};
    const financas = R.calcularFinancas1920(obterValorPericia(inv, 'nivel_de_credito'));

    const mapa = {};
    const registrar = (chaves, valor) => {
      chaves.forEach((k) => {
        mapa[normalizarChave(k)] = String(valor ?? '');
      });
    };

    // Identidade
    registrar(['nome', 'name', 'investigator_name', 'investigador', 'nome_do_investigador'], inv.identidade?.nome || '');
    registrar(['jogador', 'player', 'player_name', 'nome_do_jogador'], inv.identidade?.jogador || '');
    registrar(['ocupacao', 'occupation', 'profissao'], inv.ocupacaoNome || '');
    registrar(['idade', 'age'], inv.identidade?.idade || '');
    registrar(['sexo', 'sex', 'genero', 'gender'], inv.identidade?.sexo || '');
    registrar(['residencia', 'residence', 'moradia'], inv.identidade?.residencia || '');
    registrar(['local_nasc', 'local_de_nascimento', 'birthplace', 'nascimento'], inv.identidade?.localNascimento || '');

    // Atributos e suas metades/quintos
    const paresAtributos = [
      { pt: 'for', en: 'str', nome: 'forca' },
      { pt: 'con', en: 'con', nome: 'constituicao' },
      { pt: 'tam', en: 'siz', nome: 'tamanho' },
      { pt: 'des', en: 'dex', nome: 'destreza' },
      { pt: 'apa', en: 'app', nome: 'aparencia' },
      { pt: 'int', en: 'int', nome: 'inteligencia' },
      { pt: 'pod', en: 'pow', nome: 'poder' },
      { pt: 'edu', en: 'edu', nome: 'educacao' }
    ];

    paresAtributos.forEach(({ pt, en, nome }) => {
      const val = atr[pt.toUpperCase()] ?? 50;
      const mq = R.calcularMetadeQuinto(val);
      registrar([pt, en, nome, `${pt}_reg`, `${en}_reg`, `atr_${pt}`], mq.regular);
      registrar([`${pt}_half`, `${pt}_metade`, `${pt}_2`, `${en}_half`, `${en}_2`, `${nome}_metade`], mq.metade);
      registrar([`${pt}_fifth`, `${pt}_quinto`, `${pt}_5`, `${en}_fifth`, `${en}_5`, `${nome}_quinto`], mq.quinto);
    });

    // Derivados
    registrar(['pv', 'hp', 'pv_atual', 'current_hp', 'pontos_de_vida'], deriv.pvAtual ?? deriv.pvMax ?? '');
    registrar(['pv_max', 'max_hp', 'pv_maximo'], deriv.pvMax ?? '');
    registrar(['san', 'sanity', 'san_atual', 'current_san', 'sanidade'], deriv.sanAtual ?? deriv.sanInicial ?? '');
    registrar(['san_inicial', 'starting_san', 'start_san'], deriv.sanInicial ?? '');
    registrar(['san_max', 'max_san', 'san_maxima'], deriv.sanMax ?? '');
    registrar(['pm', 'mp', 'pm_atual', 'current_mp', 'pontos_de_magia'], deriv.pmAtual ?? deriv.pmMax ?? '');
    registrar(['pm_max', 'max_mp', 'pm_maximo'], deriv.pmMax ?? '');
    registrar(['sorte', 'luck', 'sorte_atual', 'starting_luck'], deriv.sorteAtual ?? deriv.sorteInicial ?? '');
    registrar(['mov', 'move', 'movement', 'taxa_de_movimento'], deriv.mov ?? '');
    registrar(['dano_extra', 'damage_bonus', 'db', 'dx', 'bonus_de_dano'], deriv.danoExtra ?? '');
    registrar(['corpo', 'build'], deriv.corpo ?? '');

    // Esquiva em combate
    const esqTotal = obterValorPericia(inv, 'esquivar');
    const esqMQ = R.calcularMetadeQuinto(esqTotal);
    registrar(['esquivar', 'esquiva', 'dodge', 'combat_dodge'], esqMQ.regular);
    registrar(['esquivar_half', 'esquiva_metade', 'dodge_half', 'esquivar_2'], esqMQ.metade);
    registrar(['esquivar_fifth', 'esquiva_quinto', 'dodge_fifth', 'esquivar_5'], esqMQ.quinto);

    // Todas as perícias
    (inv.pericias || []).forEach((p) => {
      const total = Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
      const mq = R.calcularMetadeQuinto(total);
      const chaveId = normalizarChave(p.id);
      const chaveNome = normalizarChave(p.nome);
      registrar([chaveId, chaveNome, `skill_${chaveId}`, `pericia_${chaveId}`], mq.regular);
      registrar([`${chaveId}_half`, `${chaveNome}_half`, `${chaveId}_metade`, `${chaveId}_2`], mq.metade);
      registrar([`${chaveId}_fifth`, `${chaveNome}_fifth`, `${chaveId}_quinto`, `${chaveId}_5`], mq.quinto);
    });

    // Antecedentes e Finanças
    const ant = inv.antecedentes || {};
    registrar(['descricao_pessoal', 'personal_description'], ant.descricaoPessoal || '');
    registrar(['ideologia', 'ideologia_crencas', 'ideology_beliefs'], ant.ideologiaCrencas || '');
    registrar(['pessoas_significativas', 'significant_people'], ant.pessoasSignificativas || '');
    registrar(['locais_importantes', 'meaningful_locations'], ant.locaisImportantes || '');
    registrar(['pertences_queridos', 'treasured_possessions'], ant.pertencesQueridos || '');
    registrar(['caracteristicas', 'traits'], ant.caracteristicas || '');
    registrar(['ferimentos_cicatrizes', 'injuries_scars'], ant.ferimentosCicatrizes || '');
    registrar(['fobias_manias', 'phobias_manias'], ant.fobiasManias || '');
    registrar(['tomos_arcanos', 'arcane_tomes_spells'], ant.tomosFeiticos || '');
    registrar(['encontros_entidades', 'encounters_with_strange_entities'], ant.encontrosEntidades || '');
    registrar(['equipamento', 'gear_possessions', 'equipamentos'], (inv.equipamentos || []).join('\n'));
    registrar(['nivel_de_gastos', 'spending_level'], inv.financasCustom?.nivelGastos || financas.nivelGastosTexto);
    registrar(['dinheiro', 'cash'], inv.financasCustom?.dinheiro || financas.dinheiroTexto);
    registrar(['patrimonio', 'assets'], inv.financasCustom?.patrimonio || financas.patrimonioTexto);

    return mapa;
  }

  function obterValorPericia(inv, id) {
    const p = (inv.pericias || []).find((x) => x.id === id);
    if (!p) return 0;
    return Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
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
   * Preenche um PDF editável (AcroForm) fornecido pelo usuário com os dados do investigador.
   * @param {ArrayBuffer} pdfBytes - Bytes do arquivo PDF original
   * @param {object} investigador - Objeto completo do investigador
   * @returns {Promise<{ bytes: Uint8Array, preenchidos: number, totalCampos: number, logCampos: string[] }>}
   */
  async function preencherPDFEditavel(pdfBytes, investigador) {
    if (!window.PDFLib) {
      throw new Error('Biblioteca pdf-lib não está disponível.');
    }
    const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const mapa = criarMapaValoresFormulario(investigador);

    let preenchidos = 0;
    const logCampos = [];

    fields.forEach((field) => {
      const rawName = field.getName();
      const normName = normalizarChave(rawName);
      logCampos.push(`${rawName} (${field.constructor.name})`);

      if (mapa[normName] !== undefined && typeof field.setText === 'function') {
        try {
          field.setText(String(mapa[normName]));
          preenchidos++;
        } catch (err) {
          // Ignora campos com restrição de fonte/tamanho
        }
      }
    });

    const bytes = await pdfDoc.save();
    return {
      bytes,
      preenchidos,
      totalCampos: fields.length,
      logCampos
    };
  }

  /**
   * Gera um arquivo PDF de 2 páginas completo do zero usando `pdf-lib`
   * (caso o jogador queira baixar um arquivo `.pdf` direto sem precisar do template externo).
   * @param {object} inv - Investigador
   * @returns {Promise<Uint8Array>}
   */
  async function gerarPDFNativoDuasPaginas(inv) {
    if (!window.PDFLib) {
      throw new Error('Biblioteca pdf-lib não carregada.');
    }
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();
    const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const corFundo = rgb(0.96, 0.94, 0.89);
    const corTinta = rgb(0.12, 0.11, 0.09);
    const corDestaque = rgb(0.15, 0.27, 0.21);
    const corLinha = rgb(0.55, 0.48, 0.38);

    // PÁGINA 1: Características, Derivados, Perícias e Combate
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    page1.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: corFundo });

    const drawHeader = (page, subtitulo) => {
      page.drawRectangle({ x: 24, y: 785, width: 547, height: 34, color: corDestaque });
      page.drawText('CHAMADO DE CTHULHU — FICHA DE INVESTIGADOR (ANOS 1920)', {
        x: 34,
        y: 800,
        size: 12,
        font: fontBold,
        color: rgb(0.96, 0.93, 0.85)
      });
      page.drawText(subtitulo, {
        x: 34,
        y: 789,
        size: 8.5,
        font: fontSerif,
        color: rgb(0.85, 0.82, 0.72)
      });
    };

    drawHeader(page1, 'Página 1: Identidade, Características, Atributos Derivados, Perícias e Combate');

    // Bloco Identidade
    let y = 768;
    const id = inv.identidade || {};
    const atr = inv.atributosFinais || inv.atributos || {};
    const deriv = inv.derivados || {};

    page1.drawText(`Nome: ${id.nome || '—'}`, { x: 28, y, size: 10, font: fontBold, color: corTinta });
    page1.drawText(`Jogador(a): ${id.jogador || '—'}`, { x: 240, y, size: 10, font: fontSerif, color: corTinta });
    page1.drawText(`Idade: ${id.idade || '—'}  |  Sexo: ${id.sexo || '—'}`, { x: 420, y, size: 10, font: fontSerif, color: corTinta });
    y -= 15;
    page1.drawText(`Ocupação: ${inv.ocupacaoNome || '—'}`, { x: 28, y, size: 10, font: fontBold, color: corTinta });
    page1.drawText(`Residência: ${id.residencia || '—'}`, { x: 240, y, size: 10, font: fontSerif, color: corTinta });
    page1.drawText(`Nascimento: ${id.localNascimento || '—'}`, { x: 420, y, size: 10, font: fontSerif, color: corTinta });

    y -= 10;
    page1.drawLine({ start: { x: 24, y }, end: { x: 571, y }, thickness: 1, color: corLinha });

    // Características (8 atributos com 1/2 e 1/5)
    y -= 16;
    page1.drawText('CARACTERÍSTICAS (Regular / Difícil ½ / Extremo ⅕)', { x: 28, y, size: 10, font: fontBold, color: corDestaque });
    y -= 16;
    const siglas = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
    siglas.forEach((sigla, idx) => {
      const val = atr[sigla] ?? 50;
      const mq = R.calcularMetadeQuinto(val);
      const colX = 28 + idx * 68;
      page1.drawRectangle({ x: colX, y: y - 22, width: 62, height: 32, borderColor: corLinha, borderWidth: 0.8 });
      page1.drawText(`${sigla}: ${mq.regular}%`, { x: colX + 5, y: y - 4, size: 9.5, font: fontBold, color: corTinta });
      page1.drawText(`½:${mq.metade} | ⅕:${mq.quinto}`, { x: colX + 5, y: y - 17, size: 8, font: fontSerif, color: corTinta });
    });

    // Derivados
    y -= 40;
    page1.drawText(
      `PV: ${deriv.pvAtual ?? deriv.pvMax}/${deriv.pvMax}   |   Sanidade: ${deriv.sanAtual ?? deriv.sanInicial}/${deriv.sanMax} (Inic. ${deriv.sanInicial})   |   Magia (PM): ${deriv.pmAtual ?? deriv.pmMax}/${deriv.pmMax}   |   Sorte: ${deriv.sorteAtual ?? deriv.sorteInicial}%   |   MOV: ${deriv.mov}   |   Dano Extra: ${deriv.danoExtra}   |   Corpo: ${deriv.corpo}`,
      { x: 28, y, size: 9, font: fontBold, color: corTinta }
    );
    y -= 10;
    page1.drawLine({ start: { x: 24, y }, end: { x: 571, y }, thickness: 1, color: corLinha });

    // Perícias em 3 colunas
    y -= 15;
    page1.drawText('PERÍCIAS DO INVESTIGADOR — Valor Regular (½ / ⅕)', { x: 28, y, size: 10, font: fontBold, color: corDestaque });
    y -= 14;

    const periciasOrdenadas = [...(inv.pericias || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const porColuna = Math.ceil(periciasOrdenadas.length / 3);
    const startYPericias = y;

    periciasOrdenadas.forEach((p, index) => {
      const col = Math.floor(index / porColuna);
      const row = index % porColuna;
      const px = 28 + col * 182;
      const py = startYPericias - row * 12.5;
      if (py < 150) return;

      const total = Number(p.base || 0) + Number(p.ocupacao || 0) + Number(p.interesse || 0) + Number(p.outros || 0);
      const mq = R.calcularMetadeQuinto(total);
      const marca = p.marcada ? '[X]' : '[ ]';
      const nomeCurto = p.nome.length > 22 ? p.nome.slice(0, 21) + '.' : p.nome;
      page1.drawText(`${marca} ${nomeCurto}`, { x: px, y: py, size: 8, font: total > p.base ? fontBold : fontSerif, color: corTinta });
      page1.drawText(`${mq.regular}% (${mq.metade}/${mq.quinto})`, { x: px + 115, y: py, size: 8, font: fontSerif, color: corTinta });
    });

    // Armas e Combate no rodapé da Página 1
    let yArmas = 135;
    page1.drawLine({ start: { x: 24, y: yArmas + 12 }, end: { x: 571, y: yArmas + 12 }, thickness: 1, color: corLinha });
    page1.drawText('ARMAS E COMBATE (Arma | Regular / Difícil / Extremo | Dano | Alcance | Ataques | Munição | Defeito)', {
      x: 28,
      y: yArmas,
      size: 9.5,
      font: fontBold,
      color: corDestaque
    });
    yArmas -= 14;

    (inv.armas || []).slice(0, 7).forEach((arma) => {
      const perVal = obterValorPericia(inv, arma.periciaId) || 25;
      const mq = R.calcularMetadeQuinto(perVal);
      const danoFmt = R.formatarDanoArma(arma.danoBase, arma.somaDX, deriv.danoExtra);
      const linha = `${arma.nome}  —  ${mq.regular}% / ${mq.metade}% / ${mq.quinto}%  |  Dano: ${danoFmt}  |  Alc: ${arma.alcance}  |  Atq: ${arma.ataques}  |  Mun: ${arma.municao}  |  Def: ${arma.defeito}`;
      page1.drawText(linha.slice(0, 108), { x: 28, y: yArmas, size: 8.5, font: fontSerif, color: corTinta });
      yArmas -= 13;
    });

    // PÁGINA 2: Antecedentes, Equipamento, Dinheiro e Companheiros
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    page2.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: corFundo });
    drawHeader(page2, 'Página 2: Antecedentes, Equipamentos & Pertences, Dinheiro & Recursos, Companheiros');

    let y2 = 764;
    const ant = inv.antecedentes || {};
    const blocosAnt = [
      { titulo: 'Descrição Pessoal', texto: ant.descricaoPessoal },
      { titulo: 'Ideologia / Crenças', texto: ant.ideologiaCrencas },
      { titulo: 'Pessoas Significativas', texto: ant.pessoasSignificativas },
      { titulo: 'Locais Importantes', texto: ant.locaisImportantes },
      { titulo: 'Pertences Queridos', texto: ant.pertencesQueridos },
      { titulo: 'Características', texto: ant.caracteristicas },
      { titulo: 'Ferimentos & Cicatrizes', texto: ant.ferimentosCicatrizes },
      { titulo: 'Fobias & Manias', texto: ant.fobiasManias },
      { titulo: 'Tomos Arcanos, Feitiços & Artefatos', texto: ant.tomosFeiticos },
      { titulo: 'Encontros com Entidades Estranhas', texto: ant.encontrosEntidades }
    ];

    blocosAnt.forEach((b) => {
      if (y2 < 240) return;
      const ehChave = ant.conexaoChave === b.titulo ? ' ★ [CONEXÃO-CHAVE]' : '';
      page2.drawText(`${b.titulo}${ehChave}:`, { x: 28, y: y2, size: 9.5, font: fontBold, color: corDestaque });
      y2 -= 13;
      const txt = (b.texto || '—').replace(/\r?\n/g, ' | ').slice(0, 110);
      page2.drawText(txt, { x: 34, y: y2, size: 9, font: fontSerif, color: corTinta });
      y2 -= 18;
    });

    page2.drawLine({ start: { x: 24, y: y2 + 6 }, end: { x: 571, y: y2 + 6 }, thickness: 1, color: corLinha });
    y2 -= 10;

    // Finanças e Equipamentos
    const fin = R.calcularFinancas1920(obterValorPericia(inv, 'nivel_de_credito'));
    page2.drawText('DINHEIRO & RECURSOS (Década de 1920)', { x: 28, y: y2, size: 10, font: fontBold, color: corDestaque });
    y2 -= 14;
    page2.drawText(
      `Nível de Crédito: ${fin.nivelCredito}% (${fin.padraoVida})   |   Nível de Gastos: ${inv.financasCustom?.nivelGastos || fin.nivelGastosTexto}   |   Dinheiro: ${inv.financasCustom?.dinheiro || fin.dinheiroTexto}   |   Patrimônio: ${inv.financasCustom?.patrimonio || fin.patrimonioTexto}`,
      { x: 28, y: y2, size: 9, font: fontBold, color: corTinta }
    );
    y2 -= 20;

    page2.drawText('EQUIPAMENTO & PERTENCES:', { x: 28, y: y2, size: 10, font: fontBold, color: corDestaque });
    y2 -= 14;
    const eqTexto = (inv.equipamentos || []).join('  •  ') || 'Nenhum equipamento listado.';
    page2.drawText(eqTexto.slice(0, 115), { x: 28, y: y2, size: 9, font: fontSerif, color: corTinta });
    if (eqTexto.length > 115) {
      y2 -= 12;
      page2.drawText(eqTexto.slice(115, 230), { x: 28, y: y2, size: 9, font: fontSerif, color: corTinta });
    }
    y2 -= 22;

    page2.drawText('COMPANHEIROS INVESTIGADORES:', { x: 28, y: y2, size: 10, font: fontBold, color: corDestaque });
    y2 -= 14;
    (inv.companheiros || []).slice(0, 5).forEach((c) => {
      page2.drawText(`• ${c.personagem || 'Investigador'} (Jogador: ${c.jogador || '—'}) — ${c.notas || ''}`, {
        x: 34,
        y: y2,
        size: 8.5,
        font: fontSerif,
        color: corTinta
      });
      y2 -= 12;
    });

    return await pdfDoc.save();
  }

  return {
    inspecionarCamposPDF,
    preencherPDFEditavel,
    gerarPDFNativoDuasPaginas
  };
})();
