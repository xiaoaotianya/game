// 插画渲染：有图用图，没图回退 emoji。图片尺寸为 1em × 1em，与 emoji 字形等大，
// 因此模块里用 font-size 控制大小的写法无需改动。

/** public/art 下的图片路径，如 'ui/house' → art/ui/house.webp */
export const artUrl = (path: string) => `${import.meta.env.BASE_URL}art/${path}.webp`;

const img = (src: string) => `<img class="pic" src="${src}" alt="" draggable="false">`;

/** 内容项：优先 image，否则 emoji */
export function pic(it: { emoji: string; image?: string }): string {
  return it.image ? img(it.image) : it.emoji;
}

/** 图标：'ui/xxx' / 'items/xxx' 视为插画路径，其余按 emoji 原样输出 */
export function iconHtml(icon: string): string {
  return /^(ui|items)\//.test(icon) ? img(artUrl(icon)) : icon;
}

/** 预加载图片，最多等待 timeout 毫秒 */
export function preload(urls: string[], timeout = 1500): Promise<void> {
  const all = urls.map(
    (u) =>
      new Promise<void>((resolve) => {
        const i = new Image();
        i.onload = i.onerror = () => resolve();
        i.src = u;
      }),
  );
  return Promise.race([Promise.all(all).then(() => {}), new Promise<void>((r) => setTimeout(r, timeout))]);
}
