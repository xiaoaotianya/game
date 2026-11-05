// 表情卡片：一次一张大脸卡，左右滑动或点两侧箭头换卡；点脸做动作并读出名字和说明
import type { ModuleImpl, SDK } from '@/sdk';
import { h, shuffle } from '@/sdk/dom';
import { EMOTIONS, faceHtml, playFace, type Emotion } from './face';
import './style.css';

const ROUND_SIZE = 5; // 每看 5 张记一轮

export default function create(): ModuleImpl {
  let sdk: SDK;
  let root: HTMLElement;
  let holder: HTMLElement;
  let order: Emotion[] = [];
  let i = 0;
  let seen = 0;
  let current: HTMLElement | null = null;
  let tapped = false; // 当前这张有没有点过脸（hint 用）

  const sayCard = (e: Emotion) => sdk.say(e.name);

  function tap() {
    if (!current) return;
    const e = order[i];
    const face = current.querySelector('.emo-face')!;
    tapped = true;
    playFace(face);
    const c = sdk.fx.centerOf(face);
    sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 8);
    sdk.sfx.pop();
    sdk.say({ zh: `${e.name.zh}。${e.explain.zh}`, en: `${e.name.en}. ${e.explain.en}` });
  }

  function render(dir: 1 | -1 | 0) {
    const e = order[i];
    const card = h('emo-card');
    card.style.setProperty('--c', e.color);
    const sub = sdk.lang() === 'both' ? `<div class="emo-sub">${e.name.en}</div>` : '';
    card.innerHTML = `<div class="emo-big">${faceHtml(e.id)}</div><div class="emo-name">${sdk.label(e.name)}</div>${sub}`;

    const old = current;
    if (old) {
      old.classList.add(dir > 0 ? 'emo-out-left' : 'emo-out-right');
      sdk.later(() => old.remove(), 400);
    }
    if (dir) card.classList.add(dir > 0 ? 'emo-in-right' : 'emo-in-left');
    holder.appendChild(card);
    current = card;
    tapped = false;
    sayCard(e);

    if (++seen % ROUND_SIZE === 0) {
      sdk.progress.round({ mistakes: 0 });
      // 等名字读完再庆祝
      sdk.later(() => sdk.reward.celebrate(), 1500);
    }
  }

  function go(dir: 1 | -1) {
    i = (i + dir + order.length) % order.length;
    // 一圈看完重新洗牌（避免和刚看过的那张重复）
    if (i === 0 && dir > 0) {
      const last = order[order.length - 1];
      do order = shuffle(EMOTIONS);
      while (order[0] === last);
    }
    sdk.sfx.ding(dir > 0 ? 2 : 0);
    render(dir);
  }

  return {
    mount(el, api) {
      sdk = api;
      root = el;
      order = shuffle(EMOTIONS);
      el.classList.add('g-emo', 'g-emo-cards');
      holder = h('emo-holder');
      const prev = h('emo-nav emo-prev', '<i class="emo-chev"></i>');
      const next = h('emo-nav emo-next', '<i class="emo-chev"></i>');
      prev.addEventListener('pointerdown', () => go(-1));
      next.addEventListener('pointerdown', () => go(1));
      el.append(prev, holder, next);

      // 左右滑动换卡；几乎没动就算点了一下
      let sx = 0, sy = 0, pid: number | null = null;
      holder.addEventListener('pointerdown', (e) => {
        if (pid !== null) return;
        pid = e.pointerId;
        sx = e.clientX;
        sy = e.clientY;
        try { holder.setPointerCapture(pid); } catch { /* 忽略 */ }
      });
      const end = (e: PointerEvent) => {
        if (e.pointerId !== pid) return;
        pid = null;
        if (e.type === 'pointercancel') return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (Math.hypot(dx, dy) < 20) tap();
      };
      holder.addEventListener('pointerup', end);
      holder.addEventListener('pointercancel', end);
      render(0);
    },
    hint() {
      // 还没点过脸：脸动一下吸引注意；点过了：提示可以翻下一张
      if (!tapped && current) {
        const face = current.querySelector('.emo-face');
        if (face) playFace(face);
        sayCard(order[i]);
      } else {
        sdk.fx.wiggle(root.querySelector('.emo-next')!);
      }
    },
  };
}
