import { useEffect, useRef, useCallback } from 'react';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export default function useInput(onAction) {
  const heldKeys = useRef(new Set());
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
        heldKeys.current.add(e.key);
      } else if (!e.repeat) {
        onActionRef.current?.();
      }
    };

    const handleKeyUp = (e) => {
      heldKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      heldKeys.current.clear();
    };
  }, []);

  const getDirection = useCallback(() => {
    const keys = heldKeys.current;
    let dx = 0;
    let dy = 0;
    if (keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('ArrowRight')) dx += 1;
    if (keys.has('ArrowUp')) dy -= 1;
    if (keys.has('ArrowDown')) dy += 1;
    return { dx, dy };
  }, []);

  return { getDirection };
}
