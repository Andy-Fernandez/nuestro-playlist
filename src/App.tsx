import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MIXTAPES, findSongs, resolveAudio } from './data/mixtapes';
import { Library } from './components/Library';
import { PlayerScreen } from './components/PlayerScreen';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useReducedMotion } from './hooks/useReducedMotion';

type Screen = 'library' | 'deck';
function getLikes(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem('mixtape-likes') ?? '{}') as Record<string, boolean>; }
  catch { return {}; }
}
export default function App() {
  const [screen, setScreen] = useState<Screen>('library');
  const [selectedId, setSelectedId] = useState(MIXTAPES[0].id);
  const [trackIndex, setTrackIndex] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>(getLikes);
  const reducedMotion = useReducedMotion();

  const mix = MIXTAPES.find(m => m.id === selectedId) ?? MIXTAPES[0];
  const tracks = useMemo(() => findSongs(mix), [mix]);
  const track = tracks[Math.min(trackIndex, tracks.length - 1)];
  const audio = useAudioEngine(resolveAudio(track.src));

  useEffect(() => { try { localStorage.setItem('mixtape-likes', JSON.stringify(likes)); } catch { /* storage unavailable */ } }, [likes]);

  const openMix = (id: string) => {
    setSelectedId(id);
    setTrackIndex(0);
    setScreen('deck');
  };
  const back = () => { audio.pause(); audio.rewind(); setScreen('library'); };
  const chooseTrack = (index: number) => {
    if (index === trackIndex) return;
    audio.pause();
    setTrackIndex(index);
  };
  const toggleLike = () => setLikes(prev => ({ ...prev, [track.id]: !prev[track.id] }));
  const favorites = favoritesOnly ? MIXTAPES.filter(item => findSongs(item).some(song => likes[song.id])) : MIXTAPES;

  return <div className="site">
    <div className="ambient ambient-a" /><div className="ambient ambient-b" />
    <main className="app-frame">
      <div className="app-notch" aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={screen} className="view-slot" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reducedMotion ? 0.1 : 0.24, ease: 'easeOut' }}>
          {screen === 'library' && <Library mixtapes={favorites} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly(x => !x)} onSelect={openMix} />}
          {screen === 'deck' && <PlayerScreen mix={mix} tracks={tracks} track={track} trackIndex={trackIndex} playing={audio.playing} currentTime={audio.currentTime} duration={audio.duration} error={audio.error} liked={Boolean(likes[track.id])} onBack={back} onTogglePlayback={() => audio.playing ? audio.pause() : void audio.play()} onSelectTrack={chooseTrack} onSeek={audio.seek} onToggleLike={toggleLike} />}
        </motion.div>
      </AnimatePresence>
      <div className="phone-home-bar" aria-hidden="true" />
    </main>
  </div>;
}
