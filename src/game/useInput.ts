import { useEffect, useRef, useCallback } from 'react';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export default function useInput(onAction: () => void) {
  const heldKeys = useRef(new Set<string>());
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
        heldKeys.current.add(e.key);
      } else if (!e.repeat) {
        onActionRef.current?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const keys = heldKeys.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keys.clear();
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
