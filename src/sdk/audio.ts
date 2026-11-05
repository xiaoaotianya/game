// 合成音效（Web Audio），无需音频素材
import type { DrumKind } from './types';

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

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, vol: number, filter: BiquadFilterType, freq: number, when = 0) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
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
  drum(kind: DrumKind) {
    if (kind === 'big') {
      tone(150, 0.45, 'sine', 0.7, 0, 45);
      noise(0.05, 0.25, 'lowpass', 800);
    } else if (kind === 'snare') {
      tone(240, 0.12, 'triangle', 0.35, 0, 160);
      noise(0.2, 0.4, 'highpass', 1500);
    } else if (kind === 'cymbal') {
      noise(0.9, 0.25, 'highpass', 6000);
      tone(5200, 0.4, 'square', 0.02);
    } else {
      noise(0.08, 0.3, 'bandpass', 5000);
      noise(0.08, 0.2, 'bandpass', 5000, 0.09);
    }
  },
};

export function buzz(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // 不支持震动
  }
}
