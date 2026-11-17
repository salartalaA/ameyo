// Weapon progression for zombie survival.
// Milestones: 0-49 Pistol, 50-99 AK-47, 100-199 Minigun, 200-259 Bomber.
// Victory is reached at 260 kills.

export type WeaponKind = 'pistol' | 'ak47' | 'minigun' | 'bomber';

export interface WeaponDef {
  kind: WeaponKind;
  name: string;
  jpName: string;
  minScore: number;
  fireInterval: number; // seconds between shots (hitscan/projectile launch)
  range: number; // px
  spread: number; // radians of random cone
  damage: number; // hitscan damage per pellet
  pellets: number;
  projectile: 'hitscan' | 'bomb';
  bombCount?: number; // projectiles per shot (Bomber volley)
  bombSpeed?: number;
  bombRadius?: number; // blast radius on detonation
  bombDamage?: number; // blast damage per zombie in radius
  tracerColor: string;
  tracerWidth: number;
  sfx: 'pistol' | 'ak47' | 'minigun' | 'bomber';
}

export const WEAPONS: WeaponDef[] = [
  {
    kind: 'pistol',
    name: 'Pistol',
    jpName: '拳銃',
    minScore: 0,
    fireInterval: 0.23,
    range: 560,
    spread: 0.012,
    damage: 1,
    pellets: 1,
    projectile: 'hitscan',
    tracerColor: '#fef08a',
    tracerWidth: 1,
    sfx: 'pistol',
  },
  {
    kind: 'ak47',
    name: 'AK-47',
    jpName: '自動小銃',
    minScore: 50,
    fireInterval: 0.085,
    range: 620,
    spread: 0.028,
    damage: 1,
    pellets: 1,
    projectile: 'hitscan',
    tracerColor: '#fdba74',
    tracerWidth: 1,
    sfx: 'ak47',
  },
  {
    kind: 'minigun',
    name: 'Minigun',
    jpName: 'ミニガン',
    minScore: 100,
    fireInterval: 0.045,
    range: 660,
    spread: 0.055,
    damage: 1,
    pellets: 1,
    projectile: 'hitscan',
    tracerColor: '#fde047',
    tracerWidth: 1,
    sfx: 'minigun',
  },
  {
    kind: 'bomber',
    name: 'Bomber',
    jpName: '爆撃機',
    minScore: 200,
    fireInterval: 1.5,
    range: 900,
    spread: 0.06,
    damage: 0,
    pellets: 1,
    projectile: 'bomb',
    bombCount: 3,
    bombSpeed: 540,
    bombRadius: 120,
    bombDamage: 9,
    tracerColor: '#f87171',
    tracerWidth: 2,
    sfx: 'bomber',
  },
];

export const SURVIVAL_TARGET_SCORE = 260;

export function weaponForScore(score: number): WeaponDef {
  let current = WEAPONS[0];
  for (const w of WEAPONS) {
    if (score >= w.minScore) current = w;
  }
  return current;
}

export function weaponTierForScore(score: number): number {
  return WEAPONS.findIndex((w) => w === weaponForScore(score));
}

export function nextWeaponAt(score: number): number | null {
  for (const w of WEAPONS) {
    if (score < w.minScore) return w.minScore;
  }
  return null;
}
