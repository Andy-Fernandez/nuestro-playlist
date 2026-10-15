import { useEffect, useRef } from 'react';
import type { Mixtape } from '../data/mixtapes';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Props = { mix: Mixtape; running: boolean; progress: number; resetKey: string };

export function PhysicalCassette({ mix, running, progress, resetKey }: Props) {
  const reducedMotion = useReducedMotion();
  const left = useRef<HTMLImageElement>(null);
  const right = useRef<HTMLImageElement>(null);
  const windLeft = useRef<HTMLImageElement>(null);
  const windRight = useRef<HTMLImageElement>(null);
  const angles = useRef({ left: 0, right: 0 });
  const progressRef = useRef(progress);

  useEffect(() => { progressRef.current = Math.max(0, Math.min(progress, 1)); }, [progress]);
  useEffect(() => {
    angles.current = { left: 0, right: 0 };
    if (left.current) left.current.style.transform = 'rotate(0deg)';
    if (right.current) right.current.style.transform = 'rotate(0deg)';
  }, [resetKey]);
  useEffect(() => {
    if (windLeft.current) windLeft.current.style.transform = `scale(${1.28 - progress * 0.44})`;
    if (windRight.current) windRight.current.style.transform = `scale(${0.84 + progress * 0.44})`;
  }, [progress]);
  useEffect(() => {
    if (!running || reducedMotion) return;
    let id = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const p = progressRef.current;
      angles.current.left += (155 + 60 * p) * dt;
      angles.current.right += (215 - 60 * p) * dt;
      if (left.current) left.current.style.transform = `rotate(${angles.current.left % 360}deg)`;
      if (right.current) right.current.style.transform = `rotate(${angles.current.right % 360}deg)`;
      id = window.requestAnimationFrame(frame);
    };
    id = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(id);
  }, [running, reducedMotion]);

  return <div className="deck-tape" role="img" aria-label={`${mix.title} cassette; ${running ? 'tape moving' : 'tape stopped'}`}>
    <img className="deck-cassette-layer deck-cassette-label" src="/assets/cassette-labels/label.png" alt="" draggable={false} />
    <div className="deck-cassette-spool deck-cassette-spool--wind left">
      <img className="deck-cassette-layer deck-cassette-wind" src="/assets/cassette-labels/tape%20wind.png" alt="" draggable={false} ref={windLeft} />
    </div>
    <div className="deck-cassette-spool deck-cassette-spool--wind right">
      <img className="deck-cassette-layer deck-cassette-wind" src="/assets/cassette-labels/tape%20wind.png" alt="" draggable={false} ref={windRight} />
    </div>
    <img className="deck-cassette-layer deck-cassette-shell" src="/assets/cassette-labels/shell.png" alt="" draggable={false} />
    <div className="deck-cassette-spool deck-cassette-spool--reel left">
      <img className="deck-cassette-layer deck-cassette-reel" src="/assets/cassette-labels/reel.png" alt="" draggable={false} ref={left} />
    </div>
    <div className="deck-cassette-spool deck-cassette-spool--reel right">
      <img className="deck-cassette-layer deck-cassette-reel" src="/assets/cassette-labels/reel.png" alt="" draggable={false} ref={right} />
    </div>
    <img className="deck-cassette-layer deck-cassette-glass" src="/assets/cassette-labels/glass.png" alt="" draggable={false} />
  </div>;
}
