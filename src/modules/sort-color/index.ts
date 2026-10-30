// 颜色分类：把物品放进同色篮子。难度 0/1/2 = 2/3/4 种颜色，每色 2 个
import type { ColorId, ContentPack, ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { COLORS } from '@/content/colors';
import { pic } from '@/sdk/art';
import './style.css';

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let first = true;

  function next() {
    const byColor = new Map<ColorId, typeof pack.items>();
    for (const it of pack.items) {
      if (!it.color) continue;
      byColor.set(it.color, [...(byColor.get(it.color) ?? []), it]);
    }
    const available = [...byColor.keys()].filter((c) => byColor.get(c)!.length >= 2);
    const nC = Math.min(available.length, 2 + sdk.progress.level());
    const keys = shuffle(available).slice(0, nC);
    let mistakes = 0;
    s.innerHTML = '';
    if (!first) sdk.say({ zh: '颜色分一分', en: 'Sort the colors' });
    first = false;

    const top = h('row'), bot = h('row items');
    keys.forEach((k) => {
      const b = h('basket', '<div class="bin"></div>');
      b.dataset.c = k;
      b.style.setProperty('--c', COLORS[k].hex);
      top.appendChild(b);
    });
    const items = shuffle(keys.flatMap((k) => shuffle(byColor.get(k)!).slice(0, 2)));
    let left = items.length;
    items.forEach((it) => {
      const C = COLORS[it.color!];
      const t = h('tile emoji', pic(it));
      bot.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [...top.children],
        accept: (b) => (b as HTMLElement).dataset.c === it.color,
        onTap: () => sdk.say(C),
        onDrop: (b) => {
          t.dataset.locked = '1';
          sdk.input.flyTo(t, b.querySelector('.bin')!, 'small');
          sdk.sfx.ding(items.length - left);
          sdk.buzz();
          sdk.say(C);
          if (--left === 0) {
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.reward.celebrate(next), 900);
          }
        },
        onMiss: (b) => {
          if (!b) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.say({ zh: `这是${C.zh}的哦`, en: `This one is ${C.en}` });
        },
      });
    });
    s.append(top, bot);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-colors');
      sdk.say({ zh: '把颜色一样的放进同色的篮子', en: 'Put each one in the basket with the same color' });
      next();
    },
    hint() {
      const t = s.querySelector('.items .tile');
      if (t) sdk.fx.wiggle(t);
    },
  };
}
