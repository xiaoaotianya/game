<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { unlockAudio } from '@/sdk/audio';
import { session, addSecond, overLimit } from './shell/session';
import ParentGate from './shell/ParentGate.vue';
import ParentPanel from './shell/ParentPanel.vue';
import RestOverlay from './shell/RestOverlay.vue';

const route = useRoute();
const router = useRouter();
const parentOpen = ref(false);
const playing = computed(() => route.name === 'play');

let tick = 0;
onMounted(() => {
  session.resting = overLimit();
  tick = window.setInterval(() => {
    if (!playing.value || document.hidden) return;
    addSecond();
    if (overLimit()) {
      session.resting = true;
      router.push({ name: 'home' });
    }
  }, 1000);
});
onBeforeUnmount(() => clearInterval(tick));

// 浏览器要求在用户手势里解锁音频
const unlock = () => unlockAudio();
document.addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

function closeParent() {
  parentOpen.value = false;
  session.resting = overLimit();
}
</script>

<template>
  <RouterView :key="route.fullPath" />
  <RestOverlay v-if="session.resting" />
  <ParentGate v-if="!playing || session.resting" @open="parentOpen = true" />
  <ParentPanel v-if="parentOpen" @close="closeParent" />
</template>
