import type {
  Direction,
  Interactable,
  MotorcycleState,
  PlayerState,
  Rect,
  Vec2,
} from './types';

export const PLAYER_WALK_SPEED = 88;
export const PLAYER_RUN_SPEED = 158;

export const MOTO_MAX_SPEED = 340;
export const MOTO_REVERSE_MAX = -75;
export const MOTO_ACCEL = 270;
export const MOTO_BRAKE_DECEL = 420;
export const MOTO_COAST_DRAG = 135;
export const MOTO_TURN_SPEED = 2.85; // radians/sec at full turn authority
export const MOTO_MOUNT_RANGE = 56;

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Resolves circle vs list of static AABB rectangles cleanly with sliding.
 */
export function resolveCircleAabbCollisions(
  pos: Vec2,
  radius: number,
  colliders: Rect[],
  worldW: number,
  worldH: number
): { x: number; y: number; collided: boolean } {
  let x = clamp(pos.x, radius + 8, worldW - radius - 8);
  let y = clamp(pos.y, radius + 8, worldH - radius - 8);
  let collided = x !== pos.x || y !== pos.y;

  // Two passes resolve corner edges smoothly
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < colliders.length; i++) {
      const r = colliders[i];
      const closestX = clamp(x, r.x, r.x + r.w);
      const closestY = clamp(y, r.y, r.y + r.h);
      const dx = x - closestX;
      const dy = y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radius * radius) {
        collided = true;
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          y += (dy / dist) * overlap;
        } else {
          // Center inside rect: push out along shallowest axis
          const leftPen = x - r.x;
          const rightPen = r.x + r.w - x;
          const topPen = y - r.y;
          const bottomPen = r.y + r.h - y;
          const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
          if (minPen === leftPen) x = r.x - radius;
          else if (minPen === rightPen) x = r.x + r.w + radius;
          else if (minPen === topPen) y = r.y - radius;
          else y = r.y + r.h + radius;
        }
      }
    }
  }

  x = clamp(x, radius + 8, worldW - radius - 8);
  y = clamp(y, radius + 8, worldH - radius - 8);
  return { x, y, collided };
}

export function vectorToDirection(dx: number, dy: number, fallback: Direction): Direction {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }
  return dy < 0 ? 'up' : 'down';
}

export function angleToDirection(angle: number): Direction {
  const norm = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (norm >= -Math.PI * 0.25 && norm <= Math.PI * 0.25) return 'right';
  if (norm > Math.PI * 0.25 && norm < Math.PI * 0.75) return 'down';
  if (norm < -Math.PI * 0.25 && norm > -Math.PI * 0.75) return 'up';
  return 'left';
}

export interface PlayerInput {
  moveX: number;
  moveY: number;
  running: boolean;
}

export function stepPlayerMovement(
  player: PlayerState,
  input: PlayerInput,
  dt: number,
  colliders: Rect[],
  worldW: number,
  worldH: number,
  motoCollider?: Rect
): void {
  if (player.mounted) return;

  if (player.mountCooldown > 0) {
    player.mountCooldown = Math.max(0, player.mountCooldown - dt);
  }

  if (player.interactTimer > 0) {
    player.interactTimer = Math.max(0, player.interactTimer - dt);
  }

  const len = Math.hypot(input.moveX, input.moveY);
  if (player.action === 'sit') {
    // Moving breaks sitting smoothly
    if (len > 0.1) {
      player.action = 'idle';
      player.sittingTargetId = null;
      player.seatPos = null;
    } else {
      player.vx = 0;
      player.vy = 0;
      return;
    }
  }

  if (len > 0.01) {
    const nx = input.moveX / len;
    const ny = input.moveY / len;
    const speed = input.running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    player.vx = nx * speed;
    player.vy = ny * speed;
    player.facing = vectorToDirection(nx, ny, player.facing);
    player.action = input.running ? 'run' : 'walk';
    player.idleTimer = 0;

    // Distance-synced gait phase so feet never skate
    const distMoved = speed * dt;
    player.gaitPhase += distMoved * 0.14;

    const allColliders = motoCollider ? [...colliders, motoCollider] : colliders;
    const resolved = resolveCircleAabbCollisions(
      { x: player.x + player.vx * dt, y: player.y + player.vy * dt },
      player.radius,
      allColliders,
      worldW,
      worldH
    );
    player.x = resolved.x;
    player.y = resolved.y;
  } else {
    player.vx = 0;
    player.vy = 0;
    player.idleTimer += dt;
    if (player.interactTimer > 0) {
      player.action = 'interact';
    } else if (player.idleTimer >= 3.5) {
      player.action = 'phone_idle';
    } else {
      player.action = 'idle';
    }
  }
}

