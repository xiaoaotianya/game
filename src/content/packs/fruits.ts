import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'fruits',
  title: { zh: '水果', en: 'Fruits' },
  icon: '🍎',
  items: [
    { id: 'apple', emoji: '🍎', name: { zh: '苹果', en: 'apple' }, color: 'red' },
    { id: 'strawberry', emoji: '🍓', name: { zh: '草莓', en: 'strawberry' }, color: 'red' },
    { id: 'cherry', emoji: '🍒', name: { zh: '樱桃', en: 'cherries' }, color: 'red' },
    { id: 'banana', emoji: '🍌', name: { zh: '香蕉', en: 'banana' }, color: 'yellow' },
    { id: 'pineapple', emoji: '🍍', name: { zh: '菠萝', en: 'pineapple' }, color: 'yellow' },
    { id: 'lemon', emoji: '🍋', name: { zh: '柠檬', en: 'lemon' }, color: 'yellow' },
    { id: 'pear', emoji: '🍐', name: { zh: '梨', en: 'pear' }, color: 'green' },
    { id: 'kiwi', emoji: '🥝', name: { zh: '猕猴桃', en: 'kiwi' }, color: 'green' },
    { id: 'orange', emoji: '🍊', name: { zh: '橘子', en: 'orange' }, color: 'orange' },
    { id: 'mango', emoji: '🥭', name: { zh: '芒果', en: 'mango' }, color: 'orange' },
    { id: 'grapes', emoji: '🍇', name: { zh: '葡萄', en: 'grapes' }, color: 'purple' },
    { id: 'watermelon', emoji: '🍉', name: { zh: '西瓜', en: 'watermelon' } },
    { id: 'peach', emoji: '🍑', name: { zh: '桃子', en: 'peach' } },
  ],
};

export default pack;
