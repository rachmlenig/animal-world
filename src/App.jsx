import { useState } from 'react';
import THEMES from './data/themes';
import CongaMode from './modes/CongaMode';
import FeedingMode from './modes/FeedingMode';
import './App.css';

const theme = THEMES.farm;

export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return (
      <div
        className="game-area"
        style={{
          background: `linear-gradient(180deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 50%, ${theme.bgGradient[2]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        <button className="mode-card" onClick={() => setMode('conga')}>
          <span className="mode-card-emoji">{'\u{1F3B6}'}</span>
          <span className="mode-card-title">Conga Parade</span>
          <span className="mode-card-desc">Collect all your friends!</span>
        </button>
        <button className="mode-card" onClick={() => setMode('feeding')}>
          <span className="mode-card-emoji">{theme.food.emoji}</span>
          <span className="mode-card-title">Feeding Time</span>
          <span className="mode-card-desc">Keep everyone happy!</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <button
        onClick={() => setMode(null)}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 100,
          fontSize: '1.5rem',
          background: 'rgba(255,255,255,0.8)',
          border: 'none',
          borderRadius: 12,
          padding: '6px 16px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {'\u{1F3E0}'} Home
      </button>
      {mode === 'conga' ? <CongaMode theme={theme} /> : <FeedingMode theme={theme} />}
    </div>
  );
}
