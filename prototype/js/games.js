// 游戏列表。每个游戏：{ id, icon, color, name:{zh,en}, start(api), hint?() }
// api 由 app.js 提供：stage / say / later / celebrate
'use strict';

const ANIMALS = [
  { e: '🐱', zh: '小猫', en: 'cat', szh: '喵喵', sen: 'meow' },
  { e: '🐶', zh: '小狗', en: 'dog', szh: '汪汪', sen: 'woof woof' },
  { e: '🐮', zh: '奶牛', en: 'cow', szh: '哞', sen: 'moo' },
  { e: '🐷', zh: '小猪', en: 'pig', szh: '哼哼', sen: 'oink oink' },
  { e: '🐸', zh: '青蛙', en: 'frog', szh: '呱呱', sen: 'ribbit' },
  { e: '🐥', zh: '小鸡', en: 'chick', szh: '叽叽', sen: 'tweet tweet' },
  { e: '🦆', zh: '鸭子', en: 'duck', szh: '嘎嘎', sen: 'quack quack' },
  { e: '🐑', zh: '小羊', en: 'sheep', szh: '咩咩', sen: 'baa' },
  { e: '🐵', zh: '小猴', en: 'monkey', szh: '吱吱', sen: 'ooh ooh' },
  { e: '🦁', zh: '狮子', en: 'lion', szh: '嗷呜', sen: 'roar' },
  { e: '🐘', zh: '大象', en: 'elephant' },
  { e: '🐰', zh: '小兔', en: 'bunny' },
  { e: '🐻', zh: '小熊', en: 'bear' },
  { e: '🐼', zh: '熊猫', en: 'panda' },
  { e: '🐧', zh: '企鹅', en: 'penguin' },
  { e: '🦒', zh: '长颈鹿', en: 'giraffe' },
];

const animalName = (a) => ({ zh: a.zh, en: a.en });
const animalCall = (a) => ({
  zh: a.zh + (a.szh ? '，' + a.szh : ''),
  en: a.en + (a.sen ? ', ' + a.sen : ''),
});

const Games = [];

// ===================== 1. 戳气球（因果） =====================
Games.push({
  id: 'balloons', icon: '🎈', color: '#ffd1dc',
  name: { zh: '戳气球', en: 'Balloons' },
  start(api) {
    const s = api.stage;
    s.className = 'g-balloons';
    const colors = ['#ff6b81', '#ffb84d', '#ffe066', '#7ed957', '#4dc3ff', '#b28dff', '#ff8fd8'];
    api.say({ zh: '戳一戳气球', en: 'Pop the balloons!' });

    const spawn = () => {
      const max = innerWidth > innerHeight ? 6 : 5;
      if (s.querySelectorAll('.balloon').length < max) {
        const a = pick(ANIMALS);
        const b = el('balloon');
        const size = 20 + Math.random() * 9;
        b.style.setProperty('--s', size + 'vmin');
        b.style.setProperty('--c', pick(colors));
        b.style.setProperty('--d', (7 + Math.random() * 4) + 's');
        b.style.left = (12 + Math.random() * 76) + '%';
        b.innerHTML = `<div class="body emoji">${a.e}</div>`;
        b.addEventListener('animationend', (e) => { if (e.animationName === 'rise') b.remove(); });
        b.querySelector('.body').addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (b.dataset.popped) return;
          b.dataset.popped = 1;
          const c = centerOf(b.querySelector('.body'));
          Sound.pop(); buzz();
          burst(c.x, c.y, ['✨', '⭐', '🎊'], 10);
          const r = el('reveal emoji', a.e);
          const sr = s.getBoundingClientRect();
          r.style.left = (c.x - sr.left) + 'px';
          r.style.top = (c.y - sr.top) + 'px';
          s.appendChild(r);
          r.addEventListener('animationend', () => r.remove());
          api.say(animalCall(a));
          b.remove();
        });
        s.appendChild(b);
      }
      api.later(spawn, 800 + Math.random() * 700);
    };
    spawn();

    // 点空白处也有反馈
    const scale = [523, 587, 659, 784, 880, 1047];
    s.addEventListener('pointerdown', (e) => {
      burst(e.clientX, e.clientY, ['⭐', '✨'], 6);
      Sound.note(pick(scale));
    });
  },
});

