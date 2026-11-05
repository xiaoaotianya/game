// 分一分：每只小动物分一个，边分边数；同一只不能分两个。难度 0/1/2 = 2/3/4 只
import type { ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import { EN_NUM, ZH_QTY, countOf } from '@/content/phrases';
import './style.css';

interface Pal { id: string; zh: string; en: string }
interface Food { id: string; zh: string; en: string; ens: string; u: string }

const PALS: Pal[] = [
  { id: 'cat', zh: '小猫', en: 'kitty' },
  { id: 'dog', zh: '小狗', en: 'puppy' },
  { id: 'bunny', zh: '小兔', en: 'bunny' },
  { id: 'bear', zh: '小熊', en: 'bear' },
  { id: 'panda', zh: '熊猫', en: 'panda' },
  { id: 'pig', zh: '小猪', en: 'piggy' },
  { id: 'monkey', zh: '小猴', en: 'monkey' },
  { id: 'chick', zh: '小鸡', en: 'chick' },
];

// 第一轮固定苹果，之后轮换
const FOODS: Food[] = [
  { id: 'apple', zh: '苹果', en: 'apple', ens: 'apples', u: '个' },
  { id: 'banana', zh: '香蕉', en: 'banana', ens: 'bananas', u: '根' },
  { id: 'strawberry', zh: '草莓', en: 'strawberry', ens: 'strawberries', u: '个' },
  { id: 'carrot', zh: '胡萝卜', en: 'carrot', ens: 'carrots', u: '根' },
  { id: 'pear', zh: '梨', en: 'pear', ens: 'pears', u: '个' },
  { id: 'peach', zh: '桃子', en: 'peach', ens: 'peaches', u: '个' },
  { id: 'orange', zh: '橘子', en: 'orange', ens: 'oranges', u: '个' },
];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let round = 0;

  function next() {
    const n = 2 + Math.min(sdk.progress.level(), 2);
    const f = FOODS[round++ % FOODS.length];
    const pals = shuffle(PALS).slice(0, n);
    let given = 0;
    let mistakes = 0;
    let over = false;
    s.innerHTML = '';

    const top = h('sh-pals');
    const cols = pals.map((p) => {
      const col = h('sh-pal', `<div class="sh-ani emoji">${iconHtml('items/' + p.id)}</div>`);
      const plate = h('sh-plate');
      col.appendChild(plate);
      top.appendChild(col);
      return col;
    });
    const pile = h('row sh-pile');
    s.append(top, pile);

    sdk.say({ zh: `每个小动物分一个${f.zh}`, en: `Give each friend one ${f.en}` });

    const has = (col: Element) => (col as HTMLElement).dataset.has === '1';

    const give = (t: HTMLElement, col: HTMLElement) => {
      if (over || has(col) || t.dataset.locked) return;
      t.dataset.locked = '1';
      col.dataset.has = '1';
      const k = ++given;
      sdk.input.flyTo(t, col.querySelector('.sh-plate')!);
      sdk.sfx.ding(k * 2);
      sdk.buzz();
      sdk.say(countOf(k));
      const ani = col.querySelector('.sh-ani')!;
      ani.classList.remove('sh-hop');
      void (ani as HTMLElement).offsetWidth;
      ani.classList.add('sh-hop');
      if (k < n) return;
      over = true;
      sdk.progress.round({ mistakes });
      sdk.later(() => {
        cols.forEach((c) => c.classList.add('sh-happy'));
        sdk.say({
          zh: `每个小动物都有一个${f.zh}，一共${ZH_QTY[n]}${f.u}`,
          en: `Every friend has one ${f.en}. ${EN_NUM[n][0].toUpperCase() + EN_NUM[n].slice(1)} ${f.ens} in all!`,
        });
      }, 900);
      sdk.later(() => sdk.reward.celebrate(next), 4200);
    };

    for (let i = 0; i < n; i++) {
      const t = h('tile emoji sh-food', iconHtml('items/' + f.id));
      pile.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => cols,
        accept: (x) => !over && !has(x),
        onDrop: (x) => give(t, x as HTMLElement),
        onMiss: (x) => {
          if (!x || over || !has(x)) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(x);
          sdk.say({ zh: '它已经有啦，给别的小动物吧', en: 'It has one already. Give it to another friend' });
        },
        // 点一下：自动给下一只还没分到的
        onTap: () => {
          const col = cols.find((c) => !has(c));
          if (col) give(t, col);
        },
      });
    }
    // 锁住下排高度，分走后上排不跳
    pile.style.minHeight = pile.offsetHeight + 'px';
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-board', 'g-share');
      next();
    },
    hint() {
      const col = s.querySelector<HTMLElement>('.sh-pal:not([data-has])');
      const t = s.querySelector<HTMLElement>('.sh-pile .tile:not([data-locked])');
      for (const x of [col, t]) {
        if (!x) continue;
        x.classList.remove('glow');
        void x.offsetWidth;
        x.classList.add('glow');
        sdk.later(() => x.classList.remove('glow'), 1900);
      }
    },
  };
}
