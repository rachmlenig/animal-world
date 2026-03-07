# Animal World

A toddler-friendly animal game with multiple themes and game modes. Any key smash produces immediate, satisfying visual and audio feedback. Arrow keys provide light gameplay mechanics appropriate for supervised play.

## Themes

| Theme | Player | Animals |
|-------|--------|---------|
| The Farm | Farmer | Cow, Pig, Chicken, Sheep, Duck, Horse |
| The Safari | Explorer | Lion, Elephant, Giraffe, Zebra, Hippo, Monkey |
| The Ocean | Diver | Fish, Crab, Octopus, Squid, Dolphin, Turtle |
| The Forest | Sprite | Fox, Bear, Deer, Rabbit, Owl, Hedgehog |

## Game Modes

**Conga Parade** — Move with arrow keys, smash any key to spawn animals, walk into them to collect a wiggling conga chain. Confetti burst when you collect them all.

**Feeding Time** — Aim with arrow keys, press any key to throw food. Animals wander in from the edges and walk over to eat. Confetti every 5 fed.

## Tech Stack

- React + TypeScript
- Vite
- Web Audio API (no sound files)
- DOM-based rendering with CSS animations
- ESLint with TypeScript plugin

## Getting Started

```sh
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
  App.tsx              Screen state machine
  types.ts             Shared TypeScript types
  data/themes.ts       All theme data (animals, colors, emojis)
  screens/
    WorldPicker.tsx    4-card theme selector
    ModePicker.tsx     2-card mode selector
  modes/
    CongaMode.tsx      Conga parade game logic
    FeedingMode.tsx    Feeding time game logic
  game/
    useGameLoop.ts     requestAnimationFrame loop
    useInput.ts        Keyboard input handler
    useAudio.ts        Web Audio API sounds
  components/
    AnimalEntity.tsx   Single animal with animations
    PlayerCharacter.tsx Player emoji
    FoodItem.tsx       Food with arc animation
    SoundLabel.tsx     Floating text (MOO!, etc.)
    Confetti.tsx       Particle burst
    HUD.tsx            Score + volume toggle
```
