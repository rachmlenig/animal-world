import { useState, useCallback, useRef } from 'react';
import useGameLoop from '../game/useGameLoop';
import useInput from '../game/useInput';
import useAudio from '../game/useAudio';
import AnimalEntity from '../components/AnimalEntity';
import PlayerCharacter from '../components/PlayerCharacter';
import FoodItem from '../components/FoodItem';
import SoundLabel from '../components/SoundLabel';
import HUD from '../components/HUD';
import Confetti from '../components/Confetti';

const AIM_SPEED = 3; // radians per second
const THROW_DISTANCE = 250; // px
const FLIGHT_DURATION = 0.8; // seconds
const FOOD_LIFETIME = 3; // seconds on ground
const EAT_RADIUS = 120;
const WANDER_SPEED = 40; // px per second
const SPAWN_INTERVAL = 2.5; // seconds
const MAX_ANIMALS = 8;
const HUNGRY_TIME = 8; // seconds before hungry indicator

let nextId = 1000;
function uid() {
  return nextId++;
}

function spawnAnimalFromEdge(theme) {
  const data = theme.animals[Math.floor(Math.random() * theme.animals.length)];
  const edge = Math.floor(Math.random() * 4);
  const w = window.innerWidth;
  const h = window.innerHeight;
  let x, y;
  switch (edge) {
    case 0: x = Math.random() * w; y = -30; break;       // top
    case 1: x = w + 30; y = Math.random() * h; break;    // right
    case 2: x = Math.random() * w; y = h + 30; break;    // bottom
    default: x = -30; y = Math.random() * h; break;      // left
  }
  // Wander direction toward center-ish
  const angle = Math.atan2(h / 2 - y + (Math.random() - 0.5) * 200, w / 2 - x + (Math.random() - 0.5) * 200);
  return {
    ...data,
    id: uid(),
    x, y,
    vx: Math.cos(angle) * WANDER_SPEED,
    vy: Math.sin(angle) * WANDER_SPEED,
    spawnTime: 0, // set by caller
    lastFedTime: 0,
    spawning: true,
    targetFood: null,
  };
}

