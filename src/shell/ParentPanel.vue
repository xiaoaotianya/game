<script setup lang="ts">
import { computed } from 'vue';
import { settings } from '@/sdk/settings';
import { progress } from '@/sdk/progress';
import { sections } from '@/content';
import { session, resetToday } from './session';
import type { Lang, SkillId } from '@/sdk';

const emit = defineEmits<{ close: [] }>();

const langs: { v: Lang; t: string }[] = [
  { v: 'zh', t: '中文' },
  { v: 'en', t: 'English' },
  { v: 'both', t: '中英双语' },
];
const limits = [0, 10, 15, 20, 30];

const SKILL_NAMES: Record<SkillId, string> = {
  cognition: '认知', language: '语言', english: '英语', number: '数量', 'color-shape': '颜色形状',
  'fine-motor': '精细动作', music: '音乐', creativity: '创造', habit: '生活习惯',
};

const todayMin = computed(() => Math.floor(session.today.sec / 60));
const summary = computed(() => {
  const s = progress.skillSummary(7);
  const max = Math.max(1, ...Object.values(s));
  return (Object.keys(s) as SkillId[])
    .map((k) => ({ k, name: SKILL_NAMES[k], n: s[k]!, pct: (s[k]! / max) * 100 }))
    .sort((a, b) => b.n - a.n);
});

function toggleSection(id: string) {
  const i = settings.hiddenSections.indexOf(id);
  if (i >= 0) settings.hiddenSections.splice(i, 1);
  else settings.hiddenSections.push(id);
}
</script>

<template>
  <div class="overlay">
    <div class="panel">
      <h2>家长设置</h2>

      <div class="field">
        <label>语言</label>
        <div class="seg">
          <button v-for="l in langs" :key="l.v" :class="{ on: settings.lang === l.v }" @click="settings.lang = l.v">{{ l.t }}</button>
        </div>
      </div>

      <div class="field">
        <label>每日时长</label>
        <div class="seg">
          <button v-for="m in limits" :key="m" :class="{ on: settings.limit === m }" @click="settings.limit = m">
            {{ m ? m + '分' : '不限' }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>语音</label>
        <div class="seg">
          <button :class="{ on: settings.voice }" @click="settings.voice = true">开</button>
          <button :class="{ on: !settings.voice }" @click="settings.voice = false">关</button>
        </div>
      </div>

      <div class="field">
        <label>宝宝名字</label>
        <input v-model.trim="settings.name" maxlength="8" placeholder="例如：佩佩（会出现在标题和表扬里）" />
      </div>

      <div class="field">
        <label>显示的板块</label>
        <div class="seg">
          <button
            v-for="s in sections"
            :key="s.id"
            :class="{ on: !settings.hiddenSections.includes(s.id) }"
            @click="toggleSection(s.id)"
          >{{ s.icon }} {{ s.title.zh }}</button>
        </div>
      </div>

      <div class="field">
        <label>今天已玩 {{ todayMin }} 分钟 <button class="link" @click="resetToday">清零</button></label>
      </div>

      <div class="field">
        <label>近 7 天练习（轮数）</label>
        <p v-if="!summary.length" class="tip">还没有记录，玩几局再来看看。</p>
        <div v-for="r in summary" :key="r.k" class="bar">
          <span class="bn">{{ r.name }}</span>
          <span class="bt"><span class="bf" :style="{ width: r.pct + '%' }"></span></span>
          <span class="bv">{{ r.n }}</span>
        </div>
      </div>

      <p class="tip">小贴士：在浏览器菜单里选「添加到主屏幕」，就能像 App 一样全屏、离线打开。长按右上角 ⚙️ 2 秒进入本页。</p>
      <button class="primary" @click="emit('close')">完成</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 100;
  display: grid; place-items: center;
  padding: 16px;
  background: rgba(40, 30, 70, .45);
}
.panel {
  width: 100%; max-width: 480px; max-height: 92vh;
  overflow: auto; touch-action: pan-y;
  background: #fff; border-radius: 20px;
  padding: 22px 20px;
  font-size: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
}
h2 { font-size: 20px; margin-bottom: 14px; }
.field { margin-bottom: 14px; }
.field > label { display: block; font-weight: 600; margin-bottom: 6px; }
.seg { display: flex; flex-wrap: wrap; gap: 6px; }
.seg button { padding: 8px 14px; border-radius: 999px; background: #f1edf8; }
.seg button.on { background: #7c5cff; color: #fff; }
input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #ddd5ee; border-radius: 10px;
  font: inherit; user-select: text; -webkit-user-select: text;
}
.link { color: #7c5cff; text-decoration: underline; margin-left: 8px; font-weight: 400; }
.bar { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 13px; }
.bn { width: 5em; }
.bt { flex: 1; height: 10px; background: #f1edf8; border-radius: 99px; overflow: hidden; }
.bf { display: block; height: 100%; background: #7c5cff; border-radius: 99px; }
.bv { width: 2.5em; text-align: right; color: #8a7fa3; }
.tip { font-size: 13px; color: #8a7fa3; line-height: 1.6; margin-bottom: 16px; }
.primary { width: 100%; padding: 12px; border-radius: 12px; background: #7c5cff; color: #fff; font-weight: 700; font-size: 16px; }
</style>
