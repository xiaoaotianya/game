// 排排队：同一个东西几种大小，从小到大拖进台阶格子。难度 0/1 = 3/4 个
import type { ContentPack, ModuleImpl, PackItem, SDK, Text } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { pic } from '@/sdk/art';
import { plural } from '@/content/phrases';
import './style.css';

const SCALES = [
  [0.45, 0.7, 1],
  [0.4, 0.6, 0.8, 1],
];
// 每放对一个读的词，按位置
const WORDS: Text[][] = [
  [{ zh: '小', en: 'small' }, { zh: '大一点', en: 'bigger' }, { zh: '最大', en: 'biggest' }],
  [
    { zh: '最小', en: 'smallest' }, { zh: '大一点', en: 'bigger' },
    { zh: '更大', en: 'even bigger' }, { zh: '最大', en: 'biggest' },
  ],
];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let last: PackItem | null = null;
  let tray: HTMLElement;
  let scales: number[] = [];
  let placed = 0;

  function next() {
    const lv = Math.min(sdk.progress.level(), SCALES.length - 1);
    scales = SCALES[lv];
    const words = WORDS[lv];
    const n = scales.length;
    const pool = pack.items.filter((x) => x !== last);
    const it = pick(pool.length ? pool : pack.items);
    last = it;
    placed = 0;
    let mistakes = 0;
    let over = false;
    s.innerHTML = '';
    s.dataset.n = String(n);
    sdk.say({ zh: `${it.name.zh}从小到大排排队`, en: `Line up the ${/s$/.test(it.name.en) ? it.name.en : plural(it.name.en)}, small to big` });

    // 上排台阶：左矮右高，每格带淡淡的同尺寸剪影
    const stairs = h('sz-stairs');
    scales.forEach((sc) => {
      const slot = h('sz-slot', `<span class="sz-sil emoji" style="--sc:${sc}">${pic(it)}</span>`);
      slot.style.setProperty('--sc', String(sc));
      stairs.appendChild(slot);
    });
    stairs.children[0].classList.add('sz-next');
    tray = h('sz-tray');
    s.append(stairs, tray);

    const place = (t: HTMLElement) => {
      const slot = stairs.children[placed] as HTMLElement;
      const k = placed++;
      t.dataset.locked = '1';
      slot.classList.remove('sz-next');
      slot.classList.add('sz-done');
      stairs.children[placed]?.classList.add('sz-next');
      sdk.input.flyTo(t, slot);
      sdk.sfx.ding(k * 2);
      sdk.buzz();
      sdk.say(words[k]);
      if (placed < n) return;
      over = true;
      // 排完：从小到大依次跳一下
      [...stairs.children].forEach((x, i) =>
        sdk.later(() => {
          const p = x.querySelector('.sz-piece');
          if (!p) return;
          p.classList.remove('sz-hop');
          void (p as HTMLElement).offsetWidth;
          p.classList.add('sz-hop');
          sdk.sfx.ding(i * 2 + 2);
        }, 700 + i * 280),
      );
      sdk.later(() => sdk.say({ zh: '从小到大排好啦', en: 'Small to big, all lined up!' }), 700 + n * 280);
      sdk.progress.round({ mistakes });
      sdk.later(() => sdk.reward.celebrate(next), 2800 + n * 280);
    };

    const wrong = (t: HTMLElement) => {
      mistakes++;
      sdk.sfx.boing();
      sdk.fx.wiggle(t);
      sdk.say(placed === 0
        ? { zh: '先找最小的', en: 'Find the smallest one first' }
        : { zh: '找剩下最小的', en: 'Find the smallest one left' });
    };

    shuffle(scales).forEach((sc) => {
      const t = h('tile sz-piece', `<span class="sz-pic emoji">${pic(it)}</span>`);
      t.style.setProperty('--sc', String(sc));
      t.dataset.sc = String(sc);
      tray.appendChild(t);
      const right = () => sc === scales[placed];
      sdk.input.draggable(t, {
        // 落在任一空格都算：拿对了就自动排进下一格
        targets: () => [...stairs.children].filter((x) => !x.classList.contains('sz-done')),
        accept: () => !over && right(),
        onDrop: () => place(t),
        onMiss: (x) => { if (x && !over) wrong(t); },
        onTap: () => {
          if (over) return;
          if (right()) place(t);
          else wrong(t);
        },
      });
    });
    // 锁住下排高度，拖走后上排不跳
    tray.style.minHeight = tray.offsetHeight + 'px';
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-size');
      next();
    },
    hint() {
      const want = scales[placed];
      const t = tray?.querySelector<HTMLElement>(`.sz-piece:not([data-locked])[data-sc="${want}"]`);
      if (!t) return;
      t.classList.remove('glow');
      void t.offsetWidth;
      t.classList.add('glow');
      sdk.later(() => t.classList.remove('glow'), 1900);
      sdk.say(placed === 0 ? { zh: '先找最小的', en: 'Find the smallest one first' } : { zh: '找剩下最小的', en: 'Find the smallest one left' });
    },
  };
}
