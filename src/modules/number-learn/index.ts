// 认识数字：大数字 + 对应数量的小东西，进来先数一遍；点小东西可以自己数。左右换数字。参数 max = 数到几（默认 10）、unit = 量词
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick } from '@/sdk/dom';
import { countOf, qtyOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import numbers from '@/content/packs/numbers';
import './style.css';

const COUNT_MS = 750; // 数数的节奏
const ROUND_SIZE = 5; // 每看 5 个数字记一轮

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pack: ContentPack;
  let unit = '个';
  let max = 10;
  let n = 1;
  let seen = 0;
  let stage: HTMLElement;
  let token = 0; // 换数字时让上一个数字还没数完的计时作废

  function render() {
    const my = ++token;
    const it: PackItem = pick(pack.items);
    stage.innerHTML = '';
    const big = h('nl-digit emoji', pic(numbers.items[n - 1]));
    big.addEventListener('click', () => {
      sdk.fx.wiggle(big);
      sdk.sfx.pop();
      sdk.say(countOf(n));
    });
    const grid = h('count-grid nl-grid');
    grid.style.setProperty('--cols', String(Math.min(n, 5)));
    grid.style.setProperty('--rows', String(Math.ceil(n / 5)));
    stage.append(big, grid);

    // 点一个数一个：按点的顺序数，不按位置
    let tapped = 0;
    const objs: HTMLElement[] = [];
    for (let k = 0; k < n; k++) {
      const o = h('count-obj emoji', pic(it));
      o.addEventListener('click', () => {
        if (o.classList.contains('counted')) {
          sdk.fx.wiggle(o);
          return;
        }
        mark(o, ++tapped);
        if (tapped === n) done(it, my);
      });
      objs.push(o);
    }

    // 进场：一个个蹦出来，同时数出来
    sdk.say(countOf(n));
    objs.forEach((o, k) =>
      sdk.later(() => {
        if (my !== token) return;
        o.classList.add('pop-in');
        grid.appendChild(o);
        sdk.sfx.ding(k % 8);
        sdk.say(countOf(k + 1));
      }, 900 + k * COUNT_MS),
    );
    sdk.later(() => {
      if (my === token) sdk.say(qtyOf(n, it, unit));
    }, 1100 + n * COUNT_MS);

    if (++seen % ROUND_SIZE === 0) sdk.progress.round({ mistakes: 0 });
  }

  function mark(o: HTMLElement, k: number) {
    o.classList.add('counted');
    o.insertAdjacentHTML('beforeend', `<span class="count-no">${k}</span>`);
    sdk.sfx.ding(k % 8);
    sdk.say(countOf(k));
  }

  function done(it: PackItem, my: number) {
    sdk.later(() => {
      if (my !== token) return;
      const c = sdk.fx.centerOf(stage.querySelector('.nl-digit')!);
      sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 12);
      sdk.sfx.win();
      sdk.say(qtyOf(n, it, unit));
    }, 600);
  }

  function go(dir: 1 | -1) {
    n = ((n - 1 + dir + max) % max) + 1;
    sdk.sfx.ding(dir > 0 ? 2 : 0);
    render();
  }

  return {
    mount(s, api, { pack: p, activity }) {
      sdk = api;
      pack = p!;
      unit = String(activity.params?.unit ?? '个');
      max = Number(activity.params?.max ?? 10);
      s.classList.add('g-numlearn');
      const prev = h('nl-nav prev', '<span>◀</span>');
      const next = h('nl-nav next', '<span>▶</span>');
      prev.addEventListener('click', () => go(-1));
      next.addEventListener('click', () => go(1));
      stage = h('nl-stage');
      s.append(prev, stage, next);

      // 左右滑动换数字
      let sx = 0;
      stage.addEventListener('pointerdown', (e) => (sx = e.clientX));
      stage.addEventListener('pointerup', (e) => {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      });
      render();
    },
    hint() {
      const o = stage.querySelector('.count-obj:not(.counted)');
      sdk.fx.wiggle(o ?? document.querySelector('.nl-nav.next')!);
    },
  };
}
