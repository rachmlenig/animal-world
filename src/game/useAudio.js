import { useRef, useCallback } from 'react';

const MIN_INTERVAL = 50; // ms between sounds

export default function useAudio() {
  const ctxRef = useRef(null);
  const lastPlayRef = useRef(0);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playSound = useCallback((animal) => {
    const now = performance.now();
    if (now - lastPlayRef.current < MIN_INTERVAL) return;
    lastPlayRef.current = now;

    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = animal.type;
    osc.frequency.setValueAtTime(animal.freq, ctx.currentTime);
    // Quick pitch bend down for character
    osc.frequency.exponentialRampToValueAtTime(
      animal.freq * 0.7,
      ctx.currentTime + 0.3
    );

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, [ensureContext]);

  return { playSound, ensureContext };
}
