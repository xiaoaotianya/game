// 小车开回家：手指拖着小车沿马路开到房子。指针投影到路径上，只能往前、每次最多前进一小段；
// 离马路太远小车就停下。难度 0/1/2 = 直路 / 一个大弯 / S 弯。路径按屏幕宽高生成，横竖屏不同。
import type { ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick } from '@/sdk/dom';
import { iconHtml, pic } from '@/sdk/art';
import './style.css';

const N = 200; // 路径采样点数
const STEP = 6; // 每次 pointermove 最多前进的采样点数
const SVG = 'http://www.w3.org/2000/svg';
// 插画里车头朝右的车（对照 public/art/items 核对过），其余都朝左
const FACE_RIGHT = new Set(['train', 'bike']);
// 只用在马路上跑的车
const ROAD = new Set(['car', 'bus', 'firetruck', 'police', 'ambulance', 'train', 'bike', 'tractor']);

interface Pt { x: number; y: number }

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let items: PackItem[];
  let it: PackItem;
  let svg: SVGSVGElement;
  let road: SVGPathElement, edge: SVGPathElement, mid: SVGPathElement, trail: SVGPathElement;
  let car: HTMLElement;
  let carIn: HTMLElement;
  let house: HTMLElement;
  let pts: Pt[] = [];
  let len = 0;
  let cur = 0; // 当前所在采样点
  let finish = N - 1; // 到这个采样点就算到家
  let RW = 80; // 路宽
  let held = -1;
  let stalled = false;
  let stalls = 0; // 本轮开出马路的次数，折半计失误
  let lastWarn = 0;
  let done = true;
  let gen = 0;
  let level = 0;
  let faceR: boolean | null = null;

  const el = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS(SVG, tag);

  /** 按屏幕宽高和难度生成路径 */
  function pathD(W: number, H: number, vmin: number): string {
    const land = W > H;
    const hb = Math.min(84, Math.max(52, 11 * vmin));
    const m = Math.max(RW * 0.9, 56);
    const x0 = m, x1 = W - m;
    const y0 = hb + RW * 1.1; // 顶部给返回按钮和房子留位置
    const y1 = H - m;
    const xm = W / 2, ym = (y0 + y1) / 2;
    if (level === 0) return `M${x0},${ym} L${x1},${ym}`;
    if (level === 1) {
      // 横屏：一座拱桥形大弯；竖屏：从左下往上再拐向右上
      return land
        ? `M${x0},${y1} Q${xm},${2 * y0 - y1} ${x1},${y1}`
        : `M${x0 + RW * 0.2},${y1} Q${x0 + RW * 0.2},${y0} ${x1},${y0}`;
    }
    // S 弯：两段二次曲线，第二段用 T 镜像控制点
    if (land) return `M${x0},${ym} Q${x0 + (x1 - x0) / 4},${2 * y0 - ym} ${xm},${ym} T${x1},${ym}`;
    return `M${xm},${y1} Q${2 * x1 - xm},${y1 - (y1 - y0) / 4} ${xm},${ym} T${xm},${y0}`;
  }

  function build() {
    const W = s.clientWidth, H = s.clientHeight;
    const vmin = Math.min(W, H) / 100;
    RW = Math.min(140, Math.max(72, vmin * 17));
    s.style.setProperty('--rw', RW + 'px');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    const d = pathD(W, H, vmin);
    for (const p of [edge, road, mid, trail]) p.setAttribute('d', d);
    edge.setAttribute('stroke-width', String(RW + 10));
    road.setAttribute('stroke-width', String(RW));
    mid.setAttribute('stroke-width', String(Math.max(3, RW * 0.07)));
    mid.setAttribute('stroke-dasharray', `${RW * 0.35} ${RW * 0.3}`);
    trail.setAttribute('stroke-width', String(RW * 0.42));
    len = road.getTotalLength();
    pts = [];
    for (let i = 0; i < N; i++) {
      const p = road.getPointAtLength((len * i) / (N - 1));
      pts.push({ x: p.x, y: p.y });
    }
    // 房子放在终点，小车开到房子跟前就算到家
    const hs = RW * 1.5;
    s.style.setProperty('--hs', hs + 'px');
    const end = pts[N - 1];
    house.style.transform = `translate(${end.x - hs / 2}px,${end.y - hs * 0.62}px)`;
    finish = Math.floor(((len - hs * 0.4) / len) * (N - 1));
    draw();
  }

  function draw() {
    const p = pts[cur];
    const a = pts[Math.max(0, cur - 3)], b = pts[Math.min(N - 1, cur + 3)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    // 车头朝前：往右开时按切线转；往左开时翻转后再转，避免倒着开或者翻跟头。
    // 接近竖直时保持上一次的朝向，免得来回翻
    if (faceR == null || Math.abs(dx) > Math.hypot(dx, dy) * 0.3) faceR = dx >= 0;
    const right = faceR;
    const nativeRight = FACE_RIGHT.has(it?.id);
    const flip = right === nativeRight ? 1 : -1;
    const rot = right ? deg : deg - 180;
    car.style.transform = `translate(${p.x}px,${p.y}px)`;
    carIn.style.transform = `rotate(${rot}deg) scaleX(${flip})`;
    const prog = (len * cur) / (N - 1);
    trail.setAttribute('stroke-dasharray', `${prog} ${len + 10}`);
  }

  function next() {
    gen++;
    done = false;
    cur = 0;
    faceR = null;
    stalled = false;
    stalls = 0;
    held = -1;
    level = Math.min(2, sdk.progress.level());
    const pool = items.filter((x) => x !== it);
    it = pick(pool.length ? pool : items);
    carIn.innerHTML = pic(it);
    car.classList.remove('tr-home', 'tr-pop');
    void car.offsetWidth;
    car.classList.add('tr-pop');
    // 弹出动画放完就去掉，否则它的选择器优先级更高，会盖住 wiggle
    const g0 = gen;
    sdk.later(() => g0 === gen && car.classList.remove('tr-pop'), 450);
    house.classList.remove('on');
    build();
    sdk.say({ zh: `${it.name.zh}要回家啦，拖着它沿着马路开`, en: `The ${it.name.en} wants to go home. Drive it along the road!` });
  }

  function onDown(e: PointerEvent) {
    if (done || held !== -1) return;
    held = e.pointerId;
    try { car.setPointerCapture(held); } catch { /* 忽略 */ }
    car.classList.add('tr-drive');
    s.querySelector('.tr-finger')?.remove();
  }

  function onMove(e: PointerEvent) {
    if (e.pointerId !== held || done) return;
    const r = s.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // 只在当前位置附近找最近点，S 弯两段离得近时不会跳到另一段
    let best = cur, bd = Infinity;
    for (let i = Math.max(0, cur - 8); i <= Math.min(N - 1, cur + 30); i++) {
      const d = Math.hypot(pts[i].x - x, pts[i].y - y);
      if (d < bd) { bd = d; best = i; }
    }
    if (bd > RW * 1.5) {
      if (!stalled) {
        stalled = true;
        stalls++;
        sdk.fx.wiggle(carIn);
        const now = Date.now();
        if (now - lastWarn > 4000) {
          lastWarn = now;
          sdk.sfx.boing();
          sdk.say({ zh: '沿着马路开', en: 'Stay on the road' });
        }
      }
      return;
    }
    stalled = false;
    if (best <= cur) return; // 只许往前
    cur = Math.min(best, cur + STEP);
    draw();
    if (cur >= finish) arrive();
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== held) return;
    held = -1;
    stalled = false;
    car.classList.remove('tr-drive');
  }

  function arrive() {
    done = true;
    held = -1;
    car.classList.remove('tr-drive');
    const g = gen;
    // 开进家门
    cur = N - 1;
    draw();
    car.classList.add('tr-home');
    sdk.sfx.note(440);
    sdk.later(() => g === gen && sdk.sfx.note(440), 220);
    sdk.buzz();
    sdk.later(() => {
      if (g !== gen) return;
      house.classList.add('on');
      sdk.sfx.ding(7);
      const c = sdk.fx.centerOf(house);
      sdk.fx.burst(c.x, c.y, ['✨', '⭐', '💛'], 10);
      // 每辆车用自己的声音（小汽车嘀嘀、火车呜呜……），没有声音的就只说名字；读完再庆祝
      const snd = it.sound;
      const enSnd = snd ? snd.en[0].toUpperCase() + snd.en.slice(1) + '! ' : '';
      sdk.say(
        { zh: `${snd ? snd.zh + '，' : ''}${it.name.zh}到家啦`, en: `${enSnd}The ${it.name.en} is home!` },
        () => g === gen && sdk.reward.celebrate(next),
      );
    }, 450);
    // 偶尔开出去不算，总是开出去才降级
    sdk.progress.round({ mistakes: Math.floor(stalls / 2) });
  }

  function onResize() {
    if (svg) build();
  }

  return {
    mount(root, api, ctx) {
      sdk = api;
      s = root;
      const all = ctx.pack!.items;
      const roadOnes = all.filter((x) => ROAD.has(x.id));
      items = roadOnes.length >= 3 ? roadOnes : all;
      s.classList.add('g-trace');
      svg = el('svg');
      svg.classList.add('tr-svg');
      edge = el('path');
      road = el('path');
      mid = el('path');
      trail = el('path');
      edge.setAttribute('class', 'tr-edge');
      road.setAttribute('class', 'tr-road');
      mid.setAttribute('class', 'tr-mid');
      trail.setAttribute('class', 'tr-trail');
      svg.append(edge, road, trail, mid);
      house = h('tr-house', `<div class="tr-light"></div><div class="tr-house-in emoji">${iconHtml('ui/house')}</div>`);
      carIn = h('tr-car-in emoji');
      car = h('tr-car');
      car.appendChild(carIn);
      s.append(svg, house, car);
      car.addEventListener('pointerdown', onDown);
      car.addEventListener('pointermove', onMove);
      car.addEventListener('pointerup', onUp);
      car.addEventListener('pointercancel', onUp);
      addEventListener('resize', onResize);
      next();
    },
    unmount() {
      removeEventListener('resize', onResize);
    },
    hint() {
      if (done || held !== -1 || s.querySelector('.tr-finger')) return;
      // 手指从小车前方沿着马路往前滑
      const f = h('tr-finger emoji', '👆');
      s.appendChild(f);
      const to = Math.min(N - 1, cur + 45);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const p = pts[Math.round(cur + 4 + ((to - cur - 4) * k) / 8)] ?? pts[to];
        frames.push({ transform: `translate(${p.x}px,${p.y}px)`, opacity: k === 0 || k === 8 ? 0 : 1 });
      }
      f.animate(frames, { duration: 1400, iterations: 2, easing: 'ease-in-out' }).onfinish = () => f.remove();
      sdk.fx.wiggle(carIn);
    },
  };
}
