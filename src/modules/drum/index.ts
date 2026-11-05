// 小鼓手：大鼓、小鼓、镲、沙锤。
// mode=free 自由敲，小动物跟着跳舞；mode=echo「跟我敲」：先演示一段节奏，宝宝照着敲。难度 0/1/2 = 2/3/4 下
import type { DrumKind, ModuleImpl, SDK } from '@/sdk';
import { h, pick, rand, shuffle } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import './style.css';

const INSTR: { kind: DrumKind; zh: string; en: string }[] = [
  { kind: 'big', zh: '大鼓', en: 'big drum' },
  { kind: 'snare', zh: '小鼓', en: 'snare drum' },
  { kind: 'cymbal', zh: '镲', en: 'cymbal' },
  { kind: 'shaker', zh: '沙锤', en: 'shaker' },
];
const DANCERS = ['bear', 'bunny', 'monkey', 'cat', 'dog', 'panda', 'chick', 'frog'].map((id) => iconHtml('items/' + id));
const GAP = 650;
/** 跟我敲时，两次判定之间至少间隔这么久，手掌拍一下的多个触点只算一下 */
const SLAP_MS = 120;

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let echo = false;
  let pads: HTMLElement[] = [];
  let dancer: HTMLElement;
  let hits = 0;
  // echo 状态
  let seq: number[] = [];
  let pos = 0;
  let locked = false;
  let mistakes = 0;
  const touching = new Set<number>();
  let lastJudge = 0;

  function strike(i: number) {
    const p = pads[i];
    sdk.sfx.drum(INSTR[i].kind);
    sdk.buzz(12);
    p.classList.remove('hit');
    void p.offsetWidth;
    p.classList.add('hit');
    dancer.classList.remove('jump');
    void dancer.offsetWidth;
    dancer.classList.add('jump');
    const c = sdk.fx.centerOf(p);
    sdk.fx.floatUp(c.x, c.y, pick(['🎵', '🎶', '✨']));
  }

  function tap(i: number, extra: boolean) {
    if (locked) return;
    if (!echo) {
      strike(i);
      if (++hits % 8 === 0) dancer.innerHTML = pick(DANCERS);
      return;
    }
    // 第二根手指 / 手掌的其余触点：不出声、不判定
    const now = Date.now();
    if (extra || now - lastJudge < SLAP_MS) return;
    lastJudge = now;
    strike(i);
    if (!seq.length) return;
    if (i === seq[pos]) {
      pads[i].classList.add('ok');
      sdk.later(() => pads[i].classList.remove('ok'), 300);
      if (++pos === seq.length) {
        locked = true;
        sdk.progress.round({ mistakes });
        sdk.later(() => sdk.reward.celebrate(newRound), 500);
      }
    } else {
      mistakes++;
      locked = true;
      sdk.later(() => {
        sdk.sfx.boing();
        sdk.fx.wiggle(pads[i]);
        sdk.say({ zh: '再听一遍', en: 'Listen again' });
      }, 250);
      sdk.later(demo, 1600);
    }
  }

  function demo() {
    locked = true;
    pos = 0;
    s.classList.add('listen');
    seq.forEach((i, k) => {
      sdk.later(() => {
        strike(i);
        pads[i].classList.add('lit');
        sdk.later(() => pads[i].classList.remove('lit'), GAP - 150);
      }, 400 + k * GAP);
    });
    sdk.later(() => {
      locked = false;
      s.classList.remove('listen');
      sdk.say({ zh: '轮到你啦', en: 'Your turn!' });
    }, 400 + seq.length * GAP + 200);
  }

  function newRound() {
    const len = 2 + sdk.progress.level();
    mistakes = 0;
    locked = true;
    // 用到的乐器不超过 3 种，避免太难
    const pool = shuffle([0, 1, 2, 3]).slice(0, len <= 2 ? 2 : 3);
    seq = Array.from({ length: len }, () => pool[rand(pool.length)]);
    if (seq.every((x) => x === seq[0])) seq[seq.length - 1] = pool.find((x) => x !== seq[0])!;
    dancer.innerHTML = pick(DANCERS);
    sdk.say({ zh: '听我敲', en: 'Listen to me' });
    sdk.later(demo, 900);
  }

  return {
    mount(el, api, ctx) {
      sdk = api;
      s = el;
      echo = ctx.activity.params?.mode === 'echo';
      s.classList.add('g-drum');
      // 记录按在屏幕上的手指（捕获阶段先于乐器的处理）
      s.addEventListener('pointerdown', (e) => touching.add(e.pointerId), true);
      const lift = (e: PointerEvent) => touching.delete(e.pointerId);
      s.addEventListener('pointerup', lift);
      s.addEventListener('pointercancel', lift);
      s.addEventListener('pointerleave', lift);
      dancer = h('dr-dancer emoji', pick(DANCERS));
      const kit = h('dr-kit');
      pads = INSTR.map((ins, i) => {
        const p = h(`dr-pad dr-${ins.kind}`, '<div class="dr-shape"></div>');
        p.addEventListener('pointerdown', (e) => {
          try { p.releasePointerCapture(e.pointerId); } catch { /* 忽略 */ }
          tap(i, touching.size > 1);
        });
        kit.appendChild(p);
        return p;
      });
      s.append(dancer, kit);
      if (echo) {
        newRound();
      } else {
        sdk.say({ zh: '咚咚咚，来敲鼓吧', en: "Boom boom! Let's play the drums" });
      }
    },
    hint() {
      if (echo) {
        if (!locked && seq.length) {
          const p = pads[seq[pos]];
          p.classList.add('glow');
          sdk.later(() => p.classList.remove('glow'), 1800);
        }
        return;
      }
      const p = pick(pads);
      p.classList.add('glow');
      sdk.later(() => p.classList.remove('glow'), 1800);
    },
  };
}
