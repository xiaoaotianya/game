// 为每次进入的活动创建一个 SDK 实例；离开时 dispose() 统一清理定时器、语音和特效

import { settings, label } from './settings';
import { voice } from './voice';
import { sfx, buzz } from './audio';
import { burst, centerOf, clearFx, draggable, floatUp, flyTo, h, pick, wiggle } from './dom';
import { progress } from './progress';
import { iconHtml } from './art';
import type { Activity, ModuleManifest, SDK, Text } from './types';

export * from './types';

const PRAISE: Text[] = [
  { zh: '太棒了！', en: 'Great job!' },
  { zh: '真厉害！', en: 'Awesome!' },
  { zh: '好聪明呀！', en: 'So smart!' },
  { zh: '你做到啦！', en: 'You did it!' },
];

function praise(): Text {
  const p = pick(PRAISE);
  const n = settings.name;
  if (!n) return p;
  // 英文语音读不了中文名，含中文时英文部分不带名字
  const enName = /[一-龥]/.test(n) ? '' : ', ' + n;
  return { zh: n + p.zh, en: p.en.replace('!', enName + '!') };
}

export function createSDK(manifest: ModuleManifest, activity: Activity) {
  const timers: number[] = [];
  const overlays: HTMLElement[] = [];
  let roundStart = Date.now();

  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  const sdk: SDK = {
    lang: () => settings.lang,
    label,
    say: (t) => voice.say(t),
    sfx,
    buzz,
    later,
    input: { draggable, flyTo },
    fx: { burst, wiggle, centerOf, floatUp },
    reward: {
      celebrate(done) {
        const box = h('celebrate', `<div class="cele-star emoji">${iconHtml(pick(['items/star', 'ui/trophy', 'ui/rainbow', 'ui/balloon']))}</div>`);
        document.body.appendChild(box);
        overlays.push(box);
        sfx.win();
        buzz(40);
        voice.say(praise());
        const w = innerWidth, ht = innerHeight;
        [[w / 2, ht / 2], [w * 0.2, ht * 0.3], [w * 0.8, ht * 0.3], [w * 0.3, ht * 0.75], [w * 0.7, ht * 0.75]].forEach(
          ([x, y], i) => later(() => burst(x, y, ['⭐', '🎉', '💖', '🌈', '✨'], 12), i * 160),
        );
        later(() => {
          box.remove();
          done?.();
        }, 2600);
      },
    },
    progress: {
      level: () => progress.level(activity.id),
      round(r) {
        progress.record(
          {
            activity: activity.id,
            skills: manifest.skills,
            at: Date.now(),
            ms: Date.now() - roundStart,
            mistakes: r.mistakes,
            level: progress.level(activity.id),
          },
          manifest.levels,
        );
        roundStart = Date.now();
      },
    },
  };

  function dispose() {
    timers.forEach(clearTimeout);
    timers.length = 0;
    overlays.forEach((o) => o.remove());
    voice.stop();
    clearFx();
  }

  return { sdk, dispose };
}
