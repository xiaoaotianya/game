<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { voice } from '@/sdk/voice';
import { activitiesOf } from '@/content';
import BigCard from './BigCard.vue';
import { iconHtml } from '@/sdk/art';
import type { Activity } from '@/sdk';

const props = defineProps<{ id: string }>();
const router = useRouter();
const list = computed(() => activitiesOf(props.id));

function open(a: Activity) {
  voice.say(a.title);
  // 尽量全屏（安卓有效；iOS 请用「添加到主屏幕」）
  const de = document.documentElement;
  if (de.requestFullscreen && !document.fullscreenElement && !matchMedia('(display-mode: fullscreen)').matches) {
    de.requestFullscreen().catch(() => {});
  }
  router.push({ name: 'play', params: { id: a.id } });
}
</script>

<template>
  <div class="screen">
    <button class="round-btn emoji" aria-label="首页" @click="router.push({ name: 'home' })" v-html="iconHtml('ui/house')"></button>
    <main class="cards">
      <BigCard v-for="(a, i) in list" :key="a.id" v-bind="a" :index="i" @click="open(a)" />
    </main>
  </div>
</template>

<style scoped>
.cards {
  flex: 1;
  display: flex; flex-wrap: wrap; align-content: safe center; justify-content: center;
  gap: 4vmin;
  padding: calc(env(safe-area-inset-top) + var(--hb) + 3vmin) 4vw calc(env(safe-area-inset-bottom) + 4vmin);
  overflow-y: auto;
  touch-action: pan-y;
}
</style>
