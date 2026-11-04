<script setup lang="ts">
import type { State } from '../core';
import { characterArt } from '../presentation/art';
defineProps<{game:State}>();
</script>
<template>
  <div class="cloud-crossing" :class="{crossed:game.goldenCore.farShore}" :aria-label="game.goldenCore.farShore ? '丹元撑开云壁，你已站在云外石台' : '云壁挡在前方，金丹护体灵光已能将它撑开'" role="img">
    <div class="cloud-pressure" aria-hidden="true"></div>
    <div class="cloud-hero"><i aria-hidden="true"></i><img :src="characterArt(game.social.gender==='female'?'hero-female':'hero-male','guard')" alt="" /></div>
  </div>
</template>
<style scoped>
.cloud-crossing{position:absolute;inset:0;pointer-events:none}.cloud-hero{position:absolute;left:24%;top:82%;width:19%;height:33%;transform:translate(-50%,-100%);transition:left 1.4s ease,top 1.4s ease}.cloud-hero img{width:100%;height:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 0 12px #e8d5a480)}.cloud-hero i{position:absolute;inset:0 10%;border:2px solid #f2daa68c;border-radius:50%;box-shadow:0 0 26px #e9d6ac5c}.cloud-pressure{position:absolute;left:45%;top:15%;width:16%;height:68%;background:linear-gradient(90deg,transparent,#c3d2ca99,transparent);filter:blur(12px);transition:opacity 1.4s}.crossed .cloud-hero{left:70%;top:77%}.crossed .cloud-pressure{opacity:.12}@media(prefers-reduced-motion:reduce){.cloud-hero,.cloud-pressure{transition:none}}
</style>
