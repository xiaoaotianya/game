// 找影子：把物品拖到对应剪影上。任何内容包都能用。难度 0/1/2 = 2/3/4 对
import type { ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { callOf, nameOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import type { ContentPack } from '@/sdk';

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;

  function next() {
    const n = 2 + sdk.progress.level();
    let mistakes = 0;
    s.innerHTML = '';
    const picks = shuffle(pack.items).slice(0, n);
    const top = h('row'), bot = h('row');
    shuffle(picks).forEach((it) => {
      const slot = h('slot', `<span class="emoji sil">${pic(it)}</span>`);
      slot.dataset.id = it.id;
      top.appendChild(slot);
    });
    let left = n;
    shuffle(picks).forEach((it) => {
      const t = h('tile emoji', pic(it));
      t.dataset.id = it.id;
      bot.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [...top.children].filter((x) => !x.classList.contains('done')),
        accept: (x) => (x as HTMLElement).dataset.id === it.id,
        onTap: () => sdk.say(nameOf(it)),
        onDrop: (x) => {
          t.dataset.locked = '1';
          x.classList.add('done');
          sdk.input.flyTo(t, x);
          sdk.sfx.ding(n - left);
          sdk.buzz();
          sdk.say(callOf(it));
          if (--left === 0) {
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.reward.celebrate(next), 1200);
          }
        },
        onMiss: (x) => {
          if (!x) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
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
      s.classList.add('g-board');
      sdk.say({ zh: '帮它们找到自己的影子', en: 'Find the matching shadows' });
      next();
    },
    hint() {
      const t = s.querySelector<HTMLElement>('.tile:not([data-locked])');
      if (!t) return;
      const slot = s.querySelector(`.slot[data-id="${t.dataset.id}"]`);
      sdk.fx.wiggle(t);
      if (slot) {
        slot.classList.add('glow');
        sdk.later(() => slot.classList.remove('glow'), 1800);
      }
    },
  };
}
