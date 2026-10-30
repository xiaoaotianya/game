import type { PackItem, Text } from '@/sdk';

export const nameOf = (it: PackItem): Text => it.name;

/** 名字 + 叫声，例如「小猫，喵喵」 */
export const callOf = (it: PackItem): Text => ({
  zh: it.name.zh + (it.sound ? '，' + it.sound.zh : ''),
  en: it.name.en + (it.sound ? ', ' + it.sound.en : ''),
});

export const ZH_QTY = ['', '一', '两', '三', '四', '五'];
export const ZH_CNT = ['', '一', '二', '三', '四', '五'];
export const EN_NUM = ['', 'one', 'two', 'three', 'four', 'five'];
