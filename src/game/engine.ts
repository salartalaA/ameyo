import { RainyNightAudio } from './audio';
import {
  MOTO_MAX_SPEED,
  clamp,
  dismountMotorcycle,
  findNearestInteractable,
  mountMotorcycle,
  speedToKmh,
  stepMotorcyclePhysics,
  stepPlayerMovement,
} from './physics';
import {
  buildStaticCityGroundCanvas,
  drawBuilding,
  drawMotorcycle,
  drawProp,
  drawProtagonist,
  drawWaterAndPuddles,
  drawZombie,
} from './pixelArt';
import {
  createSurvivalState,
  trySurvivalShot,
  updateSurvival,
} from './survival';
import {
  SURVIVAL_TARGET_SCORE,
  nextWeaponAt,
  weaponForScore,
  weaponTierForScore,
} from './weapons';
import type {
  AudioSettings,
  Building,
  GameMode,
  GameVariant,
  HudSnapshot,
  MotorcycleState,
  PlayerState,
  Rect,
  SurvivalState,
  WorldProp,
} from './types';
import { WeatherLightingSystem } from './weatherLighting';
import {
  BUILDINGS,
  CANAL_RECT,
  CROSSWALKS,
  INTERACTABLES,
  MOTORCYCLE_SPAWN,
  MOTORCYCLE_SPAWN_ANGLE,
  PLAYER_SPAWN,
  PROPS,
  PUDDLES,
  ROADS,
  SIDEWALKS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  buildStaticColliders,
  getDistrictAtPosition,
} from './worldData';

