import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
  MOTO_MAX_SPEED,
  canMountMotorcycle,
  dismountMotorcycle,
  findNearestInteractable,
  mountMotorcycle,
  resolveCircleAabbCollisions,
  speedToKmh,
  stepMotorcyclePhysics,
  stepPlayerMovement,
} from './physics';
import {
  BUILDINGS,
  INTERACTABLES,
  MOTORCYCLE_SPAWN,
  PLAYER_SPAWN,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  buildStaticColliders,
  getDistrictAtPosition,
} from './worldData';
import type { MotorcycleState, PlayerState } from './types';

function makePlayer(x = PLAYER_SPAWN.x, y = PLAYER_SPAWN.y): PlayerState {
  return {
    x,
    y,
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
}

function makeMoto(x = MOTORCYCLE_SPAWN.x, y = MOTORCYCLE_SPAWN.y): MotorcycleState {
  return {
    x,
    y,
    angle: 0,
    speed: 0,
    steerInput: 0,
    throttle: 0,
    braking: false,
    headlightOn: false,
    radius: 16,
    wheelPhase: 0,
  };
}

test('player spawns in clear open space with zero initial collision overlap', () => {
  const colliders = buildStaticColliders();
  const res = resolveCircleAabbCollisions(PLAYER_SPAWN, 10, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  assert.equal(res.collided, false);
  assert.equal(res.x, PLAYER_SPAWN.x);
  assert.equal(res.y, PLAYER_SPAWN.y);
});

test('player diagonal movement normalizes to exact walk and run speeds', () => {
  const colliders = buildStaticColliders();
  const p = makePlayer(1050, 1180); // open road
  stepPlayerMovement(p, { moveX: 1, moveY: 1, running: false }, 0.1, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  const walkSpeed = Math.hypot(p.vx, p.vy);
  assert.ok(Math.abs(walkSpeed - PLAYER_WALK_SPEED) < 0.01);
  assert.equal(p.action, 'walk');

  stepPlayerMovement(p, { moveX: 1, moveY: 1, running: true }, 0.1, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  const runSpeed = Math.hypot(p.vx, p.vy);
  assert.ok(Math.abs(runSpeed - PLAYER_RUN_SPEED) < 0.01);
  assert.equal(p.action, 'run');
});

test('player enters phone_idle animation after 3.5s standing still', () => {
  const colliders = buildStaticColliders();
  const p = makePlayer(1050, 1180);
  stepPlayerMovement(p, { moveX: 0, moveY: 0, running: false }, 2.0, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  assert.equal(p.action, 'idle');
  stepPlayerMovement(p, { moveX: 0, moveY: 0, running: false }, 1.6, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  assert.equal(p.action, 'phone_idle');
});

test('player and motorcycle cannot pass through buildings', () => {
  const colliders = buildStaticColliders();
  const konbini = BUILDINGS.find((b) => b.id === 'konbini_amemart')!;
  const p = makePlayer(konbini.x + konbini.w / 2, konbini.y + konbini.h + 12);

  // Push straight north into the konbini building
  for (let i = 0; i < 40; i++) {
    stepPlayerMovement(p, { moveX: 0, moveY: -1, running: true }, 0.016, colliders, WORLD_WIDTH, WORLD_HEIGHT);
  }
  assert.ok(p.y >= konbini.y + konbini.h + p.radius - 0.1);

  const moto = makeMoto(konbini.x + konbini.w / 2, konbini.y + konbini.h + 24);
  moto.angle = -Math.PI / 2; // pointing north into wall
  let hitWall = false;
  for (let i = 0; i < 50; i++) {
    const res = stepMotorcyclePhysics(
      moto,
      { throttle: 1, steer: 0, brake: false },
      0.02,
      colliders,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      true
    );
    if (res.collided) hitWall = true;
  }
  assert.equal(hitWall, true);
  assert.ok(moto.y >= konbini.y + konbini.h + moto.radius - 0.1);
});

test('motorcycle mounting, acceleration, steering, braking, and dismounting work cleanly', () => {
  const colliders = buildStaticColliders();
  const p = makePlayer(MOTORCYCLE_SPAWN.x - 20, MOTORCYCLE_SPAWN.y);
  const moto = makeMoto(MOTORCYCLE_SPAWN.x, MOTORCYCLE_SPAWN.y);

  assert.equal(canMountMotorcycle(p, moto), true);
  assert.equal(mountMotorcycle(p, moto), true);
  assert.equal(p.mounted, true);
  assert.equal(moto.headlightOn, true);

  // Accelerate east
  for (let i = 0; i < 60; i++) {
    stepMotorcyclePhysics(
      moto,
      { throttle: 1, steer: 0, brake: false },
      0.02,
      colliders,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      true
    );
  }
  assert.ok(moto.speed > 200);
  assert.ok(moto.speed <= MOTO_MAX_SPEED);
  assert.ok(speedToKmh(moto.speed) > 40);

  // Steer right while moving
  const angleBefore = moto.angle;
  stepMotorcyclePhysics(
    moto,
    { throttle: 1, steer: 1, brake: false },
    0.1,
    colliders,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    true
  );
  assert.ok(moto.angle > angleBefore);

  // Brake to stop
  for (let i = 0; i < 60; i++) {
    stepMotorcyclePhysics(
      moto,
      { throttle: 0, steer: 0, brake: true },
      0.02,
      colliders,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      true
    );
  }
  assert.equal(moto.speed, 0);

  // Dismount places player adjacent to bike without colliding
  assert.equal(dismountMotorcycle(p, moto, colliders, WORLD_WIDTH, WORLD_HEIGHT), true);
  assert.equal(p.mounted, false);
  assert.equal(moto.headlightOn, false);
});

test('all 4 city districts resolve properly and nearest interactable prioritizes close targets', () => {
  assert.equal(getDistrictAtPosition(300, 300).id, 'residential');
  assert.equal(getDistrictAtPosition(2000, 300).id, 'entertainment');
  assert.equal(getDistrictAtPosition(1000, 1200).id, 'commercial');
  assert.equal(getDistrictAtPosition(1500, 2200).id, 'quiet');

  const p = makePlayer(1250, 990);
  const moto = makeMoto(1170, 1088);
  const nearest = findNearestInteractable(p, moto, INTERACTABLES);
  assert.ok(nearest !== null);
  assert.equal(nearest.kind, 'world');
  if (nearest.kind === 'world') {
    assert.equal(nearest.interactable.id, 'int_vending_konbini');
  }
});