// ===================== 2. 找影子（认知配对） =====================
Games.push({
  id: 'shadow', icon: '🐼', color: '#d6f5d6',
  name: { zh: '找影子', en: 'Shadows' },
  start(api) {
    this.api = api;
    this.round = 0;
    api.say({ zh: '帮小动物找到自己的影子', en: 'Help the animals find their shadows' });
    this.next();
  },
  next() {
    const api = this.api, s = api.stage;
    const n = this.round < 2 ? 2 : 3;
    s.innerHTML = '';
    s.className = 'g-board';
    const picks = shuffle(ANIMALS).slice(0, n);
    const top = el('row'), bot = el('row');
    shuffle(picks).forEach((a) => {
      const slot = el('slot', `<span class="emoji sil">${a.e}</span>`);
      slot.dataset.id = a.e;
      top.appendChild(slot);
    });
    let left = n;
    shuffle(picks).forEach((a) => {
      const t = el('tile emoji', a.e);
      bot.appendChild(t);
      draggable(t, {
        targets: () => [...top.children].filter((x) => !x.classList.contains('done')),
        accept: (x) => x.dataset.id === a.e,
        onTap: () => api.say(animalName(a)),
        onDrop: (x) => {
          t.dataset.locked = 1;
          x.classList.add('done');
          flyTo(t, x);
          Sound.ding(n - left); buzz();
          api.say(animalCall(a));
          if (--left === 0) api.later(() => api.celebrate(() => { this.round++; this.next(); }), 1200);
        },
        onMiss: (x) => { if (x) { Sound.boing(); wiggle(t); } },
      });
    });
    s.append(top, bot);
  },
  hint() {
    const s = this.api.stage;
    const t = s.querySelector('.tile:not([data-locked])');
    if (!t) return;
    const slot = [...s.querySelectorAll('.slot')].find((x) => x.dataset.id === t.textContent);
    wiggle(t);
    if (slot) { slot.classList.add('glow'); setTimeout(() => slot.classList.remove('glow'), 1800); }
  },
});

// ===================== 3. 颜色分类 =====================
const COLORS = {
  red: { zh: '红色', en: 'red', c: '#ff6b6b', items: ['🍎', '🍓', '🍒', '🚒', '🌹', '🍅'] },
  yellow: { zh: '黄色', en: 'yellow', c: '#ffd43b', items: ['🍌', '🌻', '🐥', '🌽', '🍋', '⭐'] },
  blue: { zh: '蓝色', en: 'blue', c: '#4dabf7', items: ['🐳', '👖', '🧢', '💎', '🦋', '💧'] },
  green: { zh: '绿色', en: 'green', c: '#69db7c', items: ['🍏', '🥦', '🐸', '🍀', '🥒', '🌲'] },
};

Games.push({
  id: 'colors', icon: '🎨', color: '#fff3bf',
  name: { zh: '颜色分类', en: 'Colors' },
  start(api) {
    this.api = api;
    this.round = 0;
    api.say({ zh: '把颜色一样的放进同色的篮子', en: 'Put each one in the basket with the same color' });
    this.next();
  },
  next() {
    const api = this.api, s = api.stage;
    const nC = this.round < 2 ? 2 : 3;
    s.innerHTML = '';
    s.className = 'g-board g-colors';
    const keys = shuffle(Object.keys(COLORS)).slice(0, nC);
    if (this.round > 0) api.say({ zh: '颜色分一分', en: 'Sort the colors' });

    const top = el('row'), bot = el('row');
    keys.forEach((k) => {
      const b = el('basket', '<div class="bin"></div>');
      b.dataset.c = k;
      b.style.setProperty('--c', COLORS[k].c);
      top.appendChild(b);
    });
    const items = shuffle(keys.flatMap((k) => shuffle(COLORS[k].items).slice(0, 2).map((e) => ({ e, k }))));
    let left = items.length;
    items.forEach(({ e, k }) => {
      const C = COLORS[k];
      const t = el('tile emoji', e);
      bot.appendChild(t);
      draggable(t, {
        targets: () => [...top.children],
        accept: (b) => b.dataset.c === k,
        onTap: () => api.say({ zh: C.zh, en: C.en }),
        onDrop: (b) => {
          t.dataset.locked = 1;
          flyTo(t, b.querySelector('.bin'), 'small');
          Sound.ding(items.length - left); buzz();
          api.say({ zh: C.zh, en: C.en });
          if (--left === 0) api.later(() => api.celebrate(() => { this.round++; this.next(); }), 900);
        },
        onMiss: (b) => {
          if (!b) return;
          Sound.boing(); wiggle(t);
          api.say({ zh: `这是${C.zh}的哦`, en: `This one is ${C.en}` });
        },
      });
    });
    s.append(top, bot);
  },
  hint() {
    const s = this.api.stage;
    const t = s.querySelector('.row:last-child .tile');
    if (t) wiggle(t);
  },
});

// ===================== 4. 喂小动物（数数 1-5） =====================
const FEED = [
  { a: '🐰', f: '🥕', zh: '小兔', en: 'bunny', u: '根', fzh: '胡萝卜', fen1: 'carrot', fen: 'carrots' },
  { a: '🐵', f: '🍌', zh: '小猴', en: 'monkey', u: '根', fzh: '香蕉', fen1: 'banana', fen: 'bananas' },
  { a: '🐶', f: '🦴', zh: '小狗', en: 'puppy', u: '根', fzh: '骨头', fen1: 'bone', fen: 'bones' },
  { a: '🐭', f: '🧀', zh: '小老鼠', en: 'mouse', u: '块', fzh: '奶酪', fen1: 'piece of cheese', fen: 'pieces of cheese' },
  { a: '🐻', f: '🍯', zh: '小熊', en: 'bear', u: '罐', fzh: '蜂蜜', fen1: 'pot of honey', fen: 'pots of honey' },
  { a: '🐼', f: '🎋', zh: '熊猫', en: 'panda', u: '根', fzh: '竹子', fen1: 'bamboo', fen: 'bamboos' },
];
const ZH_QTY = ['', '一', '两', '三', '四', '五'];
const ZH_CNT = ['', '一', '二', '三', '四', '五'];
const EN_NUM = ['', 'one', 'two', 'three', 'four', 'five'];

