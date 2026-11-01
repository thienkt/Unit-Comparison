import React from 'react';

export default function SkeletonTable({ columns = 8, rows = 12 }) {
  return (
    <div className="skeleton-table-container">
      <div className="skeleton-loader-bar">
        <div className="skeleton-spinner"></div>
        <span>Fetching live unified unit datasets directly from GitHub...</span>
      </div>

      <div className="matrix-table-scroller">
        <table className="matrix-table skeleton-table">
          <colgroup>
            <col style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }} />
            {Array.from({ length: columns }).map((_, i) => (
              <col key={i} style={{ width: '210px', minWidth: '210px', maxWidth: '210px' }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky-col-header stat-label-col">
                <div className="skeleton-shimmer skeleton-header-box"></div>
              </th>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="civ-col-header">
                  <div className="skeleton-shimmer skeleton-civ-card"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="stat-row">
                <td className="sticky-col-cell stat-label-cell">
                  <div className="skeleton-shimmer skeleton-label-line"></div>
                </td>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="stat-value-cell">
                    <div className="skeleton-shimmer skeleton-cell-line"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
