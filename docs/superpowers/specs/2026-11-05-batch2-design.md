# 第二批新模块：生活习惯三件套、认识情绪、数学启蒙、动手玩

日期：2026-11-05

11 个新模块，新增 2 个板块（`feelings` 认识情绪、`math` 数学启蒙），不改动模块契约。

| 模块 id | 板块 | 活动 | levels | 玩法 |
|---|---|---|---|---|
| `tidy-up` 收玩具 | habit | `tidy-toys` | 3：3/4/6 件 | 玩具散在地板上，拖进玩具箱，箱盖「啪」一声；全部收完后房间变亮 → 庆祝 |
| `dress-up` 穿衣服 | habit | `dress-weather` | 3：选项 3/4/5 个 | 先给出天气（晴/雨/冷），把 2 件合适的东西拖给小熊；拖错时 wiggle + 语音解释 |
| `day-order` 一天的顺序 | habit | `order-morning`（set=morning）、`order-night`（set=night） | 3：2/3/4 步 | 打乱的生活卡片拖进编号格子 ①②③④，必须按顺序放（下一个空格才接受） |
| `emotion-cards` 表情卡片 | feelings | `feel-cards` | 1 | 5 种 CSS 画的表情脸，左右翻看；点脸会做动作并读出说明 |
| `emotion-story` 它怎么了 | feelings | `feel-story` | 2：2/3 张脸 | 小动物 + 场景物品 + 一句小故事，选它此刻的表情 |
| `size-order` 排排队 | math | `size-animals`、`size-fruits` | 2：3/4 个 | 同一项内容不同大小，从小到大拖进格子 |
| `pattern` 找规律 | math | `pattern-colors`、`pattern-fruits`、`pattern-shapes` | 3：AB / AAB·ABB / ABC | 规律序列最后一个是问号，从 2–3 个选项里点对的 |
| `share` 分一分 | math | `share-apples` | 3：2/3/4 只 | 每只动物分一个，边分边数；同一只不能分两个 |
| `fishing` 钓鱼 | games | `fish-ocean` | 3：自由钓 / 按名字钓 / 按名字钓且游得快 | 海洋动物在水里来回游，点一下就钓上来读名字，桶里满 5 条庆祝 |
| `stack` 叠高高 | games | `stack-blocks` | 3：摆动速度 | 积木在上方左右摆动，点击落下；偏移超过容差（宽度的 55%）就倒（不算失败，笑着重来），叠到 5 层庆祝 |
| `trace` 小车开回家 | games | `trace-cars`（vehicles） | 3：直路 / 弯路 / S 弯 | 用 SVG 画马路；手指拖着小车沿路前进（把指针投影到路径上），离路太远就停下；到终点后庆祝 |

## 表情（feelings）
`src/modules/emotion-cards/face.ts` 导出 `faceHtml(id)` 和 `EMOTIONS` 数据（happy、sad、angry、scared、surprised），由两个情绪模块共用。脸用 CSS 画（圆脸 + 眼睛、眉毛、嘴的形状），风格统一，不依赖 emoji。

## 公共约定
沿用上一批：只通过 SDK 发声、计时和上报进度；定时器用 `sdk.later`；样式类名加模块前缀；横竖屏都适配；实现 `hint()`；遵守《规划》第 4 节的儿童产品设计守则。

## 验收
`npm run build` 通过；在 390×844 和 1180×820 下逐个打开截图，并操作一轮核心交互；首页 9 个板块在竖屏下能一屏放下。
