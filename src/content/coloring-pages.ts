// 涂色页：线稿和区域图由 art/coloring.py 生成，放在 public/art/coloring/
import type { Text } from '@/sdk';

export interface ColoringPage {
  id: string;
  name: Text;
}

const p = (id: string, zh: string, en: string): ColoringPage => ({ id, name: { zh, en } });

export const COLORING_SETS: Record<string, ColoringPage[]> = {
  animals: [
    p('cat', '小猫', 'kitty'),
    p('fish', '小鱼', 'fish'),
    p('duck', '小鸭子', 'duck'),
    p('bunny', '小兔子', 'bunny'),
    p('butterfly', '蝴蝶', 'butterfly'),
    p('pig', '小猪', 'piggy'),
    p('elephant', '大象', 'elephant'),
    p('turtle', '小乌龟', 'turtle'),
  ],
  things: [
    p('car', '小汽车', 'car'),
    p('flower', '花朵', 'flower'),
    p('house', '小房子', 'house'),
    p('rocket', '火箭', 'rocket'),
  ],
};
