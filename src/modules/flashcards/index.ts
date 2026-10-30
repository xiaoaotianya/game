// 认知卡片：一张张大卡片，点一下读名字（和叫声/动作）；左右滑动或点箭头换卡
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

const BG = ['#ffe3e3', '#fff3bf', '#d3f9d8', '#d0ebff', '#e5dbff', '#ffe8cc', '#c5f6fa'];
const ROUND_SIZE = 6; // 每看 6 张记一轮

export default function create(): ModuleImpl {
  let sdk: SDK;
  let holder: HTMLElement;
  let order: PackItem[] = [];
  let i = 0;
  let seen = 0;
  let current: HTMLElement | null = null;
  let swiped = false;

  function render(dir: 1 | -1 | 0) {
    const it = order[i];
    const card = h('fc-card');
    card.style.setProperty('--bg', BG[i % BG.length]);
    const sub = sdk.lang() === 'both' ? `<div class="fc-sub">${it.name.en}</div>` : '';
    card.innerHTML = `<div class="fc-pic emoji">${pic(it)}</div><div class="fc-name">${sdk.label(it.name)}</div>${sub}`;
    card.addEventListener('click', () => {
      if (swiped) return;
      const pic = card.querySelector('.fc-pic')!;
      sdk.fx.wiggle(pic);
      const c = sdk.fx.centerOf(pic);
      sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 8);
      sdk.sfx.pop();
      sdk.say(callOf(it));
    });

    const old = current;
    if (old) {
      old.classList.add(dir > 0 ? 'out-left' : 'out-right');
      sdk.later(() => old.remove(), 400);
    }
    if (dir) card.classList.add(dir > 0 ? 'in-right' : 'in-left');
    holder.appendChild(card);
    current = card;
    sdk.say(callOf(it));

    if (++seen % ROUND_SIZE === 0) {
      sdk.progress.round({ mistakes: 0 });
      sdk.sfx.win();
    }
  }

  function go(dir: 1 | -1) {
    i = (i + dir + order.length) % order.length;
    // 一圈看完重新洗牌
    if (i === 0 && dir > 0) order = shuffle(order);
    sdk.sfx.ding(dir > 0 ? 2 : 0);
    render(dir);
  }

  return {
    mount(s, api, { pack }) {
      sdk = api;
      order = shuffle(pack!.items);
      s.classList.add('g-cards');
      holder = h('fc-holder');
      const prev = h('fc-nav prev', '<span>◀</span>');
      const next = h('fc-nav next', '<span>▶</span>');
      prev.addEventListener('click', () => go(-1));
      next.addEventListener('click', () => go(1));
      s.append(prev, holder, next);

      // 左右滑动换卡
      let sx = 0;
      holder.addEventListener('pointerdown', (e) => { sx = e.clientX; swiped = false; });
      holder.addEventListener('pointerup', (e) => {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 60) {
          swiped = true;
          go(dx < 0 ? 1 : -1);
        }
      });
      render(0);
    },
    hint() {
      sdk.fx.wiggle(document.querySelector('.fc-nav.next')!);
    },
  };
}
