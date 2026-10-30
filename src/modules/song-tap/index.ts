// 跟我唱：孩子每点一下唱出下一个音，自己"弹"出整首儿歌；歌词逐字高亮。右上角 ▶ 可自动播放示范
import type { ModuleImpl, SDK } from '@/sdk';
import { h } from '@/sdk/dom';
import { SONGS, type Song } from '@/content/songs';
import { iconHtml } from '@/sdk/art';
import './style.css';

const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BEAT_MS = 480;

function freq(name: string) {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error('bad note ' + name);
  const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface Note { f: number; beats: number }

export default function create(): ModuleImpl {
  let sdk: SDK;
  let song: Song;
  let lines: Note[][] = [];
  let li = 0; // 当前行
  let ni = 0; // 当前行下一个要唱的音
  let busy = false;
  let autoToken = 0;
  let lyrics: HTMLElement;
  let singer: HTMLElement;
  let dots: HTMLElement;
  let playBtn: HTMLElement;

  function renderLine() {
    const l = song.lines[li];
    const lang = sdk.lang();
    const row = (words: string[], cls: string) =>
      `<div class="${cls}">${words.map((w, i) => `<span class="${i < ni ? 'on' : ''}">${w}</span>`).join('')}</div>`;
    lyrics.innerHTML =
      (lang !== 'en' ? row(l.zh.split(' '), 'ly-zh') : '') + (lang !== 'zh' ? row(l.en.split(' '), 'ly-en') : '');
    dots.innerHTML = song.lines.map((_, i) => `<i class="${i < li ? 'done' : i === li ? 'cur' : ''}"></i>`).join('');
  }

  function step() {
    if (busy) return;
    const n = lines[li][ni];
    sdk.sfx.note(n.f);
    singer.classList.remove('sing');
    void singer.offsetWidth;
    singer.classList.add('sing');
    const c = sdk.fx.centerOf(singer);
    sdk.fx.floatUp(c.x + (Math.random() - 0.5) * 100, c.y - 40, ni % 2 ? '🎵' : '🎶');
    ni++;
    renderLine();
    if (ni < lines[li].length) return;

    // 一行唱完
    busy = true;
    if (li === lines.length - 1) {
      sdk.progress.round({ mistakes: 0 });
      sdk.later(() => sdk.reward.celebrate(() => { li = 0; ni = 0; busy = false; renderLine(); }), 700);
    } else {
      sdk.later(() => { li++; ni = 0; busy = false; renderLine(); }, 600);
    }
  }

  function stopAuto() {
    autoToken++;
    playBtn.classList.remove('playing');
  }

  function autoPlay() {
    const token = ++autoToken;
    playBtn.classList.add('playing');
    li = 0; ni = 0; busy = false;
    renderLine();
    const tick = () => {
      if (token !== autoToken) return;
      const n = lines[li][ni];
      const lastOfSong = li === lines.length - 1 && ni === lines[li].length - 1;
      step();
      if (lastOfSong) { stopAuto(); return; }
      // 行末 step 会在 600ms 后换行，这里等它完成
      const wait = ni === 0 || busy ? Math.max(n.beats * BEAT_MS, 650) : n.beats * BEAT_MS;
      sdk.later(tick, wait);
    };
    tick();
  }

  return {
    mount(s, api, { activity }) {
      sdk = api;
      song = SONGS[String(activity.params?.song ?? 'twinkle')];
      lines = song.lines.map((l) =>
        l.notes.split(' ').map((tok) => {
          const [name, b] = tok.split(':');
          return { f: freq(name), beats: b ? Number(b) : 1 };
        }),
      );
      s.classList.add('g-song');
      lyrics = h('lyrics');
      singer = h('singer emoji', iconHtml(song.singer));
      dots = h('song-dots');
      playBtn = h('song-play', '▶');
      playBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (playBtn.classList.contains('playing')) stopAuto();
        else autoPlay();
      });
      s.append(lyrics, singer, dots, playBtn);
      s.addEventListener('pointerdown', () => {
        if (playBtn.classList.contains('playing')) stopAuto();
        step();
      });
      sdk.say({ zh: '点一点，一起唱歌吧', en: "Tap tap, let's sing!" });
      renderLine();
    },
    hint() {
      sdk.fx.wiggle(singer);
    },
  };
}
