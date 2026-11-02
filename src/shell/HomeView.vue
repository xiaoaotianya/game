<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { settings } from '@/sdk/settings';
import { voice } from '@/sdk/voice';
import { sections, activitiesOf } from '@/content';
import BigCard from './BigCard.vue';
import type { Section } from '@/sdk';

const router = useRouter();

const title = computed(() => {
  const n = settings.name;
  if (settings.lang === 'en') return n ? `${n}'s Playland` : 'Playland';
  return n ? `${n}的启蒙乐园` : '宝宝启蒙乐园';
});

const visible = computed(() =>
  sections.filter((s) => !settings.hiddenSections.includes(s.id) && activitiesOf(s.id).length > 0),
);

// 竖屏两列：板块多了卡片要按行数缩小，保证一屏放得下
const rows = computed(() => Math.max(3, Math.ceil(visible.value.length / 2)));

function open(s: Section) {
  voice.say(s.title);
  router.push({ name: 'section', params: { id: s.id } });
}
</script>

<template>
  <div class="screen">
    <header class="head"><h1>{{ title }}</h1></header>
    <main class="cards">
      <BigCard v-for="(s, i) in visible" :key="s.id" v-bind="s" :index="i" @click="open(s)" />
    </main>
  </div>
</template>

<style scoped>
.head { padding: calc(env(safe-area-inset-top) + 3vmin) 80px 1vmin; text-align: center; }
h1 { font-size: clamp(24px, 6.5vmin, 48px); letter-spacing: .05em; text-shadow: 0 .4vmin 0 #fff; }
.cards {
  flex: 1;
  display: flex; flex-wrap: wrap; align-content: center; justify-content: center;
  gap: 4vmin;
  padding: 2vmin 4vw calc(env(safe-area-inset-bottom) + 4vmin);
  /* 兜底：万一还是放不下，可以上下滑（body 禁了触摸手势，这里单独放开纵向滑动） */
  min-height: 0;
  overflow-y: auto;
  align-content: safe center;
  touch-action: pan-y;
  overscroll-behavior: contain;
}
@media (orientation: portrait) {
  /* 可用高度 ≈ 全屏 − 标题 − 上下留白；每行 1.05 张卡高 + 4vmin 间距 */
  .cards {
    --cw: min(40vw, 25vh, calc((100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12vmin - clamp(32px, 8.5vmin, 63px)) / v-bind(rows) / 1.05 - 4vmin));
  }
}
</style>
