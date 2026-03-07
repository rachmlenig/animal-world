import { memo } from 'react';

function PlayerCharacter({ x, y, emoji }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        fontSize: '3.5rem',
        zIndex: 20,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {emoji}
    </div>
  );
}

export default memo(PlayerCharacter);
