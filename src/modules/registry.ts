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
  piano: {
    id: 'piano',
    kind: 'game',
    skills: ['music', 'fine-motor'],
    levels: 1,
    load: () => import('./piano'),
  },
};
