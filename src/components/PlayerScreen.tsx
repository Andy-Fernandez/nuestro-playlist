import * as React from 'react';
import type { Song, Mixtape } from '../data/mixtapes';
import type { TransportPhase } from '../hooks/useTransport';
import { formatTime } from '../utils/deck';
import { MechanicalDeck } from './MechanicalDeck';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'motion/react';

type Props = {
  mix: Mixtape; tracks: Song[]; track: Song; trackIndex: number;
  phase: TransportPhase; currentTime: number; duration: number; error: string;
  liked: boolean; soundEnabled: boolean;
  onBack: () => void; onInsert: () => void; onPlay: () => void; onStop: () => void; onEject: () => void;
  onSelectTrack: (index: number) => void; onSeek: (value: number) => void;
  onToggleLike: () => void; onToggleSound: () => void; onUpload: () => void;
};
export function PlayerScreen({ mix, tracks, track, trackIndex, phase, currentTime, duration, error, liked, soundEnabled, onBack, onInsert, onPlay, onStop, onEject, onSelectTrack, onSeek, onToggleLike, onToggleSound, onUpload }: Props) {
  const [panel, setPanel] = React.useState<'notes' | 'tracks' | null>(null);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const canSeek = phase === 'playing' || phase === 'ready';
  return <div className="deck-screen">
    <header className="deck-screen-head">
      <button className="deck-back" onClick={onBack} aria-label="Back to cassette library"><Icon name="back" size={18} /><span>THE COLLECTION</span></button>
      <span className="deck-screen-name">{mix.title}</span>
      <button className="deck-head-action" onClick={() => setPanel('tracks')} aria-label="View songs"><Icon name="list" size={19} /><span>TRACKS</span></button>
    </header>
    <div className="deck-layout">
      <MechanicalDeck mix={mix} phase={phase} progress={progress} currentTime={currentTime} soundEnabled={soundEnabled} resetKey={`${mix.id}:${track.id}`} onInsert={onInsert} onPlay={onPlay} onStop={onStop} onEject={onEject} onToggleSound={onToggleSound} />
      <div className="deck-info">
        <div className="deck-track-heading">
          <div className="deck-track-text">
            <div className="deck-kicker">SIDE A &nbsp; / &nbsp; {String(trackIndex + 1).padStart(2, '0')} OF {String(tracks.length).padStart(2, '0')}</div>
            <h1>{track.title}</h1>
            <p>{track.artist}</p>
          </div>
          <button className={`deck-favorite ${liked ? 'is-liked' : ''}`} onClick={onToggleLike} title="Favorite song" aria-label={liked ? 'Remove favorite' : 'Favorite song'} aria-pressed={liked}><Icon name="heart" size={23} /></button>
        </div>
        <div className="deck-timeline">
          <input type="range" min={0} max={Math.max(1, duration)} step={0.1} value={Math.min(currentTime, Math.max(1, duration))} disabled={!canSeek || !duration} onChange={(e) => onSeek(Number(e.target.value))} style={{ '--percent': `${progress * 100}%` } as React.CSSProperties} aria-label="Seek playback" />
          <div className="deck-timestamps"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
        </div>
        {error && <p className="deck-error" role="alert">{error}</p>}
        <div className="deck-extras">
          <div className="deck-song-nav">
            <button onClick={() => onSelectTrack((trackIndex - 1 + tracks.length) % tracks.length)} aria-label="Previous song" title="Previous song"><Icon name="prev" size={19} /></button>
            <span>TRACK {String(trackIndex + 1).padStart(2, '0')}</span>
            <button onClick={() => onSelectTrack((trackIndex + 1) % tracks.length)} aria-label="Next song" title="Next song"><Icon name="next" size={19} /></button>
          </div>
          <div className="deck-extras-actions">
            <button onClick={() => setPanel('notes')}><Icon name="note" size={16} /> LOVE NOTE</button>
            <button onClick={onUpload}><Icon name="plus" size={16} /> ADD AUDIO</button>
          </div>
        </div>
      </div>
    </div>
    <AnimatePresence>
      {panel && <motion.div className="deck-modal-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(null)}>
        <motion.div className="deck-modal" role="dialog" aria-modal="true" aria-label={panel === 'notes' ? 'Love note' : 'Track list'} initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 35, opacity: 0 }} transition={{ duration: 0.24 }} onClick={event => event.stopPropagation()}>
          <div className="deck-modal-top"><strong>{panel === 'notes' ? 'A LITTLE NOTE ♡' : 'SIDE A · TRACK LIST'}</strong><button onClick={() => setPanel(null)} aria-label="Close panel"><Icon name="close" size={19} /></button></div>
          {panel === 'notes' ? <div className="deck-note"><div>Para ti, ♡</div><p>{track.note}</p><footer>Con todo mi cariño.</footer></div> : <div className="deck-track-list">{tracks.map((item, index) => <button className={`deck-list-row ${trackIndex === index ? 'selected' : ''}`} key={item.id} onClick={() => { onSelectTrack(index); setPanel(null); }}><span>{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.artist}</small></span>{trackIndex === index && <span>♫</span>}</button>)}</div>}
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
