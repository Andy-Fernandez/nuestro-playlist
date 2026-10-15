import type { Mixtape } from '../data/mixtapes';
import type { TransportPhase } from '../hooks/useTransport';
import { formatTime, isBusy, status } from '../utils/deck';
import { PhysicalCassette } from './PhysicalCassette';
import { Icon } from './Icon';

type Props = {
  mix: Mixtape; phase: TransportPhase; progress: number; currentTime: number;
  soundEnabled: boolean; resetKey: string;
  onInsert: () => void; onPlay: () => void; onStop: () => void; onEject: () => void;
  onToggleSound: () => void;
};
export function MechanicalDeck({ mix, phase, progress, currentTime, soundEnabled, resetKey, onInsert, onPlay, onStop, onEject, onToggleSound }: Props) {
  const [title, detail] = status[phase];
  return <section className={`deck-shell transport-${phase}`} aria-label="Mechanical cassette deck">
    <div className="deck-panel-top"><div className="deck-brand">LOVE<span>LINE</span> <small>1987</small></div><div className="deck-machine-meta">STEREO CASSETTE DECK<br />ANALOG FEEL · DIGITAL HEART</div></div>
    <div className="deck-scene">
      <div className="deck-bay">
        <div className="deck-bay-top"><span>CASSETTE COMPARTMENT</span><span>TYPE I / NORMAL</span></div>
        <div className="deck-head" /><div className="deck-glass" /><div className="deck-bay-label">SIDE A · STEREO</div>
      </div>
      <div className="deck-tape-wrap"><PhysicalCassette mix={mix} running={phase === 'playing'} progress={progress} resetKey={resetKey} /></div>
    </div>
    <div className="deck-console">
      <div className="deck-transport-status"><div className="deck-led" aria-hidden="true" /><div><div className="deck-status-title" role="status" aria-live="polite">{title}</div><div className="deck-status-detail">{detail}</div></div></div>
      <div className="deck-counter" aria-label={`Playback at ${formatTime(currentTime)}`}>{formatTime(currentTime)}</div>
    </div>
    <div className="deck-progress" role="progressbar" aria-label="Tape progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><div style={{ width: `${progress * 100}%` }} /></div>
    <div className="deck-buttons">
      <button type="button" className="deck-insert" disabled={phase !== 'outside'} onClick={onInsert}>↳ INSERT TAPE</button>
      <div className="deck-keys">
        <button type="button" className={`deck-key deck-play ${phase === 'playing' || phase === 'engaging' ? 'pressed' : ''}`} disabled={phase !== 'ready'} onClick={onPlay}><Icon name="play" size={18} /><span>PLAY</span></button>
        <button type="button" className="deck-key" disabled={phase !== 'playing'} onClick={onStop}><Icon name="square" size={17} /><span>STOP</span></button>
        <button type="button" className="deck-key" disabled={!(phase === 'ready' || phase === 'playing')} onClick={onEject}><Icon name="eject" size={18} /><span>EJECT</span></button>
      </div>
    </div>
    <div className="deck-toolline"><span>{isBusy(phase) ? 'MECHANISM MOVING' : mix.title.toUpperCase()} <span aria-hidden="true">·</span> SIDE A</span><button type="button" onClick={onToggleSound} aria-pressed={soundEnabled} title="Toggle mechanical click sounds"><Icon name={soundEnabled ? 'volume' : 'volumeOff'} size={15} /> <span>CLICKS {soundEnabled ? 'ON' : 'OFF'}</span></button></div>
  </section>;
}
