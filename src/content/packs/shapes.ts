import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'shapes',
  title: { zh: '形状', en: 'Shapes' },
  icon: '🔺',
  items: [
    { id: 'circle', emoji: '🔴', name: { zh: '圆形', en: 'circle' }, sound: { zh: '圆圆的', en: 'round and round' }, color: 'red' },
    { id: 'square', emoji: '🟦', name: { zh: '正方形', en: 'square' }, color: 'blue' },
    { id: 'triangle', emoji: '🔺', name: { zh: '三角形', en: 'triangle' }, color: 'yellow' },
    { id: 'heart', emoji: '❤️', name: { zh: '爱心', en: 'heart' }, sound: { zh: '我爱你', en: 'I love you' } },
    { id: 'oval', emoji: '🥚', name: { zh: '椭圆形', en: 'oval' }, color: 'purple' },
    { id: 'rectangle', emoji: '🟧', name: { zh: '长方形', en: 'rectangle' }, color: 'orange' },
    { id: 'diamond', emoji: '🔷', name: { zh: '菱形', en: 'diamond' }, color: 'green' },
    { id: 'star', emoji: '⭐', name: { zh: '星形', en: 'star' }, color: 'yellow' },
  ],
};

export default pack;
