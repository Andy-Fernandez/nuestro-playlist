import type { TargetAndTransition, Variants } from 'motion/react';

export type CassetteState = 'empty' | 'loading' | 'inserting' | 'ready' | 'ejecting';
export type CassetteMotionPhase = Extract<CassetteState, 'inserting' | 'ejecting'>;

export const CASSETTE_PERSPECTIVE = 1000;
// Deliberate physical travel is part of the listening experience. Keep input
// feedback immediate; artwork loading must not determine the motion's pacing.
export const CASSETTE_INSERT_DURATION = 1.4;
export const CASSETTE_EJECT_DURATION = 1.55;
export const CASSETTE_REDUCED_DURATION = .08;

// Normalized contact points shared by the animation and mechanical foley.
export const CASSETTE_MOTION_CUES = {
  insertAlign: .56,
  insertSeat: .88,
  ejectRelease: .24,
  ejectLift: .64,
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

/** Keep the same motion element mounted through inserting → ready → ejecting. */
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
    ...seated,
    x: ['0%', '.5%', '3%', '8%'],
    y: ['0%', '-6%', '-52%', '-160%'],
    z: [0, 50, 115, 185],
    rotateX: [0, 6, 13, 18],
    rotateY: [0, -1.5, -3, -5],
    rotateZ: [0, 1.5, 3, 6],
    transition: {
      duration: CASSETTE_EJECT_DURATION,
      // The latch releases before a continuous, unhurried lift out of the bay.
      times: [0, CASSETTE_MOTION_CUES.ejectRelease, CASSETTE_MOTION_CUES.ejectLift, 1],
      ease: [[.22, .45, .65, .65], [.25, .25, .75, .75], [.25, .25, .4, 1]],
    },
  },
} satisfies Variants;

/** Minimal travel still completes through the same animation callback. */
export const CASSETTE_REDUCED_MOTION_VARIANTS = {
  inserting: { ...seated, y: ['-.2%', '0%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: { ...seated, y: ['0%', '-1%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
} satisfies Variants;
