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

/** 当前卡片对指针的处理；事件挂在整个舞台上，由 mount 统一分发 */
interface Card {
  start(e: PointerEvent): void;
  move(e: PointerEvent): void;
  end(): void;
}

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let queue: PackItem[] = [];
  let items: PackItem[];
  let last = '';
  let shown = 0;
  let cleanup: (() => void) | null = null;
  let card: Card | null = null;
  /** 正在刮的那根手指；跨卡片保留，手不抬也能接着刮下一张 */
  let held = -1;

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
    const el = h('sc-card', `<div class="sc-pic emoji">${pic(it)}</div>`);
    const cv = document.createElement('canvas');
    cv.className = 'sc-coat';
    el.appendChild(cv);
    s.appendChild(el);

    const g = cv.getContext('2d', { willReadFrequently: true })!;
    const coat = pick(COATS);
    let revealed = false;
    let cssW = 0, cssH = 0;

    // 位图按画布自身的显示尺寸（不含卡片边框）建立，坐标换算才准确
    const paint = () => {
      const r = cv.getBoundingClientRect();
      cssW = r.width;
      cssH = r.height;
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
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
      g.lineWidth = Math.max(36 * dpr, cv.width * 0.18);
    };
    paint();

    let px = 0, py = 0, strokes = 0, fresh = true;
    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) * cv.width) / r.width, ((e.clientY - r.top) * cv.height) / r.height];
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
      const step = Math.max(4, Math.round(cv.width / 60));
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
      el.classList.add('open');
      const c = sdk.fx.centerOf(el);
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

    card = {
      start(e) {
        if (revealed) return;
        fresh = false;
        [px, py] = pos(e);
        scrape(px + 0.1, py);
        sdk.sfx.note(880);
      },
      move(e) {
        if (revealed) return;
        // 上一张揭晓时手指还按着：换到新卡片后从当前位置重新起笔
        if (fresh) return this.start(e);
        const [x, y] = pos(e);
        if (Math.hypot(x - px, y - py) < 2) return;
        scrape(x, y);
        if (++strokes % 6 === 0) sdk.buzz(5);
        // 小朋友常常一直不抬手，刮的过程中也定期检查
        if (strokes % 30 === 0 && ratio() >= DONE_RATIO) reveal();
      },
      end() {
        fresh = true;
        if (!revealed && ratio() >= DONE_RATIO) reveal();
      },
    };

    // 只有尺寸真的变了（如转屏）才重画涂层
    const onResize = () => {
      const r = cv.getBoundingClientRect();
      if (!revealed && (Math.abs(r.width - cssW) > 1 || Math.abs(r.height - cssH) > 1)) paint();
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
      // 事件挂在整个舞台上：从卡片外或圆角处开始划也能刮到
      s.addEventListener('pointerdown', (e) => {
        if (held !== -1) return; // 只认第一根手指
        held = e.pointerId;
        try { s.setPointerCapture(held); } catch { /* 忽略 */ }
        card?.start(e);
      });
      s.addEventListener('pointermove', (e) => {
        if (e.pointerId === held) card?.move(e);
      });
      const up = (e: PointerEvent) => {
        if (e.pointerId !== held) return;
        held = -1;
        card?.end();
      };
      s.addEventListener('pointerup', up);
      s.addEventListener('pointercancel', up);
      sdk.say({ zh: '用小手刮一刮，看看是谁', en: 'Scratch to see who is hiding!' });
      next();
    },
    unmount() {
      cleanup?.();
    },
    hint() {
      // 正在刮时不打扰；提示只显示一根手指，不晃卡片，免得刮痕跟着歪
      if (held !== -1) return;
      const el = s.querySelector('.sc-card:not(.open)');
      if (!el || el.querySelector('.sc-finger')) return;
      el.appendChild(h('sc-finger emoji', '👆'));
      sdk.later(() => el.querySelector('.sc-finger')?.remove(), 1800);
    },
  };
}
