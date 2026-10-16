/**
 * Local mechanical foley, synthesized with Web Audio; no downloads or dependencies.
 * Call playMechanicalSound directly inside a pointer/keyboard/click handler so
 * the browser can unlock its lazily created AudioContext. Nothing is autoplayed.
 * Filtered noise, short body resonances, and irregular ratchet contacts give the
 * controls a physical sound without electronic beeps. Sources clean themselves up.
 */
import { CASSETTE_INSERT_DURATION, CASSETTE_EJECT_DURATION } from '../config/cassetteMotion';

export type MechanicalSound = 'press' | 'insert' | 'eject' | 'stop';

type MechanicalAudio = {
  context: AudioContext;
  output: GainNode;
  noise: AudioBuffer;
  body: AudioBuffer;
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audio: MechanicalAudio | undefined;
const QUIET = 0.0001;

function createAudio(): MechanicalAudio | undefined {
  if (typeof window === 'undefined') return undefined;
  if (audio && audio.context.state !== 'closed') return audio;

  const AudioConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioConstructor) return undefined;

  const context = new AudioConstructor();
  const output = context.createGain();
  const limiter = context.createDynamicsCompressor();
  output.gain.value = 0.3;
  limiter.threshold.value = -13;
  limiter.knee.value = 10;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  output.connect(limiter);
  limiter.connect(context.destination);

  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.1), context.sampleRate);
  const noiseData = noise.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) {
    noiseData[index] = Math.random() * 2 - 1;
  }

  // A damped plastic/metal impact: its partials die before becoming a pitched tone.
  const body = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
  const bodyData = body.getChannelData(0);
  for (let index = 0; index < bodyData.length; index += 1) {
    const time = index / context.sampleRate;
    const contact = Math.min(1, time / 0.0006);
    bodyData[index] = contact * (
      Math.sin(time * Math.PI * 2 * 148) * Math.exp(-time * 66) * 0.62
      + Math.sin(time * Math.PI * 2 * 437) * Math.exp(-time * 105) * 0.24
      + Math.sin(time * Math.PI * 2 * 1130) * Math.exp(-time * 190) * 0.1
      + (Math.random() * 2 - 1) * Math.exp(-time * 150) * 0.12
    );
  }

  audio = { context, output, noise, body };
  return audio;
}

function noiseContact(
  system: MechanicalAudio,
  at: number,
  duration: number,
  strength: number,
  frequency: number,
  type: BiquadFilterType = 'bandpass',
  endFrequency = frequency,
): void {
  const { context, noise, output } = system;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noise;
  filter.type = type;
  filter.Q.value = 0.65;
  filter.frequency.setValueAtTime(frequency, at);
  filter.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), at + duration);
  envelope.gain.setValueAtTime(QUIET, at);
  envelope.gain.linearRampToValueAtTime(strength, at + Math.min(0.002, duration * 0.1));
  envelope.gain.exponentialRampToValueAtTime(QUIET, at + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
  };
  source.start(at, Math.random() * Math.max(0, noise.duration - duration - 0.01));
  source.stop(at + duration + 0.005);
}

function bodyContact(system: MechanicalAudio, at: number, strength: number, pitch = 1): void {
  const { context, body, output } = system;
  const source = context.createBufferSource();
  const envelope = context.createGain();
  source.buffer = body;
  source.playbackRate.value = pitch;
  envelope.gain.value = strength;
  source.connect(envelope);
  envelope.connect(output);
  source.onended = () => {
    source.disconnect();
    envelope.disconnect();
  };
  source.start(at);
}

function latch(system: MechanicalAudio, at: number, strength: number, pitch = 1): void {
  noiseContact(system, at, 0.012, strength * 0.74, 3600 * pitch, 'highpass');
  bodyContact(system, at + 0.002, strength * 0.8, pitch);
  noiseContact(system, at + 0.017, 0.024, strength * 0.31, 1700 * pitch);
}

function scheduleSound(system: MechanicalAudio, kind: MechanicalSound): void {
  const at = system.context.currentTime + 0.004;
  const variation = 0.96 + Math.random() * 0.08;

  switch (kind) {
    case 'press':
      noiseContact(system, at, 0.018, 0.27, 1150, 'lowpass');
      latch(system, at + 0.009, 0.62, variation);
      break;
    case 'stop':
      latch(system, at, 0.68, variation * 0.82);
      latch(system, at + 0.041, 0.23, variation * 1.16);
      break;
    case 'insert':
      // The tape slides over its guides, makes irregular tooth contacts, then seats.
      noiseContact(system, at, CASSETTE_INSERT_DURATION * .77, 0.24, 1450, 'bandpass', 650);
      for (let tooth = 0; tooth < 7; tooth += 1) {
        const offset = CASSETTE_INSERT_DURATION * (.08 + tooth * .11) + (tooth % 2) * .008;
        noiseContact(system, at + offset, 0.016, 0.16 + tooth * 0.014, 2400 - tooth * 120);
      }
      bodyContact(system, at + CASSETTE_INSERT_DURATION * .82, 0.48, 0.75);
      latch(system, at + CASSETTE_INSERT_DURATION * .93, 0.72, 0.92);
      latch(system, at + CASSETTE_INSERT_DURATION * .97, 0.18, 1.25);
      break;
    case 'eject':
      // A latch releases first; the spring and guide contacts tail off as it opens.
      latch(system, at, 0.68, variation * 0.91);
      noiseContact(system, at + 0.026, 0.38, 0.25, 3100, 'bandpass', 850);
      for (let tooth = 0; tooth < 6; tooth += 1) {
        const offset = 0.055 + tooth * 0.026 + tooth * tooth * 0.003;
        noiseContact(system, at + offset, 0.018, 0.24 - tooth * 0.025, 2900 - tooth * 220);
      }
      bodyContact(system, at + 0.4, 0.34, 0.8);
      noiseContact(system, at + 0.405, 0.074, 0.15, 1100, 'lowpass');
      noiseContact(system, at + CASSETTE_EJECT_DURATION * .65, .28, .09, 1700, 'bandpass', 650);
      break;
  }
}

export function playMechanicalSound(kind: MechanicalSound): void {
  try {
    const system = createAudio();
    if (!system) return;

    if (system.context.state === 'running') {
      scheduleSound(system, kind);
      return;
    }

    const requestedAt = performance.now();
    // Invoke resume synchronously in the user's gesture; never await it in the UI.
    void system.context.resume().then(() => {
      // Discard a blocked/old request instead of making an unrelated gesture sound.
      if (system.context.state === 'running' && performance.now() - requestedAt < 500) {
        scheduleSound(system, kind);
      }
    }).catch(() => undefined);
  } catch {
    // Unsupported/disabled browser audio should never interfere with the controls.
  }
}
