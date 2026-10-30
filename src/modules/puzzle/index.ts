// 拼图：把切开的图块拖回原位。难度 0/1/2 = 2 块(左右) / 3 块(竖条) / 4 块(田字)
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

const GRIDS: [number, number][] = [[2, 1], [3, 1], [2, 2]];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let last: PackItem | null = null;

  function next() {
    const [cols, rows] = GRIDS[sdk.progress.level()];
    const it = pick(pack.items.filter((x) => x !== last));
    last = it;
    let mistakes = 0;
    s.innerHTML = '';
    s.style.setProperty('--cols', String(cols));
    s.style.setProperty('--rows', String(rows));

    const board = h('pz-board', `<div class="pz-sil emoji">${pic(it)}</div>`);
    const grid = h('pz-grid');
    const tray = h('pz-tray');
    const pieces: HTMLElement[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = `${r}-${c}`;
        const slot = h('pz-slot');
        slot.dataset.k = k;
        grid.appendChild(slot);
        const p = h('pz-piece', `<div class="pz-img emoji">${pic(it)}</div>`);
        p.dataset.k = k;
        p.style.setProperty('--c', String(c));
        p.style.setProperty('--r', String(r));
        pieces.push(p);
      }
    }
    board.appendChild(grid);
    s.append(board, tray);

    let left = pieces.length;
    shuffle(pieces).forEach((p) => {
      tray.appendChild(p);
      sdk.input.draggable(p, {
        targets: () => [...grid.children].filter((x) => !x.children.length),
        accept: (slot) => (slot as HTMLElement).dataset.k === p.dataset.k,
        onTap: () => sdk.fx.wiggle(p),
        onDrop: (slot) => {
          p.dataset.locked = '1';
          sdk.input.flyTo(p, slot, 'placed');
          sdk.sfx.ding(pieces.length - left);
          sdk.buzz();
          if (--left === 0) {
            board.classList.add('complete');
            sdk.progress.round({ mistakes });
            sdk.later(() => sdk.say(callOf(it)), 450);
            sdk.later(() => sdk.reward.celebrate(next), 1800);
          }
        },
        onMiss: (slot) => {
          if (!slot) return;
          mistakes++;
          sdk.sfx.boing();
        },
      });
    });
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-puzzle');
      sdk.say({ zh: '来拼一拼', en: "Let's do a puzzle" });
      next();
    },
    hint() {
      const p = s.querySelector<HTMLElement>('.pz-tray .pz-piece');
      if (!p) return;
      sdk.fx.wiggle(p);
      const slot = s.querySelector(`.pz-slot[data-k="${p.dataset.k}"]`);
      if (slot) {
        slot.classList.add('glow');
        sdk.later(() => slot.classList.remove('glow'), 1800);
      }
    },
  };
}
