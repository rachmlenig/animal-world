import { useState, useEffect, useCallback } from 'react';
import { THEME_LIST } from '../data/themes';
import type { Theme } from '../types';

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
          setFocused((f) => (f % 2 === 0 ? f + 1 : f));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocused((f) => (f % 2 === 1 ? f - 1 : f));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocused((f) => (f < 2 ? f + 2 : f));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocused((f) => (f >= 2 ? f - 2 : f));
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
    <div className="picker-screen screen-fade-in">
      <h1 className="picker-title">Pick Your World!</h1>
      <div className="world-grid">
        {THEME_LIST.map((theme, i) => (
          <button
            key={theme.key}
            className={`world-card ${focused === i ? 'focused' : ''}`}
            style={{ background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})` }}
            onClick={() => onSelect(theme)}
            onMouseEnter={() => setFocused(i)}
          >
            <span className="world-card-icon">{theme.icon}</span>
            <span className="world-card-name">{theme.name}</span>
            <span className="world-card-animals">
              {theme.animals.slice(0, 3).map((a) => a.emoji).join(' ')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
