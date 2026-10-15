import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MIXTAPES, findSongs, resolveAudio } from './data/mixtapes';
import type { Song } from './data/mixtapes';
import { Welcome } from './components/Welcome';
import { Library } from './components/Library';
import { PlayerScreen } from './components/PlayerScreen';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useTransport } from './hooks/useTransport';
import { useReducedMotion } from './hooks/useReducedMotion';
import { mechanicalClick } from './utils/sfx';

type Screen = 'welcome' | 'library' | 'deck';
function getLikes(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem('mixtape-likes') ?? '{}') as Record<string, boolean>; }
  catch { return {}; }
}
export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedId, setSelectedId] = useState(MIXTAPES[0].id);
  const [trackIndex, setTrackIndex] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>(getLikes);
  const [uploaded, setUploaded] = useState<Record<string, Song[]>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);
  const reducedMotion = useReducedMotion();

  const mix = MIXTAPES.find(m => m.id === selectedId) ?? MIXTAPES[0];
  const tracks = useMemo(() => [...findSongs(mix), ...(uploaded[mix.id] ?? [])], [mix, uploaded]);
  const track = tracks[Math.min(trackIndex, tracks.length - 1)];
  const audio = useAudioEngine(resolveAudio(track.src));
  const transport = useTransport(audio, soundEnabled);

  useEffect(() => { try { localStorage.setItem('mixtape-likes', JSON.stringify(likes)); } catch { /* storage unavailable */ } }, [likes]);
  useEffect(() => { if (audio.endedCount > 0) transport.ended(); }, [audio.endedCount, transport]);
  useEffect(() => () => objectUrls.current.forEach(url => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openMix = (id: string) => {
    transport.reset();
    setSelectedId(id);
    setTrackIndex(0);
    setScreen('deck');
    mechanicalClick('select', soundEnabled);
  };
  const back = () => { transport.reset(); setScreen('library'); };
  const chooseTrack = (index: number) => {
    if (index === trackIndex) return;
    transport.newTrack();
    setTrackIndex(index);
    mechanicalClick('select', soundEnabled);
  };
  const toggleLike = () => setLikes(prev => ({ ...prev, [track.id]: !prev[track.id] }));
  const favorites = favoritesOnly ? MIXTAPES.filter(item => [...findSongs(item), ...(uploaded[item.id] ?? [])].some(song => likes[song.id])) : MIXTAPES;
  const counts = Object.fromEntries(MIXTAPES.map(item => [item.id, findSongs(item).length + (uploaded[item.id]?.length ?? 0)]));
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []).filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg)$/i.test(file.name));
    event.currentTarget.value = '';
    if (files.length === 0) return;
    const id = screen === 'deck' ? mix.id : 'for-you';
    const newSongs = files.map((file, index) => {
      const src = URL.createObjectURL(file);
      objectUrls.current.push(src);
      return { id: `upload-${Date.now()}-${index}`, title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '), artist: 'Local audio · Your song', src, note: 'Una canción elegida especialmente para ti. ♡' };
    });
    const firstIndex = findSongs(MIXTAPES.find(item => item.id === id) ?? MIXTAPES[0]).length + (uploaded[id]?.length ?? 0);
    setUploaded(prev => ({ ...prev, [id]: [...(prev[id] ?? []), ...newSongs] }));
    if (screen === 'deck') { transport.newTrack(); setTrackIndex(firstIndex); }
    setToast(`${files.length} song${files.length === 1 ? '' : 's'} added to ${screen === 'deck' ? mix.title : 'For You'} for this session.`);
  };

  return <div className={`site ${screen === 'deck' ? 'site--deck' : ''}`}>
    <div className="ambient ambient-a" /><div className="ambient ambient-b" />
    <main className={screen === 'deck' ? 'deck-stage' : 'app-frame'}>
      {screen !== 'deck' && <div className="app-notch" aria-hidden="true" />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={screen} className="view-slot" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reducedMotion ? 0.1 : 0.24, ease: 'easeOut' }}>
          {screen === 'welcome' && <Welcome onContinue={() => setScreen('library')} />}
          {screen === 'library' && <Library mixtapes={favorites} counts={counts} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly(x => !x)} onSelect={openMix} onWelcome={() => setScreen('welcome')} onUpload={() => fileInput.current?.click()} />}
          {screen === 'deck' && <PlayerScreen mix={mix} tracks={tracks} track={track} trackIndex={trackIndex} phase={transport.phase} currentTime={audio.currentTime} duration={audio.duration} error={audio.error} liked={Boolean(likes[track.id])} soundEnabled={soundEnabled} onBack={back} onInsert={() => void transport.insert()} onPlay={() => void transport.play()} onStop={() => void transport.stop()} onEject={() => void transport.eject()} onSelectTrack={chooseTrack} onSeek={audio.seek} onToggleLike={toggleLike} onToggleSound={() => setSoundEnabled(x => !x)} onUpload={() => fileInput.current?.click()} />}
        </motion.div>
      </AnimatePresence>
      {screen !== 'deck' && <div className="phone-home-bar" aria-hidden="true" />}
    </main>
    <input ref={fileInput} className="visually-hidden" type="file" multiple accept="audio/*,.mp3,.m4a,.ogg,.wav" onChange={upload} aria-label="Select local audio files" />
    {toast && <div className="app-toast" role="status">{toast}</div>}
  </div>;
}
