// 形状投投盒：把形状拖进盒盖上对应的洞里，「咚」地掉进盒子。难度 0/1/2 = 2/3/4 种洞
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { pic } from '@/sdk/art';
import './style.css';

const LID = ['#ff8787', '#74c0fc', '#ffd43b', '#8ce99a', '#b197fc'];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let items: PackItem[];

  function next() {
    const n = 2 + sdk.progress.level();
    const kinds = shuffle(items).slice(0, n);
    // 每种至少一块，再随机多给 1~2 块
    const blocks = shuffle([...kinds, ...Array.from({ length: n > 2 ? 2 : 1 }, () => pick(kinds))]);
    let left = blocks.length;
    let mistakes = 0;
    s.innerHTML = '';

    const box = h('sb-box');
    box.style.setProperty('--lid', pick(LID));
    const lid = h('sb-lid');
    shuffle(kinds).forEach((it) => {
      const hole = h('sb-hole', `<span class="sb-sil emoji">${pic(it)}</span>`);
      hole.dataset.id = it.id;
      lid.appendChild(hole);
    });
    box.append(lid, h('sb-body'));
    const tray = h('row sb-tray');
    s.append(box, tray);

    blocks.forEach((it) => {
      const t = h('tile emoji sb-block', pic(it));
      t.dataset.id = it.id;
      tray.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [...lid.children],
        accept: (x) => (x as HTMLElement).dataset.id === it.id,
        onTap: () => sdk.say(it.name),
        onDrop: (x) => {
          t.dataset.locked = '1';
          sdk.input.flyTo(t, x, 'sb-in', () => {
            t.remove();
            sdk.sfx.drum('big');
            sdk.fx.wiggle(box);
          });
          sdk.sfx.ding(blocks.length - left);
          sdk.buzz();
          sdk.say(it.name);
          if (--left === 0) {
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.reward.celebrate(next), 1300);
          }
        },
        onMiss: (x) => {
          if (!x) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.say({ zh: '换一个洞试试', en: 'Try another hole' });
        },
      });
    });
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      // 只用有插画的形状，剪影才好认
      const all = ctx.pack!.items;
      const withArt = all.filter((x) => x.image);
      items = withArt.length >= 4 ? withArt : all;
      s.classList.add('g-board', 'g-sbox');
      sdk.say({ zh: '把形状投进盒子里', en: 'Put the shapes in the box' });
      next();
    },
    hint() {
      const t = s.querySelector<HTMLElement>('.sb-block:not([data-locked])');
      if (!t) return;
      sdk.fx.wiggle(t);
      const hole = s.querySelector(`.sb-hole[data-id="${t.dataset.id}"]`);
      if (hole) {
        hole.classList.add('glow');
        sdk.later(() => hole.classList.remove('glow'), 1800);
      }
    },
  };
}
