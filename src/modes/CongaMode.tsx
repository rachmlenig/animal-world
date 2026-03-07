import { useState, useCallback, useRef } from 'react';
import useGameLoop from '../game/useGameLoop';
import useInput from '../game/useInput';
import useAudio from '../game/useAudio';
import AnimalEntity from '../components/AnimalEntity';
import PlayerCharacter from '../components/PlayerCharacter';
import SoundLabel from '../components/SoundLabel';
import HUD from '../components/HUD';
import Confetti from '../components/Confetti';
import type { Theme, AnimalEntity as AnimalEntityType, SoundLabelData, ConfettiTrigger } from '../types';

const PLAYER_SPEED = 300;
const COLLECT_RADIUS = 60;
const CHAIN_SPACING = 70;
const MAX_ANIMALS = 12;

let nextId = 1;
function uid() {
  return nextId++;
}

interface Props {
  theme: Theme;
}

export default function CongaMode({ theme }: Props) {
  const playerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animalsRef = useRef<AnimalEntityType[]>([]);
  const chainRef = useRef<AnimalEntityType[]>([]);
  const labelsRef = useRef<SoundLabelData[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const timeRef = useRef(0);
  const confettiIdRef = useRef(0);

  const [, setTick] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiTrigger | null>(null);

  const { playSound, playCelebration, ensureContext, muted, toggleMute } = useAudio();

  const spawnAnimal = useCallback(() => {
    ensureContext();
    const animals = animalsRef.current;
    if (animals.length >= MAX_ANIMALS) {
      animals.shift();
    }
    const data = theme.animals[Math.floor(Math.random() * theme.animals.length)]!;
    const padding = 80;
    const newAnimal: AnimalEntityType = {
      ...data,
      id: uid(),
      x: padding + Math.random() * (window.innerWidth - padding * 2),
      y: padding + Math.random() * (window.innerHeight - padding * 2),
      spawning: true,
    };
    animals.push(newAnimal);
    const animalId = newAnimal.id;
    setTimeout(() => {
      const a = animals.find((a) => a.id === animalId);
      if (a) a.spawning = false;
    }, 300);
  }, [theme, ensureContext]);

  const { getDirection } = useInput(spawnAnimal);

  const update = useCallback(
    (dt: number) => {
      timeRef.current += dt;
      const dir = getDirection();
      const p = playerRef.current;

      if (dir.dx !== 0 || dir.dy !== 0) {
        p.x = Math.max(30, Math.min(window.innerWidth - 30, p.x + dir.dx * PLAYER_SPEED * dt));
        p.y = Math.max(30, Math.min(window.innerHeight - 30, p.y + dir.dy * PLAYER_SPEED * dt));

        const trail = trailRef.current;
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 5) {
          trail.push({ x: p.x, y: p.y });
          const maxTrail = (chainRef.current.length + 2) * 50;
          if (trail.length > maxTrail) {
            trail.splice(0, trail.length - maxTrail);
          }
        }
      }

      const animals = animalsRef.current;
      const chain = chainRef.current;
      const labels = labelsRef.current;
      let collectedAny = false;

      for (let i = animals.length - 1; i >= 0; i--) {
        const a = animals[i]!;
        const dist = Math.hypot(a.x - p.x, a.y - p.y);
        if (dist < COLLECT_RADIUS) {
          playSound(a);
          labels.push({ id: uid(), x: a.x, y: a.y, text: a.sound, time: timeRef.current });
          chain.push({ ...a, id: uid() });
          animals.splice(i, 1);
          collectedAny = true;
        }
      }

      if (collectedAny && animals.length === 0 && chain.length > 0) {
        playCelebration();
        confettiIdRef.current++;
        setConfetti({ id: confettiIdRef.current, x: p.x, y: p.y });
      }

      labelsRef.current = labels.filter((l) => timeRef.current - l.time < 0.8);
      setTick((t) => t + 1);
    },
    [getDirection, playSound, playCelebration]
  );

  useGameLoop(update);

  const player = playerRef.current;
  const trail = trailRef.current;
  const chain = chainRef.current;
  const t = timeRef.current;

  const chainPositions: { x: number; y: number }[] = [];
  let distNeeded = CHAIN_SPACING;
  let trailIdx = trail.length - 1;
  let prevPoint = { x: player.x, y: player.y };

  for (let i = 0; i < chain.length; i++) {
    let placed = false;
    while (trailIdx >= 0) {
      const tp = trail[trailIdx]!;
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
      const lastPos = chainPositions[i - 1] ?? player;
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
        backgroundImage: `url(${theme.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: theme.bgGradient[1],
      }}
    >
      <HUD count={chain.length} accentColor={theme.accentColor} muted={muted} onToggleMute={toggleMute} />

      {animalsRef.current.map((a) => (
        <AnimalEntity key={`a-${a.id}`} animal={a} collected={false} />
      ))}

      {chain.map((a, i) => (
        <AnimalEntity
          key={`c-${a.id}`}
          animal={{ ...a, x: chainPositions[i]!.x, y: chainPositions[i]!.y, spawning: false }}
          collected={true}
        />
      ))}

      {labelsRef.current.map((l) => (
        <SoundLabel key={`l-${l.id}`} x={l.x} y={l.y} text={l.text} />
      ))}

      <PlayerCharacter x={player.x} y={player.y} emoji={theme.player.emoji} />

      {confetti && <Confetti key={confetti.id} x={confetti.x} y={confetti.y} active={true} />}
    </div>
  );
}
