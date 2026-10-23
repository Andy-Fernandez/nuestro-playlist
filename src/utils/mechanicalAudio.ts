/**
 * Original, local foley: damped plastic impacts, a spring latch, and guide friction.
 * The waveforms are cached before interaction; playback needs only a source/gain
 * pair per contact, with no downloads, decoding, or compressor look-ahead delay.
 */
import {
  CASSETTE_INSERT_DURATION,
  CASSETTE_EJECT_DURATION,
  CASSETTE_REINSERT_DURATION,
  CASSETTE_REMOVE_DURATION,
  CASSETTE_MOTION_CUES,
} from '../config/cassetteMotion';

export type MechanicalSound = 'press' | 'play' | 'insert' | 'eject' | 'reinsert' | 'remove' | 'stop';
type ButtonSound = 'press' | 'play' | 'stop';
type Voice = { source: AudioBufferSourceNode; gain: GainNode };
type MechanicalAudio = {
  context: AudioContext;
  output: GainNode;
  buttons: Record<ButtonSound, AudioBuffer[]>;
  tick: AudioBuffer;
  slide: AudioBuffer;
  guide: AudioBuffer;
  spring: AudioBuffer;
  voices: Set<Voice>;
  motionVoices: Set<Voice>;
};
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audio: MechanicalAudio | undefined;

/** Seeded noise gives each cached take different contact detail. */
function randomSource(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000 * 2 - 1;
  };
}

function addImpact(
  data: Float32Array,
  sampleRate: number,
  offset: number,
  strength: number,
  hardness: number,
  seed: number,
): void {
  const random = randomSource(seed);
  const start = Math.round(offset * sampleRate);
  const length = Math.min(data.length - start, Math.ceil(sampleRate * .09));
  // Broad, quickly damped modes prevent the hollow electronic "beep" of a sine.
  const modes = [
    [185, .012, .34], [530, .009, .22], [1370, .006, .15], [2810, .003, .07],
  ].map(([frequency, decay, level]) => {
    const angle = 2 * Math.PI * frequency * (0.9 + hardness * .18) / sampleRate;
    const damping = Math.exp(-1 / (sampleRate * decay));
    return { previous: 0, current: Math.sin(angle) * level, a: 2 * damping * Math.cos(angle), b: damping * damping };
  });
  let low = 0;
  let previousNoise = 0;
  let snap = 1;
  let body = 1;
  const snapDecay = Math.exp(-1 / (sampleRate * .0015));
  const bodyDecay = Math.exp(-1 / (sampleRate * .012));
  for (let index = 0; index < length; index += 1) {
    const noise = random();
    low += .13 * (noise - low);
    const edge = noise - previousNoise;
    previousNoise = noise;
    let resonance = 0;
    for (const mode of modes) {
      resonance += mode.current;
      const next = mode.a * mode.current - mode.b * mode.previous;
      mode.previous = mode.current;
      mode.current = next;
    }
    const attack = Math.min(1, index / (sampleRate * .00025));
    data[start + index] += strength * attack * (
      edge * snap * (.15 + hardness * .18) + low * body * .95 + resonance
    );
    snap *= snapDecay;
    body *= bodyDecay;
  }
}

function finishBuffer(context: AudioContext, data: Float32Array): AudioBuffer {
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  // Retain the relative weight of small contacts; only attenuate excessive peaks.
  const scale = peak > .85 ? .85 / peak : 1;
  const buffer = context.createBuffer(1, data.length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) channel[index] = data[index] * scale;
  return buffer;
}

function buttonBuffer(context: AudioContext, kind: ButtonSound, take: number): AudioBuffer {
  const data = new Float32Array(Math.ceil(context.sampleRate * .14));
  const seed = 101 + take * 7919;
  const shift = take * .0015;
  if (kind === 'press') {
    addImpact(data, context.sampleRate, 0, .32, .4, seed);
    addImpact(data, context.sampleRate, .006 + shift, .83, .95, seed + 1);
    addImpact(data, context.sampleRate, .022 + shift, .18, .7, seed + 2);
  } else if (kind === 'play') {
    addImpact(data, context.sampleRate, 0, .48, .5, seed + 3);
    addImpact(data, context.sampleRate, .011 + shift, 1.05, .72, seed + 4);
    addImpact(data, context.sampleRate, .033 + shift, .26, .9, seed + 5);
  } else {
    addImpact(data, context.sampleRate, 0, .94, .65, seed + 6);
    addImpact(data, context.sampleRate, .024 + shift, .58, .85, seed + 7);
    addImpact(data, context.sampleRate, .047 + shift, .15, .5, seed + 8);
  }
  return finishBuffer(context, data);
}

