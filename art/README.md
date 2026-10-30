# 插画生产流程

所有内容插画用 Seedream 生成，**一张图集出一批**（3×3 / 3×4 / 4×4 网格），再切成单张透明 WebP。

```
art/sheets/*.jpg      Seedream 生成的原始图集（源文件，保留）
art/slice.py          切图 + 去白底 + 裁剪 → 512px 透明 WebP
art/previews/         切图结果的彩色底预览（人工检查用，不打包）
public/art/items/     内容项插画，文件名 = 内容包里的 id（跨包同 id 共用一张）
public/art/ui/        界面图标（板块/活动图标、房子、月亮、奖杯等）
src/content/art-manifest.ts   已有插画的 id 列表（切图后重新生成）
```

## 新增一批插画

1. 用下面的风格模板写提示词，把要画的东西**按从左到右、从上到下**列出来；`images` 参数传 `art/sheets/animals.jpg` 的在线地址（或任意一张已有图集）作为画风参考。
2. 下载到 `art/sheets/<名字>.jpg`，先看一眼顺序是否和要求一致（模型偶尔会交换位置）。
3. 切图：
   ```bash
   python art/slice.py art/sheets/<名字>.jpg <行> <列> id1,id2,-,id4,... public/art/items
   ```
   `-` 表示跳过该格（画错的格子）。检查 `public/art/items/_preview_<名字>.png` 后移到 `art/previews/`。
4. 重新生成清单：
   ```bash
   { echo "// 由 art/slice.py 切图后生成：public/art/items 下已有插画的 id"; echo "export const ITEM_ART = new Set(["; ls public/art/items/*.webp | xargs -n1 basename | sed 's/\.webp$//' | sed "s/.*/  '&',/"; echo "]);"; } > src/content/art-manifest.ts
   ```
   内容包里 id 相同的条目会自动使用插画，没有插画的继续显示 emoji。

## 风格模板

```
儿童绘本风格的可爱卡通贴纸图集，<R>行<C>列整齐网格排列，共<N>个独立<物品>，每个居中放在自己的格子里，彼此之间留有大量纯白空隙，互不重叠、不出格。
按从左到右、从上到下顺序：第一行：……；第二行：……
每个都是圆润Q版造型、大眼睛、微笑、表情友善，适合2岁幼儿。
画风与参考图完全一致（参考图仅用于画风，不要画参考图里的东西）：柔和扁平插画加轻微立体感，粗细一致的深棕色圆润描边，明亮柔和的色彩，脸颊粉色腮红，简单干净，无阴影投影，无地面，无装饰元素。
纯白色背景，画面无文字，高清细节，杰作
```

尺寸：4×4 / 3×3 用 `2048x2048`，3×4 用 `2304x1728`。

## 已知情况

- 海洋图集里「鱿鱼」被画成了第二只章鱼，已跳过并从海洋包移除。
- 交通图集里飞机和帆船位置互换，切图时已按实际位置命名。

## 涂色线稿

线稿也用 Seedream 生成（2×2 网格，提示词要写明：纯黑粗线、轮廓闭合、大块区域、身体上不要画分割线、不填色）。生成后运行：

```
python art/coloring.py art/sheets/<线稿图>.jpg 2 2 cat,fish,duck,bunny
```

脚本会去掉每格的方框、补上线条的小缺口，并给每块封闭区域编号，输出到 `public/art/coloring/`（`<id>.png` 线稿 + `<id>.regions.png` 区域图）。最后在 `src/content/coloring-pages.ts` 里加一行。
