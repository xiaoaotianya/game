import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'vehicles',
  title: { zh: '交通工具', en: 'Vehicles' },
  icon: '🚗',
  items: [
    { id: 'car', emoji: '🚗', name: { zh: '小汽车', en: 'car' }, sound: { zh: '嘀嘀', en: 'beep beep' }, color: 'red' },
    { id: 'bus', emoji: '🚌', name: { zh: '公交车', en: 'bus' }, color: 'yellow' },
    { id: 'firetruck', emoji: '🚒', name: { zh: '消防车', en: 'fire truck' }, sound: { zh: '呜哇呜哇', en: 'nee naw' }, color: 'red' },
    { id: 'police', emoji: '🚓', name: { zh: '警车', en: 'police car' } },
    { id: 'ambulance', emoji: '🚑', name: { zh: '救护车', en: 'ambulance' } },
    { id: 'train', emoji: '🚂', name: { zh: '火车', en: 'train' }, sound: { zh: '呜呜', en: 'choo choo' } },
    { id: 'plane', emoji: '✈️', name: { zh: '飞机', en: 'airplane' } },
    { id: 'boat', emoji: '⛵', name: { zh: '帆船', en: 'boat' } },
    { id: 'bike', emoji: '🚲', name: { zh: '自行车', en: 'bike' }, sound: { zh: '叮铃铃', en: 'ring ring' } },
    { id: 'tractor', emoji: '🚜', name: { zh: '拖拉机', en: 'tractor' }, color: 'green' },
    { id: 'helicopter', emoji: '🚁', name: { zh: '直升机', en: 'helicopter' } },
    { id: 'rocket', emoji: '🚀', name: { zh: '火箭', en: 'rocket' } },
  ],
};

export default pack;
