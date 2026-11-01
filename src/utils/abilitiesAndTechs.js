/**
 * Utilities for matching abilities and technologies to units
 * Uses the aoe4world data from:
 *   - /abilities/all-unified.json
 *   - /technologies/all-unified.json
 */

/**
 * Supplemental abilities that exist in AoE4 mechanics but are unindexed in raw AoE4 World Data
 */
const SUPPLEMENTAL_ABILITIES = [
  {
    id: 'ability-daimyo-aura',
    name: 'Daimyo Aura',
    civs: ['sen'],
    description: 'Aura provided by the Daimyo that increases attack speed of nearby military units by +20%. Remains active around their remains after they fall.',
    icon: 'https://data.aoe4world.com/images/units/daimyo-2.png',
    type: 'ability',
    minAge: 2,
    variations: [
      {
        id: 'ability-daimyo-aura-2',
        age: 2,
        civs: ['sen'],
        description: 'Aura provided by the Daimyo that increases attack speed of nearby military units by +20%. Remains active around their remains after they fall.',
        icon: 'https://data.aoe4world.com/images/units/daimyo-2.png',
        active: 'always',
        auraRange: 8,
        effects: [
          {
            property: 'attackSpeed',
            select: {
              class: [['military']]
            },
            effect: 'multiply',
            value: 1.20,
            type: 'ability'
          }
        ]
      }
    ]
  }
];

/**
 * Known tech/building requirements whose abilities default to age 1 in raw data
 */
const UNLOCKED_BY_MIN_AGE = {
  'technologies/siege-carpentry': 3,
  'technologies/medical-centers': 4,
  'technologies/kabura-ya-whistling-arrow': 3,
  'buildings/college-of-artillery': 4,
  'technologies/camel-support': 4,
  'technologies/level-3-rider-companions': 3,
  'technologies/level-3-champion-companions': 3,
  'technologies/level-4-field-commander': 4,
  'technologies/level-4-gunpowder-monarch': 4,
};

/**
 * Helper to check if an effect has meaningful/parsed combat values
 */
function isMeaningfulEffect(e) {
  return e && e.property && e.property !== 'unknown' && e.value !== 0 && e.value != null;
}

/**
 * Find all abilities that apply to a given unit for a civ at a specific age.
 * Matches by `effect.select.id` containing the unit base ID.
 * Also accepts unit class-based matching and description-based aura matching.
 *
 * @param {string} unitBaseId - e.g. 'royal-knight'
 * @param {string[]} unitClasses - e.g. ['cavalry', 'heavy', ...]
 * @param {string} civAbbr - e.g. 'fr'
 * @param {number} targetAge - 1-4
 * @param {Array} abilitiesList - all abilities from all-unified.json
 * @returns {Array} list of matched ability objects
 */
