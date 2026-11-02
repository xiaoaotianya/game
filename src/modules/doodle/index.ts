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
  let pen = 0; // 最近选的笔（颜料下标或 RAINBOW）：画到一半切到贴纸，这一笔接着用它
  let cv: HTMLCanvasElement;
  let cx: CanvasRenderingContext2D;
  let tools: HTMLElement;
  let hue = 0;
  let actions = 0;
  let lastNote = 0;
  const images = new Map<string, HTMLImageElement>();
  const strokes = new Map<number, { x: number; y: number }>();
  let ro: ResizeObserver;
  let wiping = false;
  // 转屏前的画：只在转屏后又画过才重新截一张，来回转屏不会越转越糊
  let snap: HTMLCanvasElement | null = null;
  let dirty = false;

  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  const brush = () => Math.max(10, Math.min(cv.width, cv.height) * 0.028);

  function fit() {
    const r = cv.getBoundingClientRect();
    const w = Math.round(r.width * dpr()), hgt = Math.round(r.height * dpr());
    if (!w || !hgt || (w === cv.width && hgt === cv.height)) return;
    // 转屏 / 改尺寸时保留已经画的内容：等比缩放、居中，不拉变形
    if (dirty) {
      snap = document.createElement('canvas');
      snap.width = cv.width;
      snap.height = cv.height;
      snap.getContext('2d')!.drawImage(cv, 0, 0);
      dirty = false;
    }
    cv.width = w;
    cv.height = hgt;
    cx.fillStyle = paper;
    cx.fillRect(0, 0, w, hgt);
    if (snap) {
      const k = Math.min(w / snap.width, hgt / snap.height);
      const dw = snap.width * k, dh = snap.height * k;
      cx.drawImage(snap, (w - dw) / 2, (hgt - dh) / 2, dw, dh);
    }
  }

  function pos(e: PointerEvent) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr(), y: (e.clientY - r.top) * dpr() };
  }

  function color() {
    if (pen === RAINBOW) {
      hue = (hue + 4) % 360;
      return `hsl(${hue} 90% 62%)`;
    }
    return PAINTS[pen].hex;
  }

  function dot(x: number, y: number) {
    cx.fillStyle = color();
    cx.beginPath();
    cx.arc(x, y, brush() / 2, 0, Math.PI * 2);
    cx.fill();
    dirty = true;
  }

  function stamp(x: number, y: number) {
    // 只从已经加载好的贴纸里挑（加载失败的图 complete 也是 true，要看 naturalWidth）
    const ready = pack.items.filter((i) => {
      const im = i.image && images.get(i.id);
      return im && im.complete && im.naturalWidth > 0;
    });
    if (!ready.length) return;
    const it: PackItem = pick(ready);
    const img = images.get(it.id)!;
    const s = Math.min(cv.width, cv.height) * 0.22;
    cx.save();
    try {
      cx.translate(x, y);
      cx.rotate((Math.random() - 0.5) * 0.5);
      cx.drawImage(img, -s / 2, -s / 2, s, s);
    } finally {
      cx.restore();
    }
    dirty = true;
    sdk.sfx.pop();
    sdk.say(it.name);
    count();
  }

  function count() {
    if (++actions % ROUND_ACTIONS === 0) sdk.progress.round({ mistakes: 0 });
  }

  function select(t: number) {
    tool = t;
    if (t !== STAMP) pen = t;
    tools.querySelectorAll<HTMLElement>('[data-tool]').forEach((el) => el.classList.toggle('on', Number(el.dataset.tool) === t));
    sdk.sfx.ding(t < 0 ? 6 : t % 8);
    if (t >= 0) sdk.say(PAINTS[t]);
    else if (t === RAINBOW) sdk.say({ zh: '彩虹笔', en: 'Rainbow!' });
    else sdk.say({ zh: '贴贴纸', en: 'Stickers!' });
  }

  function clear() {
    if (wiping) return; // 连点海绵只擦一次
    wiping = true;
    sdk.sfx.boing();
    cv.classList.add('wipe');
    sdk.later(() => {
      wiping = false;
      cx.fillStyle = paper;
      cx.fillRect(0, 0, cv.width, cv.height);
      snap = null;
      dirty = false;
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
      tools.append(rainbow, sticker);
      tools.addEventListener('click', (e) => {
        const t = (e.target as HTMLElement).closest<HTMLElement>('.dd-tool');
        if (t) select(Number(t.dataset.tool));
      });
      tools.querySelector('[data-tool="0"]')!.classList.add('on');
      // 海绵会擦掉整张画，单独放在右上角，不和颜料、贴纸挨着，免得误点
      const sponge = h('dd-clear round-btn emoji', iconHtml('items/sponge'));
      sponge.addEventListener('click', clear);
      el.append(cv, tools, sponge);

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
        dirty = true;
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
