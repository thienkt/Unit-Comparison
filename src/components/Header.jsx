import React from 'react';
import { RefreshCw, Database, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export default function Header({ dataSource, isRefreshing, onRefresh, unitCount, civCount }) {
  return (
    <header className="aoe-header-container">
      {/* Sticky Clean Navbar */}
      <nav className="aoe-navbar">
        <div className="aoe-navbar-inner">
          <div className="aoe-brand-lockup">
            <div className="aoe-brand-title">
              <span className="aoe-title-main">AGE OF EMPIRES</span>
              <span className="aoe-roman-numeral">IV</span>
            </div>
            <span className="aoe-brand-divider">|</span>
            <span className="aoe-brand-tagline">UNIT COMPARISON MATRIX</span>
          </div>

          <div className="aoe-nav-actions">
            <div className="nav-stat-chip" title="Active Civilizations">
              <ShieldCheck size={14} className="accent-gold" />
              <span><strong>{civCount || 25}</strong> Civs</span>
            </div>

            <div className="nav-stat-chip" title="Unified Units Loaded">
              <Sparkles size={14} className="accent-gold" />
              <span><strong>{unitCount || 244}</strong> Units</span>
            </div>

            <a 
              href="https://github.com/aoe4world/data" 
              target="_blank" 
              rel="noreferrer" 
              className="nav-link-btn"
              title="AoE4 World Open Data GitHub Repository"
            >
              <Database size={13} />
              <span>GitHub Data</span>
              <ExternalLink size={11} className="external-icon" />
            </a>

            <button 
              className={`btn-sync-data ${isRefreshing ? 'spinning' : ''}`}
              onClick={onRefresh}
              title="Refresh data directly from GitHub Raw endpoints"
              disabled={isRefreshing}
            >
              <RefreshCw size={13} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Tasteful Medieval Hero Banner */}
      <div className="aoe-hero-strip">
        <div className="aoe-hero-texture"></div>
        <div className="aoe-hero-inner">
          <div className="hero-text-block">
            <h1 className="hero-title">MILITARY UNIT COMPARISON</h1>
            <p className="hero-subtitle">
              Cross-civilization combat statistics, armor values, attack speeds, and tactical bonuses from Age of Empires IV.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
