/**
 * Ícones e ilustrações vetoriais vintage da Década de 1920
 * para o Arsenal do Investigador (Chamado de Cthulhu 7ª Edição).
 */

export interface ItemIconPreset {
  id: string;
  nome: string;
  svgDataUri: string;
}

const buildSvgDataUri = (innerSvg: string): string => {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${innerSvg}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(raw);
};

export const ITEM_ICON_PRESETS: ItemIconPreset[] = [
  {
    id: 'pistola',
    nome: 'Pistola / Revólver',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <!-- Silhueta da Pistola Anos 1920 -->
      <path d="M22 42 h38 v8 h-4 v12 h-14 v18 h-10 v-22 h-10 z" fill="#202624" />
      <rect x="52" y="38" width="28" height="10" rx="2" fill="#202624" />
      <rect x="74" y="35" width="4" height="4" fill="#202624" />
      <path d="M42 56 a6 6 0 0 1 6 6 h-6 z" fill="#c5a059" />
      <line x1="32" y1="62" x2="40" y2="76" stroke="#c5a059" stroke-width="2" />
    `)
  },
  {
    id: 'espingarda',
    nome: 'Espingarda / Rifle',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <path d="M12 68 l20 -14 l48 -18 l6 -2 v6 l-48 18 l-10 14 z" fill="#5c3818" />
      <rect x="36" y="44" width="52" height="5" transform="rotate(-18 36 44)" fill="#202624" />
      <circle cx="48" cy="54" r="3" fill="#c5a059" />
    `)
  },
  {
    id: 'faca',
    nome: 'Faca / Adaga',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <path d="M24 74 l14 -14 l-6 -6 l-14 14 z" fill="#5c3818" />
      <rect x="34" y="52" width="16" height="4" transform="rotate(45 34 52)" fill="#c5a059" />
      <path d="M42 46 l36 -28 c-4 12 -12 24 -24 32 z" fill="#8c9a94" stroke="#202624" stroke-width="1.5" />
    `)
  },
  {
    id: 'machado',
    nome: 'Machado',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <line x1="26" y1="80" x2="68" y2="24" stroke="#5c3818" stroke-width="8" stroke-linecap="round" />
      <path d="M62 20 c12 -8 24 -2 24 10 c-8 2 -18 2 -24 -2 z" fill="#4a5550" stroke="#202624" stroke-width="2" />
      <path d="M60 22 l-8 8 l-4 -4 l8 -8 z" fill="#202624" />
    `)
  },
  {
    id: 'desarmado',
    nome: 'Desarmado / Punhos',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <circle cx="50" cy="50" r="28" fill="#f4efe6" stroke="#c5a059" stroke-width="2" />
      <path d="M35 55 c0 -10 8 -18 18 -18 c6 0 10 3 13 8 c2 4 1 12 -3 16 l-8 6 h-12 z" fill="#4a3e30" />
      <circle cx="42" cy="46" r="3" fill="#c5a059" />
      <circle cx="50" cy="44" r="3" fill="#c5a059" />
      <circle cx="58" cy="46" r="3" fill="#c5a059" />
    `)
  },
  {
    id: 'corda',
    nome: 'Corda (15 metros)',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <ellipse cx="50" cy="48" rx="26" ry="18" fill="none" stroke="#8a7343" stroke-width="6" stroke-dasharray="6,2" />
      <ellipse cx="50" cy="54" rx="24" ry="16" fill="none" stroke="#a68e58" stroke-width="6" stroke-dasharray="6,2" />
      <ellipse cx="50" cy="60" rx="20" ry="12" fill="none" stroke="#715d34" stroke-width="6" stroke-dasharray="6,2" />
      <line x1="58" y1="58" x2="74" y2="78" stroke="#8a7343" stroke-width="5" stroke-linecap="round" />
    `)
  },
  {
    id: 'gazuas',
    nome: 'Gazuas / Chaves-Mestras',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <line x1="30" y1="78" x2="68" y2="24" stroke="#8a5638" stroke-width="4" stroke-linecap="round" />
      <path d="M68 24 l10 6 l-4 6" fill="none" stroke="#8a5638" stroke-width="3" stroke-linecap="round" />
      <line x1="42" y1="82" x2="74" y2="38" stroke="#485c54" stroke-width="3.5" stroke-linecap="round" />
      <path d="M74 38 l8 -4 l2 5" fill="none" stroke="#485c54" stroke-width="3" stroke-linecap="round" />
    `)
  },
  {
    id: 'manto',
    nome: 'Manto Camuflado / Capa',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <path d="M50 20 c-10 0 -18 10 -16 22 l-14 38 c8 4 42 4 60 0 l-14 -38 c2 -12 -6 -22 -16 -22 z" fill="#3a4a3e" stroke="#232e26" stroke-width="2" />
      <path d="M44 32 c4 4 8 4 12 0 c-2 8 -10 8 -12 0 z" fill="#c5a059" />
    `)
  },
  {
    id: 'lanterna',
    nome: 'Lanterna de Latão',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <path d="M38 18 h24 v6 h-24 z" fill="#8c6a2e" />
      <path d="M42 24 h16 v8 h-16 z" fill="#c5a059" />
      <rect x="34" y="32" width="32" height="38" rx="4" fill="#faf4d8" stroke="#8c6a2e" stroke-width="3" />
      <line x1="50" y1="36" x2="50" y2="66" stroke="#dfbe7b" stroke-width="3" />
      <rect x="30" y="70" width="40" height="10" rx="2" fill="#8c6a2e" />
    `)
  },
  {
    id: 'livro',
    nome: 'Grimório / Livro Oculto',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <rect x="28" y="24" width="44" height="54" rx="3" fill="#4d1b22" stroke="#280c10" stroke-width="2" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="#c5a059" stroke-width="1.8" />
      <polygon points="50,42 53,48 59,48 54,52 56,58 50,54 44,58 46,52 41,48 47,48" fill="#c5a059" />
    `)
  },
  {
    id: 'kit',
    nome: 'Kit de Primeiros Socorros',
    svgDataUri: buildSvgDataUri(`
      <rect width="100" height="100" rx="8" fill="#e4decb" />
      <rect x="22" y="32" width="56" height="42" rx="5" fill="#f4efe6" stroke="#8c2e36" stroke-width="3" />
      <path d="M40 32 v-8 h20 v8" fill="none" stroke="#682228" stroke-width="3" />
      <!-- Cruz Vermelha -->
      <rect x="45" y="42" width="10" height="22" fill="#a42832" />
      <rect x="39" y="48" width="22" height="10" fill="#a42832" />
    `)
  }
];

