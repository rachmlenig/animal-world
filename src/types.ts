export interface AnimalData {
  emoji: string;
  name: string;
  sound: string;
  freq: number;
  type: OscillatorType;
}

export interface AnimalEntity extends AnimalData {
  id: number;
  x: number;
  y: number;
  spawning: boolean;
}

export interface WanderingAnimal extends AnimalEntity {
  vx: number;
  vy: number;
  spawnTime: number;
  lastFedTime: number;
  targetFood: number | null;
  happyUntil: number;
}

export interface FoodEntity {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  x: number;
  y: number;
  arcHeight: number;
  flight: number;
  flightTime: number;
  landedTime: number | null;
  eaten: boolean;
}

export interface Theme {
  key: string;
  name: string;
  icon: string;
  bgGradient: [string, string, string];
  backgroundImage: string;
  accentColor: string;
  player: { emoji: string; label: string };
  food: { emoji: string; label: string };
  decorations: string[];
  animals: AnimalData[];
}

export interface SoundLabelData {
  id: number;
  x: number;
  y: number;
  text: string;
  time: number;
}

export interface ConfettiTrigger {
  id: number;
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}
