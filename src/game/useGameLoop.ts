import { useEffect, useRef } from 'react';

export default function useGameLoop(update: (dt: number) => void) {
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      updateRef.current(dt);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