export function getAbilitiesForUnit(unitBaseId, unitClasses, civAbbr, targetAge, abilitiesList) {
  const fullList = [...(abilitiesList || []), ...SUPPLEMENTAL_ABILITIES];
  if (!fullList.length) return [];

  const seen = new Set();
  const results = [];
  const isMilitary = unitClasses.includes('military') || unitClasses.includes('land_military');
  const isSiege = unitClasses.includes('siege') || unitClasses.includes('catapult');
  const isInfantry = unitClasses.includes('infantry');
  const isCamel = unitClasses.includes('camel') || unitBaseId.includes('camel') || unitBaseId === 'desert-raider';

  for (const ability of fullList) {
    // Check if ability is accessible to this civ (top-level civs list)
    if (ability.civs?.length && !ability.civs.includes(civAbbr)) continue;

    // Find a matching variation: for this civ, age <= targetAge, that targets this unit
    const matchedVar = (ability.variations || []).find(v => {
      if (v.civs?.length && !v.civs.includes(civAbbr)) return false;

      // Check effective age considering unlocking technology/landmark
      const reqAge = v.unlockedBy?.reduce((maxAge, u) => Math.max(maxAge, UNLOCKED_BY_MIN_AGE[u] || 0), 0) || 0;
      const effectiveAge = Math.max(typeof v.age === 'number' ? v.age : 1, reqAge);
      if (effectiveAge > targetAge) return false;

      // 1. Direct activation on this unit
      if (v.activatedOn?.some(act => act.includes(unitBaseId))) {
        return true;
      }

      // Never leak manual activated unit spells (e.g. Mass Heal, Conversion) to other units
      if (v.active === 'manual' && v.activatedOn?.length > 0 && !v.activatedOn.some(act => act.includes(unitBaseId))) {
        return false;
      }

      // 2. Direct ID match in effects (e.g. Quick Strike for Ghulam, Tactical Charge for Camel Lancer)
      if (v.effects?.some(e => e.select?.id?.includes(unitBaseId))) {
        return true;
      }

      // 3. Atabeg supervision for Ayyubids non-siege military units
      if (ability.id === 'ability-atabeg-supervision' && civAbbr === 'ay' && isMilitary && !isSiege && !unitClasses.includes('ship')) {
        return true;
      }

      // 4. Camel unease for camel units
      if (ability.id === 'ability-camel-unease' && isCamel) {
        return true;
      }

      // 5. Manjaniq weapon swaps
      if (unitBaseId === 'manjaniq' && ability.id.includes('swap-weapon')) {
        return true;
      }

      // 6. Structural Reinforcements for Ayyubids siege units (unlocked via Siege Carpentry in Age 3+)
      if (ability.id === 'ability-structural-reinforcements' && civAbbr === 'ay' && isSiege && targetAge >= 3) {
        return true;
      }

      // 7. Structured effect match with a meaningful non-zero property
      if (v.effects?.some(e => isMeaningfulEffect(e) && matchesUnit(e, unitBaseId, unitClasses))) {
        return true;
      }

      // 8. Fallback for combat auras with empty/unparsed effects in AoE4 World Data
      if (v.active !== 'manual' && (!v.effects || v.effects.length === 0 || !v.effects.some(isMeaningfulEffect))) {
        const desc = (v.description || ability.description || '').toLowerCase();
        const name = (ability.name || '').toLowerCase();
        const isCombatAura = desc.includes('aura') || name.includes('aura') || desc.includes('nearby');

        if (isCombatAura && isMilitary) {
          if (desc.includes('non-siege military') && !isSiege) return true;
          if (desc.includes('siege unit') || desc.includes('siege engine')) return isSiege;
          if (desc.includes('infantry') && isInfantry) return true;
          if (desc.includes('military units') || desc.includes('nearby units') || desc.includes('its aura')) {
            return !isSiege || desc.includes('siege');
          }
        }
      }

      return false;
    });

    if (matchedVar && !seen.has(ability.id)) {
      seen.add(ability.id);
      results.push({
        id: ability.id,
        name: ability.name,
        description: matchedVar.description || ability.description || '',
        icon: ability.icon || matchedVar.icon,
        age: matchedVar.age,
        type: 'ability',
        active: matchedVar.active,
        effects: matchedVar.effects || []
      });
    }
  }

  return results;
}

/**
 * Find all technologies (unique upgrades) that apply to a given unit for a civ at a specific age.
 * Only returns techs that directly target the unit by ID (unique / civ-specific tech).
 *
 * @param {string} unitBaseId - e.g. 'royal-knight'
 * @param {string[]} unitClasses - e.g. ['cavalry', 'heavy', ...]
 * @param {string} civAbbr - e.g. 'fr'
 * @param {number} targetAge - 1-4
 * @param {boolean} uniqueOnly - if true, only return civ-unique techs
 * @param {Array} techsList - all technologies from all-unified.json
 * @returns {Array} list of matched tech objects
 */