Games.push({
  id: 'feed', icon: '🥕', color: '#ffe3c2',
  name: { zh: '喂小动物', en: 'Feed Me' },
  start(api) {
    this.api = api;
    this.round = 0;
    this.lastN = 0;
    this.next();
  },
  next() {
    const api = this.api, s = api.stage;
    const f = FEED[this.round % FEED.length];
    const maxN = Math.min(5, 2 + Math.floor(this.round / 2));
    let N;
    do { N = 1 + rand(maxN); } while (N === this.lastN && maxN > 1);
    this.lastN = N;
    s.innerHTML = '';
    s.className = 'g-board g-feed';

    const top = el('feed-top');
    const animal = el('animal emoji', f.a);
    const count = el('count');
    const plate = el('plate');
    for (let i = 0; i < N; i++) plate.appendChild(el('pslot', `<span class="ghost emoji">${f.f}</span>`));
    top.append(animal, count, plate);
    const bot = el('row');
    s.append(top, bot);

    api.say({
      zh: `${f.zh}要吃${ZH_QTY[N]}${f.u}${f.fzh}`,
      en: `The ${f.en} wants ${EN_NUM[N]} ${N > 1 ? f.fen : f.fen1}`,
    });

    let fed = 0;
    const feed = (t) => {
      if (fed >= N || t.dataset.locked) return;
      t.dataset.locked = 1;
      const slot = plate.children[fed];
      fed++;
      const k = fed;
      flyTo(t, slot, null, () => slot.classList.add('full'));
      Sound.ding(k * 2); buzz();
      wiggle(animal);
      count.textContent = k;
      count.classList.remove('show'); void count.offsetWidth; count.classList.add('show');
      api.say({ zh: ZH_CNT[k], en: EN_NUM[k] });
      if (k === N) {
        bot.querySelectorAll('.tile:not([data-locked])').forEach((x) => x.classList.add('fade'));
        api.later(() => {
          animal.classList.add('happy');
          api.say({ zh: `${ZH_QTY[N]}${f.u}${f.fzh}，吃饱啦！`, en: `${EN_NUM[N]} ${N > 1 ? f.fen : f.fen1}, yummy!` });
        }, 900);
        api.later(() => api.celebrate(() => { this.round++; this.next(); }), 3200);
      }
    };

    const extra = Math.min(7, N + 2);
    for (let i = 0; i < extra; i++) {
      const t = el('tile emoji', f.f);
      bot.appendChild(t);
      draggable(t, { targets: () => [animal, plate], accept: () => true, onDrop: () => feed(t), onTap: () => feed(t) });
    }
  },
  hint() {
    const t = this.api.stage.querySelector('.tile:not([data-locked])');
    if (t) wiggle(t);
  },
});

// ===================== 5. 动物钢琴（音乐） =====================
Games.push({
  id: 'piano', icon: '🎹', color: '#e5dbff',
  name: { zh: '动物钢琴', en: 'Piano' },
  start(api) {
    const s = api.stage;
    s.className = 'g-piano';
    api.say({ zh: '来弹琴吧', en: "Let's play music!" });
    // C 大调五声音阶：怎么弹都好听
    const notes = [262, 294, 330, 392, 440, 523, 587, 659];
    const colors = ['#ff6b6b', '#ff922b', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#748ffc', '#da77f2'];
    const animals = ['🐱', '🐶', '🐥', '🐸', '🐷', '🐰', '🐻', '🐵'];
    notes.forEach((f, i) => {
      const k = el('key', `<span class="emoji">${animals[i]}</span>`);
      k.style.setProperty('--c', colors[i]);
      const play = () => {
        Sound.note(f); buzz(10);
        k.classList.add('down');
        setTimeout(() => k.classList.remove('down'), 160);
        const c = centerOf(k.querySelector('.emoji'));
        const p = el('particle emoji', pick(['🎵', '🎶', animals[i]]));
        p.style.left = c.x + 'px';
        p.style.top = c.y + 'px';
        fxLayer().appendChild(p);
        p.animate([
          { transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 },
          { transform: `translate(calc(-50% + ${(Math.random() - 0.5) * 80}px), calc(-50% - 160px)) scale(1.4)`, opacity: 0 },
        ], { duration: 1000, easing: 'ease-out' }).onfinish = () => p.remove();
      };
      k.addEventListener('pointerdown', (e) => {
        // 释放捕获，手指滑过其他琴键也能连续发声
        try { k.releasePointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
        play();
      });
      k.addEventListener('pointerenter', (e) => { if (e.buttons || e.pressure > 0) play(); });
      s.appendChild(k);
    });
  },
});
