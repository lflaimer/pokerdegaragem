'use client';

import { BlindLevel } from '@/hooks/useBlindTimer';
import { useLanguage } from '@/contexts/LanguageContext';

interface BlindTimerDisplayProps {
  currentLevelIndex: number;
  currentLevel: BlindLevel | null;
  nextLevel: BlindLevel | null;
  timeRemainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function BlindTimerDisplay({
  currentLevelIndex,
  currentLevel,
  nextLevel,
  timeRemainingSeconds,
  isRunning,
  isPaused,
  isFinished,
  onStart,
  onPause,
  onResume,
  onReset,
  onNextLevel,
  onPrevLevel,
}: BlindTimerDisplayProps) {
  const { t } = useLanguage();

  // Determine timer color based on time remaining
  const getTimerColor = () => {
    if (isFinished) return 'text-poker-brown/50';
    if (!currentLevel) return 'text-poker-brown';
    const totalSeconds = currentLevel.durationMinutes * 60;
    const percentRemaining = timeRemainingSeconds / totalSeconds;
    if (percentRemaining <= 0.1) return 'text-poker-red animate-pulse';
    if (percentRemaining <= 0.25) return 'text-poker-red';
    if (percentRemaining <= 0.5) return 'text-poker-gold';
    return 'text-poker-green';
  };

  return (
    <div className="bg-poker-brown rounded-2xl p-8 text-center shadow-2xl">
      {/* Level indicator */}
      <div className="text-poker-gold text-lg font-semibold mb-2">
        {isFinished ? t.blindTimer.tournamentFinished : `${t.blindTimer.level} ${currentLevelIndex + 1}`}
      </div>

      {/* Timer display */}
      <div className={`text-7xl md:text-9xl font-bold font-mono ${getTimerColor()} mb-6 transition-colors`}>
        {formatTime(timeRemainingSeconds)}
      </div>

      {/* Current blinds */}
      {currentLevel && (
        <div className="mb-4">
          <div className="text-poker-cream/70 text-sm uppercase tracking-wider mb-1">
            {t.blindTimer.currentBlinds}
          </div>
          <div className="text-poker-cream text-2xl md:text-3xl font-bold">
            <span className="text-poker-gold">{formatNumber(currentLevel.smallBlind)}</span>
            <span className="mx-2">/</span>
            <span className="text-poker-gold">{formatNumber(currentLevel.bigBlind)}</span>
            {currentLevel.ante > 0 && (
              <span className="text-poker-cream/70 text-xl ml-3">
                ({t.blindTimer.ante}: {formatNumber(currentLevel.ante)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Next blinds */}
      {nextLevel && (
        <div className="mb-6">
          <div className="text-poker-cream/50 text-sm uppercase tracking-wider mb-1">
            {t.blindTimer.nextBlinds}
          </div>
          <div className="text-poker-cream/70 text-lg">
            {formatNumber(nextLevel.smallBlind)} / {formatNumber(nextLevel.bigBlind)}
            {nextLevel.ante > 0 && (
              <span className="text-poker-cream/50 ml-2">
                ({t.blindTimer.ante}: {formatNumber(nextLevel.ante)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={onPrevLevel}
          disabled={currentLevelIndex === 0}
          className="px-4 py-3 bg-poker-brown-dark hover:bg-poker-brown-light disabled:opacity-30 disabled:cursor-not-allowed text-poker-cream rounded-lg transition-colors"
          title={t.blindTimer.prevLevel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            disabled={isFinished}
            className="px-8 py-3 bg-poker-green hover:bg-poker-green-light disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {t.blindTimer.start}
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="px-8 py-3 bg-poker-gold hover:bg-poker-gold-dark text-poker-brown-dark font-bold rounded-lg transition-colors"
          >
            {t.blindTimer.pause}
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="px-8 py-3 bg-poker-green hover:bg-poker-green-light text-white font-bold rounded-lg transition-colors"
          >
            {t.blindTimer.resume}
          </button>
        )}

        <button
          onClick={onReset}
          className="px-4 py-3 bg-poker-red hover:bg-poker-red-light text-white rounded-lg transition-colors"
          title={t.blindTimer.reset}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={onNextLevel}
          disabled={!nextLevel}
          className="px-4 py-3 bg-poker-brown-dark hover:bg-poker-brown-light disabled:opacity-30 disabled:cursor-not-allowed text-poker-cream rounded-lg transition-colors"
          title={t.blindTimer.nextLevel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
