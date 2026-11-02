// 一点就填满：选颜料，点画里的一块，颜色从点的位置漾开填满这一块。参数 set = COLORING_SETS 的键
import type { ModuleImpl, SDK } from '@/sdk';
import { h } from '@/sdk/dom';
import { PAINTS } from '@/content/colors';
import { COLORING_SETS, type ColoringPage } from '@/content/coloring-pages';
import './style.css';

const FILL_MS = 380; // 颜色漾开的时间
const MAIN_REGION = 0.003; // 面积占整页这个比例以上、且不挨着边的区域，都涂过才算完成
const MAIN_THICK = 0.025; // ……而且要足够粗（中间有一点离边界都超过这个比例），细条条小孩点不中，不算
const SNAP = 0.07; // 点在线条 / 眼睛上时，往外找最近可涂区域的范围（占整页边长的比例）

interface Regions {
  size: number;
  label: Int32Array; // 每个像素属于哪个区域，0 = 线条
  start: Int32Array; // 区域 i 的像素下标在 pixels[start[i] .. start[i+1]) 里
  pixels: Int32Array;
  main: Map<number, number>; // 需要涂完的主要区域 → 区域里一个靠中间的像素（提示时在这里闪一下）
}

const url = (file: string) => `${import.meta.env.BASE_URL}art/coloring/${file}`;

// 区域图里的颜色是编号，不能做色彩管理或预乘；老 Safari 不支持这些参数时退回 <img>（PNG 不带色彩配置，一般不会被转换）
async function decode(blob: Blob): Promise<{ data: Uint8ClampedArray; size: number }> {
  let src: CanvasImageSource;
  let size: number;
  try {
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    src = bmp;
    size = bmp.width;
  } catch {
    const u = URL.createObjectURL(blob);
    try {
      const im = new Image();
      im.src = u;
      await im.decode();
      src = im;
      size = im.naturalWidth;
    } finally {
      URL.revokeObjectURL(u);
    }
  }
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const cx = cv.getContext('2d', { willReadFrequently: true })!;
  cx.drawImage(src, 0, 0);
  return { data: cx.getImageData(0, 0, size, size).data, size };
}

async function loadRegions(id: string, signal: AbortSignal): Promise<Regions> {
  const res = await fetch(url(`${id}.regions.png`), { signal });
  if (!res.ok) throw new Error(`${id}.regions.png: HTTP ${res.status}`);
  const { data: d, size } = await decode(await res.blob());
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  const N = size * size;
  const label = new Int32Array(N);
  let max = 0;
  for (let i = 0; i < N; i++) {
    const v = d[i * 4] + d[i * 4 + 1] * 256;
    label[i] = v;
    if (v > max) max = v;
  }
  // 按区域分桶，点击时只遍历这一块的像素
  const count = new Int32Array(max + 2);
  for (let i = 0; i < N; i++) count[label[i] + 1]++;
  const start = new Int32Array(max + 2);
  for (let r = 1; r <= max + 1; r++) start[r] = start[r - 1] + count[r];
  const fillAt = start.slice();
  const pixels = new Int32Array(N);
  for (let i = 0; i < N; i++) pixels[fillAt[label[i]]++] = i;

  // 挨着画面边缘的是背景，可以涂但不算在「涂完」里
  const edge = new Set<number>();
  for (let k = 0; k < size; k++) {
    edge.add(label[k]).add(label[N - 1 - k]).add(label[k * size]).add(label[k * size + size - 1]);
  }
  // 「够粗」= 区域里能找到一个点，往上下左右和四个斜角走 k 像素都还在这块里
  const k = Math.round(size * MAIN_THICK), kd = Math.round(k * 0.7);
  const core = (r: number) => {
    for (let j = start[r]; j < start[r + 1]; j++) {
      const p = pixels[j], x = p % size, y = (p / size) | 0;
      if (x < k || y < k || x >= size - k || y >= size - k) continue;
      if (
        label[p - k] === r && label[p + k] === r && label[p - k * size] === r && label[p + k * size] === r &&
        label[p - kd * size - kd] === r && label[p - kd * size + kd] === r &&
        label[p + kd * size - kd] === r && label[p + kd * size + kd] === r
      ) return p;
    }
    return -1;
  };
  const big: number[] = [];
  for (let r = 1; r <= max; r++) {
    if (!edge.has(r) && start[r + 1] - start[r] >= MAIN_REGION * N) big.push(r);
  }
  const main = new Map<number, number>();
  for (const r of big) {
    const p = core(r);
    if (p >= 0) main.set(r, p);
  }
  // 万一一块够粗的都没有，退回只看面积，免得永远涂不完
  if (!main.size) for (const r of big) main.set(r, pixels[(start[r] + start[r + 1]) >> 1]);
  return { size, label, start, pixels, main };
}

