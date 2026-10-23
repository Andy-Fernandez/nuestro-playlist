import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, type PanInfo } from 'motion/react';
import type { Mixtape } from '../data/mixtapes';
import {
  CASSETTE_INITIAL_POSE, getCassetteMotionVariants, CASSETTE_REDUCED_MOTION_VARIANTS,
  CASSETTE_THROW_TRANSITION, CASSETTE_RETURN_TRANSITION, CASSETTE_REDUCED_DURATION, getCassetteThrow, getCassetteThrowTarget,
  cassetteDuration, type MotionSpeed, type CassetteMotionPhase, type CassetteState, type CassetteThrow,
} from '../config/cassetteMotion';
import { PhysicalCassette } from './PhysicalCassette';

type Props = {
  mix: Mixtape;
  state: CassetteState;
  running: boolean;
  progress: number;
  resetKey: string;
  reducedMotion: boolean;
  motionSpeed: MotionSpeed;
  onReinsert: () => void;
  onRemove: (throwing?: boolean) => void;
  onMotionComplete: (phase: CassetteMotionPhase, id: string) => void;
};

/** Separate the listener's hand movement from the cassette's deck perspective. */
export function CassetteObject({ mix, state, running, progress, resetKey, reducedMotion, motionSpeed, onReinsert, onRemove, onMotionComplete }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const suppressClick = useRef(false);
  const cancelled = useRef(false);
  const [throwDirection, setThrowDirection] = useState<CassetteThrow | null>(null);
  const ejected = state === 'ejected';
  const phase = state === 'loading' || state === 'empty' ? 'ready' : state;
  const variants = useMemo(() => getCassetteMotionVariants(motionSpeed), [motionSpeed]);

  useEffect(() => {
    if (state !== 'removing' || !throwDirection || reducedMotion) return;
    // Continue from the hand's release point, far enough to clear any viewport.
    const target = getCassetteThrowTarget({ x: x.get(), y: y.get() }, throwDirection, { width: window.innerWidth, height: window.innerHeight });
    const transition = { ...CASSETTE_THROW_TRANSITION, duration: cassetteDuration(CASSETTE_THROW_TRANSITION.duration, false, motionSpeed) };
    const horizontal = animate(x, target.x, transition);
    const vertical = animate(y, target.y, transition);
    return () => { horizontal.stop(); vertical.stop(); };
  }, [state, throwDirection, reducedMotion, motionSpeed, x, y]);

  const settle = () => {
    const transition = reducedMotion ? { duration: CASSETTE_REDUCED_DURATION } : CASSETTE_RETURN_TRANSITION;
    void animate(x, 0, transition);
    void animate(y, 0, transition);
  };
  const release = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!ejected) return;
    const direction = cancelled.current || event.type === 'pointercancel' ? null : getCassetteThrow(info.offset, info.velocity);
    if (!direction) { settle(); return; }
    setThrowDirection(direction);
    onRemove(true);
  };

  return <motion.div className="cassette-insertion" data-cassette-object
    initial={reducedMotion ? false : CASSETTE_INITIAL_POSE}
    animate={phase} custom={throwDirection}
    variants={reducedMotion ? CASSETTE_REDUCED_MOTION_VARIANTS : variants}
    onAnimationComplete={definition => {
      if (definition === 'inserting' || definition === 'ejecting' || definition === 'reinserting' || definition === 'removing') onMotionComplete(definition, mix.id);
    }}>
    <motion.button type="button" className="cassette-touch" disabled={!ejected}
      style={{ x, y }} drag={ejected} dragMomentum={false}
      aria-label={`Insertar de nuevo ${mix.title}`} aria-describedby={ejected ? 'cassette-instructions' : undefined}
      onPointerDown={event => {
        if (!event.isPrimary) return;
        suppressClick.current = false; cancelled.current = false; x.stop(); y.stop();
      }}
      onPointerCancel={() => { cancelled.current = true; suppressClick.current = true; settle(); }}
      onDragStart={() => { suppressClick.current = true; }}
      onDragEnd={release}
      onClick={event => {
        event.stopPropagation();
        if (suppressClick.current && event.detail !== 0) return;
        // Keyboard activation remains available after an abandoned drag.
        x.stop(); y.stop(); x.set(0); y.set(0); onReinsert();
      }}>
      <PhysicalCassette mix={mix} running={running} progress={progress} resetKey={resetKey} />
    </motion.button>
  </motion.div>;
}
