<script setup lang="ts">
// 家长入口：长按 2 秒解锁，防止孩子误入
import { ref } from 'vue';

const emit = defineEmits<{ open: [] }>();
const holding = ref(false);
let timer = 0;

function start() {
  holding.value = true;
  timer = window.setTimeout(() => {
    cancel();
    emit('open');
  }, 2000);
}
function cancel() {
  clearTimeout(timer);
  holding.value = false;
}
</script>

<template>
  <button
    class="gear"
    :class="{ holding }"
    aria-label="家长设置（长按）"
    @pointerdown.stop="start"
    @pointerup="cancel"
    @pointerleave="cancel"
    @pointercancel="cancel"
  >
    <svg viewBox="0 0 36 36">
      <circle class="ring-bg" cx="18" cy="18" r="16" />
      <circle class="ring" cx="18" cy="18" r="16" pathLength="100" />
    </svg>
    <span class="emoji">⚙️</span>
  </button>
</template>

<style scoped>
.gear {
  position: fixed; z-index: 95;
  top: calc(env(safe-area-inset-top) + 10px); right: calc(env(safe-area-inset-right) + 10px);
  width: 52px; height: 52px;
  display: grid; place-items: center;
  opacity: .55;
}
.gear > * { grid-area: 1 / 1; }
.emoji { font-size: 24px; }
svg { width: 100%; height: 100%; rotate: -90deg; }
circle { fill: none; stroke-width: 3; }
.ring-bg { stroke: rgba(74, 59, 107, .12); }
.ring { stroke: #ff922b; stroke-dasharray: 100; stroke-dashoffset: 100; stroke-linecap: round; }
.holding { opacity: 1; }
.holding .ring { animation: ring 2s linear forwards; }
@keyframes ring { to { stroke-dashoffset: 0; } }
</style>
