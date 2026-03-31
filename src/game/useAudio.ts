import { useRef, useCallback, useState, useEffect } from 'react';
import type { AnimalData } from '../types';

const MIN_INTERVAL = 50;

const PLAYLIST = [
  { url: '/pixel-daydream-groove.mp3', name: 'Daydream Groove' },
  { url: '/pixel-waves-at-low-tide-2.mp3', name: 'Pixel Waves 2' },
  { url: '/pixel-drift.mp3', name: 'Pixel Drift' },
  { url: '/pixel-skies.mp3', name: 'Skies' },
  { url: '/pixel-waves-at-low-tide.mp3', name: 'Low Tide' },
  { url: '/song.m4a', name: 'Song' },
  { url: '/pixel-lemonade.mp3', name: 'Pixel Lemonade' },
];

export default function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [trackName, setTrackName] = useState(PLAYLIST[0]!.name);
  const [paused, setPaused] = useState(false);

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
      if (audioElRef.current) {
        audioElRef.current.volume = next ? 0 : 0.3;
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

  const playTrack = useCallback((index: number) => {
    const idx = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    trackIndexRef.current = idx;
    const track = PLAYLIST[idx]!;
    setTrackName(track.name);
    setPaused(false);

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.removeAttribute('src');
      audioElRef.current.load();
    }

    const audio = new Audio(track.url);
    audio.volume = mutedRef.current ? 0 : 0.3;
    audio.onended = () => {
      playTrack(idx + 1);
    };
    audioElRef.current = audio;
    audio.play();
  }, []);

  const startMusic = useCallback(() => {
    playTrack(trackIndexRef.current);
  }, [playTrack]);

  const stopMusic = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.removeAttribute('src');
      audioElRef.current.load();
      audioElRef.current = null;
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      setPaused(true);
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.play();
      setPaused(false);
    }
  }, []);

  const skipTrack = useCallback((direction: 1 | -1) => {
    playTrack(trackIndexRef.current + direction);
  }, [playTrack]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioElRef.current) {
        audioElRef.current.pause();
      }
    };
  }, []);

  return {
    playSound, playCelebration, ensureContext,
    muted, toggleMute,
    startMusic, stopMusic, pauseMusic, resumeMusic, skipTrack,
    trackName, paused,
  };
}
