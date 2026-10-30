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
}
</style>
