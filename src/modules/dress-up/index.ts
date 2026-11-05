// 穿衣服：先看天气（晴/雨/冷），把 2 件合适的东西拖给小熊。
// 难度 0/1/2 = 选项 3/4/5 个（2 件对的 + 干扰项）。拖错轻轻晃一下并用语音解释。
import type { ModuleImpl, SDK, Text } from '@/sdk';
import { h, pick, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import './style.css';

type Weather = 'sun' | 'rain' | 'cold';
/** 小熊身上的挂点 */
type Spot = 'head' | 'face' | 'neck' | 'body' | 'hand' | 'feet';

interface Wear {
  id: string;
  icon: string;
  name: Text;
  ok: Weather[];
  spot: Spot;
  verb: Text;   // 中文是动词「带 / 穿 / 戴」，英文是冠词
  line: Text;   // 放好后读的短句
}

const WEARS: Wear[] = [
  { id: 'umbrella', icon: 'items/umbrella', name: { zh: '雨伞', en: 'umbrella' }, ok: ['rain'], spot: 'hand',
    verb: { zh: '带', en: 'the' }, line: { zh: '雨伞，下雨不怕淋湿', en: 'Umbrella, keeps you dry' } },
  { id: 'boots', icon: '👢', name: { zh: '雨靴', en: 'rain boots' }, ok: ['rain'], spot: 'feet',
    verb: { zh: '穿', en: 'the' }, line: { zh: '雨靴，踩水不湿脚', en: 'Rain boots, splash splash' } },
  { id: 'cap', icon: 'items/cap', name: { zh: '帽子', en: 'cap' }, ok: ['sun'], spot: 'head',
    verb: { zh: '戴', en: 'a' }, line: { zh: '帽子，太阳晒不着', en: 'A cap, shade from the sun' } },
  { id: 'glasses', icon: '🕶️', name: { zh: '太阳镜', en: 'sunglasses' }, ok: ['sun'], spot: 'face',
    verb: { zh: '戴', en: '' }, line: { zh: '太阳镜，阳光不刺眼', en: 'Sunglasses, so bright' } },
  { id: 'tshirt', icon: '👕', name: { zh: 'T恤', en: 'T-shirt' }, ok: ['sun'], spot: 'body',
    verb: { zh: '穿', en: 'a' }, line: { zh: 'T恤，凉快又舒服', en: 'A T-shirt, nice and cool' } },
  { id: 'coat', icon: '🧥', name: { zh: '外套', en: 'coat' }, ok: ['cold'], spot: 'body',
    verb: { zh: '穿', en: 'a' }, line: { zh: '外套，穿上暖暖的', en: 'A coat, nice and warm' } },
  { id: 'scarf', icon: '🧣', name: { zh: '围巾', en: 'scarf' }, ok: ['cold'], spot: 'neck',
    verb: { zh: '戴', en: 'a' }, line: { zh: '围巾，脖子不冷', en: 'A scarf, warm neck' } },
  { id: 'gloves', icon: '🧤', name: { zh: '手套', en: 'gloves' }, ok: ['cold'], spot: 'hand',
    verb: { zh: '戴', en: '' }, line: { zh: '手套，小手暖暖的', en: 'Gloves, warm hands' } },
  { id: 'socks', icon: 'items/socks', name: { zh: '袜子', en: 'socks' }, ok: ['cold'], spot: 'feet',
    verb: { zh: '穿', en: '' }, line: { zh: '袜子，小脚暖暖的', en: 'Socks, warm feet' } },
];

const SKY: Record<Weather, { icon: string; call: Text; short: Text }> = {
  sun: { icon: 'items/sun', call: { zh: '出太阳啦，小熊要带什么出门？', en: "It's sunny. What does Bear need?" }, short: { zh: '出太阳啦', en: "It's sunny" } },
  rain: { icon: 'items/rain', call: { zh: '下雨啦，小熊要带什么出门？', en: "It's raining. What does Bear need?" }, short: { zh: '下雨啦', en: "It's raining" } },
  cold: { icon: 'items/snowman', call: { zh: '天冷啦，小熊要穿什么出门？', en: "It's cold. What does Bear need?" }, short: { zh: '天冷啦', en: "It's cold" } },
};
const OPTIONS = [3, 4, 5];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let bear: HTMLElement;
  let lastSky: Weather | null = null;
  let done = false;
  let goods: Wear[] = [];

  function next() {
    done = false;
    const sky = pick((['sun', 'rain', 'cold'] as Weather[]).filter((w) => w !== lastSky));
    lastSky = sky;
    const n = OPTIONS[sdk.progress.level()] ?? 3;
    // 两件对的尽量挂在不同位置
    const pool = shuffle(WEARS.filter((w) => w.ok.includes(sky)));
    const first = pool[0];
    const second = pool.find((w) => w !== first && w.spot !== first.spot) ?? pool[1];
    goods = [first, second];
    const bads = shuffle(WEARS.filter((w) => !w.ok.includes(sky))).slice(0, n - 2);
    let left = 2;
    let mistakes = 0;
    s.innerHTML = '';

    const stage = h('dr2-stage');
    const skyEl = h(`dr2-sky dr2-sky-${sky} emoji`, iconHtml(SKY[sky].icon));
    skyEl.addEventListener('pointerdown', () => sdk.say(SKY[sky].call));
    bear = h('dr2-bear', `<span class="dr2-me emoji">${iconHtml('items/bear')}</span>`);
    bear.addEventListener('pointerdown', () => !done && sdk.say(SKY[sky].call));
    goods.forEach((w) => {
      const sp = h(`dr2-spot dr2-at-${w.spot}`);
      sp.dataset.id = w.id;
      bear.appendChild(sp);
    });
    stage.append(skyEl, bear);

    const tray = h(`row dr2-tray dr2-n${n}`);
    shuffle([...goods, ...bads]).forEach((w) => {
      const t = h('tile emoji dr2-wear', iconHtml(w.icon));
      t.dataset.id = w.id;
      tray.appendChild(t);
      sdk.input.draggable(t, {
        targets: () => [bear],
        accept: () => !done && w.ok.includes(sky),
        onTap: () => sdk.say(w.name),
        onDrop: () => {
          t.dataset.locked = '1';
          sdk.input.flyTo(t, bear.querySelector(`.dr2-spot[data-id="${w.id}"]`)!, 'dr2-on');
          sdk.sfx.ding(2 - left);
          sdk.buzz();
          sdk.say(w.line);
          if (--left === 0) {
            done = true;
            tray.querySelectorAll<HTMLElement>('.tile').forEach((x) => (x.dataset.locked = '1'));
            sdk.progress.round({ mistakes });
            sdk.later(() => {
              bear.classList.add('dr2-happy');
              sdk.say({ zh: '小熊准备好啦，出发！', en: 'Bear is ready. Let\'s go!' });
            }, 2200);
            sdk.later(() => sdk.reward.celebrate(next), 4200);
          }
        },
        onMiss: (x) => {
          if (!x || done) return;
          mistakes++;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          sdk.fx.wiggle(bear);
          const sh = SKY[sky].short;
          sdk.say({
            zh: `${sh.zh}，不用${w.verb.zh}${w.name.zh}`,
            en: `${sh.en}, no need for ${w.verb.en ? w.verb.en + ' ' : ''}${w.name.en}`,
          });
        },
      });
    });
    s.append(stage, tray);
    // 锁住托盘高度：东西拖走后布局不跳
    tray.style.minHeight = tray.offsetHeight + 'px';
    sdk.say(SKY[sky].call);
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-board', 'g-dress');
      next();
    },
    hint() {
      if (done) return;
      const t = [...s.querySelectorAll<HTMLElement>('.dr2-tray .tile:not([data-locked])')]
        .find((x) => goods.some((w) => w.id === x.dataset.id));
      if (!t) return;
      sdk.fx.wiggle(t);
      bear.classList.add('glow');
      sdk.later(() => bear.classList.remove('glow'), 1800);
    },
  };
}
