import { useState, useCallback, useRef, useEffect } from 'react';
import useGameLoop from '../game/useGameLoop';
import useInput from '../game/useInput';
import useAudio from '../game/useAudio';
import PlayerCharacter from '../components/PlayerCharacter';
import FoodItem from '../components/FoodItem';
import SoundLabel from '../components/SoundLabel';
import Confetti from '../components/Confetti';
import PauseOverlay from '../components/PauseOverlay';
import type { Theme, WanderingAnimal, FoodEntity, SoundLabelData, ConfettiTrigger } from '../types';

interface SparkleData {
  id: number;
  x: number;
  y: number;
  time: number;
}

interface PuffData {
  id: number;
  x: number;
  y: number;
  time: number;
}

const AIM_SPEED = 3;
const MIN_THROW_DISTANCE = 200;
const MAX_THROW_DISTANCE = 400;
const MAX_CHARGE_TIME = 1.5;
const FLIGHT_DURATION = 0.8;
const FOOD_LIFETIME = 3;
const EAT_RADIUS = 120;
const WANDER_SPEED = 40;
const SPAWN_INTERVAL = 2.5;
const MAX_ANIMALS = 8;
const HUNGRY_TIME = 8;

let nextId = 1000;
function uid() {
  return nextId++;
}

function spawnAnimalFromEdge(theme: Theme): WanderingAnimal {
  const data = theme.animals[Math.floor(Math.random() * theme.animals.length)]!;
  const edge = Math.floor(Math.random() * 4);
  const w = window.innerWidth;
  const h = window.innerHeight;
  let x: number, y: number;
  switch (edge) {
    case 0: x = Math.random() * w; y = -30; break;
    case 1: x = w + 30; y = Math.random() * h; break;
    case 2: x = Math.random() * w; y = h + 30; break;
    default: x = -30; y = Math.random() * h; break;
  }
  const angle = Math.atan2(h / 2 - y + (Math.random() - 0.5) * 200, w / 2 - x + (Math.random() - 0.5) * 200);
  return {
    ...data,
    id: uid(),
    x, y,
    vx: Math.cos(angle) * WANDER_SPEED,
    vy: Math.sin(angle) * WANDER_SPEED,
    spawnTime: 0,
    lastFedTime: 0,
    spawning: true,
    targetFood: null,
    happyUntil: 0,
  };
}

interface Props {
  theme: Theme;
  onHome: () => void;
}

