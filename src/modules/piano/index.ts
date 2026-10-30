// 动物钢琴：C 大调五声音阶，怎么弹都好听；手指滑过琴键可以连续发声
import type { ModuleImpl } from '@/sdk';
import { h, pick } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import './style.css';

const NOTES = [262, 294, 330, 392, 440, 523, 587, 659];
const COLORS = ['#ff6b6b', '#ff922b', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#748ffc', '#da77f2'];
const ANIMALS = ['cat', 'dog', 'chick', 'frog', 'pig', 'bunny', 'bear', 'monkey'].map((id) => iconHtml('items/' + id));

export default function create(): ModuleImpl {
  return {
    mount(s, sdk) {
      s.classList.add('g-piano');
      sdk.say({ zh: '来弹琴吧', en: "Let's play music!" });
      NOTES.forEach((f, i) => {
        const k = h('key', `<span class="emoji">${ANIMALS[i]}</span>`);
        k.style.setProperty('--c', COLORS[i]);
        const play = () => {
          sdk.sfx.note(f);
          sdk.buzz(10);
          k.classList.add('down');
          sdk.later(() => k.classList.remove('down'), 160);
          const c = sdk.fx.centerOf(k.querySelector('.emoji')!);
          sdk.fx.floatUp(c.x, c.y, pick(['🎵', '🎶', ANIMALS[i]]));
        };
        k.addEventListener('pointerdown', (e) => {
          try { k.releasePointerCapture(e.pointerId); } catch { /* 忽略 */ }
          play();
        });
        k.addEventListener('pointerenter', (e) => {
          if (e.buttons || e.pressure > 0) play();
        });
        s.appendChild(k);
      });
    },
  };
}
