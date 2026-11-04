/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: data/pericias.js
 *
 * Contém todas as perícias da Ficha de Investigador dos Anos 1920 (pág. 50)
 * e do Capítulo 4: Perícias (págs. 56-79 do Livro Básico).
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.PERICIAS_BASE = [
  {
    id: 'antropologia',
    nome: 'Antropologia',
    base: 1,
    categoria: 'Acadêmica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'armas_de_fogo_pistolas',
    nome: 'Armas de Fogo (Pistolas)',
     familia: 'Armas de Fogo',
    subtipo: 'Pistolas',
    base: 20,
    categoria: 'Combate',
    especializavel: false,
    combate: true,
    marcavel: true
  },
  {
    id: 'armas_de_fogo_rifles_espingardas',
    nome: 'Armas de Fogo (Rifles/Espingardas)',
    familia: 'Armas de Fogo',
    subtipo: 'Rifles/Espingardas',
    base: 25,
    categoria: 'Combate',
    especializavel: false,
    combate: true,
    marcavel: true
  },
  {
    id: 'arqueologia',
    nome: 'Arqueologia',
    base: 1,
    categoria: 'Acadêmica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'arremessar',
    nome: 'Arremessar',
    base: 20,
    categoria: 'Combate / Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'arte_e_oficio',
    nome: 'Arte e Ofício',
    base: 5,
    categoria: 'Técnica / Artística',
    especializavel: true,
    familia: 'Arte e Ofício',
    opcoesSugeridas: [
      'Atuação', 'Belas Artes', 'Caligrafia', 'Carpintaria', 'Cozinheiro',
      'Dança', 'Desenho Técnico', 'Escritor (Literatura)', 'Escultor',
      'Falsificação', 'Fotografia', 'Instrumento Musical', 'Trabalhos de Fazenda'
    ],
    marcavel: true
  },
  {
    id: 'avaliacao',
    nome: 'Avaliação',
    base: 5,
    categoria: 'Percepção / Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'cavalgar',
    nome: 'Cavalgar',
    base: 5,
    categoria: 'Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'charme',
    nome: 'Charme',
    base: 15,
    categoria: 'Interpessoal',
    interpessoal: true,
    especializavel: false,
    marcavel: true
  },
  {
    id: 'chaveiro',
    nome: 'Chaveiro',
    base: 1,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'ciencia',
    nome: 'Ciência',
    base: 1,
    categoria: 'Acadêmica',
    especializavel: true,
    familia: 'Ciência',
    opcoesSugeridas: [
      'Astronomia', 'Biologia', 'Botânica', 'Ciência Forense', 'Criptografia',
      'Engenharia', 'Farmácia', 'Física', 'Geologia', 'Matemática',
      'Meteorologia', 'Química', 'Zoologia'
    ],
    marcavel: true
  },
  {
    id: 'consertos_eletricos',
    nome: 'Consertos Elétricos',
    base: 10,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'consertos_mecanicos',
    nome: 'Consertos Mecânicos',
    base: 10,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'contabilidade',
    nome: 'Contabilidade',
    base: 5,
    categoria: 'Acadêmica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'direito',
    nome: 'Direito',
    base: 5,
    categoria: 'Acadêmica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'dirigir_automoveis',
    nome: 'Dirigir Automóveis',
    base: 20,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'disfarce',
    nome: 'Disfarce',
    base: 5,
    categoria: 'Interpessoal / Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'encontrar',
    nome: 'Encontrar',
    base: 25,
    categoria: 'Percepção',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'escalar',
    nome: 'Escalar',
    base: 20,
    categoria: 'Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'escutar',
    nome: 'Escutar',
    base: 20,
    categoria: 'Percepção',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'esquivar',
    nome: 'Esquivar',
    base: 'METADE_DES',
    formulaBase: 'DES / 2',
    categoria: 'Combate / Física',
    especializavel: false,
    combate: true,
    marcavel: true
  },
  {
    id: 'furtividade',
    nome: 'Furtividade',
    base: 20,
    categoria: 'Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'historia',
    nome: 'História',
    base: 5,
    categoria: 'Acadêmica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'intimidacao',
    nome: 'Intimidação',
    base: 15,
    categoria: 'Interpessoal',
    interpessoal: true,
    especializavel: false,
    marcavel: true
  },
  {
    id: 'labia',
    nome: 'Lábia',
    base: 5,
    categoria: 'Interpessoal',
    interpessoal: true,
    especializavel: false,
    marcavel: true
  },
  {
    id: 'lingua_nativa',
    nome: 'Língua (Nativa)',
    base: 'EDU',
    formulaBase: 'EDU',
    categoria: 'Acadêmica / Idioma',
    especializavel: false,
    permiteRotuloCustom: true,
    rotuloPadrao: 'Inglês / Português',
    marcavel: true
  },
  {
    id: 'lingua_outra',
    nome: 'Língua (Outra)',
    base: 1,
    categoria: 'Acadêmica / Idioma',
    especializavel: true,
    familia: 'Língua (Outra)',
    opcoesSugeridas: [
      'Latim', 'Francês', 'Alemão', 'Espanhol', 'Italiano',
      'Grego Antigo', 'Árabe', 'Mandarim / Cantonês', 'Russo', 'Egípcio Hieroglífico'
    ],
    marcavel: true
  },
  {
    id: 'lutar_briga',
    nome: 'Lutar (Briga)',
    familia: 'Lutar',
    subtipo: 'Briga',
    base: 25,
    categoria: 'Combate',
    especializavel: false,
    combate: true,
    marcavel: true
  },
  {
    id: 'medicina',
    nome: 'Medicina',
    base: 1,
    categoria: 'Acadêmica / Saúde',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'mundo_natural',
    nome: 'Mundo Natural',
    base: 10,
    categoria: 'Percepção / Conhecimento',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'mythos_de_cthulhu',
    nome: 'Mythos de Cthulhu',
    base: 0,
    categoria: 'Arcana',
    especializavel: false,
    bloqueadaNaCriacao: true,
    marcavel: false // Página 70 e 94: Mythos de Cthulhu nunca é marcada nem recebe pontos iniciais
  },
  {
    // CONFERIR NO LIVRO (pág. 50 vs págs. 56 e 71):
    // Na Lista de Perícias (pág. 56) e descrição de Natação (pág. 71), o valor base é 20%.
    // Porém, na Ficha de Investigador impressa no livro (pág. 50), consta "Natação (10%)".
    // Mantemos 20% como padrão do texto de regras (Cap. 4), com nota visível para ajuste se a mesa usar a ficha impressa (10%).
    id: 'natacao',
    nome: 'Natação',
    base: 20,
    baseAlternativaFicha: 10,
    categoria: 'Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'navegacao',
    nome: 'Navegação',
    base: 10,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'nivel_de_credito',
    nome: 'Nível de Crédito',
    base: 0,
    categoria: 'Social / Finanças',
    especializavel: false,
    semInteressePessoal: false,
    marcavel: false // Página 71 e 94: Nível de Crédito não tem caixa de melhoria
  },
  {
    id: 'ocultismo',
    nome: 'Ocultismo',
    base: 5,
    categoria: 'Acadêmica / Arcana',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'operar_maquinario',
    nome: 'Op. Maquinário Pesado',
    base: 1,
    categoria: 'Técnica',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'persuasao',
    nome: 'Persuasão',
    base: 10,
    categoria: 'Interpessoal',
    interpessoal: true,
    especializavel: false,
    marcavel: true
  },
  {
    id: 'pilotar',
    nome: 'Pilotar',
    base: 1,
    categoria: 'Técnica',
    especializavel: true,
    familia: 'Pilotar',
    opcoesSugeridas: ['Aeronaves', 'Barco', 'Dirigível / Balão'],
    marcavel: true
  },
  {
    id: 'prestidigitacao',
    nome: 'Prestidigitação',
    base: 10,
    categoria: 'Técnica / Furtiva',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'primeiros_socorros',
    nome: 'Primeiros Socorros',
    base: 30,
    categoria: 'Saúde',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'psicanalise',
    nome: 'Psicanálise',
    base: 1,
    categoria: 'Acadêmica / Saúde',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'psicologia',
    nome: 'Psicologia',
    base: 10,
    categoria: 'Percepção / Interpessoal',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'rastrear',
    nome: 'Rastrear',
    base: 10,
    categoria: 'Percepção',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'saltar',
    nome: 'Saltar',
    base: 20,
    categoria: 'Física',
    especializavel: false,
    marcavel: true
  },
  {
    id: 'sobrevivencia',
    nome: 'Sobrevivência',
    base: 10,
    categoria: 'Percepção / Física',
    especializavel: true,
    familia: 'Sobrevivência',
    opcoesSugeridas: ['Floresta / Mata', 'Deserto', 'Ártico / Polar', 'Mar', 'Montanha'],
    marcavel: true
  },
  {
    id: 'usar_bibliotecas',
    nome: 'Usar Bibliotecas',
    base: 20,
    categoria: 'Acadêmica / Investigação',
    especializavel: false,
    marcavel: true
  }
];

