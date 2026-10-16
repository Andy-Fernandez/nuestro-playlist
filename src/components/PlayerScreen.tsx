import type { Song, Mixtape } from '../data/mixtapes';
import { formatTime } from '../utils/deck';
import { PhysicalCassette } from './PhysicalCassette';
import { Icon } from './Icon';

type Props = {
  mix: Mixtape;
  tracks: Song[];
  track: Song;
  trackIndex: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  error: string;
  liked: boolean;
  onBack: () => void;
  onTogglePlayback: () => void;
  onSelectTrack: (index: number) => void;
  onSeek: (value: number) => void;
  onToggleLike: () => void;
};

export function PlayerScreen({ mix, tracks, track, trackIndex, playing, currentTime, duration, error, liked, onBack, onTogglePlayback, onSelectTrack, onSeek, onToggleLike }: Props) {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const canSeek = duration > 0;

  return <section className="screen player-screen" aria-label={`${mix.title} player`}>
    <header className="player-header">
      <button className="player-back" type="button" onClick={onBack} aria-label="Back to mixtapes">
        <Icon name="back" size={20} />
      </button>
      <span className="player-mix-title">{mix.title}</span>
      <button className={`player-favorite ${liked ? 'is-liked' : ''}`} type="button" onClick={onToggleLike} aria-label={liked ? 'Remove favorite' : 'Favorite song'} aria-pressed={liked}>
        <Icon name="heart" size={20} />
      </button>
    </header>

    <div className="player-cassette-area">
      <PhysicalCassette mix={mix} running={playing} progress={progress} resetKey={`${mix.id}:${track.id}`} />
    </div>

    <div className="player-track-info">
      <h1>{track.title}</h1>
      <span>{formatTime(currentTime)}</span>
    </div>
    <div className="player-timeline">
      <input
        type="range"
        min={0}
        max={Math.max(1, duration)}
        step={0.1}
        value={Math.min(currentTime, Math.max(1, duration))}
        disabled={!canSeek}
        onChange={event => onSeek(Number(event.target.value))}
        style={{ '--percent': `${progress * 100}%` } as React.CSSProperties}
        aria-label="Seek playback"
      />
      <span>{formatTime(duration)}</span>
    </div>
    {error && <p className="player-error" role="alert">{error}</p>}

    <div className="player-controls" aria-label="Playback controls">
      <button type="button" onClick={() => onSelectTrack((trackIndex - 1 + tracks.length) % tracks.length)} aria-label="Previous song">
        <Icon name="prev" size={20} />
      </button>
      <button className="player-play" type="button" onClick={onTogglePlayback} aria-label={playing ? 'Pause' : 'Play'}>
        <Icon name={playing ? 'pause' : 'play'} size={20} />
      </button>
      <button type="button" onClick={() => onSelectTrack((trackIndex + 1) % tracks.length)} aria-label="Next song">
        <Icon name="next" size={20} />
      </button>
    </div>
  </section>;
}
