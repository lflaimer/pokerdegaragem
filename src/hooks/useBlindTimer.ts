'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface BlindLevel {
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
}

interface UseBlindTimerOptions {
  onLevelChange?: (levelIndex: number) => void;
  playSound?: boolean;
}

interface UseBlindTimerReturn {
  // State
  levels: BlindLevel[];
  currentLevelIndex: number;
  timeRemainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;

  // Current and next level info
  currentLevel: BlindLevel | null;
  nextLevel: BlindLevel | null;

  // Actions
  setLevels: (levels: BlindLevel[]) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  nextLevelAction: () => void;
  prevLevelAction: () => void;
  goToLevel: (index: number) => void;
}

const DEFAULT_LEVELS: BlindLevel[] = [
  { smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 15 },
  { smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 15 },
  { smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 15 },
  { smallBlind: 100, bigBlind: 200, ante: 25, durationMinutes: 15 },
  { smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 15 },
  { smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 15 },
  { smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 15 },
  { smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 15 },
  { smallBlind: 500, bigBlind: 1000, ante: 100, durationMinutes: 15 },
  { smallBlind: 600, bigBlind: 1200, ante: 200, durationMinutes: 15 },
];

export function useBlindTimer(options: UseBlindTimerOptions = {}): UseBlindTimerReturn {
  const { onLevelChange, playSound = true } = options;

  const [levels, setLevelsState] = useState<BlindLevel[]>(DEFAULT_LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(DEFAULT_LEVELS[0].durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context on client side
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playLevelChangeSound = useCallback(() => {
    if (!playSound) return;

    try {
      // Create or resume audio context (must be after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant chime sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Play a pleasant two-tone chime
      playTone(880, now, 0.15);  // A5
      playTone(1108.73, now + 0.15, 0.25);  // C#6
    } catch (e) {
      // Ignore audio errors
      console.log('Audio playback failed:', e);
    }
  }, [playSound]);

  const isFinished = currentLevelIndex >= levels.length;
  const currentLevel = levels[currentLevelIndex] || null;
  const nextLevel = levels[currentLevelIndex + 1] || null;

  const setLevels = useCallback((newLevels: BlindLevel[]) => {
    setLevelsState(newLevels);
    setCurrentLevelIndex(0);
    setTimeRemainingSeconds(newLevels[0]?.durationMinutes * 60 || 0);
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advanceLevel = useCallback(() => {
    setCurrentLevelIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex < levels.length) {
        setTimeRemainingSeconds(levels[newIndex].durationMinutes * 60);
        playLevelChangeSound();
        onLevelChange?.(newIndex);
      } else {
        // Tournament finished
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      return newIndex;
    });
  }, [levels, playLevelChangeSound, onLevelChange]);

  const tick = useCallback(() => {
    setTimeRemainingSeconds((prev) => {
      if (prev <= 1) {
        advanceLevel();
        return 0;
      }
      return prev - 1;
    });
  }, [advanceLevel]);

  const start = useCallback(() => {
    if (isFinished) return;

    setIsRunning(true);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(tick, 1000);
  }, [isFinished, tick]);

  const pause = useCallback(() => {
    setIsPaused(true);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (isFinished) return;

    setIsPaused(false);
    setIsRunning(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(tick, 1000);
  }, [isFinished, tick]);

  const reset = useCallback(() => {
    setCurrentLevelIndex(0);
    setTimeRemainingSeconds(levels[0]?.durationMinutes * 60 || 0);
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [levels]);

  const nextLevelAction = useCallback(() => {
    if (currentLevelIndex < levels.length - 1) {
      const newIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(newIndex);
      setTimeRemainingSeconds(levels[newIndex].durationMinutes * 60);
      onLevelChange?.(newIndex);
    }
  }, [currentLevelIndex, levels, onLevelChange]);

  const prevLevelAction = useCallback(() => {
    if (currentLevelIndex > 0) {
      const newIndex = currentLevelIndex - 1;
      setCurrentLevelIndex(newIndex);
      setTimeRemainingSeconds(levels[newIndex].durationMinutes * 60);
      onLevelChange?.(newIndex);
    }
  }, [currentLevelIndex, levels, onLevelChange]);

  const goToLevel = useCallback((index: number) => {
    if (index >= 0 && index < levels.length) {
      setCurrentLevelIndex(index);
      setTimeRemainingSeconds(levels[index].durationMinutes * 60);
      onLevelChange?.(index);
    }
  }, [levels, onLevelChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    levels,
    currentLevelIndex,
    timeRemainingSeconds,
    isRunning,
    isPaused,
    isFinished,
    currentLevel,
    nextLevel,
    setLevels,
    start,
    pause,
    resume,
    reset,
    nextLevelAction,
    prevLevelAction,
    goToLevel,
  };
}

export { DEFAULT_LEVELS };
