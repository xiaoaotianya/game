<script setup lang="ts">
import { computed } from 'vue';
import { settings, label } from '@/sdk/settings';
import { iconHtml } from '@/sdk/art';
import type { Text } from '@/sdk';

const props = defineProps<{ icon: string; title: Text; color: string; index: number }>();
const sub = computed(() => (settings.lang === 'both' ? props.title.en : ''));
</script>

<template>
  <button class="card" :style="{ '--c': color, animationDelay: index * 0.3 + 's' }">
    <span class="ci emoji" v-html="iconHtml(icon)"></span>
    <span class="cn">{{ label(title) }}</span>
    <span v-if="sub" class="ce">{{ sub }}</span>
  </button>
</template>

<style scoped>
.card {
  width: var(--cw); height: calc(var(--cw) * 1.05);
  border-radius: 22%;
  background: var(--c);
  box-shadow: var(--shadow);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1vmin;
  animation: float 3s ease-in-out infinite;
  transition: scale .12s;
}
.card:active { scale: .92; }
.ci { font-size: calc(var(--cw) * .46); }
.cn { font-size: calc(var(--cw) * .13); font-weight: 700; }
.ce { font-size: calc(var(--cw) * .09); opacity: .6; margin-top: -.5vmin; }
</style>
