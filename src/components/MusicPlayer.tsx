import { memo } from 'react';

interface Props {
  trackName: string;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: (direction: 1 | -1) => void;
}

function MusicPlayer({ trackName, paused, onPause, onResume, onSkip }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        borderRadius: 40,
        padding: '6px 16px',
        userSelect: 'none',
      }}
    >
      <button onClick={() => onSkip(-1)} style={btnStyle} title="Previous track">
        {'\u23EE'}
      </button>
      <button
        onClick={paused ? onResume : onPause}
        style={btnStyle}
        title={paused ? 'Play' : 'Pause'}
      >
        {paused ? '\u25B6\uFE0F' : '\u23F8\uFE0F'}
      </button>
      <button onClick={() => onSkip(1)} style={btnStyle} title="Next track">
        {'\u23ED'}
      </button>
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginLeft: 4,
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {trackName}
      </span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '4px 6px',
  lineHeight: 1,
  filter: 'brightness(1.2)',
};

export default memo(MusicPlayer);
