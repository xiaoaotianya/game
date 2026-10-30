"""把 Seedream 生成的 N×M 贴纸图集切成单张透明 WebP。

用法：python art/slice.py <sheet.jpg> <rows> <cols> <id1,id2,...> <outdir> [size]
  - id 按从左到右、从上到下的顺序；写 '-' 表示跳过该格
  - 背景：从图片边缘做白色区域填充 → 透明，边缘按"从白底反混合"做抗锯齿，角色内部的白色不受影响
  - 每个格子取质心落在该格的连通块，因此角色稍微出格也不会被截断
同时输出 <outdir>/_preview_<sheet名>.png，用于人工检查。
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

WHITE_T = 200      # min(R,G,B) 高于此值视为可能的背景
BG_LEVEL = 238     # 背景中 min(RGB) ≥ 此值 → 完全透明（底色约 249，带少量噪点）
FRINGE = 38        # 低于 BG_LEVEL-FRINGE → 完全不透明，中间按比例做抗锯齿
MERGE_PX = 5       # 合并同一角色内分离部件（胡须、角）的膨胀半径
MIN_AREA = 2000


def process(sheet: str, rows: int, cols: int, ids: list[str], outdir: str, size: int = 512):
    im = Image.open(sheet).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    H, W, _ = a.shape
    w = a.min(axis=2)

    # 与图片边缘连通的浅色区域 = 背景
    lab, _ = ndi.label(w > WHITE_T)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])

    alpha = np.ones((H, W), np.float32)
    alpha[bg] = np.clip((BG_LEVEL - w[bg]) / FRINGE, 0, 1)
    rgb = a.copy()
    m = bg & (alpha > 0)
    al = alpha[m][:, None]
    rgb[m] = np.clip((a[m] - (1 - al) * 255) / al, 0, 255)

    fg = alpha > 0.3
    lab2, n2 = ndi.label(ndi.binary_dilation(fg, iterations=MERGE_PX))
    cells: dict[tuple[int, int], list[int]] = {}
    for i, sl in enumerate(ndi.find_objects(lab2), start=1):
        if sl is None or (lab2[sl] == i).sum() < MIN_AREA:
            continue
        cy, cx = ndi.center_of_mass(lab2[sl] == i)
        r = int((sl[0].start + cy) // (H / rows))
        c = int((sl[1].start + cx) // (W / cols))
        cells.setdefault((r, c), []).append(i)

    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    tiles = []
    for idx, name in enumerate(ids):
        if name == '-':
            continue
        r, c = divmod(idx, cols)
        comps = cells.get((r, c))
        if not comps:
            print('MISSING', name)
            continue
        mask = np.isin(lab2, comps) & fg
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(mask[y0:y1, x0:x1], crop[..., 3], 0)
        # 居中放到正方形画布，四周留 4% 边距
        side = int(max(y1 - y0, x1 - x0) * 1.08)
        canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        canvas.paste(Image.fromarray(crop), ((side - (x1 - x0)) // 2, (side - (y1 - y0)) // 2))
        canvas = canvas.resize((size, size), Image.LANCZOS)
        canvas.save(out / f'{name}.webp', 'WEBP', quality=88, method=6)
        tiles.append(canvas)
        print('ok', name, f'{x1 - x0}x{y1 - y0}')

    # 预览：彩色底上排列，便于检查抠图边缘
    if tiles:
        t = 160
        pc = 6
        pr = (len(tiles) + pc - 1) // pc
        prev = Image.new('RGBA', (pc * t, pr * t), (120, 190, 255, 255))
        for i, tile in enumerate(tiles):
            prev.alpha_composite(tile.resize((t, t)), ((i % pc) * t, (i // pc) * t))
        prev.save(out / f'_preview_{Path(sheet).stem}.png')


if __name__ == '__main__':
    sheet, rows, cols, ids, outdir = sys.argv[1:6]
    size = int(sys.argv[6]) if len(sys.argv) > 6 else 512
    process(sheet, int(rows), int(cols), ids.split(','), outdir, size)
