// 叠高高：积木在上方左右摆动，点屏幕任意处落下；和下面那块偏得不多就叠上，偏太多整座塔哗啦倒了重来。
// 叠到 5 层庆祝。难度 0/1/2 = 摆动周期 3.2s / 2.4s / 1.8s。
import type { ModuleImpl, SDK } from '@/sdk';
import { h, rand } from '@/sdk/dom';
import { countOf } from '@/content/phrases';
import './style.css';

const GOAL = 5;
const PERIOD = [3200, 2400, 1800];
const TOL = 0.55; // 水平偏移容差：积木宽度的 55%
const COLORS = ['#ff8787', '#ffd43b', '#69db7c', '#74c0fc', '#b197fc', '#ffa94d'];
const DECO = ['A', '★', 'B', '★', 'C', '★', 'D', '★', 'E'];

interface Block {
  el: HTMLElement;
  off: number; // 相对屏幕中线的偏移，以积木宽度为单位（缩放屏幕时保持位置）
}

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let world: HTMLElement;
  let ground: HTMLElement;
  let arrow: HTMLElement;
  let swing: HTMLElement | null = null;
  let tower: Block[] = [];
  let busy = false;
  let mistakes = 0;
  let made = 0; // 一共做过几块，用来轮换颜色和图案
  let gen = 0;
  let raf = 0;
  let dead = false;
  let phase0 = 0; // 摆动起始时间
  let hintUntil = 0;
  // 布局（像素）
  let W = 0, H = 0, B = 100, BH = 80, groundTop = 0, swingY = 0, cam = 0;

  const lvl = () => Math.min(2, sdk.progress.level());

  function layout() {
    W = s.clientWidth;
    H = s.clientHeight;
    const land = W > H;
    B = Math.max(84, land ? Math.min(W * 0.15, H * 0.19) : Math.min(W * 0.26, H * 0.15));
    BH = B * 0.8;
    const vmin = Math.min(W, H) / 100;
    groundTop = H - Math.max(H * 0.1, 10 * vmin);
    const hb = Math.min(84, Math.max(52, 11 * vmin));
    swingY = hb + 4 * vmin;
    s.style.setProperty('--b', B + 'px');
    s.style.setProperty('--bh', BH + 'px');
    ground.style.top = groundTop + 'px';
    tower.forEach((b, i) => put(b.el, xOf(b.off), topOf(i)));
    updateCam(false);
  }

  const xOf = (off: number) => W / 2 + off * B;
  /** 第 i 层（0 起）积木顶边在世界坐标里的 y */
  const topOf = (i: number) => groundTop - (i + 1) * BH;
  /** 摆动幅度：不出屏幕 */
  const amp = () => Math.min((W - B) / 2 - 12, B * 2.4);

  function put(el: HTMLElement, x: number, y: number) {
    el.style.transform = `translate(${x - B / 2}px,${y}px)`;
  }

  /** 塔顶太靠近摆动的积木时，整个世界往下移（相机跟随） */
  function updateCam(anim = true) {
    const need = swingY + BH + BH * 1.4; // 下一块落点的顶边至少在这里
    cam = Math.max(0, need - topOf(tower.length));
    world.style.transition = anim ? 'transform .6s cubic-bezier(.3,1,.5,1)' : 'none';
    world.style.transform = `translateY(${cam}px)`;
  }

  function newBlock(): HTMLElement {
    const k = made++;
    const el = h('st-block', `<div class="st-face"><span>${DECO[k % DECO.length]}</span></div>`);
    el.style.setProperty('--c', COLORS[k % COLORS.length]);
    return el;
  }

  function spawnSwing() {
    swing = newBlock();
    swing.classList.add('st-swing', 'st-in');
    s.appendChild(swing);
    phase0 = performance.now() - rand(800);
    put(swing, swingX(performance.now()), swingY);
    busy = false;
  }

  function swingX(now: number) {
    const T = PERIOD[lvl()] ?? 3200;
    return W / 2 + amp() * Math.sin(((now - phase0) / T) * Math.PI * 2);
  }

  function next() {
    gen++;
    mistakes = 0;
    reset();
    sdk.say({ zh: '点一下，积木掉下来，叠高高', en: 'Tap to drop the block. Stack it up!' });
  }

  function reset() {
    tower.forEach((b) => b.el.remove());
    tower = [];
    swing?.remove();
    swing = null;
    updateCam(false);
    spawnSwing();
  }

  function drop() {
    if (busy || !swing) return;
    busy = true;
    const g = gen;
    const el = swing;
    swing = null;
    el.classList.remove('st-swing', 'st-in', 'st-glow');
    arrow.classList.remove('on');
    hintUntil = 0;
    const now = performance.now();
    const x = swingX(now);
    const n = tower.length;
    const below = tower[n - 1];
    const ok = !below || Math.abs(x - xOf(below.off)) <= B * TOL;
    // 落点：屏幕坐标 = 世界坐标 + cam
    const yEnd = topOf(n) + cam;
    const dist = Math.max(10, yEnd - swingY);
    const dur = Math.min(700, 180 + Math.sqrt(dist) * 16);
    put(el, x, swingY);
    sdk.sfx.pop();
    const a = el.animate(
      [{ transform: `translate(${x - B / 2}px,${swingY}px)` }, { transform: `translate(${x - B / 2}px,${yEnd}px)` }],
      { duration: dur, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' },
    );
    a.onfinish = () => {
      if (dead || g !== gen) return;
      // 移进世界层，按世界坐标摆好
      a.cancel();
      world.appendChild(el);
      const b: Block = { el, off: (x - W / 2) / B };
      put(el, x, topOf(n));
      tower.push(b);
      if (ok) land(b);
      else topple();
    };
  }

  function land(b: Block) {
    const g = gen;
    const n = tower.length;
    b.el.classList.add('st-land');
    sdk.sfx.ding(n * 2);
    sdk.buzz();
    sdk.say(countOf(n));
    const c = sdk.fx.centerOf(b.el);
    sdk.fx.burst(c.x, c.y, ['⭐', '✨'], 6);
    if (n >= GOAL) {
      sdk.progress.round({ mistakes });
      sdk.later(() => g === gen && sdk.reward.celebrate(next), 1200);
      return; // busy 保持 true，直到下一轮
    }
    updateCam();
    // 等相机移动完再出下一块，落点才准
    sdk.later(() => g === gen && spawnSwing(), 650);
  }

  function topple() {
    const g = gen;
    mistakes++;
    sdk.sfx.boing();
    sdk.later(() => g === gen && sdk.sfx.boing(), 180);
    sdk.buzz(30);
    sdk.later(() => g === gen && sdk.say({ zh: '哗啦，倒啦，再来一次', en: 'Crash! It fell down. Try again!' }), 200);
    // 每块随机旋转飞散
    tower.forEach((b, i) => {
      const dx = (Math.random() - 0.5) * W * 0.9 + (b.off >= 0 ? 1 : -1) * B;
      const dy = H * 0.4 + Math.random() * H * 0.3;
      const rot = (Math.random() - 0.5) * 720;
      const start = b.el.style.transform;
      b.el.animate(
        [
          { transform: `${start} translate(0px,0px) rotate(0deg)`, opacity: 1 },
          { transform: `${start} translate(${dx * 0.3}px,${-BH * 0.8}px) rotate(${rot * 0.3}deg)`, opacity: 1, offset: 0.3 },
          { transform: `${start} translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: 1000 + i * 60, easing: 'cubic-bezier(.3,0,.7,1)', fill: 'forwards' },
      );
    });
    sdk.later(() => g === gen && reset(), 1500);
  }

  function tick(now: number) {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    if (!swing) return;
    const x = swingX(now);
    put(swing, x, swingY);
    // 提示：摆到塔顶正上方时发光
    if (now < hintUntil) {
      const top = tower[tower.length - 1];
      const near = !top || Math.abs(x - xOf(top.off)) < B * 0.25;
      swing.classList.toggle('st-glow', near);
    }
  }

  function onResize() {
    layout();
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-stack');
      world = h('st-world');
      ground = h('st-ground');
      arrow = h('st-arrow emoji', '👇');
      world.append(ground, arrow);
      s.appendChild(world);
      s.addEventListener('pointerdown', drop);
      addEventListener('resize', onResize);
      layout();
      next();
      raf = requestAnimationFrame(tick);
    },
    unmount() {
      dead = true;
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
    },
    hint() {
      if (busy || !swing) return;
      hintUntil = performance.now() + 4000;
      // 塔顶出现一个往下指的手指
      const top = tower[tower.length - 1];
      const x = top ? xOf(top.off) : W / 2;
      arrow.style.transform = `translate(${x}px,${topOf(tower.length) + BH * 0.15}px)`;
      arrow.classList.remove('on');
      void arrow.offsetWidth;
      arrow.classList.add('on');
      const g = gen;
      sdk.later(() => {
        if (g !== gen) return;
        arrow.classList.remove('on');
        swing?.classList.remove('st-glow');
      }, 4000);
    },
  };
}
