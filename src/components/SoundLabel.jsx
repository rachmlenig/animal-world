import { memo } from 'react';

function SoundLabel({ x, y, text }) {
  return (
    <div
      className="sound-label"
      style={{
        position: 'absolute',
        left: x,
        top: y - 40,
        transform: 'translate(-50%, -100%)',
        zIndex: 30,
      }}
    >
      {text}
    </div>
  );
}

export default memo(SoundLabel);
