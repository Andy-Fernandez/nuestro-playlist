import type { TargetAndTransition, Variants } from 'motion/react';

export type CassetteState = 'empty' | 'loading' | 'inserting' | 'ready' | 'ejecting';
export type CassetteMotionPhase = Extract<CassetteState, 'inserting' | 'ejecting'>;

export const CASSETTE_PERSPECTIVE = 1000;
export const CASSETTE_INSERT_DURATION = .46;
export const CASSETTE_EJECT_DURATION = .5;
export const CASSETTE_REDUCED_DURATION = .08;

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
    y: ['0%', '-5%', '-35%', '-145%'],
    z: [0, 70, 110, 180],
    rotateX: [0, 9, 13, 17],
    rotateY: [0, -2, -3, -5],
    rotateZ: [0, 2, 3, 5],
    transition: {
      duration: CASSETTE_EJECT_DURATION,
      // Release and lift continuously, without a pause that feels like input lag.
      times: [0, .24, .48, 1],
      ease: [.22, .61, .36, 1],
    },
  },
} satisfies Variants;

/** Minimal travel still completes through the same animation callback. */
export const CASSETTE_REDUCED_MOTION_VARIANTS = {
  inserting: { ...seated, y: ['-.2%', '0%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
  ready: { ...seated, transition: { duration: 0 } },
  ejecting: { ...seated, y: ['0%', '-1%'], transition: { duration: CASSETTE_REDUCED_DURATION } },
} satisfies Variants;