function frictionBuffer(context: AudioContext, spring: boolean, textureDuration?: number): AudioBuffer {
  // Generate enough texture at its natural pitch for the designed travel time.
  // Longer motion should not turn a short spring or slide into slowed-down audio.
  const duration = textureDuration ?? (spring
    ? CASSETTE_EJECT_DURATION * CASSETTE_MOTION_CUES.ejectRelease
    : CASSETTE_INSERT_DURATION * CASSETTE_MOTION_CUES.insertSeat);
  const data = new Float32Array(Math.ceil(context.sampleRate * duration));
  const random = randomSource(spring ? 1207 : 8129);
  let low = 0;
  let slow = 0;
  let grain = 0;
  for (let index = 0; index < data.length; index += 1) {
    const progress = index / data.length;
    const noise = random();
    low += (spring ? .33 - progress * .19 : .17) * (noise - low);
    slow += .035 * (noise - slow);
    // Irregular grain sounds like guides and a relaxing spring, not white hiss.
    if (index % Math.round(context.sampleRate * .0037) === 0) grain = .4 + Math.abs(random()) * .6;
    const fade = Math.min(1, progress * 40, (1 - progress) * 15);
    const envelope = spring ? Math.pow(1 - progress, 1.8) : Math.sin(Math.PI * progress) ** .65;
    data[index] = (low - slow) * grain * envelope * fade * (spring ? .9 : .6);
  }
  return finishBuffer(context, data);
}

function createAudio(): MechanicalAudio | undefined {
  if (typeof window === 'undefined') return undefined;
  if (audio && audio.context.state !== 'closed') return audio;
  const AudioConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioConstructor) return undefined;

  const context = new AudioConstructor({ latencyHint: 'interactive' });
  const output = context.createGain();
  output.gain.value = .46;
  output.connect(context.destination);
  const tickData = new Float32Array(Math.ceil(context.sampleRate * .06));
  addImpact(tickData, context.sampleRate, 0, .45, .9, 709);
  audio = {
    context,
    output,
    buttons: {
      press: [0, 1, 2].map(take => buttonBuffer(context, 'press', take)),
      play: [0, 1, 2].map(take => buttonBuffer(context, 'play', take)),
      stop: [0, 1, 2].map(take => buttonBuffer(context, 'stop', take)),
    },
    tick: finishBuffer(context, tickData),
    slide: frictionBuffer(context, false),
    guide: frictionBuffer(context, false, Math.max(
      CASSETTE_REINSERT_DURATION * CASSETTE_MOTION_CUES.reinsertSeat,
      CASSETTE_REMOVE_DURATION * CASSETTE_MOTION_CUES.removeClear,
    )),
    spring: frictionBuffer(context, true),
    voices: new Set(),
    motionVoices: new Set(),
  };
  return audio;
}

/** Warm the cache on hover/focus; only pass true from a pointer/key gesture. */
export function prepareMechanicalAudio(unlock = false): void {
  try {
    const system = createAudio();
    if (unlock && system && system.context.state !== 'running') {
      void system.context.resume().catch(() => undefined);
    }
  } catch {
    // Audio availability must never hold up a control or navigation.
  }
}

function contact(
  system: MechanicalAudio,
  buffer: AudioBuffer,
  at: number,
  strength: number,
  rate = 1,
  duration = buffer.duration / rate,
  motion = false,
): void {
  if (duration <= 0) return;
  const source = system.context.createBufferSource();
  const gain = system.context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const end = at + Math.min(duration, buffer.duration / rate);
  gain.gain.setValueAtTime(strength, at);
  gain.gain.setValueAtTime(strength, Math.max(at, end - .006));
  gain.gain.linearRampToValueAtTime(0, end);
  source.connect(gain);
  gain.connect(system.output);
  const voice = { source, gain };
  system.voices.add(voice);
  if (motion) system.motionVoices.add(voice);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
    system.voices.delete(voice);
    system.motionVoices.delete(voice);
  };
  // Bound repeated clicks without a compressor's look-ahead latency.
  if (system.voices.size > 18) {
    const oldest = system.voices.values().next().value;
    if (oldest) oldest.source.stop();
  }
  source.start(at);
  source.stop(end);
}

