import { useRef, useCallback, useState } from 'react';
import type { AnimalData } from '../types';

const MIN_INTERVAL = 50;

export default function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainNodeRef.current = ctxRef.current.createGain();
      gainNodeRef.current.gain.value = mutedRef.current ? 0 : 1;
      gainNodeRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = next ? 0 : 1;
      }
      return next;
    });
  }, []);

  const playSound = useCallback((animal: AnimalData) => {
    if (mutedRef.current) return;
    const now = performance.now();
    if (now - lastPlayRef.current < MIN_INTERVAL) return;
    lastPlayRef.current = now;

    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = animal.type;
    osc.frequency.setValueAtTime(animal.freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      animal.freq * 0.7,
      ctx.currentTime + 0.3
    );

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(gainNodeRef.current!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, [ensureContext]);

  const playCelebration = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensureContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.1;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      osc.connect(gain);
      gain.connect(gainNodeRef.current!);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }, [ensureContext]);

  return { playSound, playCelebration, ensureContext, muted, toggleMute };
}
