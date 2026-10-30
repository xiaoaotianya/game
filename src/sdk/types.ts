// 平台核心类型：模块契约、内容包、活动。新增模块/内容只依赖这里的定义。

export type Lang = 'zh' | 'en' | 'both';

/** 双语文本 */
export interface Text {
  zh: string;
  en: string;
}

/** 能力标签，用于学习报告和难度调整 */
export type SkillId =
  | 'cognition'   // 认知
  | 'language'    // 语言
  | 'english'     // 英语
  | 'number'      // 数量
  | 'color-shape' // 颜色形状
  | 'fine-motor'  // 精细动作
  | 'music'       // 音乐
  | 'creativity'  // 创造
  | 'habit';      // 生活习惯

export type ColorId = 'red' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple';

// ---------------- 内容层 ----------------

/** 内容包中的一项（一个动物、一种水果……） */
export interface PackItem {
  id: string;
  emoji: string;       // 原型阶段用 emoji，后续可用 image 替换
  image?: string;
  name: Text;
  sound?: Text;        // 叫声 / 拟声词
  color?: ColorId;
}

export interface ContentPack {
  id: string;
  title: Text;
  icon: string;
  items: PackItem[];
}

// ---------------- 模块契约 ----------------

export type ModuleKind = 'game' | 'course' | 'media' | 'tool';

export interface ModuleManifest {
  id: string;
  kind: ModuleKind;
  skills: SkillId[];
  /** 难度档位数，1 表示不分级 */
  levels: number;
  /** 懒加载模块实现，返回工厂函数，每次进入都创建新实例 */
  load: () => Promise<{ default: () => ModuleImpl }>;
}

export interface ModuleImpl {
  mount(el: HTMLElement, sdk: SDK, ctx: ActivityContext): void;
  unmount?(): void;
  /** 孩子发呆时平台会调用 */
  hint?(): void;
}

// ---------------- 板块 / 活动 ----------------

export interface Section {
  id: string;
  title: Text;
  icon: string;
  color: string;
}

/** 活动 = 模块（玩法模板） + 内容包 + 参数 */
export interface Activity {
  id: string;
  section: string;
  module: string;
  pack?: string;
  title: Text;
  icon: string;
  color: string;
  params?: Record<string, unknown>;
}

export interface ActivityContext {
  activity: Activity;
  pack?: ContentPack;
}

// ---------------- SDK ----------------

export interface DragOptions {
  targets: () => Element[];
  accept: (target: Element) => boolean;
  onDrop: (target: Element) => void;
  onMiss?: (target?: Element) => void;
  onTap?: () => void;
}

export interface RoundResult {
  mistakes: number;
}

export interface SDK {
  /** 当前语言设置 */
  lang(): Lang;
  /** 按语言设置显示的文字 */
  label(t: Text): string;
  /** 语音播报（按语言设置读中文/英文/两者） */
  say(t: Text | string): void;
  sfx: {
    pop(): void;
    ding(step?: number): void;
    boing(): void;
    win(): void;
    note(freq: number): void;
  };
  buzz(ms?: number): void;
  /** 定时器，离开模块时自动清理 */
  later(fn: () => void, ms: number): void;
  input: {
    draggable(el: HTMLElement, o: DragOptions): void;
    flyTo(el: HTMLElement, dest: Element, cls?: string | null, done?: () => void): void;
  };
  fx: {
    burst(x: number, y: number, emojis?: string[], count?: number): void;
    wiggle(el: Element): void;
    centerOf(el: Element): { x: number; y: number };
    floatUp(x: number, y: number, emoji: string): void;
  };
  reward: {
    /** 过关庆祝，结束后回调 */
    celebrate(done?: () => void): void;
  };
  progress: {
    /** 当前难度（0 起），由平台根据表现自动调整 */
    level(): number;
    /** 每完成一轮调用一次 */
    round(r: RoundResult): void;
  };
}
