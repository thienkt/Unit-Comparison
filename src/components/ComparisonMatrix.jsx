import React, { useMemo, useEffect } from 'react';
import { STAT_ROWS, getStatDifference } from '../utils/stats';
import { getAbilitiesForUnit, getTechsForUnit, summarizeAbilityEffect } from '../utils/abilitiesAndTechs';
import { Info, Sparkles } from 'lucide-react';
import { useDragScroll } from '../hooks/useDragScroll';
import QuickCivBar from './QuickCivBar';

export default function ComparisonMatrix({
  civColumns,
  medians,
  highlightMode,
  onSelectUnitDetail,
  allAbilities = [],
  allTechnologies = [],
  selectedAge = 2,
  activeArchetype,
  civilizationsMap = {},
  selectedCivs = [],
  onToggleCiv,
  onSelectAllCivs,
  onDeselectAllCivs
}) {
  const headerScrollRef = useDragScroll();
  const bodyScrollRef = useDragScroll();

  // Synchronize horizontal scrolling between sticky header table and body table
  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    let isSyncing = false;

    const syncScroll = (source, target) => {
      if (isSyncing) return;
      isSyncing = true;
      target.scrollLeft = source.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const handleBodyScroll = () => syncScroll(bodyEl, headerEl);
    const handleHeaderScroll = () => syncScroll(headerEl, bodyEl);

    bodyEl.addEventListener('scroll', handleBodyScroll, { passive: true });
    headerEl.addEventListener('scroll', handleHeaderScroll, { passive: true });

    return () => {
      bodyEl.removeEventListener('scroll', handleBodyScroll);
      headerEl.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  if (!civColumns.length) {
    return (
      <div className="empty-matrix-state">
        <p className="empty-title">No matching civilizations found</p>
        <p className="empty-desc">Try clearing the search filter or expanding your civilization selection.</p>
      </div>
    );
  }

  // Groups of stats to render
  const statGroups = [
    { id: 'costs', title: 'Resource Costs & Production' },
    { id: 'combat', title: 'Combat & Survivability' },
    { id: 'mobility', title: 'Mobility & Vision' }
  ];

  return (
    <div className="matrix-table-container">
      {/* 1. Complete Unified Sticky Header (Row 1: Quick Filter, Row 2: Headline, Row 3: Civ Cards) */}
      <div className="table-sticky-header">
        {/* Row 1: Quick Interactive Civ Toggle Strip */}
        {Object.keys(civilizationsMap).length > 0 && (
          <QuickCivBar
            civilizationsMap={civilizationsMap}
            selectedCivs={selectedCivs}
            onToggleCiv={onToggleCiv}
            onSelectAllCivs={onSelectAllCivs}
            onDeselectAllCivs={onDeselectAllCivs}
            activeCivCount={civColumns.length}
            archetype={activeArchetype}
          />
        )}

        {/* Row 2: Table Headline & Legend */}
        <div className="table-card-header">
          <div className="table-headline">
            <h3 className="matrix-title">
              {activeArchetype ? `${activeArchetype.name} Comparison Matrix` : 'Unit Comparison Matrix'}
            </h3>
            <span className="age-indicator-tag">
              Age {selectedAge === 1 ? 'I (Dark)' : selectedAge === 2 ? 'II (Feudal)' : selectedAge === 3 ? 'III (Castle)' : 'IV (Imperial)'}
            </span>
          </div>

          <div className="table-legend">
            {highlightMode === 'median' && (
              <>
                <span className="legend-item legend-green">
                  <span className="legend-dot dot-better"></span> Superior to Median ({civColumns.length} displayed)
                </span>
                <span className="legend-item legend-red">
                  <span className="legend-dot dot-worse"></span> Inferior to Median ({civColumns.length} displayed)
                </span>
              </>
            )}
            {highlightMode === 'best-worst' && (
              <>
                <span className="legend-item legend-green">
                  <span className="legend-dot dot-better"></span> Best ({civColumns.length} displayed)
                </span>
                <span className="legend-item legend-red">
                  <span className="legend-dot dot-worse"></span> Worst ({civColumns.length} displayed)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Sticky Civ Units Cards Header Row */}
        <div className="matrix-sticky-header-row" ref={headerScrollRef}>
          <table className="matrix-table header-matrix-table">
            <colgroup>
              <col style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }} />
              {civColumns.map((col, idx) => (
                <col key={idx} style={{ width: '210px', minWidth: '210px', maxWidth: '210px' }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky-col-header stat-label-col">
                  <div className="stat-label-header-inner">
                    <span className="stat-header-title">Civilization &amp; Unit</span>
                    <span className="stat-header-count">{civColumns.length} Units Active</span>
                  </div>
                </th>

                {civColumns.map(({ civ, unit, unitId, stats }) => {
                  // Calculate difference counts compared to median
                  let betterCount = 0;
                  let worseCount = 0;
                  if (medians) {
                    for (const rowDef of STAT_ROWS) {
                      if (rowDef.type !== 'number' && rowDef.type !== 'range') continue;
                      const val = stats ? stats[rowDef.key] : null;
                      const medianInfo = medians[rowDef.key];
                      if (!medianInfo || !medianInfo.hasVariation) continue;

                      const diff = getStatDifference(val, rowDef, medianInfo, highlightMode === 'off' ? 'median' : highlightMode);
                      if (diff.status === 'better') betterCount++;
                      else if (diff.status === 'worse') worseCount++;
                    }
                  }
                  const hasDifference = betterCount > 0 || worseCount > 0;
                  const diffType = betterCount > 0 && worseCount === 0 ? 'all-better' : worseCount > 0 && betterCount === 0 ? 'all-worse' : 'mixed';

                  return (
                    <th 
                      key={`${civ.abbr}-${unitId || unit?.id || stats?.name}`} 
                      className={`civ-col-header ${hasDifference ? 'header-has-diff' : ''}`}
                    >
                      <div 
                        className={`civ-header-card ${hasDifference ? `card-has-diff diff-${diffType}` : ''}`}
                        onClick={() => onSelectUnitDetail({ civ, unit, stats })}
                        title={`${civ.name} • ${stats?.name || unit?.name}${hasDifference ? ` • ${betterCount} stats superior, ${worseCount} stats inferior to median` : ' • Standard baseline stats'} • Click to inspect full unit stats`}
                        style={{
                          backgroundImage: `url(${civ.flagUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          borderLeft: `4px solid ${civ.colors.border || civ.colors.primary}`
                        }}
                      >
                        {/* Unit Portrait & Name directly over the semi-transparent flag background */}
                        <div className="unit-preview-box">
                          <div className="unit-img-frame">
                            <img 
                              src={stats?.icon || unit?.icon} 
                              alt={stats?.name || unit?.name}
                              className="unit-portrait"
                              loading="lazy"
                              draggable="false"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {stats?.isUnique && (
                              <span className="badge-unique" title="Civ-Unique Unit Replacement">
                                Unique
                              </span>
                            )}
                          </div>

                          <div className="unit-name-box">
                            <span className="unit-variant-name">{stats?.name || unit?.name || 'N/A'}</span>
                            <span className="unit-civ-name">{civ.name}</span>
                            {hasDifference && (
                              <div className={`header-diff-pill pill-${diffType}`}>
                                {betterCount > 0 && <span className="diff-pill-stat">+{betterCount}▲</span>}
                                {betterCount > 0 && worseCount > 0 && <span className="diff-pill-sep">/</span>}
                                {worseCount > 0 && <span className="diff-pill-stat">-{worseCount}▼</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* 2. Scrollable Body Table */}
      <div className="matrix-table-scroller" ref={bodyScrollRef}>
        <table className="matrix-table body-matrix-table">
          <colgroup>
            <col style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }} />
            {civColumns.map((col, idx) => (
              <col key={idx} style={{ width: '210px', minWidth: '210px', maxWidth: '210px' }} />
            ))}
          </colgroup>
          {/* Table Body: Grouped Rows */}
          <tbody>
            {statGroups.map(group => {
              const rowsInGroup = STAT_ROWS.filter(r => r.group === group.id);
              if (!rowsInGroup.length) return null;

              return (
                <React.Fragment key={group.id}>
                  {/* Section Divider Row */}
                  <tr className="group-divider-row">
                    <td colSpan={civColumns.length + 1} className="group-divider-cell">
                      <div className="group-title-wrapper">
                        <span className="group-title">{group.title}</span>
                      </div>
                    </td>
                  </tr>

                  {/* Individual Stat Rows */}
                  {rowsInGroup.map(rowDef => (
                    <tr key={rowDef.key} className="stat-row">
                      {/* Frozen Left Column: Label */}
                      <td className="sticky-col-cell stat-label-cell">
                        <div className="stat-cell-inner">
                          <div className="stat-cell-label-group">
                            {rowDef.iconImg ? (
                              <img src={rowDef.iconImg} alt="" className="stat-row-res-img" draggable="false" />
                            ) : rowDef.faIcon ? (
                              <i className={`${rowDef.faIcon} stat-row-fa-icon`} aria-hidden="true"></i>
                            ) : rowDef.icon ? (
                              <span className="stat-icon">{rowDef.icon}</span>
                            ) : null}
                            <span className="stat-label-text">{rowDef.label}</span>
                            {rowDef.unit && <span className="stat-unit-text">({rowDef.unit})</span>}
                          </div>

                          {/* Dynamic Benchmark info for archetype units */}
                          {highlightMode !== 'off' && medians?.[rowDef.key]?.hasVariation && (
                            <div className="stat-row-benchmark" title={`Calculated across all ${medians[rowDef.key].count} units in this archetype`}>
                              {highlightMode === 'median' ? (
                                <span className="benchmark-pill benchmark-median">
                                  Med: <strong>{medians[rowDef.key].median}</strong>
                                </span>
                              ) : (
                                <span className="benchmark-pill benchmark-extremes">
                                  <span className="b-best">B: {medians[rowDef.key].best}</span>
                                  <span className="b-sep">/</span>
                                  <span className="b-worst">W: {medians[rowDef.key].worst}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stat Values for Each Civ */}
                      {civColumns.map(({ civ, unit, unitId, stats }) => {
                        const val = stats ? stats[rowDef.key] : null;
                        const medianInfo = medians ? medians[rowDef.key] : null;
                        const diff = getStatDifference(val, rowDef, medianInfo, highlightMode);

                        const isHighlighted = (diff.status === 'better' || diff.status === 'worse') && Boolean(diff.badgeText);

                        return (
                          <td 
                            key={`${civ.abbr}-${unitId || unit?.id || stats?.name}`} 
                            className={`stat-value-cell ${isHighlighted ? `highlight-${diff.status}` : ''}`}
                          >
                            <div className="stat-val-wrapper">
                              {/* Value Display */}
                              <span className="main-stat-val">
                                {formatStatValue(val, rowDef, stats)}
                              </span>

                              {/* Difference Badge */}
                              {highlightMode !== 'off' && isHighlighted && diff.badgeText && (
                                <span className={`diff-badge diff-badge-${diff.status}`} title={diff.tooltip || ''}>
                                  {diff.badgeText}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
          {/* Abilities & Influences Section */}
          {allAbilities.length > 0 && (
            <tbody>
              <tr className="group-divider-row">
                <td colSpan={civColumns.length + 1} className="group-divider-cell">
                  <div className="group-title-wrapper">
                    <span className="group-title">⚡ Abilities &amp; Influences</span>
                  </div>
                </td>
              </tr>
              <tr className="stat-row">
                <td className="sticky-col-cell stat-label-cell">
                  <div className="stat-cell-inner">
                    <div className="stat-cell-label-group">
                      <i className="fa-solid fa-bolt-lightning stat-row-fa-icon" aria-hidden="true"></i>
                      <span className="stat-label-text">Abilities</span>
                    </div>
                  </div>
                </td>
                {civColumns.map(({ civ, unit, unitId, stats }) => {
                  const unitBaseId = unit?.id || unitId;
                  const unitClasses = stats?.classes || unit?.classes || stats?.displayClasses || [];
                  const abilities = getAbilitiesForUnit(unitBaseId, unitClasses, civ.abbr, selectedAge, allAbilities);
                  return (
                    <td
                      key={`${civ.abbr}-${unitId}-abilities`}
                      className="stat-value-cell ability-cell"
                    >
                      {abilities.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="ability-tags-list">
                          {abilities.map(ab => (
                            <div
                              key={ab.id}
                              className="ability-tag"
                              title={ab.description}
                            >
                              {ab.icon && (
                                <img
                                  src={ab.icon}
                                  alt={ab.name}
                                  className="ability-tag-icon"
                                  draggable="false"
                                  onError={e => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <span className="ability-tag-name">{ab.name}</span>
                              {summarizeAbilityEffect(ab) && (
                                <span className="ability-tag-effect">{summarizeAbilityEffect(ab)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          )}

          {/* Tech Upgrades Section */}
          {allTechnologies.length > 0 && (
            <tbody>
              <tr className="group-divider-row">
                <td colSpan={civColumns.length + 1} className="group-divider-cell">
                  <div className="group-title-wrapper">
                    <span className="group-title">🔬 Unique Tech Upgrades</span>
                  </div>
                </td>
              </tr>
              <tr className="stat-row">
                <td className="sticky-col-cell stat-label-cell">
                  <div className="stat-cell-inner">
                    <div className="stat-cell-label-group">
                      <i className="fa-solid fa-flask stat-row-fa-icon" aria-hidden="true"></i>
                      <span className="stat-label-text">Civ Upgrades</span>
                    </div>
                  </div>
                </td>
                {civColumns.map(({ civ, unit, unitId, stats }) => {
                  const unitBaseId = unit?.id || unitId;
                  const unitClasses = stats?.classes || unit?.classes || stats?.displayClasses || [];
                  const techs = getTechsForUnit(unitBaseId, unitClasses, civ.abbr, selectedAge, allTechnologies, true, stats?.name || unit?.name);
                  return (
                    <td
                      key={`${civ.abbr}-${unitId}-techs`}
                      className="stat-value-cell ability-cell"
                    >
                      {techs.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="ability-tags-list">
                          {techs.map(tech => (
                            <div
                              key={tech.id}
                              className={`ability-tag tech-tag age-${tech.age || 1}`}
                              title={tech.description + (tech.effectSummary?.length ? '\n' + tech.effectSummary.join('\n') : '')}
                            >
                              {tech.icon && (
                                <img
                                  src={tech.icon}
                                  alt={tech.name}
                                  className="ability-tag-icon"
                                  draggable="false"
                                  onError={e => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <div className="ability-tag-text">
                                <span className="ability-tag-name">{tech.name}</span>
                                {tech.effectSummary?.length > 0 && (
                                  <span className="ability-tag-effect">{tech.effectSummary[0]}</span>
                                )}
                              </div>
                              <span className="ability-age-pill">Age {['I','II','III','IV'][((tech.age || 1) - 1)]}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

/**
 * Format stat values for display
 */
function formatStatValue(val, rowDef, stats) {
  if (val === undefined || val === null) return '—';

  if (rowDef.key === 'age') {
    const roman = val === 1 ? 'I (Dark)' : val === 2 ? 'II (Feudal)' : val === 3 ? 'III (Castle)' : 'IV (Imperial)';
    return roman;
  }

  if (rowDef.type === 'tags') {
    if (!Array.isArray(val) || !val.length) return <span className="text-muted">None</span>;
    return (
      <div className="modifier-tags-list">
        {val.map((mod, idx) => (
          <span key={idx} className="modifier-tag">{mod}</span>
        ))}
      </div>
    );
  }

  if (rowDef.key === 'trainTime' && typeof val === 'number') {
    const mins = Math.floor(val / 60);
    const secs = Math.round(val % 60);
    const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
    return (
      <span className="res-val-badge">
        <span>{formattedTime}</span>
        {rowDef.iconImg && <img src={rowDef.iconImg} alt="Time" className="val-inline-res-img" draggable="false" />}
      </span>
    );
  }

  if (rowDef.iconImg && typeof val === 'number') {
    if (val === 0 && rowDef.key !== 'costTotal') {
      return <span className="text-muted">0</span>;
    }
    return (
      <span className="res-val-badge">
        <span>{val}</span>
        <img src={rowDef.iconImg} alt="" className="val-inline-res-img" draggable="false" />
      </span>
    );
  }

  if (rowDef.key === 'rangeMax') {
    if (val < 1.0) return 'Melee (0.3)';
    return `${stats.rangeMin || 0} - ${val}`;
  }

  if (typeof val === 'number') {
    if (val === 0 && rowDef.key.startsWith('cost') && rowDef.key !== 'costTotal') {
      return <span className="text-muted">0</span>;
    }
    return val;
  }

  return String(val);
}
