import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { PauseSettingsModal } from './components/PauseSettingsModal';
import { SurvivalResultOverlay } from './components/SurvivalResultOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import { AmeyoEngine } from './game/engine';
import type { AudioSettings, HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  mode: 'title',
  variant: 'exploration',
  survivalOutcome: null,
  health: 100,
  maxHealth: 100,
  score: 0,
  zombieCount: 0,
  weaponName: '',
  weaponTier: 0,
  nextWeaponAt: null,
  districtId: 'commercial',
  districtName: 'Ameyo Station Front',
  districtJp: '雨夜駅前商業区',
  mounted: false,
  sitting: false,
  speedKmh: 0,
  promptText: null,
  clockText: '02:08 AM',
  toastText: null,
  activeLocationCard: null,
  discoveredPlaces: 0,
  totalPlaces: 14,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AmeyoEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    musicVolume: 0.55,
    sfxVolume: 0.72,
    muted: false,
    rainIntensity: 0.85,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new AmeyoEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    (window as unknown as { __ameyoEngine?: AmeyoEngine }).__ameyoEngine = engine;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startGame(['survival', 'zombie'].includes(params.get('mode') ?? '') ? 'survival' : 'exploration');
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
      delete (window as unknown as { __ameyoEngine?: AmeyoEngine }).__ameyoEngine;
    };
  }, []);

  const handleStart = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.startGame('exploration');
    canvasRef.current?.focus();
  }, []);

  const handleStartSurvival = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.startGame('survival');
    canvasRef.current?.focus();
  }, []);

  const handleRestartSurvival = useCallback(() => {
    engineRef.current?.restartSurvival();
    canvasRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (hud.mode === 'title' && !showSettings) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud.mode, showSettings, handleStart]);

  const handleChangeSettings = useCallback((next: AudioSettings) => {
    setAudioSettings(next);
    engineRef.current?.updateAudioSettings(next);
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!engineRef.current) return;
    const muted = engineRef.current.toggleMute();
    setAudioSettings((prev) => ({ ...prev, muted }));
  }, []);

  const handlePause = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.setMode('paused');
  }, []);

  const handleResume = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.setMode('playing');
    canvasRef.current?.focus();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.resetWorld();
    engineRef.current?.setMode('title');
  }, []);

  const handleResetPosition = useCallback(() => {
    setShowSettings(false);
    engineRef.current?.resetWorld();
    engineRef.current?.setMode('playing');
    canvasRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        hud.mode === 'playing' &&
        hud.variant === 'survival' &&
        hud.survivalOutcome &&
        !showSettings
      ) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleRestartSurvival();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          handleReturnToTitle();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud.mode, hud.variant, hud.survivalOutcome, showSettings, handleRestartSurvival, handleReturnToTitle]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070b14]">
      {/* Isolated full-viewport game canvas */}
      <canvas
        ref={canvasRef}
        data-testid="ameyo-canvas"
        tabIndex={0}
        className="block w-full h-full pixel-canvas outline-none"
      />

      {hud.mode === 'title' && !showSettings && (
        <TitleOverlay
          onStart={handleStart}
          onStartSurvival={handleStartSurvival}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {hud.mode === 'title' && showSettings && (
        <PauseSettingsModal
          isTitleSettings={true}
          showSettings={true}
          settings={audioSettings}
          onChangeSettings={handleChangeSettings}
          onResume={handleResume}
          onOpenSettings={() => setShowSettings(true)}
          onCloseSettings={() => setShowSettings(false)}
          onResetPosition={handleResetPosition}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {hud.mode === 'playing' && (
        <GameHud
          hud={hud}
          muted={audioSettings.muted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onDismissCard={() => engineRef.current?.dismissLocationCard()}
        />
      )}

      {hud.mode === 'playing' &&
        hud.variant === 'survival' &&
        hud.survivalOutcome && (
          <SurvivalResultOverlay
            hud={hud}
            onRestart={handleRestartSurvival}
            onReturnToTitle={handleReturnToTitle}
          />
        )}

      {hud.mode === 'paused' && (
        <PauseSettingsModal
          isTitleSettings={false}
          showSettings={showSettings}
          settings={audioSettings}
          onChangeSettings={handleChangeSettings}
          onResume={handleResume}
          onOpenSettings={() => setShowSettings(true)}
          onCloseSettings={() => setShowSettings(false)}
          onResetPosition={handleResetPosition}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </main>
  );
}
