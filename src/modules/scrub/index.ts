// 洗刷刷：手指在脏东西上来回擦，擦干净一个"啵"一下，全部干净就庆祝。参数 set = SCRUB_SETS 的键
import type { ModuleImpl, SDK } from '@/sdk';
import { h, rand } from '@/sdk/dom';
import { iconHtml, artUrl } from '@/sdk/art';
import { SCRUB_SETS, type ScrubScene } from '@/content/scrub-scenes';
import './style.css';

const RUB_PX_TO_CLEAN = 260; // 在一块脏东西上累计擦多少像素算擦干净

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let scenes: ScrubScene[] = [];
  let si = 0;
  let tool: HTMLElement;
  let lastSound = 0;

  function next() {
    const sc = scenes[si++ % scenes.length];
    s.querySelector('.sc-wrap')?.remove();
    const wrap = h('sc-wrap');
    const subject = h('sc-subject emoji', iconHtml(sc.subject));
    wrap.appendChild(subject);
    tool.innerHTML = iconHtml(sc.tool);

    // 在主体中间区域随机放 4~6 块脏东西，彼此尽量不重叠
    const count = 4 + rand(3);
    const spots: { x: number; y: number }[] = [];
    while (spots.length < count) {
      const p = { x: 20 + Math.random() * 60, y: 22 + Math.random() * 58 };
      if (spots.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 17) || Math.random() < 0.05) spots.push(p);
    }
    let left = count;
    const dirts = spots.map((p) => {
      const d = h('sc-dirt emoji', iconHtml(sc.dirt));
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      d.style.rotate = rand(60) - 30 + 'deg';
      d.dataset.hp = String(RUB_PX_TO_CLEAN);
      wrap.appendChild(d);
      return d;
    });
    s.appendChild(wrap);
    sdk.say(sc.intro);

    let lx = 0, ly = 0, down = false, bubbleAcc = 0;
    const rub = (x: number, y: number, dist: number) => {
      bubbleAcc += dist;
      if (bubbleAcc > 45) {
        bubbleAcc = 0;
        bubble(x, y);
      }
      for (const d of dirts) {
        if (d.dataset.clean) continue;
        const r = d.getBoundingClientRect();
        const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        if (Math.hypot(c.x - x, c.y - y) > r.width * 0.7) continue;
        const hp = Number(d.dataset.hp) - dist;
        d.dataset.hp = String(hp);
        const k = Math.max(0, hp / RUB_PX_TO_CLEAN);
        d.style.opacity = String(0.15 + 0.85 * k);
        d.style.scale = String(0.6 + 0.4 * k);
        if (hp <= 0) {
          d.dataset.clean = '1';
          d.classList.add('gone');
          sdk.sfx.pop();
          sdk.buzz();
          sdk.fx.burst(c.x, c.y, ['✨', '⭐'], 6);
          if (--left === 0) finish(sc, subject);
        }
      }
    };

    wrap.addEventListener('pointerdown', (e) => {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      moveTool(e.clientX, e.clientY);
      tool.classList.add('on');
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dist = Math.hypot(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
      moveTool(e.clientX, e.clientY);
      if (dist > 0) rub(e.clientX, e.clientY, Math.min(dist, 60));
    });
    const up = () => {
      down = false;
      tool.classList.remove('on');
    };
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('pointerleave', up);
  }

  function moveTool(x: number, y: number) {
    tool.style.left = x + 'px';
    tool.style.top = y + 'px';
  }

  function bubble(x: number, y: number) {
    const b = document.createElement('img');
    b.className = 'sc-bubble';
    b.src = artUrl('items/bubbles');
    b.style.left = x + (Math.random() - 0.5) * 50 + 'px';
    b.style.top = y + (Math.random() - 0.5) * 50 + 'px';
    document.getElementById('fx')!.appendChild(b);
    b.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.95 },
        { transform: `translate(-50%, calc(-50% - ${40 + Math.random() * 50}px)) scale(1)`, opacity: 0 },
      ],
      { duration: 900, easing: 'ease-out' },
    ).onfinish = () => b.remove();
    // 节流：快速擦的时候不要叮叮当当响个不停
    if (Date.now() - lastSound > 180) {
      lastSound = Date.now();
      sdk.sfx.note(900 + Math.random() * 500);
    }
  }

  function finish(sc: ScrubScene, subject: HTMLElement) {
    tool.classList.remove('on');
    subject.classList.add('clean');
    const c = sdk.fx.centerOf(subject);
    sdk.later(() => sdk.fx.burst(c.x, c.y, ['✨', '⭐', '💖'], 14), 200);
    sdk.later(() => sdk.say(sc.done), 400);
    sdk.progress.round({ mistakes: 0 });
    sdk.later(() => sdk.reward.celebrate(next), 2600);
  }

  return {
    mount(el, api, { activity }) {
      sdk = api;
      s = el;
      scenes = SCRUB_SETS[String(activity.params?.set ?? 'bath')];
      s.classList.add('g-scrub');
      tool = h('sc-tool emoji');
      s.appendChild(tool);
      next();
    },
    hint() {
      const d = s.querySelector('.sc-dirt:not(.gone)');
      if (d) sdk.fx.wiggle(d);
    },
  };
}
