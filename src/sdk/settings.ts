import { reactive, watch } from 'vue';
import { storage } from './storage';
import type { Lang, Text } from './types';

export interface Settings {
  lang: Lang;
  /** 每日分钟数，0 = 不限 */
  limit: number;
  voice: boolean;
  name: string;
  /** 家长关掉的板块 */
  hiddenSections: string[];
}

const defaults: Settings = { lang: 'both', limit: 0, voice: true, name: '', hiddenSections: [] };

export const settings = reactive<Settings>({ ...defaults, ...storage.get('settings', {}) });

watch(settings, (v) => storage.set('settings', v), { deep: true });

/** 界面文字：双语模式显示中文（语音会读两遍） */
export function label(t: Text): string {
  return settings.lang === 'en' ? t.en : t.zh;
}
