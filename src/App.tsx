import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIXTAPES, findSongs, resolveAudio } from './data/mixtapes';
import { Library } from './components/Library';
import { PlayerScreen } from './components/PlayerScreen';
import { useCassetteTransport, type CassetteMotionPhase } from './hooks/useCassetteTransport';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useReducedMotion } from './hooks/useReducedMotion';
import { playMechanicalSound, prepareMechanicalAudio } from './utils/mechanicalAudio';

function getLikes(): Record<string, boolean> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('mixtape-likes') ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored)
      ? Object.fromEntries(Object.entries(stored).filter(([, value]) => typeof value === 'boolean')) : {};
  }
  catch { return {}; }
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const transport = useCassetteTransport(reducedMotion);
  const { selectedId, state: cassetteState, busy } = transport;
  const [trackIndexes, setTrackIndexes] = useState<Record<string, number>>({});
  const trackIndex = selectedId ? trackIndexes[selectedId] ?? 0 : 0;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [likes, setLikes] = useState<Record<string, boolean>>(getLikes);
  const libraryRef = useRef<HTMLElement>(null);
  const mix = MIXTAPES.find(item => item.id === selectedId) ?? null;
  const tracks = useMemo(() => mix ? findSongs(mix) : [], [mix]);
  const track = tracks[Math.min(trackIndex, tracks.length - 1)] ?? null;
  const audio = useAudioEngine(track ? resolveAudio(track.src) : null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => setIsMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('mixtape-likes', JSON.stringify(likes)); }
    catch { /* Private browsing can disable storage. */ }
  }, [likes]);

  useEffect(() => {
    if (!libraryOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstTape = libraryRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed]');
    const focusFrame = requestAnimationFrame(() => firstTape?.focus({ preventScroll: true }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLibraryOpen(false);
      if (event.key !== 'Tab' || !window.matchMedia('(max-width: 760px)').matches) return;
      const focusable = libraryRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!libraryRef.current?.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      if (!previousFocus?.matches(':disabled')) previousFocus?.focus({ preventScroll: true });
    };
  }, [libraryOpen]);

  const selectMix = (id: string) => {
    if (busy) return;
    setLibraryOpen(false);
    if (id === selectedId && cassetteState === 'ready') return;
    if (id === selectedId && cassetteState === 'ejected') {
      transport.reinsert();
      return;
    }
    audio.pause();
    audio.rewind();
    setTrackIndexes(previous => ({ ...previous, [id]: 0 }));
    transport.select(id);
  };
  const eject = () => {
    if (busy || !mix) return;
    if (cassetteState === 'ejected') {
      transport.reinsert();
      return;
    }
    audio.pause();
    transport.eject();
  };
  const { pause: pauseAudio, rewind: rewindAudio } = audio;
  const { remove: removeTape } = transport;
  const removeCassette = useCallback(() => {
    if (cassetteState !== 'ejected') return;
    pauseAudio();
    rewindAudio();
    removeTape();
  }, [pauseAudio, rewindAudio, cassetteState, removeTape]);

  useEffect(() => {
    if (cassetteState !== 'ejected' || libraryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      removeCassette();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [cassetteState, libraryOpen, removeCassette]);

  const completeMotion = (phase: CassetteMotionPhase, id: string) => {
    if (cassetteState !== phase || selectedId !== id) return;
    transport.completeMotion(phase, id);
    requestAnimationFrame(() => {
      const target = phase === 'inserting' || phase === 'reinserting' ? '.key-play'
        : phase === 'ejecting' ? '.cassette-touch' : '.key-insert';
      const button = document.querySelector<HTMLButtonElement>(target);
      if (!button?.disabled) button?.focus({ preventScroll: true });
    });
  };
  const play = () => {
    if (cassetteState !== 'ready' || !track) return;
    playMechanicalSound('play');
    void audio.play();
  };
  const stop = () => {
    if (cassetteState !== 'ready') return;
    playMechanicalSound('stop');
    audio.pause();
  };
  const openLibrary = () => {
    playMechanicalSound('press');
    setLibraryOpen(true);
  };
  const chooseTrack = (index: number) => {
    if (busy || !selectedId || index === trackIndex) return;
    playMechanicalSound('press');
    audio.pause();
    setTrackIndexes(previous => ({ ...previous, [selectedId]: index }));
  };
  const toggleLike = () => {
    if (track) setLikes(previous => ({ ...previous, [track.id]: !previous[track.id] }));
  };

  return <div className="site min-h-dvh w-full"
    onPointerOverCapture={() => prepareMechanicalAudio()}
    onFocusCapture={() => prepareMechanicalAudio()}
    onPointerDownCapture={() => prepareMechanicalAudio(true)}
    onKeyDownCapture={event => {
      if (event.key === 'Enter' || event.key === ' ') prepareMechanicalAudio(true);
    }}
    onClick={event => {
      if (cassetteState !== 'ejected' || libraryOpen || !(event.target instanceof Element)) return;
      // Keep the collection and every control independent of the background
      // gesture. In particular, a reinsertion click must never also remove it.
      if (event.target.closest('button, input, a, .collection-panel, [data-cassette-object]')) return;
      removeCassette();
    }}>
    <main className="workspace flex items-center justify-center" aria-label="Loveline cassette player">
      <button className={`collection-scrim ${libraryOpen ? 'is-open' : ''}`} onClick={() => setLibraryOpen(false)} aria-label="Cerrar colección" tabIndex={-1} />
      <aside ref={libraryRef} className={`collection-panel ${libraryOpen ? 'is-open' : ''}`} role={isMobile && libraryOpen ? 'dialog' : 'complementary'} aria-modal={isMobile && libraryOpen ? true : undefined} inert={busy || (isMobile && !libraryOpen)} aria-label="Colección de casetes" aria-busy={busy}
        onTransitionEnd={event => {
          if (event.target === event.currentTarget && event.propertyName === 'transform' && libraryOpen && !event.currentTarget.contains(document.activeElement)) {
            event.currentTarget.querySelector<HTMLButtonElement>('button[aria-pressed]')?.focus({ preventScroll: true });
          }
        }}>
        <Library mixtapes={MIXTAPES} selectedId={selectedId} onSelect={selectMix} onPrepare={transport.prepareSelection} onClose={() => setLibraryOpen(false)} />
      </aside>
      <div className="deck-device" inert={isMobile && libraryOpen}>
        <PlayerScreen mix={mix} tracks={tracks} track={track} trackIndex={trackIndex} cassetteState={cassetteState}
          playing={audio.playing} currentTime={audio.currentTime} duration={audio.duration}
          error={transport.error || (audio.error ? 'No se pudo reproducir el audio. Prueba con PLAY otra vez.' : '')}
          liked={track ? Boolean(likes[track.id]) : false} reducedMotion={reducedMotion}
          onOpenLibrary={openLibrary} onPlay={play} onStop={stop} onEject={eject}
          onReinsert={transport.reinsert} onRemove={removeCassette}
          onMotionComplete={completeMotion}
          onSelectTrack={chooseTrack} onSeek={audio.seek} onToggleLike={toggleLike} />
      </div>
    </main>
  </div>;
}
