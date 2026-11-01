/**
 * Stats extraction, DPS calculation, and difference comparison utilities
 */

/**
 * Finds the variation of a unit for a specific civilization and age.
 * If exact age is not available, finds the closest available age variation.
 */
export function extractUnitVariation(unifiedUnit, civAbbr, targetAge) {
  if (!unifiedUnit || !unifiedUnit.variations || !unifiedUnit.variations.length) {
    return null;
  }

  // Check if civ has access to this unified unit
  if (Array.isArray(unifiedUnit.civs) && !unifiedUnit.civs.includes(civAbbr)) {
    return null;
  }

  // Variations accessible to this civ
  const civVariations = unifiedUnit.variations.filter(v => 
    v.civs ? v.civs.includes(civAbbr) : (unifiedUnit.civs ? unifiedUnit.civs.includes(civAbbr) : true)
  );

  if (!civVariations.length) {
    return null;
  }

  // Exact age match
  const exactAge = civVariations.find(v => v.age === targetAge);
  if (exactAge) return exactAge;

  // Closest age
  const sorted = [...civVariations].sort((a, b) => 
    Math.abs(a.age - targetAge) - Math.abs(b.age - targetAge)
  );

  return sorted[0];
}

/**
 * Formats weapon modifiers (bonus damages)
 */
export function formatWeaponModifiers(modifiers) {
  if (!modifiers || !modifiers.length) return [];
  const results = [];

  for (const mod of modifiers) {
    if (mod.value && mod.target && mod.target.class) {
      const classes = mod.target.class.flat().join(' ');
      results.push(`+${mod.value} vs ${classes}`);
    }
  }

  return results;
}

/**
 * Extracts a normalized stats object from a variation
 */
export function parseUnitStats(variation, unitMetadata = {}) {
  if (!variation) return null;

  // Primary weapon (ignore torch if other weapons exist)
  const weapons = variation.weapons || [];
  const primaryWeapon = weapons.find(w => w.type !== 'fire' && w.id !== 'torch') || weapons[0];

  const meleeArmorObj = variation.armor?.find(a => a.type === 'melee');
  const rangedArmorObj = variation.armor?.find(a => a.type === 'ranged');

  const damage = primaryWeapon?.damage || 0;
  const attackSpeed = primaryWeapon?.speed || 0;
  const dps = attackSpeed > 0 ? parseFloat((damage / attackSpeed).toFixed(1)) : 0;

  const minRange = primaryWeapon?.range?.min || 0;
  const maxRange = primaryWeapon?.range?.max || 0;

  return {
    id: variation.id,
    baseId: variation.baseId || unitMetadata.id,
    name: variation.name,
    age: variation.age,
    isUnique: variation.unique || unitMetadata.unique || false,
    icon: variation.icon || unitMetadata.icon,
    description: variation.description || unitMetadata.description,
    displayClasses: variation.displayClasses || unitMetadata.displayClasses || [],
    classes: variation.classes || unitMetadata.classes || [],
    hitpoints: variation.hitpoints || 0,
    meleeArmor: meleeArmorObj ? meleeArmorObj.value : 0,
    rangedArmor: rangedArmorObj ? rangedArmorObj.value : 0,
    // Costs
    costFood: variation.costs?.food || 0,
    costWood: variation.costs?.wood || 0,
    costGold: variation.costs?.gold || 0,
    costStone: variation.costs?.stone || 0,
    costTotal: variation.costs?.total || 0,
    trainTime: variation.costs?.time || 0,
    popcap: variation.costs?.popcap ?? 1,
    // Combat
    weaponName: primaryWeapon?.name || 'None',
    weaponType: primaryWeapon?.type || 'melee',
    damage: damage,
    attackSpeed: attackSpeed,
    dps: dps,
    rangeMin: minRange,
    rangeMax: maxRange,
    isRanged: maxRange >= 1.0,
    modifiers: formatWeaponModifiers(primaryWeapon?.modifiers),
    allWeapons: weapons,
    // Mobility & Sight
    moveSpeed: variation.movement?.speed || 0,
    sightRange: variation.sight?.line || variation.sight?.base || 0,
    producedBy: variation.producedBy || []
  };
}

/**
 * Calculates median of an array of numbers
 */
