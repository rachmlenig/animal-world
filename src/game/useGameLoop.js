import { useEffect, useRef } from 'react';

export default function useGameLoop(update) {
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;
      updateRef.current(dt);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
