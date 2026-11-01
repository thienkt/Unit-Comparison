/**
 * Dynamic Unit Archetype Resolver
 * Automatically classifies military unit categories directly from GitHub all-unified.json dataset
 * and dynamically resolves civilization-unique replacements without manual hardcoding.
 */

// Category schemas to extract from GitHub data
const ARCHETYPE_SCHEMAS = [
  {
    id: 'archers',
    name: 'Archers',
    role: 'Light Ranged Infantry',
    baseId: 'archer',
    matcher: u => (u.classes?.includes('archer') || u.id === 'archer') && !u.classes?.includes('cavalry_archer')
  },
  {
    id: 'spearmen',
    name: 'Spearmen',
    role: 'Light Melee Infantry (Anti-Cavalry)',
    baseId: 'spearman',
    matcher: u => u.classes?.includes('spearman') || u.id === 'spearman' || u.id === 'limitanei' || u.id === 'donso'
  },
  {
    id: 'men-at-arms',
    name: 'Men-at-Arms',
    role: 'Heavy Melee Infantry',
    baseId: 'man-at-arms',
    matcher: u => (
      (
        u.classes?.includes('manatarms') ||
        u.id === 'man-at-arms' ||
        u.id === 'samurai' ||
        u.id.includes('musofadi-warrior') ||
        (u.classes?.includes('samurai_jpn') && !u.classes?.includes('cavalry')) ||
        (u.id.includes('samurai') && !u.id.includes('mounted'))
      ) && !u.classes?.includes('cavalry')
    )
  },
  {
    id: 'horsemen',
    name: 'Horsemen',
    role: 'Light Melee Cavalry (Anti-Ranged)',
    baseId: 'horseman',
    matcher: u => (u.classes?.includes('cavalry_light') || u.id === 'horseman' || u.id === 'sipahi' || u.id === 'sofa' || u.id === 'desert-raider') && (!u.classes?.includes('ranged') || u.id === 'desert-raider')
  },
  {
    id: 'knights',
    name: 'Knights & Lancers',
    role: 'Heavy Melee Cavalry',
    baseId: 'knight',
    matcher: u => u.classes?.includes('knight') || u.classes?.includes('lancer') || u.id === 'knight' || u.id === 'lancer'
  },
  {
    id: 'ranged-cavalry',
    name: 'Horse Archers & Ranged Cavalry',
    role: 'Mobile Ranged Cavalry',
    baseId: 'horse-archer',
    matcher: u => (
      (
        u.classes?.includes('cavalry_archer') ||
        u.classes?.includes('camel_archer') ||
        u.id === 'horse-archer' ||
        u.id === 'mangudai' ||
        u.id === 'camel-archer' ||
        u.id === 'desert-raider' ||
        u.id === 'onna-musha' ||
        u.id === 'tower-elephant' ||
        u.id === 'sultans-elite-tower-elephant' ||
        u.id === 'kipchak-archer' ||
        u.id === 'black-rider' ||
        u.id === 'akinji' ||
        u.id === 'border-reiver' ||
        u.id === 'genitour' ||
        u.id === 'mohe-tribesman' ||
        ((u.classes?.includes('cavalry') || u.classes?.includes('camel') || u.classes?.includes('elephant')) && u.classes?.includes('ranged'))
      ) &&
      !u.classes?.includes('ship') &&
      !u.classes?.includes('worker') &&
      !u.id.includes('jeanne-darc') &&
      !u.id.includes('khan') &&
      !u.id.includes('scout')
    )
  },
  {
    id: 'crossbowmen',
    name: 'Crossbowmen',
    role: 'Light Ranged Anti-Armor',
    baseId: 'crossbowman',
    matcher: u => u.classes?.includes('crossbowman') || u.id === 'crossbowman'
  },
  {
    id: 'handcannoneers',
    name: 'Handcannoneers',
    role: 'Gunpowder Ranged Infantry',
    baseId: 'handcannoneer',
    matcher: u => u.classes?.includes('handcannon') || u.id === 'handcannoneer' || u.id === 'grenadier' || u.id === 'musofadi-gunner'
  },
  {
    id: 'scouts',
    name: 'Scouts',
    role: 'Reconnaissance & Map Control',
    baseId: 'scout',
    matcher: u => u.classes?.includes('scout') || u.id === 'scout'
  },
  {
    id: 'springalds',
    name: 'Springalds',
    role: 'Long-Range Anti-Siege',
    baseId: 'springald',
    matcher: u => u.id.includes('springald') || (u.classes?.includes('siege') && u.name.toLowerCase().includes('springald'))
  },
  {
    id: 'mangonels',
    name: 'Mangonels & AoE Siege',
    role: 'Area Artillery',
    baseId: 'mangonel',
    matcher: u => u.id.includes('mangonel') || u.id.includes('nest-of-bees') || u.id === 'manjaniq'
  },
  {
    id: 'bombards',
    name: 'Bombards & Heavy Artillery',
    role: 'Heavy Gunpowder Artillery',
    baseId: 'bombard',
    matcher: u => u.id.includes('bombard') || u.id === 'cannon' || u.id === 'culverin'
  },
  {
    id: 'trebuchets',
    name: 'Trebuchets',
    role: 'Long-Range Structure Demolition',
    baseId: 'counterweight-trebuchet',
    matcher: u => u.id.includes('trebuchet')
  },
  {
    id: 'battering-rams',
    name: 'Battering Rams',
    role: 'Armored Siege Ram',
    baseId: 'battering-ram',
    matcher: u => u.id.includes('battering-ram') || u.id === 'tower-of-the-sultan' || u.classes?.includes('ram')
  }
];