function scheduleSound(system: MechanicalAudio, kind: MechanicalSound, motionDuration?: number): void {
  const at = system.context.currentTime;
  const variation = .975 + Math.random() * .05;
  const take = Math.floor(Math.random() * 3);
  if (kind === 'press' || kind === 'play' || kind === 'stop') {
    contact(system, system.buttons[kind][take], at, .94 + Math.random() * .06, variation);
    return;
  }

  for (const { source, gain } of system.motionVoices) {
    gain.gain.cancelScheduledValues(at);
    gain.gain.setTargetAtTime(0, at, .002);
    source.stop(at + .008);
  }
  system.motionVoices.clear();
  const fallback = {
    insert: CASSETTE_INSERT_DURATION,
    eject: CASSETTE_EJECT_DURATION,
    reinsert: CASSETTE_REINSERT_DURATION,
    remove: CASSETTE_REMOVE_DURATION,
  }[kind];
  const duration = Number.isFinite(motionDuration) ? Math.max(.02, motionDuration!) : fallback;
  const clip = (buffer: AudioBuffer, position: number, strength: number, rate = variation) => {
    contact(system, buffer, at + duration * position, strength, rate, duration * (1 - position), true);
  };
  // A reduced-motion transition needs one small contact, without a trailing slide.
  if (duration <= .12) {
    if (kind === 'remove') clip(system.tick, 0, .2);
    else clip(system.buttons[kind === 'eject' ? 'stop' : 'play'][take], 0, .7);
    return;
  }
  if (kind === 'insert') {
    contact(system, system.slide, at, .72, variation, duration * CASSETTE_MOTION_CUES.insertSeat, true);
    [.12, .32, CASSETTE_MOTION_CUES.insertAlign, .76].forEach((position, index) => clip(system.tick, position, .22 + index * .07, 1.12 - index * .07));
    clip(system.buttons.play[take], CASSETTE_MOTION_CUES.insertSeat, .9, .96);
  } else if (kind === 'reinsert') {
    contact(system, system.guide, at, .48, variation, duration * CASSETTE_MOTION_CUES.reinsertSeat, true);
    clip(system.tick, CASSETTE_MOTION_CUES.reinsertAlign, .23, 1.02);
    clip(system.buttons.play[take], CASSETTE_MOTION_CUES.reinsertSeat, .82, .98);
  } else if (kind === 'remove') {
    // The latch is already open. Lifting the tape out has only soft guide drag.
    contact(system, system.guide, at + duration * .02, .3, variation, duration * CASSETTE_MOTION_CUES.removeClear, true);
  } else {
    clip(system.buttons.stop[take], 0, .85);
    contact(system, system.spring, at + duration * .02, .68, variation, duration * CASSETTE_MOTION_CUES.ejectRelease, true);
    clip(system.tick, CASSETTE_MOTION_CUES.ejectRelease, .22, 1.02);
    clip(system.tick, CASSETTE_MOTION_CUES.ejectLift, .1, .98);
  }
}

/** Call directly in the gesture; a suspended context never delays the UI. */
export function playMechanicalSound(kind: MechanicalSound, motionDuration?: number): void {
  try {
    const system = createAudio();
    if (!system) return;
    if (system.context.state === 'running') {
      scheduleSound(system, kind, motionDuration);
      return;
    }
    const requestedAt = performance.now();
    void system.context.resume().then(() => {
      // Do not play a stale click after a blocked resume or a backgrounded tab.
      if (system.context.state === 'running' && performance.now() - requestedAt < 150) {
        scheduleSound(system, kind, motionDuration);
      }
    }).catch(() => undefined);
  } catch {
    // Unsupported/disabled browser audio should never interfere with the controls.
  }
}
