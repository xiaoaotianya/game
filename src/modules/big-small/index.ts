// 大和小：同一个东西不同大小，听指令点大的 / 小的。难度 0 = 两个比大小；1 = 三个找最大 / 最小
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { pic } from '@/sdk/art';
import './style.css';

const QUESTIONS_PER_ROUND = 4;

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pack: ContentPack;
  let row: HTMLElement;
  let last: PackItem | null = null;
  let asked = 0;
  let mistakes = 0;
  let prompt = { zh: '', en: '' };

  function ask() {
    const three = sdk.progress.level() > 0;
    const scales = shuffle(three ? [1, 0.68, 0.42] : [1, 0.5]);
    const it = pick(pack.items.filter((x) => x !== last));
    last = it;
    const wantBig = Math.random() < 0.5;
    const target = wantBig ? Math.max(...scales) : Math.min(...scales);
    const n = it.name;
    prompt = three
      ? wantBig
        ? { zh: `点一点最大的${n.zh}`, en: `Tap the biggest ${n.en}` }
        : { zh: `点一点最小的${n.zh}`, en: `Tap the smallest ${n.en}` }
      : wantBig
        ? { zh: `点一点大的${n.zh}`, en: `Tap the big ${n.en}` }
        : { zh: `点一点小的${n.zh}`, en: `Tap the small ${n.en}` };

    let wrongHere = 0;
    let done = false;
    row.innerHTML = '';
    row.dataset.n = String(scales.length);
    for (const sc of scales) {
      const cell = h('bs-cell', `<div class="bs-pic emoji" style="--sc:${sc}">${pic(it)}</div>`);
      if (sc === target) cell.classList.add('target');
      cell.addEventListener('click', () => {
        if (done) return;
        if (sc === target) {
          done = true;
          cell.classList.add('right');
          const c = sdk.fx.centerOf(cell);
          sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 10);
          sdk.sfx.ding(wantBig ? 0 : 7);
          sdk.buzz();
          sdk.say(wantBig ? { zh: `大${n.zh}`, en: `Big ${n.en}!` } : { zh: `小${n.zh}`, en: `Little ${n.en}!` });
          if (++asked % QUESTIONS_PER_ROUND === 0) {
            sdk.progress.round({ mistakes });
            mistakes = 0;
            sdk.later(() => sdk.reward.celebrate(ask), 1400);
          } else {
            sdk.later(ask, 1700);
          }
        } else {
          mistakes++;
          wrongHere++;
          sdk.sfx.boing();
          sdk.fx.wiggle(cell);
          sdk.later(() => sdk.say(prompt), 500);
          if (wrongHere >= 2) glow();
        }
      });
      row.appendChild(cell);
    }
    sdk.say(prompt);
  }

  function glow() {
    const t = row.querySelector('.target');
    if (!t) return;
    t.classList.add('glow');
    sdk.later(() => t.classList.remove('glow'), 1800);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      pack = ctx.pack!;
      el.classList.add('g-board', 'g-bigsmall');
      row = h('bs-row');
      el.appendChild(row);
      ask();
    },
    hint() {
      sdk.say(prompt);
      glow();
    },
  };
}
