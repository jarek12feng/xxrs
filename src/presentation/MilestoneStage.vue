<script setup lang="ts">
import type { MilestoneFeedback } from '../milestone-feedback';
import ItemArt from './ItemArt.vue';
defineProps<{ milestone: MilestoneFeedback; phase: number; playing: boolean }>();
</script>
<template>
  <div class="milestone-stage" :data-kind="milestone.kind" :data-step="playing ? phase : 2" aria-hidden="true">
    <div class="landscape" :style="milestone.background ? {backgroundImage: `url(${milestone.background})`} : undefined"></div><div class="dawn"></div>
    <div class="ground-shadow"></div><div class="breath-ring"></div>
    <div class="traveler">
      <img class="actor standing" :src="milestone.hero" alt="" />
      <img v-if="milestone.kind === 'foundation'" class="actor seated" :src="milestone.seated" alt="" />
      <div v-if="milestone.kind === 'flight'" class="flying-sword"></div>
    </div>
    <div v-if="milestone.item" class="gift"><ItemArt :id="milestone.item" :size="128" /></div>
    <img v-if="milestone.companion" class="companion" :src="milestone.companion" alt="" />
    <figure v-for="(guest,index) in milestone.guests" :key="guest.name" class="guest" :style="{left: `${index < 2 ? 4 + index * 18 : 65 + (index-2) * 18}%`}"><img :src="guest.art" alt="" /></figure>
    <div v-if="milestone.kind === 'ceremony'" class="letter-table"><ItemArt id="letter" :size="46" /></div>
    <div class="foreground"></div>
  </div>
</template>
<style scoped>
.milestone-stage{position:relative;height:300px;overflow:hidden;isolation:isolate;background:#1a3035}
.landscape{position:absolute;inset:-3%;background:url('/scenes/moon-terrace.png') center 60%/cover;transition:transform 1.6s ease,filter 1.6s;filter:brightness(.65)}
[data-step="2"] .landscape{transform:scale(1.045);filter:brightness(1.05)}
.dawn{position:absolute;inset:0;background:radial-gradient(ellipse at 55% 35%,#fff0b36b,transparent 65%);opacity:0;transition:opacity 1.3s}
[data-step="1"] .dawn,[data-step="2"] .dawn{opacity:1}
.traveler{position:absolute;left:43%;bottom:19%;width:120px;height:180px;transform:translateX(-50%);transition:transform 1.4s ease}
.actor{position:absolute;width:100%;height:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 3px 5px #10211f99);transition:opacity .8s}
.ground-shadow{position:absolute;left:43%;bottom:17%;width:100px;height:14px;border-radius:50%;background:#0b171bb3;filter:blur(4px);transform:translateX(-50%);transition:opacity 1.5s,scale 1.5s}
.breath-ring{position:absolute;left:43%;bottom:16%;width:180px;height:32px;border:2px solid #cfebcc;border-radius:50%;transform:translateX(-50%) scale(.4);opacity:0;box-shadow:0 0 24px #d6f6b4;transition:transform 1.3s,opacity 1.3s}
[data-kind="foundation"][data-step="1"] .breath-ring{transform:translateX(-50%) scale(1.2);opacity:.8}
[data-kind="foundation"]:not([data-step="2"]) .standing,[data-step="2"] .seated{opacity:0}
.flying-sword{position:absolute;bottom:-6px;left:-26px;width:170px;height:7px;background:linear-gradient(0deg,#649b9b,#e4f5ef,#8bb4b6);clip-path:polygon(0 35%,20% 35%,22% 0,26% 0,26% 30%,88% 30%,100% 50%,88% 80%,26% 80%,26% 100%,22% 100%,20% 65%,0 65%);filter:drop-shadow(0 0 8px #c9f9ed)}
[data-kind="flight"][data-step="1"] .traveler{transform:translate(-50%,-26px)}
[data-kind="flight"][data-step="2"] .traveler{transform:translate(-20%,-46px)}
[data-kind="flight"][data-step="2"] .ground-shadow{opacity:.3;scale:.7}
.gift{position:absolute;left:61%;top:34%;transform:translateY(25px) scale(.65);opacity:.35;transition:transform 1.3s,opacity 1.3s;filter:drop-shadow(0 0 20px #ffdf8a80)}
[data-step="1"] .gift,[data-step="2"] .gift{transform:translateY(0) scale(1);opacity:1}
.companion{position:absolute;left:60%;bottom:19%;height:180px;width:120px;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 5px #10211f80);transition:transform 1.4s ease,opacity 1.4s}
[data-kind="reunion"][data-step="0"] .companion{transform:translateX(45px);opacity:.3}
[data-kind="farewell"][data-step="1"] .companion{transform:translateX(22px)}
[data-kind="farewell"][data-step="2"] .companion{transform:translateX(70px) scale(.9);opacity:0}
[data-kind="reunion"] .gift,[data-kind="farewell"] .gift{left:43%;top:60%;scale:.5;z-index:2}
.guest{position:absolute;bottom:22%;height:145px;width:15%;margin:0;opacity:.35;transition:opacity 1.4s}
.guest img{width:100%;height:100%;object-fit:contain;object-position:bottom}
[data-step="1"] .guest,[data-step="2"] .guest{opacity:1}
.letter-table{position:absolute;left:45%;bottom:12%;width:20%;height:20px;background:#71513b;border-bottom:5px solid #322b23;text-align:center;box-shadow:0 8px 10px #0005}
.letter-table img{position:relative;top:-35px}
[data-kind="emergence"][data-step="0"] .traveler{opacity:.4;transform:translate(-50%,-12px)}
[data-kind="emergence"] .traveler{transition:transform 1.4s,opacity 1.4s}
.foreground{position:absolute;inset:0;pointer-events:none;background:linear-gradient(transparent 75%,#12241f)}
@media(max-height:750px){.companion{height:130px;width:88px}.guest{height:105px}.milestone-stage{height:230px}.traveler{height:130px;width:88px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
