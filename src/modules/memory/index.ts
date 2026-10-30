// 翻翻乐：翻开两张一样的就配对成功。难度 0/1/2 = 2/3/4 对
import type { ContentPack, ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { callOf, nameOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

// 卡片数 → 竖屏 / 横屏的列数
const LAYOUT: Record<number, { p: number; l: number }> = { 4: { p: 2, l: 4 }, 6: { p: 2, l: 3 }, 8: { p: 2, l: 4 } };

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;

  function next() {
    const n = 2 + sdk.progress.level();
    const picks = shuffle(pack.items).slice(0, n);
    const cards = shuffle([...picks, ...picks]);
    let open: HTMLElement[] = [];
    let lock = false;
    let matched = 0;
    let mistakes = 0;
    s.innerHTML = '';

    const grid = h('mm-grid');
    const portrait = innerHeight >= innerWidth;
    const cols = LAYOUT[cards.length][portrait ? 'p' : 'l'];
    grid.style.setProperty('--cols', String(cols));
    grid.style.setProperty('--rows', String(Math.ceil(cards.length / cols)));

    cards.forEach((it) => {
      const c = h('mm-card', `<div class="mm-inner"><div class="mm-back"></div><div class="mm-front emoji">${pic(it)}</div></div>`);
      c.dataset.id = it.id;
      c.addEventListener('click', () => {
        if (lock || c.classList.contains('flip')) return;
        c.classList.add('flip');
        sdk.sfx.pop();
        sdk.say(nameOf(it));
        open.push(c);
        if (open.length < 2) return;

        const [a, b] = open;
        open = [];
        if (a.dataset.id === b.dataset.id) {
          a.classList.add('matched');
          b.classList.add('matched');
          sdk.sfx.ding(matched * 2);
          sdk.buzz();
          [a, b].forEach((x) => {
            const p = sdk.fx.centerOf(x);
            sdk.fx.burst(p.x, p.y, ['⭐', '✨'], 6);
          });
          sdk.later(() => sdk.say(callOf(it)), 500);
          if (++matched === n) {
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.reward.celebrate(next), 1600);
          }
        } else {
          mistakes++;
          lock = true;
          sdk.later(() => {
            sdk.sfx.boing();
            a.classList.remove('flip');
            b.classList.remove('flip');
            lock = false;
          }, 1200);
        }
      });
      grid.appendChild(c);
    });
    s.appendChild(grid);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-memory');
      sdk.say({ zh: '翻一翻，找出两张一样的', en: 'Flip the cards and find a match' });
      next();
    },
    hint() {
      const c = s.querySelector('.mm-card:not(.flip)');
      if (c) sdk.fx.wiggle(c);
    },
  };
}
