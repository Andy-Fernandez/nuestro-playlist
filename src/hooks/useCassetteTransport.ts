import { useCallback, useEffect, useRef, useState } from 'react';
import { MIXTAPES, resolveAsset, type Mixtape } from '../data/mixtapes';
import { CASSETTE_INSERT_DURATION, CASSETTE_EJECT_DURATION, CASSETTE_REINSERT_DURATION, CASSETTE_REMOVE_DURATION, CASSETTE_THROW_DURATION, cassetteDuration, type MotionSpeed, type CassetteMotionPhase, type CassetteState } from '../config/cassetteMotion';
import { playMechanicalSound } from '../utils/mechanicalAudio';

export type { CassetteMotionPhase, CassetteState } from '../config/cassetteMotion';

type TransportSnapshot = { selectedId: string | null; state: CassetteState; error: string };

const EMPTY: TransportSnapshot = { selectedId: null, state: 'empty', error: '' };
const LOAD_ERROR = 'No se pudo cargar el diseño del casete. Selecciónalo otra vez para reintentar.';
type PendingSelection = { id: string; loaded: boolean; error: string };
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

function prepareSelection(id: string): void {
  const mix = MIXTAPES.find(item => item.id === id);
  if (mix) void preloadCassette(mix).catch(() => undefined);
}

function isBusy(state: CassetteState): boolean {
  return state === 'loading' || state === 'inserting' || state === 'ejecting' || state === 'reinserting' || state === 'removing';
}

/** Cassette loading and physical transitions; music playback belongs to App. */
export function useCassetteTransport(reducedMotion = false, motionSpeed: MotionSpeed = 'normal') {
  const [snapshot, setSnapshot] = useState<TransportSnapshot>(EMPTY);
  const current = useRef(snapshot);
  const pending = useRef<PendingSelection | null>(null);
  const requestToken = useRef(0);
  const mounted = useRef(true);
  const insertDuration = cassetteDuration(CASSETTE_INSERT_DURATION, reducedMotion, motionSpeed);
  const ejectDuration = cassetteDuration(CASSETTE_EJECT_DURATION, reducedMotion, motionSpeed);
  const reinsertDuration = cassetteDuration(CASSETTE_REINSERT_DURATION, reducedMotion, motionSpeed);
  const removeDuration = cassetteDuration(CASSETTE_REMOVE_DURATION, reducedMotion, motionSpeed);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestToken.current += 1;
      pending.current = null;
    };
  }, []);

  useEffect(() => {
    // Warm one cassette at a time between interactions, sharing the same decode
    // promises as hover/focus/selection. Never put the full collection on the
    // initial render's critical path or let a failed background request escape.
    let cancelled = false;
    let handle = 0;
    let index = 0;
    const schedule = () => {
      if (cancelled || index >= MIXTAPES.length) return;
      if ('requestIdleCallback' in window) handle = window.requestIdleCallback(warm, { timeout: 1200 });
      else handle = globalThis.setTimeout(warm, 150);
    };
    const warm = () => {
      if (cancelled) return;
      void preloadCassette(MIXTAPES[index++]).catch(() => undefined).then(schedule);
    };
    schedule();
    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, []);

  const commit = useCallback((next: TransportSnapshot) => {
    current.current = next;
    setSnapshot(next);
  }, []);

  const reinsert = useCallback(() => {
    if (!mounted.current || current.current.state !== 'ejected' || !current.current.selectedId) return;
    requestToken.current += 1;
    pending.current = null;
    commit({ ...current.current, state: 'reinserting', error: '' });
    playMechanicalSound('reinsert', reinsertDuration);
  }, [commit, reinsertDuration]);

  const remove = useCallback((throwing = false) => {
    if (!mounted.current || current.current.state !== 'ejected' || !current.current.selectedId) return;
    requestToken.current += 1;
    pending.current = null;
    commit({ ...current.current, state: 'removing', error: '' });
    playMechanicalSound('remove', throwing ? cassetteDuration(CASSETTE_THROW_DURATION, reducedMotion, motionSpeed) : removeDuration);
  }, [commit, reducedMotion, motionSpeed, removeDuration]);

  const select = useCallback((id: string) => {
    if (!mounted.current || isBusy(current.current.state)) return;
    // This runs synchronously in the selecting gesture, before image decoding.
    playMechanicalSound('press');
    const mix = MIXTAPES.find(item => item.id === id);
    if (!mix) {
      commit({ ...current.current, error: 'No se encontró ese casete. Elige otro de la colección.' });
      return;
    }
    if (current.current.selectedId === id) {
      if (current.current.state === 'ejected') reinsert();
      else commit({ ...current.current, error: '' });
      return;
    }

    const token = ++requestToken.current;
    pending.current = { id, loaded: false, error: '' };
    if (current.current.selectedId) {
      // A new selection takes the old tape away from its current pose while the
      // next design decodes. Manual EJECT leaves the tape available to reinsert.
      commit({ ...current.current, state: 'removing', error: '' });
      playMechanicalSound('remove', removeDuration);
    } else {
      commit({ ...current.current, state: 'loading', error: '' });
    }

    void preloadCassette(mix).then(() => {
      if (!mounted.current || token !== requestToken.current || !pending.current) return;
      pending.current.loaded = true;
      if (current.current.state === 'loading') {
        pending.current = null;
        commit({ selectedId: id, state: 'inserting', error: '' });
        playMechanicalSound('insert', insertDuration);
      }
    }, () => {
      if (!mounted.current || token !== requestToken.current || !pending.current) return;
      // Let an outgoing cassette finish its removal even if the new art fails.
      pending.current.error = LOAD_ERROR;
      if (current.current.state === 'loading') {
        pending.current = null;
        commit({ ...EMPTY, error: LOAD_ERROR });
      }
    });
  }, [commit, insertDuration, reinsert, removeDuration]);

  const eject = useCallback(() => {
    if (!mounted.current || current.current.state !== 'ready' || !current.current.selectedId) return;
    requestToken.current += 1;
    pending.current = null;
    commit({ ...current.current, state: 'ejecting', error: '' });
    playMechanicalSound('eject', ejectDuration);
  }, [commit, ejectDuration]);

  const completeMotion = useCallback((phase: CassetteMotionPhase, cassetteId: string) => {
    if (!mounted.current || current.current.state !== phase || current.current.selectedId !== cassetteId) return;
    if (phase === 'inserting' || phase === 'reinserting') {
      commit({ ...current.current, state: 'ready' });
      return;
    }
    if (phase === 'ejecting') {
      commit({ ...current.current, state: 'ejected' });
      return;
    }

    const next = pending.current;
    if (next?.error) {
      pending.current = null;
      commit({ ...EMPTY, error: next.error });
    } else if (next?.loaded) {
      pending.current = null;
      commit({ selectedId: next.id, state: 'inserting', error: '' });
      playMechanicalSound('insert', insertDuration);
    } else if (next) {
      commit({ ...EMPTY, state: 'loading' });
    } else {
      commit(EMPTY);
    }
  }, [commit, insertDuration]);

  return {
    selectedId: snapshot.selectedId,
    state: snapshot.state,
    busy: isBusy(snapshot.state),
    error: snapshot.error,
    select,
    prepareSelection,
    eject,
    reinsert,
    remove,
    completeMotion,
  };
}
