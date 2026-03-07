import { useState, useCallback } from 'react';
import WorldPicker from './screens/WorldPicker';
import ModePicker from './screens/ModePicker';
import CongaMode from './modes/CongaMode';
import FeedingMode from './modes/FeedingMode';
import type { Theme } from './types';
import './App.css';

type Screen = 'worldPicker' | 'modePicker' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('worldPicker');
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const goHome = useCallback(() => {
    setScreen('worldPicker');
    setTheme(null);
    setMode(null);
  }, []);

  const selectTheme = useCallback((t: Theme) => {
    setTheme(t);
    setScreen('modePicker');
  }, []);

  const selectMode = useCallback((m: string) => {
    setMode(m);
    setScreen('game');
  }, []);

  const goBackToWorlds = useCallback(() => {
    setScreen('worldPicker');
    setTheme(null);
  }, []);

  if (screen === 'worldPicker') {
    return <WorldPicker onSelect={selectTheme} />;
  }

  if (screen === 'modePicker' && theme) {
    return <ModePicker theme={theme} onSelect={selectMode} onBack={goBackToWorlds} />;
  }

  if (screen === 'game' && theme) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
        <button className="home-button" onClick={goHome}>
          {'\u{1F3E0}'} Home
        </button>
        {mode === 'conga'
          ? <CongaMode key={theme.key} theme={theme} />
          : <FeedingMode key={theme.key} theme={theme} />
        }
      </div>
    );
  }

  return <WorldPicker onSelect={selectTheme} />;
}
