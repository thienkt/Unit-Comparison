import React from 'react';
import { Search, SlidersHorizontal, Eye, Flame, Sparkles } from 'lucide-react';

const AGE_LABELS = [
  { age: 1, roman: 'I', name: 'Dark' },
  { age: 2, roman: 'II', name: 'Feudal' },
  { age: 3, roman: 'III', name: 'Castle' },
  { age: 4, roman: 'IV', name: 'Imperial' }
];

export default function ControlsBar({
  archetype,
  selectedAge,
  onSelectAge,
  searchTerm,
  onSearchChange,
  highlightMode,
  onHighlightModeChange,
  onOpenCivFilter,
  activeCivCount,
  totalCivCount
}) {
  const availableAges = archetype.availableAges || [1, 2, 3, 4];

  return (
    <div className="controls-container">
      {/* Archetype Description & Role Banner */}
      <div className="archetype-banner">
        <div className="archetype-badge">
          <Sparkles size={16} className="sparkle-icon" />
          <span>Active Class: <strong>{archetype.name}</strong> ({archetype.role})</span>
        </div>
        <p className="archetype-desc">{archetype.description}</p>
      </div>

      {/* Interactive Controls Row */}
      <div className="controls-bar">
        {/* Age Selector */}
        <div className="control-group age-selector-group">
          <label className="control-label">Age Era:</label>
          <div className="age-pill-group">
            {AGE_LABELS.map(({ age, roman, name }) => {
              const isAvailable = availableAges.includes(age);
              const isActive = selectedAge === age;
              return (
                <button
                  key={age}
                  className={`btn-age ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  onClick={() => onSelectAge(age)}
                  title={isAvailable ? `Age ${roman} - ${name} Age` : `Not typically standard for this unit class`}
                >
                  <span className="age-roman">{roman}</span>
                  <span className="age-name">{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Civ Filter Trigger */}
        <div className="control-group">
          <label className="control-label">Civilizations:</label>
          <button className="btn-filter-civs" onClick={onOpenCivFilter}>
            <SlidersHorizontal size={15} />
            <span>Filter Civs ({activeCivCount}/{totalCivCount})</span>
          </button>
        </div>

        {/* Highlight Difference Selector */}
        <div className="control-group">
          <label className="control-label">Highlight Stats:</label>
          <div className="highlight-pill-group">
            <button
              className={`btn-highlight ${highlightMode === 'median' ? 'active' : ''}`}
              onClick={() => onHighlightModeChange('median')}
              title="Highlight higher (green) or lower (red) compared to overall category median"
            >
              <Eye size={14} />
              <span>vs Median</span>
            </button>
            <button
              className={`btn-highlight ${highlightMode === 'best-worst' ? 'active' : ''}`}
              onClick={() => onHighlightModeChange('best-worst')}
              title="Highlight best (green) and worst (red) value across this unit class"
            >
              <Flame size={14} />
              <span>Best / Worst</span>
            </button>
            <button
              className={`btn-highlight ${highlightMode === 'off' ? 'active' : ''}`}
              onClick={() => onHighlightModeChange('off')}
              title="Turn off stat color highlighting"
            >
              <span>Off</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="control-group search-group">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search civ or unit..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
