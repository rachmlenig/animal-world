import { memo } from 'react';

interface Props {
  x: number;
  y: number;
  text: string;
}

function SoundLabel({ x, y, text }: Props) {
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
