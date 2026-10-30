// 页面切换、家长设置、每日时长
'use strict';

const $ = (id) => document.getElementById(id);

const App = {
  game: null,
  timers: [],
  lastAct: 0,
  today: Store.get('today', { date: '', sec: 0 }),

  init() {
    Speech.init();
    this.renderHub();
    this.bindParent();
    this.bindGear();
    $('home').addEventListener('click', () => this.close());

    // 首次触摸时解锁音频（浏览器要求）
    document.addEventListener('pointerdown', () => Sound.unlock(), { capture: true });
    // 禁止长按菜单、iOS 双指缩放
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    setInterval(() => this.tick(), 1000);
    $('rest').addEventListener('pointerdown', () => Speech.say(this.restMsg()));

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  },

  renderHub() {
    const n = Settings.name;
    $('title').textContent = Settings.lang === 'en'
      ? (n ? `${n}'s Playland` : 'Playland')
      : (n ? `${n}的游戏乐园` : '宝宝游戏乐园');
    const box = $('cards');
    box.innerHTML = '';
    Games.forEach((g, i) => {
      const c = el('card');
      c.style.setProperty('--c', g.color);
      c.style.animationDelay = (i * 0.3) + 's';
      const sub = Settings.lang === 'both' ? `<div class="ce">${g.name.en}</div>` : '';
      c.innerHTML = `<div class="ci emoji">${g.icon}</div><div class="cn">${label(g.name)}</div>${sub}`;
      c.addEventListener('click', () => this.open(g));
      box.appendChild(c);
    });
  },

  api(stage) {
    const later = (fn, ms) => { this.timers.push(setTimeout(fn, ms)); };
    return {
      stage,
      later,
      say: (t) => Speech.say(t),
      celebrate: (done) => {
        const p = praise();
        const box = el('celebrate', `<div class="cele-star emoji">${pick(['🌟', '🏆', '🎉', '🌈'])}</div>`);
        document.body.appendChild(box);
        Sound.win(); buzz(40);
        Speech.say(p);
        const w = innerWidth, h = innerHeight;
        [[w / 2, h / 2], [w * 0.2, h * 0.3], [w * 0.8, h * 0.3], [w * 0.3, h * 0.75], [w * 0.7, h * 0.75]]
          .forEach(([x, y], i) => later(() => burst(x, y, ['⭐', '🎉', '💖', '🌈', '✨'], 12), i * 160));
        later(() => { box.remove(); done && done(); }, 2600);
      },
    };
  },

  open(g) {
    if (this.overLimit()) { this.showRest(); return; }
    this.stop();
    // 尽量全屏（安卓有效；iOS 请用「添加到主屏幕」）
    const de = document.documentElement;
    if (de.requestFullscreen && !document.fullscreenElement && !matchMedia('(display-mode: standalone)').matches) {
      de.requestFullscreen().catch(() => {});
    }
    const old = $('stage');
    const stage = document.createElement('div');
    stage.id = 'stage';
    old.replaceWith(stage);
    stage.addEventListener('pointerdown', () => { this.lastAct = Date.now(); }, { capture: true });

    $('hub').classList.remove('active');
    $('game').classList.add('active');
    $('gear').classList.add('hidden');
    this.game = g;
    this.lastAct = Date.now();
    g.start(this.api(stage));
  },

  close() {
    this.stop();
    $('game').classList.remove('active');
    $('hub').classList.add('active');
    $('gear').classList.remove('hidden');
  },

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    Speech.stop();
    document.querySelectorAll('.celebrate').forEach((n) => n.remove());
    $('fx').innerHTML = '';
    this.game = null;
  },

  // ---------- 每日时长 ----------
  dateKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; },

  tick() {
    if (this.today.date !== this.dateKey()) this.today = { date: this.dateKey(), sec: 0 };
    if (!this.game || document.hidden) return;
    this.today.sec++;
    if (this.today.sec % 5 === 0) Store.set('today', this.today);
    // 空闲 8 秒给个提示
    if (this.game.hint && Date.now() - this.lastAct > 8000) {
      this.lastAct = Date.now();
      this.game.hint();
    }
    if (this.overLimit()) { this.close(); this.showRest(); }
  },

  overLimit() { return Settings.limit > 0 && this.today.date === this.dateKey() && this.today.sec >= Settings.limit * 60; },

  restMsg() { return { zh: '今天玩够啦，眼睛要休息啦', en: 'Time to rest your eyes. See you tomorrow!' }; },

  showRest() {
    Store.set('today', this.today);
    $('restText').textContent = label({ zh: '休息时间到啦', en: 'Time to rest' });
    $('rest').classList.remove('hidden');
    $('gear').classList.remove('hidden');
    Speech.say(this.restMsg());
  },

  // ---------- 家长入口：长按 2 秒 ----------
  bindGear() {
    const g = $('gear');
    let t = null;
    const cancel = () => { clearTimeout(t); g.classList.remove('holding'); };
    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      g.classList.add('holding');
      t = setTimeout(() => { cancel(); this.openParent(); }, 2000);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => g.addEventListener(ev, cancel));
  },

  bindParent() {
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const raw = b.dataset.v;
        let v;
        try { v = JSON.parse(raw); } catch (err) { v = raw; }
        Settings.set(seg.dataset.key, v);
        this.syncParent();
      });
    });
    $('babyName').addEventListener('input', (e) => Settings.set('name', e.target.value.trim()));
    $('resetToday').addEventListener('click', () => {
      this.today = { date: this.dateKey(), sec: 0 };
      Store.set('today', this.today);
      this.syncParent();
    });
    $('closeParent').addEventListener('click', () => {
      $('parent').classList.add('hidden');
      if (!this.overLimit()) $('rest').classList.add('hidden');
      this.renderHub();
    });
  },

  openParent() {
    this.syncParent();
    $('babyName').value = Settings.name;
    $('parent').classList.remove('hidden');
  },

  syncParent() {
    document.querySelectorAll('.seg').forEach((seg) => {
      const cur = String(Settings[seg.dataset.key]);
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === cur));
    });
    $('todayMin').textContent = Math.floor(this.today.sec / 60);
  },
};

App.init();