export function getTechsForUnit(unitBaseId, unitClasses, civAbbr, targetAge, techsList, uniqueOnly = false, unitName = '') {
  if (!techsList?.length) return [];

  const seen = new Set();
  const results = [];
  const isInfantry = unitClasses.includes('infantry');
  const isCavalry = unitClasses.includes('cavalry');
  const isSiege = unitClasses.includes('siege') || unitClasses.includes('catapult');
  const isCamel = unitClasses.includes('camel') || unitBaseId.includes('camel') || unitBaseId === 'desert-raider';

  // Prepare aliases for fallback matching
  const searchTokens = new Set();
  if (unitBaseId) {
    searchTokens.add(unitBaseId.toLowerCase());
    searchTokens.add(unitBaseId.replace(/-/g, ' ').toLowerCase());
  }
  if (unitName) {
    searchTokens.add(unitName.toLowerCase());
    const cleaned = unitName.replace(/^(?:early|veteran|hardened|elite)\s+/i, '').toLowerCase();
    searchTokens.add(cleaned);
  }

  for (const tech of techsList) {
    // Filter civs
    if (tech.civs?.length && !tech.civs.includes(civAbbr)) continue;
    // Optionally only unique techs
    if (uniqueOnly && !tech.unique) continue;

    // Find matching variation for this civ, age <= target, targeting this unit
    const matchedVar = (tech.variations || []).find(v => {
      if (v.civs?.length && !v.civs.includes(civAbbr)) return false;
      if (typeof v.age === 'number' && v.age > targetAge) return false;

      // 1. If tech has explicit structured select targets, match only against them
      const hasStructuredSelect = v.effects?.some(e => e.select?.id?.length || e.select?.class?.length);
      if (hasStructuredSelect) {
        return v.effects.some(e => matchesUnit(e, unitBaseId, unitClasses));
      }

      // 2. DisplayClasses / Category targeting for unique techs without structured select (e.g. Sultan's Mamluks, Siege Carpentry, Infantry Support)
      if (tech.unique) {
        const dc = (tech.displayClasses || v.displayClasses || []).map(c => c.toLowerCase());
        const isMelee = unitClasses.includes('melee');
        const desc = (v.description || tech.description || '').toLowerCase();

        if (dc.some(c => c.includes('infantry') && !c.includes('melee') && !c.includes('ranged')) && isInfantry) return true;
        if (dc.some(c => c.includes('melee infantry')) && isInfantry && isMelee) return true;
        if (dc.some(c => c.includes('cavalry')) && isCavalry) return true;
        if (dc.some(c => c.includes('siege')) && isSiege) return true;
        if (isCamel && desc.includes('camel')) return true;

        for (const token of searchTokens) {
          if (!token || token.length < 3) continue;
          if (desc.includes(token)) {
            return true;
          }
        }
      }

      return false;
    });

    if (matchedVar && !seen.has(tech.id)) {
      seen.add(tech.id);

      // Summarize effects into human-readable strings
      let effectSummary = formatTechEffects(matchedVar.effects || [], unitBaseId, unitClasses);

      // If empty effects array or only unparsed properties, extract summary from description
      if (!effectSummary.length && (matchedVar.description || tech.description)) {
        const extracted = extractEffectSummaryFromDesc(matchedVar.description || tech.description);
        if (extracted) {
          effectSummary = [extracted];
        }
      }

      results.push({
        id: tech.id,
        name: tech.name,
        description: matchedVar.description || tech.description || '',
        icon: tech.icon || matchedVar.icon,
        age: matchedVar.age,
        type: 'technology',
        unique: tech.unique || false,
        effects: matchedVar.effects || [],
        effectSummary
      });
    }
  }

  return results.sort((a, b) => (a.age || 0) - (b.age || 0));
}

/**
 * Extract clean summary from tech description when structured effects are empty
 */
