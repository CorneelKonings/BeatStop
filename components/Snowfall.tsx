
import React from 'react';

const Snowfall: React.FC = () => {
  const snowflakes = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.7 + 0.3,
    fontSize: `${Math.random() * 10 + 10}px`
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map(s => (
        <div
          key={s.id}
          className="snowflake"
          style={{
            left: s.left,
            animationDelay: s.animationDelay,
            opacity: s.opacity,
            fontSize: s.fontSize
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowfall;
