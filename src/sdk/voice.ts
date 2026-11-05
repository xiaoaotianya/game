// 语音播报。当前使用系统 TTS；后续接入预生成配音时，在 say() 里优先查找音频即可。
import { settings } from './settings';
import type { Text } from './types';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const voices: { zh?: SpeechSynthesisVoice; en?: SpeechSynthesisVoice } = {};

function chooseVoices() {
  const vs = speechSynthesis.getVoices();
  const by = (re: RegExp) => vs.find((v) => re.test(v.lang.replace('_', '-')));
  voices.zh = by(/^zh-CN/i) || by(/^zh/i);
  voices.en = by(/^en-US/i) || by(/^en/i);
}

if (supported) {
  chooseVoices();
  speechSynthesis.onvoiceschanged = chooseVoices;
}

/** 估算一段话读完要多久（毫秒）：系统 TTS 的结束事件在部分手机上不可靠，用它兜底 */
function estimate(t: Text, langs: ('zh' | 'en')[]) {
  let ms = 400;
  for (const l of langs) {
    const s = t[l] || '';
    ms += l === 'zh' ? s.replace(/[，。！？、,.!?\s]/g, '').length * 290 + 300 : s.split(/\s+/).length * 420 + 300;
  }
  return ms;
}

let seq = 0;

export const voice = {
  /** 播报一段话；done 在读完（或被打断、出错、兜底超时）后调用一次 */
  say(text: Text | string, done?: () => void) {
    const id = ++seq;
    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      done?.();
    };
    if (!supported || !settings.voice) {
      if (done) setTimeout(finish, 600);
      return;
    }
    speechSynthesis.cancel();
    const t = typeof text === 'string' ? { zh: text, en: text } : text;
    const langs: ('zh' | 'en')[] = settings.lang === 'both' ? ['zh', 'en'] : [settings.lang];
    const parts = langs.filter((l) => t[l]);
    if (!parts.length) {
      if (done) setTimeout(finish, 300);
      return;
    }
    parts.forEach((l, i) => {
      const u = new SpeechSynthesisUtterance(t[l]);
      u.lang = l === 'zh' ? 'zh-CN' : 'en-US';
      const v = voices[l];
      if (v) u.voice = v;
      u.rate = l === 'zh' ? 0.95 : 0.9;
      u.pitch = 1.25;
      if (i === parts.length - 1 && done) {
        // 被后来的 say 打断时（seq 变了）也算结束，让流程继续
        u.onend = u.onerror = () => finish();
      }
      speechSynthesis.speak(u);
    });
    if (done) {
      // 兜底：结束事件没来（部分浏览器静默失败），估算时长后照样继续；最长等 15 秒
      setTimeout(finish, Math.min(15000, estimate(t, parts) * 1.6 + 800));
      // 被新的 say 取消时，cancel 不一定触发 onend，这里轮询一下
      const poll = () => {
        if (fired) return;
        if (seq !== id) return finish();
        setTimeout(poll, 300);
      };
      setTimeout(poll, 300);
    }
  },
  stop() {
    seq++;
    if (supported) speechSynthesis.cancel();
  },
};
