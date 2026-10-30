<script setup lang="ts">
// 活动运行容器：加载模块 → 创建 SDK → mount；离开时 unmount + 清理
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSDK } from '@/sdk';
import { findActivity, packs } from '@/content';
import { modules } from '@/modules/registry';
import type { ModuleImpl } from '@/sdk';
import { iconHtml, preload } from '@/sdk/art';

const props = defineProps<{ id: string }>();
const router = useRouter();
const stage = ref<HTMLElement>();
const activity = findActivity(props.id);

const IDLE_HINT_MS = 8000;
let impl: ModuleImpl | null = null;
let dispose: (() => void) | null = null;
let lastAct = Date.now();
let idleTimer = 0;
let alive = true;

onMounted(async () => {
  const manifest = activity && modules[activity.module];
  if (!activity || !manifest) {
    router.replace({ name: 'home' });
    return;
  }
  const pack = activity.pack ? packs[activity.pack] : undefined;
  const [mod] = await Promise.all([
    manifest.load(),
    preload((pack?.items ?? []).flatMap((it) => (it.image ? [it.image] : []))),
  ]);
  if (!alive || !stage.value) return;
  const created = createSDK(manifest, activity);
  dispose = created.dispose;
  impl = mod.default();
  impl.mount(stage.value, created.sdk, { activity, pack });

  idleTimer = window.setInterval(() => {
    if (impl?.hint && Date.now() - lastAct > IDLE_HINT_MS) {
      lastAct = Date.now();
      impl.hint();
    }
  }, 1000);
});

onBeforeUnmount(() => {
  alive = false;
  clearInterval(idleTimer);
  impl?.unmount?.();
  dispose?.();
});

function back() {
  router.push(activity ? { name: 'section', params: { id: activity.section } } : { name: 'home' });
}
</script>

<template>
  <div class="screen">
    <button class="round-btn emoji" aria-label="返回" @click="back" v-html="iconHtml('ui/house')"></button>
    <div ref="stage" class="stage" @pointerdown.capture="lastAct = Date.now()"></div>
  </div>
</template>

<style scoped>
.stage { position: absolute; inset: 0; }
</style>
