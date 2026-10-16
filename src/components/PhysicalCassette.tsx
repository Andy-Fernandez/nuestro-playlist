import { useEffect, useRef } from 'react';
import { resolveAsset, type Mixtape } from '../data/mixtapes';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Props = { mix: Mixtape; running: boolean; progress: number; resetKey: string };
const sharedAsset = (name: string) => resolveAsset(`assets/cassettes/shared/${name}`);

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
    const position = Math.max(0, Math.min(progress, 1));
    if (windLeft.current) windLeft.current.style.transform = `scale(${1.28 - position * 0.44})`;
    if (windRight.current) windRight.current.style.transform = `scale(${0.84 + position * 0.44})`;
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

  return <div className="cassette-portrait">
    <div className="deck-tape" role="img" aria-label={`${mix.title}: casete ${running ? 'en reproducción' : 'detenido'}`}>
      <div className="cassette-layer-stack">
        <img className="deck-cassette-layer deck-cassette-label" src={resolveAsset(mix.artwork.label)} alt="" draggable={false} />
        <div className="deck-cassette-spool deck-cassette-spool--wind left">
          <img className="deck-cassette-layer deck-cassette-wind" src={sharedAsset('tape-wind.png')} alt="" draggable={false} ref={windLeft} />
        </div>
        <div className="deck-cassette-spool deck-cassette-spool--wind right">
          <img className="deck-cassette-layer deck-cassette-wind" src={sharedAsset('tape-wind.png')} alt="" draggable={false} ref={windRight} />
        </div>
        <img className="deck-cassette-layer deck-cassette-shell" src={sharedAsset('shell.png')} alt="" draggable={false} />
        <img className="deck-cassette-layer deck-cassette-guide-roller left" src={resolveAsset(mix.hardware.guideRoller)} alt="" draggable={false} />
        <img className="deck-cassette-layer deck-cassette-guide-roller right" src={resolveAsset(mix.hardware.guideRoller)} alt="" draggable={false} />
        <div className="deck-cassette-spool deck-cassette-spool--reel left">
          <img className="deck-cassette-layer deck-cassette-reel" src={resolveAsset(mix.hardware.reel)} alt="" draggable={false} ref={left} />
        </div>
        <div className="deck-cassette-spool deck-cassette-spool--reel right">
          <img className="deck-cassette-layer deck-cassette-reel" src={resolveAsset(mix.hardware.reel)} alt="" draggable={false} ref={right} />
        </div>
        <img className="deck-cassette-layer deck-cassette-glass" src={sharedAsset('glass.png')} alt="" draggable={false} />
      </div>
    </div>
  </div>;
}
