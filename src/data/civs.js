/**
 * Dynamic Civilization Resolver
 * Transforms official civs-index.json fetched from AoE4 World Data GitHub repository
 * into enriched civilization entities with theme colors and heraldry.
 */

// Expansion labels
export const EXPANSIONS = {
  'base': { name: 'Base Game', label: 'Base Game', color: '#64748b' },
  'sultans-ascend': { name: 'The Sultans Ascend', label: 'Sultans Ascend', color: '#d97706' },
  'dynasties-of-the-east': { name: 'Dynasties of the East', label: 'Dynasties of East', color: '#0d9488' },
  'knights-of-cross-and-rose': { name: 'Knights of Cross and Rose', label: 'Cross & Rose', color: '#7c3aed' },
  'raiders-of-the-north': { name: 'Raiders of the North', label: 'Raiders of North', color: '#0284c7' },
  'yue-feis-legacy': { name: "Yue Fei's Legacy", label: 'Yue Fei Legacy', color: '#be123c' }
};

// Signature heraldic symbols & colors for each civ
const CIV_THEMES = {
  ab: { primary: '#143829', border: '#eab308', text: '#fef08a', icon: '🕌' },
  ay: { primary: '#0f766e', border: '#f59e0b', text: '#fef3c7', icon: '🌙' },
  by: { primary: '#581c87', border: '#fbbf24', text: '#fef08a', icon: '🦅' },
  ch: { primary: '#991b1b', border: '#facc15', text: '#fef08a', icon: '🐉' },
  de: { primary: '#0369a1', border: '#fbbf24', text: '#e0f2fe', icon: '🐘' },
  en: { primary: '#991b1b', border: '#f8fafc', text: '#ffffff', icon: '🦁' },
  fr: { primary: '#1d4ed8', border: '#fbbf24', text: '#fef08a', icon: '⚜️' },
  gol: { primary: '#78350f', border: '#fbbf24', text: '#fef3c7', icon: '🐎' },
  hr: { primary: '#713f12', border: '#facc15', text: '#fef9c3', icon: '👑' },
  hl: { primary: '#831843', border: '#3b82f6', text: '#fbcfe8', icon: '🌹' },
  ja: { primary: '#312e81', border: '#f43f5e', text: '#ffe4e6', icon: '⛩️' },
  je: { primary: '#2563eb', border: '#e2e8f0', text: '#ffffff', icon: '⚔️' },
  jin: { primary: '#064e3b', border: '#fde047', text: '#ecfdf5', icon: '🛡️' },
  kt: { primary: '#450a0a', border: '#dc2626', text: '#ffffff', icon: '✝️' },
  mac: { primary: '#6b21a8', border: '#facc15', text: '#faf5ff', icon: '☀️' },
  ma: { primary: '#c2410c', border: '#facc15', text: '#ffedd5', icon: '🏺' },
  mo: { primary: '#0369a1', border: '#f59e0b', text: '#e0f2fe', icon: '🏹' },
  od: { primary: '#065f46', border: '#ea580c', text: '#fed7aa', icon: '🐲' },
  ot: { primary: '#991b1b', border: '#38bdf8', text: '#fef2f2', icon: '☪️' },
  ru: { primary: '#14532d', border: '#facc15', text: '#dcfce7', icon: '🌲' },
  sco: { primary: '#1e3a8a', border: '#f8fafc', text: '#dbeafe', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  sen: { primary: '#881337', border: '#fbbf24', text: '#ffe4e6', icon: '🏯' },
  tug: { primary: '#134e4a', border: '#fbbf24', text: '#ccfbf1', icon: '🏰' },
  vik: { primary: '#1e293b', border: '#38bdf8', text: '#e2e8f0', icon: '⛵' },
  zx: { primary: '#065f46', border: '#fbbf24', text: '#d1fae5', icon: '📜' }
};

export function getCivFlagUrl(abbr) {
  const slugMap = {
    gol: 'goldenhorde',
    mac: 'macedonian',
    sen: 'sengoku',
    tug: 'tughlaq',
    jin: 'jindynasty'
  };
  const key = slugMap[abbr] || abbr;
  return `https://raw.githubusercontent.com/aoe4world/explorer/main/assets/flags/${key}.png`;
}

/**
 * Transforms raw GitHub civs-index.json into application civilization registry
 */
export function buildCivilizationsFromGitHub(civsIndex = {}) {
  const registry = {};

  // Sort deterministically by civilization name (A to Z)
  const sortedEntries = Object.entries(civsIndex).sort(([, a], [, b]) => 
    (a.name || '').localeCompare(b.name || '')
  );

  for (const [abbr, rawCiv] of sortedEntries) {
    const theme = CIV_THEMES[abbr] || {
      primary: '#1e293b',
      border: '#fbbf24',
      text: '#f8fafc',
      icon: '⚔️'
    };

    const expansionKey = Array.isArray(rawCiv.expansion) && rawCiv.expansion.length 
      ? rawCiv.expansion[0] 
      : 'base';

    registry[abbr] = {
      id: rawCiv.id || abbr,
      name: rawCiv.name || abbr.toUpperCase(),
      abbr: rawCiv.abbr || abbr,
      slug: rawCiv.slug || abbr,
      expansion: expansionKey,
      expansionLabel: EXPANSIONS[expansionKey]?.label || 'Expansion',
      flagUrl: getCivFlagUrl(abbr),
      colors: {
        primary: theme.primary,
        border: theme.border,
        text: theme.text
      },
      iconSymbol: theme.icon
    };
  }

  return registry;
}

export function getCivInfoFromMap(civsMap, abbr) {
  if (civsMap && civsMap[abbr]) {
    return civsMap[abbr];
  }
  return {
    id: abbr,
    name: abbr ? abbr.toUpperCase() : 'Unknown',
    abbr: abbr,
    expansion: 'base',
    flagUrl: getCivFlagUrl(abbr),
    colors: { primary: '#1e293b', border: '#94a3b8', text: '#ffffff' },
    iconSymbol: '⚔️'
  };
}
