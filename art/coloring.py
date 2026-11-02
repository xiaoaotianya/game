"""涂色线稿处理：把 Seedream 生成的线稿图集切成一张张涂色页。

每页输出两个文件（public/art/coloring/）：
  <id>.png         线稿层：深色线条，透明背景
  <id>.regions.png 区域图：每个可涂区域用 RGB 编码一个 id（id = R + G*256），0 = 线条 / 不可涂

用法：python art/coloring.py <sheet> <rows> <cols> <ids 逗号分隔, '-' 跳过> [size]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / 'public' / 'art' / 'coloring'
LINE_LEVEL = 150     # 灰度低于这个算线条
MIN_REGION = 0.0006  # 面积小于整页这个比例的碎块并入线条（不可涂）
MARGIN = 0.06        # 画面四周留白


def frame_band(comp: np.ndarray) -> np.ndarray:
    """方框连通块里，属于四条边那一圈的像素（画如果挨着框，画本身不在这圈里，会保留下来）。"""
    bh, bw = comp.shape
    rows, cols = comp.mean(1) > 0.5, comp.mean(0) > 0.5

    def depth(full: np.ndarray, n: int) -> int:
        # 从这一边往里，最后一行「几乎整行都是线」的位置（框稍微歪一点也能找到）
        hit = np.nonzero(full[:max(n // 6, 8)])[0]
        return (hit.max() + 1 if len(hit) else 6) + 3

    t, b, l, r = depth(rows, bh), depth(rows[::-1], bh), depth(cols, bw), depth(cols[::-1], bw)
    band = np.zeros_like(comp)
    band[:t] = band[-b:] = True
    band[:, :l] = band[:, -r:] = True
    return comp & band


def process(cell: Image.Image, size: int, pid: str = ''):
    g = np.asarray(cell.convert('L'), dtype=np.float32)
    h, w = g.shape
    line = g < LINE_LEVEL

    # 去掉方框：横竖都几乎贯穿格子的线条（整个框），以及完全贴在边缘的线条（相邻格子的框的残段）
    lab, n = ndimage.label(line)
    band = 0.06
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = lab[sl] == i
        bh, bw = comp.shape
        # 方框 = 很大，而且四条边都是贯穿的直线（动物轮廓没有这种直边）
        t = 6
        sides = [comp[:t].any(0).mean(), comp[-t:].any(0).mean(), comp[:, :t].any(1).mean(), comp[:, -t:].any(1).mean()]
        whole = bh > 0.6 * h and bw > 0.6 * w and min(sides) > 0.8
        edge = (sl[0].stop < band * h or sl[0].start > (1 - band) * h
                or sl[1].stop < band * w or sl[1].start > (1 - band) * w)
        if whole or edge:
            m = np.zeros_like(line)
            if whole:
                # 只擦方框那一圈；画挨着框时，整块连通的线条里画的部分要留下
                m[sl] = frame_band(comp)
                kept = int((comp & ~m[sl]).sum())
                if kept > 0.002 * h * w:
                    print(f'  注意 {pid}: 画挨着方框，已只去掉方框（保留 {kept} 像素），请检查轮廓是否闭合')
            else:
                m[sl] = comp
            m = ndimage.binary_dilation(m, iterations=4)  # 连同抗锯齿的浅灰边一起擦掉
            line[m] = False
            g[m] = 255
    # 去掉噪点
    lab, n = ndimage.label(line)
    sizes = ndimage.sum(line, lab, range(1, n + 1))
    for i, s in enumerate(sizes, 1):
        if s < 40:
            line[lab == i] = False
            g[lab == i] = 255

    # 按线条外接框裁剪成正方形，四周留白
    ys, xs = np.nonzero(line)
    if not len(ys):
        raise ValueError('格子里没有线条（空格子，或者画被当成方框去掉了）')
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    side = int(max(y1 - y0, x1 - x0) * (1 + 2 * MARGIN))
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    canvas = np.full((side, side), 255, np.float32)
    sy, sx = cy - side // 2, cx - side // 2
    src = g[max(sy, 0):sy + side, max(sx, 0):sx + side]
    canvas[max(-sy, 0):max(-sy, 0) + src.shape[0], max(-sx, 0):max(-sx, 0) + src.shape[1]] = src
    g = np.asarray(Image.fromarray(canvas.astype(np.uint8)).resize((size, size), Image.LANCZOS), np.float32)

    # 线条稍微加粗，补上细小缺口，避免颜色漏到外面
    line = ndimage.binary_dilation(g < LINE_LEVEL, iterations=1)
    free = ~line
    lab, n = ndimage.label(free)
    sizes = ndimage.sum(free, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= MIN_REGION * size * size
    lab[~keep[lab]] = 0
    # 重新编号为连续 id
    ids = np.unique(lab[lab > 0])
    remap = np.zeros(n + 1, np.int32)
    remap[ids] = np.arange(1, len(ids) + 1)
    lab = remap[lab]

    # 线稿层：抗锯齿的深色线 + 加粗/碎块部分做成实心，正好盖住填色的边缘
    alpha = np.clip((235 - g) / (235 - 90), 0, 1)
    alpha = np.maximum(alpha, (lab == 0) * 1.0)
    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[..., :3] = (43, 34, 51)
    rgba[..., 3] = (alpha * 255).astype(np.uint8)

    reg = np.zeros((size, size, 3), np.uint8)
    reg[..., 0] = lab % 256
    reg[..., 1] = lab // 256
    return Image.fromarray(rgba, 'RGBA'), Image.fromarray(reg, 'RGB'), len(ids)


def main():
    sheet, rows, cols, ids = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(',')
    size = int(sys.argv[5]) if len(sys.argv) > 5 else 1024
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.open(sheet).convert('RGB')
    W, H = im.size
    for k, pid in enumerate(ids):
        if pid == '-':
            continue
        r, c = divmod(k, cols)
        cell = im.crop((c * W // cols, r * H // rows, (c + 1) * W // cols, (r + 1) * H // rows))
        try:
            line, reg, n = process(cell, size, pid)
        except ValueError as e:
            print(f'{pid}: 跳过，{e}')
            continue
        line.save(OUT / f'{pid}.png', optimize=True)
        reg.save(OUT / f'{pid}.regions.png', optimize=True)
        print(f'{pid}: {n} regions')


if __name__ == '__main__':
    main()
