/**
 * API Service for fetching AoE4 World Data directly from GitHub Raw endpoint
 * Target: https://raw.githubusercontent.com/aoe4world/data/main/
 * Fallback: https://data.aoe4world.com/
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/aoe4world/data/main';
const CDN_FALLBACK_BASE = 'https://data.aoe4world.com';

export async function fetchFromGitHub(path, options = {}) {
  const endpoints = [
    { name: 'GitHub Raw', url: `${GITHUB_RAW_BASE}${path}` },
    { name: 'AoE4 World CDN', url: `${CDN_FALLBACK_BASE}${path}` }
  ];

  let lastError = null;
  const timeoutMs = options.timeoutMs || 8000;

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(ep.url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(id);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${ep.name}`);
      }

      const data = await res.json();
      return { data, source: ep.name };
    } catch (err) {
      lastError = err;
      console.warn(`[AoE4 Data API] Error fetching from ${ep.url}:`, err.message);
    }
  }

  throw new Error(`Failed to fetch AoE4 data directly from GitHub: ${lastError?.message}`);
}

/**
 * Fetch civilizations list
 */
export async function getCivilizations() {
  const { data, source } = await fetchFromGitHub('/civilizations/civs-index.json');
  return { civs: data, source };
}

/**
 * Fetch all unified units
 */
export async function getAllUnifiedUnits() {
  const { data, source } = await fetchFromGitHub('/units/all-unified.json');
  const units = data.data || data;
  return { units, source };
}

/**
 * Fetch single unit unified json directly from GitHub
 */
export async function getUnifiedUnit(unitId) {
  const { data, source } = await fetchFromGitHub(`/units/unified/${unitId}.json`);
  return { unit: data, source };
}

/**
 * Fetch all abilities
 */
export async function getAllAbilities() {
  const { data, source } = await fetchFromGitHub('/abilities/all-unified.json');
  const list = data.data || data;
  return { abilities: list, source };
}

/**
 * Fetch all technologies
 */
export async function getAllTechnologies() {
  const { data, source } = await fetchFromGitHub('/technologies/all-unified.json');
  const list = data.data || data;
  return { technologies: list, source };
}
