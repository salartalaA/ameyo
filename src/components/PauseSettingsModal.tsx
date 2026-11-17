import React from 'react';
import type { AudioSettings } from '../game/types';

interface PauseSettingsModalProps {
  isTitleSettings: boolean;
  showSettings: boolean;
  settings: AudioSettings;
  onChangeSettings: (next: AudioSettings) => void;
  onResume: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onResetPosition: () => void;
  onReturnToTitle: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  isTitleSettings,
  showSettings,
  settings,
  onChangeSettings,
  onResume,
  onOpenSettings,
  onCloseSettings,
  onResetPosition,
  onReturnToTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(6, 10, 20, 0.72)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={showSettings ? 'Settings' : 'Paused'}
        className="w-full max-w-sm rounded-md border border-slate-700/80 p-6"
        style={{
          backgroundColor: '#0c1324',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
        }}
      >
        {showSettings ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-100">
                Settings
              </h2>
              <span className="font-mono-tabular text-xs text-slate-400">
                Audio & Rain
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                <div className="flex justify-between font-mono-tabular text-xs text-slate-400">
                  <span>Ambient Music</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      musicVolume: Number(e.target.value),
                    })
                  }
                  className="accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                <div className="flex justify-between font-mono-tabular text-xs text-slate-400">
                  <span>Rain & Sound Effects</span>
                  <span>{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      sfxVolume: Number(e.target.value),
                    })
                  }
                  className="accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                <div className="flex justify-between font-mono-tabular text-xs text-slate-400">
                  <span>Rainfall Density</span>
                  <span>{Math.round(settings.rainIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={1.2}
                  step={0.05}
                  value={settings.rainIntensity}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      rainIntensity: Number(e.target.value),
                    })
                  }
                  className="accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between pt-1 text-sm text-slate-200 cursor-pointer">
                <span>Mute All Audio</span>
                <input
                  type="checkbox"
                  checked={settings.muted}
                  onChange={(e) =>
                    onChangeSettings({ ...settings, muted: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onCloseSettings}
                className="px-5 py-2 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                {isTitleSettings ? 'Back' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-100">
                Paused
              </h2>
              <span className="font-mono-tabular text-xs text-slate-400">
                AMEYO · 2 AM
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 px-4 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Resume
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full py-2.5 px-4 rounded-md bg-[#141d33] hover:bg-[#1b2744] text-slate-100 border border-slate-700/80 font-medium text-sm transition-colors cursor-pointer"
              >
                Settings
              </button>

              <button
                type="button"
                onClick={onResetPosition}
                className="w-full py-2.5 px-4 rounded-md bg-[#141d33] hover:bg-[#1b2744] text-slate-200 border border-slate-700/80 font-medium text-sm transition-colors cursor-pointer"
              >
                Return to Konbini Spawn
              </button>

              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-md bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700/60 font-medium text-sm transition-colors cursor-pointer"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
