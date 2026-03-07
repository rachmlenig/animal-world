import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

interface Props {
  theme: Theme;
  onSelect: (mode: string) => void;
  onBack: () => void;
}

export default function ModePicker({ theme, onSelect, onBack }: Props) {
  const [focused, setFocused] = useState(0);
  const [zooming, setZooming] = useState<string | null>(null);

  const triggerSelect = useCallback(
    (mode: string) => {
      if (zooming) return;
      setZooming(mode);
      setTimeout(() => onSelect(mode), 700);
    },
    [zooming, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (zooming) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setFocused(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setFocused(0);
          break;
        case 'Escape':
          onBack();
          break;
        default:
          if (!e.repeat) {
            triggerSelect(focused === 0 ? 'conga' : 'feeding');
          }
          break;
      }
    },
    [focused, zooming, triggerSelect, onBack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const modes = [
    { id: 'conga', emoji: '\u{1F3B6}', title: 'Conga Parade', desc: 'Collect all your friends!' },
    { id: 'feeding', emoji: theme.food.emoji, title: 'Feeding Time', desc: 'Keep everyone happy!' },
  ];

  return (
    <div
      className="picker-screen screen-fade-in"
      style={{
        background: `linear-gradient(180deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 50%, ${theme.bgGradient[2]} 100%)`,
        pointerEvents: zooming ? 'none' : undefined,
      }}
    >
      {/* World background that zooms in */}
      <div
        className={`world-zoom-bg ${zooming ? 'world-zoom-bg-active' : ''}`}
        style={{
          backgroundImage: `url(${theme.backgroundImage})`,
          backgroundColor: theme.bgGradient[1],
        }}
      />

      <button className={`back-button ${zooming ? 'fade-out' : ''}`} onClick={onBack}>
        {'\u2B05\uFE0F'} Back
      </button>
      <h1 className={`picker-title ${zooming ? 'fade-out' : ''}`}>{theme.icon} {theme.name}</h1>
      <div className={`mode-grid ${zooming ? 'fade-out' : ''}`}>
        {modes.map((m, i) => (
          <button
            key={m.id}
            className={`mode-card ${focused === i ? 'focused' : ''}`}
            onClick={() => triggerSelect(m.id)}
            onMouseEnter={() => setFocused(i)}
          >
            <span className="mode-card-emoji">{m.emoji}</span>
            <span className="mode-card-title">{m.title}</span>
            <span className="mode-card-desc">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