/**
 * Dynamically constructs archetypes by parsing live GitHub unit & civilization datasets
 */
export function buildDynamicArchetypes(allUnits = [], civsIndex = {}) {
  const civKeys = Object.keys(civsIndex);

  return ARCHETYPE_SCHEMAS.map(schema => {
    // Base standard unit in GitHub dataset
    const baseUnit = allUnits.find(u => u.id === schema.baseId) || {};

    // All matching units in this category from GitHub
    const matchingUnits = allUnits.filter(schema.matcher);
    const unitIds = matchingUnits.map(u => u.id);

    // Dynamic resolution of primary unit for each civilization
    const civUnitMap = {};
    for (const civAbbr of civKeys) {
      let forCiv = matchingUnits.filter(u => u.civs && u.civs.includes(civAbbr));
      if (!forCiv.length) continue; // Civilization has no unit in this category!

      // For Byzantines, prefer native units (e.g. Varangian Guard) over mercenary contract variants
      if (civAbbr === 'by') {
        const nativeByz = forCiv.filter(u => !u.classes?.includes('mercenary_byz'));
        if (nativeByz.length) forCiv = nativeByz;
      }

      // Filter out auxiliary sub-units (e.g. bannermen, levies, landmarks) if a main combat unit exists
      const filtered = forCiv.filter(u => 
        !u.id.includes('bannerman') && 
        !u.id.includes('levy') && 
        !u.id.includes('wynguard') && 
        !u.id.includes('jeanne-darc-woman') && 
        !u.id.includes('khaganate') && 
        !u.id.includes('lord-of-lancaster')
      );
      const candidates = filtered.length ? filtered : forCiv;

      // Collect all valid combat units for this civ (e.g. Man-at-Arms AND Jeanne's Champion for Jeanne d'Arc)
      // Standard base unit first, then unique variants, avoiding duplicates
      const orderedCandidates = [];
      const standardUnit = candidates.find(u => u.id === schema.baseId);
      if (standardUnit) orderedCandidates.push(standardUnit);

      for (const u of candidates) {
        if (!orderedCandidates.some(x => x.id === u.id)) {
          orderedCandidates.push(u);
        }
      }

      if (orderedCandidates.length) {
        civUnitMap[civAbbr] = orderedCandidates.map(u => u.id);
      }
    }

    // Determine available ages dynamically from unit variations
    const agesSet = new Set();
    matchingUnits.forEach(u => {
      u.variations?.forEach(v => {
        if (typeof v.age === 'number') agesSet.add(v.age);
      });
    });
    const availableAges = Array.from(agesSet).sort((a, b) => a - b);

    return {
      id: schema.id,
      name: schema.name,
      role: schema.role,
      baseId: schema.baseId,
      defaultAge: baseUnit.minAge || (availableAges.includes(2) ? 2 : availableAges[0] || 2),
      availableAges: availableAges.length ? availableAges : [1, 2, 3, 4],
      icon: baseUnit.icon || matchingUnits[0]?.icon || `https://data.aoe4world.com/images/units/${schema.baseId}-2.png`,
      description: baseUnit.description || `Tactical comparison of ${schema.name} across civilizations in Age of Empires IV.`,
      civUnitMap,
      unitIds
    };
  });
}

/**
 * Resolves all unit IDs a civ has for an archetype (can be multiple, e.g. Man-at-Arms & Jeanne's Champion)
 */
export function resolveCivUnitIds(archetype, civAbbr) {
  if (archetype?.civUnitMap && archetype.civUnitMap[civAbbr]) {
    const val = archetype.civUnitMap[civAbbr];
    return Array.isArray(val) ? val : [val];
  }
  return archetype?.baseId ? [archetype.baseId] : [];
}

/**
 * Resolves primary unit ID for backwards compatibility
 */
export function resolveCivUnitId(archetype, civAbbr) {
  const ids = resolveCivUnitIds(archetype, civAbbr);
  return ids[0];
}
