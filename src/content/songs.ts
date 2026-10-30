// 儿歌曲谱（均为公有领域旋律）。每行的音符数 = 中文字数 = 英文音节数，用于逐字高亮。
// 音符写法：C4 / F#4，可加 :拍数（默认 1 拍）

export interface SongLine {
  notes: string;
  zh: string;
  en: string;
}

export interface Song {
  id: string;
  singer: string;
  lines: SongLine[];
}

export const SONGS: Record<string, Song> = {
  twinkle: {
    id: 'twinkle',
    singer: 'items/star',
    lines: [
      { notes: 'C4 C4 G4 G4 A4 A4 G4:2', zh: '一 闪 一 闪 亮 晶 晶', en: 'Twin kle twin kle lit tle star' },
      { notes: 'F4 F4 E4 E4 D4 D4 C4:2', zh: '满 天 都 是 小 星 星', en: 'How I won der what you are' },
      { notes: 'G4 G4 F4 F4 E4 E4 D4:2', zh: '挂 在 天 上 放 光 明', en: 'Up a bove the world so high' },
      { notes: 'G4 G4 F4 F4 E4 E4 D4:2', zh: '好 像 许 多 小 眼 睛', en: 'Like a dia mond in the sky' },
      { notes: 'C4 C4 G4 G4 A4 A4 G4:2', zh: '一 闪 一 闪 亮 晶 晶', en: 'Twin kle twin kle lit tle star' },
      { notes: 'F4 F4 E4 E4 D4 D4 C4:2', zh: '满 天 都 是 小 星 星', en: 'How I won der what you are' },
    ],
  },
  tigers: {
    id: 'tigers',
    singer: 'ui/tiger',
    lines: [
      { notes: 'C4 D4 E4 C4', zh: '两 只 老 虎', en: 'Are you slee ping' },
      { notes: 'C4 D4 E4 C4', zh: '两 只 老 虎', en: 'Are you slee ping' },
      { notes: 'E4 F4 G4:2', zh: '跑 得 快', en: 'Bro ther John' },
      { notes: 'E4 F4 G4:2', zh: '跑 得 快', en: 'Bro ther John' },
      { notes: 'G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4', zh: '一 只 没 有 眼 睛', en: 'Mor ning bells are ring ing' },
      { notes: 'G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4', zh: '一 只 没 有 尾 巴', en: 'Mor ning bells are ring ing' },
      { notes: 'C4 G3 C4:2', zh: '真 奇 怪', en: 'Ding dang dong' },
      { notes: 'C4 G3 C4:2', zh: '真 奇 怪', en: 'Ding dang dong' },
    ],
  },
  boat: {
    id: 'boat',
    singer: 'items/boat',
    lines: [
      { notes: 'C4 C4 C4:0.75 D4:0.25 E4', zh: '划 划 划 小 船', en: 'Row row row your boat' },
      { notes: 'E4:0.75 D4:0.25 E4:0.75 F4:0.25 G4:2', zh: '轻 轻 向 前 划', en: 'Gent ly down the stream' },
      { notes: 'C5:0.33 C5:0.33 C5:0.33 G4:0.33 G4:0.33 G4:0.33', zh: '快 乐 呀 快 乐 呀', en: 'Mer ri ly mer ri ly' },
      { notes: 'E4:0.33 E4:0.33 E4:0.33 C4:0.33 C4:0.33 C4:0.33', zh: '快 乐 呀 快 乐 呀', en: 'Mer ri ly mer ri ly' },
      { notes: 'G4:0.75 F4:0.25 E4:0.75 D4:0.25 C4:2', zh: '生 活 像 个 梦', en: 'Life is but a dream' },
    ],
  },
  lamb: {
    id: 'lamb',
    singer: 'items/sheep',
    lines: [
      { notes: 'E4 D4 C4 D4 E4 E4 E4:2', zh: '玛 丽 有 只 小 羊 羔', en: 'Ma ry had a lit tle lamb' },
      { notes: 'D4 D4 D4:2', zh: '小 羊 羔', en: 'lit tle lamb' },
      { notes: 'E4 G4 G4:2', zh: '小 羊 羔', en: 'lit tle lamb' },
      { notes: 'E4 D4 C4 D4 E4 E4 E4', zh: '玛 丽 有 只 小 羊 羔', en: 'Ma ry had a lit tle lamb' },
      { notes: 'E4 D4 D4 E4 D4 C4:2', zh: '毛 像 雪 一 样 白', en: 'Its fleece was white as snow' },
    ],
  },
  birthday: {
    id: 'birthday',
    singer: 'ui/cake',
    lines: [
      { notes: 'G4:0.75 G4:0.25 A4 G4 C5 B4:2', zh: '祝 你 生 日 快 乐', en: 'Hap py birth day to you' },
      { notes: 'G4:0.75 G4:0.25 A4 G4 D5 C5:2', zh: '祝 你 生 日 快 乐', en: 'Hap py birth day to you' },
      { notes: 'G4:0.75 G4:0.25 G5 E5 C5 B4 A4:2', zh: '祝 你 生 日 快 乐 呀', en: 'Hap py birth day dear ba by' },
      { notes: 'F5:0.75 F5:0.25 E5 C5 D5 C5:2', zh: '祝 你 生 日 快 乐', en: 'Hap py birth day to you' },
    ],
  },
};
