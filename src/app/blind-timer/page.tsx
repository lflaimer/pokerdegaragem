'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlindTimer, BlindLevel } from '@/hooks/useBlindTimer';
import { BlindTimerDisplay } from '@/components/blind-timer/BlindTimerDisplay';
import { BlindScheduleTable } from '@/components/blind-timer/BlindScheduleTable';
import { BlindLevelEditor } from '@/components/blind-timer/BlindLevelEditor';
import { PresetSelector } from '@/components/blind-timer/PresetSelector';

export default function BlindTimerPage() {
  const { t } = useLanguage();
  const [showEditor, setShowEditor] = useState(false);

  const timer = useBlindTimer({
    playSound: true,
  });

  const handleLoadPreset = (levels: BlindLevel[]) => {
    timer.setLevels(levels);
  };

  const handleLevelsChange = (levels: BlindLevel[]) => {
    timer.setLevels(levels);
  };

  const handleLevelClick = (index: number) => {
    if (!timer.isRunning) {
      timer.goToLevel(index);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-5rem)] bg-felt-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-poker-cream mb-2">{t.blindTimer.title}</h1>
            <p className="text-poker-cream/70">{t.blindTimer.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Timer Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timer Display */}
              <BlindTimerDisplay
                currentLevelIndex={timer.currentLevelIndex}
                currentLevel={timer.currentLevel}
                nextLevel={timer.nextLevel}
                timeRemainingSeconds={timer.timeRemainingSeconds}
                isRunning={timer.isRunning}
                isPaused={timer.isPaused}
                isFinished={timer.isFinished}
                onStart={timer.start}
                onPause={timer.pause}
                onResume={timer.resume}
                onReset={timer.reset}
                onNextLevel={timer.nextLevelAction}
                onPrevLevel={timer.prevLevelAction}
              />

              {/* Blind Schedule Table */}
              <BlindScheduleTable
                levels={timer.levels}
                currentLevelIndex={timer.currentLevelIndex}
                onLevelClick={handleLevelClick}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Presets */}
              <PresetSelector
                currentLevels={timer.levels}
                onLoadPreset={handleLoadPreset}
                disabled={timer.isRunning}
              />

              {/* Editor Toggle */}
              <button
                onClick={() => setShowEditor(!showEditor)}
                disabled={timer.isRunning}
                className="w-full py-3 bg-white border-2 border-poker-brown/10 rounded-xl text-poker-brown font-medium hover:bg-poker-gold/10 hover:border-poker-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showEditor ? t.blindTimer.hideEditor : t.blindTimer.showEditor}
              </button>

              {/* Level Editor */}
              {showEditor && (
                <BlindLevelEditor
                  levels={timer.levels}
                  onLevelsChange={handleLevelsChange}
                  disabled={timer.isRunning}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