export function calculateMedian(numbers) {
  if (!numbers || !numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export const RESOURCE_ICONS = {
  food: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/food.png',
  wood: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/wood.png',
  gold: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/gold.png',
  stone: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/stone.png',
  time: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/time.png',
  popcap: 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/popcap.png'
};

/**
 * Key stats definitions for the Matrix Table
 */
export const STAT_ROWS = [
  // Group: Resource Costs
  { key: 'costTotal', label: 'Total Cost', group: 'costs', type: 'number', lowerIsBetter: true, unit: 'res', faIcon: 'fa-solid fa-coins' },
  { key: 'costFood', label: 'Food', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.food },
  { key: 'costWood', label: 'Wood', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.wood },
  { key: 'costGold', label: 'Gold', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.gold },
  { key: 'costStone', label: 'Stone', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.stone },
  { key: 'trainTime', label: 'Train Time', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.time },
  { key: 'popcap', label: 'Population', group: 'costs', type: 'number', lowerIsBetter: true, iconImg: RESOURCE_ICONS.popcap },

  // Group: Survivability & Combat
  { key: 'hitpoints', label: 'Hitpoints', group: 'combat', type: 'number', lowerIsBetter: false, faIcon: 'fa-solid fa-heart' },
  { key: 'damage', label: 'Melee Attack', group: 'combat', type: 'number', lowerIsBetter: false, faIcon: 'fa-solid fa-shield-halved' },
  { key: 'meleeArmor', label: 'Melee Armor', group: 'combat', type: 'number', lowerIsBetter: false, faIcon: 'fa-solid fa-shield' },
  { key: 'rangedArmor', label: 'Ranged Armor', group: 'combat', type: 'number', lowerIsBetter: false, faIcon: 'fa-solid fa-bullseye' },
  { key: 'attackSpeed', label: 'Attack Interval', group: 'combat', type: 'number', lowerIsBetter: true, unit: 's', faIcon: 'fa-solid fa-stopwatch' },
  { key: 'dps', label: 'Damage / Sec (DPS)', group: 'combat', type: 'number', lowerIsBetter: false, faIcon: 'fa-solid fa-bolt' },
  { key: 'rangeMax', label: 'Attack Range', group: 'combat', type: 'range', lowerIsBetter: false, unit: 'tiles', faIcon: 'fa-solid fa-crosshairs' },
  { key: 'modifiers', label: 'Bonus Modifiers', group: 'combat', type: 'tags', faIcon: 'fa-solid fa-fire' },

  // Group: Mobility & Vision
  { key: 'moveSpeed', label: 'Movement Speed', group: 'mobility', type: 'number', lowerIsBetter: false, unit: 'tiles/s', faIcon: 'fa-solid fa-person-running' },
  { key: 'sightRange', label: 'Line of Sight', group: 'mobility', type: 'number', lowerIsBetter: false, unit: 'tiles', faIcon: 'fa-solid fa-eye' }
];

/**
 * Computes comparative stats (median, min, max, best, worst) across an array of parsed unit stats
 * Strictly calculates based on the provided list of displayed units.
 */
export function computeComparisonMedians(statsList) {
  const medians = {};
  const validItems = statsList.filter(Boolean);

  for (const row of STAT_ROWS) {
    if (row.type === 'number' || row.type === 'range') {
      const values = validItems
        .map(item => item[row.key])
        .filter(v => typeof v === 'number' && !isNaN(v));

      const count = values.length;
      const min = count ? Math.min(...values) : 0;
      const max = count ? Math.max(...values) : 0;
      const rawMedian = count ? calculateMedian(values) : 0;
      const median = typeof rawMedian === 'number' && rawMedian % 1 !== 0 
        ? parseFloat(rawMedian.toFixed(2)) 
        : rawMedian;
      const best = row.lowerIsBetter ? min : max;
      const worst = row.lowerIsBetter ? max : min;

      medians[row.key] = {
        median,
        min,
        max,
        best,
        worst,
        count,
        hasVariation: count >= 2 && min !== max
      };
    }
  }

  return medians;
}

/**
 * Evaluates how a specific stat value compares to the median or best/worst of displayed columns
 */
export function getStatDifference(val, rowDef, medianInfo, mode = 'median') {
  if (typeof val !== 'number' || isNaN(val) || !medianInfo || mode === 'off') {
    return { status: 'neutral', badgeText: null };
  }

  // If fewer than 2 displayed columns have this stat, or if all displayed columns have the exact same value:
  if (!medianInfo.hasVariation) {
    return { status: 'neutral', badgeText: null };
  }

  const { median, best, worst, count } = medianInfo;
  const lowerIsBetter = !!rowDef.lowerIsBetter;

  // Best / Worst mode: only the best value and worst value among all archetype units are highlighted
  if (mode === 'best-worst') {
    if (val === best) {
      return {
        status: 'better',
        badgeText: 'Best',
        isBest: true,
        tooltip: `Best (${val}) among all ${count} units in this archetype`
      };
    }
    if (val === worst) {
      return {
        status: 'worse',
        badgeText: 'Worst',
        isWorst: true,
        tooltip: `Worst (${val}) among all ${count} units in this archetype`
      };
    }
    return { status: 'neutral', badgeText: null };
  }

  // vs Median mode: difference calculated against the median of all units in this archetype
  const delta = parseFloat((val - median).toFixed(2));
  if (Math.abs(delta) < 0.001) {
    return { status: 'equal', badgeText: null };
  }

  const isBetter = lowerIsBetter ? delta < 0 : delta > 0;
  const pct = median > 0 ? Math.round((Math.abs(delta) / median) * 100) : 0;
  const sign = delta > 0 ? '+' : '-';
  const formattedDelta = Math.abs(delta) % 1 === 0 ? Math.abs(delta) : Math.abs(delta).toFixed(1);

  return {
    status: isBetter ? 'better' : 'worse',
    delta,
    percent: pct,
    badgeText: `${sign}${formattedDelta} (${sign}${pct}%)`,
    tooltip: `${isBetter ? 'Superior' : 'Inferior'} to archetype median (${median}) among all ${count} units (${sign}${formattedDelta} / ${sign}${pct}%)`
  };
}