function extractEffectSummaryFromDesc(desc) {
  if (!desc) return null;
  const firstLine = desc.split('\n')[0].trim();

  // Pattern: "Infantry gains +25% damage and +20% movement speed for 30 seconds after defeating a unit."
  if (/defeat(?:ing)? a unit/i.test(firstLine) || /after defeating/i.test(firstLine)) {
    const mDmg = firstLine.match(/[+](\d+)%?\s+damage/i);
    const mSpd = firstLine.match(/[+](\d+)%?\s+movement\s+speed/i);
    const mSec = firstLine.match(/for\s+(\d+)\s+seconds/i);
    if (mDmg && mSpd) return `+${mDmg[1]}% DMG, +${mSpd[1]}% SPD on kill${mSec ? ` (${mSec[1]}s)` : ''}`;
  }

  // Pattern: "Infantry increase the armor of nearby camels by 3."
  if (/armor of nearby camels by\s+([+]?\d+)/i.test(firstLine)) {
    const num = firstLine.match(/armor of nearby camels by\s+([+]?\d+)/i)[1];
    return `+${num} Camel Armor aura`;
  }

  // Pattern: "Upon completion, siege units gain access to the Structural Reinforcements ability.\nSiege units gain +20 melee armor and +5 fire armor for 10 seconds."
  if (/Structural Reinforcements/i.test(desc) || /melee armor and \+?\d+ fire armor/i.test(desc)) {
    const mArm = desc.match(/([+]?\d+)\s+melee armor/i);
    const mFarm = desc.match(/([+]?\d+)\s+fire armor/i);
    const mSec = desc.match(/for\s+(\d+)\s+seconds/i);
    if (mArm && mFarm) return `+${mArm[1].replace(/^\+/, '')} ARM, +${mFarm[1].replace(/^\+/, '')} FARM${mSec ? ` (${mSec[1]}s)` : ''}`;
  }

  // Pattern: "Increase the attack range of Spearmen by +100%."
  if (/attack range of .*?by\s+([+]?\d+%?)/i.test(firstLine)) {
    const r = firstLine.match(/attack range of .*?by\s+([+]?\d+%?)/i)[1];
    return `${r} Attack Range`;
  }

  // Pattern: "Gilded Knights take -25% damage while charging"
  const mTake = firstLine.match(/take[s]?\s+(-?\d+%?\s+(?:less\s+)?damage(?:\s+while\s+[a-zA-Z]+)?)/i);
  if (mTake) return mTake[1].trim();

  // Pattern: "reduces bonus damage taken by -50%"
  const mReduceTaken = firstLine.match(/damage taken(?: by)?\s+(-?\d+%?)/i);
  if (mReduceTaken) return `${mReduceTaken[1].trim()} dmg taken`;

  // Pattern: "reducing unit costs by a further -5%"
  const mCost = firstLine.match(/cost[s]?\s+(?:by\s+(?:a further\s+)?)(-?\d+%?)/i);
  if (mCost) return `${mCost[1].trim()} cost`;

  // Pattern: "Grants +1 damage to Yumi Ashigaru." -> "+1 damage"
  const mGrant = firstLine.match(/grant[s]?\s+([+]?\d+(?:\.\d+)?%?\s+[a-zA-Z\s]+?)(?:\s+to\b|[.,;\n]|$)/i);
  if (mGrant) return mGrant[1].trim();

  // Pattern: "Springalds gain 15% attack speed"
  const mGain = firstLine.match(/gain[s]?\s+([+]?\d+(?:\.\d+)?%?\s+[a-zA-Z\s]+?)(?:\s+and|[.,;\n]|$)/i);
  if (mGain) return mGain[1].trim();

  // Pattern: "Increase Yari Cavalry anti-cavalry damage by +2." -> "+2 anti-cavalry damage"
  const mBy = firstLine.match(/increase[s]?\s+.*?([a-zA-Z\s-]+?)\s+(?:by\s+)([+]?\d+(?:\.\d+)?%?)/i);
  if (mBy) {
    const val = mBy[2].trim();
    const stat = mBy[1].trim().replace(/^(?:the\s+)?(?:[a-zA-Z\s]+?\s+)?/, '');
    return `${val} ${stat}`.trim();
  }

  // Pattern: bleed / heal
  const mBleed = firstLine.match(/bleed for\s+(\d+\s+damage(?:\s+every\s+second)?)/i);
  if (mBleed) return `${mBleed[1].trim()}/s`;

  const mHeal = firstLine.match(/heal[s]?\s+(\d+\s+(?:health|hp))/i);
  if (mHeal) return mHeal[1].trim();

  // Specific combat modifiers
  if (/area of effect.*torch/i.test(firstLine) || /torch.*area of effect/i.test(firstLine)) return 'AoE torch damage';
  if (/area of effect/i.test(firstLine)) return 'AoE damage';
  if (/instant/i.test(firstLine) && /setup/i.test(firstLine)) return 'Instant setup/pack';
  if (/fire a yumi/i.test(firstLine)) return 'Periodic Yumi attack';
  if (/fire lance/i.test(firstLine)) return 'Fire Lance charge';
  if (/hail of arrows/i.test(firstLine)) return 'Hail of arrows';

  // Pattern: explicit +X% or -X% [stat]
  const mPlus = firstLine.match(/([+-]\d+(?:\.\d+)?%?(?:\s+[a-zA-Z]+){1,3})/);
  if (mPlus) return mPlus[1].trim();

  const firstClause = firstLine.split(/[.,;]/)[0].trim();
  if (firstClause.length <= 40) return firstClause;

  return `${firstClause.slice(0, 36)}...`;
}

