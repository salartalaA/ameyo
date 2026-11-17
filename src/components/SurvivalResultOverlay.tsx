import React from 'react';
import { SURVIVAL_TARGET_SCORE } from '../game/weapons';
import type { HudSnapshot } from '../game/types';

interface SurvivalResultOverlayProps {
  hud: HudSnapshot;
  onRestart: () => void;
  onReturnToTitle: () => void;
}

export const SurvivalResultOverlay: React.FC<SurvivalResultOverlayProps> = ({
  hud,
  onRestart,
  onReturnToTitle,
}) => {
  const victory = hud.survivalOutcome === 'victory';
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-[min(92vw,460px)] rounded-lg border p-7 text-center"
        style={{
          backgroundColor: 'rgba(8, 12, 24, 0.92)',
          borderColor: victory ? 'rgba(52, 211, 153, 0.55)' : 'rgba(244, 63, 94, 0.55)',
          boxShadow: victory
            ? '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(52,211,153,0.15)'
            : '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(244,63,94,0.15)',
        }}
      >
        <div
          className={`font-mono-tabular text-[11px] tracking-[0.35em] ${
            victory ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {victory ? 'MISSION COMPLETE' : 'GAME OVER'}
        </div>
        <h2
          className={`mt-2 font-display text-4xl font-bold tracking-wide ${
            victory ? 'text-emerald-200' : 'text-rose-200'
          }`}
        >
          {victory ? 'VICTORY' : 'DEFEAT'}
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          {victory
            ? `You held the line through the rain and reached ${SURVIVAL_TARGET_SCORE} kills.`
            : `The horde overwhelmed you before you reached ${SURVIVAL_TARGET_SCORE} kills.`}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 font-mono-tabular">
          <div className="rounded-md border border-slate-700/70 bg-slate-900/60 py-3">
            <div className="text-[10px] text-slate-400 tracking-widest">SCORE</div>
            <div className="mt-1 text-2xl font-semibold text-amber-300">{hud.score}</div>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-900/60 py-3">
            <div className="text-[10px] text-slate-400 tracking-widest">TARGET</div>
            <div className="mt-1 text-2xl font-semibold text-slate-200">
              {SURVIVAL_TARGET_SCORE}
            </div>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-900/60 py-3">
            <div className="text-[10px] text-slate-400 tracking-widest">HP LEFT</div>
            <div className="mt-1 text-2xl font-semibold text-rose-300">{hud.health}</div>
          </div>
        </div>

        <div className="mt-4 font-mono-tabular text-[11px] text-slate-400">
          Final weapon: <span className="text-amber-200">{hud.weaponName}</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="px-6 py-2.5 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-semibold text-sm tracking-wide transition-colors cursor-pointer shadow-[0_6px_20px_rgba(34,211,238,0.25)]"
          >
            Restart Run
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onReturnToTitle();
            }}
            className="px-5 py-2.5 rounded-md bg-[#11192b] hover:bg-[#19243d] text-slate-200 border border-slate-700/80 font-medium text-sm tracking-wide transition-colors cursor-pointer"
          >
            Title Screen
          </button>
        </div>
        <p className="mt-4 font-mono-tabular text-[11px] text-slate-500">
          Enter also restarts · Esc returns to title
        </p>
      </div>
    </div>
  );
};
