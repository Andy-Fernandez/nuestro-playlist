import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioEngine(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [endedCount, setEndedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setEndedCount(n => n + 1); };
    const onError = () => setError('Could not play this audio file.');
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
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
    audio.pause(); audio.volume = 1; audio.src = src; audio.load();
    setPlaying(false); setCurrentTime(0); setDuration(0); setError('');
  }, [src]);

  // Must be invoked directly from the user's PLAY click before any awaited delay.
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return Promise.reject(new Error('Audio not initialized'));
    if (audio.ended) audio.currentTime = 0;
    return audio.play().catch(err => {
      setError('Playback was blocked or this audio file could not be opened.');
      throw err;
    });
  }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time));
    setCurrentTime(audio.currentTime);
  }, []);
  const rewind = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause(); audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  return { audioRef, playing, currentTime, duration, endedCount, error, play, pause, seek, rewind };
}
