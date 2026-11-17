import React from 'react';
import type { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onDismissCard: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  onToggleMute,
  onPause,
  onDismissCard,
}) => {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-left: District & 2 AM Clock */}
        <div
          className="px-3.5 py-2 rounded-md border border-slate-700/60"
          style={{
            backgroundColor: 'rgba(10, 15, 28, 0.84)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono-tabular text-base font-semibold text-amber-300 tracking-tight">
              {hud.clockText}
            </span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-sm font-medium text-slate-100 whitespace-nowrap">
              {hud.districtName}
            </span>
            <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">
              {hud.districtJp}
            </span>
          </div>
          {hud.variant === 'survival' ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2 font-mono-tabular">
                <span className="text-[10px] tracking-[0.25em] text-rose-300">SCORE</span>
                <span className="text-lg font-semibold text-amber-300 leading-none">
                  {hud.score}
                </span>
                <span className="text-[11px] text-slate-400">/ 260</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-[11px] text-slate-400">
                  Undead {hud.zombieCount}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono-tabular text-[11px]">
                <span className="px-2 py-0.5 rounded border border-amber-400/40 bg-amber-400/10 text-amber-200">
                  {hud.weaponName}
                </span>
                {hud.nextWeaponAt !== null && (
                  <span className="text-slate-400">
                    next weapon at {hud.nextWeaponAt} kills
                  </span>
                )}
              </div>
              <div className="h-1.5 w-44 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100))}%`,
                    backgroundColor:
                      hud.health > 50 ? '#34d399' : hud.health > 25 ? '#fbbf24' : '#fb7185',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-slate-400 font-mono-tabular">
              Explored {hud.discoveredPlaces}/{hud.totalPlaces}
            </div>
          )}
        </div>

        {/* Top-right: Compact Utility Icon Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
            title={muted ? 'Unmute (M)' : 'Mute (M)'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-md flex items-center justify-center border border-slate-700/70 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/60 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 15, 28, 0.86)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" fillOpacity="0.2" />
              {muted ? (
                <>
                  <line x1="22" y1="9" x2="16" y2="15" />
                  <line x1="16" y1="9" x2="22" y2="15" />
                </>
              ) : (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause game (Esc)"
            title="Pause (Esc)"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-10 h-10 rounded-md flex items-center justify-center border border-slate-700/70 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/60 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 15, 28, 0.86)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center-bottom Toast / Location Story Card */}
      <div className="flex flex-col items-center gap-3">
        {hud.activeLocationCard && (
          <div
            role="dialog"
            aria-label={hud.activeLocationCard.title}
            className="pointer-events-auto max-w-md w-full rounded-md border border-slate-600/80 p-5"
            style={{
              backgroundColor: 'rgba(11, 17, 32, 0.94)',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.72)',
            }}
          >
            <div className="flex items-center justify-between gap-3 text-xs text-cyan-300 font-mono-tabular">
              <span>{hud.activeLocationCard.badge}</span>
              <span className="text-slate-400">{hud.activeLocationCard.subtitle}</span>
            </div>
            <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-50">
              {hud.activeLocationCard.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {hud.activeLocationCard.body}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onDismissCard();
                }}
                className="px-4 py-1.5 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-medium text-xs tracking-wide transition-colors cursor-pointer"
              >
                Step Back (E)
              </button>
            </div>
          </div>
        )}

        {hud.toastText && !hud.activeLocationCard && (
          <div
            className="max-w-lg px-4 py-2 rounded-md border border-slate-700/70 text-xs sm:text-sm text-slate-200 text-center"
            style={{
              backgroundColor: 'rgba(10, 15, 28, 0.88)',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)',
            }}
          >
            {hud.toastText}
          </div>
        )}

        {/* Bottom Perimeter Row: Contextual Prompt + Motorcycle Speedometer */}
        <div className="w-full flex items-end justify-between gap-4">
          <div className="font-mono-tabular text-[11px] text-slate-400/90 hidden sm:block">
            {hud.variant === 'survival'
              ? hud.mounted
                ? 'W/S Throttle · A/D Steer · Space Brake · Mouse Aim · Click/J Fire · E Dismount'
                : 'WASD Move · Shift Run · Mouse Aim · Click/J Fire · E Motorcycle · Esc Pause'
              : hud.mounted
                ? 'W/S Throttle · A/D Steer · Space Brake · E Dismount'
                : 'WASD Move · Shift Run · E Interact · Esc Pause'}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {hud.promptText && (
              <div
                className="px-3.5 py-1.5 rounded-md border border-cyan-400/70 text-xs font-mono-tabular text-cyan-200 font-medium tracking-wide"
                style={{
                  backgroundColor: 'rgba(10, 16, 30, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.55)',
                }}
              >
                {hud.promptText}
              </div>
            )}

            {hud.mounted && (
              <div
                className="px-3.5 py-1.5 rounded-md border border-emerald-400/50 flex items-baseline gap-1.5"
                style={{
                  backgroundColor: 'rgba(10, 16, 30, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.55)',
                }}
              >
                <span className="font-mono-tabular text-xl font-semibold text-emerald-300">
                  {hud.speedKmh}
                </span>
                <span className="font-mono-tabular text-[11px] text-slate-400">
                  km/h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
