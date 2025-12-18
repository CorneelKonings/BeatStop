
import React, { useMemo } from 'react';

interface Props {
  isPaused?: boolean;
}

const Snowfall: React.FC<Props> = ({ isPaused = false }) => {
  // Gebruik useMemo zodat de sneeuwvlokken niet opnieuw worden gegenereerd bij elke render.
  // Dit voorkomt dat de sneeuw 'verspringt' of 'ververst' als de muziek stopt.
  const snowflakes = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * -15}s`, // Negatieve delay voor direct resultaat
      duration: `${Math.random() * 5 + 7}s`, // Iets trager voor sfeer
      opacity: Math.random() * 0.6 + 0.4,
      fontSize: `${Math.random() * 10 + 10}px`
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map(s => (
        <div
          key={s.id}
          className="snowflake"
          style={{
            left: s.left,
            animationDelay: s.animationDelay,
            animationDuration: s.duration,
            animationPlayState: isPaused ? 'paused' : 'running',
            opacity: s.opacity,
            fontSize: s.fontSize,
            position: 'fixed',
            top: '-10%',
            color: 'white'
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowfall;
