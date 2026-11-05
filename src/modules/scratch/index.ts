// 刮刮乐：手指刮开彩色涂层，看看下面藏着谁。刮开约一半自动揭晓，每 5 张庆祝一次。
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

const COATS = [
  ['#b197fc', '#74c0fc'],
  ['#ff8fab', '#ffd43b'],
  ['#63e6be', '#4dabf7'],
  ['#ffa94d', '#f783ac'],
];
const DONE_RATIO = 0.55;
const PER_ROUND = 5;

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let queue: PackItem[] = [];
  let items: PackItem[];
  let last = '';
  let shown = 0;
  let cleanup: (() => void) | null = null;
  type H = (e: PointerEvent) => void;
  let pointer: { down: H; move: H; up: H } | null = null;

  function nextItem(): PackItem {
    if (!queue.length) queue = shuffle(items);
    let it = queue.pop()!;
    if (it.id === last && items.length > 1) {
      queue.unshift(it);
      it = queue.pop()!;
    }
    last = it.id;
    return it;
  }

  function next() {
    cleanup?.();
    const it = nextItem();
    s.innerHTML = '';
    const card = h('sc-card', `<div class="sc-pic emoji">${pic(it)}</div>`);
    const cv = document.createElement('canvas');
    cv.className = 'sc-coat';
    card.appendChild(cv);
    s.appendChild(card);

    const g = cv.getContext('2d', { willReadFrequently: true })!;
    const coat = pick(COATS);
    let revealed = false;
    let dpr = 1;
    let brush = 30;

    const paint = () => {
      const r = card.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      brush = Math.max(18, r.width * 0.09) * dpr;
      g.globalCompositeOperation = 'source-over';
      const grad = g.createLinearGradient(0, 0, cv.width, cv.height);
      grad.addColorStop(0, coat[0]);
      grad.addColorStop(1, coat[1]);
      g.fillStyle = grad;
      g.fillRect(0, 0, cv.width, cv.height);
      // 涂层上撒些圆点和一个大问号
      g.fillStyle = 'rgba(255,255,255,.28)';
      for (let i = 0; i < 26; i++) {
        g.beginPath();
        g.arc(Math.random() * cv.width, Math.random() * cv.height, (6 + Math.random() * 18) * dpr, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.font = `900 ${cv.height * 0.45}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('?', cv.width / 2, cv.height / 2);
      g.globalCompositeOperation = 'destination-out';
      g.lineCap = g.lineJoin = 'round';
      g.lineWidth = brush * 2;
    };
    paint();

    let px = 0, py = 0, down = -1, strokes = 0;
    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
    };
    const scrape = (x: number, y: number) => {
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(x, y);
      g.stroke();
      px = x;
      py = y;
    };
    const ratio = () => {
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      const step = Math.max(4, Math.round(8 * dpr));
      let clear = 0, all = 0;
      for (let y = 0; y < cv.height; y += step) {
        for (let x = 0; x < cv.width; x += step) {
          all++;
          if (d[(y * cv.width + x) * 4 + 3] < 40) clear++;
        }
      }
      return all ? clear / all : 0;
    };
    const reveal = () => {
      revealed = true;
      card.classList.add('open');
      const c = sdk.fx.centerOf(card);
      sdk.sfx.win();
      sdk.buzz(30);
      sdk.fx.burst(c.x, c.y, ['⭐', '✨', '🎉'], 12);
      sdk.say(callOf(it));
      if (++shown % PER_ROUND === 0) {
        sdk.progress.round({ mistakes: 0 });
        sdk.later(() => sdk.reward.celebrate(next), 2200);
      } else {
        sdk.later(next, 2600);
      }
    };

    // 事件挂在整个舞台上（见 mount）：从卡片外或圆角处开始划也能刮到
    pointer = {
      down(e) {
        if (revealed || down !== -1) return;
        down = e.pointerId;
        [px, py] = pos(e);
        scrape(px + 0.1, py);
        sdk.sfx.note(880);
      },
      move(e) {
        if (e.pointerId !== down || revealed) return;
        const [x, y] = pos(e);
        if (Math.hypot(x - px, y - py) < 2) return;
        scrape(x, y);
        if (++strokes % 6 === 0) sdk.buzz(5);
        // 小朋友常常一直不抬手，刮的过程中也定期检查
        if (strokes % 30 === 0 && ratio() >= DONE_RATIO) reveal();
      },
      up(e) {
        if (e.pointerId !== down) return;
        down = -1;
        if (!revealed && ratio() >= DONE_RATIO) reveal();
      },
    };

    const onResize = () => {
      if (!revealed) paint();
    };
    addEventListener('resize', onResize);
    cleanup = () => removeEventListener('resize', onResize);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      items = ctx.pack!.items;
      s.classList.add('g-scratch');
      s.addEventListener('pointerdown', (e) => {
        try { s.setPointerCapture(e.pointerId); } catch { /* 忽略 */ }
        pointer?.down(e);
      });
      s.addEventListener('pointermove', (e) => pointer?.move(e));
      s.addEventListener('pointerup', (e) => pointer?.up(e));
      s.addEventListener('pointercancel', (e) => pointer?.up(e));
      sdk.say({ zh: '用小手刮一刮，看看是谁', en: 'Scratch to see who is hiding!' });
      next();
    },
    unmount() {
      cleanup?.();
    },
    hint() {
      const card = s.querySelector('.sc-card:not(.open)');
      if (!card) return;
      sdk.fx.wiggle(card);
      card.appendChild(h('sc-finger emoji', '👆'));
      sdk.later(() => card.querySelector('.sc-finger')?.remove(), 1800);
    },
  };
}
