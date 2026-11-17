import React from 'react';

interface TitleOverlayProps {
  onStart: () => void;
  onStartSurvival: () => void;
  onOpenSettings: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  onStart,
  onStartSurvival,
  onOpenSettings,
}) => {
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none"
      style={{
        background:
          'linear-gradient(105deg, rgba(7, 11, 20, 0.84) 0%, rgba(7, 11, 20, 0.56) 42%, rgba(7, 11, 20, 0.14) 100%)',
      }}
    >
      {/* Left-third negative-space composition */}
      <div className="flex-1 flex items-center px-8 sm:px-14 lg:px-20 max-w-2xl">
        <div className="pointer-events-auto flex flex-col items-start gap-7">
          {/* Bespoke inline SVG Title Lockup */}
          <div className="flex flex-col items-start gap-2.5">
            <svg
              viewBox="0 0 360 96"
              className="w-72 sm:w-88 h-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]"
              aria-label="AMEYO — Rainy Night Exploration"
            >
              {/* Crisp pixel-rain emblem mark */}
              <g transform="translate(2, 10)">
                <rect x="0" y="0" width="54" height="54" rx="4" fill="#0d1526" stroke="#38bdf8" strokeWidth="2" />
                <rect x="14" y="10" width="3" height="12" fill="#7dd3fc" />
                <rect x="26" y="6" width="3" height="16" fill="#22d3ee" />
                <rect x="38" y="12" width="3" height="11" fill="#fbbf24" />
                <rect x="10" y="34" width="34" height="3" fill="#334155" />
                <rect x="14" y="40" width="26" height="3" fill="#22d3ee" opacity="0.7" />
                <circle cx="27" cy="28" r="3" fill="#f8fafc" />
              </g>

              {/* Main Wordmark */}
              <text
                x="72"
                y="48"
                fill="#f8fafc"
                fontFamily="Outfit, sans-serif"
                fontWeight="700"
                fontSize="44"
                letterSpacing="6"
              >
                AMEYO
              </text>

              {/* Japanese kanji & English subtitle */}
              <text
                x="74"
                y="74"
                fill="#94a3b8"
                fontFamily="DM Sans, sans-serif"
                fontWeight="500"
                fontSize="14"
                letterSpacing="2.5"
              >
                雨夜 · RAINY NIGHT EXPLORATION
              </text>
            </svg>
          </div>

          {/* Primary Start + Settings CTAs (<= 3 actions total) */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStart();
              }}
              className="px-7 py-3 rounded-md bg-cyan-400 hover:bg-cyan-300 active:translate-y-px text-slate-950 font-display font-semibold text-base tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-[0_6px_22px_rgba(34,211,238,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              Start Game
            </button>

            <button
              type="button"
              data-start-survival="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartSurvival();
              }}
              className="px-5 py-3 rounded-md bg-rose-500 hover:bg-rose-400 active:translate-y-px text-slate-950 font-display font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-[0_6px_22px_rgba(244,63,94,0.30)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
            >
              Survival Mode
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSettings();
              }}
              className="px-5 py-3 rounded-md bg-[#11192b] hover:bg-[#19243d] text-slate-200 border border-slate-700/80 font-medium text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Single flat borderless bottom control-hint line */}
      <div className="px-8 sm:px-14 lg:px-20 pb-7">
        <p className="font-mono-tabular text-xs text-slate-300/85 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          WASD / Arrows Move · Shift Run · E Interact / Motorcycle · Space Brake · Mouse Aim · Click / J Fire · M Mute · Esc Pause
        </p>
      </div>
    </div>
  );
};
