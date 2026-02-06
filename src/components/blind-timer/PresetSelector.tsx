'use client';

import { useState, useEffect } from 'react';
import { BlindLevel, DEFAULT_LEVELS } from '@/hooks/useBlindTimer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Preset {
  id: string;
  name: string;
  levels: BlindLevel[];
  createdAt: string;
}

interface PresetSelectorProps {
  currentLevels: BlindLevel[];
  onLoadPreset: (levels: BlindLevel[]) => void;
  disabled?: boolean;
}

export function PresetSelector({
  currentLevels,
  onLoadPreset,
  disabled = false,
}: PresetSelectorProps) {
  const { t } = useLanguage();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/blind-presets');
      const data = await res.json();
      if (data.success) {
        setPresets(data.data.presets);
      }
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      setError(t.blindTimer.presetNameRequired);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/blind-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPresetName.trim(),
          levels: currentLevels,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.errors.somethingWentWrong);
      }

      setShowSaveModal(false);
      setNewPresetName('');
      fetchPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm(t.blindTimer.confirmDeletePreset)) return;

    try {
      const res = await fetch(`/api/blind-presets/${presetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPresets();
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  const handleLoadDefault = () => {
    onLoadPreset(DEFAULT_LEVELS);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-poker-brown/10 overflow-hidden">
      <div className="bg-poker-brown px-4 py-3 flex justify-between items-center">
        <h3 className="text-poker-gold font-bold text-lg">{t.blindTimer.presets}</h3>
        {!disabled && currentLevels.length > 0 && (
          <Button variant="gold" size="sm" onClick={() => setShowSaveModal(true)}>
            {t.blindTimer.savePreset}
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Default preset */}
        <button
          onClick={handleLoadDefault}
          disabled={disabled}
          className="w-full text-left p-3 mb-2 bg-poker-cream/50 hover:bg-poker-gold/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <div className="font-medium text-poker-brown">{t.blindTimer.defaultStructure}</div>
          <div className="text-sm text-poker-brown/60">
            {DEFAULT_LEVELS.length} {t.blindTimer.levels} (25/50 - 600/1200)
          </div>
        </button>

        {/* Saved presets */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-poker-gold mx-auto"></div>
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-4 text-poker-brown/50 text-sm">
            {t.blindTimer.noSavedPresets}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-3 bg-poker-cream/30 hover:bg-poker-gold/10 rounded-lg transition-colors"
              >
                <button
                  onClick={() => onLoadPreset(preset.levels as BlindLevel[])}
                  disabled={disabled}
                  className="flex-1 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-poker-brown">{preset.name}</div>
                  <div className="text-sm text-poker-brown/60">
                    {(preset.levels as BlindLevel[]).length} {t.blindTimer.levels}
                  </div>
                </button>
                {!disabled && (
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-2 text-poker-red hover:bg-poker-red/10 rounded"
                    title={t.common.delete}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Preset Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setNewPresetName('');
          setError('');
        }}
        title={t.blindTimer.savePreset}
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input
            label={t.blindTimer.presetName}
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder={t.blindTimer.presetNamePlaceholder}
          />
          <div className="text-sm text-poker-brown/60">
            {currentLevels.length} {t.blindTimer.levels} {t.blindTimer.willBeSaved}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSaveModal(false);
                setNewPresetName('');
                setError('');
              }}
            >
              {t.common.cancel}
            </Button>
            <Button variant="gold" onClick={handleSavePreset} loading={saving}>
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
