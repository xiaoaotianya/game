import type { ColorId, Text } from '@/sdk';

export const COLORS: Record<ColorId, Text & { hex: string }> = {
  red: { zh: '红色', en: 'red', hex: '#ff6b6b' },
  yellow: { zh: '黄色', en: 'yellow', hex: '#ffd43b' },
  blue: { zh: '蓝色', en: 'blue', hex: '#4dabf7' },
  green: { zh: '绿色', en: 'green', hex: '#69db7c' },
  orange: { zh: '橙色', en: 'orange', hex: '#ff922b' },
  purple: { zh: '紫色', en: 'purple', hex: '#b197fc' },
};

/** 画板颜料盒：涂色和涂鸦共用 */
export const PAINTS: (Text & { hex: string })[] = [
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  { zh: '天蓝色', en: 'sky blue', hex: '#66d9e8' },
  COLORS.blue,
  COLORS.purple,
  { zh: '粉色', en: 'pink', hex: '#faa2c1' },
  { zh: '棕色', en: 'brown', hex: '#c08457' },
  { zh: '白色', en: 'white', hex: '#ffffff' },
];
