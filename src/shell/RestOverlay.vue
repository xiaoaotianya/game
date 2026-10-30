<script setup lang="ts">
import { onMounted } from 'vue';
import { label } from '@/sdk/settings';
import { voice } from '@/sdk/voice';
import { iconHtml } from '@/sdk/art';

const msg = { zh: '今天玩够啦，眼睛要休息啦', en: 'Time to rest your eyes. See you tomorrow!' };
const say = () => voice.say(msg);
onMounted(say);
</script>

<template>
  <div class="rest" @pointerdown="say">
    <div class="box">
      <div class="moon emoji" v-html="iconHtml('ui/moon')"></div>
      <div class="animals emoji">
        <span v-for="a in ['items/bear', 'items/bunny', 'items/cat']" :key="a" v-html="iconHtml(a)"></span>
      </div>
      <p class="text">{{ label({ zh: '休息时间到啦', en: 'Time to rest' }) }}</p>
    </div>
  </div>
</template>

<style scoped>
.rest {
  position: fixed; inset: 0; z-index: 85;
  display: grid; place-items: center;
  background: linear-gradient(180deg, #2d2a6e, #5b4b9a);
  color: #fff;
}
.box { text-align: center; }
.moon { font-size: 30vmin; animation: float 4s ease-in-out infinite; }
.animals { font-size: 12vmin; margin: 3vmin 0; display: flex; gap: 4vmin; justify-content: center; }
.animals :deep(.pic) { filter: brightness(.75) saturate(.8); }
.text { font-size: clamp(22px, 6vmin, 44px); font-weight: 700; }
</style>