/**
 * Check if an effect's `select` matches the given unitId or classes.
 * In AoE4 World Data:
 * - `select.class` is an array of requirement groups (OR condition between groups)
 * - Each requirement group is an array of class tags that ALL must match (AND condition)
 * Only matches effects that target actual units (not buildings).
 */
function matchesUnit(effect, unitBaseId, unitClasses = []) {
  const sel = effect?.select;
  if (!sel) return false;

  // Direct ID match by unit ID
  if (sel.id?.includes(unitBaseId)) return true;

  // Class-based match
  if (sel.class?.length && unitClasses.length) {
    return sel.class.some(classGroup => {
      const group = Array.isArray(classGroup) ? classGroup : [classGroup];
      // Target must satisfy ALL classes in this group
      return group.every(cls => unitClasses.includes(cls));
    });
  }

  return false;
}

/**
 * Format tech effects into human-readable strings for display
 * e.g. "+10 Melee Attack vs infantry/cavalry"
 */
function formatTechEffects(effects, unitBaseId, unitClasses = []) {
  const lines = [];
  for (const e of effects) {
    if (!matchesUnit(e, unitBaseId, unitClasses)) continue;
    // Skip unknown or useless effects
    if (!e.property || e.property === 'unknown') continue;
    if (e.value === 0 || e.value == null) continue;

    const sign = e.effect === 'change' ? (e.value >= 0 ? '+' : '') : '';
    const valStr = e.effect === 'multiply' 
      ? (e.value > 1 ? `+${Math.round((e.value - 1) * 100)}%` : e.value < 1 ? `-${Math.round((1 - e.value) * 100)}%` : `×100%`)
      : `${sign}${typeof e.value === 'number' ? (e.value % 1 !== 0 ? e.value.toFixed(1) : e.value) : e.value}`;

    const propLabel = {
      meleeAttack: 'Melee Attack',
      rangedAttack: 'Ranged Attack',
      meleeArmor: 'Melee Armor',
      rangedArmor: 'Ranged Armor',
      hitpoints: 'Hitpoints',
      moveSpeed: 'Move Speed',
      attackSpeed: 'Attack Speed',
      sightRange: 'Sight Range',
      lineOfSight: 'Line of Sight',
      fireArmor: 'Fire Armor',
      maxRange: 'Attack Range',
      range: 'Attack Range',
      minRange: 'Min Range',
    }[e.property] || e.property;

    // Target classes (who gets the bonus applied against)
    let targetStr = '';
    if (e.target?.class?.length) {
      const targets = e.target.class.map(cls => Array.isArray(cls) ? cls.join('/') : cls);
      targetStr = ` vs ${targets.join(', ')}`;
    }

    const typeLabel = e.type === 'bonus' ? ' (bonus dmg)' 
      : e.type === 'passive' ? '' 
      : e.type === 'ability' && e.duration ? ` (${e.duration}s)` 
      : '';

    lines.push(`${valStr} ${propLabel}${targetStr}${typeLabel}`);
  }
  return lines;
}

