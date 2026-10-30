// 学习记录与自适应难度

import { storage } from './storage';
import type { SkillId } from './types';

export interface RoundRecord {
  activity: string;
  skills: SkillId[];
  at: number;
  ms: number;
  mistakes: number;
  level: number;
}

const MAX_RECORDS = 1000;
const records: RoundRecord[] = storage.get('records', []);
const levels: Record<string, number> = storage.get('levels', {});
/** 连续零失误轮数，用于升级 */
const streaks: Record<string, number> = {};

export const progress = {
  level(activity: string) {
    return levels[activity] ?? 0;
  },

  record(r: RoundRecord, maxLevel: number) {
    records.push(r);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    storage.set('records', records);

    // 连续 2 轮零失误升一级；一轮失误 ≥3 次降一级
    const cur = levels[r.activity] ?? 0;
    let next = cur;
    if (r.mistakes === 0) {
      streaks[r.activity] = (streaks[r.activity] ?? 0) + 1;
      if (streaks[r.activity] >= 2) {
        next = Math.min(maxLevel - 1, cur + 1);
        streaks[r.activity] = 0;
      }
    } else {
      streaks[r.activity] = 0;
      if (r.mistakes >= 3) next = Math.max(0, cur - 1);
    }
    if (next !== cur) {
      levels[r.activity] = next;
      storage.set('levels', levels);
    }
  },

  /** 最近 days 天各能力的练习轮数 */
  skillSummary(days = 7) {
    const since = Date.now() - days * 86400000;
    const out: Partial<Record<SkillId, number>> = {};
    for (const r of records) {
      if (r.at < since) continue;
      for (const s of r.skills) out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  },
};