export function obterIconePadrao(nomeOuCategoria: string): string {
  const t = (nomeOuCategoria || '').toLowerCase();
  if (t.includes('pistola') || t.includes('revólver') || t.includes('revolver') || t.includes('.38') || t.includes('luger') || t.includes('colt')) {
    return ITEM_ICON_PRESETS[0].svgDataUri;
  }
  if (t.includes('espingarda') || t.includes('rifle') || t.includes('calibre') || t.includes('shotgun') || t.includes('winchester')) {
    return ITEM_ICON_PRESETS[1].svgDataUri;
  }
  if (t.includes('faca') || t.includes('adaga') || t.includes('canivete') || t.includes('punhal')) {
    return ITEM_ICON_PRESETS[2].svgDataUri;
  }
  if (t.includes('machado') || t.includes('cutelo')) {
    return ITEM_ICON_PRESETS[3].svgDataUri;
  }
  if (t.includes('corda') || t.includes('laço')) {
    return ITEM_ICON_PRESETS[5].svgDataUri;
  }
  if (t.includes('gazua') || t.includes('chave')) {
    return ITEM_ICON_PRESETS[6].svgDataUri;
  }
  if (t.includes('manto') || t.includes('capa') || t.includes('sobretudo')) {
    return ITEM_ICON_PRESETS[7].svgDataUri;
  }
  if (t.includes('lanterna') || t.includes('tocha') || t.includes('vela')) {
    return ITEM_ICON_PRESETS[8].svgDataUri;
  }
  if (t.includes('livro') || t.includes('tomo') || t.includes('diário') || t.includes('necro')) {
    return ITEM_ICON_PRESETS[9].svgDataUri;
  }
  if (t.includes('médico') || t.includes('socorro') || t.includes('remédio') || t.includes('kit')) {
    return ITEM_ICON_PRESETS[10].svgDataUri;
  }
  if (t.includes('desarmado') || t.includes('briga') || t.includes('soco')) {
    return ITEM_ICON_PRESETS[4].svgDataUri;
  }
  return ITEM_ICON_PRESETS[0].svgDataUri;
}
