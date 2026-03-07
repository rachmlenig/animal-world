import { useState, useEffect, useCallback } from 'react';
import { THEME_LIST } from '../data/themes';
import type { Theme } from '../types';

const CARD_GRADIENTS: Record<string, string> = {
  farm: 'linear-gradient(160deg, #fbbf24 0%, #84cc16 100%)',
  safari: 'linear-gradient(160deg, #f59e0b 0%, #d97706 100%)',
  ocean: 'linear-gradient(160deg, #38bdf8 0%, #1d4ed8 100%)',
  forest: 'linear-gradient(160deg, #4ade80 0%, #166534 100%)',
};

interface Props {
  onSelect: (theme: Theme) => void;
}

export default function WorldPicker({ onSelect }: Props) {
  const [focused, setFocused] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocused((f) => Math.min(f + 1, THEME_LIST.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocused((f) => Math.max(f - 1, 0));
          break;
        default:
          if (!e.repeat) {
            onSelect(THEME_LIST[focused]!);
          }
          break;
      }
    },
    [focused, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="picker-screen picker-screen-landing screen-fade-in">
      <div className="stars" />

      <h1 className="picker-title">{'\u{1F30D}'} Pick Your World!</h1>

      <div className="carousel-wrap">
        {THEME_LIST.map((theme, i) => (
          <button
            key={theme.key}
            className={`world-card ${focused === i ? 'focused' : ''}`}
            style={{ background: CARD_GRADIENTS[theme.key] }}
            onClick={() => onSelect(theme)}
            onMouseEnter={() => setFocused(i)}
          >
            <div className="card-shine" />
            <div className="label-tag">{theme.key.toUpperCase()}</div>
            <div className="card-inner">
              <span className="card-emoji-hero">{theme.icon}</span>
              <div className="card-title">{theme.name}</div>
              <div className="card-friends">
                {theme.animals.slice(0, 3).map((a, j) => (
                  <span key={j}>{a.emoji}</span>
                ))}
              </div>
              <div className="card-btn">Play →</div>
            </div>
          </button>
        ))}
      </div>

      <div className="dots">
        {THEME_LIST.map((_, i) => (
          <div key={i} className={`dot ${focused === i ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
