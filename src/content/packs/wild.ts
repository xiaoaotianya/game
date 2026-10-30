import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'wild',
  title: { zh: '更多动物', en: 'More Animals' },
  icon: '🦓',
  items: [
    { id: 'horse', emoji: '🐴', name: { zh: '小马', en: 'horse' }, sound: { zh: '咴咴', en: 'neigh' } },
    { id: 'zebra', emoji: '🦓', name: { zh: '斑马', en: 'zebra' } },
    { id: 'hippo', emoji: '🦛', name: { zh: '河马', en: 'hippo' } },
    { id: 'tiger', emoji: '🐯', name: { zh: '老虎', en: 'tiger' }, sound: { zh: '嗷呜', en: 'roar' } },
    { id: 'kangaroo', emoji: '🦘', name: { zh: '袋鼠', en: 'kangaroo' }, sound: { zh: '蹦蹦跳', en: 'hop hop' } },
    { id: 'koala', emoji: '🐨', name: { zh: '考拉', en: 'koala' } },
    { id: 'owl', emoji: '🦉', name: { zh: '猫头鹰', en: 'owl' }, sound: { zh: '咕咕', en: 'hoo hoo' } },
    { id: 'fox', emoji: '🦊', name: { zh: '狐狸', en: 'fox' } },
    { id: 'deer', emoji: '🦌', name: { zh: '小鹿', en: 'deer' } },
    { id: 'mouse', emoji: '🐭', name: { zh: '小老鼠', en: 'mouse' }, sound: { zh: '吱吱', en: 'squeak' } },
    { id: 'goat', emoji: '🐐', name: { zh: '山羊', en: 'goat' }, sound: { zh: '咩咩', en: 'maa' } },
    { id: 'camel', emoji: '🐫', name: { zh: '骆驼', en: 'camel' } },
    { id: 'squirrel', emoji: '🐿️', name: { zh: '松鼠', en: 'squirrel' } },
    { id: 'hedgehog', emoji: '🦔', name: { zh: '刺猬', en: 'hedgehog' } },
    { id: 'rhino', emoji: '🦏', name: { zh: '犀牛', en: 'rhino' } },
    { id: 'parrot', emoji: '🦜', name: { zh: '鹦鹉', en: 'parrot' }, sound: { zh: '你好你好', en: 'hello hello' } },
  ],
};

export default pack;
