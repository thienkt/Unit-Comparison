import React from 'react';
import { useDragScroll } from '../hooks/useDragScroll';

export default function CategorySelector({ archetypes = [], selectedCategoryId, onSelectCategory }) {
  const categoryScrollRef = useDragScroll();

  return (
    <section className="category-section">
      <div className="category-section-header">
        <h2 className="category-section-title">MILITARY UNIT CATEGORIES</h2>
        <div className="category-header-line"></div>
      </div>

      <div className="category-scroll-container" ref={categoryScrollRef}>
        <div className="category-cards-grid">
          {archetypes.map(cat => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isSelected}
                className={`category-item-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <div className="category-item-icon-box">
                  <img 
                    src={cat.icon} 
                    alt={cat.name} 
                    className="category-item-icon"
                    loading="lazy"
                    draggable="false"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="category-item-meta">
                  <span className="category-item-name">{cat.name}</span>
                  <span className="category-item-role">{cat.role}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
