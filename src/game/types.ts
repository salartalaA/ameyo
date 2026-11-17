export type GameMode = 'title' | 'playing' | 'paused' | 'ended';
export type GameVariant = 'exploration' | 'survival';
export type SurvivalOutcome = 'victory' | 'defeat' | null;

export type Direction = 'down' | 'up' | 'left' | 'right';

export type DistrictId =
  | 'commercial'
  | 'residential'
  | 'entertainment'
  | 'quiet'
  | 'market'
  | 'hills';

export type PlayerActionState =
  | 'idle'
  | 'phone_idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'interact'
  | 'riding';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facing: Direction;
  action: PlayerActionState;
  gaitPhase: number;
  idleTimer: number;
  interactTimer: number;
  sittingTargetId: string | null;
  seatPos: Vec2 | null;
  seatFacing: Direction;
  mounted: boolean;
  mountCooldown: number;
}

export interface MotorcycleState {
  x: number;
  y: number;
  angle: number; // radians, 0 = right, Math.PI/2 = down
  speed: number; // scalar signed speed (px/s)
  steerInput: number; // -1..1
  throttle: number; // -1..1
  braking: boolean;
  headlightOn: boolean;
  radius: number;
  wheelPhase: number;
}

export interface ZombieState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackAnim: number;
  hitFlash: number;
  walkPhase: number;
  facing: Direction;
  armed?: boolean;
}

export interface SurvivalTracer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  color?: string;
  width?: number;
}

export interface SurvivalProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  damage: number;
  radius: number;
}

export interface SurvivalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SurvivalState {
  time: number;
  score: number;
  health: number;
  maxHealth: number;
  spawnTimer: number;
  spawnCount: number;
  shootCooldown: number;
  hurtFlash: number;
  aimAngle: number;
  muzzleTimer: number;
  tracers: SurvivalTracer[];
  projectiles: SurvivalProjectile[];
  particles: SurvivalParticle[];
  zombies: ZombieState[];
  outcome: SurvivalOutcome;
  finalHealUsed?: boolean;
}

export type BuildingKind =
  | 'konbini'
  | 'ramen'
  | 'cafe'
  | 'apartment'
  | 'house'
  | 'arcade'
  | 'karaoke'
  | 'izakaya'
  | 'gas_station'
  | 'shrine';

export interface NeonSign {
  offsetX: number;
  offsetY: number;
  w: number;
  h: number;
  text: string;
  color: string;
  glowColor: string;
  flicker?: boolean;
  vertical?: boolean;
}

export interface Building {
  id: string;
  kind: BuildingKind;
  name: string;
  jpLabel: string;
  district: DistrictId;
  x: number;
  y: number;
  w: number;
  h: number;
  roofHeight: number;
  wallColor: string;
  trimColor: string;
  roofColor: string;
  accentColor: string;
  signs: NeonSign[];
  doorX?: number;
  doorY?: number;
  warmLights: boolean;
}

export type PropKind =
  | 'vending'
  | 'bench'
  | 'lamp'
  | 'traffic_light'
  | 'bicycle'
  | 'tree'
  | 'manhole'
  | 'utility_pole'
  | 'bollard'
  | 'gas_pump'
  | 'shrine_lantern'
  | 'phone_booth'
  | 'dumpster'
  | 'potted_plant'
  | 'car'
  | 'traffic_cone'
  | 'crate'
  | 'sign_pole'
  | 'planter'
  | 'ac_unit'
  | 'vent';

export interface WorldProp {
  id: string;
  kind: PropKind;
  x: number;
  y: number;
  w: number;
  h: number;
  collides: boolean;
  facing?: Direction;
  lightColor?: string;
  lightRadius?: number;
  label?: string;
}

export type InteractableKind =
  | 'motorcycle'
  | 'bench'
  | 'vending'
  | 'shop'
  | 'shrine'
  | 'phone_booth'
  | 'gas_pump'
  | 'viewpoint';

export interface Interactable {
  id: string;
  kind: InteractableKind;
  x: number;
  y: number;
  radius: number;
  prompt: string;
  title: string;
  description: string;
  facing?: Direction;
  seatOffset?: Vec2;
  sfx?: 'vending' | 'bench' | 'shop' | 'chime';
}

export interface RoadSegment {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: 'h' | 'v' | 'intersection';
}

export interface Crosswalk {
  x: number;
  y: number;
  w: number;
  h: number;
  orientation: 'h' | 'v';
}

export interface Puddle {
  x: number;
  y: number;
  rx: number;
  ry: number;
  tint: string;
}

export interface DistrictZone {
  id: DistrictId;
  name: string;
  jpName: string;
  rect: Rect;
}

export interface AudioSettings {
  musicVolume: number; // 0..1
  sfxVolume: number;   // 0..1
  muted: boolean;
  rainIntensity: number; // 0.4..1.2
}

export interface HudSnapshot {
  mode: GameMode;
  variant: GameVariant;
  survivalOutcome: SurvivalOutcome;
  health: number;
  maxHealth: number;
  score: number;
  zombieCount: number;
  weaponName: string;
  weaponTier: number;
  nextWeaponAt: number | null;
  districtId: DistrictId;
  districtName: string;
  districtJp: string;
  mounted: boolean;
  sitting: boolean;
  speedKmh: number;
  promptText: string | null;
  clockText: string;
  toastText: string | null;
  activeLocationCard: {
    title: string;
    subtitle: string;
    body: string;
    badge: string;
  } | null;
  discoveredPlaces: number;
  totalPlaces: number;
}
