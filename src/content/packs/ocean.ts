import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'ocean',
  title: { zh: '海洋', en: 'Ocean' },
  icon: '🐳',
  items: [
    { id: 'whale', emoji: '🐳', name: { zh: '鲸鱼', en: 'whale' }, sound: { zh: '噗——喷水啦', en: 'splash' } },
    { id: 'dolphin', emoji: '🐬', name: { zh: '海豚', en: 'dolphin' } },
    { id: 'fish', emoji: '🐟', name: { zh: '小鱼', en: 'fish' }, sound: { zh: '吐泡泡', en: 'blub blub' } },
    { id: 'tropical', emoji: '🐠', name: { zh: '热带鱼', en: 'tropical fish' } },
    { id: 'puffer', emoji: '🐡', name: { zh: '河豚', en: 'pufferfish' } },
    { id: 'octopus', emoji: '🐙', name: { zh: '章鱼', en: 'octopus' } },
    { id: 'crab', emoji: '🦀', name: { zh: '螃蟹', en: 'crab' }, sound: { zh: '横着走', en: 'snip snip' } },
    { id: 'shark', emoji: '🦈', name: { zh: '鲨鱼', en: 'shark' } },
    { id: 'turtle', emoji: '🐢', name: { zh: '海龟', en: 'turtle' } },
    { id: 'lobster', emoji: '🦞', name: { zh: '龙虾', en: 'lobster' } },
    { id: 'shell', emoji: '🐚', name: { zh: '贝壳', en: 'shell' } },
  ],
};

export default pack;
