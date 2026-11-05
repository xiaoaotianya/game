// 它怎么了：小动物 + 场景物品 + 一句小故事，选出它此刻的表情。难度 0/1 = 2/3 张脸
import type { ModuleImpl, SDK, Text } from '@/sdk';
import { h, shuffle, rand } from '@/sdk/dom';
import { iconHtml } from '@/sdk/art';
import { EMOTIONS, emotionOf, faceHtml, playFace, type EmotionId } from '../emotion-cards/face';
import './style.css';

/** 物品的小动效：飘走 / 下雨打雷 / 倒下 / 跳出来 / 蹦蹦跳 / 掉下去 / 被拿走 / 天黑 */
type Fx = 'away' | 'rain' | 'topple' | 'pop' | 'bounce' | 'drop' | 'snatch' | 'night';

interface Story {
  animal: string;
  who: Text;
  prop: string;
  fx: Fx;
  feel: EmotionId;
  story: Text;
  /** 回应 / 安慰 */
  reply: Text;
  /** 容易混淆的表情，不当干扰项 */
  avoid?: EmotionId[];
}

const STORIES: Story[] = [
  {
    animal: 'items/bear', who: { zh: '小熊', en: 'Bear' }, prop: 'ui/balloon', fx: 'away', feel: 'sad',
    story: { zh: '小熊的气球飞走了', en: "Bear's balloon flew away" },
    reply: { zh: '抱一抱它吧', en: "Let's give Bear a hug" }, avoid: ['angry'],
  },
  {
    animal: 'items/bunny', who: { zh: '小兔', en: 'Bunny' }, prop: 'ui/cake', fx: 'bounce', feel: 'happy',
    story: { zh: '小兔收到了生日蛋糕', en: 'Bunny got a birthday cake' },
    reply: { zh: '我们一起唱生日歌吧', en: "Let's sing happy birthday" }, avoid: ['surprised'],
  },
  {
    animal: 'items/chick', who: { zh: '小鸡', en: 'Chick' }, prop: 'items/rain', fx: 'rain', feel: 'scared',
    story: { zh: '轰隆隆，打雷下雨了', en: 'Boom! Thunder and rain' },
    reply: { zh: '别怕别怕，我们陪着你', en: "Don't worry, we're here with you" }, avoid: ['sad', 'surprised'],
  },
  {
    animal: 'items/cat', who: { zh: '小猫', en: 'Cat' }, prop: 'items/blocks', fx: 'topple', feel: 'angry',
    story: { zh: '小猫的积木被推倒了', en: "Someone knocked down Cat's blocks" },
    reply: { zh: '深深吸口气，我们再搭一次', en: "Take a deep breath, let's build again" }, avoid: ['sad'],
  },
  {
    animal: 'items/dog', who: { zh: '小狗', en: 'Puppy' }, prop: '🎁', fx: 'pop', feel: 'surprised',
    story: { zh: '突然跳出来一个大礼物', en: 'A big present popped out' },
    reply: { zh: '哇，快打开看看吧', en: "Wow, let's open it" }, avoid: ['happy', 'scared'],
  },
  {
    animal: 'items/panda', who: { zh: '熊猫', en: 'Panda' }, prop: 'items/bamboo', fx: 'bounce', feel: 'happy',
    story: { zh: '熊猫吃到了好多竹子', en: 'Panda got lots of bamboo' },
    reply: { zh: '真好吃，我们也笑一笑', en: 'Yummy! Let us smile too' }, avoid: ['surprised'],
  },
  {
    animal: 'items/pig', who: { zh: '小猪', en: 'Piggy' }, prop: '🍦', fx: 'drop', feel: 'sad',
    story: { zh: '小猪的冰淇淋掉在地上了', en: "Piggy's ice cream fell down" },
    reply: { zh: '没关系，摸摸它的头', en: "It's okay, let's pat Piggy" }, avoid: ['angry', 'surprised'],
  },
  {
    animal: 'items/monkey', who: { zh: '小猴', en: 'Monkey' }, prop: 'items/banana', fx: 'snatch', feel: 'angry',
    story: { zh: '小猴的香蕉被抢走了', en: "Someone took Monkey's banana" },
    reply: { zh: '我们说：请还给我', en: "Let's say: please give it back" }, avoid: ['sad', 'surprised'],
  },
  {
    animal: 'items/duck', who: { zh: '小鸭', en: 'Duck' }, prop: 'ui/moon', fx: 'night', feel: 'scared',
    story: { zh: '天黑黑，小鸭一个人在外面', en: "It's dark, and Duck is all alone" },
    reply: { zh: '别怕，妈妈来接你啦', en: "Don't be scared, Mommy is coming" }, avoid: ['sad'],
  },
  {
    animal: 'items/frog', who: { zh: '青蛙', en: 'Frog' }, prop: 'ui/rainbow', fx: 'pop', feel: 'surprised',
    story: { zh: '雨停了，天上突然出现一道大彩虹', en: 'The rain stopped, and a big rainbow appeared' },
    reply: { zh: '哇，好漂亮呀', en: 'Wow, so pretty' }, avoid: ['happy'],
  },
];

