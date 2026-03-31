import { memo } from 'react';

interface Props {
  onResume: () => void;
  onHome: () => void;
  muted: boolean;
  onToggleMute: () => void;
  trackName: string;
  musicPaused: boolean;
  onMusicPause: () => void;
  onMusicResume: () => void;
  onSkip: (direction: 1 | -1) => void;
}

function PauseOverlay({
  onResume,
  onHome,
  muted,
  onToggleMute,
  trackName,
  musicPaused,
  onMusicPause,
  onMusicResume,
  onSkip,
}: Props) {
  return (
    <div
      onClick={onResume}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 28,
          padding: '32px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          minWidth: 260,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <span style={{ fontSize: '2.4rem' }}>{'\u23F8\uFE0F'}</span>
        <span style={{
          fontFamily: "'Baloo 2', cursive",
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#333',
        }}>
          Paused
        </span>

        {/* Music controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0, 0, 0, 0.06)',
          borderRadius: 20,
          padding: '8px 16px',
        }}>
          <button onClick={() => onSkip(-1)} style={controlBtn} title="Previous">
            {'\u23EE\uFE0F'}
          </button>
          <button
            onClick={musicPaused ? onMusicResume : onMusicPause}
            style={controlBtn}
            title={musicPaused ? 'Play music' : 'Pause music'}
          >
            {musicPaused ? '\u25B6\uFE0F' : '\u23F8\uFE0F'}
          </button>
          <button onClick={() => onSkip(1)} style={controlBtn} title="Next">
            {'\u23ED\uFE0F'}
          </button>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#555',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginLeft: 4,
          }}>
            {trackName}
          </span>
        </div>

        {/* Sound toggle */}
        <button onClick={onToggleMute} style={actionBtn}>
          {muted ? '\u{1F507}' : '\u{1F50A}'}{' '}
          {muted ? 'Sound Off' : 'Sound On'}
        </button>

        {/* Home */}
        <button onClick={onHome} style={actionBtn}>
          {'\u{1F3E0}'} Home
        </button>

        {/* Resume */}
        <button
          onClick={onResume}
          style={{
            ...actionBtn,
            background: '#4ECDC4',
            color: '#fff',
            fontSize: '1.1rem',
            padding: '12px 32px',
          }}
        >
          {'\u25B6\uFE0F'} Resume
        </button>
      </div>
    </div>
  );
}

const controlBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.3rem',
  cursor: 'pointer',
  padding: '4px 6px',
  lineHeight: 1,
};

const actionBtn: React.CSSProperties = {
  width: '100%',
  padding: '10px 20px',
  borderRadius: 14,
  border: 'none',
  background: 'rgba(0, 0, 0, 0.07)',
  fontSize: '1rem',
  fontWeight: 700,
  fontFamily: "'Baloo 2', cursive",
  color: '#333',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

export default memo(PauseOverlay);
