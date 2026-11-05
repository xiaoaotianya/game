// 模块注册表：每个模块一个 manifest，实现按需懒加载
import type { ModuleManifest } from '@/sdk';

export const modules: Record<string, ModuleManifest> = {
  balloons: {
    id: 'balloons',
    kind: 'game',
    skills: ['cognition', 'fine-motor', 'language'],
    levels: 1,
    load: () => import('./balloons'),
  },
  'match-shadow': {
    id: 'match-shadow',
    kind: 'game',
    skills: ['cognition', 'fine-motor', 'language'],
    levels: 3, // 2 / 3 / 4 对
    load: () => import('./match-shadow'),
  },
  'sort-color': {
    id: 'sort-color',
    kind: 'game',
    skills: ['color-shape', 'cognition', 'fine-motor'],
    levels: 3, // 2 色 / 3 色 / 4 色
    load: () => import('./sort-color'),
  },
  'count-feed': {
    id: 'count-feed',
    kind: 'game',
    skills: ['number', 'language'],
    levels: 4, // 最大数到 2 / 3 / 4 / 5
    load: () => import('./count-feed'),
  },
  puzzle: {
    id: 'puzzle',
    kind: 'game',
    skills: ['cognition', 'fine-motor'],
    levels: 3, // 2 块 / 3 块 / 4 块
    load: () => import('./puzzle'),
  },
  flashcards: {
    id: 'flashcards',
    kind: 'course',
    skills: ['cognition', 'language', 'english'],
    levels: 1,
    load: () => import('./flashcards'),
  },
  'listen-find': {
    id: 'listen-find',
    kind: 'course',
    skills: ['language', 'english', 'cognition'],
    levels: 3, // 2 / 3 / 4 个选项
    load: () => import('./listen-find'),
  },
  'song-tap': {
    id: 'song-tap',
    kind: 'media',
    skills: ['music', 'language'],
    levels: 1,
    load: () => import('./song-tap'),
  },
  memory: {
    id: 'memory',
    kind: 'game',
    skills: ['cognition', 'language'],
    levels: 3, // 2 / 3 / 4 对
    load: () => import('./memory'),
  },
  'odd-one': {
    id: 'odd-one',
    kind: 'game',
    skills: ['cognition'],
    levels: 3, // 3 / 4 / 5 个
    load: () => import('./odd-one'),
  },
  'big-small': {
    id: 'big-small',
    kind: 'game',
    skills: ['number', 'language', 'english'],
    levels: 2, // 两个比大小 / 三个找最大最小
    load: () => import('./big-small'),
  },
  scrub: {
    id: 'scrub',
    kind: 'game',
    skills: ['habit', 'fine-motor'],
    levels: 1,
    load: () => import('./scrub'),
  },
  'number-learn': {
    id: 'number-learn',
    kind: 'course',
    skills: ['number', 'language', 'english'],
    levels: 1,
    load: () => import('./number-learn'),
  },
  'count-match': {
    id: 'count-match',
    kind: 'game',
    skills: ['number', 'cognition'],
    levels: 3, // 数到 3 / 5 / 10
    load: () => import('./count-match'),
  },
  coloring: {
    id: 'coloring',
    kind: 'tool',
    skills: ['creativity', 'color-shape', 'fine-motor'],
    levels: 1,
    load: () => import('./coloring'),
  },
  doodle: {
    id: 'doodle',
    kind: 'tool',
    skills: ['creativity', 'fine-motor'],
    levels: 1,
    load: () => import('./doodle'),
  },
  piano: {
    id: 'piano',
    kind: 'game',
    skills: ['music', 'fine-motor'],
    levels: 1,
    load: () => import('./piano'),
  },
  peek: {
    id: 'peek',
    kind: 'game',
    skills: ['cognition', 'fine-motor', 'language'],
    levels: 3, // 3 / 4 / 6 个洞
    load: () => import('./peek'),
  },
  scratch: {
    id: 'scratch',
    kind: 'game',
    skills: ['fine-motor', 'cognition', 'language'],
    levels: 1,
    load: () => import('./scratch'),
  },
  'shape-box': {
    id: 'shape-box',
    kind: 'game',
    skills: ['color-shape', 'fine-motor', 'cognition'],
    levels: 3, // 2 / 3 / 4 种洞
    load: () => import('./shape-box'),
  },
  'feed-match': {
    id: 'feed-match',
    kind: 'game',
    skills: ['cognition', 'language', 'english'],
    levels: 3, // 2 / 3 / 4 对
    load: () => import('./feed-match'),
  },
  drum: {
    id: 'drum',
    kind: 'game',
    skills: ['music', 'fine-motor', 'cognition'],
    levels: 3, // 跟我敲：2 / 3 / 4 下
    load: () => import('./drum'),
  },
  'tidy-up': {
    id: 'tidy-up',
    kind: 'game',
    skills: ['habit', 'fine-motor'],
    levels: 3, // 3 / 4 / 6 件
    load: () => import('./tidy-up'),
  },
  'dress-up': {
    id: 'dress-up',
    kind: 'game',
    skills: ['habit', 'cognition', 'language'],
    levels: 3, // 选项 3 / 4 / 5 个
    load: () => import('./dress-up'),
  },
  'day-order': {
    id: 'day-order',
    kind: 'game',
    skills: ['habit', 'cognition'],
    levels: 3, // 2 / 3 / 4 步
    load: () => import('./day-order'),
  },
  'emotion-cards': {
    id: 'emotion-cards',
    kind: 'course',
    skills: ['language', 'cognition'],
    levels: 1,
    load: () => import('./emotion-cards'),
  },
  'emotion-story': {
    id: 'emotion-story',
    kind: 'game',
    skills: ['language', 'cognition'],
    levels: 2, // 2 / 3 张脸
    load: () => import('./emotion-story'),
  },
  'size-order': {
    id: 'size-order',
    kind: 'game',
    skills: ['number', 'cognition', 'fine-motor'],
    levels: 2, // 3 / 4 个
    load: () => import('./size-order'),
  },
  pattern: {
    id: 'pattern',
    kind: 'game',
    skills: ['cognition', 'color-shape'],
    levels: 3, // AB / AAB·ABB / ABC
    load: () => import('./pattern'),
  },
  share: {
    id: 'share',
    kind: 'game',
    skills: ['number', 'cognition'],
    levels: 3, // 2 / 3 / 4 只
    load: () => import('./share'),
  },
  fishing: {
    id: 'fishing',
    kind: 'game',
    skills: ['cognition', 'fine-motor', 'language'],
    levels: 3, // 自由钓 / 按名字钓 / 按名字钓+快
    load: () => import('./fishing'),
  },
  stack: {
    id: 'stack',
    kind: 'game',
    skills: ['fine-motor', 'cognition'],
    levels: 3, // 摆动速度
    load: () => import('./stack'),
  },
  trace: {
    id: 'trace',
    kind: 'game',
    skills: ['fine-motor'],
    levels: 3, // 直路 / 弯路 / S 弯
    load: () => import('./trace'),
  },
};
