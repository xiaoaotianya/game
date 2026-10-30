import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'daily',
  title: { zh: '日常用品', en: 'Things at Home' },
  icon: '🧸',
  items: [
    { id: 'cup', emoji: '🥤', name: { zh: '水杯', en: 'cup' }, sound: { zh: '喝水啦', en: 'drink some water' } },
    { id: 'bowl', emoji: '🥣', name: { zh: '小碗', en: 'bowl' }, sound: { zh: '吃饭啦', en: 'time to eat' } },
    { id: 'spoon', emoji: '🥄', name: { zh: '勺子', en: 'spoon' } },
    { id: 'toothbrush', emoji: '🪥', name: { zh: '牙刷', en: 'toothbrush' }, sound: { zh: '刷刷牙', en: 'brush your teeth' } },
    { id: 'soap', emoji: '🧼', name: { zh: '肥皂', en: 'soap' }, sound: { zh: '洗洗手', en: 'wash your hands' } },
    { id: 'towel', emoji: '🧻', name: { zh: '毛巾', en: 'towel' } },
    { id: 'shoes', emoji: '👟', name: { zh: '鞋子', en: 'shoes' }, sound: { zh: '穿鞋子', en: 'put on your shoes' } },
    { id: 'socks', emoji: '🧦', name: { zh: '袜子', en: 'socks' } },
    { id: 'ball', emoji: '⚽', name: { zh: '皮球', en: 'ball' }, sound: { zh: '拍拍球', en: 'bounce bounce' } },
    { id: 'book', emoji: '📖', name: { zh: '图画书', en: 'book' }, sound: { zh: '讲故事', en: 'story time' } },
    { id: 'teddy', emoji: '🧸', name: { zh: '小熊玩偶', en: 'teddy bear' }, sound: { zh: '抱一抱', en: 'big hug' } },
    { id: 'bed', emoji: '🛏️', name: { zh: '小床', en: 'bed' }, sound: { zh: '睡觉觉', en: 'sleepy time' } },
    { id: 'chair', emoji: '🪑', name: { zh: '椅子', en: 'chair' } },
    { id: 'umbrella', emoji: '☂️', name: { zh: '雨伞', en: 'umbrella' } },
    { id: 'clock', emoji: '⏰', name: { zh: '闹钟', en: 'clock' }, sound: { zh: '滴答滴答', en: 'tick tock' } },
    { id: 'backpack', emoji: '🎒', name: { zh: '书包', en: 'backpack' } },
  ],
};

export default pack;
