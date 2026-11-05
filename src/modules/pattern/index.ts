// 找规律：一排按规律排好的东西，最后一个是问号，从下面选对的填进去。
// 难度 0 = AB（2 个选项）；1 = AAB / ABB（3 个选项，含一个干扰项）；2 = ABC（3 个选项）
import type { ContentPack, ModuleImpl, PackItem, SDK, Text } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { pic } from '@/sdk/art';
import './style.css';

const BEAT = 560; // 弹出 / 跳动的节拍
const NOTES = [523, 659, 784, 1047]; // 规律里第几个元素对应的音高
const UNITS = [[[0, 1]], [[0, 0, 1], [0, 1, 1]], [[0, 1, 2]]];
// 序列总长（含问号）的可选范围
const LENS = [[5, 6, 7], [6, 7], [6, 7]];

const Q_SVG =
  '<svg class="pt-qmark" viewBox="0 0 40 60" aria-hidden="true">' +
  '<path d="M9 18 C9 6 31 6 31 18 C31 27 20 27 20 37" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>' +
  '<circle cx="20" cy="51" r="4.5" fill="#fff"/></svg>';

/** 外观分组：有颜色按颜色，没有就按 id，各组互不相同 */
const look = (it: PackItem) => it.color ?? it.id;

/** 选 k 个外观不同的项 */
function pickDistinct(items: PackItem[], k: number): PackItem[] {
  const groups = new Map<string, PackItem[]>();
  for (const it of items) {
    const g = groups.get(look(it)) ?? [];
    g.push(it);
    groups.set(look(it), g);
  }
  const keys = shuffle([...groups.keys()]);
  if (keys.length >= k) return keys.slice(0, k).map((g) => pick(groups.get(g)!));
  return shuffle(items).slice(0, k);
}

const joinNames = (xs: PackItem[]): Text => ({
  zh: xs.map((x) => x.name.zh).join('，'),
  en: xs.map((x) => x.name.en).join(', '),
});

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let pack: ContentPack;
  let gen = 0; // 每轮 / 每次重读递增，旧的定时回调作废
  let seq: PackItem[] = [];
  let cells: HTMLElement[] = [];
  let q: HTMLElement;
  let ready = false; // 序列弹完才接受作答
  let over = false;

  /** 整行依次跳一下，同时读出全部名字 */
  function sing(list: PackItem[], speak = true, done?: () => void) {
    const g = ++gen;
    if (speak) sdk.say(joinNames(list), done && (() => g === gen && done()));
    list.forEach((_, i) =>
      sdk.later(() => {
        if (g !== gen) return;
        const c = cells[i];
        if (!c) return;
        c.classList.remove('pt-hop');
        void c.offsetWidth;
        c.classList.add('pt-hop');
        sdk.sfx.note(c.dataset.f ? +c.dataset.f : NOTES[0]);
      }, i * BEAT),
    );
  }

  function next() {
    const lv = Math.min(sdk.progress.level(), UNITS.length - 1);
    const unit = pick(UNITS[lv]);
    const kinds = Math.max(...unit) + 1;
    const len = pick(LENS[lv]);
    const extra = lv === 1 ? 1 : 0; // 中档加一个不在规律里的干扰项
    const chosen = pickDistinct(pack.items, kinds + extra);
    const used = chosen.slice(0, kinds);
    seq = Array.from({ length: len }, (_, i) => used[unit[i % unit.length]]);
    const answer = seq[len - 1];
    const shown = seq.slice(0, -1);
    let mistakes = 0;
    ready = false;
    over = false;
    gen++;
    s.innerHTML = '';
    s.dataset.n = String(len);

    const row = h('pt-seq');
    cells = seq.map((it, i) => {
      const last = i === len - 1;
      const c = h(last ? 'pt-cell pt-q' : 'pt-cell emoji', last ? Q_SVG : pic(it));
      c.dataset.f = String(NOTES[unit[i % unit.length]]);
      row.appendChild(c);
      return c;
    });
    q = cells[len - 1];
    const opts = h('row pt-opts');
    s.append(row, opts);

    // 一个一个弹出，按节拍读名字
    const g = gen;
    sdk.say(joinNames(shown));
    cells.forEach((c, i) =>
      sdk.later(() => {
        if (g !== gen) return;
        c.classList.add('pt-in');
        if (i < len - 1) sdk.sfx.note(+c.dataset.f!);
        else sdk.sfx.pop();
      }, 300 + i * BEAT),
    );
    sdk.later(() => {
      if (g !== gen) return;
      ready = true;
      opts.classList.add('pt-show');
    }, 300 + len * BEAT);

    const choose = (t: HTMLElement, it: PackItem) => {
      if (!ready || over) {
        t.style.transform = '';
        return;
      }
      if (it === answer) {
        over = true;
        t.dataset.locked = '1';
        opts.querySelectorAll<HTMLElement>('.tile').forEach((x) => (x.dataset.locked = '1'));
        q.classList.add('pt-filled');
        sdk.input.flyTo(t, q);
        sdk.sfx.ding(4);
        sdk.buzz();
        sdk.progress.round({ mistakes });
        // 填好后整段再唱一遍，末尾读正确项
        // 整段读完再庆祝（庆祝的夸奖会打断朗读，最后一个正是答案）
        sdk.later(() => sing(seq, true, () => sdk.later(() => sdk.reward.celebrate(next), 300)), 600);
        return;
      }
      mistakes++;
      t.style.transition = 'transform .35s cubic-bezier(.3,1.3,.5,1)';
      t.style.transform = '';
      sdk.sfx.boing();
      sdk.fx.wiggle(t);
      sdk.say({ zh: '再听一遍', en: 'Listen again' });
      const g2 = ++gen;
      sdk.later(() => g2 === gen && !over && sing(shown), 1500);
    };

    shuffle(chosen).forEach((it) => {
      const t = h('tile emoji pt-opt', pic(it));
      opts.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [q],
        accept: () => true,
        onDrop: () => choose(t, it),
        onTap: () => choose(t, it),
      });
    });
    // 锁住选项区高度，选走一个后上面那排不跳
    opts.style.minHeight = opts.offsetHeight + 'px';
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      pack = ctx.pack!;
      s.classList.add('g-board', 'g-pat');
      next();
    },
    hint() {
      if (!ready || over) return;
      q.classList.remove('glow');
      void q.offsetWidth;
      q.classList.add('glow');
      sdk.later(() => q.classList.remove('glow'), 1900);
      sing(seq.slice(0, -1));
    },
  };
}
