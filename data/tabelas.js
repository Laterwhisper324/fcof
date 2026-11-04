/**
 * Chamado de Cthulhu 7ª Edição (Edição Brasileira - Década de 1920)
 * Arquivo: data/tabelas.js
 *
 * Contém todas as tabelas e constantes extraídas do Livro Básico (7ª Edição - New Order Editora):
 * - Geração de Atributos e Conjunto Fixo (págs. 30-31, 47-48)
 * - Modificadores de Idade (págs. 32 e 34)
 * - Tabela 1: Dano Extra e Corpo (págs. 33 e 35)
 * - Tabela II: Dinheiro e Patrimônio - Década de 1920 (págs. 46-47)
 * - Tabelas Aleatórias de Antecedentes (págs. 42-45)
 * - Tabelas VII e VIII: Acessos de Loucura (pág. 418)
 * - Lista de Equipamentos Comuns dos Anos 1920 (págs. 396-398)
 */

window.CoC7e = window.CoC7e || {};

window.CoC7e.TABELAS = {
  // Atributos Principais (págs. 30-31)
  ATRIBUTOS: [
    { sigla: 'FOR', nome: 'Força', formula: '3d6*5', tipoDado: '3D6', dados: 3, soma: 0, mult: 5, minRec: 15, maxCriacao: 90, maxHumano: 99, descricao: 'Poder muscular, capacidade de levantar peso e dano corpo a corpo.' },
    { sigla: 'CON', nome: 'Constituição', formula: '3d6*5', tipoDado: '3D6', dados: 3, soma: 0, mult: 5, minRec: 15, maxCriacao: 90, maxHumano: 99, descricao: 'Saúde, vigor, vitalidade e resistência a doenças, venenos e ferimentos.' },
    { sigla: 'TAM', nome: 'Tamanho', formula: '(2d6+6)*5', tipoDado: '2D6+6', dados: 2, soma: 6, mult: 5, minRec: 40, maxCriacao: 90, maxHumano: 99, descricao: 'Altura e peso combinados. Determina PV, Dano Extra, Corpo e MOV.' },
    { sigla: 'DES', nome: 'Destreza', formula: '3d6*5', tipoDado: '3D6', dados: 3, soma: 0, mult: 5, minRec: 15, maxCriacao: 90, maxHumano: 99, descricao: 'Agilidade, reflexos, velocidade física, Esquiva base e ordem de ação em combate.' },
    { sigla: 'APA', nome: 'Aparência', formula: '3d6*5', tipoDado: '3D6', dados: 3, soma: 0, mult: 5, minRec: 15, maxCriacao: 90, maxHumano: 99, descricao: 'Atratividade física, presença e simpatia pessoal.' },
    { sigla: 'INT', nome: 'Inteligência', formula: '(2d6+6)*5', tipoDado: '2D6+6', dados: 2, soma: 6, mult: 5, minRec: 40, maxCriacao: 90, maxHumano: 99, descricao: 'Capacidade de aprendizado, análise, Testes de Ideia e Pontos de Interesse Pessoal (INT × 2).' },
    { sigla: 'POD', nome: 'Poder', formula: '3d6*5', tipoDado: '3D6', dados: 3, soma: 0, mult: 5, minRec: 15, maxCriacao: 90, maxHumano: 100, descricao: 'Força de vontade, aptidão mágica, Sanidade inicial (igual ao POD) e Pontos de Magia (POD / 5).' },
    { sigla: 'EDU', nome: 'Educação', formula: '(2d6+6)*5', tipoDado: '2D6+6', dados: 2, soma: 6, mult: 5, minRec: 40, maxCriacao: 90, maxHumano: 99, descricao: 'Conhecimento formal e factual, Testes de Saber, base de Língua Nativa e Pontos de Ocupação.' }
  ],

  // Opção 5: Método do Tiro Rápido - Conjunto Fixo de Atributos (pág. 48)
  CONJUNTO_FIXO_ATRIBUTOS: [40, 50, 50, 50, 60, 60, 70, 80],

  // Opção 4: Compra de Pontos de Atributo (pág. 48)
  PONTOS_COMPRA_ATRIBUTOS: 460,

  // Regra Opcional: Limite para Valores Iniciais de Perícia (pág. 48)
  // CONFERIR NO LIVRO (pág. 48): O limite de 75% na criação é uma Regra Opcional ("Se você sentir que perícias muito altas são um problema em seu grupo, simplesmente aplique um limite inicial, algo como 75%").
  LIMITE_INICIAL_PERICIA_PADRAO: 75,
  LIMITE_MAXIMO_PERICIA_CRIACAO: 99,

  // Tabela de Modificadores de Idade (págs. 32 e 34)
  FAIXAS_IDADE: [
    {
      min: 15,
      max: 19,
      rotulo: '15 a 19 anos (Jovem)',
      melhoriasEDU: 0, testesMelhoriaEDU: 0,
      penalidadeEDU: 5,
      penalidadeFisicaTotal: 5,
      atributosPenalidadeFisica: ['FOR', 'TAM'],
      penalidadeAPA: 0,
      penalidadeMOV: 0,
      sorteDupla: true, duplaSorte: true,
      descricao: 'Reduza 5 pontos distribuídos entre FOR e TAM. Reduza 5 pontos de EDU. Jogue duas vezes para a Sorte e use o maior valor.'
    },
    {
      min: 20,
      max: 39,
      rotulo: '20 a 39 anos (Adulto)',
      melhoriasEDU: 1, testesMelhoriaEDU: 1,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 0,
      atributosPenalidadeFisica: [],
      penalidadeAPA: 0,
      penalidadeMOV: 0,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 1 verificação de melhoria para EDU (1d100 > EDU atual adiciona +1d10).'
    },
    {
      min: 40,
      max: 49,
      rotulo: '40 a 49 anos (Meia-idade)',
      melhoriasEDU: 2, testesMelhoriaEDU: 2,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 5,
      atributosPenalidadeFisica: ['FOR', 'CON', 'DES'],
      penalidadeAPA: 5,
      penalidadeMOV: 1,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 2 verificações de melhoria para EDU. Reduza 5 pontos distribuídos entre FOR, CON e DES. Reduza APA em 5 e MOV em 1.'
    },
    {
      min: 50,
      max: 59,
      rotulo: '50 a 59 anos',
      melhoriasEDU: 3, testesMelhoriaEDU: 3,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 10,
      atributosPenalidadeFisica: ['FOR', 'CON', 'DES'],
      penalidadeAPA: 10,
      penalidadeMOV: 2,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 3 verificações de melhoria para EDU. Reduza 10 pontos distribuídos entre FOR, CON e DES. Reduza APA em 10 e MOV em 2.'
    },
    {
      min: 60,
      max: 69,
      rotulo: '60 a 69 anos',
      melhoriasEDU: 4, testesMelhoriaEDU: 4,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 20,
      atributosPenalidadeFisica: ['FOR', 'CON', 'DES'],
      penalidadeAPA: 15,
      penalidadeMOV: 3,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 4 verificações de melhoria para EDU. Reduza 20 pontos distribuídos entre FOR, CON e DES. Reduza APA em 15 e MOV em 3.'
    },
    {
      min: 70,
      max: 79,
      rotulo: '70 a 79 anos',
      melhoriasEDU: 4, testesMelhoriaEDU: 4,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 40,
      atributosPenalidadeFisica: ['FOR', 'CON', 'DES'],
      penalidadeAPA: 20,
      penalidadeMOV: 4,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 4 verificações de melhoria para EDU. Reduza 40 pontos distribuídos entre FOR, CON e DES. Reduza APA em 20 e MOV em 4.'
    },
    {
      min: 80,
      max: 90,
      rotulo: '80 a 90 anos',
      melhoriasEDU: 4, testesMelhoriaEDU: 4,
      penalidadeEDU: 0,
      penalidadeFisicaTotal: 80,
      atributosPenalidadeFisica: ['FOR', 'CON', 'DES'],
      penalidadeAPA: 25,
      penalidadeMOV: 5,
      sorteDupla: false, duplaSorte: false,
      descricao: 'Faça 4 verificações de melhoria para EDU. Reduza 80 pontos distribuídos entre FOR, CON e DES. Reduza APA em 25 e MOV em 5.'
    }
  ],

  // Tabela 1: Dano Extra e Corpo (págs. 33 e 35)
  DANO_EXTRA_CORPO: [
    { min: 2, max: 64, danoExtra: '-2', corpo: -2 },
    { min: 65, max: 84, danoExtra: '-1', corpo: -1 },
    { min: 85, max: 124, danoExtra: 'Nenhum', corpo: 0 },
    { min: 125, max: 164, danoExtra: '+1D4', corpo: 1 },
    { min: 165, max: 204, danoExtra: '+1D6', corpo: 2 },
    { min: 205, max: 284, danoExtra: '+2D6', corpo: 3 },
    { min: 285, max: 364, danoExtra: '+3D6', corpo: 4 },
    { min: 365, max: 444, danoExtra: '+4D6', corpo: 5 },
    { min: 445, max: 524, danoExtra: '+5D6', corpo: 6 }
  ],

  // Tabela II: Dinheiro e Patrimônio - Década de 1920 (págs. 46-47)
  FINANCAS_1920: [
    {
      min: 0,
      max: 0,
      padraoVida: 'Pobretão',
      nivelGastos: 0.5,
      calcularDinheiro: () => 0.5,
      calcularPatrimonio: () => 0,
      acomodacoes: 'Vive na rua.',
      viagem: 'A pé, pegando carona ou clandestino em um trem ou navio.'
    },
    {
      min: 1,
      max: 9,
      padraoVida: 'Pobre',
      nivelGastos: 2,
      calcularDinheiro: (nc) => nc * 1,
      calcularPatrimonio: (nc) => nc * 10,
      acomodacoes: 'Restrito ao aluguel mais barato ou a um albergue sujo. Uma parca refeição por dia.',
      viagem: 'Transporte público do tipo mais barato. Qualquer veículo possuído será barato e não confiável.'
    },
    {
      min: 10,
      max: 49,
      padraoVida: 'Médio',
      nivelGastos: 10,
      calcularDinheiro: (nc) => nc * 2,
      calcularPatrimonio: (nc) => nc * 50,
      acomodacoes: 'Casa ou apartamento comum, alugado ou próprio; três refeições por dia; hotéis de preço moderado.',
      viagem: 'Formas padrão de viagem (trem, ônibus), mas não de primeira classe.'
    },
    {
      min: 50,
      max: 89,
      padraoVida: 'Abastado',
      nivelGastos: 50,
      calcularDinheiro: (nc) => nc * 5,
      calcularPatrimonio: (nc) => nc * 500,
      acomodacoes: 'Residência de tamanho considerável, talvez com ajuda doméstica (mordomo, governanta). Possível casa de campo. Hotéis caros.',
      viagem: 'Primeira classe. Poderia ser proprietário de um automóvel caro ou equivalente.'
    },
    {
      min: 90,
      max: 98,
      padraoVida: 'Rico',
      nivelGastos: 250,
      calcularDinheiro: (nc) => nc * 20,
      calcularPatrimonio: (nc) => nc * 2000,
      acomodacoes: 'Residência de luxo ou propriedade com abundante ajuda doméstica; outras residências no interior/exterior. Melhores hotéis.',
      viagem: 'Primeira classe.'
    },
    {
      min: 99,
      max: 99,
      padraoVida: 'Ricaço',
      nivelGastos: 5000,
      calcularDinheiro: () => 50000,
      calcularPatrimonio: () => 5000000,
      acomodacoes: 'Entre os mais ricos do mundo. Dinheiro realmente não é problema ($5M+ em patrimônio).',
      viagem: 'Qualquer meio de luxo disponível.'
    }
  ],

  // Tabelas Aleatórias de Antecedentes (págs. 42-45)
  ANTECEDENTES: {
    descricaoPessoal: [
      'Grosseiro', 'Bonito', 'Desagradável', 'Simpático', 'Glamoroso', 'Cara de bebê',
      'Esperto', 'Desleixado', 'Chato', 'Sujo', 'Estonteante', 'Reservado',
      'Juvenil', 'Cansado', 'Roliço', 'Robusto', 'Peludo', 'Magro',
      'Elegante', 'Desonesto', 'Atarracado', 'Pálido', 'Carrancudo', 'Ordinário',
      'Rosado', 'Bronzeado', 'Enrugado', 'Estufado', 'Tímido', 'Perspicaz',
      'Forte', 'Delicado', 'Musculoso', 'Encorpado', 'Desajeitado', 'Frágil'
    ],
    ideologiaCrencas: [
      '1. Há um poder superior que você venera e para o qual ora (ex.: Jesus Cristo, Vishnu, Haile Selassie I).',
      '2. A humanidade pode viver bem sem religiões (ex.: ateu convicto, humanista, secularista).',
      '3. A ciência tem todas as respostas. Escolha um aspecto particular de interesse (ex.: evolução, criogenia, exploração espacial).',
      '4. Acredita no destino (ex.: carma, sistema de classes, supersticioso).',
      '5. Membro de uma sociedade ou sociedade secreta (ex.: Maçom, Instituto das Mulheres, clube hermético).',
      '6. Há um mal da sociedade que deve ser eliminado (ex.: drogas, violência, racismo).',
      '7. O oculto (ex.: astrologia, espiritualismo, tarô).',
      '8. Política (ex.: conservador, socialista, liberal).',
      '9. "Dinheiro é poder, e vou conseguir tanto quanto puder" (ex.: ganancioso, empreendedor, implacável).',
      '10. Militante/Ativista (ex.: sufrágio/feminismo, direitos iguais, poder sindical).'
    ],
    pessoasSignificativasQuem: [
      '1. Pais (ex.: mãe, pai, madrasta).',
      '2. Avós (ex.: avó materna, avô paterno).',
      '3. Irmão(ã) (ex.: irmão, meio-irmão, irmã de criação).',
      '4. Filho ou filha.',
      '5. Companheiro(a) (ex.: cônjuge, noivo(a), amante).',
      '6. Pessoa que lhe ensinou sua mais alta perícia ocupacional (ex.: professora, tutor, seu pai).',
      '7. Amigo de infância (ex.: colega de classe, vizinho, amigo imaginário).',
      '8. Uma pessoa famosa, seu ídolo ou herói (ex.: estrela de cinema, político, músico).',
      '9. Um colega investigador em seu jogo.',
      '10. Um personagem não-jogador (PNJ) do jogo indicado pelo Guardião.'
    ],
    pessoasSignificativasPorque: [
      '1. Você está em dívida para com eles (ex.: ajudaram financeiramente, protegeram em momentos difíceis, arranjaram o primeiro emprego).',
      '2. Eles te ensinaram algo (ex.: uma perícia, a amar, a ter coragem).',
      '3. Eles dão significado à sua vida (ex.: você aspira ser como eles, procura estar com eles, deseja fazê-los felizes).',
      '4. Você os prejudicou e busca a reconciliação (ex.: roubou dinheiro deles, informou a polícia, recusou ajuda quando precisavam).',
      '5. Vivência compartilhada (ex.: viveram momentos difíceis juntos, cresceram juntos, serviram juntos na Grande Guerra).',
      '6. Você procura se provar para eles (ex.: conseguindo um bom trabalho, um bom cônjuge, entrando na universidade).',
      '7. Você os idolatra (ex.: por sua fama, por sua beleza, por seu trabalho).',
      '8. Um sentimento de arrependimento (ex.: deveria ter morrido em seu lugar, arrependeu-se do que disse, não ajudou quando pôde).',
      '9. Você quer provar que é melhor do que eles. Qual o defeito deles? (ex.: preguiçoso, bêbado, desamoroso).',
      '10. Eles o traíram e você busca vingança (ex.: culpa-os pela morte de um ente querido, ruína financeira ou ruptura conjugal).'
    ],
    locaisImportantes: [
      '1. Seu lugar de aprendizagem (ex.: escola, universidade, tutelagem).',
      '2. Sua cidade natal (ex.: vila rural, cidade mercantil, cidade grande).',
      '3. O lugar em que você conheceu seu primeiro amor (ex.: concerto de música, viagem de férias, abrigo).',
      '4. Um lugar para contemplação silenciosa (ex.: biblioteca, caminhadas na propriedade no interior, pescaria).',
      '5. Um lugar para se socializar (ex.: clube de cavalheiros, speakeasy/bar local, casa do tio).',
      '6. Um lugar relacionado com a sua ideologia/crença (ex.: igreja paroquial, Meca, Stonehenge).',
      '7. O túmulo de uma pessoa significativa (ex.: pai ou mãe, um filho, um amante).',
      '8. A casa de sua família (ex.: propriedade rural, apartamento alugado, orfanato onde foi criado).',
      '9. O lugar onde você foi mais feliz em sua vida (ex.: banco do parque do primeiro beijo, sua universidade).',
      '10. Seu local de trabalho (ex.: escritório, biblioteca, banco).'
    ],
    pertencesQueridos: [
      '1. Um item conectado com sua perícia mais alta (ex.: terno caro, identidade falsa, soqueira de bronze).',
      '2. Um item essencial para a sua ocupação (ex.: maleta de médico, carro, gazuas).',
      '3. Uma lembrança de sua infância (ex.: quadrinhos, canivete, moeda da sorte).',
      '4. Uma lembrança de uma pessoa que partiu (ex.: joias, fotografia na carteira, uma carta).',
      '5. Algo que lhe foi dado por sua Pessoa Significativa (ex.: um anel, um diário, um mapa).',
      '6. Sua coleção (ex.: passagens, selos, discos de música).',
      '7. Algo que você encontrou, mas não sabe o que é — você procura respostas (ex.: carta em idioma desconhecido, tubo curioso, esfera prateada).',
      '8. Um item esportivo (ex.: bastão de críquete, bola de beisebol autografada, vara de pesca).',
      '9. Uma arma (ex.: revólver de serviço, antigo rifle de caça, faca escondida na bota).',
      '10. Um animal de estimação (ex.: um cão, um gato, um cágado).'
    ],
    caracteristicas: [
      '1. Generoso (ex.: generoso com gorjetas, sempre ajuda uma pessoa necessitada, filantropo).',
      '2. Bom com Animais (ex.: ama gatos, cresceu em uma fazenda, bom com cavalos).',
      '3. Sonhador (ex.: viaja para o mundo da lua, visionário, altamente criativo).',
      '4. Hedonista (ex.: vida e alma das festas, bêbado divertido, "viva rápido e morra jovem").',
      '5. Apostador e amante do perigo (ex.: jogador de pôquer, experimenta de tudo, vive no limite).',
      '6. Bom Cozinheiro (ex.: assa bolos maravilhosos, faz uma refeição com quase nada, paladar refinado).',
      '7. Galanteador(a) (ex.: voz charmosa, olhos encantadores, cortês).',
      '8. Leal (ex.: fica ao lado dos amigos, nunca quebra uma promessa, morreria pelo que acredita).',
      '9. Uma boa reputação (ex.: o melhor orador do país, o mais piedoso dos homens, destemido).',
      '10. Ambicioso (ex.: alcançar um grande objetivo, tornar-se o chefe, ter de tudo).'
    ]
  },

  // Tabela VII: Acessos de Loucura - Tempo Real (pág. 418)
  ACESSOS_LOUCURA_TEMPO_REAL: [
    '1. Amnésia (1D10 rodadas): Sem lembrança dos eventos desde a última vez em que esteve em local seguro.',
    '2. Deficiência Psicossomática (1D10 rodadas): Fica psicossomaticamente cego, surdo ou sem usar um membro.',
    '3. Violência (1D10 rodadas): Explosão descontrolada de violência contra arredores, aliados ou inimigos.',
    '4. Paranoia (1D10 rodadas): Paranoia severa; todos estão tentando pegá-lo e ninguém é confiável.',
    '5. Pessoa Significativa (1D10 rodadas): Confunde alguém na cena com sua Pessoa Significativa e age conforme a relação.',
    '6. Desmaio (1D10 rodadas): Desmaia imediatamente e recobra a consciência após 1D10 rodadas.',
    '7. Fugir em Pânico (1D10 rodadas): Compelido a fugir para o mais longe possível por qualquer meio.',
    '8. Histeria ou Explosão Emocional (1D10 rodadas): Incapacitado rindo, chorando ou gritando descontroladamente.',
    '9. Fobia (1D10 rodadas): Adquire uma nova fobia (Tabela IX) e imagina que a fonte do medo está presente.',
    '10. Mania (1D10 rodadas): Adquire uma nova mania (Tabela X) e busca satisfazê-la imediatamente.'
  ],

  // Equipamentos Clássicos da Década de 1920 (págs. 396-398)
  EQUIPAMENTOS_1920: [
    { nome: 'Caderno de Rascunho e Caneta-Tinteiro', categoria: 'Investigação', preco: '$2,05' },
    { nome: 'Lanterna Elétrica (Tocha) + Baterias', categoria: 'Investigação', preco: '$3,00' },
    { nome: 'Lanterna Furta-Fogo / Querosene', categoria: 'Investigação', preco: '$1,68' },
    { nome: 'Câmera Kodak Dobrável No. 1 + Filme (24 exp.)', categoria: 'Investigação', preco: '$4,67' },
    { nome: 'Binóculos Simples (3x a 6x)', categoria: 'Investigação', preco: '$8,50' },
    { nome: 'Lupa de Bolso', categoria: 'Investigação', preco: '$1,68' },
    { nome: 'Bússola de Bolso', categoria: 'Investigação', preco: '$3,25' },
    { nome: 'Relógio de Bolso de Ouro', categoria: 'Pessoal', preco: '$35,10' },
    { nome: 'Relógio de Pulso', categoria: 'Pessoal', preco: '$5,95' },
    { nome: 'Valise Médica', categoria: 'Médico', preco: '$10,45' },
    { nome: 'Ataduras de Gaze e Álcool (Primeiros Socorros)', categoria: 'Médico', preco: '$0,89' },
    { nome: 'Pé-de-cabra', categoria: 'Ferramentas', preco: '$2,25' },
    { nome: 'Corda (15 metros)', categoria: 'Ferramentas', preco: '$8,60' },
    { nome: 'Caixa de Ferramentas (20 peças)', categoria: 'Ferramentas', preco: '$14,90' },
    { nome: 'Algemas + Chave Extra', categoria: 'Investigação', preco: '$3,63' },
    { nome: 'Apito de Polícia', categoria: 'Investigação', preco: '$0,30' },
    { nome: 'Máquina de Escrever Remington', categoria: 'Investigação', preco: '$40,00' },
    { nome: 'Dicionário Completo', categoria: 'Investigação', preco: '$6,75' },
    { nome: 'Terno de Casimira / Vestido de Tafetá', categoria: 'Vestuário', preco: '$18,50 / $10,95' },
    { nome: 'Sobretudo Chesterfield e Fedora de Feltro', categoria: 'Vestuário', preco: '$24,90' },
    { nome: 'Automóvel Ford Modelo T (1920s)', categoria: 'Veículos', preco: '$360,00' },
    { nome: 'Automóvel Buick 1917 (Usado)', categoria: 'Veículos', preco: '$75,00' }
  ]
};


// Aliases diretos para app.js e templates do Wizard / Ficha Viva
window.CoC7e.TABELAS.ANTECEDENTES_IDEOLOGIA = window.CoC7e.TABELAS.ANTECEDENTES.ideologiaCrencas;
window.CoC7e.TABELAS.ANTECEDENTES_PESSOAS_QUEM = window.CoC7e.TABELAS.ANTECEDENTES.pessoasSignificativasQuem;
window.CoC7e.TABELAS.ANTECEDENTES_PESSOAS_PORQUE = window.CoC7e.TABELAS.ANTECEDENTES.pessoasSignificativasPorque;
window.CoC7e.TABELAS.ANTECEDENTES_LOCAIS = window.CoC7e.TABELAS.ANTECEDENTES.locaisImportantes;
window.CoC7e.TABELAS.ANTECEDENTES_PERTENCES = window.CoC7e.TABELAS.ANTECEDENTES.pertencesQueridos;
window.CoC7e.TABELAS.ANTECEDENTES_CARACTERISTICAS = window.CoC7e.TABELAS.ANTECEDENTES.caracteristicas;
