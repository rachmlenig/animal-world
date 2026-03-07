import { useState, useEffect, useCallback } from 'react';

export default function ModePicker({ theme, onSelect, onBack }) {
  const [focused, setFocused] = useState(0);

  const handleKeyDown = useCallback(
    (e) => {
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
            onSelect(focused === 0 ? 'conga' : 'feeding');
          }
          break;
      }
    },
    [focused, onSelect, onBack]
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
      className="picker-screen"
      style={{ background: `linear-gradient(180deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 50%, ${theme.bgGradient[2]} 100%)` }}
    >
      <button className="back-button" onClick={onBack}>
        {'\u2B05\uFE0F'} Back
      </button>
      <h1 className="picker-title">{theme.icon} {theme.name}</h1>
      <div className="mode-grid">
        {modes.map((m, i) => (
          <button
            key={m.id}
            className={`mode-card ${focused === i ? 'focused' : ''}`}
            onClick={() => onSelect(m.id)}
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
