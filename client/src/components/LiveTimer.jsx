import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) return;

      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format as HH:MM:SS
      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');

      setElapsed(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-soft border border-primary-light animate-pulse-slow">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Clock size={16} className="text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Time Tracking</p>
        <p className="text-sm font-extrabold text-primary font-mono">{elapsed}</p>
      </div>
    </div>
  );
}