/**
 * Summarizes effects for display in the comparison matrix cell (compact format)
 * Returns null if there's nothing meaningful to show (unknown property, zero value, etc.)
 */
export function summarizeAbilityEffect(ability) {
  // Direct known ability badges
  if (ability.id === 'ability-atabeg-supervision') return '+25% HP';
  if (ability.id === 'ability-camel-unease') return '-20% Enemy Cav DMG';
  if (ability.id === 'ability-quick-strike') return 'Double Strike';
  if (ability.id === 'ability-tactical-charge') return 'Up to +40% Charge';
  if (ability.id === 'ability-desert-raider-blade') return 'Melee Stance';
  if (ability.id === 'ability-desert-raider-bow') return 'Ranged Stance';
  if (ability.id === 'ability-swap-weapon-incendiary') return 'Incendiary AoE';
  if (ability.id === 'ability-swap-weapon-kinetic') return 'Kinetic Shot';
  if (ability.id === 'ability-structural-reinforcements') return '+20 ARM, +5 FARM (10s)';

  const relevant = (ability.effects || []).filter(e =>
    e.value != null &&
    e.value !== 0 &&
    e.property &&
    e.property !== 'unknown'
  );

  if (!relevant.length) {
    const desc = ability.description || '';
    if (!desc) return null;

    // Pattern: +50% movement speed and take -15% less damage
    const mSpeedDmg = desc.match(/[+](\d+)%?\s+movement\s+speed.*?take\s+(-?\d+)%/i);
    if (mSpeedDmg) return `+${mSpeedDmg[1]}% SPD, ${mSpeedDmg[2]}% DMG`;

    // Pattern: +X% attack speed
    const mAspd = desc.match(/[+](\d+)%?\s+(?:attack\s+speed|production\s+speed)/i);
    if (mAspd) return `+${mAspd[1]}% ASPD`;

    // Pattern: range and ranged armor (Deploy Pavise)
    const mRngArmor = desc.match(/range\s+by\s+[+]?(\d+)\s+tile.*?gain\s+[+]?(\d+)\s+ranged\s+armor/i);
    if (mRngArmor) return `+${mRngArmor[1]} RNG, +${mRngArmor[2]} RARM`;

    // Pattern: range by +15% and armor by +1/+1 (Desert Citadels)
    const mRangeArm = desc.match(/range\s+.*?by\s+[+]?(\d+)%.*?armor\s+by\s+[+]?([0-9/]+)/i);
    if (mRangeArm) return `+${mRangeArm[1]}% RNG, +${mRangeArm[2]} ARM`;

    // Pattern: heal +1 health every 1 second and gain +20% damage (Kurultai)
    const mKurultai = desc.match(/heal\s+[+]?(\d+)\s+health.*?gain\s+.*?(\+\d+%)\s+damage/i);
    if (mKurultai) return `+${mKurultai[1]} HP/s, ${mKurultai[2]} DMG`;

    // Pattern: heal per second (Medical Centers, Abbey, Divine Vitality, Saint's Relic)
    const mHealSec = desc.match(/heal[s]?\s+.*?(?:by|for)\s+[+]?(\d+)\s+(?:health\s+)?every\s+1?\s*second/i);
    if (mHealSec) return `+${mHealSec[1]} HP/s`;
    const mHealSec2 = desc.match(/heal[s]?\s+(\d+)\s+health\s+per\s+second/i);
    if (mHealSec2) return `+${mHealSec2[1]} HP/s`;
    if (/repairs?.*?(\d+)\s+health\s+every\s+second/i.test(desc)) {
      const num = desc.match(/repairs?.*?(\d+)\s+health\s+every\s+second/i);
      return `+${num[1]} HP/s`;
    }
    if (/heals? after every attack/i.test(desc)) return 'Heal on hit';

    // Pattern: festivals (Production Festival / Siege Festival)
    const mFest = desc.match(/production\s+speed\s+.*?by\s+[+]?(\d+)%\s+for\s+(\d+)\s+seconds/i);
    if (mFest) return `+${mFest[1]}% Prod (${mFest[2]}s)`;
    const mSiegeFest = desc.match(/damage\s+.*?by\s+[+]?(\d+)%\s+for\s+(\d+)\s+seconds/i);
    if (mSiegeFest) return `+${mSiegeFest[1]}% DMG (${mSiegeFest[2]}s)`;

    // Pattern: +X damage and +Y tiles range (Castle of the Crow)
    const mDmgRange = desc.match(/[+](\d+)%?\s+damage\s+and\s+[+]?(\d+)\s+tiles?\s+range/i);
    if (mDmgRange) return `+${mDmgRange[1]}% DMG, +${mDmgRange[2]} RNG`;

    // Pattern: +1 range (Divine Defense)
    const mGainRng = desc.match(/gain\s+[+]?(\d+)\s+range/i);
    if (mGainRng) return `+${mGainRng[1]} RNG`;

    // Pattern: +1 armor (Lion's Duty / Sacred Grove)
    if (/increases armor of infantry/i.test(desc) || /increases the armor of nearby units by \+?1/i.test(desc)) return '+1 ARM';

    // Pattern: +1 melee and ranged armor (Hamingja / Sacred Grove)
    const mArmor = desc.match(/[+](\d+)\s+(?:melee\s+and\s+ranged\s+)?armor/i);
    if (mArmor) return `+${mArmor[1]}/+${mArmor[1]} ARM`;

    // Pattern: heal for X health every Y seconds (Ryokan Healing)
    const mHeal = desc.match(/heal\s+.*?(\d+)\s+health\s+every\s+(\d+)\s+seconds/i);
    if (mHeal) return `+${mHeal[1]} HP/${mHeal[2]}s`;

    // Yam Network to all
    if (/yam speed aura applies to all/i.test(desc)) return 'Yam to all';

    // Pattern: generic +X% or -X% [stat]
    const mGeneric = desc.match(/([+-]\d+%\s+[A-Za-z]+)/);
    if (mGeneric) return mGeneric[1];

    return null;
  }

  const e = relevant[0];
  const sign = e.value > 0 ? '+' : '';
  const valStr = e.effect === 'multiply'
    ? (e.value > 1 ? `+${Math.round((e.value - 1) * 100)}%` : e.value < 1 ? `-${Math.round((1 - e.value) * 100)}%` : `×100%`)
    : `${sign}${typeof e.value === 'number' && e.value % 1 !== 0 ? e.value.toFixed(1) : e.value}`;
  const propShort = {
    meleeAttack: 'ATK', rangedAttack: 'RATK', fireAttack: 'TORCH',
    meleeArmor: 'ARM', rangedArmor: 'RARM', fireArmor: 'FARM',
    hitpoints: 'HP', moveSpeed: 'SPD', attackSpeed: 'ASPD',
    sightRange: 'LOS', lineOfSight: 'LOS',
    maxRange: 'RNG', minRange: 'RNG', range: 'RNG',
    healingRate: 'HP/s',
    productionSpeed: 'PROD',
    goldCost: 'COST', woodCost: 'COST', foodCost: 'COST'
  }[e.property] || null;
  if (!propShort) return null; // Don't display unrecognized/technical props
  const durationStr = e.duration ? ` ${e.duration}s` : '';
  return `${valStr} ${propShort}${durationStr}`;
}
