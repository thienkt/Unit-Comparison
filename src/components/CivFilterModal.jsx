import React, { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Filter, Search, Check, Sparkles } from 'lucide-react';
import { EXPANSIONS } from '../data/civs';

export default function CivFilterModal({
  civilizationsMap = {},
  selectedCivs,
  onToggleCiv,
  onSelectAll,
  onDeselectAll,
  onSelectExpansion,
  onClose,
  activeArchetype
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailableUnits, setOnlyAvailableUnits] = useState(false);

  const allCivEntries = useMemo(() => Object.entries(civilizationsMap), [civilizationsMap]);

  // Filter civs by search query and unit availability
  const filteredCivEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allCivEntries.filter(([abbr, civ]) => {
      // Filter by unit access
      if (onlyAvailableUnits && activeArchetype?.civUnitMap) {
        if (!activeArchetype.civUnitMap[abbr]) return false;
      }

      // Filter by search query
      if (q) {
        const matchName = civ.name.toLowerCase().includes(q);
        const matchAbbr = abbr.toLowerCase().includes(q);
        const matchExp = (civ.expansionLabel || civ.expansion || '').toLowerCase().includes(q);
        if (!matchName && !matchAbbr && !matchExp) return false;
      }

      return true;
    });
  }, [allCivEntries, searchQuery, onlyAvailableUnits, activeArchetype]);

  // Bulk actions for visible filtered list
  const handleSelectFiltered = () => {
    const visibleAbbrs = filteredCivEntries.map(([abbr]) => abbr);
    const newSelected = Array.from(new Set([...selectedCivs, ...visibleAbbrs]));
    visibleAbbrs.forEach(abbr => {
      if (!selectedCivs.includes(abbr)) {
        onToggleCiv(abbr);
      }
    });
  };

  const handleDeselectFiltered = () => {
    const visibleAbbrs = filteredCivEntries.map(([abbr]) => abbr);
    visibleAbbrs.forEach(abbr => {
      if (selectedCivs.includes(abbr)) {
        onToggleCiv(abbr);
      }
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card civ-filter-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <Filter size={20} className="text-gold" />
            <div>
              <h3 className="modal-title">Civilization Filter</h3>
              <p className="modal-subtitle">Filter civilizations displayed in the matrix comparison table</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search & Unit Access Filter Controls */}
        <div className="civ-modal-toolbar">
          <div className="civ-modal-search-wrapper">
            <Search size={15} className="civ-modal-search-icon" />
            <input
              type="text"
              placeholder="Search civilization by name, code (EN, FR, SEN), or DLC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="civ-modal-search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {activeArchetype && (
            <label className="civ-modal-toggle-label">
              <input 
                type="checkbox"
                checked={onlyAvailableUnits}
                onChange={(e) => setOnlyAvailableUnits(e.target.checked)}
                className="civ-modal-toggle-checkbox"
              />
              <span className="civ-modal-toggle-custom"></span>
              <span className="civ-modal-toggle-text">
                Only show civs with <strong>{activeArchetype.name}</strong>
              </span>
            </label>
          )}
        </div>

        {/* Expansion Presets */}
        <div className="expansion-filter-row">
          <div className="expansion-header-row">
            <span className="expansion-filter-label">Quick Select by Expansion:</span>
            <div className="filtered-batch-actions">
              <button className="btn-preset btn-preset-action" onClick={handleSelectFiltered}>
                Select Filtered ({filteredCivEntries.length})
              </button>
              <button className="btn-preset btn-preset-action" onClick={handleDeselectFiltered}>
                Deselect Filtered
              </button>
            </div>
          </div>

          <div className="expansion-buttons">
            <button className="btn-preset" onClick={onSelectAll}>
              All Civs ({allCivEntries.length})
            </button>
            <button className="btn-preset" onClick={onDeselectAll}>
              Clear All
            </button>
            {Object.entries(EXPANSIONS).map(([expKey, exp]) => (
              <button
                key={expKey}
                className="btn-preset"
                style={{ borderColor: exp.color }}
                onClick={() => onSelectExpansion(expKey)}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Civ Grid */}
        <div className="civ-selection-grid">
          {filteredCivEntries.length === 0 ? (
            <div className="empty-filter-state">
              <p>No civilizations match your search filter "{searchQuery}"</p>
            </div>
          ) : (
            filteredCivEntries.map(([abbr, civ]) => {
              const isChecked = selectedCivs.includes(abbr);
              const hasUnitInArchetype = activeArchetype?.civUnitMap ? !!activeArchetype.civUnitMap[abbr] : true;

              return (
                <label 
                  key={abbr} 
                  className={`civ-checkbox-card ${isChecked ? 'selected' : ''} ${!hasUnitInArchetype ? 'civ-no-unit' : ''}`}
                  style={{
                    '--civ-primary': civ.colors.primary,
                    '--civ-border': civ.colors.border
                  }}
                  title={!hasUnitInArchetype ? `${civ.name} has no unit in ${activeArchetype?.name}` : civ.name}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => onToggleCiv(abbr)}
                    className="civ-checkbox-hidden"
                  />
                  <span className="civ-check-icon">
                    {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                  </span>
                  <div className="civ-card-flag-frame">
                    <img 
                      src={civ.flagUrl} 
                      alt={civ.name} 
                      className="civ-card-flag-img" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="civ-card-name-group">
                    <span className="civ-card-name">{civ.name}</span>
                  </div>
                  {!hasUnitInArchetype && (
                    <span className="civ-no-unit-tag" title="No unit in active category">No Unit</span>
                  )}
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="footer-summary">
            <strong>{selectedCivs.length}</strong> of {allCivEntries.length} civilizations selected ({filteredCivEntries.length} shown)
          </span>
          <button className="btn-done" onClick={onClose}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
