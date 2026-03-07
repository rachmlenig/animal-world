import { memo } from 'react';

function FoodItem({ food }) {
  // During flight, scale up from small; when landed, full size
  const inFlight = food.flight > 0;
  const scale = inFlight ? 0.5 + food.flight * 0.5 : 1;
  const shadow = inFlight ? `0 ${Math.round(food.flight * 20)}px ${Math.round(food.flight * 10)}px rgba(0,0,0,0.2)` : 'none';

  return (
    <div
      className={food.eaten ? 'food-eaten' : ''}
      style={{
        position: 'absolute',
        left: food.x,
        top: food.y - (inFlight ? food.arcHeight : 0),
        transform: `translate(-50%, -50%) scale(${scale})`,
        fontSize: '2rem',
        zIndex: inFlight ? 25 : 3,
        filter: inFlight ? `drop-shadow(${shadow})` : undefined,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'none',
      }}
    >
      {food.emoji}
    </div>
  );
}

export default memo(FoodItem);
