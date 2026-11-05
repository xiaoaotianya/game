// 躲猫猫：小家伙们从洞里 / 礁石后 / 草丛里探头，点中它就读名字。攒满 10 颗星庆祝一次。
// 难度 0/1/2 = 3/4/6 个洞，等级越高探头时间越短。点空不算失误。
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick, rand } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

const GOAL = 10;
const HOLES = [3, 4, 6];
const SCALE = [523, 587, 659, 784, 880];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let items: PackItem[];
  let field: HTMLElement;
  let stars: HTMLElement;
  let got = 0;
  let paused = false;
  let gen = 0; // 每轮递增，旧轮的定时回调直接作废

  function setup() {
    gen++;
    got = 0;
    paused = false;
    const n = HOLES[sdk.progress.level()] ?? 3;
    s.innerHTML = '';
    stars = h('pk-stars');
    for (let i = 0; i < GOAL; i++) stars.appendChild(h('pk-star'));
    field = h('pk-field');
    field.dataset.n = String(n);
    for (let i = 0; i < n; i++) {
      const hole = h('pk-hole', '<div class="pk-win"><div class="pk-who emoji"></div></div><div class="pk-front"></div>');
      hole.addEventListener('pointerdown', () => tap(hole));
      field.appendChild(hole);
    }
    s.append(stars, field);
    const g = gen;
    sdk.later(() => g === gen && spawn(), 900);
  }

  function spawn() {
    if (paused) return;
    const g = gen;
    const free = [...field.children].filter((x) => !x.classList.contains('up')) as HTMLElement[];
    const busy = field.children.length - free.length;
    if (free.length && busy < 2) {
      const hole = pick(free);
      const it = pick(items);
      hole.querySelector('.pk-who')!.innerHTML = pic(it);
      hole.dataset.id = it.id;
      hole.classList.remove('hit');
      hole.classList.add('up');
      const stay = 2600 - sdk.progress.level() * 500;
      sdk.later(() => {
        if (g === gen && hole.dataset.id === it.id && !hole.classList.contains('hit')) hide(hole);
      }, stay);
    }
    sdk.later(() => g === gen && spawn(), 700 + rand(900));
  }

  function hide(hole: HTMLElement) {
    hole.classList.remove('up', 'glow');
    delete hole.dataset.id;
  }

  function tap(hole: HTMLElement) {
    const id = hole.dataset.id;
    if (!hole.classList.contains('up') || !id || hole.classList.contains('hit')) {
      sdk.sfx.note(pick(SCALE) / 2);
      return;
    }
    const it = items.find((x) => x.id === id)!;
    hole.classList.add('hit');
    const c = sdk.fx.centerOf(hole.querySelector('.pk-who')!);
    sdk.sfx.pop();
    sdk.buzz();
    sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💫'], 10);
    sdk.say(callOf(it));
    stars.children[got]?.classList.add('on');
    got++;
    const g = gen;
    sdk.later(() => g === gen && hide(hole), 900);
    if (got >= GOAL) {
      paused = true;
      sdk.progress.round({ mistakes: 0 });
      sdk.later(() => g === gen && sdk.reward.celebrate(setup), 1100);
    }
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      items = ctx.pack!.items;
      s.classList.add('g-peek', `pk-s-${(ctx.activity.params?.scene as string) ?? 'hole'}`);
      sdk.say({ zh: '谁躲起来啦？看到它就点一点', en: "Who's hiding? Tap when you see it!" });
      setup();
    },
    hint() {
      const up = field?.querySelector<HTMLElement>('.pk-hole.up:not(.hit)');
      if (up) up.classList.add('glow');
    },
  };
}
