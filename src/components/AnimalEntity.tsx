import { memo } from 'react';
import type { AnimalEntity as AnimalEntityType } from '../types';

interface Props {
  animal: AnimalEntityType;
  collected: boolean;
}

function AnimalEntity({ animal, collected }: Props) {
  return (
    <div
      className={`animal-entity ${animal.spawning ? 'spawning' : ''} ${collected ? 'collected' : 'idle-bob'}`}
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
      {animal.emoji}
    </div>
  );
}

export default memo(AnimalEntity);
