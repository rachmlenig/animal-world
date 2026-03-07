import { memo } from 'react';

interface Props {
  count: number;
  accentColor: string;
  label?: string;
  muted?: boolean;
  onToggleMute?: () => void;
}

function HUD({ count, accentColor, label, muted, onToggleMute }: Props) {
  return (
    <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          style={{
            fontSize: '1.5rem',
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: 12,
            padding: '6px 12px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          {muted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
      )}
      <div
        style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          background: accentColor,
          padding: '8px 20px',
          borderRadius: 20,
        }}
      >
        {label === 'fed' ? '\u{1F31F}' : '\u{1F3B6}'} {count} {label === 'fed' ? 'fed' : `friend${count !== 1 ? 's' : ''}`}!
      </div>
    </div>
  );
}

export default memo(HUD);
