import { MOTION_SPEEDS, type MotionSpeed } from '../config/cassetteMotion';

const STORAGE_KEY = 'loveline-motion-speed';

export function readMotionSpeed(): MotionSpeed {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return MOTION_SPEEDS.find(speed => speed === stored) ?? 'normal';
  } catch { return 'normal'; }
}

export function saveMotionSpeed(speed: MotionSpeed): void {
  try { localStorage.setItem(STORAGE_KEY, speed); }
  catch { /* Keep the control usable when browser storage is unavailable. */ }
}
