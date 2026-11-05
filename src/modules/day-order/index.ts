// 一天的顺序：打乱的生活卡片拖进编号格子，必须按顺序放（只接受下一个空格）。
// set=morning / night；难度 0/1/2 = 前 2/3/4 步。排完后依次高亮并连读整段流程。
import type { ModuleImpl, SDK, Text } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import './style.css';

interface Step { icon: string; name: Text }

const SETS: Record<string, { intro: Text; steps: Step[] }> = {
  morning: {
    intro: { zh: '早上起来先做什么呢？', en: 'What do we do in the morning?' },
    steps: [
      { icon: 'items/bed', name: { zh: '起床', en: 'get up' } },
      { icon: 'items/toothbrush', name: { zh: '刷牙', en: 'brush teeth' } },
      { icon: 'items/bowl', name: { zh: '吃早饭', en: 'eat breakfast' } },
      { icon: 'items/backpack', name: { zh: '背书包去幼儿园', en: 'go to school' } },
    ],
  },
  night: {
    intro: { zh: '睡觉前要做什么呢？', en: 'What do we do before bed?' },
    steps: [
      { icon: 'items/bathtub', name: { zh: '洗澡', en: 'take a bath' } },
      { icon: 'items/toothbrush', name: { zh: '刷牙', en: 'brush teeth' } },
      { icon: 'items/book', name: { zh: '讲故事', en: 'read a story' } },
      { icon: 'ui/moon', name: { zh: '睡觉', en: 'go to sleep' } },
    ],
  },
};

/** 第 i 步（共 n 步）读的话：先… / 然后… / 再… / 最后… */
function stepLine(st: Step, i: number, n: number): Text {
  const last = i === n - 1 && n > 2;
  const zh = i === 0 ? '先' : last ? '最后' : i === 1 ? '然后' : '再';
  const en = i === 0 ? 'First' : last ? 'Finally' : i === 1 ? 'Then' : 'Next';
  return { zh: zh + st.name.zh, en: `${en}, ${st.name.en}` };
}

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let steps: Step[];
  let intro: Text;
  let filled = 0;
  let done = false;

  /** 估一句话读完要多久，连读时用来排时间（say 会打断上一句） */
  function speakMs(t: Text) {
    const zh = t.zh.length * 300 + 400;
    const en = t.en.split(/\s+/).length * 380 + 400;
    const l = sdk.lang();
    return l === 'zh' ? zh : l === 'en' ? en : zh + en;
  }

  function next() {
    done = false;
    filled = 0;
    const n = 2 + sdk.progress.level();
    const use = steps.slice(0, n);
    let order: number[];
    do order = shuffle(use.map((_, i) => i));
    while (order.every((v, i) => v === i));
    let mistakes = 0;
    s.innerHTML = '';
    s.dataset.n = String(n);
    sdk.say(intro);

    // 上排：编号格子，用点点表示第几步，不依赖识字
    const top = h('row od-slots');
    use.forEach((_, i) => {
      const dots = Array.from({ length: i + 1 }, () => '<i></i>').join('');
      const slot = h('slot od-slot', `<span class="od-no">${i + 1}</span><span class="od-dots">${dots}</span>`);
      slot.dataset.i = String(i);
      top.appendChild(slot);
    });
    const bot = h('row od-cards');
    const cards: HTMLElement[] = [];
    order.forEach((idx) => {
      const st = use[idx];
      const t = h('tile emoji od-card', iconHtml(st.icon));
      t.dataset.i = String(idx);
      cards[idx] = t;
      bot.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [...top.children].filter((x) => !x.classList.contains('done')),
        accept: (x) => !done && Number((x as HTMLElement).dataset.i) === filled && idx === filled,
        onTap: () => sdk.say(st.name),
        onDrop: (x) => {
          t.dataset.locked = '1';
          x.classList.add('done');
          sdk.input.flyTo(t, x);
          sdk.sfx.ding(filled);
          sdk.buzz();
          sdk.say(stepLine(st, idx, n));
          if (++filled === n) finish(use, cards, mistakes);
        },
        onMiss: (x) => {
          if (!x || done) return;
          if (idx === filled) {
            // 卡片对了只是格子放后面了：不算错，提示正确的格子
            const slot = top.children[filled];
            slot.classList.add('glow');
            sdk.later(() => slot.classList.remove('glow'), 1800);
            return;
          }
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.say(filled === 0
            ? { zh: '先做什么呢？', en: 'What comes first?' }
            : { zh: '接下来做什么呢？', en: 'What comes next?' });
        },
      });
    });
    s.append(top, bot);
    // 锁住下排高度：卡片拖走后布局不跳
    bot.style.minHeight = bot.offsetHeight + 'px';
  }

  /** 排完：先上报本轮，再依次高亮每张卡并连读一遍，最后庆祝 */
  function finish(use: Step[], cards: HTMLElement[], mistakes: number) {
    done = true;
    sdk.progress.round({ mistakes });
    const n = use.length;
    let t = speakMs(stepLine(use[n - 1], n - 1, n)) + 300; // 等最后一步读完
    use.forEach((st, i) => {
      const line = stepLine(st, i, n);
      sdk.later(() => {
        cards.forEach((c) => c.classList.remove('od-lit'));
        cards[i].classList.add('od-lit');
        sdk.sfx.ding(i);
        sdk.say(line);
      }, t);
      t += speakMs(line);
    });
    sdk.later(() => cards.forEach((c) => c.classList.remove('od-lit')), t);
    sdk.later(() => sdk.reward.celebrate(next), t + 300);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      const set = SETS[(ctx.activity.params?.set as string) ?? 'morning'] ?? SETS.morning;
      steps = set.steps;
      intro = set.intro;
      s.classList.add('g-board', 'g-order');
      next();
    },
    hint() {
      if (done) return;
      const s0 = s.querySelector(`.od-slot[data-i="${filled}"]`);
      const c = s.querySelector<HTMLElement>(`.od-cards .od-card[data-i="${filled}"]`);
      for (const x of [s0, c]) {
        if (!x) continue;
        x.classList.add('glow');
        sdk.later(() => x.classList.remove('glow'), 1800);
      }
    },
  };
}
