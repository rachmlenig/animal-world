import { memo } from 'react';

function HUD({ count, accentColor, label }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 24,
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: `0 2px 4px rgba(0,0,0,0.3)`,
        background: accentColor,
        padding: '8px 20px',
        borderRadius: 20,
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {label === 'fed' ? '\u{1F31F}' : '\u{1F3B6}'} {count} {label === 'fed' ? 'fed' : `friend${count !== 1 ? 's' : ''}`}!
    </div>
  );
}

export default memo(HUD);
