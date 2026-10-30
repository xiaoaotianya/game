// 本地存储抽象。后续接云同步时只需替换这里的实现。

const PREFIX = 'pp_';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // 隐私模式或空间不足时忽略
    }
  },
};