export interface MotoInput {
  throttle: number; // -1..1
  steer: number;    // -1..1
  brake: boolean;
}

export function stepMotorcyclePhysics(
  moto: MotorcycleState,
  input: MotoInput,
  dt: number,
  colliders: Rect[],
  worldW: number,
  worldH: number,
  hasRider: boolean
): { collided: boolean } {
  if (!hasRider) {
    // Parked motorcycle coasts gently to a halt
    if (Math.abs(moto.speed) > 1) {
      const sign = Math.sign(moto.speed);
      moto.speed = Math.max(0, Math.abs(moto.speed) - MOTO_BRAKE_DECEL * dt) * sign;
    } else {
      moto.speed = 0;
    }
    moto.throttle = 0;
    moto.steerInput = 0;
    moto.braking = false;
    return { collided: false };
  }

  moto.throttle = input.throttle;
  moto.steerInput = input.steer;
  moto.braking = input.brake;

  // Acceleration / braking / coasting
  if (input.brake) {
    if (Math.abs(moto.speed) > 2) {
      const sign = Math.sign(moto.speed);
      moto.speed = Math.max(0, Math.abs(moto.speed) - MOTO_BRAKE_DECEL * dt) * sign;
    } else {
      moto.speed = 0;
    }
  } else if (input.throttle > 0.05) {
    if (moto.speed < 0) {
      moto.speed += MOTO_BRAKE_DECEL * dt;
    } else {
      moto.speed = Math.min(MOTO_MAX_SPEED, moto.speed + MOTO_ACCEL * input.throttle * dt);
    }
  } else if (input.throttle < -0.05) {
    if (moto.speed > 12) {
      moto.speed -= MOTO_BRAKE_DECEL * dt;
    } else {
      moto.speed = Math.max(MOTO_REVERSE_MAX, moto.speed + MOTO_ACCEL * 0.65 * input.throttle * dt);
    }
  } else {
    // Natural coast drag
    if (Math.abs(moto.speed) > 1) {
      const sign = Math.sign(moto.speed);
      moto.speed = Math.max(0, Math.abs(moto.speed) - MOTO_COAST_DRAG * dt) * sign;
    } else {
      moto.speed = 0;
    }
  }

  // Steering authority scales with speed (realistic bike handling; slight turn-in even at low roll)
  const absSpeed = Math.abs(moto.speed);
  if (absSpeed > 6 && Math.abs(input.steer) > 0.01) {
    const speedFactor = clamp(absSpeed / 120, 0.25, 1.0);
    const reverseFlip = moto.speed >= 0 ? 1 : -1;
    moto.angle += input.steer * MOTO_TURN_SPEED * speedFactor * reverseFlip * dt;
  }

  const nextX = moto.x + Math.cos(moto.angle) * moto.speed * dt;
  const nextY = moto.y + Math.sin(moto.angle) * moto.speed * dt;

  const resolved = resolveCircleAabbCollisions(
    { x: nextX, y: nextY },
    moto.radius,
    colliders,
    worldW,
    worldH
  );

  moto.x = resolved.x;
  moto.y = resolved.y;

  if (resolved.collided) {
    // Scrub speed on impact so bike doesn't get stuck or tunnel
    moto.speed *= 0.45;
  }

  moto.wheelPhase += Math.abs(moto.speed) * dt * 0.12;
  return { collided: resolved.collided };
}

