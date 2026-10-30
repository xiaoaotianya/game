// 公共能力：本地存储、设置、语音、音效、拖拽、特效
'use strict';

const Store = {
  get(k, d) {
    try { const v = localStorage.getItem('pp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('pp_' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式下忽略 */ }
  },
};

const Settings = {
  lang: Store.get('lang', 'both'), // zh | en | both
  limit: Store.get('limit', 0),    // 每日分钟数，0 = 不限
  voice: Store.get('voice', true),
  name: Store.get('name', ''),
  set(k, v) { this[k] = v; Store.set(k, v); },
};

// 界面上显示的文字（双语模式显示中文，语音会读两遍）
function label(t) { return Settings.lang === 'en' ? t.en : t.zh; }

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
function el(cls, html) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (html != null) d.innerHTML = html;
  return d;
}

// ---------- 语音（系统 TTS） ----------
const Speech = {
  voices: {},
  ok: 'speechSynthesis' in window,
  init() {
    if (!this.ok) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices();
      const by = (re) => vs.find((v) => re.test(v.lang.replace('_', '-')));
      this.voices.zh = by(/^zh-CN/i) || by(/^zh/i);
      this.voices.en = by(/^en-US/i) || by(/^en/i);
    };
    choose();
    speechSynthesis.onvoiceschanged = choose;
  },
  // text: 字符串 或 {zh, en}
  say(text) {
    if (!this.ok || !Settings.voice) return;
    speechSynthesis.cancel();
    const t = typeof text === 'string' ? { zh: text, en: text } : text;
    const langs = Settings.lang === 'both' ? ['zh', 'en'] : [Settings.lang];
    for (const l of langs) {
      if (!t[l]) continue;
      const u = new SpeechSynthesisUtterance(t[l]);
      u.lang = l === 'zh' ? 'zh-CN' : 'en-US';
      if (this.voices[l]) u.voice = this.voices[l];
      u.rate = l === 'zh' ? 0.95 : 0.9;
      u.pitch = 1.25;
      speechSynthesis.speak(u);
    }
  },
  stop() { if (this.ok) speechSynthesis.cancel(); },
};

// ---------- 音效（Web Audio 合成，无需素材） ----------
const Sound = {
  ctx: null,
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) this.ctx = new C();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur = 0.2, type = 'sine', vol = 0.3, when = 0, slideTo = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  },
  pop() { this.tone(500, 0.12, 'sine', 0.35, 0, 1400); },
  ding(step = 0) {
    const f = 660 * Math.pow(2, step / 12);
    this.tone(f, 0.18, 'triangle', 0.3);
    this.tone(f * 1.5, 0.3, 'triangle', 0.22, 0.09);
  },
  boing() { this.tone(320, 0.3, 'sine', 0.25, 0, 160); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.22, i * 0.11)); },
  note(freq) {
    this.tone(freq, 0.7, 'triangle', 0.35);
    this.tone(freq * 2, 0.35, 'sine', 0.08);
  },
};

const buzz = (ms = 15) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* 不支持就算了 */ } };

// ---------- 特效 ----------
const fxLayer = () => document.getElementById('fx');

// 在 (x, y) 处炸开一圈小 emoji
function burst(x, y, emojis = ['⭐', '✨', '💖'], count = 8) {
  const layer = fxLayer();
  for (let i = 0; i < count; i++) {
    const p = el('particle emoji', pick(emojis));
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    layer.appendChild(p);
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 60 + Math.random() * 90;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1)`, opacity: 0 },
    ], { duration: 750 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}

function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function wiggle(node) {
  node.classList.remove('wiggle');
  void node.offsetWidth;
  node.classList.add('wiggle');
  setTimeout(() => node.classList.remove('wiggle'), 600);
}

// 把元素移到新父节点里，并用 FLIP 动画从原位置飞过去
function flyTo(node, dest, cls, done) {
  const a = node.getBoundingClientRect();
  dest.appendChild(node);
  if (cls) node.classList.add(cls);
  node.style.transition = 'none';
  node.style.transform = '';
  const b = node.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const s = b.width ? a.width / b.width : 1;
  node.style.transform = `translate(${dx}px,${dy}px) scale(${s})`;
  void node.offsetWidth;
  node.style.transition = 'transform .4s cubic-bezier(.3,1.4,.5,1)';
  node.style.transform = '';
  setTimeout(() => done && done(), 420);
}

// ---------- 拖拽 ----------
// o: { targets(): Element[], accept(t): bool, onDrop(t), onMiss(t|undefined), onTap() }
function draggable(node, o) {
  let id = null, sx = 0, sy = 0, moved = false;
  node.addEventListener('pointerdown', (e) => {
    if (id !== null || node.dataset.locked) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
    try { node.setPointerCapture(id); } catch (err) { /* 忽略 */ }
    node.style.transition = 'none';
    node.classList.add('dragging');
  });
  node.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 10) moved = true;
    node.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    node.classList.remove('dragging');
    if (!moved) {
      node.style.transform = '';
      if (o.onTap) o.onTap();
      return;
    }
    // 小手不准：目标区域四周放宽 30%，取最近的那个
    const c = centerOf(node);
    let best = null, bestD = Infinity;
    for (const t of o.targets()) {
      const r = t.getBoundingClientRect();
      const px = r.width * 0.3, py = r.height * 0.3;
      if (c.x > r.left - px && c.x < r.right + px && c.y > r.top - py && c.y < r.bottom + py) {
        const tc = centerOf(t);
        const d = Math.hypot(tc.x - c.x, tc.y - c.y);
        if (d < bestD) { bestD = d; best = t; }
      }
    }
    if (best && o.accept(best)) {
      o.onDrop(best);
    } else {
      node.style.transition = 'transform .35s cubic-bezier(.3,1.3,.5,1)';
      node.style.transform = '';
      if (o.onMiss) o.onMiss(best || undefined);
    }
  };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
}

const PRAISE = [
  { zh: '太棒了！', en: 'Great job!' },
  { zh: '真厉害！', en: 'Awesome!' },
  { zh: '好聪明呀！', en: 'So smart!' },
  { zh: '你做到啦！', en: 'You did it!' },
];

function praise() {
  const p = pick(PRAISE);
  const n = Settings.name;
  if (!n) return p;
  // 英文语音读不了中文名，含中文时英文部分不带名字
  const enName = /[一-龥]/.test(n) ? '' : ', ' + n;
  return { zh: n + p.zh, en: p.en.replace('!', enName + '!') };
}
