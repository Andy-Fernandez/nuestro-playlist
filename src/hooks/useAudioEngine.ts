import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioEngine(src: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequest = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    // Start buffering the selected song during insertion, before PLAY is pressed.
    audio.preload = 'auto';
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => { setPlaying(true); setError(''); };
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    const onError = () => { if (audio.hasAttribute('src')) setError('Could not play this audio file.'); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      playRequest.current += 1;
      audio.pause(); audio.removeAttribute('src'); audio.load(); audioRef.current = null;
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playRequest.current += 1;
    audio.pause();
    audio.volume = 1;
    if (src) audio.src = src;
    else audio.removeAttribute('src');
    audio.load();
    setPlaying(false); setCurrentTime(0); setDuration(0); setError('');
  }, [src]);

  // Must be invoked directly from the user's PLAY click before any awaited delay.
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      setError('Audio player is not ready yet.');
      return;
    }
    const request = ++playRequest.current;
    setError('');
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
    } catch (failure) {
      if (request !== playRequest.current || (failure instanceof DOMException && failure.name === 'AbortError')) return;
      setError('Playback was blocked or this audio file could not be opened.');
    }
  }, []);
  const pause = useCallback(() => { playRequest.current += 1; audioRef.current?.pause(); }, []);
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time));
    setCurrentTime(audio.currentTime);
  }, []);
  const rewind = useCallback(() => {
    playRequest.current += 1;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause(); audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  return { playing, currentTime, duration, error, play, pause, seek, rewind };
}
