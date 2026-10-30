// 戳气球：因果认知。气球不断飘上来，戳破后里面的内容跳出来并读出名字
import type { ModuleImpl } from '@/sdk';
import { h, pick } from '@/sdk/dom';
import { callOf } from '@/content/phrases';
import { pic } from '@/sdk/art';
import './style.css';

const COLORS = ['#ff6b81', '#ffb84d', '#ffe066', '#7ed957', '#4dc3ff', '#b28dff', '#ff8fd8'];
const SCALE = [523, 587, 659, 784, 880, 1047];

export default function create(): ModuleImpl {
  return {
    mount(s, sdk, { pack }) {
      const items = pack!.items;
      s.classList.add('g-balloons');
      sdk.say({ zh: '戳一戳气球', en: 'Pop the balloons!' });

      const spawn = () => {
        const max = innerWidth > innerHeight ? 6 : 5;
        if (s.querySelectorAll('.balloon').length < max) {
          const it = pick(items);
          const b = h('balloon', `<div class="body emoji">${pic(it)}</div>`);
          b.style.setProperty('--s', 20 + Math.random() * 9 + 'vmin');
          b.style.setProperty('--c', pick(COLORS));
          b.style.setProperty('--d', 7 + Math.random() * 4 + 's');
          b.style.left = 12 + Math.random() * 76 + '%';
          b.addEventListener('animationend', (e) => {
            if (e.animationName === 'rise') b.remove();
          });
          const body = b.querySelector<HTMLElement>('.body')!;
          body.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (b.dataset.popped) return;
            b.dataset.popped = '1';
            const c = sdk.fx.centerOf(body);
            sdk.sfx.pop();
            sdk.buzz();
            sdk.fx.burst(c.x, c.y, ['✨', '⭐', '🎊'], 10);
            const r = h('reveal emoji', pic(it));
            const sr = s.getBoundingClientRect();
            r.style.left = c.x - sr.left + 'px';
            r.style.top = c.y - sr.top + 'px';
            s.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
            sdk.say(callOf(it));
            b.remove();
          });
          s.appendChild(b);
        }
        sdk.later(spawn, 800 + Math.random() * 700);
      };
      spawn();

      // 点空白处也有反馈
      s.addEventListener('pointerdown', (e) => {
        sdk.fx.burst(e.clientX, e.clientY, ['⭐', '✨'], 6);
        sdk.sfx.note(pick(SCALE));
      });
    },
  };
}
