import React from 'react';
import { useDragScroll } from '../hooks/useDragScroll';

export default function QuickCivBar({
  civilizationsMap = {},
  selectedCivs = [],
  onToggleCiv,
  onSelectAllCivs,
  onDeselectAllCivs,
  activeCivCount = 0,
  archetype
}) {
  const quickCivScrollRef = useDragScroll();
  const civEntries = Object.entries(civilizationsMap);

  if (civEntries.length === 0) return null;

  return (
    <div className="quick-civ-bar">
      <div className="quick-civ-header">
        <span className="quick-civ-title">
          Quick Filter Civilizations ({activeCivCount} visible):
        </span>
        <div className="quick-civ-actions">
          <button className="quick-civ-btn" onClick={onSelectAllCivs}>Select All</button>
          <button className="quick-civ-btn" onClick={onDeselectAllCivs}>Clear</button>
        </div>
      </div>

      <div className="quick-civ-scroll" ref={quickCivScrollRef}>
        {civEntries.map(([abbr, civ]) => {
          const isSelected = selectedCivs.includes(abbr);
          const hasUnit = archetype?.civUnitMap ? !!archetype.civUnitMap[abbr] : true;

          return (
            <button
              key={abbr}
              className={`quick-civ-chip ${isSelected ? 'active' : 'inactive'} ${!hasUnit ? 'no-unit' : ''}`}
              onClick={() => onToggleCiv(abbr)}
              title={`${civ.name} (${isSelected ? 'Visible in Table' : 'Hidden'})${!hasUnit ? ' • Has no unit in this category' : ''}`}
            >
              <img 
                src={civ.flagUrl} 
                alt={civ.name || abbr} 
                className="quick-civ-flag" 
                draggable="false"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
