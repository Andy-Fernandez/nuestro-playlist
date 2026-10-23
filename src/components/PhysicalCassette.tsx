import { useEffect, useRef } from 'react';
import { resolveAsset, type Mixtape } from '../data/mixtapes';

type Props = { mix: Mixtape; running: boolean; progress: number; resetKey: string };
const sharedAsset = (name: string) => resolveAsset(`assets/cassettes/shared/${name}`);

export function PhysicalCassette({ mix, running, progress, resetKey }: Props) {
  const windLeft = useRef<HTMLImageElement>(null);
  const windRight = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const position = Math.max(0, Math.min(progress, 1));
    if (windLeft.current) windLeft.current.style.transform = `scale(${1.28 - position * 0.44})`;
    if (windRight.current) windRight.current.style.transform = `scale(${0.84 + position * 0.44})`;
  }, [progress]);
  // Keep the spin on the browser's animation timeline, independent of React's
  // audio updates and main-thread frame callbacks. STOP pauses at the same angle;
  // only a different cassette/track resets the keyed reel images.
  return <div className={`cassette-portrait${running ? ' is-running' : ''}`}>
    <div className="deck-tape" role="img" aria-label={`${mix.title}: casete ${running ? 'en reproducción' : 'detenido'}`}>
      <div className="cassette-layer-stack">
        <img className={`deck-cassette-layer deck-cassette-label${mix.id === 'nubes' ? ' deck-cassette-label--nubes' : ''}`} src={resolveAsset(mix.artwork.label)} alt="" draggable={false} />
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
          <img key={resetKey} className="deck-cassette-layer deck-cassette-reel" src={resolveAsset(mix.hardware.reel)} alt="" draggable={false} />
        </div>
        <div className="deck-cassette-spool deck-cassette-spool--reel right">
          <img key={resetKey} className="deck-cassette-layer deck-cassette-reel" src={resolveAsset(mix.hardware.reel)} alt="" draggable={false} />
        </div>
        <img className="deck-cassette-layer deck-cassette-glass" src={sharedAsset('glass.png')} alt="" draggable={false} />
      </div>
    </div>
  </div>;
}
