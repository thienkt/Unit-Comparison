import React from 'react';

export default function Footer() {
  return (
    <footer className="aoe-footer">
      <div className="aoe-footer-inner">
        <div className="footer-brand">
          <span className="footer-title">AGE OF EMPIRES IV</span>
          <span className="footer-sep">•</span>
          <span className="footer-sub">Unit Comparison Tool</span>
        </div>
        <p className="footer-disclaimer">
          Game data sourced directly from the open-source <a href="https://github.com/aoe4world/data" target="_blank" rel="noreferrer">AoE4 World Data</a> project. Age of Empires IV is a registered trademark of Microsoft Corporation / World's Edge LLC.
        </p>
      </div>
    </footer>
  );
}
