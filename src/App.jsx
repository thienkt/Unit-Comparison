import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import CategorySelector from './components/CategorySelector';
import ControlsBar from './components/ControlsBar';
import QuickCivBar from './components/QuickCivBar';
import ComparisonMatrix from './components/ComparisonMatrix';
import SkeletonTable from './components/SkeletonTable';
import UnitDetailModal from './components/UnitDetailModal';
import CivFilterModal from './components/CivFilterModal';
import Footer from './components/Footer';

import { buildDynamicArchetypes, resolveCivUnitIds, resolveCivUnitId } from './data/archetypes';
import { buildCivilizationsFromGitHub, getCivInfoFromMap } from './data/civs';
import { getCivilizations, getAllUnifiedUnits, getUnifiedUnit, getAllAbilities, getAllTechnologies } from './services/api';
import { extractUnitVariation, parseUnitStats, computeComparisonMedians } from './utils/stats';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Dynamically fetched & generated datasets from GitHub
  const [civilizationsMap, setCivilizationsMap] = useState({});
  const [archetypes, setArchetypes] = useState([]);

  // Active category & Age selection
  const [selectedCategoryId, setSelectedCategoryId] = useState('archers');
  const activeArchetype = useMemo(() => {
    return archetypes.find(a => a.id === selectedCategoryId) || archetypes[0] || null;
  }, [archetypes, selectedCategoryId]);

  const [selectedAge, setSelectedAge] = useState(2);

  // Highlighting & search
  const [highlightMode, setHighlightMode] = useState('median');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Civilizations
  const [selectedCivs, setSelectedCivs] = useState([]);
  const [isCivFilterOpen, setIsCivFilterOpen] = useState(false);

  // Unit detail modal
  const [unitDetail, setUnitDetail] = useState(null);

  // Data & Network state
  const [dataSource, setDataSource] = useState('GitHub Raw');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cached unit files Map: unitId -> unitJson
  const [unitCache, setUnitCache] = useState(new Map());

  // Master all-units list
  const [allMasterUnits, setAllMasterUnits] = useState([]);

  // Abilities and technologies datasets
  const [allAbilities, setAllAbilities] = useState([]);
  const [allTechnologies, setAllTechnologies] = useState([]);

  // Sync default age when archetype changes
  useEffect(() => {
    if (activeArchetype) {
      setSelectedAge(activeArchetype.defaultAge || 2);
    }
  }, [activeArchetype]);

  /**
   * Load master datasets directly from GitHub Raw endpoints:
   * 1. /civilizations/civs-index.json
   * 2. /units/all-unified.json
   */
  const loadMasterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent fetch from GitHub
      const [civsResponse, unitsResponse, abilitiesResponse, techsResponse] = await Promise.all([
        getCivilizations(),
        getAllUnifiedUnits(),
        getAllAbilities().catch(() => ({ abilities: [] })),
        getAllTechnologies().catch(() => ({ technologies: [] }))
      ]);

      setAllAbilities(abilitiesResponse.abilities || []);
      setAllTechnologies(techsResponse.technologies || []);

      const fetchedCivs = civsResponse.civs;
      const fetchedUnits = unitsResponse.units;

      setAllMasterUnits(fetchedUnits);
      setDataSource(unitsResponse.source || civsResponse.source || 'GitHub Raw');

      // Dynamically build civilizations map and archetypes from live GitHub data
      const dynamicCivs = buildCivilizationsFromGitHub(fetchedCivs);
      const dynamicArchetypes = buildDynamicArchetypes(fetchedUnits, fetchedCivs);

      setCivilizationsMap(dynamicCivs);
      setArchetypes(dynamicArchetypes);

      // Default select all civilizations fetched
      setSelectedCivs(Object.keys(dynamicCivs));

      // Pre-seed cache with units from all-unified.json
      setUnitCache(prev => {
        const next = new Map(prev);
        for (const u of fetchedUnits) {
          if (u.id) next.set(u.id, u);
        }
        return next;
      });

    } catch (err) {
      console.error('Failed to load GitHub data:', err);
      setError(`Failed to fetch AoE4 data directly from GitHub: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  /**
   * Ensure all unit files for the selected archetype are loaded
   */
  useEffect(() => {
    if (!activeArchetype) return;

    let isCancelled = false;

    async function loadArchetypeUnits() {
      const neededIds = (activeArchetype.unitIds || []).filter(id => !unitCache.has(id));
      if (!neededIds.length) return;

      try {
        setLoading(true);
        const fetchedEntries = await Promise.all(
          neededIds.map(async id => {
            try {
              const { unit, source } = await getUnifiedUnit(id);
              if (source) setDataSource(source);
              return [id, unit];
            } catch (e) {
              console.warn(`Could not fetch unit ${id}:`, e);
              return null;
            }
          })
        );

        if (!isCancelled) {
          setUnitCache(prev => {
            const next = new Map(prev);
            for (const entry of fetchedEntries) {
              if (entry) next.set(entry[0], entry[1]);
            }
            return next;
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching archetype units:', err);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadArchetypeUnits();

    return () => {
      isCancelled = true;
    };
  }, [activeArchetype, unitCache]);

  /**
   * Refresh handler
   */
  const handleRefresh = () => {
    setRefreshing(true);
    setUnitCache(new Map());
    loadMasterData();
  };

  /**
   * Civilization Filter helpers
   */
  const handleToggleCiv = (abbr) => {
    setSelectedCivs(prev => {
      const next = prev.includes(abbr) ? prev.filter(c => c !== abbr) : [...prev, abbr];
      const masterKeys = Object.keys(civilizationsMap);
      return next.sort((a, b) => masterKeys.indexOf(a) - masterKeys.indexOf(b));
    });
  };

  const handleSelectAllCivs = () => {
    setSelectedCivs(Object.keys(civilizationsMap));
  };

  const handleDeselectAllCivs = () => {
    setSelectedCivs([]);
  };

  const handleSelectExpansion = (expKey) => {
    const matched = Object.entries(civilizationsMap)
      .filter(([_, civ]) => civ.expansion === expKey)
      .map(([abbr]) => abbr);
    setSelectedCivs(matched);
  };

  /**
   * Build Columns for Comparison Matrix Table
   * Always iterates in the exact canonical order of civilizationsMap
   * so the table columns order is 100% synchronized with the filters!
   */
  const civColumns = useMemo(() => {
    if (!activeArchetype) return [];

    const columns = [];
    const lowerSearch = searchTerm.trim().toLowerCase();

    // Iterate over civilizationsMap directly to guarantee identical ordering with filter
    for (const [civAbbr, civ] of Object.entries(civilizationsMap)) {
      if (!selectedCivs.includes(civAbbr)) continue;

      const unitIds = resolveCivUnitIds(activeArchetype, civAbbr);
      for (const unitId of unitIds) {
        const unifiedUnit = unitCache.get(unitId);

        // Check if civilization actually has access to this unit
        if (!unifiedUnit || (Array.isArray(unifiedUnit.civs) && !unifiedUnit.civs.includes(civAbbr))) {
          continue; // Skip civilizations that do NOT have access to this unit type!
        }

        // Extract variation for active age - will be null if this civ does not have this unit
        const variation = extractUnitVariation(unifiedUnit, civAbbr, selectedAge);
        if (!variation) continue;

        const stats = parseUnitStats(variation, unifiedUnit);

        // Search filtering
        if (lowerSearch) {
          const matchesCiv = civ.name.toLowerCase().includes(lowerSearch) || civ.abbr.toLowerCase().includes(lowerSearch);
          const matchesUnit = stats?.name?.toLowerCase().includes(lowerSearch) || false;
          if (!matchesCiv && !matchesUnit) continue;
        }

        columns.push({
          civ,
          unit: unifiedUnit,
          unitId,
          stats
        });
      }
    }

    return columns;
  }, [selectedCivs, activeArchetype, unitCache, selectedAge, searchTerm, civilizationsMap]);

  /**
   * Compute Medians across all civilizations with this archetype at selectedAge
   * for consistent baseline benchmarking (comparing overall across units of the same type)
   */
  const medians = useMemo(() => {
    if (!activeArchetype) return {};

    const allStatsList = [];
    for (const [civAbbr] of Object.entries(civilizationsMap)) {
      const unitIds = resolveCivUnitIds(activeArchetype, civAbbr);
      for (const unitId of unitIds) {
        const unifiedUnit = unitCache.get(unitId);
        if (!unifiedUnit || (Array.isArray(unifiedUnit.civs) && !unifiedUnit.civs.includes(civAbbr))) {
          continue;
        }
        const variation = extractUnitVariation(unifiedUnit, civAbbr, selectedAge);
        if (!variation) continue;
        const stats = parseUnitStats(variation, unifiedUnit);
        if (stats) allStatsList.push(stats);
      }
    }

    return computeComparisonMedians(allStatsList);
  }, [civilizationsMap, activeArchetype, unitCache, selectedAge]);

  return (
    <div className="aoe-app">
      {/* Brand Header */}
      <Header
        dataSource={dataSource}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        unitCount={allMasterUnits.length}
        civCount={Object.keys(civilizationsMap).length}
      />

      <main className="main-content">
        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <div className="error-banner-content">
              <AlertCircle size={20} className="error-icon" />
              <div>
                <strong>Network Error:</strong> {error}
              </div>
            </div>
            <button className="btn-retry" onClick={handleRefresh}>
              <RefreshCw size={14} />
              <span>Retry Fetch</span>
            </button>
          </div>
        )}

        {/* 1. Unit Type Category Selector */}
        <CategorySelector
          archetypes={archetypes}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* 2. Interactive Controls (Age, Filter, Highlighting, Search) */}
        {activeArchetype && (
          <ControlsBar
            archetype={activeArchetype}
            selectedAge={selectedAge}
            onSelectAge={setSelectedAge}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            highlightMode={highlightMode}
            onHighlightModeChange={setHighlightMode}
            onOpenCivFilter={() => setIsCivFilterOpen(true)}
            activeCivCount={civColumns.length}
            totalCivCount={Object.keys(civilizationsMap).length}
          />
        )}

        {/* 3. Matrix Table Comparison or Skeleton Loader */}
        <div className="table-viewport-card">
          {loading && !civColumns.length ? (
            <SkeletonTable columns={selectedCivs.length || 8} rows={14} />
          ) : (
            <ComparisonMatrix
              civColumns={civColumns}
              medians={medians}
              highlightMode={highlightMode}
              onSelectUnitDetail={setUnitDetail}
              allAbilities={allAbilities}
              allTechnologies={allTechnologies}
              selectedAge={selectedAge}
              activeArchetype={activeArchetype}
              civilizationsMap={civilizationsMap}
              selectedCivs={selectedCivs}
              onToggleCiv={handleToggleCiv}
              onSelectAllCivs={handleSelectAllCivs}
              onDeselectAllCivs={handleDeselectAllCivs}
            />
          )}
        </div>
      </main>

      {/* Civilization Filter Modal */}
      {isCivFilterOpen && (
        <CivFilterModal
          civilizationsMap={civilizationsMap}
          selectedCivs={selectedCivs}
          onToggleCiv={handleToggleCiv}
          onSelectAll={handleSelectAllCivs}
          onDeselectAll={handleDeselectAllCivs}
          onSelectExpansion={handleSelectExpansion}
          onClose={() => setIsCivFilterOpen(false)}
          activeArchetype={activeArchetype}
        />
      )}

      {/* Unit Detail Modal */}
      {unitDetail && (
        <UnitDetailModal
          detail={unitDetail}
          onClose={() => setUnitDetail(null)}
          allAbilities={allAbilities}
          allTechnologies={allTechnologies}
        />
      )}

      {/* Minimalist Dark Footer */}
      <Footer />
    </div>
  );
}
