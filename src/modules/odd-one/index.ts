// 哪个不一样：一排里只有一个和别的不同，点出来。难度 0/1/2 = 3/4/5 个
import type { ContentPack, ModuleImpl, SDK } from '@/sdk';
import { h, rand, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { iconHtml, pic } from '@/sdk/art';
import './style.css';

const QUESTIONS_PER_ROUND = 4;
const ASK = { zh: '哪个不一样？', en: 'Which one is different?' };

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let row: HTMLElement;
  let asked = 0;
  let mistakes = 0;

  function glowOdd() {
    const t = row.querySelector('.odd');
    if (!t) return;
    t.classList.add('glow');
    sdk.later(() => t.classList.remove('glow'), 1800);
  }

  function ask() {
    const n = 3 + sdk.progress.level();
    const [same, odd] = shuffle(pack.items).slice(0, 2);
    const oddAt = rand(n);
    let wrongHere = 0;
    let done = false;
    row.innerHTML = '';
    row.dataset.n = String(n);
    for (let i = 0; i < n; i++) {
      const it = i === oddAt ? odd : same;
      const t = h('tile oo-tile emoji' + (i === oddAt ? ' odd' : ''), pic(it));
      t.addEventListener('click', () => {
        if (done) return;
        if (i === oddAt) {
          done = true;
          t.classList.add('right');
          const c = sdk.fx.centerOf(t);
          sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 10);
          sdk.sfx.ding(4);
          sdk.buzz();
          sdk.say(callOf(it));
          if (++asked % QUESTIONS_PER_ROUND === 0) {
            sdk.progress.round({ mistakes });
            mistakes = 0;
            sdk.later(() => sdk.reward.celebrate(ask), 1500);
          } else {
            sdk.later(ask, 1700);
          }
        } else {
          mistakes++;
          wrongHere++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.say({ zh: '这个和别的一样哦', en: 'This one is the same' });
          if (wrongHere >= 2) sdk.later(glowOdd, 1200);
        }
      });
      row.appendChild(t);
    }
    sdk.say(ASK);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-odd');
      const q = h('oo-q emoji', iconHtml('ui/magnifier'));
      q.addEventListener('click', () => sdk.say(ASK));
      row = h('row oo-row');
      s.append(q, row);
      ask();
    },
    hint() {
      sdk.say(ASK);
      glowOdd();
    },
  };
}
