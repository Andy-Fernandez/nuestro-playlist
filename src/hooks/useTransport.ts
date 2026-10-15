import { useCallback, useEffect, useRef, useState } from 'react';
import { mechanicalClick } from '../utils/sfx';

export type TransportPhase = 'outside' | 'inserting' | 'ready' | 'engaging' | 'playing' | 'stopping' | 'ejecting';
const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

type AudioCommands = {
  play: () => Promise<void>;
  pause: () => void;
  rewind: () => void;
};
export function useTransport(audio: AudioCommands, soundEnabled: boolean) {
  const [phase, setPhase] = useState<TransportPhase>('outside');
  const phaseRef = useRef<TransportPhase>('outside');
  const version = useRef(0);
  const setMode = useCallback((next: TransportPhase) => { phaseRef.current = next; setPhase(next); }, []);

  const insert = useCallback(async () => {
    if (phaseRef.current !== 'outside') return;
    const id = ++version.current;
    mechanicalClick('insert', soundEnabled);
    setMode('inserting');
    await wait(910);
    if (id !== version.current) return;
    setMode('ready');
    mechanicalClick('stop', soundEnabled);
  }, [setMode, soundEnabled]);

  const play = useCallback(async () => {
    if (phaseRef.current !== 'ready') return;
    const id = ++version.current;
    mechanicalClick('play', soundEnabled);
    setMode('engaging');
    // Audio.play happens synchronously as part of the actual click: browser gesture rules.
    const request = audio.play();
    try {
      await Promise.all([request, wait(365)]);
      if (id !== version.current) { audio.pause(); return; }
      setMode('playing');
    } catch {
      if (id !== version.current) return;
      audio.pause();
      setMode('ready');
    }
  }, [audio, setMode, soundEnabled]);

  const stop = useCallback(async () => {
    if (phaseRef.current !== 'playing') return;
    const id = ++version.current;
    audio.pause();
    mechanicalClick('stop', soundEnabled);
    setMode('stopping');
    await wait(380);
    if (id !== version.current) return;
    setMode('ready');
  }, [audio, setMode, soundEnabled]);

  const eject = useCallback(async () => {
    const current = phaseRef.current;
    if (current !== 'ready' && current !== 'playing') return;
    const id = ++version.current;
    if (current === 'playing') {
      audio.pause();
      mechanicalClick('stop', soundEnabled);
      setMode('stopping');
      await wait(350);
      if (id !== version.current) return;
    }
    mechanicalClick('eject', soundEnabled);
    setMode('ejecting');
    await wait(920);
    if (id !== version.current) return;
    audio.rewind();
    setMode('outside');
  }, [audio, setMode, soundEnabled]);

  const reset = useCallback(() => {
    version.current += 1;
    audio.rewind();
    setMode('outside');
  }, [audio, setMode]);

  const newTrack = useCallback(() => {
    version.current += 1;
    audio.pause();
    if (phaseRef.current !== 'outside') setMode('ready');
  }, [audio, setMode]);

  const ended = useCallback(() => {
    version.current += 1;
    if (phaseRef.current === 'playing' || phaseRef.current === 'engaging') setMode('ready');
  }, [setMode]);

  useEffect(() => () => { version.current += 1; }, []);
  return { phase, insert, play, stop, eject, reset, newTrack, ended };
}
