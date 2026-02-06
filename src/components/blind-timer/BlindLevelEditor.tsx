'use client';

import { useState } from 'react';
import { BlindLevel } from '@/hooks/useBlindTimer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface BlindLevelEditorProps {
  levels: BlindLevel[];
  onLevelsChange: (levels: BlindLevel[]) => void;
  disabled?: boolean;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function BlindLevelEditor({
  levels,
  onLevelsChange,
  disabled = false,
}: BlindLevelEditorProps) {
  const { t } = useLanguage();
  const [newLevel, setNewLevel] = useState<BlindLevel>({
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    durationMinutes: 15,
  });

  const handleAddLevel = () => {
    if (newLevel.smallBlind > 0 && newLevel.bigBlind > 0 && newLevel.durationMinutes > 0) {
      onLevelsChange([...levels, { ...newLevel }]);
      setNewLevel({
        smallBlind: newLevel.bigBlind,
        bigBlind: newLevel.bigBlind * 2,
        ante: newLevel.ante,
        durationMinutes: newLevel.durationMinutes,
      });
    }
  };

  const handleRemoveLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    onLevelsChange(newLevels);
  };

  const handleUpdateLevel = (index: number, field: keyof BlindLevel, value: number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    onLevelsChange(newLevels);
  };

  const handleClearAll = () => {
    if (confirm(t.blindTimer.confirmClearAll)) {
      onLevelsChange([]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-poker-brown/10 overflow-hidden">
      <div className="bg-poker-brown px-4 py-3 flex justify-between items-center">
        <h3 className="text-poker-gold font-bold text-lg">{t.blindTimer.editStructure}</h3>
        {levels.length > 0 && !disabled && (
          <Button variant="danger" size="sm" onClick={handleClearAll}>
            {t.blindTimer.clearAll}
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Existing levels */}
        {levels.length > 0 && (
          <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
            {levels.map((level, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-poker-cream/50 rounded-lg">
                <span className="text-poker-brown font-medium w-8">#{index + 1}</span>
                <Input
                  type="number"
                  value={level.smallBlind}
                  onChange={(e) => handleUpdateLevel(index, 'smallBlind', parseInt(e.target.value) || 0)}
                  className="w-20 text-sm"
                  disabled={disabled}
                />
                <span className="text-poker-brown/50">/</span>
                <Input
                  type="number"
                  value={level.bigBlind}
                  onChange={(e) => handleUpdateLevel(index, 'bigBlind', parseInt(e.target.value) || 0)}
                  className="w-20 text-sm"
                  disabled={disabled}
                />
                <span className="text-poker-brown/50 text-sm">{t.blindTimer.ante}:</span>
                <Input
                  type="number"
                  value={level.ante}
                  onChange={(e) => handleUpdateLevel(index, 'ante', parseInt(e.target.value) || 0)}
                  className="w-16 text-sm"
                  disabled={disabled}
                />
                <span className="text-poker-brown/50 text-sm">{t.blindTimer.minutes}:</span>
                <Input
                  type="number"
                  value={level.durationMinutes}
                  onChange={(e) => handleUpdateLevel(index, 'durationMinutes', parseInt(e.target.value) || 1)}
                  className="w-16 text-sm"
                  min={1}
                  disabled={disabled}
                />
                {!disabled && (
                  <button
                    onClick={() => handleRemoveLevel(index)}
                    className="p-1 text-poker-red hover:bg-poker-red/10 rounded"
                    title={t.common.delete}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new level */}
        {!disabled && (
          <div className="border-t border-poker-brown/10 pt-4">
            <div className="text-sm text-poker-brown/70 mb-2">{t.blindTimer.addNewLevel}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div>
                <label className="text-xs text-poker-brown/60">{t.blindTimer.smallBlind}</label>
                <Input
                  type="number"
                  value={newLevel.smallBlind}
                  onChange={(e) => setNewLevel({ ...newLevel, smallBlind: parseInt(e.target.value) || 0 })}
                  className="w-24"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-poker-brown/60">{t.blindTimer.bigBlind}</label>
                <Input
                  type="number"
                  value={newLevel.bigBlind}
                  onChange={(e) => setNewLevel({ ...newLevel, bigBlind: parseInt(e.target.value) || 0 })}
                  className="w-24"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-poker-brown/60">{t.blindTimer.ante}</label>
                <Input
                  type="number"
                  value={newLevel.ante}
                  onChange={(e) => setNewLevel({ ...newLevel, ante: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-poker-brown/60">{t.blindTimer.durationMin}</label>
                <Input
                  type="number"
                  value={newLevel.durationMinutes}
                  onChange={(e) => setNewLevel({ ...newLevel, durationMinutes: parseInt(e.target.value) || 1 })}
                  className="w-20"
                  min={1}
                />
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleAddLevel}
                  disabled={newLevel.smallBlind <= 0 || newLevel.bigBlind <= 0}
                  size="sm"
                  variant="gold"
                >
                  {t.blindTimer.addLevel}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
