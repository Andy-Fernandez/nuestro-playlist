import type { CSSProperties } from 'react';
import type { Song, Mixtape } from '../data/mixtapes';
import { formatTime } from '../utils/deck';
import { CassetteObject } from './CassetteObject';
import { Icon } from './Icon';
import { CASSETTE_PERSPECTIVE, type CassetteState, type CassetteMotionPhase } from '../config/cassetteMotion';

type Props = {
  mix: Mixtape | null;
  tracks: Song[];
  track: Song | null;
  trackIndex: number;
  cassetteState: CassetteState;
  playing: boolean;
  currentTime: number;
  duration: number;
  error: string;
  liked: boolean;
  reducedMotion: boolean;
  onOpenLibrary: () => void;
  onPlay: () => void;
  onStop: () => void;
  onEject: () => void;
  onReinsert: () => void;
  onRemove: (throwing?: boolean) => void;
  onMotionComplete: (phase: CassetteMotionPhase, cassetteId: string) => void;
  onSelectTrack: (index: number) => void;
  onSeek: (value: number) => void;
  onToggleLike: () => void;
};

export function PlayerScreen({ mix, tracks, track, trackIndex, cassetteState, playing, currentTime, duration, error, liked, reducedMotion, onOpenLibrary, onPlay, onStop, onEject, onReinsert, onRemove, onMotionComplete, onSelectTrack, onSeek, onToggleLike }: Props) {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const ready = cassetteState === 'ready';
  const ejected = cassetteState === 'ejected';
  const busy = cassetteState === 'loading' || cassetteState === 'inserting' || cassetteState === 'ejecting' || cassetteState === 'reinserting' || cassetteState === 'removing';
  const status = cassetteState === 'loading' ? 'LOADING TAPE'
    : cassetteState === 'inserting' || cassetteState === 'reinserting' ? 'INSERTING TAPE'
      : cassetteState === 'ejecting' ? 'EJECTING' : cassetteState === 'removing' ? 'REMOVING TAPE'
        : ejected ? 'TAPE EJECTED' : playing ? 'NOW PLAYING' : ready ? 'READY TO PLAY' : 'NO TAPE';

  return <section className={`deck-surface flex h-full flex-col${ejected || cassetteState === 'removing' ? ' has-loose-tape' : ''}`} aria-label="Casetera Loveline">
    <header className="deck-header grid items-center">
      <button className="icon-button" onClick={onOpenLibrary} aria-label="Abrir colección de casetes" disabled={busy}>
        <Icon name="list" size={23} />
      </button>
      <div className="deck-brand text-center"><h1>LOVELINE</h1><p>CASSETTE PLAYER</p></div>
      <button className={`icon-button header-heart ${liked ? 'is-liked' : ''}`} onClick={onToggleLike} disabled={!track || busy} aria-label={liked ? 'Quitar canción de favoritos' : 'Guardar canción en favoritos'} aria-pressed={liked}>
        <Icon name="heart" size={23} />
      </button>
    </header>

    <div className="deck-bay-area">
      <div className="deck-bay">
        <img className="deck-background" src={`${import.meta.env.BASE_URL}assets/background.png`} alt="Mecanismo de la casetera" draggable={false} />
        <div className="deck-cassette-stage" style={{ perspective: CASSETTE_PERSPECTIVE }}>
          {mix && <CassetteObject key={mix.id} mix={mix} state={cassetteState}
            running={playing && ready} progress={progress} resetKey={`${mix.id}:${track?.id}`}
            reducedMotion={reducedMotion} onReinsert={onReinsert} onRemove={onRemove}
            onMotionComplete={onMotionComplete} />}
        </div>
        <div className="deck-bay-shine" aria-hidden="true" />
      </div>
    </div>

    <div className="deck-console">
      <div className="transport-status flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className={`status-led ${playing ? 'is-playing' : ''} ${busy ? 'is-busy' : ''}`} aria-hidden="true" /><span className="status-label" role="status">{status}</span></div>
        <output className={`digital-clock ${playing ? 'is-on' : ''}`} aria-label={`Tiempo de reproducción: ${formatTime(currentTime)}`}>{formatTime(currentTime)}</output>
      </div>
      <div className="timeline-row">
        <input className="deck-timeline" type="range" min={0} max={Math.max(1, duration)} step={.1}
          value={Math.min(currentTime, Math.max(1, duration))} disabled={!ready || duration <= 0}
          onChange={event => onSeek(Number(event.target.value))}
          style={{ '--percent': `${progress * 100}%` } as CSSProperties} aria-label="Posición de la canción" />
      </div>
      <div className="track-metadata flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2>{track?.title ?? 'Elige un casete'}</h2>
          <p id={ejected ? 'cassette-instructions' : undefined}>{ejected ? 'Toca para insertar; arrastra para lanzar.' : track?.artist ?? 'Tu próxima canción empieza aquí.'}</p>
        </div>
        {tracks.length > 1 && <div className="track-navigation flex items-center gap-1">
          <button className="icon-button" onClick={() => onSelectTrack((trackIndex - 1 + tracks.length) % tracks.length)} disabled={!ready} aria-label="Canción anterior"><Icon name="prev" size={18} /></button>
          <span>{trackIndex + 1}/{tracks.length}</span>
          <button className="icon-button" onClick={() => onSelectTrack((trackIndex + 1) % tracks.length)} disabled={!ready} aria-label="Siguiente canción"><Icon name="next" size={18} /></button>
        </div>}
        {ejected && <button type="button" className="cassette-remove" onClick={() => onRemove()} aria-label="Retirar casete">RETIRAR</button>}
        {!ejected && track && tracks.length === 1 && <span className="side-indicator" aria-label="Lado A">A</span>}
      </div>
      {error && <p className="player-error" role="alert">{error}</p>}
      <div className="transport-keys grid grid-cols-4" role="group" aria-label="Controles de la casetera">
        <button className="transport-key key-insert" onClick={onOpenLibrary} disabled={busy} aria-label="Insertar casete: abrir colección"><span className="key-face"><Icon name="cassette" size={21} /><span>INSERT TAPE</span></span></button>
        <button className={`transport-key key-play ${playing ? 'is-latched' : ''}`} onClick={onPlay} disabled={!ready} aria-label="Reproducir" aria-pressed={playing}><span className="key-face"><Icon name="play" size={21} /><span>PLAY</span></span></button>
        <button className="transport-key" onClick={onStop} disabled={!ready} aria-label="Detener reproducción"><span className="key-face"><Icon name="square" size={20} /><span>STOP</span></span></button>
        <button className="transport-key key-eject" onClick={onEject} disabled={!ready && !ejected} aria-label={ejected ? 'Volver a insertar casete' : 'Expulsar casete'}><span className="key-face"><Icon name={ejected ? 'cassette' : 'eject'} size={21} /><span>{ejected ? 'INSERT' : 'EJECT'}</span></span></button>
      </div>
    </div>
  </section>;
}
