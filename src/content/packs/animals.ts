import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'animals',
  title: { zh: '动物', en: 'Animals' },
  icon: '🐼',
  items: [
    { id: 'cat', emoji: '🐱', name: { zh: '小猫', en: 'cat' }, sound: { zh: '喵喵', en: 'meow' } },
    { id: 'dog', emoji: '🐶', name: { zh: '小狗', en: 'dog' }, sound: { zh: '汪汪', en: 'woof woof' } },
    { id: 'cow', emoji: '🐮', name: { zh: '奶牛', en: 'cow' }, sound: { zh: '哞', en: 'moo' } },
    { id: 'pig', emoji: '🐷', name: { zh: '小猪', en: 'pig' }, sound: { zh: '哼哼', en: 'oink oink' } },
    { id: 'frog', emoji: '🐸', name: { zh: '青蛙', en: 'frog' }, sound: { zh: '呱呱', en: 'ribbit' } },
    { id: 'chick', emoji: '🐥', name: { zh: '小鸡', en: 'chick' }, sound: { zh: '叽叽', en: 'tweet tweet' } },
    { id: 'duck', emoji: '🦆', name: { zh: '鸭子', en: 'duck' }, sound: { zh: '嘎嘎', en: 'quack quack' } },
    { id: 'sheep', emoji: '🐑', name: { zh: '小羊', en: 'sheep' }, sound: { zh: '咩咩', en: 'baa' } },
    { id: 'monkey', emoji: '🐵', name: { zh: '小猴', en: 'monkey' }, sound: { zh: '吱吱', en: 'ooh ooh' } },
    { id: 'lion', emoji: '🦁', name: { zh: '狮子', en: 'lion' }, sound: { zh: '嗷呜', en: 'roar' } },
    { id: 'elephant', emoji: '🐘', name: { zh: '大象', en: 'elephant' } },
    { id: 'bunny', emoji: '🐰', name: { zh: '小兔', en: 'bunny' } },
    { id: 'bear', emoji: '🐻', name: { zh: '小熊', en: 'bear' } },
    { id: 'panda', emoji: '🐼', name: { zh: '熊猫', en: 'panda' } },
    { id: 'penguin', emoji: '🐧', name: { zh: '企鹅', en: 'penguin' } },
    { id: 'giraffe', emoji: '🦒', name: { zh: '长颈鹿', en: 'giraffe' } },
  ],
};

export default pack;
