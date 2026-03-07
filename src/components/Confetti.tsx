import { useState, useEffect, useRef } from 'react';
import type { Particle } from '../types';

const PARTICLE_COUNT = 40;
const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#FF9F43', '#54A0FF'];

function createParticle(x: number, y: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 200 + Math.random() * 300;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 200,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 600,
    opacity: 1,
  };
}

interface Props {
  x?: number;
  y?: number;
  active: boolean;
}

export default function Confetti({ x, y, active }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const px = x ?? window.innerWidth / 2;
    const py = y ?? window.innerHeight / 2;
    const initial = Array.from({ length: PARTICLE_COUNT }, () => createParticle(px, py));
    setParticles(initial);
    startRef.current = performance.now();

    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = (now - startRef.current) / 1000;

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 600 * dt,
          rotation: p.rotation + p.rotSpeed * dt,
          opacity: Math.max(0, 1 - elapsed / 1.5),
        }))
      );

      if (elapsed < 1.5) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setParticles([]);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, x, y]);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
