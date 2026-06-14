import React, { useState, useEffect } from 'react';

export const ActiveJobTimer = ({ checkInTime }) => {
  const [elapsedText, setElapsedText] = useState('0s');

  useEffect(() => {
    if (!checkInTime) return;

    const checkInDate = new Date(checkInTime);

    const updateTimer = () => {
      const diffMs = Date.now() - checkInDate.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);

      if (diffHrs > 0) {
        setElapsedText(`${diffHrs}h ${diffMin % 60}m`);
      } else if (diffMin > 0) {
        setElapsedText(`${diffMin}m ${diffSec % 60}s`);
      } else {
        setElapsedText(`${diffSec}s`);
      }
    };

    updateTimer(); // run once immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInTime]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold rounded-lg text-xs animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      <span>Active timer: {elapsedText}</span>
    </div>
  );
};

export default ActiveJobTimer;