export default function FeedingMode({ theme, onHome }: Props) {
  const playerX = useRef(window.innerWidth / 2);
  const playerY = useRef(window.innerHeight * 0.6);
  const aimAngle = useRef(-Math.PI / 2);
  const animalsRef = useRef<WanderingAnimal[]>([]);
  const foodsRef = useRef<FoodEntity[]>([]);
  const labelsRef = useRef<SoundLabelData[]>([]);
  const sparklesRef = useRef<SparkleData[]>([]);
  const puffsRef = useRef<PuffData[]>([]);
  const scoreRef = useRef(0);
  const timeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const confettiIdRef = useRef(0);

  const [, setTick] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiTrigger | null>(null);
  const [gamePaused, setGamePaused] = useState(false);

  const { playSound, playCelebration, ensureContext, muted, toggleMute, startMusic, stopMusic, pauseMusic, resumeMusic, skipTrack, trackName, paused } = useAudio();

  useEffect(() => {
    startMusic();
    return () => stopMusic();
  }, [startMusic, stopMusic]);

  const throwFood = useCallback((holdDuration: number) => {
    ensureContext();
    const charge = Math.min(holdDuration / MAX_CHARGE_TIME, 1);
    const throwDistance = MIN_THROW_DISTANCE + charge * (MAX_THROW_DISTANCE - MIN_THROW_DISTANCE);
    const angle = aimAngle.current;
    const startX = playerX.current;
    const startY = playerY.current;
    const endX = startX + Math.cos(angle) * throwDistance;
    const endY = startY + Math.sin(angle) * throwDistance;

    foodsRef.current.push({
      id: uid(),
      emoji: theme.food.emoji,
      startX, startY,
      endX, endY,
      x: startX,
      y: startY,
      arcHeight: 0,
      flight: 1,
      flightTime: 0,
      landedTime: null,
      eaten: false,
    });
  }, [theme, ensureContext]);

  const { getDirection, chargeStartRef } = useInput(throwFood);

  const update = useCallback(
    (dt: number) => {
      timeRef.current += dt;
      const t = timeRef.current;

      const dir = getDirection();
      if (dir.dx !== 0 || dir.dy !== 0) {
        aimAngle.current += dir.dx * AIM_SPEED * dt;
        aimAngle.current -= dir.dy * AIM_SPEED * dt;
      }

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= SPAWN_INTERVAL && animalsRef.current.length < MAX_ANIMALS) {
        spawnTimerRef.current = 0;
        const a = spawnAnimalFromEdge(theme);
        a.spawnTime = t;
        a.lastFedTime = t;
        animalsRef.current.push(a);
        setTimeout(() => { a.spawning = false; }, 300);
      }

      const animals = animalsRef.current;
      const foods = foodsRef.current;
      const labels = labelsRef.current;

      for (const f of foods) {
        if (f.eaten) continue;
        if (f.flight > 0) {
          f.flightTime += dt;
          const progress = Math.min(f.flightTime / FLIGHT_DURATION, 1);
          f.flight = 1 - progress;
          f.x = f.startX + (f.endX - f.startX) * progress;
          f.y = f.startY + (f.endY - f.startY) * progress;
          f.arcHeight = Math.sin(progress * Math.PI) * 80;
          if (progress >= 1) {
            f.flight = 0;
            f.landedTime = t;
          }
        }
      }

      const padding = 40;
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const a of animals) {
        // Happy linger — animal stays still and looks happy
        if (a.happyUntil > t) {
          continue;
        }

        if (a.targetFood) {
          const f = foods.find((f) => f.id === a.targetFood);
          if (f && !f.eaten) {
            const dx = f.x - a.x;
            const dy = f.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 20) {
              f.eaten = true;
              a.targetFood = null;
              a.lastFedTime = t;
              a.happyUntil = t + 1.5;
              scoreRef.current++;
              playSound(a);
              labels.push({ id: uid(), x: a.x, y: a.y, text: a.sound, time: t });
              labels.push({ id: uid(), x: a.x + 20, y: a.y - 20, text: '\u2764\uFE0F', time: t });
              sparklesRef.current.push({ id: uid(), x: a.x, y: a.y, time: t });
              if (scoreRef.current % 5 === 0) {
                playCelebration();
                confettiIdRef.current++;
                setConfetti({ id: confettiIdRef.current, x: a.x, y: a.y });
              }
            } else {
              const speed = WANDER_SPEED * 2;
              a.x += (dx / dist) * speed * dt;
              a.y += (dy / dist) * speed * dt;
            }
            continue;
          } else {
            a.targetFood = null;
          }
        }

        let closestFood: FoodEntity | null = null;
        let closestDist = EAT_RADIUS;
        for (const f of foods) {
          if (f.flight > 0 || f.eaten) continue;
          const dist = Math.hypot(f.x - a.x, f.y - a.y);
          if (dist < closestDist) {
            const taken = animals.some((other) => other !== a && other.targetFood === f.id);
            if (!taken) {
              closestDist = dist;
              closestFood = f;
            }
          }
        }
        if (closestFood) {
          a.targetFood = closestFood.id;
          continue;
        }

        a.x += a.vx * dt;
        a.y += a.vy * dt;

        if (a.x < padding) { a.x = padding; a.vx = Math.abs(a.vx); }
        if (a.x > w - padding) { a.x = w - padding; a.vx = -Math.abs(a.vx); }
        if (a.y < padding) { a.y = padding; a.vy = Math.abs(a.vy); }
        if (a.y > h - padding) { a.y = h - padding; a.vy = -Math.abs(a.vy); }
      }

      foodsRef.current = foods.filter((f) => {
        if (f.eaten) return false;
        if (f.landedTime && t - f.landedTime > FOOD_LIFETIME) {
          puffsRef.current.push({ id: uid(), x: f.x, y: f.y, time: t });
          return false;
        }
        return true;
      });

      labelsRef.current = labels.filter((l) => t - l.time < 0.8);
      sparklesRef.current = sparklesRef.current.filter((s) => t - s.time < 0.8);
      puffsRef.current = puffsRef.current.filter((p) => t - p.time < 0.6);
      setTick((tick) => tick + 1);
    },
    [getDirection, playSound, playCelebration, theme]
  );

  useGameLoop(update);

  const px = playerX.current;
  const py = playerY.current;
  const angle = aimAngle.current;
  const t = timeRef.current;

  const charging = chargeStartRef.current !== null;
  const chargeProgress = charging
    ? Math.min((performance.now() - chargeStartRef.current!) / (MAX_CHARGE_TIME * 1000), 1)
    : 0;

  const aimLen = 60;
  const aimX = px + Math.cos(angle) * aimLen;
  const aimY = py + Math.sin(angle) * aimLen;

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
      {/* Pause button — top left */}
      <button
        onClick={() => setGamePaused(true)}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 50,
          fontSize: '1.5rem',
          background: 'rgba(255,255,255,0.7)',
          border: 'none',
          borderRadius: 12,
          padding: '6px 12px',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        {'\u23F8\uFE0F'}
      </button>

      {/* Score — top right */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 24,
        zIndex: 50,
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        background: theme.accentColor,
        padding: '8px 20px',
        borderRadius: 20,
        userSelect: 'none',
      }}>
        {'\u{1F31F}'} {scoreRef.current} fed
      </div>

      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}
      >
        <line
          x1={px}
          y1={py}
          x2={aimX}
          y2={aimY}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3"
          strokeDasharray="8,6"
          strokeLinecap="round"
        />
        <circle cx={aimX} cy={aimY} r="6" fill="rgba(255,255,255,0.8)" />
      </svg>

      {foodsRef.current.map((f) => (
        <FoodItem key={`f-${f.id}`} food={f} />
      ))}

      {animalsRef.current.map((a) => {
        const happy = a.happyUntil > t;
        const hungry = !happy && t - a.lastFedTime > HUNGRY_TIME;
        const animalClass = a.spawning ? 'spawning' : happy ? 'happy-bounce' : 'idle-bob';
        return (
          <div key={`a-${a.id}`} style={{ position: 'absolute', left: a.x, top: a.y, transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none' }}>
            <div className={animalClass} style={{ fontSize: '3rem', userSelect: 'none' }}>
              {a.emoji}
            </div>
            {happy && (
              <div className="happy-indicator" style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' }}>
                {'\u{1F60A}'}
              </div>
            )}
            {hungry && (
              <div className="hungry-indicator" style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' }}>
                {'\u{1F622}'}
              </div>
            )}
          </div>
        );
      })}

      {sparklesRef.current.map((s) => (
        <div key={`sp-${s.id}`} className="sparkle-burst" style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 60, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="sparkle-particle"
              style={{
                '--angle': `${i * 60}deg`,
                animationDelay: `${i * 0.04}s`,
              } as React.CSSProperties}
            >
              {i % 2 === 0 ? '\u2B50' : '\u2728'}
            </span>
          ))}
        </div>
      ))}

      {puffsRef.current.map((p) => (
        <div key={`pf-${p.id}`} className="puff-effect" style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)', zIndex: 30, pointerEvents: 'none', fontSize: '1.8rem' }}>
          {'\u{1F4A8}'}
        </div>
      ))}

      {labelsRef.current.map((l) => (
        <SoundLabel key={`l-${l.id}`} x={l.x} y={l.y} text={l.text} />
      ))}

      <PlayerCharacter x={px} y={py} emoji={theme.player.emoji} />

      {charging && (
        <div
          style={{
            position: 'absolute',
            left: px - 30,
            top: py + 35,
            width: 60,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.5)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${chargeProgress * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: chargeProgress < 0.5
                ? `rgb(${Math.round(chargeProgress * 2 * 255)}, 255, 0)`
                : `rgb(255, ${Math.round((1 - (chargeProgress - 0.5) * 2) * 255)}, 0)`,
              transition: 'width 0.05s linear',
            }}
          />
        </div>
      )}

      {confetti && <Confetti key={confetti.id} x={confetti.x} y={confetti.y} active={true} />}

      {gamePaused && (
        <PauseOverlay
          onResume={() => setGamePaused(false)}
          onHome={onHome}
          muted={muted}
          onToggleMute={toggleMute}
          trackName={trackName}
          musicPaused={paused}
          onMusicPause={pauseMusic}
          onMusicResume={resumeMusic}
          onSkip={skipTrack}
        />
      )}
    </div>
  );
}
