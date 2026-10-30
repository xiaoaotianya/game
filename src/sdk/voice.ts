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

export const voice = {
  say(text: Text | string) {
    if (!supported || !settings.voice) return;
    speechSynthesis.cancel();
    const t = typeof text === 'string' ? { zh: text, en: text } : text;
    const langs: ('zh' | 'en')[] = settings.lang === 'both' ? ['zh', 'en'] : [settings.lang];
    for (const l of langs) {
      if (!t[l]) continue;
      const u = new SpeechSynthesisUtterance(t[l]);
      u.lang = l === 'zh' ? 'zh-CN' : 'en-US';
      const v = voices[l];
      if (v) u.voice = v;
      u.rate = l === 'zh' ? 0.95 : 0.9;
      u.pitch = 1.25;
      speechSynthesis.speak(u);
    }
  },
  stop() {
    if (supported) speechSynthesis.cancel();
  },
};
