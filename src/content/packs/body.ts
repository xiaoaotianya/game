// 身体部位：sound 字段用作互动指令，例如「摸摸你的鼻子」
import type { ContentPack } from '@/sdk';

const pack: ContentPack = {
  id: 'body',
  title: { zh: '身体', en: 'My Body' },
  icon: '👃',
  items: [
    { id: 'eye', emoji: '👀', name: { zh: '眼睛', en: 'eyes' }, sound: { zh: '眨眨眼睛', en: 'blink your eyes' } },
    { id: 'ear', emoji: '👂', name: { zh: '耳朵', en: 'ear' }, sound: { zh: '摸摸耳朵', en: 'touch your ear' } },
    { id: 'nose', emoji: '👃', name: { zh: '鼻子', en: 'nose' }, sound: { zh: '摸摸鼻子', en: 'touch your nose' } },
    { id: 'mouth', emoji: '👄', name: { zh: '嘴巴', en: 'mouth' }, sound: { zh: '张开嘴巴', en: 'open your mouth' } },
    { id: 'tongue', emoji: '👅', name: { zh: '舌头', en: 'tongue' }, sound: { zh: '伸伸舌头', en: 'stick out your tongue' } },
    { id: 'tooth', emoji: '🦷', name: { zh: '牙齿', en: 'tooth' }, sound: { zh: '刷刷牙', en: 'brush your teeth' } },
    { id: 'hand', emoji: '✋', name: { zh: '小手', en: 'hand' }, sound: { zh: '拍拍手', en: 'clap your hands' } },
    { id: 'foot', emoji: '🦶', name: { zh: '小脚', en: 'foot' }, sound: { zh: '跺跺脚', en: 'stamp your feet' } },
    { id: 'arm', emoji: '💪', name: { zh: '手臂', en: 'arm' }, sound: { zh: '举起手臂', en: 'raise your arms' } },
  ],
};

export default pack;
