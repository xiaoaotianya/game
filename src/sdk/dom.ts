// 拖拽、飞入、特效等 DOM 工具

import type { DragOptions } from './types';

export const rand = (n: number) => Math.floor(Math.random() * n);
export const pick = <T>(arr: readonly T[]): T => arr[rand(arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 创建 div */
export function h(cls: string, html?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  if (html != null) d.innerHTML = html;
  return d;
}

export function centerOf(node: Element) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const fxLayer = () => document.getElementById('fx')!;

export function burst(x: number, y: number, emojis = ['⭐', '✨', '💖'], count = 8) {
  const layer = fxLayer();
  for (let i = 0; i < count; i++) {
    const p = h('particle emoji', pick(emojis));
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    layer.appendChild(p);
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 60 + Math.random() * 90;
    p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1)`, opacity: 0 },
      ],
      { duration: 750 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' },
    ).onfinish = () => p.remove();
  }
}

export function floatUp(x: number, y: number, emoji: string) {
  const p = h('particle emoji', emoji);
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  fxLayer().appendChild(p);
  p.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 },
      { transform: `translate(calc(-50% + ${(Math.random() - 0.5) * 80}px), calc(-50% - 160px)) scale(1.4)`, opacity: 0 },
    ],
    { duration: 1000, easing: 'ease-out' },
  ).onfinish = () => p.remove();
}

export function clearFx() {
  fxLayer().innerHTML = '';
}

export function wiggle(node: Element) {
  node.classList.remove('wiggle');
  void (node as HTMLElement).offsetWidth;
  node.classList.add('wiggle');
  setTimeout(() => node.classList.remove('wiggle'), 600);
}

/** 把元素移到新父节点，并用 FLIP 动画从原位置飞过去 */
export function flyTo(node: HTMLElement, dest: Element, cls?: string | null, done?: () => void) {
  const a = node.getBoundingClientRect();
  dest.appendChild(node);
  if (cls) node.classList.add(cls);
  node.style.transition = 'none';
  node.style.transform = '';
  const b = node.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const s = b.width ? a.width / b.width : 1;
  node.style.transform = `translate(${dx}px,${dy}px) scale(${s})`;
  void node.offsetWidth;
  node.style.transition = 'transform .4s cubic-bezier(.3,1.4,.5,1)';
  node.style.transform = '';
  setTimeout(() => done?.(), 420);
}

/** 拖拽：目标区域四周放宽 30%，取最近的目标；移动不足 10px 视为点击 */
export function draggable(node: HTMLElement, o: DragOptions) {
  let id: number | null = null;
  let sx = 0, sy = 0, moved = false;
  node.addEventListener('pointerdown', (e) => {
    if (id !== null || node.dataset.locked) return;
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    moved = false;
    try { node.setPointerCapture(id); } catch { /* 忽略 */ }
    node.style.transition = 'none';
    node.classList.add('dragging');
  });
  node.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 10) moved = true;
    node.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    node.classList.remove('dragging');
    if (!moved) {
      node.style.transform = '';
      o.onTap?.();
      return;
    }
    const c = centerOf(node);
    let best: Element | undefined;
    let bestD = Infinity;
    for (const t of o.targets()) {
      const r = t.getBoundingClientRect();
      const px = r.width * 0.3, py = r.height * 0.3;
      if (c.x > r.left - px && c.x < r.right + px && c.y > r.top - py && c.y < r.bottom + py) {
        const tc = centerOf(t);
        const d = Math.hypot(tc.x - c.x, tc.y - c.y);
        if (d < bestD) { bestD = d; best = t; }
      }
    }
    if (best && o.accept(best)) {
      o.onDrop(best);
    } else {
      node.style.transition = 'transform .35s cubic-bezier(.3,1.3,.5,1)';
      node.style.transform = '';
      o.onMiss?.(best);
    }
  };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
}
