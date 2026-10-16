import { useCallback, useEffect, useRef, useState } from 'react';
import { MIXTAPES, resolveAsset, type Mixtape } from '../data/mixtapes';
import type { CassetteMotionPhase, CassetteState } from '../config/cassetteMotion';
import { playMechanicalSound } from '../utils/mechanicalAudio';

export type { CassetteMotionPhase, CassetteState } from '../config/cassetteMotion';

type TransportSnapshot = { selectedId: string | null; state: CassetteState; error: string };

const EMPTY: TransportSnapshot = { selectedId: null, state: 'empty', error: '' };
const SHARED_ASSETS = [
  'assets/cassettes/shared/shell.png',
  'assets/cassettes/shared/glass.png',
  'assets/cassettes/shared/tape-wind.png',
];

// Retain decoded Image objects, including concurrent requests for the same URL.
// A failed promise is removed so a later user selection can retry that asset.
const decodedImages = new Map<string, Promise<HTMLImageElement>>();

function preloadImage(path: string): Promise<HTMLImageElement> {
  const url = resolveAsset(path);
  const cached = decodedImages.get(url);
  if (cached) return cached;

  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const finish = () => {
      image.onload = null;
      image.onerror = null;
    };
    const fail = () => {
      finish();
      reject(new Error(`Cassette image could not be decoded: ${url}`));
    };
    image.onload = () => {
      const decoding = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
      void decoding.then(() => {
        finish();
        resolve(image);
      }, fail);
    };
    image.onerror = fail;
    image.src = url;
  });

  decodedImages.set(url, request);
  void request.catch(() => {
    if (decodedImages.get(url) === request) decodedImages.delete(url);
  });
  return request;
}

function preloadCassette(mix: Mixtape): Promise<HTMLImageElement[]> {
  return Promise.all([
    mix.artwork.label,
    mix.hardware.reel,
    mix.hardware.guideRoller,
    ...SHARED_ASSETS,
  ].map(preloadImage));
}

function isBusy(state: CassetteState): boolean {
  return state === 'loading' || state === 'inserting' || state === 'ejecting';
}

/** Cassette loading and physical transitions; music playback belongs to App. */
export function useCassetteTransport() {
  const [snapshot, setSnapshot] = useState<TransportSnapshot>(EMPTY);
  const current = useRef(snapshot);
  const pendingId = useRef<string | null>(null);
  const requestToken = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestToken.current += 1;
      pendingId.current = null;
    };
  }, []);

  const commit = useCallback((next: TransportSnapshot) => {
    current.current = next;
    setSnapshot(next);
  }, []);

  const select = useCallback((id: string) => {
    if (!mounted.current || isBusy(current.current.state)) return;
    // This runs synchronously in the selecting gesture, before image decoding.
    playMechanicalSound('press');
    const mix = MIXTAPES.find(item => item.id === id);
    if (!mix) {
      commit({ ...current.current, error: 'No se encontró ese casete. Elige otro de la colección.' });
      return;
    }
    if (current.current.state === 'ready' && current.current.selectedId === id) {
      commit({ ...current.current, error: '' });
      return;
    }

    const token = ++requestToken.current;
    pendingId.current = null;
    commit({ ...current.current, state: 'loading', error: '' });

    void preloadCassette(mix).then(() => {
      if (!mounted.current || token !== requestToken.current) return;
      if (current.current.selectedId) {
        // The old cassette remains mounted until its ejection actually ends.
        pendingId.current = id;
        commit({ ...current.current, state: 'ejecting', error: '' });
        playMechanicalSound('eject');
      } else {
        commit({ selectedId: id, state: 'inserting', error: '' });
        playMechanicalSound('insert');
      }
    }, () => {
      if (!mounted.current || token !== requestToken.current) return;
      pendingId.current = null;
      commit({
        selectedId: current.current.selectedId,
        state: current.current.selectedId ? 'ready' : 'empty',
        error: 'No se pudo cargar el diseño del casete. Selecciónalo otra vez para reintentar.',
      });
    });
  }, [commit]);

  const eject = useCallback(() => {
    if (!mounted.current || current.current.state !== 'ready' || !current.current.selectedId) return;
    requestToken.current += 1;
    pendingId.current = null;
    commit({ ...current.current, state: 'ejecting', error: '' });
    playMechanicalSound('eject');
  }, [commit]);

  const completeMotion = useCallback((phase: CassetteMotionPhase, cassetteId: string) => {
    if (!mounted.current || current.current.state !== phase || current.current.selectedId !== cassetteId) return;
    if (phase === 'inserting') {
      commit({ ...current.current, state: 'ready' });
      return;
    }

    const nextId = pendingId.current;
    pendingId.current = null;
    if (nextId) {
      commit({ selectedId: nextId, state: 'inserting', error: '' });
      playMechanicalSound('insert');
    } else {
      commit(EMPTY);
    }
  }, [commit]);

  return {
    selectedId: snapshot.selectedId,
    state: snapshot.state,
    busy: isBusy(snapshot.state),
    error: snapshot.error,
    select,
    eject,
    completeMotion,
  };
}
