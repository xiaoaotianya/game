import type { ContentPack } from '@/sdk';
import { EN_NUM, ZH_CNT } from '../phrases';

const pack: ContentPack = {
  id: 'numbers',
  title: { zh: '数字', en: 'Numbers' },
  icon: 'items/blocks',
  items: Array.from({ length: 10 }, (_, k) => ({
    id: `num${k + 1}`,
    emoji: String(k + 1),
    name: { zh: ZH_CNT[k + 1], en: EN_NUM[k + 1] },
  })),
};

export default pack;
