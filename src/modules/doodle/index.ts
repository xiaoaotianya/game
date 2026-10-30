// 自由涂鸦：手指随便画（支持多指），有彩虹笔；贴纸模式下点一下贴一个小动物；海绵一键擦干净。
// 内容包 = 贴纸；参数 paper = 纸的底色
import type { ContentPack, ModuleImpl, PackItem, SDK } from '@/sdk';
import { h, pick } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import { PAINTS } from '@/content/colors';
import './style.css';

const RAINBOW = -1;
const STAMP = -2;
const ROUND_ACTIONS = 20; // 每画 / 贴 20 下记一轮

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pack: ContentPack;
  let paper = '#ffffff';
  let tool = 0; // >= 0 是颜料下标
  let cv: HTMLCanvasElement;
  let cx: CanvasRenderingContext2D;
  let tools: HTMLElement;
  let hue = 0;
  let actions = 0;
  let lastNote = 0;
  const images = new Map<string, HTMLImageElement>();
  const strokes = new Map<number, { x: number; y: number }>();
  let ro: ResizeObserver;

  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  const brush = () => Math.max(10, Math.min(cv.width, cv.height) * 0.028);

  function fit() {
    const r = cv.getBoundingClientRect();
    const w = Math.round(r.width * dpr()), hgt = Math.round(r.height * dpr());
    if (!w || !hgt || (w === cv.width && hgt === cv.height)) return;
    // 转屏 / 改尺寸时保留已经画的内容
    const old = document.createElement('canvas');
    old.width = cv.width;
    old.height = cv.height;
    old.getContext('2d')!.drawImage(cv, 0, 0);
    cv.width = w;
    cv.height = hgt;
    cx.fillStyle = paper;
    cx.fillRect(0, 0, w, hgt);
    if (old.width) cx.drawImage(old, 0, 0, w, hgt);
  }

  function pos(e: PointerEvent) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr(), y: (e.clientY - r.top) * dpr() };
  }

  function color() {
    if (tool === RAINBOW) {
      hue = (hue + 4) % 360;
      return `hsl(${hue} 90% 62%)`;
    }
    return PAINTS[tool].hex;
  }

  function dot(x: number, y: number) {
    cx.fillStyle = color();
    cx.beginPath();
    cx.arc(x, y, brush() / 2, 0, Math.PI * 2);
    cx.fill();
  }

  function stamp(x: number, y: number) {
    const it: PackItem = pick(pack.items.filter((i) => i.image));
    const img = images.get(it.id);
    if (!img?.complete) return;
    const s = Math.min(cv.width, cv.height) * 0.22;
    cx.save();
    cx.translate(x, y);
    cx.rotate((Math.random() - 0.5) * 0.5);
    cx.drawImage(img, -s / 2, -s / 2, s, s);
    cx.restore();
    sdk.sfx.pop();
    sdk.say(it.name);
    count();
  }

  function count() {
    if (++actions % ROUND_ACTIONS === 0) sdk.progress.round({ mistakes: 0 });
  }

  function select(t: number) {
    tool = t;
    tools.querySelectorAll<HTMLElement>('[data-tool]').forEach((el) => el.classList.toggle('on', Number(el.dataset.tool) === t));
    sdk.sfx.ding(t < 0 ? 6 : t % 8);
    if (t >= 0) sdk.say(PAINTS[t]);
    else if (t === RAINBOW) sdk.say({ zh: '彩虹笔', en: 'Rainbow!' });
    else sdk.say({ zh: '贴贴纸', en: 'Stickers!' });
  }

  function clear() {
    sdk.sfx.boing();
    cv.classList.add('wipe');
    sdk.later(() => {
      cx.fillStyle = paper;
      cx.fillRect(0, 0, cv.width, cv.height);
      cv.classList.remove('wipe');
      sdk.say({ zh: '擦干净啦，再画一张吧', en: 'All clean! Draw again!' });
    }, 450);
  }

  return {
    mount(el, api, { pack: p, activity }) {
      sdk = api;
      pack = p!;
      paper = String(activity.params?.paper ?? '#ffffff');
      for (const it of pack.items) {
        if (!it.image) continue;
        const img = new Image();
        img.src = it.image;
        images.set(it.id, img);
      }

      el.classList.add('g-doodle');
      cv = document.createElement('canvas');
      cv.className = 'dd-paper';
      cx = cv.getContext('2d')!;
      tools = h('dd-tools');
      PAINTS.slice(0, 9).forEach((c, k) => {
        const b = h('dd-tool dd-paint');
        b.style.setProperty('--c', c.hex);
        b.dataset.tool = String(k);
        tools.appendChild(b);
      });
      const rainbow = h('dd-tool dd-rainbow');
      rainbow.dataset.tool = String(RAINBOW);
      const first = pack.items.find((i) => i.image);
      const sticker = h('dd-tool dd-icon emoji', iconHtml(first ? 'items/' + first.id : 'items/star'));
      sticker.dataset.tool = String(STAMP);
      const sponge = h('dd-tool dd-icon emoji', iconHtml('items/sponge'));
      tools.append(rainbow, sticker, sponge);
      tools.addEventListener('click', (e) => {
        const t = (e.target as HTMLElement).closest<HTMLElement>('.dd-tool');
        if (!t) return;
        if (t === sponge) clear();
        else select(Number(t.dataset.tool));
      });
      tools.querySelector('[data-tool="0"]')!.classList.add('on');
      el.append(cv, tools);

      ro = new ResizeObserver(fit);
      ro.observe(cv);
      fit();

      cv.addEventListener('pointerdown', (e) => {
        cv.setPointerCapture(e.pointerId);
        const p = pos(e);
        if (tool === STAMP) {
          stamp(p.x, p.y);
          return;
        }
        strokes.set(e.pointerId, p);
        dot(p.x, p.y);
        sdk.sfx.pop();
      });
      cv.addEventListener('pointermove', (e) => {
        const last = strokes.get(e.pointerId);
        if (!last) return;
        const p = pos(e);
        cx.strokeStyle = color();
        cx.lineCap = 'round'; // 每次都设：画布改尺寸会重置画笔状态
        cx.lineWidth = brush();
        cx.beginPath();
        cx.moveTo(last.x, last.y);
        cx.lineTo(p.x, p.y);
        cx.stroke();
        strokes.set(e.pointerId, p);
        // 画的时候轻轻响，越往上音越高
        if (performance.now() - lastNote > 160) {
          lastNote = performance.now();
          sdk.sfx.note(500 + (1 - p.y / cv.height) * 700);
        }
      });
      const end = (e: PointerEvent) => {
        if (strokes.delete(e.pointerId)) count();
      };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);

      sdk.say({ zh: '用手指画画吧', en: "Let's draw with your finger!" });
    },
    unmount() {
      ro?.disconnect();
    },
    hint() {
      sdk.fx.wiggle(tools.querySelector('.dd-rainbow')!);
    },
  };
}
