// 合成音效（Web Audio），无需音频素材

let ctx: AudioContext | null = null;

export function unlockAudio() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (C) ctx = new C();
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, dur = 0.2, type: OscillatorType = 'sine', vol = 0.3, when = 0, slideTo = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  pop: () => tone(500, 0.12, 'sine', 0.35, 0, 1400),
  ding(step = 0) {
    const f = 660 * Math.pow(2, step / 12);
    tone(f, 0.18, 'triangle', 0.3);
    tone(f * 1.5, 0.3, 'triangle', 0.22, 0.09);
  },
  boing: () => tone(320, 0.3, 'sine', 0.25, 0, 160),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, i * 0.11)),
  note(freq: number) {
    tone(freq, 0.7, 'triangle', 0.35);
    tone(freq * 2, 0.35, 'sine', 0.08);
  },
};

export function buzz(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // 不支持震动
  }
}
