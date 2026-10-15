/** Tiny synthesized mechanical clicks. Replace with your own recorded WAV files later. */
let context: AudioContext | null = null;
export type ClickType = 'insert' | 'play' | 'stop' | 'eject' | 'select';
export function mechanicalClick(kind: ClickType, enabled: boolean) {
  if (!enabled) return;
  try {
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    context ??= new Ctor();
    const ctx = context;
    void ctx.resume();
    const t = ctx.currentTime;
    const freq: Record<ClickType, number> = { insert: 96, play: 170, stop: 117, eject: 135, select: 190 };
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq[kind], t);
    oscillator.frequency.exponentialRampToValueAtTime(62, t + 0.055);
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.075, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.082);
    oscillator.connect(filter).connect(gain).connect(ctx.destination);
    oscillator.start(t); oscillator.stop(t + 0.086);
    oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
  } catch { /* Sound effects are optional. */ }
}
