// 一点就填满：选颜料，点画里的一块，颜色从点的位置漾开填满这一块。参数 set = COLORING_SETS 的键
import type { ModuleImpl, SDK } from '@/sdk';
import { h } from '@/sdk/dom';
import { PAINTS } from '@/content/colors';
import { COLORING_SETS, type ColoringPage } from '@/content/coloring-pages';
import './style.css';

const FILL_MS = 380; // 颜色漾开的时间
const MAIN_REGION = 0.003; // 面积占整页这个比例以上、且不挨着边的区域，都涂过才算完成

interface Regions {
  size: number;
  label: Int32Array; // 每个像素属于哪个区域，0 = 线条
  start: Int32Array; // 区域 i 的像素下标在 pixels[start[i] .. start[i+1]) 里
  pixels: Int32Array;
  main: number[]; // 需要涂完的主要区域
}

const url = (file: string) => `${import.meta.env.BASE_URL}art/coloring/${file}`;

async function loadRegions(id: string): Promise<Regions> {
  const blob = await (await fetch(url(`${id}.regions.png`))).blob();
  // 区域图里的颜色是编号，不能做色彩管理或预乘
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const size = bmp.width;
  const cv = new OffscreenCanvas(size, size);
  const cx = cv.getContext('2d', { willReadFrequently: true })!;
  cx.drawImage(bmp, 0, 0);
  const d = cx.getImageData(0, 0, size, size).data;
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
  const main: number[] = [];
  for (let r = 1; r <= max; r++) {
    if (!edge.has(r) && start[r + 1] - start[r] >= MAIN_REGION * N) main.push(r);
  }
  return { size, label, start, pixels, main };
}

export default function create(): ModuleImpl {
  let sdk: SDK;
  let pages: ColoringPage[] = [];
  let pi = 0;
  let paint = 0;
  let board: HTMLElement;
  let palette: HTMLElement;
  let token = 0;

  async function show() {
    const my = ++token;
    const page = pages[pi % pages.length];
    board.innerHTML = '';
    board.classList.add('loading');
    const reg = await loadRegions(page.id);
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
    let finished = false;

    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * size);
      const y = Math.floor(((e.clientY - r.top) / r.height) * size);
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
        const dd = Math.hypot(x - x0, y - y0) | 0;
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

      const data = img.data;
      const t0 = performance.now();
      let done = 0;
      const step = () => {
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
        if (done < order.length && my === token) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      sdk.sfx.pop();
      const c = cv.getBoundingClientRect();
      sdk.fx.burst(c.left + (x0 / size) * c.width, c.top + (y0 / size) * c.height, ['✨'], 4);

      if (PAINTS[paint].hex === '#ffffff') colored.delete(id);
      else colored.add(id);
      if (!finished && reg.main.length && reg.main.every((m) => colored.has(m))) {
        finished = true;
        sdk.progress.round({ mistakes: 0 });
        sdk.later(() => {
          sdk.say({ zh: `${page.name.zh}好漂亮！`, en: `What a beautiful ${page.name.en}!` });
          sdk.reward.celebrate(() => sdk.fx.wiggle(document.querySelector('.cl-next')!));
        }, FILL_MS + 200);
      }
    }
  }

  // 点在线条上时，就近找一块可以涂的区域
  function nearestRegion(label: Int32Array, size: number, x: number, y: number): number {
    for (let r = 0; r <= 14; r += 2) {
      for (let dy = -r; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx += 2) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          const v = label[yy * size + xx];
          if (v) return v;
        }
      }
    }
    return 0;
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
      const next = h('cl-next round-btn', '<span>▶</span>');
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
    },
    hint() {
      sdk.fx.wiggle(board);
    },
  };
}
