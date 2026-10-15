import type { TransportPhase } from '../hooks/useTransport';

export const status: Record<TransportPhase, [string, string]> = {
  outside: ['TAPE OUTSIDE', 'Insert the cassette to begin.'],
  inserting: ['INSERTING', 'Sliding into the compartment…'],
  ready: ['TAPE LOADED', 'Press PLAY when you are ready.'],
  engaging: ['HEAD ENGAGED', 'Starting the tape motor…'],
  playing: ['NOW PLAYING', 'Tape moving from left to right.'],
  stopping: ['DISENGAGING', 'Releasing the tape head…'],
  ejecting: ['EJECTING', 'Cassette moving out…'],
};

export const isBusy = (phase: TransportPhase) => ['inserting', 'engaging', 'stopping', 'ejecting'].includes(phase);

export function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '00:00';
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