export default function create(): ModuleImpl {
  let sdk: SDK;
  let s: HTMLElement;
  let last = -1;
  let cur: Story;
  let locked = true;
  let gen = 0; // 轮次号：上一轮的延时回调不再生效

  const ask = (st: Story): Text => ({
    zh: `${st.story.zh}。${st.who.zh}现在是什么心情呢？`,
    en: `${st.story.en}. How does ${st.who.en} feel now?`,
  });

  /** 播放物品动效（重新触发） */
  function playFx(scene: HTMLElement) {
    scene.classList.remove('emo-go');
    void scene.offsetWidth;
    scene.classList.add('emo-go');
  }

  function next() {
    const g = ++gen;
    let k: number;
    do k = rand(STORIES.length);
    while (k === last);
    last = k;
    const st = (cur = STORIES[k]);
    const n = Math.min(3, 2 + sdk.progress.level());
    const pool = shuffle(EMOTIONS.filter((e) => e.id !== st.feel && !st.avoid?.includes(e.id)));
    const opts = shuffle([st.feel, ...pool.slice(0, n - 1).map((e) => e.id)]);
    let mistakes = 0;
    let lastWrong = 0; // 连点同一张错脸（手抖）只算一次
    locked = false;
    s.innerHTML = '';

    // 上：小场景
    const scene = h(`emo-scene emo-fx-${st.fx}`);
    const rain = st.fx === 'rain' ? '<i class="emo-drop"></i>'.repeat(5) + '<span class="emo-bolt emoji">⚡</span>' : '';
    scene.innerHTML =
      `<div class="emo-animal emoji">${iconHtml(st.animal)}<span class="emo-mood"></span></div>` +
      `<div class="emo-prop emoji"><span class="emo-prop-in">${iconHtml(st.prop)}</span>${rain}</div>`;
    const animal = scene.querySelector<HTMLElement>('.emo-animal')!;
    const mood = scene.querySelector<HTMLElement>('.emo-mood')!;
    scene.addEventListener('pointerdown', () => {
      if (locked) return;
      playFx(scene);
      sdk.say(ask(st));
    });

    // 下：表情选项
    const row = h('row emo-opts');
    for (const id of opts) {
      const e = emotionOf(id);
      const t = h('emo-opt', faceHtml(id));
      t.dataset.id = id;
      t.addEventListener('pointerdown', () => {
        if (locked) return;
        const face = t.querySelector('.emo-face')!;
        playFace(face);
        if (id === st.feel) {
          locked = true;
          t.classList.add('emo-right');
          mood.innerHTML = faceHtml(id);
          mood.classList.add('emo-show');
          playFace(animal, id);
          sdk.later(() => g === gen && playFace(mood.firstElementChild!), 450);
          const c = sdk.fx.centerOf(t);
          sdk.fx.burst(c.x, c.y, ['⭐', '✨', '💖'], 10);
          sdk.sfx.ding(2);
          sdk.buzz();
          sdk.progress.round({ mistakes });
          // 等回应读完再庆祝（庆祝会说夸奖的话，提前开始会把回应打断）
          sdk.say(
            {
              zh: `对，${st.who.zh}很${e.name.zh}。${st.reply.zh}`,
              en: `Yes, ${st.who.en} is ${e.name.en}. ${st.reply.en}`,
            },
            () => g === gen && sdk.later(() => g === gen && sdk.reward.celebrate(next), 300),
          );
        } else {
          // 每次点错都算（否则一轮最多记 2 次，难度永远降不下来）
          const now = Date.now();
          if (now - lastWrong > 600) mistakes++;
          lastWrong = now;
          sdk.sfx.boing();
          sdk.fx.wiggle(t);
          playFx(scene);
          sdk.say({
            zh: `这是${e.name.zh}。${ask(st).zh}`,
            en: `This is ${e.name.en}. ${ask(st).en}`,
          });
        }
      });
      row.appendChild(t);
    }
    s.append(scene, row);

    sdk.later(() => g === gen && playFx(scene), 500);
    sdk.say(ask(st));
  }

  return {
    mount(el, api) {
      sdk = api;
      s = el;
      s.classList.add('g-board', 'g-emo', 'g-emo-story');
      next();
    },
    hint() {
      if (locked) return;
      const t = s.querySelector(`.emo-opt[data-id="${cur.feel}"]`);
      if (!t) return;
      t.classList.remove('glow');
      void (t as HTMLElement).offsetWidth;
      t.classList.add('glow');
      sdk.later(() => t.classList.remove('glow'), 1900);
      sdk.say(ask(cur));
    },
  };
}
