import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'veggies',
  title: { zh: '蔬菜', en: 'Vegetables' },
  icon: '🥕',
  items: [
    { id: 'carrot', emoji: '🥕', name: { zh: '胡萝卜', en: 'carrot' }, color: 'orange' },
    { id: 'pumpkin', emoji: '🎃', name: { zh: '南瓜', en: 'pumpkin' }, color: 'orange' },
    { id: 'tomato', emoji: '🍅', name: { zh: '番茄', en: 'tomato' }, color: 'red' },
    { id: 'pepper', emoji: '🫑', name: { zh: '甜椒', en: 'pepper' }, color: 'red' },
    { id: 'chili', emoji: '🌶️', name: { zh: '辣椒', en: 'chili' }, color: 'red' },
    { id: 'eggplant', emoji: '🍆', name: { zh: '茄子', en: 'eggplant' }, color: 'purple' },
    { id: 'broccoli', emoji: '🥦', name: { zh: '西兰花', en: 'broccoli' }, color: 'green' },
    { id: 'cucumber', emoji: '🥒', name: { zh: '黄瓜', en: 'cucumber' }, color: 'green' },
    { id: 'cabbage', emoji: '🥬', name: { zh: '卷心菜', en: 'cabbage' }, color: 'green' },
    { id: 'peas', emoji: '🫛', name: { zh: '豌豆', en: 'peas' }, color: 'green' },
    { id: 'corn', emoji: '🌽', name: { zh: '玉米', en: 'corn' }, color: 'yellow' },
    { id: 'potato', emoji: '🥔', name: { zh: '土豆', en: 'potato' }, color: 'yellow' },
    { id: 'mushroom', emoji: '🍄', name: { zh: '蘑菇', en: 'mushroom' } },
    { id: 'onion', emoji: '🧅', name: { zh: '洋葱', en: 'onion' } },
    { id: 'garlic', emoji: '🧄', name: { zh: '大蒜', en: 'garlic' } },
    { id: 'radish', emoji: '🥕', name: { zh: '白萝卜', en: 'radish' } },
    { id: 'sweet-potato', emoji: '🍠', name: { zh: '红薯', en: 'sweet potato' } },
  ],
};

export default pack;
