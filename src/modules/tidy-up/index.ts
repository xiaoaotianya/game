// 收玩具：玩具散在地板上，拖进玩具箱，箱盖「啪」一声；全部收完房间变亮 → 庆祝。
// 难度 0/1/2 = 3/4/6 件。拖到别处只是弹回，不算错。
import type { ModuleImpl, SDK, Text } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import './style.css';

interface Toy { id: string; name: Text }

const TOYS: Toy[] = [
  { id: 'ball', name: { zh: '皮球', en: 'ball' } },
  { id: 'teddy', name: { zh: '小熊', en: 'teddy bear' } },
  { id: 'blocks', name: { zh: '积木', en: 'blocks' } },
  { id: 'car', name: { zh: '小汽车', en: 'car' } },
  { id: 'duck', name: { zh: '小鸭子', en: 'duck' } },
  { id: 'train', name: { zh: '小火车', en: 'train' } },
  { id: 'book', name: { zh: '图书', en: 'book' } },
];
const COUNT = [3, 4, 6];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let room: HTMLElement;
  let box: HTMLElement;
  let ro: ResizeObserver | null = null;
  let lastW = 0, lastH = 0;
  let done = false;

  /** 在地板上给剩下的玩具随机找位置：不压箱子、不出屏、彼此尽量不重叠 */
  function scatter() {
    const toys = [...room.querySelectorAll<HTMLElement>('.td-toy:not([data-locked]):not(.dragging)')];
    if (!toys.length) return;
    const rr = room.getBoundingClientRect();
    const W = rr.width, H = rr.height;
    if (!W || !H) return;
    lastW = W;
    lastH = H;
    const T = toys[0].offsetWidth;
    const br = box.getBoundingClientRect();
    const bx0 = br.left - rr.left - T * 0.25, bx1 = br.right - rr.left + T * 0.25;
    const by0 = br.top - rr.top - T * 0.35;
    const pad = Math.max(8, W * 0.03);
    const top = H * 0.3; // 墙和地板的分界
    const xMax = W - T - pad, yMax = H - T - pad;
    const placed: { x: number; y: number }[] = [];
    for (const t of toys) {
      let best = { x: pad, y: top }, bestD = -1;
      for (let i = 0; i < 160; i++) {
        const x = pad + Math.random() * Math.max(0, xMax - pad);
        const y = top + Math.random() * Math.max(0, yMax - top);
        // 与箱子重叠的位置直接放弃
        if (x + T > bx0 && x < bx1 && y + T > by0) continue;
        const d = placed.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.y - y)), Infinity);
        if (d > T * 1.15) { best = { x, y }; bestD = d; break; }
        if (d > bestD) { best = { x, y }; bestD = d; }
      }
      placed.push(best);
      t.style.left = best.x + 'px';
      t.style.top = best.y + 'px';
    }
  }

  function clampToy(t: HTMLElement) {
    if (t.dataset.locked) return;
    const W = room.clientWidth, H = room.clientHeight, T = t.offsetWidth;
    const pad = Math.max(8, W * 0.03);
    const x = parseFloat(t.style.left) || 0, y = parseFloat(t.style.top) || 0;
    const nx = Math.min(Math.max(x, pad), W - T - pad), ny = Math.min(Math.max(y, H * 0.3), H - T - pad);
    if (nx !== x || ny !== y) {
      t.style.left = nx + 'px';
      t.style.top = ny + 'px';
    }
  }

  function next() {
    done = false;
    const n = COUNT[sdk.progress.level()] ?? 3;
    const picks = shuffle(TOYS).slice(0, n);
    let left = n;
    s.innerHTML = '';
    s.classList.remove('td-clean');

    room = h('td-room', '<div class="td-wall"><div class="td-window"></div></div><div class="td-floor"></div>');
    box = h('td-box', '<div class="td-in"></div><div class="td-lid"></div><div class="td-body"><span class="td-heart"></span></div>');
    room.appendChild(box);
    const hold = box.querySelector('.td-in')!;
    const lid = box.querySelector<HTMLElement>('.td-lid')!;

    picks.forEach((it) => {
      const t = h('tile td-toy', `<span class="td-rot">${iconHtml('items/' + it.id)}</span>`);
      t.dataset.id = it.id;
      (t.firstElementChild as HTMLElement).style.rotate = `${Math.round(Math.random() * 40 - 20)}deg`;
      room.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [box],
        accept: () => true,
        onTap: () => sdk.say(it.name),
        // 拖着的时候转了屏，弹回的旧坐标可能在屏幕外：拉回地板上
        onMiss: () => sdk.later(() => clampToy(t), 60),
        onDrop: () => {
          t.dataset.locked = '1';
          sdk.input.flyTo(t, hold, 'td-drop');
          sdk.later(() => {
            sdk.sfx.drum('snare');
            lid.classList.remove('td-snap');
            void lid.offsetWidth;
            lid.classList.add('td-snap');
          }, 420);
          sdk.later(() => t.remove(), 900);
          sdk.sfx.ding(n - left);
          sdk.buzz();
          sdk.say(it.name);
          if (--left === 0) finish(lid);
        },
      });
    });
    s.appendChild(room);
    scatter();
  }

  function finish(lid: HTMLElement) {
    done = true;
    sdk.progress.round({ mistakes: 0 });
    sdk.later(() => {
      lid.classList.add('td-shut');
      s.classList.add('td-clean');
      sdk.sfx.win();
      // 读完再庆祝
      sdk.say({ zh: '房间好干净呀', en: 'The room is so clean!' }, () => sdk.reward.celebrate(next));
      const r = room.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        sdk.later(() => sdk.fx.burst(
          r.left + r.width * (0.15 + Math.random() * 0.7),
          r.top + r.height * (0.4 + Math.random() * 0.5),
          ['✨', '⭐', '🌟'], 6,
        ), i * 220);
      }
    }, 900);
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-tidy');
      sdk.say({ zh: '玩具都乱啦，把它们放进玩具箱吧', en: 'Put the toys in the toy box' });
      next();
      // 横竖屏切换时重新摆放还在地上的玩具，免得压到箱子或跑出屏幕
      ro = new ResizeObserver(() => {
        const r = room.getBoundingClientRect();
        if (Math.abs(r.width - lastW) > 20 || Math.abs(r.height - lastH) > 20) scatter();
      });
      ro.observe(s);
    },
    unmount() {
      ro?.disconnect();
      ro = null;
    },
    hint() {
      if (done) return;
      const toys = [...room.querySelectorAll<HTMLElement>('.td-toy:not([data-locked])')];
      if (!toys.length) return;
      const bc = sdk.fx.centerOf(box);
      const dist = (t: HTMLElement) => {
        const c = sdk.fx.centerOf(t);
        return Math.hypot(c.x - bc.x, c.y - bc.y);
      };
      const t = toys.reduce((a, b) => (dist(b) < dist(a) ? b : a));
      sdk.fx.wiggle(t);
      const body = box.querySelector('.td-body')!;
      body.classList.add('glow');
      sdk.later(() => body.classList.remove('glow'), 1800);
    },
  };
}
