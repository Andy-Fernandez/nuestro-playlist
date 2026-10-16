import type { TargetAndTransition, Variants } from 'motion/react';

export type CassetteState = 'empty' | 'loading' | 'inserting' | 'ready' | 'ejecting';
export type CassetteMotionPhase = Extract<CassetteState, 'inserting' | 'ejecting'>;

export const CASSETTE_PERSPECTIVE = 1000;
export const CASSETTE_INSERT_DURATION = 1.18;
export const CASSETTE_EJECT_DURATION = 1.45;

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
  y: '-15%',
  z: 155,
  rotateX: 13,
  rotateY: -3,
  rotateZ: -3,
} satisfies TargetAndTransition;

/** Keep the same motion element mounted through inserting → ready → ejecting. */
export const CASSETTE_MOTION_VARIANTS = {
  inserting: {
    ...seated,
    y: ['-15%', '-4%', '0%', '0%'],
    z: [155, 85, 12, 0],
    rotateX: [13, 8, 2, 0],
    rotateY: [-3, -1, 0, 0],
    rotateZ: [-3, -1, 0, 0],
    transition: {
      duration: CASSETTE_INSERT_DURATION,
      times: [0, .42, .82, 1],
      ease: [.22, .61, .36, 1],
    },
  },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: {
    ...seated,
    x: ['0%', '0%', '0%', '5%'],
    y: ['0%', '-5%', '-5%', '-145%'],
    z: [0, 90, 90, 180],
    rotateX: [0, 11, 11, 17],
    rotateY: [0, -2, -2, -5],
    rotateZ: [0, 2, 2, 5],
    transition: {
      duration: CASSETTE_EJECT_DURATION,
      // Release, hold visibly above the mechanism, then remove the cassette.
      times: [0, .25, .62, 1],
      ease: [.22, .61, .36, 1],
    },
  },
} satisfies Variants;

/** Minimal travel still completes through the same animation callback. */
export const CASSETTE_REDUCED_MOTION_VARIANTS = {
  inserting: { ...seated, y: ['-.2%', '0%'], transition: { duration: .08 } },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: { ...seated, y: ['0%', '-1%'], transition: { duration: .08 } },
} satisfies Variants;
