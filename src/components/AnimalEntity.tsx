import type { AnimalEntity as AnimalEntityType } from '../types';

interface Props {
  animal: AnimalEntityType;
  collected: boolean;
  beckon?: boolean;
}

function AnimalEntity({ animal, collected, beckon }: Props) {
  const idleClass = beckon ? 'beckon' : 'idle-bob';
  return (
    <div
      style={{
        position: 'absolute',
        left: animal.x,
        top: animal.y,
        transform: 'translate(-50%, -50%)',
        fontSize: '3rem',
        zIndex: collected ? 5 : 10,
        transition: collected ? 'none' : undefined,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div className={`animal-entity ${animal.spawning ? 'spawning' : ''} ${collected ? 'collected' : idleClass}`}>
        {animal.emoji}
      </div>
    </div>
  );
}

export default AnimalEntity;
