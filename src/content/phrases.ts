import type { PackItem, Text } from '@/sdk';

export const nameOf = (it: PackItem): Text => it.name;

/** 名字 + 叫声，例如「小猫，喵喵」 */
export const callOf = (it: PackItem): Text => ({
  zh: it.name.zh + (it.sound ? '，' + it.sound.zh : ''),
  en: it.name.en + (it.sound ? ', ' + it.sound.en : ''),
});

export const ZH_QTY = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'];
export const ZH_CNT = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export const EN_NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** 数数时读的数字，例如 3 →「三 / three」 */
export const countOf = (n: number): Text => ({ zh: ZH_CNT[n], en: EN_NUM[n] });

/** 英文复数：cherry → cherries，peach → peaches，sheep / fish 不变 */
export function plural(en: string): string {
  if (/(sheep|fish|deer|peas|shoes|socks|grapes)$/.test(en)) return en;
  if (/[^aeiou]y$/.test(en)) return en.slice(0, -1) + 'ies';
  if (/(s|sh|ch|x|o)$/.test(en)) return en + 'es';
  return en + 's';
}

/** 数量 + 量词 + 名字，例如「三只小猫 / three cats」 */
export const qtyOf = (n: number, it: PackItem, unit = '个'): Text => ({
  zh: `${ZH_QTY[n]}${unit}${it.name.zh}`,
  en: `${EN_NUM[n]} ${n > 1 ? plural(it.name.en) : it.name.en}`,
});
