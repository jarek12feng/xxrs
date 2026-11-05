<script setup lang="ts">
import { computed } from 'vue';
import type { State } from '../core';
import { deathView } from './index';
import { lifeReview } from '../life-review';
const props = defineProps<{ game: State }>();
const scene = computed(() => deathView(props.game));
const review = computed(() => lifeReview(props.game));
</script>
<template>
  <section class="death-scene" :class="game.death?.cause ?? 'lifespan'" aria-label="此生终章" :style="{ '--death-image': `url(${scene.image})` }">
    <div class="death-landscape" aria-hidden="true" />
    <div class="last-light" aria-hidden="true" />
    <div class="death-inscription">
      <span class="death-place">{{ scene.place }} · 修行第 {{ game.month }} 月</span>
      <h2 id="modal-title" tabindex="-1">{{ scene.title }}</h2>
      <p>{{ scene.text }}</p>
      <p class="life-name">{{ game.name }} · {{ ['炼气', '筑基', '金丹', '元婴'][game.realm] }} · 享年 {{ Math.floor(game.age / 12) }} 岁 {{ game.age % 12 }} 月</p>
      <blockquote v-if="review.unfinished.length">{{ review.unfinished[0] }}</blockquote>
      <span class="death-afterword">走过的路不会因终点而失去分量。</span>
    </div>
  </section>
</template>
<style scoped>
.death-scene { position:relative; isolation:isolate; min-height:340px; display:flex; align-items:end; overflow:hidden; background:#111719; color:#e8e0ce; }
.death-landscape { position:absolute; inset:0; z-index:-2; background:var(--death-image) center 50% / cover; filter:saturate(.32) brightness(.5); animation:landscape-dim 5s ease-out both; }
.death-scene::after { content:''; position:absolute; inset:0; z-index:-1; background:linear-gradient(90deg,#071014eb,#0c182d44),linear-gradient(0deg,#071014,transparent 75%); }
.death-inscription { width:min(700px,100%); padding:32px 36px; animation:inscription 2s ease-out both; }
.death-place,.death-afterword { font-size:12px; letter-spacing:.12em; color:#b4bdba; }
h2 { font-family:serif; font-size:clamp(28px,3vw,42px); letter-spacing:.16em; margin:12px 0 18px; color:#f1e2bd; }
p { line-height:1.8; margin:10px 0; }
.life-name { color:#c5b998; font-size:13px; }
blockquote { margin:18px 0; padding:4px 0 4px 14px; border-left:1px solid #89785a; color:#d4c5ad; line-height:1.65; }
.last-light { position:absolute; right:18%; top:36%; width:4px; height:10px; border-radius:50%; background:#e7b768; box-shadow:0 0 24px 12px #e4b26060; animation:last-light 4s ease-out forwards; }
.sea .last-light,.lizhao .last-light,.duel .last-light { background:#a3cbda; box-shadow:0 0 35px 18px #a3cbda44; }
.tribulation .last-light { width:2px; height:100px; top:0; background:#c9d6ea; box-shadow:0 0 28px 9px #b2bdff55; }
@keyframes last-light { 0% { opacity:1; } 100% { opacity:0; transform:translateY(8px); } }
@keyframes landscape-dim { from { filter:saturate(.65) brightness(.7); } to { filter:saturate(.32) brightness(.5); } }
@keyframes inscription { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
@media (prefers-reduced-motion:reduce) { *,*::after { animation:none !important; } .last-light { display:none; } }
@media(max-width:700px) { .death-inscription { padding:24px; } }
</style>
