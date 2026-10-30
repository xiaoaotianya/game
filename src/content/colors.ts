import type { ColorId, Text } from '@/sdk';

export const COLORS: Record<ColorId, Text & { hex: string }> = {
  red: { zh: '红色', en: 'red', hex: '#ff6b6b' },
  yellow: { zh: '黄色', en: 'yellow', hex: '#ffd43b' },
  blue: { zh: '蓝色', en: 'blue', hex: '#4dabf7' },
  green: { zh: '绿色', en: 'green', hex: '#69db7c' },
  orange: { zh: '橙色', en: 'orange', hex: '#ff922b' },
  purple: { zh: '紫色', en: 'purple', hex: '#b197fc' },
};
