import React from 'react';
import { X, Shield, Swords, Zap, Clock, Coins, Layers } from 'lucide-react';
import { RESOURCE_ICONS } from '../utils/stats';
import { getAbilitiesForUnit, getTechsForUnit, summarizeAbilityEffect } from '../utils/abilitiesAndTechs';

export default function UnitDetailModal({ detail, onClose, allAbilities = [], allTechnologies = [] }) {
  if (!detail) return null;
  const { civ, unit, stats } = detail;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div 
          className="modal-header"
          style={{
            background: `linear-gradient(135deg, ${civ.colors.primary} 0%, rgba(15, 23, 42, 0.98) 100%)`,
            borderBottomColor: civ.colors.border
          }}
        >
          <div className="modal-header-left">
            <div className="modal-civ-flag-frame">
              <img 
                src={civ.flagUrl} 
                alt={`${civ.name} flag`} 
                className="modal-civ-flag-img"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="modal-civ-title">
                {civ.name}
              </div>
              <h3 className="modal-unit-name">
                {stats?.name || unit?.name}
                {stats?.isUnique && <span className="modal-badge-unique">Civ Unique</span>}
              </h3>
            </div>
          </div>

          <button className="btn-modal-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top overview row */}
          <div className="modal-overview-grid">
            <div className="modal-portrait-frame">
              <img 
                src={stats?.icon || unit?.icon} 
                alt={stats?.name} 
                className="modal-unit-img"
              />
            </div>
            <div className="modal-desc-box">
              <h4 className="modal-section-title">Tactical Overview</h4>
              <p className="modal-desc-text">
                {stats?.description || unit?.description || 'No detailed description available.'}
              </p>
              <div className="modal-classes-list">
                {stats?.displayClasses?.map((cls, i) => (
                  <span key={i} className="modal-class-pill">{cls}</span>
                ))}
              </div>
            </div>
          </div>

          {/* In-game Resource Costs Section */}
          <div className="modal-costs-section">
            <div className="modal-costs-title">Costs</div>
            <div className="modal-costs-row">
              {stats?.costFood > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">{stats.costFood}</span>
                  <img src={RESOURCE_ICONS.food} alt="Food" className="modal-res-icon" draggable="false" />
                </div>
              )}
              {stats?.costWood > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">{stats.costWood}</span>
                  <img src={RESOURCE_ICONS.wood} alt="Wood" className="modal-res-icon" draggable="false" />
                </div>
              )}
              {stats?.costGold > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">{stats.costGold}</span>
                  <img src={RESOURCE_ICONS.gold} alt="Gold" className="modal-res-icon" draggable="false" />
                </div>
              )}
              {stats?.costStone > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">{stats.costStone}</span>
                  <img src={RESOURCE_ICONS.stone} alt="Stone" className="modal-res-icon" draggable="false" />
                </div>
              )}
              {stats?.trainTime > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">
                    {Math.floor(stats.trainTime / 60)}:{Math.round(stats.trainTime % 60).toString().padStart(2, '0')}
                  </span>
                  <img src={RESOURCE_ICONS.time} alt="Train Time" className="modal-res-icon" draggable="false" />
                </div>
              )}
              {stats?.popcap !== undefined && stats?.popcap > 0 && (
                <div className="modal-cost-item">
                  <span className="cost-num">{stats.popcap}</span>
                  <img src={RESOURCE_ICONS.popcap} alt="Population" className="modal-res-icon" draggable="false" />
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid with in-game icons */}
          <div className="modal-stats-grid">
            <div className="modal-stat-card">
              <span className="modal-stat-label">
                <i className="fa-solid fa-heart text-hp" aria-hidden="true"></i> Hitpoints
              </span>
              <span className="modal-stat-val text-hp">{stats?.hitpoints} HP</span>
            </div>
            <div className="modal-stat-card">
              <span className="modal-stat-label">
                <i className="fa-solid fa-shield text-armor" aria-hidden="true"></i> Armor (Melee / Ranged)
              </span>
              <span className="modal-stat-val text-armor">{stats?.meleeArmor} / {stats?.rangedArmor}</span>
            </div>
            <div className="modal-stat-card">
              <span className="modal-stat-label">
                <i className="fa-solid fa-bolt text-dps" aria-hidden="true"></i> DPS
              </span>
              <span className="modal-stat-val text-dps">{stats?.dps}</span>
            </div>
            <div className="modal-stat-card">
              <span className="modal-stat-label">
                <i className="fa-solid fa-person-running text-speed" aria-hidden="true"></i> Speed
              </span>
              <span className="modal-stat-val text-speed">{stats?.moveSpeed} tiles/s</span>
            </div>
          </div>

          {/* Weapons Breakdown */}
          <div className="modal-section">
            <h4 className="modal-section-title">
              <Swords size={16} />
              <span>Weapons & Combat Attacks</span>
            </h4>

            <div className="modal-weapons-list">
              {stats?.allWeapons?.map((wp, idx) => {
                const wDps = wp.speed > 0 ? (wp.damage / wp.speed).toFixed(1) : 0;
                return (
                  <div key={idx} className="weapon-card">
                    <div className="weapon-header">
                      <span className="weapon-name">{wp.name}</span>
                      <span className="weapon-type-pill">{wp.type}</span>
                    </div>

                    <div className="weapon-stats-row">
                      <div className="wp-stat">
                        <span className="wp-label">Damage:</span>
                        <span className="wp-val">{wp.damage}</span>
                      </div>
                      <div className="wp-stat">
                        <span className="wp-label">Attack Speed:</span>
                        <span className="wp-val">{wp.speed}s</span>
                      </div>
                      <div className="wp-stat">
                        <span className="wp-label">DPS:</span>
                        <span className="wp-val">{wDps}</span>
                      </div>
                      <div className="wp-stat">
                        <span className="wp-label">Range:</span>
                        <span className="wp-val">
                          {wp.range?.max < 1 ? 'Melee' : `${wp.range?.min || 0} - ${wp.range?.max}`}
                        </span>
                      </div>
                    </div>

                    {/* Weapon attack durations */}
                    {wp.durations && (
                      <div className="weapon-durations-row">
                        <span className="dur-label">Attack Timings:</span>
                        <span className="dur-item">Windup: {wp.durations.windup}s</span>
                        <span className="dur-item">Attack: {wp.durations.attack}s</span>
                        <span className="dur-item">Winddown: {wp.durations.winddown}s</span>
                        <span className="dur-item">Cooldown: {wp.durations.cooldown}s</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Production Buildings */}
          {stats?.producedBy?.length > 0 && (
            <div className="modal-section">
              <h4 className="modal-section-title">
                <Layers size={16} />
                <span>Produced In</span>
              </h4>
              <div className="produced-by-tags">
                {stats.producedBy.map((b, i) => (
                  <span key={i} className="building-tag">{b.replace(/-/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}

          {/* Abilities & Influences Section */}
          {(() => {
            const unitBaseId = unit?.id;
            const unitClasses = stats?.classes || unit?.classes || stats?.displayClasses || [];
            const abilities = getAbilitiesForUnit(unitBaseId, unitClasses, civ.abbr, stats?.age || 2, allAbilities);
            if (!abilities.length) return null;
            return (
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <i className="fa-solid fa-bolt-lightning" aria-hidden="true" style={{ fontSize: '0.9rem', color: '#fbbf24' }}></i>
                  <span>Abilities &amp; Influences</span>
                </h4>
                <div className="modal-bonus-list">
                  {abilities.map(ab => (
                    <div key={ab.id} className="modal-bonus-card modal-ability-card">
                      {ab.icon && (
                        <div className="modal-bonus-icon-frame">
                          <img
                            src={ab.icon}
                            alt={ab.name}
                            className="modal-bonus-icon"
                            draggable="false"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="modal-bonus-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                          <span className="modal-bonus-name">{ab.name}</span>
                          {summarizeAbilityEffect(ab) && (
                            <span className="ability-tag-effect" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                              {summarizeAbilityEffect(ab)}
                            </span>
                          )}
                        </div>
                        <span className="modal-bonus-desc">{ab.description}</span>
                      </div>
                      {ab.active === 'always' && (
                        <span className="modal-bonus-badge badge-passive">Passive</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Unique Tech Upgrades Section */}
          {(() => {
            const unitBaseId = unit?.id;
            const unitClasses = stats?.classes || unit?.classes || stats?.displayClasses || [];
            const techs = getTechsForUnit(unitBaseId, unitClasses, civ.abbr, stats?.age || 2, allTechnologies, true, stats?.name || unit?.name);
            if (!techs.length) return null;
            return (
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <i className="fa-solid fa-flask" aria-hidden="true" style={{ fontSize: '0.9rem', color: '#a78bfa' }}></i>
                  <span>Unique Upgrades &amp; Bonuses</span>
                </h4>
                <div className="modal-bonus-list">
                  {techs.map(tech => (
                    <div key={tech.id} className={`modal-bonus-card modal-tech-card`}>
                      {tech.icon && (
                        <div className="modal-bonus-icon-frame">
                          <img
                            src={tech.icon}
                            alt={tech.name}
                            className="modal-bonus-icon"
                            draggable="false"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="modal-bonus-content">
                        <span className="modal-bonus-name">{tech.name}</span>
                        <span className="modal-bonus-desc">{tech.description}</span>
                        {tech.effectSummary?.length > 0 && (
                          <div className="modal-tech-effects">
                            {tech.effectSummary.map((eff, i) => (
                              <span key={i} className="modal-tech-effect-pill">{eff}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="modal-bonus-badge badge-age">
                        Age {['I','II','III','IV'][((tech.age || 1) - 1)]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