// 点在线条上（线条很粗、眼睛是实心的）时，按离得最近的一圈往外找可以涂的区域
function nearestRegion(label: Int32Array, size: number, x: number, y: number): number {
  const at = (xx: number, yy: number) => (xx < 0 || yy < 0 || xx >= size || yy >= size ? 0 : label[yy * size + xx]);
  const R = Math.round(size * SNAP);
  for (let r = 0; r <= R; r++) {
    for (let t = -r; t <= r; t++) {
      const v = at(x + t, y - r) || at(x + t, y + r) || at(x - r, y + t) || at(x + r, y + t);
      if (v) return v;
    }
  }
  return 0;
}

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pages: ColoringPage[] = [];
  let pi = 0;
  let paint = 0;
  let board: HTMLElement;
  let palette: HTMLElement;
  let next: HTMLElement;
  let token = 0;
  let abort: AbortController | undefined;
  let remaining: () => { x: number; y: number } | null = () => null;

  async function show() {
    const my = ++token;
    abort?.abort();
    const ac = (abort = new AbortController());
    remaining = () => null;
    const page = pages[pi % pages.length];
    board.innerHTML = '';
    board.classList.add('loading');
    let reg: Regions;
    try {
      reg = await loadRegions(page.id, ac.signal);
    } catch (err) {
      if (my !== token) return;
      console.error(err);
      // 加载失败（离线、老系统等）：给一个大大的「再试一次」，不让画板卡在半透明的空白里
      board.classList.remove('loading');
      const retry = h('cl-retry emoji', '🔄');
      retry.addEventListener('click', () => show());
      board.appendChild(retry);
      return;
    }
    if (my !== token) return;
    board.classList.remove('loading');

    const { size, label, start, pixels } = reg;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    cv.className = 'cl-fill';
    const cx = cv.getContext('2d')!;
    const img = cx.createImageData(size, size);
    img.data.fill(255);
    cx.putImageData(img, 0, 0);
    const line = document.createElement('img');
    line.className = 'cl-line';
    line.src = url(`${page.id}.png`);
    line.draggable = false;
    board.append(cv, line);
    sdk.say({ zh: `给${page.name.zh}涂上颜色吧`, en: `Let's color the ${page.name.en}!` });

    const colored = new Set<number>();
    const gen = new Int32Array(start.length); // 同一块又点了新颜色时，让还没漾完的旧颜色停下
    let finished = false;

    remaining = () => {
      for (const [r, p] of reg.main) {
        if (colored.has(r)) continue;
        const c = cv.getBoundingClientRect();
        return { x: c.left + ((p % size) + 0.5) / size * c.width, y: c.top + (((p / size) | 0) + 0.5) / size * c.height };
      }
      return null;
    };

    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.min(size - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * size)));
      const y = Math.min(size - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * size)));
      const id = nearestRegion(label, size, x, y);
      if (!id) return;
      fill(id, x, y);
    });

    function fill(id: number, x0: number, y0: number) {
      const hex = PAINTS[paint].hex;
      const R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16);
      // 按离点击位置的距离分桶，逐帧往外画，看起来像颜色漾开
      const a = start[id], b = start[id + 1];
      let maxD = 0;
      const dist = new Uint16Array(b - a);
      let x1 = size, y1 = size, x2 = 0, y2 = 0;
      for (let k = a; k < b; k++) {
        const p = pixels[k], x = p % size, y = (p / size) | 0;
        const dx = x - x0, dy = y - y0;
        const dd = Math.sqrt(dx * dx + dy * dy) | 0;
        dist[k - a] = dd;
        if (dd > maxD) maxD = dd;
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      }
      const bucketStart = new Int32Array(maxD + 2);
      for (let k = 0; k < dist.length; k++) bucketStart[dist[k] + 1]++;
      for (let d = 1; d <= maxD + 1; d++) bucketStart[d] += bucketStart[d - 1];
      const order = new Int32Array(dist.length);
      const at = bucketStart.slice();
      for (let k = 0; k < dist.length; k++) order[at[dist[k]]++] = pixels[a + k];

      const g = ++gen[id];
      const data = img.data;
      const t0 = performance.now();
      let done = 0;
      const step = () => {
        if (my !== token || gen[id] !== g) return;
        const upto = Math.min(maxD + 1, Math.ceil(((performance.now() - t0) / FILL_MS) * (maxD + 1)));
        const end = bucketStart[upto];
        for (let k = done; k < end; k++) {
          const o = order[k] * 4;
          data[o] = R;
          data[o + 1] = G;
          data[o + 2] = B;
        }
        done = end;
        cx.putImageData(img, 0, 0, x1, y1, x2 - x1 + 1, y2 - y1 + 1);
        if (done < order.length) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      sdk.sfx.pop();
      const c = cv.getBoundingClientRect();
      sdk.fx.burst(c.left + (x0 / size) * c.width, c.top + (y0 / size) * c.height, ['✨'], 4);

      if (PAINTS[paint].hex === '#ffffff') colored.delete(id);
      else colored.add(id);
      if (!finished && [...reg.main.keys()].every((m) => colored.has(m))) {
        finished = true;
        sdk.progress.round({ mistakes: 0 });
        // 先夸这一页，说完再放庆祝（庆祝自带的夸奖会打断正在说的话）；翻页后就不再触发
        sdk.later(() => {
          if (my !== token) return;
          sdk.say({ zh: `${page.name.zh}好漂亮！`, en: `What a beautiful ${page.name.en}!` });
          sdk.later(() => {
            if (my !== token) return;
            sdk.reward.celebrate(() => {
              if (my === token) sdk.fx.wiggle(next);
            });
          }, 2200);
        }, FILL_MS + 200);
      }
    }
  }

  function pick(k: number) {
    paint = k;
    palette.querySelectorAll('.cl-paint').forEach((el, i) => el.classList.toggle('on', i === k));
    sdk.sfx.ding(k % 8);
    sdk.say(PAINTS[k]);
  }

  return {
    mount(el, api, { activity }) {
      sdk = api;
      pages = COLORING_SETS[String(activity.params?.set ?? 'animals')];
      el.classList.add('g-coloring');
      board = h('cl-board');
      palette = h('cl-palette');
      PAINTS.forEach((c, k) => {
        const b = h('cl-paint' + (k === paint ? ' on' : ''));
        b.style.setProperty('--c', c.hex);
        b.addEventListener('click', () => pick(k));
        palette.appendChild(b);
      });
      next = h('cl-next round-btn', '<span>▶</span>');
      next.addEventListener('click', () => {
        pi++;
        sdk.sfx.ding(2);
        show();
      });
      el.append(board, palette, next);
      show();
    },
    unmount() {
      token++;
      abort?.abort();
    },
    hint() {
      // 在还没涂的那块上闪一下；画板本身不晃，免得晃动时点歪
      const p = remaining();
      if (p) sdk.fx.burst(p.x, p.y, ['✨', '⭐'], 8);
      else sdk.fx.wiggle(next);
    },
  };
}
