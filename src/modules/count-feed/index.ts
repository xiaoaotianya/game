// 喂小动物：按要求的数量喂食，边喂边数。难度 0..3 = 最多数到 2..5
import type { ModuleImpl, SDK } from '@/sdk';
import { h, rand } from '@/sdk/dom';
import { EN_NUM, ZH_CNT, ZH_QTY } from '@/content/phrases';
import { iconHtml } from '@/sdk/art';
import './style.css';

interface Diner {
  a: string; f: string; zh: string; en: string;
  u: string; fzh: string; fen1: string; fen: string;
}

const DINERS: Diner[] = [
  { a: 'items/bunny', f: 'items/carrot', zh: '小兔', en: 'bunny', u: '根', fzh: '胡萝卜', fen1: 'carrot', fen: 'carrots' },
  { a: 'items/monkey', f: 'items/banana', zh: '小猴', en: 'monkey', u: '根', fzh: '香蕉', fen1: 'banana', fen: 'bananas' },
  { a: 'items/dog', f: 'items/bone', zh: '小狗', en: 'puppy', u: '根', fzh: '骨头', fen1: 'bone', fen: 'bones' },
  { a: 'ui/mouse', f: 'items/cheese', zh: '小老鼠', en: 'mouse', u: '块', fzh: '奶酪', fen1: 'piece of cheese', fen: 'pieces of cheese' },
  { a: 'items/bear', f: 'items/honey', zh: '小熊', en: 'bear', u: '罐', fzh: '蜂蜜', fen1: 'pot of honey', fen: 'pots of honey' },
  { a: 'items/panda', f: 'items/bamboo', zh: '熊猫', en: 'panda', u: '根', fzh: '竹子', fen1: 'bamboo', fen: 'bamboos' },
];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let round = 0;
  let lastN = 0;

  function next() {
    const d = DINERS[round++ % DINERS.length];
    const maxN = 2 + sdk.progress.level();
    let N: number;
    do N = 1 + rand(maxN); while (N === lastN);
    lastN = N;
    const food = (n: number) => (n > 1 ? d.fen : d.fen1);
    s.innerHTML = '';

    const top = h('feed-top');
    const animal = h('animal emoji', iconHtml(d.a));
    const count = h('count');
    const plate = h('plate');
    for (let i = 0; i < N; i++) plate.appendChild(h('pslot', `<span class="ghost emoji">${iconHtml(d.f)}</span>`));
    top.append(animal, count, plate);
    const bot = h('row');
    s.append(top, bot);

    sdk.say({ zh: `${d.zh}要吃${ZH_QTY[N]}${d.u}${d.fzh}`, en: `The ${d.en} wants ${EN_NUM[N]} ${food(N)}` });

    let fed = 0;
    const feed = (t: HTMLElement) => {
      if (fed >= N || t.dataset.locked) return;
      t.dataset.locked = '1';
      const slot = plate.children[fed];
      const k = ++fed;
      sdk.input.flyTo(t, slot, null, () => slot.classList.add('full'));
      sdk.sfx.ding(k * 2);
      sdk.buzz();
      sdk.fx.wiggle(animal);
      count.textContent = String(k);
      count.classList.remove('show');
      void count.offsetWidth;
      count.classList.add('show');
      sdk.say({ zh: ZH_CNT[k], en: EN_NUM[k] });
      if (k === N) {
        bot.querySelectorAll('.tile:not([data-locked])').forEach((x) => x.classList.add('fade'));
        sdk.progress.round({ mistakes: 0 });
        sdk.later(() => {
          animal.classList.add('happy');
          sdk.say({ zh: `${ZH_QTY[N]}${d.u}${d.fzh}，吃饱啦！`, en: `${EN_NUM[N]} ${food(N)}, yummy!` });
        }, 900);
        sdk.later(() => sdk.reward.celebrate(next), 3200);
      }
    };

    for (let i = 0; i < Math.min(7, N + 2); i++) {
      const t = h('tile emoji', iconHtml(d.f));
      bot.appendChild(t);
      sdk.input.draggable(t, { targets: () => [animal, plate], accept: () => true, onDrop: () => feed(t), onTap: () => feed(t) });
    }
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-board', 'g-feed');
      next();
    },
    hint() {
      const t = s.querySelector('.tile:not([data-locked])');
      if (t) sdk.fx.wiggle(t);
    },
  };
}
