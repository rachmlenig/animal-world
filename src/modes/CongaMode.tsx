import { useState, useCallback, useRef, useEffect } from 'react';
import useGameLoop from '../game/useGameLoop';
import useInput from '../game/useInput';
import useAudio from '../game/useAudio';
import AnimalEntity from '../components/AnimalEntity';
import PlayerCharacter from '../components/PlayerCharacter';
import SoundLabel from '../components/SoundLabel';
import Confetti from '../components/Confetti';
import PauseOverlay from '../components/PauseOverlay';
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
  onHome: () => void;
}

export default function CongaMode({ theme, onHome }: Props) {
  const playerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animalsRef = useRef<AnimalEntityType[]>([]);
  const chainRef = useRef<AnimalEntityType[]>([]);
  const labelsRef = useRef<SoundLabelData[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const tapTargetRef = useRef<{ x: number; y: number } | null>(null);
  const timeRef = useRef(0);
  const confettiIdRef = useRef(0);

  const [, setTick] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiTrigger | null>(null);
  const [gamePaused, setGamePaused] = useState(false);
  const [won, setWon] = useState(false);
  const wonRef = useRef(false);

  const { playSound, playCelebration, ensureContext, muted, toggleMute, startMusic, stopMusic, pauseMusic, resumeMusic, skipTrack, trackName, paused } = useAudio();

  useEffect(() => {
    startMusic();
    return () => stopMusic();
  }, [startMusic, stopMusic]);

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

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't intercept clicks on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    const point = 'touches' in e ? e.touches[0]! : e;
    tapTargetRef.current = { x: point.clientX, y: point.clientY };
  }, []);

  const update = useCallback(
    (dt: number) => {
      timeRef.current += dt;
      const dir = getDirection();
      const p = playerRef.current;

      // Arrow keys take priority; otherwise move toward tap target
      let moving = false;
      if (dir.dx !== 0 || dir.dy !== 0) {
        p.x = Math.max(30, Math.min(window.innerWidth - 30, p.x + dir.dx * PLAYER_SPEED * dt));
        p.y = Math.max(30, Math.min(window.innerHeight - 30, p.y + dir.dy * PLAYER_SPEED * dt));
        tapTargetRef.current = null;
        moving = true;
      } else if (tapTargetRef.current) {
        const tx = tapTargetRef.current.x;
        const ty = tapTargetRef.current.y;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) {
          tapTargetRef.current = null;
        } else {
          const step = Math.min(PLAYER_SPEED * dt, dist);
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
          moving = true;
        }
      }

      if (moving) {
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

      if (collectedAny && animals.length === 0 && chain.length > 0 && !wonRef.current) {
        wonRef.current = true;
        playCelebration();
        setWon(true);
        // Fire confetti bursts from multiple spots
        const w = window.innerWidth;
        const h = window.innerHeight;
        const burstPoints = [
          { x: w * 0.5, y: h * 0.3 },
          { x: w * 0.2, y: h * 0.5 },
          { x: w * 0.8, y: h * 0.5 },
          { x: w * 0.35, y: h * 0.2 },
          { x: w * 0.65, y: h * 0.2 },
        ];
        burstPoints.forEach((pt, i) => {
          setTimeout(() => {
            confettiIdRef.current++;
            setConfetti({ id: confettiIdRef.current, x: pt.x, y: pt.y });
          }, i * 300);
        });
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
  const total = chain.length + animalsRef.current.length;

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
      onClick={handleTap}
      onTouchStart={handleTap}
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

      {/* Progress dots — top right */}
      {total > 0 && (
        <div style={{
          position: 'absolute',
          top: 18,
          right: 24,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          userSelect: 'none',
        }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: i < chain.length ? theme.accentColor : 'rgba(255,255,255,0.35)',
                border: '2px solid rgba(255,255,255,0.6)',
                transition: 'background 0.3s ease',
                boxShadow: i < chain.length ? `0 0 6px ${theme.accentColor}` : 'none',
              }}
            />
          ))}
        </div>
      )}

      {animalsRef.current.map((a) => (
        <AnimalEntity key={`a-${a.id}`} animal={a} collected={false} beckon />
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

      {won && (
        <div
          className="win-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div className="win-text" style={{
            fontSize: '4rem',
            fontFamily: "'Baloo 2', cursive",
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,0.4)',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            {'\u{1F389}'} You did it! {'\u{1F389}'}
          </div>

          {/* Dancing animals */}
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '80%',
            marginBottom: 32,
          }}>
            {chain.map((a, i) => (
              <span
                key={a.id}
                className="win-dance"
                style={{
                  fontSize: '3rem',
                  display: 'inline-block',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {a.emoji}
              </span>
            ))}
          </div>

          <button
            onClick={onHome}
            className="win-home-btn"
            style={{
              fontSize: '1.3rem',
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 700,
              color: '#fff',
              background: theme.accentColor,
              border: 'none',
              borderRadius: 50,
              padding: '14px 36px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {'\u{1F3E0}'} Play Again
          </button>
        </div>
      )}

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