interface TireSprayParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export class AmeyoEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sceneCanvas: HTMLCanvasElement;
  private sceneCtx: CanvasRenderingContext2D;
  private groundCanvas: HTMLCanvasElement;
  private weather = new WeatherLightingSystem();
  private audio = new RainyNightAudio();

  private mode: GameMode = 'title';
  private variant: GameVariant = 'exploration';
  private survival: SurvivalState = createSurvivalState();
  private growlTimer = 2;
  private mouseX = 0;
  private mouseY = 0;
  private mouseInside = false;
  private fireHeld = false;
  private lastWeaponTier = 0;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private simTime = 0;
  private nightMinutes = 2 * 60 + 8; // starts at 02:08 AM

  private colliders: Rect[] = buildStaticColliders();
  private manholes: WorldProp[] = PROPS.filter((p) => p.kind === 'manhole');

  private player: PlayerState = {
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    vx: 0,
    vy: 0,
    radius: 10,
    facing: 'down',
    action: 'idle',
    gaitPhase: 0,
    idleTimer: 0,
    interactTimer: 0,
    sittingTargetId: null,
    seatPos: null,
    seatFacing: 'down',
    mounted: false,
    mountCooldown: 0,
  };

  private moto: MotorcycleState = {
    x: MOTORCYCLE_SPAWN.x,
    y: MOTORCYCLE_SPAWN.y,
    angle: MOTORCYCLE_SPAWN_ANGLE,
    speed: 0,
    steerInput: 0,
    throttle: 0,
    braking: false,
    headlightOn: false,
    radius: 16,
    wheelPhase: 0,
  };

  private camX = PLAYER_SPAWN.x;
  private camY = PLAYER_SPAWN.y;
  private pixelScale = 2.0; // crisp 3/4 top-down pixel art scale with generous sightlines

  private keysHeld = new Set<string>();
  private justPressed = new Set<string>();
  private prevGaitStep = 0;

  private sprayPool: TireSprayParticle[] = [];
  private sprayCursor = 0;

  private discoveredIds = new Set<string>();
  private activeLocationCard: HudSnapshot['activeLocationCard'] = null;
  private toastText: string | null = null;
  private toastTimer = 0;

  private onHudChange: (snapshot: HudSnapshot) => void;
  private lastHudKey = '';
  private resizeObserver: ResizeObserver;
  private viewCssW = 1280;
  private viewCssH = 720;

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snapshot: HudSnapshot) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.sceneCanvas = document.createElement('canvas');
    this.sceneCanvas.width = 600;
    this.sceneCanvas.height = 375;
    this.sceneCtx = this.sceneCanvas.getContext('2d')!;
    this.sceneCtx.imageSmoothingEnabled = false;

    this.onHudChange = onHudChange;
    this.groundCanvas = buildStaticCityGroundCanvas(ROADS, SIDEWALKS, CROSSWALKS);

    for (let i = 0; i < 32; i++) {
      this.sprayPool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, maxAge: 0.35 });
    }

    this.handleResize();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);

    this.emitHud(true);
    this.rafId = requestAnimationFrame(this.loop);
  }

  public destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.viewCssW = Math.max(320, Math.round(rect.width || window.innerWidth));
    this.viewCssH = Math.max(240, Math.round(rect.height || window.innerHeight));
    this.canvas.width = this.viewCssW;
    this.canvas.height = this.viewCssH;
    this.ctx.imageSmoothingEnabled = false;

    this.sceneCanvas.width = Math.max(240, Math.ceil(this.viewCssW / this.pixelScale));
    this.sceneCanvas.height = Math.max(160, Math.ceil(this.viewCssH / this.pixelScale));
    this.sceneCtx.imageSmoothingEnabled = false;
  }

  public setMode(next: GameMode): void {
    this.mode = next;
    document.body.dataset.state = next;
    this.keysHeld.clear();
    this.justPressed.clear();

    if (next === 'playing') {
      if (navigator.userActivation?.isActive) {
        this.audio.init();
      }
      // Snap camera close to protagonist on transition from title
      this.camX = this.player.x;
      this.camY = this.player.y;
    }
    this.emitHud(true);
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public startGame(variant: GameVariant = 'exploration'): void {
    this.variant = variant;
    this.survival = createSurvivalState();
    this.lastWeaponTier = 0;
    this.growlTimer = 2;
    this.fireHeld = false;
    this.mouseInside = false;
    this.discoveredIds.clear();
    this.activeLocationCard = null;
    this.toastText = null;
    this.toastTimer = 0;
    this.resetWorld();
    this.setMode('playing');
    if (navigator.userActivation?.isActive) {
      this.audio.init();
    }
  }

  public restartSurvival(): void {
    this.startGame('survival');
  }

  public dismissLocationCard(): void {
    this.activeLocationCard = null;
    this.emitHud(true);
  }

  public updateAudioSettings(settings: AudioSettings): void {
    this.audio.updateSettings(settings);
  }

  public getAudioSettings(): AudioSettings {
    return this.audio.getSettings();
  }

  public toggleMute(): boolean {
    const curr = this.audio.getSettings();
    const next = { ...curr, muted: !curr.muted };
    this.audio.updateSettings(next);
    this.showToast(next.muted ? 'Audio muted' : 'Audio resumed');
    return next.muted;
  }

  public resetWorld(): void {
    this.player.x = PLAYER_SPAWN.x;
    this.player.y = PLAYER_SPAWN.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.mounted = false;
    this.player.action = 'idle';
    this.player.facing = 'down';
    this.player.sittingTargetId = null;

    this.moto.x = MOTORCYCLE_SPAWN.x;
    this.moto.y = MOTORCYCLE_SPAWN.y;
    this.moto.angle = MOTORCYCLE_SPAWN_ANGLE;
    this.moto.speed = 0;
    this.moto.headlightOn = false;

    this.activeLocationCard = null;
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.emitHud(true);
  }

  private showToast(msg: string): void {
    this.toastText = msg;
    this.toastTimer = 3.2;
    this.emitHud(true);
  }

  private onWindowBlur = (): void => {
    this.keysHeld.clear();
    this.justPressed.clear();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.keysHeld.clear();
      this.justPressed.clear();
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (this.mode === 'playing' && navigator.userActivation?.isActive) {
      this.audio.init();
    }
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'Space'
    ) {
      e.preventDefault();
    }

    if (!this.keysHeld.has(code)) {
      this.justPressed.add(code);
    }
    this.keysHeld.add(code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.mouseInside = true;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.fireHeld = true;
    if (this.mode === 'playing' && navigator.userActivation?.isActive) {
      this.audio.init();
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.fireHeld = false;
  };

  private onMouseLeave = (): void => {
    this.mouseInside = false;
    this.fireHeld = false;
  };

  private getAimTarget(): { x: number; y: number } {
    const worldViewW = this.sceneCanvas.width;
    const worldViewH = this.sceneCanvas.height;
    const tlX = clamp(this.camX - worldViewW / 2, 0, Math.max(0, WORLD_WIDTH - worldViewW));
    const tlY = clamp(this.camY - worldViewH / 2, 0, Math.max(0, WORLD_HEIGHT - worldViewH));
    if (!this.mouseInside) {
      const originX = this.player.mounted ? this.moto.x : this.player.x;
      const originY = this.player.mounted ? this.moto.y : this.player.y;
      const angle = this.player.mounted ? this.moto.angle : this.facingAngle();
      return { x: originX + Math.cos(angle) * 120, y: originY + Math.sin(angle) * 120 };
    }
    return {
      x: tlX + (this.mouseX / Math.max(1, this.viewCssW)) * worldViewW,
      y: tlY + (this.mouseY / Math.max(1, this.viewCssH)) * worldViewH,
    };
  }

  private facingAngle(): number {
    switch (this.player.facing) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'right': return 0;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.update(dt);
    this.render();

    this.justPressed.clear();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    // Handle edge-triggered global shortcuts
    if (this.justPressed.has('KeyM')) {
      this.toggleMute();
    }

    if (this.mode === 'title') {
      this.simTime += dt;
      // Smooth atmospheric live-city camera tour framing Konbini, parked bike & Main Blvd in right two-thirds
      const tourX = 960 + Math.sin(this.simTime * 0.14) * 140;
      const tourY = 980 + Math.cos(this.simTime * 0.11) * 48;
      this.camX = tourX;
      this.camY = tourY;

      const worldViewW = this.viewCssW / this.pixelScale;
      const worldViewH = this.viewCssH / this.pixelScale;
      const halfW = worldViewW / 2;
      const halfH = worldViewH / 2;
      const tlX = clamp(this.camX - halfW, 0, Math.max(0, WORLD_WIDTH - worldViewW));
      const tlY = clamp(this.camY - halfH, 0, Math.max(0, WORLD_HEIGHT - worldViewH));

      this.weather.update(
        dt,
        this.audio.getSettings().rainIntensity,
        this.viewCssW,
        this.viewCssH,
        tlX,
        tlY,
        this.manholes
      );
      return;
    }

    const runEnded = this.variant === 'survival' && this.survival.outcome !== null;
    if (this.justPressed.has('Escape') || this.justPressed.has('KeyP')) {
      if (this.activeLocationCard) {
        this.activeLocationCard = null;
        this.emitHud(true);
      } else if (this.mode === 'playing' && !runEnded) {
        this.setMode('paused');
        return;
      } else if (this.mode === 'paused') {
        this.setMode('playing');
        return;
      }
    }

    if (this.mode === 'paused') {
      this.audio.update(dt, this.player.mounted, 0, true);
      return;
    }

    // Active Playing simulation
    this.simTime += dt;
    this.nightMinutes += dt * 0.25; // slow gentle 2 AM progression

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastText = null;
      }
    }

    const survivalLocked =
      this.variant === 'survival' && this.survival.outcome !== null;

    // If a location story card is open, pressing E/Enter/Space closes it cleanly
    if (!survivalLocked) {
      if (this.activeLocationCard) {
        if (
          this.justPressed.has('KeyE') ||
          this.justPressed.has('Enter') ||
          this.justPressed.has('Space')
        ) {
          this.activeLocationCard = null;
          this.emitHud(true);
        }
      } else {
        // Handle E interaction / Motorcycle Mount & Dismount
        if (this.justPressed.has('KeyE')) {
          this.handleInteract();
        }
      }
    }

    // Movement Input
    const up = this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp');
    const down = this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown');
    const left = this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft');
    const right = this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight');
    const running = this.keysHeld.has('ShiftLeft') || this.keysHeld.has('ShiftRight');
    const braking = this.keysHeld.has('Space');

    if (survivalLocked) {
      // Frozen once the run ends; the city keeps rendering behind the result overlay.
      this.moto.speed *= Math.max(0, 1 - dt * 3);
    } else if (this.player.mounted) {
      const throttle = (up ? 1 : 0) - (down ? 1 : 0);
      const steer = (right ? 1 : 0) - (left ? 1 : 0);
      stepMotorcyclePhysics(
        this.moto,
        { throttle, steer, brake: braking },
        dt,
        this.colliders,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        true
      );
      this.player.x = this.moto.x;
      this.player.y = this.moto.y;

      // Wet tire spray particles when moving fast
      if (Math.abs(this.moto.speed) > 85 && Math.random() < 0.75) {
        const sp = this.sprayPool[this.sprayCursor];
        this.sprayCursor = (this.sprayCursor + 1) % this.sprayPool.length;
        sp.active = true;
        sp.x = this.moto.x - Math.cos(this.moto.angle) * 16;
        sp.y = this.moto.y - Math.sin(this.moto.angle) * 16;
        sp.vx = -Math.cos(this.moto.angle) * 32 + (Math.random() - 0.5) * 26;
        sp.vy = -Math.sin(this.moto.angle) * 32 + (Math.random() - 0.5) * 26;
        sp.age = 0;
        sp.maxAge = 0.28 + Math.random() * 0.14;
      }
    } else {
      // Gently let parked bike coast if it had residual speed
      stepMotorcyclePhysics(
        this.moto,
        { throttle: 0, steer: 0, brake: true },
        dt,
        this.colliders,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        false
      );

      if (!this.activeLocationCard) {
        const moveX = (right ? 1 : 0) - (left ? 1 : 0);
        const moveY = (down ? 1 : 0) - (up ? 1 : 0);
        const motoBox: Rect = {
          x: this.moto.x - 14,
          y: this.moto.y - 10,
          w: 28,
          h: 20,
        };
        stepPlayerMovement(
          this.player,
          { moveX, moveY, running },
          dt,
          this.colliders,
          WORLD_WIDTH,
          WORLD_HEIGHT,
          motoBox
        );

        // Sync footsteps to distance-driven gait phase
        const currStep = Math.floor(this.player.gaitPhase / Math.PI);
        if (
          currStep !== this.prevGaitStep &&
          (this.player.action === 'walk' || this.player.action === 'run')
        ) {
          this.prevGaitStep = currStep;
          this.audio.playFootstep(this.player.action === 'run');
        }
      }
    }

    if (this.variant === 'survival') {
      this.updateSurvivalFrame(dt);
    }

    // Update tire spray pool
    for (let i = 0; i < this.sprayPool.length; i++) {
      const sp = this.sprayPool[i];
      if (!sp.active) continue;
      sp.age += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.age >= sp.maxAge) sp.active = false;
    }

    // Smooth Camera2D follow with subtle velocity look-ahead on motorcycle
    const lookAheadX = this.player.mounted ? Math.cos(this.moto.angle) * (this.moto.speed * 0.22) : 0;
    const lookAheadY = this.player.mounted ? Math.sin(this.moto.angle) * (this.moto.speed * 0.22) : 0;
    const targetCamX = this.player.x + lookAheadX;
    const targetCamY = this.player.y + lookAheadY;
    const smooth = 1 - Math.exp(-7.5 * dt);
    this.camX += (targetCamX - this.camX) * smooth;
    this.camY += (targetCamY - this.camY) * smooth;

    const worldViewW = this.viewCssW / this.pixelScale;
    const worldViewH = this.viewCssH / this.pixelScale;
    const tlX = clamp(this.camX - worldViewW / 2, 0, Math.max(0, WORLD_WIDTH - worldViewW));
    const tlY = clamp(this.camY - worldViewH / 2, 0, Math.max(0, WORLD_HEIGHT - worldViewH));

    this.weather.update(
      dt,
      this.audio.getSettings().rainIntensity,
      this.viewCssW,
      this.viewCssH,
      tlX,
      tlY,
      this.manholes,
      () => this.audio.playThunder()
    );

    const speedRatio = clamp(Math.abs(this.moto.speed) / MOTO_MAX_SPEED, 0, 1);
    this.audio.update(dt, this.player.mounted, speedRatio, false);

    this.emitHud(false);
  }

  private updateSurvivalFrame(dt: number): void {
    const aim = this.getAimTarget();
    const wantsFire = this.fireHeld || this.keysHeld.has('KeyJ') || this.keysHeld.has('KeyF');
    const weapon = weaponForScore(this.survival.score);

    // Weapon upgrade toast when a milestone is crossed.
    const tier = weaponTierForScore(this.survival.score);
    if (tier > this.lastWeaponTier) {
      this.lastWeaponTier = tier;
      if (this.survival.score > 0) {
        this.showToast(`Weapon upgraded — ${weapon.name} ${weapon.jpName}`);
      }
    }

    if (wantsFire && this.survival.outcome === null) {
      const shot = trySurvivalShot(
        this.survival,
        this.player,
        this.moto,
        aim.x,
        aim.y,
        this.colliders,
        WORLD_WIDTH,
        WORLD_HEIGHT
      );
      if (shot.fired) {
        if (shot.weapon === 'pistol') {
          this.audio.playGunshot(shot.hitZombie);
        } else if (shot.weapon) {
          this.audio.playWeaponShot(shot.weapon);
        }
        if (shot.killedZombie) {
          this.audio.playZombieHit();
        }
      }
    }

    const events = updateSurvival(
      this.survival,
      this.player,
      this.moto,
      dt,
      this.colliders,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );

    for (const event of events) {
      if (event.type === 'playerHit') {
        this.audio.playPlayerHurt();
        if (this.survival.health <= 0) {
          this.audio.playSurvivalSting('defeat');
        }
      } else if (event.type === 'explosion') {
        this.audio.playExplosion();
      } else if (event.type === 'victory') {
        this.audio.playSurvivalSting('victory');
        this.showToast(`Run complete — ${this.survival.score} zombies down`);
      } else if (event.type === 'defeat') {
        this.audio.playSurvivalSting('defeat');
      }
    }

    // Occasional distant groans keep the horde audible without spamming SFX.
    if (this.survival.outcome === null && this.survival.zombies.length > 0) {
      this.growlTimer -= dt;
      if (this.growlTimer <= 0) {
        this.growlTimer = 2.4 + Math.random() * 3.2;
        this.audio.playZombieGrowl();
      }
    }
  }

  private handleInteract(): void {
    if (this.player.mounted) {
      if (Math.abs(this.moto.speed) > 95) {
        this.showToast('Slow down before stepping off the bike');
        return;
      }
      dismountMotorcycle(this.player, this.moto, this.colliders, WORLD_WIDTH, WORLD_HEIGHT);
      this.audio.playInteractionSound('mount');
      this.emitHud(true);
      return;
    }

    if (this.variant === 'survival') {
      const near = findNearestInteractable(this.player, this.moto, INTERACTABLES);
      if (!near || near.kind !== 'motorcycle') {
        this.showToast(`Zombie Mode — ${SURVIVAL_TARGET_SCORE} kills to win · stay moving`);
        return;
      }
    }

    if (this.player.action === 'sit') {
      this.player.action = 'idle';
      this.player.sittingTargetId = null;
      this.player.seatPos = null;
      this.emitHud(true);
      return;
    }

    const nearest = findNearestInteractable(this.player, this.moto, INTERACTABLES);
    if (!nearest) return;

    if (nearest.kind === 'motorcycle') {
      if (mountMotorcycle(this.player, this.moto)) {
        this.audio.playInteractionSound('mount');
        this.showToast('Engine warm · WASD Ride · Space Brake · E Dismount');
        this.emitHud(true);
      }
      return;
    }

    const item = nearest.interactable;
    this.discoveredIds.add(item.id);
    this.player.interactTimer = 0.45;
    this.audio.playInteractionSound(item.sfx ?? 'chime');

    if (item.kind === 'bench') {
      this.player.action = 'sit';
      this.player.sittingTargetId = item.id;
      this.player.facing = item.facing ?? 'down';
      this.player.x = item.x;
      this.player.y = item.y - 6;
      this.showToast(`${item.title} — ${item.description}`);
      this.emitHud(true);
      return;
    }

    // Shops, Vending Machines, Phone Booth, Gas Station, Shrine open clean atmospheric location card
    const badgeMap: Record<string, string> = {
      vending: 'Vending Machine',
      shop: 'Open Late · 24H',
      shrine: 'Quiet Landmark',
      phone_booth: 'Street Corner',
      gas_pump: '24H Service',
    };

    this.activeLocationCard = {
      title: item.title,
      subtitle: getDistrictAtPosition(item.x, item.y).name,
      body: item.description,
      badge: badgeMap[item.kind] || 'Ameyo City',
    };
    this.emitHud(true);
  }

  private render(): void {
    const viewW = this.viewCssW;
    const viewH = this.viewCssH;
    const worldViewW = this.sceneCanvas.width;
    const worldViewH = this.sceneCanvas.height;

    const tlX = clamp(this.camX - worldViewW / 2, 0, Math.max(0, WORLD_WIDTH - worldViewW));
    const tlY = clamp(this.camY - worldViewH / 2, 0, Math.max(0, WORLD_HEIGHT - worldViewH));

    const sctx = this.sceneCtx;
    sctx.fillStyle = '#090d18';
    sctx.fillRect(0, 0, worldViewW, worldViewH);

    sctx.save();
    sctx.translate(-Math.round(tlX), -Math.round(tlY));
    sctx.imageSmoothingEnabled = false;

    // 1. Pre-baked static city ground (clipped to viewport slice for speed)
    const sx = Math.max(0, Math.floor(tlX));
    const sy = Math.max(0, Math.floor(tlY));
    const sw = Math.min(WORLD_WIDTH - sx, worldViewW + 2);
    const sh = Math.min(WORLD_HEIGHT - sy, worldViewH + 2);
    if (sw > 0 && sh > 0) {
      sctx.drawImage(this.groundCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
    }

    // 2. Animated Canal Water & Wet Puddle Ripples
    drawWaterAndPuddles(sctx, PUDDLES, this.simTime, tlX, tlY, worldViewW, worldViewH);

    // 3. Wet Ground Neon & Lamp Reflections
    this.weather.drawGroundReflections(
      sctx,
      BUILDINGS,
      PROPS,
      tlX,
      tlY,
      worldViewW,
      worldViewH,
      this.simTime
    );

    // 4. Tire water spray particles
    for (let i = 0; i < this.sprayPool.length; i++) {
      const sp = this.sprayPool[i];
      if (!sp.active) continue;
      const alpha = (1 - sp.age / sp.maxAge) * 0.45;
      sctx.fillStyle = `rgba(186, 230, 253, ${alpha.toFixed(2)})`;
      sctx.fillRect(Math.round(sp.x), Math.round(sp.y), 2, 2);
    }

    // 5. Y-sorted Buildings, Props, Motorcycle, and Protagonist
    type DrawItem = { sortY: number; draw: () => void };
    const drawList: DrawItem[] = [];

    for (const b of BUILDINGS) {
      if (
        b.x + b.w < tlX - 40 ||
        b.x > tlX + worldViewW + 40 ||
        b.y + b.h < tlY - 40 ||
        b.y > tlY + worldViewH + 40
      ) {
        continue;
      }
      drawList.push({
        sortY: b.y + b.h,
        draw: () => drawBuilding(sctx, b, this.simTime),
      });
    }

    for (const p of PROPS) {
      if (
        p.x + p.w < tlX - 40 ||
        p.x > tlX + worldViewW + 40 ||
        p.y + p.h < tlY - 40 ||
        p.y > tlY + worldViewH + 40
      ) {
        continue;
      }
      const sortY = p.kind === 'manhole' ? -1000 : p.y + p.h;
      drawList.push({
        sortY,
        draw: () => drawProp(sctx, p, this.simTime),
      });
    }

    const survivalAim = this.variant === 'survival' ? this.survival.aimAngle : undefined;
    const survivalFlash = this.variant === 'survival' && this.survival.muzzleTimer > 0;
    const weaponKind =
      this.variant === 'survival' ? weaponForScore(this.survival.score).kind : 'pistol';

    drawList.push({
      sortY: this.moto.y + 8,
      draw: () =>
        drawMotorcycle(
          sctx,
          this.moto,
          this.player.mounted,
          this.simTime,
          survivalAim,
          survivalFlash,
          weaponKind
        ),
    });

    for (const z of this.survival.zombies) {
      if (
        z.x + 24 < tlX ||
        z.x - 24 > tlX + worldViewW ||
        z.y + 28 < tlY ||
        z.y - 28 > tlY + worldViewH
      ) {
        continue;
      }
      drawList.push({
        sortY: z.y + 2,
        draw: () => drawZombie(sctx, z, this.simTime),
      });
    }

    if (!this.player.mounted) {
      drawList.push({
        sortY: this.player.y + 2,
        draw: () => drawProtagonist(sctx, this.player, this.simTime, survivalAim, survivalFlash, weaponKind),
      });
    }

    drawList.sort((a, b) => a.sortY - b.sortY);
    for (let i = 0; i < drawList.length; i++) {
      drawList[i].draw();
    }

    if (this.variant === 'survival') {
      // Bomber projectiles: dark bomb with fins, oriented along velocity
      for (const r of this.survival.projectiles) {
        const rx = Math.round(r.x);
        const ry = Math.round(r.y);
        const ra = Math.atan2(r.vy, r.vx);
        sctx.save();
        sctx.translate(rx, ry);
        sctx.rotate(ra);
        sctx.fillStyle = '#1f2937';
        sctx.fillRect(-3, -3, 7, 6);
        sctx.fillStyle = '#475569';
        sctx.fillRect(-3, -3, 7, 2);
        sctx.fillStyle = '#fbbf24';
        sctx.fillRect(-5, -1, 2, 2);
        sctx.fillStyle = '#f87171';
        sctx.fillRect(3, -2, 3, 4);
        sctx.fillStyle = '#fecaca';
        sctx.fillRect(5, -1, 2, 2);
        sctx.restore();
      }
      for (const tr of this.survival.tracers) {
        const alpha = Math.max(0, 1 - tr.life / tr.maxLife);
        sctx.strokeStyle = tr.color
          ? hexToRgba(tr.color, alpha)
          : `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
        sctx.lineWidth = tr.width ?? 1;
        sctx.beginPath();
        sctx.moveTo(Math.round(tr.x1), Math.round(tr.y1));
        sctx.lineTo(Math.round(tr.x2), Math.round(tr.y2));
        sctx.stroke();
        sctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        sctx.fillRect(Math.round(tr.x2) - 1, Math.round(tr.y2) - 1, 2, 2);
      }
      for (const p of this.survival.particles) {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        sctx.fillStyle = p.color;
        sctx.globalAlpha = alpha;
        sctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        sctx.globalAlpha = 1;
      }
      if (this.survival.hurtFlash > 0) {
        sctx.fillStyle = `rgba(190, 30, 45, ${(this.survival.hurtFlash * 0.28).toFixed(3)})`;
        sctx.fillRect(tlX, tlY, worldViewW, worldViewH);
      }
    }

    // 6. World-space subtle indicator above nearest interactable when in playing mode
    if (this.mode === 'playing' && !this.player.mounted && !this.activeLocationCard) {
      const nearest = findNearestInteractable(this.player, this.moto, INTERACTABLES);
      if (nearest) {
        const ix = nearest.kind === 'motorcycle' ? this.moto.x : nearest.interactable.x;
        const iy = nearest.kind === 'motorcycle' ? this.moto.y - 22 : nearest.interactable.y - 34;
        const bob = Math.sin(this.simTime * 4) * 2;
        sctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        sctx.fillRect(Math.round(ix - 8), Math.round(iy + bob - 8), 16, 14);
        sctx.strokeStyle = '#38bdf8';
        sctx.lineWidth = 1;
        sctx.strokeRect(Math.round(ix - 8), Math.round(iy + bob - 8), 16, 14);
        sctx.fillStyle = '#f8fafc';
        sctx.font = 'bold 9px "JetBrains Mono", monospace';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('E', Math.round(ix), Math.round(iy + bob - 1));
      }
    }

    // 7. Manhole steam & splash rings
    this.weather.drawSteamAndSplashes(sctx);

    sctx.restore();

    // 8. Atmospheric Night Lighting Overlay at native pixel resolution (scale=1)
    this.weather.drawNightLightingOverlay(
      sctx,
      worldViewW,
      worldViewH,
      tlX,
      tlY,
      1,
      BUILDINGS,
      PROPS,
      this.player,
      this.moto
    );

    // 9. Blit crisp pixel-art buffer to display canvas
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.sceneCanvas, 0, 0, viewW, viewH);

    // 10. Crisp diagonal Rain Streaks in viewport space
    this.weather.drawRainStreaks(
      this.ctx,
      viewW,
      viewH,
      this.audio.getSettings().rainIntensity
    );

    if (
      this.mode === 'playing' &&
      this.variant === 'survival' &&
      this.survival.outcome === null &&
      this.mouseInside
    ) {
      const mx = Math.round(this.mouseX);
      const my = Math.round(this.mouseY);
      this.ctx.fillStyle = 'rgba(10, 15, 28, 0.85)';
      this.ctx.fillRect(mx - 5, my - 1, 11, 3);
      this.ctx.fillRect(mx - 1, my - 5, 3, 11);
      this.ctx.fillStyle = '#fef08a';
      this.ctx.fillRect(mx - 4, my, 3, 1);
      this.ctx.fillRect(mx + 2, my, 3, 1);
      this.ctx.fillRect(mx, my - 4, 1, 3);
      this.ctx.fillRect(mx, my + 2, 1, 3);
    }

    if (this.mode === 'playing' && this.variant === 'survival') {
      this.drawMinimap(viewW, viewH);
    }
  }

  // Live tactical minimap: white = player, red = zombies, roads in slate.
  private drawMinimap(viewW: number, viewH: number): void {
    const ctx = this.ctx;
    const mapW = Math.min(220, Math.floor(viewW * 0.24));
    const mapH = Math.round((mapW * WORLD_HEIGHT) / WORLD_WIDTH);
    const pad = 14;
    const mx = viewW - mapW - pad;
    const my = viewH - mapH - pad;
    const scale = mapW / WORLD_WIDTH;
    const px = (wx: number) => mx + wx * scale;
    const py = (wy: number) => my + wy * scale;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(mx - 4, my - 4, mapW + 8, mapH + 8);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 4, my - 4, mapW + 8, mapH + 8);
    ctx.fillStyle = 'rgba(51, 65, 85, 0.8)';
    for (const r of ROADS) {
      ctx.fillRect(px(r.x), py(r.y), Math.max(1, r.w * scale), Math.max(1, r.h * scale));
    }
    ctx.fillStyle = 'rgba(30, 58, 138, 0.55)';
    ctx.fillRect(px(CANAL_RECT.x), py(CANAL_RECT.y), CANAL_RECT.w * scale, CANAL_RECT.h * scale);

    // Zombies: red = ordinary, purple = armed (shooters).
    for (const z of this.survival.zombies) {
      ctx.fillStyle = z.armed ? '#a855f7' : '#ef4444';
      ctx.fillRect(px(z.x) - 1, py(z.y) - 1, 2, 2);
    }

    // Player: white marker with heading tick.
    const ux = px(this.player.mounted ? this.moto.x : this.player.x);
    const uy = py(this.player.mounted ? this.moto.y : this.player.y);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ux - 2, uy - 2, 4, 4);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ux, uy);
    const heading = this.player.mounted ? this.moto.angle : this.facingAngle();
    ctx.lineTo(ux + Math.cos(heading) * 6, uy + Math.sin(heading) * 6);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.fillText(`KILLS ${this.survival.score}/${SURVIVAL_TARGET_SCORE}`, mx - 4, my + mapH + 6);
    ctx.restore();
  }

  private emitHud(force: boolean): void {
    const district = getDistrictAtPosition(this.player.x, this.player.y);
    const nearest =
      this.mode === 'playing' && !this.activeLocationCard
        ? findNearestInteractable(this.player, this.moto, INTERACTABLES)
        : null;

    let promptText: string | null = null;
    if (this.mode === 'playing') {
      if (this.player.mounted) {
        promptText =
          Math.abs(this.moto.speed) <= 95 ? '[E] Get off motorcycle' : null;
      } else if (this.player.action === 'sit') {
        promptText = '[E] or Move to stand up';
      } else if (nearest) {
        promptText = `[E] ${nearest.prompt}`;
      }
    }

    const hrs = Math.floor(this.nightMinutes / 60) % 24;
    const mins = Math.floor(this.nightMinutes % 60);
    const clockText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} AM`;
    const speedKmh = this.player.mounted ? speedToKmh(this.moto.speed) : 0;

    const key = [
      this.mode,
      this.variant,
      this.survival.outcome ?? '',
      Math.round(this.survival.health),
      this.survival.score,
      this.survival.zombies.length,
      weaponForScore(this.survival.score).kind,
      district.id,
      this.player.mounted,
      this.player.action === 'sit',
      speedKmh,
      promptText,
      clockText,
      this.toastText,
      this.activeLocationCard?.title ?? '',
      this.discoveredIds.size,
    ].join('|');

    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;

    this.onHudChange({
      mode: this.mode,
      variant: this.variant,
      survivalOutcome: this.variant === 'survival' ? this.survival.outcome : null,
      health: this.variant === 'survival' ? Math.ceil(this.survival.health) : 100,
      maxHealth: this.survival.maxHealth,
      score: this.variant === 'survival' ? this.survival.score : 0,
      zombieCount: this.variant === 'survival' ? this.survival.zombies.length : 0,
      weaponName:
        this.variant === 'survival' ? weaponForScore(this.survival.score).name : '',
      weaponTier: this.variant === 'survival' ? weaponTierForScore(this.survival.score) : 0,
      nextWeaponAt: this.variant === 'survival' ? nextWeaponAt(this.survival.score) : null,
      districtId: district.id,
      districtName: district.name,
      districtJp: district.jpName,
      mounted: this.player.mounted,
      sitting: this.player.action === 'sit',
      speedKmh,
      promptText,
      clockText,
      toastText: this.toastText,
      activeLocationCard: this.activeLocationCard,
      discoveredPlaces: this.discoveredIds.size,
      totalPlaces: INTERACTABLES.length,
    });
  }
}
