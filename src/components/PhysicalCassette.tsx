import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Mixtape } from '../data/mixtapes';
import { useReducedMotion } from '../hooks/useReducedMotion';

const skins: Record<Mixtape['kind'], { main: string; highlight: string; paper: string; ink: string; stripe: string }> = {
  pink: { main: '#d98b9d', highlight: '#ffcbcf', paper: '#f8e9d3', ink: '#6d3951', stripe: '#c26076' },
  mauve: { main: '#8b708f', highlight: '#dec0e4', paper: '#f5e7ed', ink: '#4a3555', stripe: '#a079aa' },
  paper: { main: '#e4bac7', highlight: '#fff1e9', paper: '#f8eee6', ink: '#6c4356', stripe: '#c68ea8' },
  rose: { main: '#a9486d', highlight: '#f0a2bb', paper: '#fbe9e3', ink: '#663248', stripe: '#cb7891' },
  trip: { main: '#cf9fb1', highlight: '#ffe3ee', paper: '#fbefde', ink: '#694a54', stripe: '#ba809e' },
  dark: { main: '#5a304a', highlight: '#a66a89', paper: '#eecedb', ink: '#452b42', stripe: '#a04f75' }
};

type Props = { mix: Mixtape; running: boolean; progress: number; resetKey: string };

/** Shell, paper, magnetic tape and reels are independent DOM layers. */
export function PhysicalCassette({ mix, running, progress, resetKey }: Props) {
  const reducedMotion = useReducedMotion();
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const windLeft = useRef<HTMLDivElement>(null);
  const windRight = useRef<HTMLDivElement>(null);
  const angles = useRef({ left: 0, right: 0 });
  const progressRef = useRef(progress);

  useEffect(() => { progressRef.current = Math.max(0, Math.min(progress, 1)); }, [progress]);
  useEffect(() => {
    angles.current = { left: 0, right: 0 };
    if (left.current) left.current.style.transform = 'rotate(0deg)';
    if (right.current) right.current.style.transform = 'rotate(0deg)';
  }, [resetKey]);
  useEffect(() => {
    // The amount of visible tape changes slightly as the song progresses.
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
      // Semi-physical illusion: spool speeds gradually diverge with tape transfer.
      angles.current.left += (155 + 60 * p) * dt;
      angles.current.right += (215 - 60 * p) * dt;
      if (left.current) left.current.style.transform = `rotate(${angles.current.left % 360}deg)`;
      if (right.current) right.current.style.transform = `rotate(${angles.current.right % 360}deg)`;
      id = window.requestAnimationFrame(frame);
    };
    id = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(id);
  }, [running, reducedMotion]);

  const skin = skins[mix.kind];
  const style = {
    '--shell-main': skin.main,
    '--shell-highlight': skin.highlight,
    '--paper': skin.paper,
    '--ink': skin.ink,
    '--stripe': skin.stripe
  } as CSSProperties;

  return <div className="deck-tape" style={style} role="img" aria-label={`${mix.title} cassette; ${running ? 'tape moving' : 'tape stopped'}`}>
    <div className="deck-tape-paper">
      <div className="deck-paper-head"><strong title={mix.title}>{mix.title}</strong><span>A</span></div>
      <div className="deck-window">
        <div className="deck-reel left"><div className="deck-wind" ref={windLeft} /><div className="deck-spokes" ref={left} /></div>
        <div className="deck-reel right"><div className="deck-wind" ref={windRight} /><div className="deck-spokes" ref={right} /></div>
      </div>
    </div>
    {['a', 'b', 'c', 'd'].map(s => <span className={`deck-screw ${s}`} key={s} />)}
    <div className="deck-tape-bottom"><i /><i /><i /></div>
  </div>;
}
