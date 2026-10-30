// 板块与活动目录。新增活动 = 在这里加一行（模块 + 内容包 + 参数）。
import type { Activity, ContentPack, Section } from '@/sdk';
import animals from './packs/animals';
import wild from './packs/wild';
import vehicles from './packs/vehicles';
import colorful from './packs/colorful';
import fruits from './packs/fruits';
import veggies from './packs/veggies';
import ocean from './packs/ocean';
import body from './packs/body';
import daily from './packs/daily';
import nature from './packs/nature';
import shapes from './packs/shapes';
import numbers from './packs/numbers';
import { ITEM_ART } from './art-manifest';
import { artUrl } from '@/sdk/art';

export const packs: Record<string, ContentPack> = {
  animals, wild, vehicles, colorful, fruits, veggies, ocean, body, daily, nature, shapes, numbers,
};

// 有插画的条目自动挂上图片（同一 id 跨内容包共用一张图）
for (const p of Object.values(packs)) {
  for (const it of p.items) if (!it.image && ITEM_ART.has(it.id)) it.image = artUrl('items/' + it.id);
}

export const sections: Section[] = [
  { id: 'games', title: { zh: '游戏乐园', en: 'Games' }, icon: 'ui/gamepad', color: '#ffd1dc' },
  { id: 'brain', title: { zh: '动动脑', en: 'Thinking' }, icon: 'items/owl', color: '#fff3bf' },
  { id: 'numbers', title: { zh: '认识数字', en: 'Numbers' }, icon: 'items/blocks', color: '#ffe8cc' },
  { id: 'cards', title: { zh: '认知卡片', en: 'Flashcards' }, icon: 'ui/cards', color: '#d0ebff' },
  { id: 'habit', title: { zh: '生活习惯', en: 'Good Habits' }, icon: 'items/toothbrush', color: '#c5f6fa' },
  { id: 'music', title: { zh: '儿歌音乐', en: 'Music' }, icon: 'ui/music', color: '#e5dbff' },
];

const a = (
  id: string, section: string, module: string, pack: string | undefined,
  zh: string, en: string, icon: string, color: string, params?: Record<string, unknown>,
): Activity => ({ id, section, module, pack, title: { zh, en }, icon, color, params });

