// 听一听找一找：听语音「小猫在哪里？」，点出对应的图。难度 0/1/2 = 2/3/4 个选项
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { iconHtml, pic } from '@/sdk/art';
import './style.css';

const QUESTIONS_PER_ROUND = 4;

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let target: PackItem;
  let last: PackItem | null = null;
  let asked = 0;
  let mistakes = 0;
  let grid: HTMLElement;

  const askSay = () => sdk.say({ zh: `${target.name.zh}在哪里？`, en: `Where is the ${target.name.en}?` });

  function glowTarget() {
    const t = grid.querySelector(`[data-id="${target.id}"]`);
    if (!t) return;
    t.classList.add('glow');
    sdk.later(() => t.classList.remove('glow'), 1800);
  }

  function ask() {
    const n = 2 + sdk.progress.level();
    const options = shuffle(pack.items.filter((x) => x !== last)).slice(0, n);
    target = pick(options);
    last = target;
    let wrongHere = 0;
    let done = false;
    grid.innerHTML = '';
    grid.dataset.n = String(n);
    options.forEach((it) => {
      const t = h('tile lf-tile emoji', pic(it));
      t.dataset.id = it.id;
      t.addEventListener('click', () => {
        if (done) return;
        if (it === target) {
          done = true;
          t.classList.add('right');
          const c = sdk.fx.centerOf(t);
          sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 10);
          sdk.sfx.ding(4);
          sdk.buzz();
          sdk.say(callOf(it));
          asked++;
          if (asked % QUESTIONS_PER_ROUND === 0) {
            sdk.progress.round({ mistakes });
            mistakes = 0;
            sdk.later(() => sdk.reward.celebrate(ask), 1600);
          } else {
            sdk.later(ask, 1800);
          }
        } else {
          mistakes++;
          wrongHere++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.say({ zh: `这是${it.name.zh}`, en: `This is the ${it.name.en}` });
          sdk.later(askSay, 1600);
          if (wrongHere >= 2) sdk.later(glowTarget, 1600);
        }
      });
      grid.appendChild(t);
    });
    askSay();
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-listen');
      const ear = h('lf-ear emoji', iconHtml('ui/speaker'));
      ear.addEventListener('click', () => askSay());
      grid = h('lf-grid');
      s.append(ear, grid);
      ask();
    },
    hint() {
      askSay();
      glowTarget();
    },
  };
}
