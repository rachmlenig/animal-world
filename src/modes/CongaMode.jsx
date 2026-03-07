import { useState, useCallback, useRef } from 'react';
import useGameLoop from '../game/useGameLoop';
import useInput from '../game/useInput';
import useAudio from '../game/useAudio';
import AnimalEntity from '../components/AnimalEntity';
import PlayerCharacter from '../components/PlayerCharacter';
import SoundLabel from '../components/SoundLabel';
import HUD from '../components/HUD';

const PLAYER_SPEED = 300;
const COLLECT_RADIUS = 60;
const CHAIN_SPACING = 70; // pixels between chain members
const MAX_ANIMALS = 12;

let nextId = 1;
function uid() {
  return nextId++;
}

export default function CongaMode({ theme }) {
  const playerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animalsRef = useRef([]);
  const chainRef = useRef([]);
  const labelsRef = useRef([]);
  const trailRef = useRef([]); // array of {x,y} positions the player has visited
  const timeRef = useRef(0);

  // Force re-render
  const [, setTick] = useState(0);

  const { playSound, ensureContext } = useAudio();

  const spawnAnimal = useCallback(() => {
    ensureContext();
    const animals = animalsRef.current;
    if (animals.length >= MAX_ANIMALS) {
      animals.shift();
    }
    const data = theme.animals[Math.floor(Math.random() * theme.animals.length)];
    const padding = 80;
    animals.push({
      ...data,
      id: uid(),
      x: padding + Math.random() * (window.innerWidth - padding * 2),
      y: padding + Math.random() * (window.innerHeight - padding * 2),
      spawning: true,
    });
    setTimeout(() => {
      const a = animals.find((a) => a.spawning);
      if (a) a.spawning = false;
    }, 300);
  }, [theme, ensureContext]);

  const { getDirection } = useInput(spawnAnimal);

  const update = useCallback(
    (dt) => {
      timeRef.current += dt;
      const dir = getDirection();
      const p = playerRef.current;

      // Move player
      if (dir.dx !== 0 || dir.dy !== 0) {
        p.x = Math.max(30, Math.min(window.innerWidth - 30, p.x + dir.dx * PLAYER_SPEED * dt));
        p.y = Math.max(30, Math.min(window.innerHeight - 30, p.y + dir.dy * PLAYER_SPEED * dt));

        // Record trail
        const trail = trailRef.current;
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 5) {
          trail.push({ x: p.x, y: p.y });
          // Keep trail from growing forever — need enough for the chain
          const maxTrail = (chainRef.current.length + 2) * 50;
          if (trail.length > maxTrail) {
            trail.splice(0, trail.length - maxTrail);
          }
        }
      }

      // Check collisions
      const animals = animalsRef.current;
      const chain = chainRef.current;
      const labels = labelsRef.current;
      for (let i = animals.length - 1; i >= 0; i--) {
        const a = animals[i];
        const dist = Math.hypot(a.x - p.x, a.y - p.y);
        if (dist < COLLECT_RADIUS) {
          playSound(a);
          labels.push({ id: uid(), x: a.x, y: a.y, text: a.sound, time: timeRef.current });
          chain.push({ ...a, id: uid() });
          animals.splice(i, 1);
        }
      }

      // Expire old labels
      labelsRef.current = labels.filter((l) => timeRef.current - l.time < 0.8);

      setTick((t) => t + 1);
    },
    [getDirection, playSound]
  );

  useGameLoop(update);

  // Compute chain positions by walking back along the trail
  const player = playerRef.current;
  const trail = trailRef.current;
  const chain = chainRef.current;
  const t = timeRef.current;

  const chainPositions = [];
  let distNeeded = CHAIN_SPACING;
  let trailIdx = trail.length - 1;
  let prevPoint = { x: player.x, y: player.y };

  for (let i = 0; i < chain.length; i++) {
    let placed = false;
    while (trailIdx >= 0) {
      const tp = trail[trailIdx];
      const segDist = Math.hypot(tp.x - prevPoint.x, tp.y - prevPoint.y);
      if (segDist >= distNeeded) {
        const ratio = distNeeded / segDist;
        const fx = prevPoint.x + (tp.x - prevPoint.x) * ratio;
        const fy = prevPoint.y + (tp.y - prevPoint.y) * ratio;
        const wobbleX = Math.sin(t * 3 + i * 0.8) * 6;
        const wobbleY = Math.cos(t * 2.5 + i * 0.6) * 4;
        chainPositions.push({ x: fx + wobbleX, y: fy + wobbleY });
        prevPoint = { x: fx, y: fy };
        distNeeded = CHAIN_SPACING;
        placed = true;
        break;
      }
      distNeeded -= segDist;
      prevPoint = tp;
      trailIdx--;
    }
    if (!placed) {
      // Not enough trail yet, stack behind last known position
      const lastPos = chainPositions[i - 1] || player;
      chainPositions.push({
        x: lastPos.x + Math.sin(t * 3 + i * 0.8) * 6,
        y: Math.min(lastPos.y + CHAIN_SPACING, window.innerHeight - 30) + Math.cos(t * 2.5 + i * 0.6) * 4,
      });
    }
  }

  return (
    <div
      className="game-area"
      style={{
        background: `linear-gradient(180deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 50%, ${theme.bgGradient[2]} 100%)`,
      }}
    >
      {theme.decorations.map((d, i) => (
        <div
          key={`dec-${i}`}
          className="decoration"
          style={{
            position: 'absolute',
            left: `${20 + i * 30}%`,
            bottom: `${5 + i * 3}%`,
            fontSize: '2.5rem',
            opacity: 0.5,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {d}
        </div>
      ))}

      <HUD count={chain.length} accentColor={theme.accentColor} />

      {animalsRef.current.map((a) => (
        <AnimalEntity key={`a-${a.id}`} animal={a} collected={false} />
      ))}

      {chain.map((a, i) => (
        <AnimalEntity
          key={`c-${a.id}`}
          animal={{ ...a, x: chainPositions[i].x, y: chainPositions[i].y, spawning: false }}
          collected={true}
        />
      ))}

      {labelsRef.current.map((l) => (
        <SoundLabel key={`l-${l.id}`} x={l.x} y={l.y} text={l.text} />
      ))}

      <PlayerCharacter x={player.x} y={player.y} emoji={theme.player.emoji} />
    </div>
  );
}
