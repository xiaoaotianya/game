// 钓鱼：海洋动物在水里来回游，点一下小船就把鱼钩放下去钓上来，读名字放进小桶，满 5 只庆祝。
// 难度 0 = 随便钓；1 = 按名字钓；2 = 按名字钓且游得更快。鱼钩下降 / 上拉时不接受点击。
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, rand, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { iconHtml, pic } from '@/sdk/art';
import './style.css';

const GOAL = 5;
const COUNT = [4, 4, 5];
// 鱼钩各阶段时长（毫秒）
const T_MOVE = 320, T_DOWN = 380, T_HOLD = 220, T_UP = 560, T_FLY = 520;

interface Fish {
  it: PackItem;
  el: HTMLElement;
  body: HTMLElement;
  lane: number;
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  flee: number; // 被点错后加速游走，到这个时间为止
  state: 'swim' | 'hooked' | 'gone';
}

type Phase = 'idle' | 'move' | 'down' | 'hold' | 'up';

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let items: PackItem[];
  let boat: HTMLElement;
  let line: HTMLElement;
  let bucket: HTMLElement;
  let fill: HTMLElement;
  let dots: HTMLElement;
  let fishes: Fish[] = [];
  let got = 0;
  let mistakes = 0;
  let paused = false;
  let gen = 0;
  let target: PackItem | null = null;
  let raf = 0;
  let dead = false;
  let last = 0;
  // 布局（像素，相对舞台）
  let W = 0, H = 0, sky = 0, fs = 80, L0 = 30, laneA = 0, laneB = 0;
  let laneN = 4; // 本轮泳道数，开局定下，中途难度变了也不变
  // 鱼钩状态
  let phase: Phase = 'idle';
  let t0 = 0;
  let boatX = 0, fromX = 0, lineLen = 30, downLen = 0;
  let hooked: Fish | null = null;

  const lvl = () => Math.min(2, sdk.progress.level());
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const laneY = (i: number, n: number) => (n > 1 ? laneA + ((laneB - laneA) * i) / (n - 1) : (laneA + laneB) / 2);

  function layout() {
    W = s.clientWidth;
    H = s.clientHeight;
    const vmin = Math.min(W, H) / 100;
    const land = W > H;
    sky = H * (land ? 0.25 : 0.24);
    L0 = vmin * 5;
    const n = laneN;
    const fs0 = Math.min(130, Math.max(80, vmin * 15));
    const span = H - sky - L0 - fs0 * 1.6;
    fs = Math.max(80, Math.min(fs0, (span / Math.max(1, n - 1)) * 1.15));
    laneA = sky + L0 + fs * 0.75;
    laneB = H - fs * 0.6 - 8;
    s.style.setProperty('--fs', fs + 'px');
    s.style.setProperty('--sky', sky + 'px');
    if (!boatX) boatX = W * 0.45;
    boatX = Math.min(Math.max(boatX, fs / 2), W - fs / 2);
  }

  function setup() {
    gen++;
    got = 0;
    mistakes = 0;
    paused = false;
    phase = 'idle';
    hooked = null;
    target = null;
    lineLen = L0;
    fishes.forEach((f) => f.el.remove());
    fishes = [];
    fill.innerHTML = '';
    [...dots.children].forEach((d) => d.classList.remove('on'));
    laneN = COUNT[lvl()] ?? 4;
    layout();
    const n = laneN;
    // 一开始就在水里各处游，按泳道错开
    for (let i = 0; i < n; i++) spawn(i, W * (0.12 + 0.76 * Math.random()));
    if (lvl() > 0) {
      const g = gen;
      sdk.later(() => g === gen && ask(), 2200);
    }
  }

  /** 放一只新的到第 lane 条泳道；x 不给就从屏幕外游进来 */
  function spawn(lane: number, x?: number) {
    const inWater = new Set(fishes.map((f) => f.it.id));
    const pool = items.filter((it) => !inWater.has(it.id));
    const it = pick(pool.length ? pool : items);
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const el = h('fi-fish');
    const body = h('fi-body emoji', pic(it));
    body.style.setProperty('--d', `-${rand(2000)}ms`); // 错开上下浮动的节奏
    el.appendChild(body);
    const f: Fish = {
      it, el, body, lane, dir,
      x: x ?? (dir > 0 ? -fs : W + fs),
      y: laneY(lane, laneN),
      speed: 0.8 + Math.random() * 0.45,
      flee: 0,
      state: 'swim',
    };
    el.addEventListener('pointerdown', () => tap(f));
    s.appendChild(el);
    fishes.push(f);
    place(f);
  }

  function place(f: Fish) {
    f.el.style.transform = `translate(${f.x - fs / 2}px,${f.y - fs / 2}px)`;
    // 插画和 emoji 都朝左，往右游时翻过来
    f.body.style.transform = f.dir > 0 ? 'scaleX(-1)' : '';
  }

  function ask() {
    if (paused) return;
    const swim = fishes.filter((f) => f.state === 'swim');
    if (!swim.length) return;
    // 尽量换一个和上次不同的目标
    const others = swim.filter((f) => f.it.id !== target?.id);
    target = pick(others.length ? others : swim).it;
    sayTarget();
  }

  function sayTarget() {
    if (!target) return;
    sdk.say({ zh: `钓一只${target.name.zh}`, en: `Catch the ${target.name.en}` });
  }

  function tap(f: Fish) {
    if (paused || phase !== 'idle' || f.state !== 'swim') return;
    if (lvl() > 0) {
      if (!target) return; // 还没说要钓谁
      if (f.it.id !== target.id) {
        if (performance.now() < f.flee) return; // 正在游走的那只连点不重复算
        mistakes++;
        sdk.sfx.boing();
        f.flee = performance.now() + 1500;
        f.body.classList.remove('fi-wag');
        void f.body.offsetWidth;
        f.body.classList.add('fi-wag');
        sayTarget();
        return;
      }
    }
    // 钩住：鱼停下，小船开过去，放线
    f.state = 'hooked';
    f.body.classList.remove('fi-wag', 'fi-glow');
    hooked = f;
    phase = 'move';
    fromX = boatX;
    t0 = performance.now();
    sdk.sfx.pop();
  }

  function caught(f: Fish) {
    const g = gen;
    const it = f.it;
    f.state = 'gone';
    const k = ++got;
    if (k >= GOAL) paused = true; // 最后一只：立刻锁住，防止重复计分
    sdk.say(callOf(it));
    sdk.buzz();
    sdk.sfx.ding(k - 1);
    // 飞进小桶
    const b = bucket.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    const tx = b.left - r.left + b.width / 2 - fs / 2;
    const ty = b.top - r.top + b.height * 0.3 - fs / 2;
    const anim = f.el.animate(
      [{ transform: f.el.style.transform }, { transform: `translate(${tx}px,${ty}px) scale(.35)` }],
      { duration: T_FLY, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      f.el.remove();
      if (dead || g !== gen) return;
      fishes = fishes.filter((x) => x !== f);
      const mini = h('fi-mini emoji', pic(it));
      fill.appendChild(mini);
      dots.children[k - 1]?.classList.add('on');
      sdk.fx.wiggle(bucket);
      if (k >= GOAL) {
        sdk.progress.round({ mistakes });
        sdk.later(() => g === gen && sdk.reward.celebrate(setup), 1200);
        return;
      }
      // 过一会补一只新的，再说下一个目标
      sdk.later(() => g === gen && !paused && spawn(f.lane), 1200);
      if (lvl() > 0) sdk.later(() => g === gen && ask(), 1700);
    };
  }

  function tick(now: number) {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(50, now - (last || now)) / 1000;
    last = now;
    const n = laneN;
    const base = (24 + W * 0.035) * (lvl() >= 2 ? 1.8 : 1);
    for (const f of fishes) {
      if (f.state !== 'swim') continue;
      const v = base * f.speed * (now < f.flee ? 3 : 1);
      f.x += f.dir * v * dt;
      if (f.x < fs / 2 && f.dir < 0) f.dir = 1;
      if (f.x > W - fs / 2 && f.dir > 0) f.dir = -1;
      f.y = laneY(f.lane, n);
      place(f);
    }

    // 鱼钩
    const k = (d: number) => Math.min(1, (now - t0) / d);
    const f = hooked;
    if (phase === 'move' && f) {
      boatX = fromX + (f.x - fromX) * ease(k(T_MOVE));
      if (k(T_MOVE) >= 1) {
        phase = 'down';
        t0 = now;
        downLen = Math.max(L0, f.y - sky - fs * 0.15);
      }
    } else if (phase === 'down' && f) {
      lineLen = L0 + (downLen - L0) * ease(k(T_DOWN));
      if (k(T_DOWN) >= 1) {
        phase = 'hold';
        t0 = now;
        sdk.sfx.pop();
        f.body.classList.add('fi-bite');
      }
    } else if (phase === 'hold' && f) {
      if (k(T_HOLD) >= 1) {
        phase = 'up';
        t0 = now;
      }
    } else if (phase === 'up' && f) {
      lineLen = downLen + (L0 - downLen) * ease(k(T_UP));
      f.x = boatX;
      f.y = sky + lineLen + fs * 0.15;
      place(f);
      if (k(T_UP) >= 1) {
        phase = 'idle';
        hooked = null;
        f.body.classList.remove('fi-bite');
        caught(f);
      }
    }
    boat.style.transform = `translateX(${boatX}px)`;
    line.style.transform = `translateX(${boatX}px)`;
    line.style.height = lineLen + 'px';
  }

  function onResize() {
    layout();
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      // 贝壳不会游，不放进水里
      const all = ctx.pack!.items.filter((it) => it.id !== 'shell');
      items = shuffle(all.length >= 6 ? all : ctx.pack!.items);
      s.classList.add('g-fish');
      s.append(h('fi-sky'), h('fi-sea'));
      const bubbles = h('fi-bubbles');
      for (let i = 0; i < 9; i++) {
        const b = h('fi-bubble');
        b.style.left = `${5 + i * 11 + rand(6)}%`;
        b.style.animationDelay = `-${rand(6000)}ms`;
        b.style.animationDuration = `${5000 + rand(3000)}ms`;
        b.style.setProperty('--bs', `${1 + Math.random() * 1.6}vmin`);
        bubbles.appendChild(b);
      }
      s.appendChild(bubbles);
      line = h('fi-line', '<div class="fi-hook"></div>');
      boat = h('fi-boat', `<div class="fi-boat-in emoji">${iconHtml('items/boat')}</div>`);
      bucket = h('fi-bucket');
      fill = h('fi-fill');
      dots = h('fi-dots');
      for (let i = 0; i < GOAL; i++) dots.appendChild(h('fi-dot'));
      bucket.append(fill, h('fi-pail'), dots);
      s.append(line, boat, bucket);
      addEventListener('resize', onResize);
      setup();
      sdk.say(
        lvl() > 0
          ? { zh: '我们来钓鱼吧', en: "Let's go fishing!" }
          : { zh: '我们来钓鱼吧，点一点水里的小动物', en: "Let's go fishing! Tap an animal in the water" },
      );
      raf = requestAnimationFrame(tick);
    },
    unmount() {
      dead = true;
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
    },
    hint() {
      if (paused || phase !== 'idle') return;
      const swim = fishes.filter((f) => f.state === 'swim');
      const f = (target && swim.find((x) => x.it.id === target!.id)) || pick(swim);
      if (!f) return;
      f.body.classList.remove('fi-glow');
      void f.body.offsetWidth;
      f.body.classList.add('fi-glow');
      if (target) sayTarget();
    },
  };
}