export function canMountMotorcycle(player: PlayerState, moto: MotorcycleState): boolean {
  if (player.mounted || player.mountCooldown > 0) return false;
  return distance(player.x, player.y, moto.x, moto.y) <= MOTO_MOUNT_RANGE;
}

export function mountMotorcycle(player: PlayerState, moto: MotorcycleState): boolean {
  if (!canMountMotorcycle(player, moto)) return false;
  player.mounted = true;
  player.action = 'riding';
  player.sittingTargetId = null;
  player.seatPos = null;
  player.x = moto.x;
  player.y = moto.y;
  player.facing = angleToDirection(moto.angle);
  player.mountCooldown = 0.25;
  moto.headlightOn = true;
  return true;
}

export function dismountMotorcycle(
  player: PlayerState,
  moto: MotorcycleState,
  colliders: Rect[],
  worldW: number,
  worldH: number
): boolean {
  if (!player.mounted) return false;
  // Dismount to the left side of the bike first; fallback to right/behind if blocked
  const candidates: Vec2[] = [
    {
      x: moto.x + Math.cos(moto.angle - Math.PI / 2) * 32,
      y: moto.y + Math.sin(moto.angle - Math.PI / 2) * 32,
    },
    {
      x: moto.x + Math.cos(moto.angle + Math.PI / 2) * 32,
      y: moto.y + Math.sin(moto.angle + Math.PI / 2) * 32,
    },
    {
      x: moto.x - Math.cos(moto.angle) * 34,
      y: moto.y - Math.sin(moto.angle) * 34,
    },
  ];

  let chosen = candidates[0];
  for (const c of candidates) {
    const res = resolveCircleAabbCollisions(c, player.radius, colliders, worldW, worldH);
    if (!res.collided) {
      chosen = { x: res.x, y: res.y };
      break;
    }
    chosen = { x: res.x, y: res.y };
  }

  player.mounted = false;
  player.x = chosen.x;
  player.y = chosen.y;
  player.vx = 0;
  player.vy = 0;
  player.action = 'idle';
  player.idleTimer = 0;
  player.mountCooldown = 0.25;
  moto.headlightOn = false;
  return true;
}

export function findNearestInteractable(
  player: PlayerState,
  moto: MotorcycleState,
  interactables: Interactable[]
): { kind: 'motorcycle'; distance: number; prompt: string } | { kind: 'world'; interactable: Interactable; distance: number; prompt: string } | null {
  if (player.mounted) return null;

  let bestMotoDist = Infinity;
  if (canMountMotorcycle(player, moto)) {
    bestMotoDist = distance(player.x, player.y, moto.x, moto.y);
  }

  let bestItem: Interactable | null = null;
  let bestItemDist = Infinity;

  for (const item of interactables) {
    const d = distance(player.x, player.y, item.x, item.y);
    if (d <= item.radius && d < bestItemDist) {
      bestItemDist = d;
      bestItem = item;
    }
  }

  if (bestMotoDist <= bestItemDist && bestMotoDist < Infinity) {
    return {
      kind: 'motorcycle',
      distance: bestMotoDist,
      prompt: 'Ride Motorcycle',
    };
  }

  if (bestItem) {
    return {
      kind: 'world',
      interactable: bestItem,
      distance: bestItemDist,
      prompt: bestItem.prompt,
    };
  }

  return null;
}

export function speedToKmh(speedPxPerSec: number): number {
  // Scale px/s to realistic urban motorcycle km/h (max ~72 km/h in rainy night city)
  return Math.round((Math.abs(speedPxPerSec) / MOTO_MAX_SPEED) * 72);
}
