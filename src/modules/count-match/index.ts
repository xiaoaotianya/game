// 数一数：数清楚有几个，再点对应的数字。难度 0/1/2 = 数到 3 / 5 / 10，选项 2 / 3 / 3 个。参数 unit = 量词
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, rand, shuffle } from '@/sdk/dom';
import { countOf, plural, qtyOf } from '@/content/phrases';
import { iconHtml, pic } from '@/sdk/art';
import numbers from '@/content/packs/numbers';
import './style.css';

const QUESTIONS_PER_ROUND = 4;
const MAX = [3, 5, 10];
const OPTIONS = [2, 3, 3];
const COUNT_MS = 700;

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pack: ContentPack;
  let unit = '个';
  let objsBox: HTMLElement;
  let optsBox: HTMLElement;
  let it: PackItem;
  let n = 0;
  let lastN = 0;
  let asked = 0;
  let mistakes = 0;
  let token = 0; // 新的一题 / 新的一次帮数开始时，让旧的计时作废

  const askSay = () => sdk.say({ zh: `数一数，有几${unit}${it.name.zh}？`, en: `How many ${plural(it.name.en)}?` });

  // 帮忙数一遍：逐个高亮并读出来
  function countAloud(then?: () => void) {
    const my = ++token;
    const objs = [...objsBox.querySelectorAll<HTMLElement>('.count-obj')];
    objs.forEach((o) => {
      o.classList.remove('counted');
      o.querySelector('.count-no')?.remove();
    });
    objs.forEach((o, k) =>
      sdk.later(() => {
        if (my !== token) return;
        o.classList.add('counted');
        o.insertAdjacentHTML('beforeend', `<span class="count-no">${k + 1}</span>`);
        sdk.sfx.ding(k % 8);
        sdk.say(countOf(k + 1));
      }, k * COUNT_MS),
    );
    if (then) sdk.later(() => my === token && then(), objs.length * COUNT_MS + 200);
  }

  function ask() {
    token++;
    const lv = sdk.progress.level();
    const max = MAX[lv];
    do n = 1 + rand(max);
    while (n === lastN);
    lastN = n;
    it = pick(pack.items);

    // 物品：一行最多 5 个；也可以自己点着数
    objsBox.innerHTML = '';
    objsBox.style.setProperty('--cols', String(Math.min(n, 5)));
    objsBox.style.setProperty('--rows', String(Math.ceil(n / 5)));
    let tapped = 0;
    for (let k = 0; k < n; k++) {
      const o = h('count-obj emoji pop-in', pic(it));
      o.style.animationDelay = k * 60 + 'ms';
      o.addEventListener('click', () => {
        if (o.classList.contains('counted')) return;
        o.classList.add('counted');
        o.insertAdjacentHTML('beforeend', `<span class="count-no">${++tapped}</span>`);
        sdk.sfx.ding(tapped % 8);
        sdk.say(countOf(tapped));
      });
      objsBox.appendChild(o);
    }

    // 数字选项：正确答案 + 最接近的干扰项
    const near = shuffle(Array.from({ length: max }, (_, k) => k + 1).filter((x) => x !== n))
      .sort((a, b) => Math.abs(a - n) - Math.abs(b - n));
    const opts = shuffle([n, ...near.slice(0, OPTIONS[lv] - 1)]);
    optsBox.innerHTML = '';
    let wrongHere = 0;
    let done = false;
    for (const v of opts) {
      const t = h('tile cm-opt emoji', pic(numbers.items[v - 1]));
      if (v === n) t.classList.add('target');
      t.addEventListener('click', () => {
        if (done) return;
        if (v === n) {
          done = true;
          token++;
          t.classList.add('right');
          const c = sdk.fx.centerOf(t);
          sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 10);
          sdk.sfx.ding(5);
          sdk.buzz();
          sdk.say(qtyOf(n, it, unit));
          if (++asked % QUESTIONS_PER_ROUND === 0) {
            sdk.progress.round({ mistakes });
            mistakes = 0;
            sdk.later(() => sdk.reward.celebrate(ask), 1600);
          } else {
            sdk.later(ask, 1900);
          }
        } else {
          mistakes++;
          wrongHere++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          // 点错了就一起再数一遍；错两次后数完让答案发光
          countAloud(() => {
            if (wrongHere < 2) return;
            const g = optsBox.querySelector('.target');
            g?.classList.add('glow');
            sdk.later(() => g?.classList.remove('glow'), 1800);
          });
        }
      });
      optsBox.appendChild(t);
    }
    sdk.later(askSay, 300);
  }

  return {
    mount(el, api, { pack: p, activity }) {
      sdk = api;
      pack = p!;
      unit = String(activity.params?.unit ?? '个');
      el.classList.add('g-board', 'g-countmatch');
      const q = h('cm-q emoji', iconHtml('ui/speaker'));
      q.addEventListener('click', askSay);
      objsBox = h('count-grid cm-objs');
      optsBox = h('row cm-opts');
      el.append(q, objsBox, optsBox);
      ask();
    },
    hint() {
      countAloud();
    },
  };
}
