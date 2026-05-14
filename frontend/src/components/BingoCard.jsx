import React from 'react';
const COLS = ['B','I','N','G','O'];
export default function BingoCard({ grid, drawn = [], lastDrawn = null }) {
  if (!grid) return null;
  const drawnSet = new Set(drawn);
  return (
    <div>
      {/* Headers */}
      <div className="grid grid-cols-5 gap-1 mb-1">
        {COLS.map(c=><div key={c} className={`bingo-header ${c}`}>{c}</div>)}
      </div>
      {/* Grid — grid[col][row] */}
      <div className="grid grid-cols-5 gap-1">
        {[0,1,2,3,4].map(row =>
          [0,1,2,3,4].map(col => {
            const num = grid[col][row];
            const isFree = num === 0;
            const isMarked = isFree || drawnSet.has(num);
            const isJust = num === lastDrawn;
            const classes = `bingo-cell ${isMarked?'marked':''} ${isFree?'free':''} ${isJust?'just-drawn':''}`;
            return (
              <div key={`${col}-${row}`} className={classes}>
                {isFree ? '⭐' : num}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
