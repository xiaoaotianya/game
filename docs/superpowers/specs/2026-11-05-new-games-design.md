# 新游戏：躲猫猫、刮刮乐、形状投投盒、谁吃什么 / 送回家、小鼓手

日期：2026-11-05

## 目标

在现有「玩法模板 × 内容包」架构上新增 5 个模块、13 个活动，不改动板块结构和模块契约。

## 模块

| 模块 id | 板块 | 活动（id · 内容包 · 参数） | levels |
|---|---|---|---|
| `peek` 躲猫猫 | games | `peek-animals` animals · scene=hole；`peek-ocean` ocean · scene=sea；`peek-nature` nature · scene=grass | 3：3/4/6 个洞，等级越高探头时间越短 |
| `scratch` 刮刮乐 | games | `scratch-animals` animals；`scratch-vehicles` vehicles；`scratch-fruits` fruits | 1 |
| `shape-box` 形状投投盒 | brain | `shape-box` shapes | 3：2/3/4 种洞 |
| `feed-match` 谁吃什么 / 送回家 | brain | `eat-match` · set=food；`home-match` · set=home | 3：2/3/4 对 |
| `drum` 小鼓手 | music | `drum-free` · mode=free；`drum-echo` · mode=echo | 3（仅 echo 用）：节奏长度 2/3/4 下 |

### peek 躲猫猫
- 场景是 N 个洞（hole：土洞；sea：礁石；grass：草丛），用 CSS 绘制。
- 每隔一段时间随机一个空洞探出一个内容项（从下往上滑出），停留 `2.6s - level*0.5s` 后缩回。
- 点中：pop 音效 + 震动 + 粒子特效 + 读 `callOf`，顶部星星条 +1；满 10 颗星就 celebrate，`progress.round({ mistakes: 0 })`，然后重开一轮。
- 点空洞只给轻微反馈（sfx.note），不算失误。
- hint：让当前探头的那只发光。

### scratch 刮刮乐
- 卡片中央是内容项大图，上面盖一层 canvas 彩色涂层（渐变加问号），用 `destination-out` 圆刷擦除，pointer 事件逐点连成线。
- 每次抬手后，抽样（步长 8px）统计 alpha=0 的比例，≥55% 时淡出涂层，读名字 + 粒子特效，2s 后换下一张（不和上一张重复）；每 5 张 celebrate 一次。
- canvas 尺寸跟随卡片 DPR，监听 resize 后重建涂层。
- hint：在涂层上画一个提示手指的 wiggle。

### shape-box 形状投投盒
- 上方是盒子（CSS 立体盒），盒盖上开 n 个洞：形状剪影 `.sil`，内容取 shapes 包中有插画的项。
- 下方共 n+1~n+2 块形状（每种至少一块，其余随机重复），用 `sdk.input.draggable` 拖到对应的洞，命中后飞进洞里并缩小消失（「咚」），读形状名。
- 拖错：boing + wiggle，mistakes+1。全部投完 → round + celebrate → 下一轮。

### feed-match 谁吃什么 / 送回家
- 配对数据放在 `src/content/pairs.ts`：`{ id, a: icon, b: icon, aName, bName, line: Text }`。
  - food：兔子-胡萝卜、狗-骨头、猴子-香蕉、熊猫-竹子、老鼠-奶酪、小熊-蜂蜜、猫-鱼、小鸡-玉米
  - home：鱼-🌊 大海、鹦鹉-大树、蜜蜂-向日葵、小狗-房子、企鹅-雪人（冰雪世界）、毛毛虫-树叶、青蛙-🪷 池塘
- 上面一排是 n 只动物（作为 target），下面一排是打乱的 n 个东西（作为 tile）；配对成功后，food 模式下动物张嘴「啊呜」、东西缩小消失；home 模式下动物飞进家里。读 `line`（如「小兔爱吃胡萝卜」）。
- 点 tile 读它的名字。错误时 boing + wiggle，mistakes+1。

### drum 小鼓手
- SDK 新增 `sfx.drum(kind: 'big' | 'snare' | 'cymbal' | 'shaker')`，用 WebAudio 合成（正弦扫频 + 噪声 buffer + 滤波）。
- 4 个乐器用 CSS 绘制，按下有缩放和光圈；中间有一只小动物，敲击时跳一下（free 模式下每 8 下换一只）。
- echo 模式：乐器按顺序亮灯并发声（间隔 600ms）→ 宝宝跟着敲：敲对就亮绿，敲错就 boing 并重放一遍（mistakes+1）；整段敲完 → round + celebrate。
- 敲击期间乐器锁定，避免演示时误触。

## 公共约定
定时器统一用 `sdk.later`；样式类名前缀 `g-peek / g-scratch / g-sbox / g-fm / g-drum`；竖屏和横屏都适配；实现 hint；每个活动都配齐中英文标题。

## 验收
- `npm run build` 通过（含 vue-tsc 类型检查）。
- 用 Playwright 在 390×844（手机竖屏）和 1180×820（平板横屏）两种尺寸下打开 13 个活动，截图检查布局，并实际操作一轮核心交互。
