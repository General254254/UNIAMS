import React, { useState, useEffect } from 'react';
import { differenceInMinutes, parseISO } from 'date-fns';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [colorClass, setColorClass] = useState('text-gray-500');

  useEffect(() => {
    if (!deadline) return;

    const calculateTime = () => {
      const parsedDeadline = parseISO(deadline);
      const now = new Date();
      const diffMins = differenceInMinutes(parsedDeadline, now);

      if (diffMins <= 0) {
        setTimeLeft('Closed');
        setColorClass('text-gray-500');
        return;
      }

      const days = Math.floor(diffMins / (60 * 24));
      const hours = Math.floor((diffMins % (60 * 24)) / 60);
      const mins = diffMins % 60;

      // Formatting 2d 14h 32m
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${mins}m`);
      
      setTimeLeft(parts.join(' '));

      if (diffMins < 12 * 60) {
        setColorClass('text-red-600 font-semibold');
      } else if (diffMins < 48 * 60) {
        setColorClass('text-amber-600 font-medium');
      } else {
        setColorClass('text-gray-500');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // 60s
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[13px] ${colorClass} transition-colors duration-500`}>
      <Clock size={14} />
      <span className="tabular-nums tracking-tight">{timeLeft}</span>
    </div>
  );
}