// Especializações extras de Combate e Perícias Incomuns do Capítulo 4 (págs. 56-78)
window.CoC7e.ESPECIALIZACOES_EXTRAS = [
  // Armas de Fogo (pág. 57)
  { id: 'armas_de_fogo_arcos', nome: 'Armas de Fogo (Arcos)', familia: 'Armas de Fogo', subtipo: 'Arcos', base: 15, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'armas_de_fogo_pesadas', nome: 'Armas de Fogo (Armas Pesadas)', familia: 'Armas de Fogo', subtipo: 'Armas Pesadas', base: 10, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'armas_de_fogo_lanca_chamas', nome: 'Armas de Fogo (Lança-Chamas)', familia: 'Armas de Fogo', subtipo: 'Lança-Chamas', base: 10, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'armas_de_fogo_metralhadoras', nome: 'Armas de Fogo (Metralhadoras)', familia: 'Armas de Fogo', subtipo: 'Metralhadoras', base: 10, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'armas_de_fogo_submetralhadoras', nome: 'Armas de Fogo (Submetralhadoras)', familia: 'Armas de Fogo', subtipo: 'Submetralhadoras', base: 15, categoria: 'Combate', combate: true, marcavel: true },
  // Lutar (pág. 69)
  { id: 'lutar_chicotes', nome: 'Lutar (Chicotes)', familia: 'Lutar', subtipo: 'Chicotes', base: 5, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_espadas', nome: 'Lutar (Espadas)', familia: 'Lutar', subtipo: 'Espadas', base: 20, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_garrote', nome: 'Lutar (Garrote)', familia: 'Lutar', subtipo: 'Garrote', base: 15, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_lancas', nome: 'Lutar (Lanças)', familia: 'Lutar', subtipo: 'Lanças', base: 20, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_machados', nome: 'Lutar (Machados)', familia: 'Lutar', subtipo: 'Machados', base: 15, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_manguais', nome: 'Lutar (Manguais)', familia: 'Lutar', subtipo: 'Manguais', base: 10, categoria: 'Combate', combate: true, marcavel: true },
  { id: 'lutar_motosserras', nome: 'Lutar (Motosserras)', familia: 'Lutar', subtipo: 'Motosserras', base: 10, categoria: 'Combate', combate: true, marcavel: true },
  // Perícias Incomuns (pág. 56)
  { id: 'artilharia', nome: 'Artilharia [Incomum]', familia: 'Artilharia', base: 1, categoria: 'Incomum', incomum: true, combate: true, marcavel: true },
  { id: 'demolicoes', nome: 'Demolições [Incomum]', familia: 'Demolições', base: 1, categoria: 'Incomum', incomum: true, marcavel: true },
  { id: 'hipnose', nome: 'Hipnose [Incomum]', familia: 'Hipnose', base: 1, categoria: 'Incomum', incomum: true, marcavel: true },
  { id: 'leitura_labial', nome: 'Leitura Labial [Incomum]', familia: 'Leitura Labial', base: 1, categoria: 'Incomum', incomum: true, marcavel: true },
  { id: 'mergulho', nome: 'Mergulho [Incomum]', familia: 'Mergulho', base: 1, categoria: 'Incomum', incomum: true, marcavel: true },
  { id: 'treinar_animais', nome: 'Treinar Animais [Incomum]', familia: 'Treinar Animais', base: 5, categoria: 'Incomum', incomum: true, marcavel: true }
];
