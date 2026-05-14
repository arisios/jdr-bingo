import React from 'react';

const SIZES = {
  sm:  { juninas: 22, rio: 13, sub: 9,  gap: 1 },
  md:  { juninas: 32, rio: 19, sub: 11, gap: 2 },
  lg:  { juninas: 48, rio: 28, sub: 13, gap: 3 },
  xl:  { juninas: 72, rio: 42, sub: 16, gap: 5 },
  '2xl':{ juninas:100, rio: 58, sub: 18, gap: 6 },
};

export default function BrandMark({ size = 'md', dark = false, showSub = true }) {
  const s = SIZES[size] || SIZES.md;
  const textColor = dark ? 'rgba(255,255,255,0.95)' : '#4B1E6D';
  const accentColor = dark ? '#C79A3B' : '#C21874';
  const subColor = dark ? 'rgba(199,154,59,0.85)' : '#C79A3B';

  return (
    <div style={{ textAlign: 'center', lineHeight: 1, userSelect: 'none' }}>
      <div style={{
        fontFamily: 'Edmund, Georgia, serif',
        fontSize: s.juninas,
        color: accentColor,
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}>
        Juninas
      </div>
      <div style={{
        fontFamily: 'Edmund, Georgia, serif',
        fontSize: s.rio,
        color: textColor,
        letterSpacing: '0.12em',
        lineHeight: 1,
        marginTop: s.gap,
        textTransform: 'uppercase',
      }}>
        do Rio
      </div>
      {showSub && (
        <div style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: s.sub,
          fontWeight: 800,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: subColor,
          marginTop: s.gap * 2.5,
        }}>
          Bingo · 2026
        </div>
      )}
    </div>
  );
}
