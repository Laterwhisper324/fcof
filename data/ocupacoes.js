/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: data/ocupacoes.js
 *
 * Contém todas as ocupações das páginas 40 e 41 do Livro Básico (7ª Edição - New Order Editora),
 * incluindo fórmulas de Pontos de Perícias Ocupacionais, faixa de Nível de Crédito e escolhas.
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.OCUPACOES = [
  {
    id: 'advogado',
    nome: 'Advogado',
    lovecraftiana: false,
    creditoMin: 30,
    creditoMax: 80,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['contabilidade', 'direito', 'psicologia', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 2, rotulo: 'Duas perícias interpessoais (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Outras duas perícias quaisquer' }
    ],
    descricaoLivro: 'Contabilidade, Direito, duas perícias interpessoais (Charme, Lábia, Intimidação ou Persuasão), Psicologia, Usar Bibliotecas, outras duas perícias.'
  },
  {
    id: 'andarilho',
    nome: 'Andarilho',
    lovecraftiana: false,
    creditoMin: 0,
    creditoMax: 5,
    formulaTexto: 'EDU × 2 + (APA × 2, DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'APA', mult: 2 }, { atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['escalar', 'escutar', 'furtividade', 'navegacao', 'saltar'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Outras duas perícias quaisquer' }
    ],
    descricaoLivro: 'Escalar, Escutar, Furtividade, uma perícia interpessoal, Navegação, Saltar, outras duas perícias.'
  },
  {
    id: 'antiquario',
    nome: 'Antiquário',
    lovecraftiana: true,
    creditoMin: 30,
    creditoMax: 70,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'avaliacao', 'encontrar', 'historia', 'lingua_outra', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arte/Ofício (qualquer um), Avaliação, Encontrar, História, uma perícia interpessoal, Outra Língua, Usar Bibliotecas, uma outra perícia qualquer.'
  },
  {
    id: 'artista',
    nome: 'Artista',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 50,
    formulaTexto: 'EDU × 2 + (POD × 2 ou DES × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'POD', mult: 2 }, { atr: 'DES', mult: 2 }] },
    periciasFixas: ['arte_e_oficio', 'encontrar', 'lingua_outra', 'psicologia'],
    escolhas: [
      { tipo: 'lista', qtd: 1, opcoes: ['historia', 'mundo_natural'], rotulo: 'História ou Mundo Natural' },
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Outras duas perícias quaisquer' }
    ],
    descricaoLivro: 'Arte/Ofício (qualquer um), Encontrar, História ou Mundo Natural, uma perícia interpessoal, Outra Língua, Psicologia, outras duas perícias.'
  },
  {
    id: 'atleta',
    nome: 'Atleta',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 70,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['arremessar', 'cavalgar', 'escalar', 'lutar_briga', 'natacao', 'saltar'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arremessar, Cavalgar, Escalar, uma perícia interpessoal, Lutar (Briga), Natação, Saltar, uma outra perícia qualquer.'
  },
  {
    id: 'autor',
    nome: 'Autor',
    lovecraftiana: true,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'historia', 'lingua_nativa', 'lingua_outra', 'psicologia', 'usar_bibliotecas'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Literatura' }],
    escolhas: [
      { tipo: 'lista', qtd: 1, opcoes: ['mundo_natural', 'ocultismo'], rotulo: 'Mundo Natural ou Ocultismo' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arte (Literatura), História, Língua Nativa, Mundo Natural ou Ocultismo, Outra Língua, Psicologia, Usar Bibliotecas, uma outra perícia qualquer.'
  },
  {
    id: 'bibliotecario',
    nome: 'Bibliotecário',
    lovecraftiana: true,
    creditoMin: 9,
    creditoMax: 35,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['contabilidade', 'lingua_nativa', 'lingua_outra', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'qualquer', qtd: 4, rotulo: 'Quatro perícias quaisquer (especialidades pessoais ou tópicos de leitura)' }
    ],
    descricaoLivro: 'Contabilidade, Língua Nativa, Outra Língua, Usar Bibliotecas, outras quatro perícias quaisquer como especialidades pessoais ou tópicos de leitura especializados.'
  },
  {
    id: 'clero',
    nome: 'Clero, Membro do',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 60,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['contabilidade', 'escutar', 'historia', 'lingua_outra', 'psicologia', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Contabilidade, Escutar, História, uma perícia interpessoal, Outra Língua, Psicologia, Usar Bibliotecas, uma outra perícia qualquer.'
  },
  {
    id: 'criminoso',
    nome: 'Criminoso',
    lovecraftiana: false,
    creditoMin: 5,
    creditoMax: 65,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['encontrar', 'furtividade', 'psicologia'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      {
        tipo: 'lista',
        qtd: 4,
        opcoes: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'avaliacao', 'chaveiro', 'consertos_mecanicos', 'disfarce', 'lutar_briga', 'prestidigitacao'],
        rotulo: 'Quatro especialidades entre: Armas de Fogo, Avaliação, Chaveiro, Consertos Mecânicos, Disfarce, Lutar e Prestidigitação'
      }
    ],
    descricaoLivro: 'Encontrar, Furtividade, uma perícia interpessoal, Psicologia, mais quatro especialidades entre: Armas de Fogo, Avaliação, Chaveiro, Consertos Mecânicos, Disfarce, Lutar e Prestidigitação.'
  },
  {
    id: 'detetive_particular',
    nome: 'Detetive Particular',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['arte_e_oficio', 'direito', 'disfarce', 'encontrar', 'psicologia', 'usar_bibliotecas'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Fotografia' }],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer (ex.: Armas de Fogo, Chaveiro)' }
    ],
    descricaoLivro: 'Arte/Ofício (Fotografia), Direito, Disfarce, Encontrar, uma perícia interpessoal, Psicologia, Usar Bibliotecas, uma outra perícia qualquer.'
  },
  {
    id: 'diletante',
    nome: 'Diletante',
    lovecraftiana: true,
    creditoMin: 50,
    creditoMax: 99,
    formulaTexto: 'EDU × 2 + APA × 2',
    formula: { base: { EDU: 2, APA: 2 }, opcoes: [] },
    periciasFixas: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'arte_e_oficio', 'cavalgar', 'lingua_outra'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 3, rotulo: 'Outras três perícias quaisquer' }
    ],
    descricaoLivro: 'Armas de Fogo, Arte/Ofício (qualquer um), Cavalgar, uma perícia interpessoal, Outra Língua, outras três perícias.'
  },
  {
    id: 'engenheiro',
    nome: 'Engenheiro',
    lovecraftiana: false,
    creditoMin: 30,
    creditoMax: 60,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'consertos_eletricos', 'ciencia', 'consertos_mecanicos', 'operar_maquinario', 'usar_bibliotecas'],
    especializacoesSugeridas: [
      { familia: 'Arte e Ofício', valor: 'Desenho Técnico' },
      { familia: 'Ciência', valor: 'Engenharia' },
      { familia: 'Ciência', valor: 'Física' }
    ],
    escolhas: [
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arte/Ofício (Desenho Técnico), Consertos Elétricos, Ciência (Engenharia), Ciência (Física), Consertos Mecânicos, Operar Maquinário Pesado, Usar Bibliotecas, uma outra perícia qualquer.'
  },
  {
    id: 'fanatico',
    nome: 'Fanático',
    lovecraftiana: false,
    creditoMin: 0,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (APA × 2 ou POD × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'APA', mult: 2 }, { atr: 'POD', mult: 2 }] },
    periciasFixas: ['furtividade', 'historia', 'psicologia'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 2, rotulo: 'Duas perícias interpessoais (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 3, rotulo: 'Três outras perícias quaisquer' }
    ],
    descricaoLivro: 'Furtividade, História, duas perícias interpessoais, Psicologia, três outras perícias.'
  },
  {
    id: 'fazendeiro',
    nome: 'Fazendeiro',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['arte_e_oficio', 'consertos_mecanicos', 'dirigir_automoveis', 'mundo_natural', 'operar_maquinario', 'rastrear'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Trabalhos de Fazenda' }],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arte/Ofício (Trabalhos de Fazenda), Consertos Mecânicos, Dirigir Automóveis (ou Carroça), uma perícia interpessoal, Mundo Natural, Operar Maquinário Pesado, Rastrear, uma outra perícia qualquer.'
  },
  {
    id: 'investigador_policia',
    nome: 'Investigador de Polícia',
    lovecraftiana: true,
    creditoMin: 20,
    creditoMax: 50,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'direito', 'escutar', 'psicologia', 'encontrar'],
    escolhas: [
      { tipo: 'lista', qtd: 1, opcoes: ['arte_e_oficio', 'disfarce'], rotulo: 'Arte/Ofício (Atuar) ou Disfarce' },
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Arte/Ofício (Atuar) ou Disfarce, Armas de Fogo, Direito, Escutar, uma perícia interpessoal, Psicologia, Encontrar, uma outra perícia qualquer.'
  },
  {
    // CONFERIR NO LIVRO (pág. 41 vs pág. 50):
    // Na página 41 do PDF brasileiro, a lista de "JORNALISTA" saiu impressa com texto parcialmente repetido de Investigador de Polícia:
    // "Armas de Fogo, Arte/Ofício (Atuar) ou Disfarce, Direito, Encontrar, Escutar, uma perícia interpessoal, Psicologia, uma outra perícia qualquer."
    // Já no exemplo do jornalista Harvey Walters (pág. 50) e no original da 7ª Edição, Jornalista usa:
    // Arte/Ofício (Fotografia), História, Usar Bibliotecas, Língua Nativa, uma perícia interpessoal, Psicologia e duas outras perícias.
    // Incluímos ambas as opções liberadas como ocupacionais para não prejudicar nenhuma mesa!
    id: 'jornalista',
    nome: 'Jornalista',
    lovecraftiana: true,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'historia', 'lingua_nativa', 'psicologia', 'usar_bibliotecas', 'direito', 'encontrar', 'escutar', 'armas_de_fogo_pistolas'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Fotografia' }],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Até duas outras perícias quaisquer' }
    ],
    notaDivergenciaLivro: 'CONFERIR NO LIVRO (pág. 41 vs pág. 50): O texto da pág. 41 da edição brasileira repetiu por erro gráfico parte das perícias de Investigador de Polícia; habilitamos tanto as perícias da pág. 41 quanto as de Harvey Walters (pág. 50: Fotografia, História, Língua Nativa, Usar Bibliotecas, Psicologia).',
    descricaoLivro: 'Arte/Ofício (Fotografia), História, Língua Nativa, Usar Bibliotecas, uma perícia interpessoal, Psicologia e duas outras perícias (mais opções da pág. 41).'
  },
  {
    id: 'medico',
    nome: 'Médico',
    lovecraftiana: true,
    creditoMin: 30,
    creditoMax: 80,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['ciencia', 'medicina', 'lingua_outra', 'primeiros_socorros', 'psicologia'],
    especializacoesSugeridas: [
      { familia: 'Ciência', valor: 'Biologia' },
      { familia: 'Ciência', valor: 'Farmácia' },
      { familia: 'Língua (Outra)', valor: 'Latim' }
    ],
    escolhas: [
      { tipo: 'qualquer', qtd: 2, rotulo: 'Duas outras perícias como especialidades acadêmicas ou pessoais (ex.: Psicanálise)' }
    ],
    descricaoLivro: 'Ciência (Biologia), Ciência (Farmácia), Medicina, Outra Língua (Latim), Primeiros Socorros, Psicologia, duas outras perícias como especialidades acadêmicas ou pessoais.'
  },
  {
    id: 'membro_de_tribo',
    nome: 'Membro de Tribo',
    lovecraftiana: false,
    creditoMin: 0,
    creditoMax: 15,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['encontrar', 'escalar', 'escutar', 'mundo_natural', 'natacao', 'ocultismo', 'sobrevivencia'],
    escolhas: [
      { tipo: 'lista', qtd: 1, opcoes: ['arremessar', 'lutar_briga', 'lutar_lancas'], rotulo: 'Arremessar ou Lutar' }
    ],
    descricaoLivro: 'Arremessar ou Lutar, Encontrar, Escalar, Escutar, Mundo Natural, Natação, Ocultismo, Sobrevivência (qualquer uma).'
  },
  {
    id: 'missionario',
    nome: 'Missionário',
    lovecraftiana: false,
    creditoMin: 0,
    creditoMax: 30,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'consertos_mecanicos', 'medicina', 'mundo_natural', 'primeiros_socorros'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Duas outras perícias quaisquer' }
    ],
    descricaoLivro: 'Arte/Ofício (qualquer um), Consertos Mecânicos, uma perícia interpessoal, Medicina, Mundo Natural, Primeiros Socorros, duas outras perícias.'
  },
  {
    id: 'musico',
    nome: 'Músico',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (DES × 2 ou POD × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'POD', mult: 2 }] },
    periciasFixas: ['arte_e_oficio', 'escutar', 'psicologia'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Instrumento Musical' }],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 4, rotulo: 'Quatro outras perícias quaisquer' }
    ],
    descricaoLivro: 'Arte/Ofício (Instrumento), Escutar, uma perícia interpessoal, Psicologia, quatro outras perícias.'
  },
  {
    id: 'oficial_policia',
    nome: 'Oficial de Polícia',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'direito', 'encontrar', 'lutar_briga', 'primeiros_socorros', 'psicologia'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'lista', qtd: 1, opcoes: ['dirigir_automoveis', 'cavalgar'], rotulo: 'Especialidade pessoal: Dirigir Automóveis ou Cavalgar' }
    ],
    descricaoLivro: 'Armas de Fogo, Direito, Encontrar, uma perícia interpessoal, Lutar (Briga), Primeiros Socorros, Psicologia, e Dirigir Automóveis ou Cavalgar.'
  },
  {
    id: 'oficial_militar',
    nome: 'Oficial Militar',
    lovecraftiana: false,
    creditoMin: 20,
    creditoMax: 70,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'contabilidade', 'navegacao', 'psicologia', 'sobrevivencia'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 2, rotulo: 'Duas perícias interpessoais (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Armas de Fogo, Contabilidade, Navegação, duas perícias interpessoais, Psicologia, Sobrevivência, uma outra perícia qualquer.'
  },
  {
    id: 'parapsicologo',
    nome: 'Parapsicólogo',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['antropologia', 'arte_e_oficio', 'historia', 'usar_bibliotecas', 'ocultismo', 'lingua_outra', 'psicologia'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Fotografia' }],
    escolhas: [
      { tipo: 'qualquer', qtd: 1, rotulo: 'Uma outra perícia qualquer' }
    ],
    descricaoLivro: 'Antropologia, Arte/Ofício (Fotografia), História, Usar Bibliotecas, Ocultismo, Outra Língua, Psicologia, uma outra perícia qualquer.'
  },
  {
    // CONFERIR NO LIVRO (pág. 41):
    // Na página 41 do livro básico em português, o verbete "PILOTO" repetiu por erro de diagramação a lista de perícias de Parapsicólogo:
    // "Antropologia, Arte/Ofício (Fotografa), História, Ocultismo, Outra Língua, Psicologia, Usar Bibliotecas, uma outra perícia qualquer."
    // Já na 7ª Edição original (Chaosium), Piloto possui: Ciência (Astronomia), Consertos Elétricos, Consertos Mecânicos, Navegação, Operar Maquinário Pesado, Pilotar (Aeronave) e duas outras perícias.
    // Liberamos ambos os conjuntos e sinalizamos ao jogador!
    id: 'piloto',
    nome: 'Piloto',
    lovecraftiana: false,
    creditoMin: 20,
    creditoMax: 70,
    formulaTexto: 'EDU × 2 + DES × 2',
    formula: { base: { EDU: 2, DES: 2 }, opcoes: [] },
    periciasFixas: ['pilotar', 'navegacao', 'consertos_mecanicos', 'consertos_eletricos', 'operar_maquinario', 'ciencia', 'antropologia', 'arte_e_oficio', 'historia', 'ocultismo', 'lingua_outra', 'psicologia', 'usar_bibliotecas'],
    especializacoesSugeridas: [
      { familia: 'Pilotar', valor: 'Aeronaves' },
      { familia: 'Ciência', valor: 'Astronomia' }
    ],
    escolhas: [
      { tipo: 'qualquer', qtd: 2, rotulo: 'Até duas outras perícias quaisquer' }
    ],
    notaDivergenciaLivro: 'CONFERIR NO LIVRO (pág. 41): No livro brasileiro impresso/PDF, o texto de Piloto repetiu por falha gráfica as perícias de Parapsicólogo. Habilitamos as perícias reais de Piloto (Pilotar Aeronaves, Navegação, Consertos Elétricos/Mecânicos, Op. Maquinário, Astronomia) além das impressas na pág. 41.',
    descricaoLivro: 'Pilotar (Aeronaves), Navegação, Consertos Elétricos, Consertos Mecânicos, Operar Maquinário Pesado, Ciência (Astronomia) e duas outras perícias (mais opções impressas na pág. 41).'
  },
  {
    id: 'professor',
    nome: 'Professor',
    lovecraftiana: true,
    creditoMin: 20,
    creditoMax: 70,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['lingua_nativa', 'lingua_outra', 'psicologia', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'qualquer', qtd: 4, rotulo: 'Quatro outras perícias como especialidades acadêmicas ou pessoais' }
    ],
    descricaoLivro: 'Língua Nativa, Outra Língua, Psicologia, Usar Bibliotecas, outras quatro perícias como especialidades acadêmicas ou pessoais.'
  },
  {
    id: 'profissional_entretenimento',
    nome: 'Profissional de Entretenimento',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 70,
    formulaTexto: 'EDU × 2 + APA × 2',
    formula: { base: { EDU: 2, APA: 2 }, opcoes: [] },
    periciasFixas: ['arte_e_oficio', 'disfarce', 'escutar', 'psicologia'],
    especializacoesSugeridas: [{ familia: 'Arte e Ofício', valor: 'Atuação' }],
    escolhas: [
      { tipo: 'interpessoal', qtd: 2, rotulo: 'Duas perícias interpessoais (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 2, rotulo: 'Duas outras perícias quaisquer' }
    ],
    descricaoLivro: 'Arte/Ofício (Atuar), Disfarce, Escutar, duas perícias interpessoais, Psicologia, duas outras perícias.'
  },
  {
    id: 'soldado',
    nome: 'Soldado',
    lovecraftiana: false,
    creditoMin: 9,
    creditoMax: 30,
    formulaTexto: 'EDU × 2 + (DES × 2 ou FOR × 2)',
    formula: { base: { EDU: 2 }, opcoes: [{ atr: 'DES', mult: 2 }, { atr: 'FOR', mult: 2 }] },
    periciasFixas: ['armas_de_fogo_pistolas', 'armas_de_fogo_rifles_espingardas', 'esquivar', 'furtividade', 'lutar_briga', 'sobrevivencia'],
    escolhas: [
      { tipo: 'lista', qtd: 1, opcoes: ['escalar', 'natacao'], rotulo: 'Escalar ou Natação' },
      { tipo: 'lista', qtd: 2, opcoes: ['consertos_mecanicos', 'lingua_outra', 'primeiros_socorros'], rotulo: 'Duas entre: Consertos Mecânicos, Outra Língua ou Primeiros Socorros' }
    ],
    descricaoLivro: 'Armas de Fogo, Escalar ou Natação, Esquivar, Furtividade, Lutar, Sobrevivência e duas entre: Consertos Mecânicos, Outra Língua ou Primeiros Socorros.'
  },
  {
    // CONFERIR NO LIVRO (pág. 41): Marcada explícita como [Moderna] no livro básico, mas incluída com flag `moderna: true` para filtro opcional
    id: 'hacker_moderna',
    nome: 'Hacker [Moderna]',
    lovecraftiana: false,
    moderna: true,
    creditoMin: 10,
    creditoMax: 70,
    formulaTexto: 'EDU × 4',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: ['consertos_eletricos', 'encontrar', 'usar_bibliotecas'],
    escolhas: [
      { tipo: 'interpessoal', qtd: 1, rotulo: 'Uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)' },
      { tipo: 'qualquer', qtd: 4, rotulo: 'Outras perícias (Eletrônica, Computadores + 2 à escolha)' }
    ],
    descricaoLivro: '[Moderna] Consertos Elétricos, Eletrônica, Encontrar, uma perícia interpessoal, Usar Computadores, Usar Bibliotecas, duas outras perícias.'
  },
  {
    id: 'personalizada',
    nome: 'Ocupação Personalizada (Regra da pág. 40)',
    lovecraftiana: false,
    personalizada: true,
    creditoMin: 9,
    creditoMax: 50,
    formulaTexto: 'Personalizável (ex.: EDU × 4 ou EDU × 2 + Atributo × 2)',
    formula: { base: { EDU: 4 }, opcoes: [] },
    periciasFixas: [],
    escolhas: [
      { tipo: 'qualquer', qtd: 8, rotulo: 'Escolha até 8 perícias ocupacionais (limite recomendado na pág. 40)' }
    ],
    descricaoLivro: 'Crie uma ocupação própria limitando o número de perícias ocupacionais a 8 e definindo a faixa de Nível de Crédito e a fórmula de pontos com o Guardião.'
  }
];
