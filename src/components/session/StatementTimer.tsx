
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";

interface StatementTimerProps {
  timerSeconds?: number;
  timerStartedAt?: string;
  timerStatus?: string;
}

export const StatementTimer = ({ timerSeconds, timerStartedAt, timerStatus }: StatementTimerProps) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!timerSeconds || !timerStartedAt || timerStatus !== 'running') {
      setRemainingTime(0);
      return;
    }

    const startTime = new Date(timerStartedAt).getTime();
    const endTime = startTime + (timerSeconds * 1000);
    
    const calculateRemainingTime = () => {
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingTime(timeLeft);
      return timeLeft;
    };

    // Initial calculation
    calculateRemainingTime();

    // Update every second
    const interval = setInterval(() => {
      const timeLeft = calculateRemainingTime();
      if (timeLeft === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds, timerStartedAt, timerStatus]);

  if (!timerSeconds || !timerStartedAt || timerStatus !== 'running') {
    return null;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 mb-4 bg-yellow-50">
      <div className="flex items-center justify-between">
        <span className="text-lg">Time remaining to answer:</span>
        <span className="text-2xl font-bold">{formatTime(remainingTime)}</span>
      </div>
    </Card>
  );
};
