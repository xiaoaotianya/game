// 情绪数据 + CSS 画的表情脸，emotion-cards / emotion-story 共用
import type { Text } from '@/sdk';
import './face.css';

export type EmotionId = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised';

export interface Emotion {
  id: EmotionId;
  name: Text;
  explain: Text;
  /** 脸色 */
  color: string;
}

export const EMOTIONS: Emotion[] = [
  { id: 'happy', name: { zh: '开心', en: 'happy' }, explain: { zh: '开心的时候，我们会笑', en: "When we're happy, we smile" }, color: '#ffd43b' },
  { id: 'sad', name: { zh: '难过', en: 'sad' }, explain: { zh: '难过的时候，我们会哭', en: "When we're sad, we cry" }, color: '#74c0fc' },
  { id: 'angry', name: { zh: '生气', en: 'angry' }, explain: { zh: '生气的时候，眉毛会皱起来', en: "When we're angry, we frown" }, color: '#ff8a80' },
  { id: 'scared', name: { zh: '害怕', en: 'scared' }, explain: { zh: '害怕的时候，我们想要抱抱', en: "When we're scared, we want a hug" }, color: '#b197fc' },
  { id: 'surprised', name: { zh: '惊讶', en: 'surprised' }, explain: { zh: '惊讶的时候，嘴巴张成圆圆的', en: "When we're surprised, we say oh" }, color: '#ffa94d' },
];

export const emotionOf = (id: EmotionId): Emotion => EMOTIONS.find((e) => e.id === id)!;

// 每种表情额外的小部件
const EXTRA: Record<EmotionId, string> = {
  happy: '<i class="emo-blush l"></i><i class="emo-blush r"></i>',
  sad: '<i class="emo-tear"></i>',
  angry: '<i class="emo-blush l"></i><i class="emo-blush r"></i>',
  scared: '<i class="emo-sweat"></i>',
  surprised: '',
};

/** 圆脸 HTML，1em × 1em，跟随 font-size */
export function faceHtml(id: EmotionId): string {
  return (
    `<span class="emo-face emo-${id}" data-emo="${id}" style="--c:${emotionOf(id).color}">` +
    '<i class="emo-brow l"></i><i class="emo-brow r"></i><i class="emo-eye l"></i><i class="emo-eye r"></i>' +
    `<i class="emo-mouth"></i>${EXTRA[id]}</span>`
  );
}

/** 触发表情动作（开心跳、难过低头、生气抖、害怕缩、惊讶放大）。
 *  el 是 .emo-face 时按它自己的表情；其他元素（如动物）需传 id */
export function playFace(el: Element, id?: EmotionId) {
  const e = id ?? ((el as HTMLElement).dataset.emo as EmotionId | undefined);
  if (!e) return;
  el.classList.remove('emo-anim', ...EMOTIONS.map((x) => 'emo-act-' + x.id));
  void (el as HTMLElement).offsetWidth;
  el.classList.add(el.classList.contains('emo-face') ? 'emo-anim' : 'emo-act-' + e);
}
