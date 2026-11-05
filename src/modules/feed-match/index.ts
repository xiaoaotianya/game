// 谁吃什么 / 送回家：生活常识配对。
// set=food：把食物拖给爱吃它的动物；set=home：把动物送回它的家。难度 0/1/2 = 2/3/4 对
import type { ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import { PAIR_SETS, type Pair } from '@/content/pairs';
import './style.css';

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pairs: Pair[];
  let home = false;
  let lastIds = '';

  function next() {
    const n = 2 + sdk.progress.level();
    let picks: Pair[];
    do picks = shuffle(pairs).slice(0, n);
    while (picks.map((p) => p.id).sort().join() === lastIds && pairs.length > n);
    lastIds = picks.map((p) => p.id).sort().join();
    let left = n;
    let mistakes = 0;
    s.innerHTML = '';

    // food：目标是动物、拖的是食物；home：目标是家、拖的是动物
    const tgt = (p: Pair) => (home ? p.b : p.a);
    const drag = (p: Pair) => (home ? p.a : p.b);
    const dragName = (p: Pair) => (home ? p.aName : p.bName);

    const top = h('row fm-top'), bot = h('row fm-bot');
    shuffle(picks).forEach((p) => {
      const t = h('fm-target', `<span class="fm-face emoji">${iconHtml(tgt(p))}</span><span class="fm-spot"></span>`);
      t.dataset.id = p.id;
      t.addEventListener('pointerdown', () => !t.classList.contains('done') && sdk.say(home ? p.bName : p.aName));
      top.appendChild(t);
    });
    shuffle(picks).forEach((p) => {
      const t = h('tile emoji', iconHtml(drag(p)));
      t.dataset.id = p.id;
      bot.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [...top.children].filter((x) => !x.classList.contains('done')),
        accept: (x) => (x as HTMLElement).dataset.id === p.id,
        onTap: () => sdk.say(dragName(p)),
        onDrop: (x) => {
          t.dataset.locked = '1';
          x.classList.add('done');
          const spot = x.querySelector('.fm-spot')!;
          sdk.input.flyTo(t, spot, home ? 'fm-home' : 'fm-eat', () => {
            if (!home) x.classList.add('munch');
          });
          sdk.sfx.ding(n - left);
          sdk.buzz();
          sdk.later(() => sdk.say(p.line), 300);
          if (--left === 0) {
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.reward.celebrate(next), 2400);
          }
        },
        onMiss: (x) => {
          if (!x) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.fx.wiggle(x);
        },
      });
    });
    s.append(top, bot);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      const set = (ctx.activity.params?.set as string) ?? 'food';
      home = set === 'home';
      pairs = PAIR_SETS[set] ?? PAIR_SETS.food;
      s.classList.add('g-board', 'g-fm', home ? 'fm-mode-home' : 'fm-mode-food');
      sdk.say(home
        ? { zh: '小动物要回家啦，帮它们找到家', en: 'Help the animals get home' }
        : { zh: '小动物饿啦，它们爱吃什么呢？', en: 'Who eats what? Feed the animals' });
      next();
    },
    hint() {
      const t = s.querySelector<HTMLElement>('.fm-bot .tile:not([data-locked])');
      if (!t) return;
      sdk.fx.wiggle(t);
      const x = s.querySelector(`.fm-target[data-id="${t.dataset.id}"]`);
      if (x) {
        x.classList.add('glow');
        sdk.later(() => x.classList.remove('glow'), 1800);
      }
    },
  };
}
