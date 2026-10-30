// 洗刷刷场景：主体 + 脏东西 + 清洁工具 + 开始/完成的语音
import type { Text } from '@/sdk';

export interface ScrubScene {
  subject: string; // 插画路径
  dirt: string;
  tool: string;
  intro: Text;
  done: Text;
}

const bath = (subject: string, zh: string, en: string): ScrubScene => ({
  subject,
  dirt: 'items/mud',
  tool: 'items/sponge',
  intro: { zh: `${zh}身上脏脏的，帮它洗洗澡`, en: `The ${en} is muddy. Let's give it a bath!` },
  done: { zh: `${zh}洗得真干净！`, en: `Squeaky clean ${en}!` },
});

const carWash = (subject: string, zh: string, en: string): ScrubScene => ({
  subject,
  dirt: 'items/mud',
  tool: 'items/sponge',
  intro: { zh: `${zh}脏了，帮它洗一洗`, en: `The ${en} is dirty. Let's wash it!` },
  done: { zh: `${zh}亮晶晶！`, en: `Shiny ${en}!` },
});

export const SCRUB_SETS: Record<string, ScrubScene[]> = {
  bath: [
    bath('items/pig', '小猪', 'piggy'),
    bath('items/dog', '小狗', 'puppy'),
    bath('items/elephant', '小象', 'elephant'),
    bath('items/sheep', '小羊', 'sheep'),
  ],
  teeth: [
    {
      subject: 'items/tooth',
      dirt: 'items/germ',
      tool: 'items/toothbrush',
      intro: { zh: '牙齿上有小细菌，快来刷刷牙', en: 'Germs on the tooth! Brush, brush, brush!' },
      done: { zh: '牙齿白白亮亮！', en: 'Shiny clean teeth!' },
    },
  ],
  hands: [
    {
      subject: 'items/hand',
      dirt: 'items/germ',
      tool: 'items/soap',
      intro: { zh: '小手上有细菌，用肥皂洗洗手', en: 'Germs on your hand! Wash with soap!' },
      done: { zh: '小手洗干净啦！', en: 'Clean hands!' },
    },
  ],
  cars: [
    carWash('items/car', '小汽车', 'car'),
    carWash('items/bus', '公交车', 'bus'),
    carWash('items/firetruck', '消防车', 'fire truck'),
    carWash('items/tractor', '拖拉机', 'tractor'),
  ],
};