export const activities: Activity[] = [
  // 游戏乐园：点一点、拖一拖
  a('balloons-animals', 'games', 'balloons', 'animals', '戳气球', 'Balloons', 'ui/balloon', '#ffd1dc'),
  a('balloons-nature', 'games', 'balloons', 'nature', '虫虫气球', 'Bug Balloons', 'items/bee', '#fff3bf'),
  a('shadow-animals', 'games', 'match-shadow', 'animals', '动物影子', 'Animal Shadows', 'items/panda', '#d6f5d6'),
  a('shadow-wild', 'games', 'match-shadow', 'wild', '森林影子', 'Forest Shadows', 'items/kangaroo', '#ffe8cc'),
  a('shadow-vehicles', 'games', 'match-shadow', 'vehicles', '车车影子', 'Vehicle Shadows', 'items/firetruck', '#d0ebff'),
  a('shadow-shapes', 'games', 'match-shadow', 'shapes', '形状影子', 'Shape Shadows', 'items/triangle', '#f3d9fa'),
  a('puzzle-animals', 'games', 'puzzle', 'animals', '动物拼图', 'Animal Puzzle', 'ui/puzzle', '#ffe8cc'),
  a('puzzle-wild', 'games', 'puzzle', 'wild', '森林拼图', 'Forest Puzzle', 'items/fox', '#d3f9d8'),
  a('puzzle-ocean', 'games', 'puzzle', 'ocean', '海洋拼图', 'Ocean Puzzle', 'items/octopus', '#c5f6fa'),

  // 动动脑：观察、记忆、比较、分类
  a('memory-animals', 'brain', 'memory', 'animals', '动物翻翻乐', 'Animal Memory', 'items/owl', '#e5dbff'),
  a('memory-fruits', 'brain', 'memory', 'fruits', '水果翻翻乐', 'Fruit Memory', 'items/strawberry', '#ffe3e3'),
  a('odd-animals', 'brain', 'odd-one', 'animals', '哪个不一样', 'Odd One Out', 'items/zebra', '#d0ebff'),
  a('odd-daily', 'brain', 'odd-one', 'daily', '家里找不同', 'Odd One at Home', 'items/teddy', '#ffe8cc'),
  a('bigsmall-animals', 'brain', 'big-small', 'animals', '大和小', 'Big & Small', 'items/elephant', '#d3f9d8'),
  a('bigsmall-fruits', 'brain', 'big-small', 'fruits', '水果大小', 'Big & Small Fruits', 'items/watermelon', '#ffd1dc'),
  a('sort-colors', 'brain', 'sort-color', 'colorful', '颜色分类', 'Colors', 'ui/palette', '#fff3bf'),
  a('sort-fruits', 'brain', 'sort-color', 'fruits', '水果颜色', 'Fruit Colors', 'items/grapes', '#f3d9fa'),
  a('sort-veggies', 'brain', 'sort-color', 'veggies', '蔬菜颜色', 'Veggie Colors', 'items/pepper', '#d3f9d8'),

  // 认识数字：先认、再数、再用
  a('learn-animals', 'numbers', 'number-learn', 'animals', '认识数字', 'Learn Numbers', 'items/num1', '#ffe3e3', { unit: '只' }),
  a('learn-fruits', 'numbers', 'number-learn', 'fruits', '水果数字', 'Fruit Numbers', 'items/num2', '#fff3bf'),
  a('count-animals', 'numbers', 'count-match', 'animals', '数一数', 'How Many?', 'items/num3', '#d3f9d8', { unit: '只' }),
  a('count-fruits', 'numbers', 'count-match', 'fruits', '数水果', 'Count Fruits', 'items/num5', '#d0ebff'),
  a('feed-count', 'numbers', 'count-feed', undefined, '喂小动物', 'Feed Me', 'items/carrot', '#ffe3c2'),
  a('find-numbers', 'numbers', 'listen-find', 'numbers', '找数字', 'Find Numbers', 'items/num4', '#e5dbff'),
  a('balloons-numbers', 'numbers', 'balloons', 'numbers', '数字气球', 'Number Balloons', 'items/num7', '#f3d9fa'),
  a('memory-numbers', 'numbers', 'memory', 'numbers', '数字翻翻乐', 'Number Memory', 'items/num8', '#ffd1dc'),

  // 认知卡片
  a('cards-animals', 'cards', 'flashcards', 'animals', '动物', 'Animals', 'items/dog', '#d3f9d8'),
  a('cards-wild', 'cards', 'flashcards', 'wild', '更多动物', 'More Animals', 'items/koala', '#ffe8cc'),
  a('cards-fruits', 'cards', 'flashcards', 'fruits', '水果', 'Fruits', 'items/apple', '#ffe3e3'),
  a('cards-veggies', 'cards', 'flashcards', 'veggies', '蔬菜', 'Vegetables', 'items/eggplant', '#e5dbff'),
  a('cards-vehicles', 'cards', 'flashcards', 'vehicles', '交通工具', 'Vehicles', 'items/car', '#d0ebff'),
  a('cards-ocean', 'cards', 'flashcards', 'ocean', '海洋', 'Ocean', 'items/whale', '#c5f6fa'),
  a('cards-nature', 'cards', 'flashcards', 'nature', '昆虫和自然', 'Bugs & Nature', 'items/ladybug', '#d6f5d6'),
  a('cards-shapes', 'cards', 'flashcards', 'shapes', '形状', 'Shapes', 'items/circle', '#fff3bf'),
  a('cards-body', 'cards', 'flashcards', 'body', '身体', 'My Body', 'items/nose', '#ffe8cc'),
  a('find-animals', 'cards', 'listen-find', 'animals', '找动物', 'Find Animals', 'items/ear', '#fff3bf'),
  a('find-fruits', 'cards', 'listen-find', 'fruits', '找水果', 'Find Fruits', 'ui/magnifier', '#f3d9fa'),
  a('find-veggies', 'cards', 'listen-find', 'veggies', '找蔬菜', 'Find Veggies', 'items/mushroom', '#d3f9d8'),
  a('find-shapes', 'cards', 'listen-find', 'shapes', '找形状', 'Find Shapes', 'items/heart', '#ffd1dc'),
  a('find-body', 'cards', 'listen-find', 'body', '找五官', 'Find Body Parts', 'items/eye', '#ffd1dc'),

  // 生活习惯
  a('scrub-bath', 'habit', 'scrub', undefined, '洗澡澡', 'Bath Time', 'items/bathtub', '#c5f6fa', { set: 'bath' }),
  a('scrub-teeth', 'habit', 'scrub', undefined, '刷牙牙', 'Brush Teeth', 'items/tooth', '#d0ebff', { set: 'teeth' }),
  a('scrub-hands', 'habit', 'scrub', undefined, '洗手手', 'Wash Hands', 'items/soap', '#fff3bf', { set: 'hands' }),
  a('scrub-cars', 'habit', 'scrub', undefined, '洗车车', 'Car Wash', 'items/sponge', '#ffe8cc', { set: 'cars' }),
  a('cards-daily', 'habit', 'flashcards', 'daily', '家里的东西', 'Things at Home', 'items/cup', '#e5dbff'),
  a('find-daily', 'habit', 'listen-find', 'daily', '找一找', 'Find at Home', 'items/backpack', '#d3f9d8'),

  // 儿歌音乐
  a('piano-animals', 'music', 'piano', undefined, '动物钢琴', 'Piano', 'ui/piano', '#e5dbff'),
  a('song-twinkle', 'music', 'song-tap', undefined, '小星星', 'Twinkle Star', 'items/star', '#fff3bf', { song: 'twinkle' }),
  a('song-tigers', 'music', 'song-tap', undefined, '两只老虎', 'Brother John', 'ui/tiger', '#ffe8cc', { song: 'tigers' }),
  a('song-boat', 'music', 'song-tap', undefined, '划小船', 'Row Your Boat', 'items/boat', '#d0ebff', { song: 'boat' }),
  a('song-lamb', 'music', 'song-tap', undefined, '小羊羔', 'Little Lamb', 'items/sheep', '#d3f9d8', { song: 'lamb' }),
  a('song-birthday', 'music', 'song-tap', undefined, '生日快乐', 'Happy Birthday', 'ui/cake', '#ffd1dc', { song: 'birthday' }),
];

export const activitiesOf = (section: string) => activities.filter((x) => x.section === section);
export const findActivity = (id: string) => activities.find((x) => x.id === id);
