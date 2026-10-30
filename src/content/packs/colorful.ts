// 带颜色属性的常见物品，用于颜色类玩法
import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'colorful',
  title: { zh: '颜色', en: 'Colors' },
  icon: '🎨',
  items: [
    { id: 'apple', emoji: '🍎', name: { zh: '苹果', en: 'apple' }, color: 'red' },
    { id: 'strawberry', emoji: '🍓', name: { zh: '草莓', en: 'strawberry' }, color: 'red' },
    { id: 'cherry', emoji: '🍒', name: { zh: '樱桃', en: 'cherries' }, color: 'red' },
    { id: 'firetruck', emoji: '🚒', name: { zh: '消防车', en: 'fire truck' }, color: 'red' },
    { id: 'rose', emoji: '🌹', name: { zh: '玫瑰', en: 'rose' }, color: 'red' },
    { id: 'tomato', emoji: '🍅', name: { zh: '番茄', en: 'tomato' }, color: 'red' },
    { id: 'banana', emoji: '🍌', name: { zh: '香蕉', en: 'banana' }, color: 'yellow' },
    { id: 'sunflower', emoji: '🌻', name: { zh: '向日葵', en: 'sunflower' }, color: 'yellow' },
    { id: 'chick', emoji: '🐥', name: { zh: '小鸡', en: 'chick' }, color: 'yellow' },
    { id: 'corn', emoji: '🌽', name: { zh: '玉米', en: 'corn' }, color: 'yellow' },
    { id: 'lemon', emoji: '🍋', name: { zh: '柠檬', en: 'lemon' }, color: 'yellow' },
    { id: 'star', emoji: '⭐', name: { zh: '星星', en: 'star' }, color: 'yellow' },
    { id: 'whale', emoji: '🐳', name: { zh: '鲸鱼', en: 'whale' }, color: 'blue' },
    { id: 'jeans', emoji: '👖', name: { zh: '牛仔裤', en: 'jeans' }, color: 'blue' },
    { id: 'cap', emoji: '🧢', name: { zh: '帽子', en: 'cap' }, color: 'blue' },
    { id: 'butterfly', emoji: '🦋', name: { zh: '蝴蝶', en: 'butterfly' }, color: 'blue' },
    { id: 'drop', emoji: '💧', name: { zh: '水滴', en: 'water drop' }, color: 'blue' },
    { id: 'green-apple', emoji: '🍏', name: { zh: '青苹果', en: 'green apple' }, color: 'green' },
    { id: 'broccoli', emoji: '🥦', name: { zh: '西兰花', en: 'broccoli' }, color: 'green' },
    { id: 'frog', emoji: '🐸', name: { zh: '青蛙', en: 'frog' }, color: 'green' },
    { id: 'clover', emoji: '🍀', name: { zh: '四叶草', en: 'clover' }, color: 'green' },
    { id: 'cucumber', emoji: '🥒', name: { zh: '黄瓜', en: 'cucumber' }, color: 'green' },
    { id: 'tree', emoji: '🌲', name: { zh: '大树', en: 'tree' }, color: 'green' },
  ],
};

export default pack;
