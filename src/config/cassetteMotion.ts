import type { TargetAndTransition, Variants } from 'motion/react';

export type CassetteState = 'empty' | 'loading' | 'inserting' | 'ready' | 'ejecting' | 'ejected' | 'reinserting' | 'removing';
export type CassetteMotionPhase = Extract<CassetteState, 'inserting' | 'ejecting' | 'reinserting' | 'removing'>;

export const CASSETTE_PERSPECTIVE = 1000;
// Deliberate physical travel is part of the listening experience. Keep input
// feedback immediate; artwork loading must not determine the motion's pacing.
export const CASSETTE_INSERT_DURATION = 1.4;
export const CASSETTE_EJECT_DURATION = .85;
export const CASSETTE_REINSERT_DURATION = .9;
export const CASSETTE_REMOVE_DURATION = 1.1;
export const CASSETTE_THROW_DURATION = .68;
export const CASSETTE_REDUCED_DURATION = .08;
export const CASSETTE_THROW_TRANSITION = { duration: CASSETTE_THROW_DURATION, ease: [.2, .65, .35, 1] as const };
export const CASSETTE_RETURN_TRANSITION = { type: 'spring' as const, stiffness: 240, damping: 28 };

export type CassetteThrow = { x: number; y: number };

/** Ignore hand jitter; a deliberate drag or short flick chooses its own exit. */
export function getCassetteThrow(offset: CassetteThrow, velocity: CassetteThrow): CassetteThrow | null {
  const distance = Math.hypot(offset.x, offset.y);
  const speed = Math.hypot(velocity.x, velocity.y);
  if (distance < 42 && !(distance >= 8 && speed >= 480)) return null;
  const direction = speed >= 480 ? velocity : offset;
  const length = Math.hypot(direction.x, direction.y);
  return { x: direction.x / length, y: direction.y / length };
}

export function getCassetteThrowTarget(release: CassetteThrow, direction: CassetteThrow, viewport: { width: number; height: number }): CassetteThrow {
  const travel = Math.hypot(viewport.width, viewport.height) + 600;
  return { x: release.x + direction.x * travel, y: release.y + direction.y * travel };
}

// Normalized contact points shared by the animation and mechanical foley.
export const CASSETTE_MOTION_CUES = {
  insertAlign: .56,
  insertSeat: .88,
  ejectRelease: .24,
  ejectLift: .64,
  reinsertAlign: .48,
  reinsertSeat: .84,
  removeClear: .68,
} as const;

const seated = {
  opacity: 1,
  x: '0%',
  y: '0%',
  z: 0,
  scale: 1,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
} satisfies TargetAndTransition;

// EJECT releases the cassette for the listener to handle. It stays close to the
// bay until they choose to seat it again or lift it out of the player entirely.
const raised = {
  ...seated,
  y: '-10%',
  z: 35,
  rotateX: 6,
  rotateY: -1,
  rotateZ: 1,
} satisfies TargetAndTransition;

const reducedRaised = { ...seated, y: '-1%' } satisfies TargetAndTransition;

/** An already visible cassette approaches the deck as one physical object. */
export const CASSETTE_INITIAL_POSE = {
  ...seated,
  x: '-7%',
  y: '-48%',
  z: 185,
  rotateX: 17,
  rotateY: -6,
  rotateZ: -6,
} satisfies TargetAndTransition;

/** Keep the same cassette mounted through every seated and raised interaction. */
export const CASSETTE_MOTION_VARIANTS = {
  inserting: {
    ...seated,
    x: ['-7%', '-1%', '0%', '0%'],
    y: ['-48%', '-12%', '-.8%', '0%'],
    z: [185, 85, 6, 0],
    rotateX: [17, 8, 1, 0],
    rotateY: [-6, -1.5, -.2, 0],
    rotateZ: [-6, -1.5, -.2, 0],
    transition: {
      duration: CASSETTE_INSERT_DURATION,
      times: [0, CASSETTE_MOTION_CUES.insertAlign, CASSETTE_MOTION_CUES.insertSeat, 1],
      // Build momentum, guide the tape into alignment, then ease into the latch.
      // Middle segments carry movement through instead of easing to a full stop.
      ease: [[.42, 0, .75, .75], [.25, .25, .65, .95], [.25, .1, .25, 1]],
    },
  },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: {
    ...raised,
    y: ['0%', '-1.5%', '-7%', '-10%'],
    z: [0, 6, 27, 35],
    rotateX: [0, 1.2, 4.5, 6],
    rotateY: [0, -.2, -.8, -1],
    rotateZ: [0, .2, .8, 1],
    transition: {
      duration: CASSETTE_EJECT_DURATION,
      // Release the latch, let the spring lift, then settle within reach.
      times: [0, CASSETTE_MOTION_CUES.ejectRelease, CASSETTE_MOTION_CUES.ejectLift, 1],
      ease: [[.3, 0, .65, .65], [.25, .25, .65, .85], [.25, .25, .3, 1]],
    },
  },
  ejected: { ...raised, transition: { duration: 0 } },
  reinserting: {
    ...seated,
    y: ['-10%', '-4%', '-.6%', '0%'],
    z: [35, 17, 4, 0],
    rotateX: [6, 3, .7, 0],
    rotateY: [-1, -.4, -.1, 0],
    rotateZ: [1, .4, .1, 0],
    transition: {
      duration: CASSETTE_REINSERT_DURATION,
      times: [0, CASSETTE_MOTION_CUES.reinsertAlign, CASSETTE_MOTION_CUES.reinsertSeat, 1],
      ease: [[.42, 0, .7, .75], [.25, .25, .65, .95], [.25, .1, .25, 1]],
    },
  },
  removing: (throwDirection: CassetteThrow | null) => throwDirection ? {
    // The inner object carries the release trajectory; keep its raised pose.
    opacity: [1, 1, 0],
    transition: { duration: CASSETTE_THROW_DURATION, times: [0, .75, 1], ease: 'linear' },
  } : {
    // Null first frames inherit the actual pose, including a cassette being
    // replaced directly from the seated position, without a jump to raised.
    opacity: [1, 1, 1, 1, 0],
    x: [null, '1%', '5%', '8%', '10%'],
    y: [null, '-38%', '-95%', '-140%', '-165%'],
    z: [null, 95, 150, 180, 190],
    scale: 1,
    rotateX: [null, 11, 16, 18, 18],
    rotateY: [null, -2, -3, -4, -4],
    rotateZ: [null, 2, 4, 5, 5],
    transition: {
      duration: CASSETTE_REMOVE_DURATION,
      times: [0, .3, CASSETTE_MOTION_CUES.removeClear, .86, 1],
      ease: [[.42, 0, .75, .75], [.25, .25, .65, .8], [.25, .25, .6, .85], [.25, .25, .4, 1]],
    },
  },
} satisfies Variants;

/** Minimal travel still completes through the same animation callback. */
export const CASSETTE_REDUCED_MOTION_VARIANTS = {
  inserting: { ...seated, y: ['-.2%', '0%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: { ...reducedRaised, y: ['0%', '-1%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
  ejected: { ...reducedRaised, transition: { duration: 0 } },
  reinserting: { ...seated, y: ['-1%', '0%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
  removing: { opacity: [1, 0], transition: { duration: CASSETTE_REDUCED_DURATION } },
} satisfies Variants;
