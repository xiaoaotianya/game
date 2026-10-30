import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'nature',
  title: { zh: '昆虫和自然', en: 'Bugs & Nature' },
  icon: '🐞',
  items: [
    { id: 'bee', emoji: '🐝', name: { zh: '小蜜蜂', en: 'bee' }, sound: { zh: '嗡嗡嗡', en: 'buzz buzz' } },
    { id: 'ladybug', emoji: '🐞', name: { zh: '瓢虫', en: 'ladybug' } },
    { id: 'ant', emoji: '🐜', name: { zh: '小蚂蚁', en: 'ant' } },
    { id: 'snail', emoji: '🐌', name: { zh: '蜗牛', en: 'snail' }, sound: { zh: '慢慢爬', en: 'slowly slowly' } },
    { id: 'caterpillar', emoji: '🐛', name: { zh: '毛毛虫', en: 'caterpillar' } },
    { id: 'butterfly', emoji: '🦋', name: { zh: '蝴蝶', en: 'butterfly' }, sound: { zh: '飞呀飞', en: 'flutter flutter' } },
    { id: 'dragonfly', emoji: '🦗', name: { zh: '蜻蜓', en: 'dragonfly' } },
    { id: 'sun', emoji: '☀️', name: { zh: '太阳', en: 'sun' }, sound: { zh: '暖洋洋', en: 'nice and warm' } },
    { id: 'cloud', emoji: '☁️', name: { zh: '云朵', en: 'cloud' } },
    { id: 'rain', emoji: '🌧️', name: { zh: '下雨', en: 'rain' }, sound: { zh: '滴答滴答', en: 'pitter patter' } },
    { id: 'snowman', emoji: '⛄', name: { zh: '雪人', en: 'snowman' } },
    { id: 'tulip', emoji: '🌷', name: { zh: '花朵', en: 'flower' } },
    { id: 'leaf', emoji: '🍃', name: { zh: '树叶', en: 'leaf' } },
    { id: 'tree', emoji: '🌲', name: { zh: '大树', en: 'tree' } },
    { id: 'star', emoji: '⭐', name: { zh: '星星', en: 'star' }, sound: { zh: '亮晶晶', en: 'twinkle twinkle' } },
  ],
};

export default pack;