export default function FeedingMode({ theme }) {
  const playerX = useRef(window.innerWidth / 2);
  const playerY = useRef(window.innerHeight * 0.6);
  const aimAngle = useRef(-Math.PI / 2); // start aiming up
  const animalsRef = useRef([]);
  const foodsRef = useRef([]);
  const labelsRef = useRef([]);
  const scoreRef = useRef(0);
  const timeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const confettiIdRef = useRef(0);

  const [, setTick] = useState(0);
  const [confetti, setConfetti] = useState(null);

  const { playSound, playCelebration, ensureContext, muted, toggleMute } = useAudio();

  const throwFood = useCallback(() => {
    ensureContext();
    const angle = aimAngle.current;
    const startX = playerX.current;
    const startY = playerY.current;
    const endX = startX + Math.cos(angle) * THROW_DISTANCE;
    const endY = startY + Math.sin(angle) * THROW_DISTANCE;

    foodsRef.current.push({
      id: uid(),
      emoji: theme.food.emoji,
      startX, startY,
      endX, endY,
      x: startX,
      y: startY,
      arcHeight: 0,
      flight: 1, // 1 = just thrown, counts down to 0
      flightTime: 0,
      landedTime: null,
      eaten: false,
    });
  }, [theme, ensureContext]);

  const { getDirection } = useInput(throwFood);

  const update = useCallback(
    (dt) => {
      timeRef.current += dt;
      const t = timeRef.current;

      // Aim rotation
      const dir = getDirection();
      if (dir.dx !== 0 || dir.dy !== 0) {
        // Use arrow keys to rotate aim
        aimAngle.current += dir.dx * AIM_SPEED * dt;
        aimAngle.current -= dir.dy * AIM_SPEED * dt;
      }

      // Spawn animals on timer
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

      // Update food positions (in flight)
      for (const f of foods) {
        if (f.eaten) continue;
        if (f.flight > 0) {
          f.flightTime += dt;
          const progress = Math.min(f.flightTime / FLIGHT_DURATION, 1);
          f.flight = 1 - progress;
          f.x = f.startX + (f.endX - f.startX) * progress;
          f.y = f.startY + (f.endY - f.startY) * progress;
          // Parabolic arc height
          f.arcHeight = Math.sin(progress * Math.PI) * 80;
          if (progress >= 1) {
            f.flight = 0;
            f.landedTime = t;
          }
        }
      }

      // Update animal positions (wander + seek food)
      const padding = 40;
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const a of animals) {
        // Check if targeting food
        if (a.targetFood) {
          const f = foods.find((f) => f.id === a.targetFood);
          if (f && !f.eaten) {
            // Walk toward food
            const dx = f.x - a.x;
            const dy = f.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 20) {
              // Eat!
              f.eaten = true;
              a.targetFood = null;
              a.lastFedTime = t;
              scoreRef.current++;
              playSound(a);
              labels.push({ id: uid(), x: a.x, y: a.y, text: a.sound, time: t });
              labels.push({ id: uid(), x: a.x + 20, y: a.y - 20, text: '\u2764\uFE0F', time: t });
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

        // Check for nearby landed food to target
        let closestFood = null;
        let closestDist = EAT_RADIUS;
        for (const f of foods) {
          if (f.flight > 0 || f.eaten) continue;
          const dist = Math.hypot(f.x - a.x, f.y - a.y);
          if (dist < closestDist) {
            // Make sure no other animal is already targeting this food
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

        // Wander
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Bounce off edges
        if (a.x < padding) { a.x = padding; a.vx = Math.abs(a.vx); }
        if (a.x > w - padding) { a.x = w - padding; a.vx = -Math.abs(a.vx); }
        if (a.y < padding) { a.y = padding; a.vy = Math.abs(a.vy); }
        if (a.y > h - padding) { a.y = h - padding; a.vy = -Math.abs(a.vy); }
      }

      // Remove expired food
      foodsRef.current = foods.filter((f) => {
        if (f.eaten) return false;
        if (f.landedTime && t - f.landedTime > FOOD_LIFETIME) return false;
        return true;
      });

      // Expire old labels
      labelsRef.current = labels.filter((l) => t - l.time < 0.8);

      setTick((tick) => tick + 1);
    },
    [getDirection, playSound, playCelebration, theme]
  );

  useGameLoop(update);

  const px = playerX.current;
  const py = playerY.current;
  const angle = aimAngle.current;
  const t = timeRef.current;

  // Aim indicator points
  const aimLen = 60;
  const aimX = px + Math.cos(angle) * aimLen;
  const aimY = py + Math.sin(angle) * aimLen;

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

      <HUD count={scoreRef.current} accentColor={theme.accentColor} label="fed" muted={muted} onToggleMute={toggleMute} />

      {/* Aim indicator */}
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

      {/* Food items */}
      {foodsRef.current.map((f) => (
        <FoodItem key={`f-${f.id}`} food={f} />
      ))}

      {/* Animals */}
      {animalsRef.current.map((a) => {
        const hungry = t - a.lastFedTime > HUNGRY_TIME;
        return (
          <div key={`a-${a.id}`} style={{ position: 'absolute', left: a.x, top: a.y, transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none' }}>
            <div className={a.spawning ? 'spawning' : 'idle-bob'} style={{ fontSize: '3rem', userSelect: 'none' }}>
              {a.emoji}
            </div>
            {hungry && (
              <div className="hungry-indicator" style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' }}>
                {'\u{1F622}'}
              </div>
            )}
          </div>
        );
      })}

      {/* Sound / heart labels */}
      {labelsRef.current.map((l) => (
        <SoundLabel key={`l-${l.id}`} x={l.x} y={l.y} text={l.text} />
      ))}

      <PlayerCharacter x={px} y={py} emoji={theme.player.emoji} />

      {confetti && <Confetti key={confetti.id} x={confetti.x} y={confetti.y} active={true} />}
    </div>
  );
}
