<script setup lang="ts">
import {mistSpeakerFoot} from "./actor-anchors";
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { State } from '../world';
import CharacterSprite from '../presentation/CharacterSprite.vue';
import WalkingActor from './WalkingActor.vue';
import { useSceneApproach } from './use-scene-approach';
import type { Point } from './navigation';
import { heroArt, itemArt } from '../presentation/art';
import { mistCueText, mistSnapshot, mistTransition, mistWorld, type MistCue } from './mist-performance';
const props = defineProps<{ game: State }>();
const emit = defineEmits<{ performing: [] }>();
const world = computed(() => mistWorld(props.game));
const cue = ref<MistCue>();
const walkReady=ref(false);
const walk=useSceneApproach({animated:()=>props.game.realm===0 && props.game.social.gender==='male' && walkReady.value,initial:{x:32,y:87}});
function approach(point:Point, arrived?:()=>void){stop();walk.walkTo(point,arrived);}
const hidden = ref(false);
const reduced = ref(false);
let media: MediaQueryList | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
function stop() { if (timer !== undefined) clearTimeout(timer); timer = undefined; cue.value = undefined; }
defineExpose({ stop, approach, cancel:walk.cancel, reset:walk.reset });
watch(() => mistSnapshot(props.game.adventure.mist), (after, before) => {
  const next = mistTransition(before, after);
  stop();
  if(before.stage!==after.stage)walk.reset({x:32,y:87});
  if (!next || hidden.value || reduced.value) return;
  walk.cancel();
  cue.value = next;
  emit('performing');
  timer = setTimeout(stop, 1800);
});
function visibility() { hidden.value = document.hidden; if (hidden.value) stop(); }
function motion() { reduced.value = !!media?.matches; if (reduced.value) stop(); }
function key(event: KeyboardEvent) { if (event.key === 'Escape') stop(); }
onMounted(() => {
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)'); motion(); visibility();
  media?.addEventListener('change', motion);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('keydown', key);
});
onBeforeUnmount(() => {
  stop(); media?.removeEventListener('change', motion);
  document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', key);
});
</script>
<template>
  <div class="mist-world" :class="[cue ? `cue-${cue}` : '', { quiet: hidden || reduced }]" :data-mist-state="world.stage">
    <WalkingActor :character="heroArt(game.social.gender,game.realm)" :label="game.name" :position="walk.position.value" :moving="walk.moving.value" :frame="walk.frame.value" :facing="walk.facing.value" :pose="cue === 'station' || cue === 'ward' ? 'guard' : cue === 'garden' ? 'meditate' : 'idle'" @ready="walkReady=$event" />
    <CharacterSprite v-if="world.luchi" class="mist-luchi" :style="{left:mistSpeakerFoot.x+'%',bottom:(100-mistSpeakerFoot.y)+'%'}" character="luchi" label="陆迟" />
    <svg v-if="world.stage === 'garden'" class="mist-garden" viewBox="0 0 360 80" role="img" :aria-label="world.garden ? '石渠通水，引灯草恢复生机' : '石渠断水，引灯草枯萎'" :class="{ restored: world.garden }">
      <path v-if="world.garden" class="channel-water" d="M12 62 Q68 43 130 49 T274 40 L345 33" />
      <g v-for="x in [104, 173, 232]" :key="x" :transform="`translate(${x},43)`" class="plant">
        <path :d="world.garden ? 'M0 0 Q-2 -8 0 -15 M-1 -5 Q-9 -12 -12 -9 M-1 -8 Q5 -16 9 -13' : 'M0 0 Q-2 -7 -7 -5'" />
      </g>
    </svg>
    <svg v-if="world.array || (world.stage === 'camp' && world.ward)" class="mist-array" viewBox="0 0 340 220" role="img" :aria-label="world.passed ? '阵门已开' : world.station ? '归阵灵脉已接通' : '回声阵纹尚未辨清'" :class="{ aligned: world.station || world.ward, opened: world.passed }">
      <ellipse cx="170" cy="145" rx="145" ry="54" />
      <ellipse cx="170" cy="145" rx="106" ry="37" />
      <path :d="world.station || world.ward ? 'M25 145 L170 108 L315 145 L170 182 Z M64 145 L276 145' : 'M25 145 L110 126 M150 113 L230 129 M250 138 L315 145 M64 145 L118 145 M180 145 L276 145'" />
      <path v-if="!world.passed" class="gate-seam" d="M125 145 L125 30 Q170 0 215 30 L215 145 M170 15 L170 145" />
    </svg>
    <div v-if="world.lantern" class="mist-lantern" :class="{ lit: world.lamp }"><img :src="itemArt('lamp')" :alt="world.lamp ? '探灵灯' : '等待带回的探灵灯'" /></div>
    <svg v-if="world.stage === 'shrine'" class="mist-wall" viewBox="0 0 250 220" role="img" :aria-label="world.revisited ? '避难室归灯长明，墙上誓言可辨' : '旧墙刻痕尚未照亮'" :class="{ relit: world.revisited }">
      <path class="wall" d="M30 210 L30 45 L80 20 L220 35 L220 210 Z" />
      <g class="inscription"><path d="M65 65 L130 65 M65 85 L170 85 M65 105 L145 105 M65 125 L160 125" /><path v-if="world.revisited" class="refuge" d="M165 210 L165 150 Q185 120 205 150 L205 210" /></g>
    </svg>
    <div v-if="walk.moving.value" class="mist-performance" role="status"><span>沿来路走近</span><button @click="walk.skip">略过走近</button></div>
    <div v-if="cue" class="mist-performance" role="status"><span>{{ mistCueText[cue] }}</span><button @click="stop">跳过演出</button></div>
  </div>
</template>
<style scoped>
.mist-world { position:absolute; inset:0; pointer-events:none; }
.mist-luchi { position:absolute;transform:translateX(-50%); bottom:10%; width:190px; height:250px; filter:drop-shadow(0 10px 8px #0009); }
.mist-luchi { left:17%; height:220px; }
/* Integrate a few highlights into the existing painted terrace, not a new oversized garden. */
.mist-garden { position:absolute; left:46%; bottom:29%; width:18%; max-width:250px; overflow:visible; opacity:.55; }
.channel-water { fill:none; stroke:#b7bdb0; stroke-width:2; stroke-linecap:round; filter:drop-shadow(0 1px 2px #344641); }
.plant { fill:none; stroke:#777d65; stroke-width:1.5; stroke-linecap:round; }
.restored .plant { stroke:#9aa68b; }
.mist-array { position:absolute; left:42%; bottom:13%; width:33%; max-width:470px; fill:none; stroke:#b6b5a1; stroke-width:3; filter:drop-shadow(0 2px 6px #000); }
.mist-array.aligned { stroke:#b8dfc5; } .mist-array.opened { stroke:#f8d891; opacity:.7; }
.gate-seam { stroke:#a2bbbd; stroke-width:6; }
.mist-lantern { position:absolute; left:52%; bottom:20%; width:95px; height:120px; }
.mist-lantern img { width:100%; height:100%; object-fit:contain; }
.mist-lantern.lit { filter:drop-shadow(0 0 20px #f2d089); }
.mist-wall { position:absolute; left:50%; bottom:13%; width:22%; max-width:310px; }
.wall { fill:#4f574ee6; stroke:#a8ae96; stroke-width:4; }
.inscription { fill:none; stroke:#777f6c; stroke-width:3; }
.relit .inscription { stroke:#ffe5a1; filter:drop-shadow(0 0 7px #ffe5a1); }
.refuge { fill:#e1ba6377; }
.mist-performance { position:absolute; left:50%; bottom:58px; transform:translateX(-50%); display:flex; align-items:center; gap:18px; max-width:80%; padding:12px 18px; color:#fff0ca; background:#102820ed; border:1px solid #c7ae7c; pointer-events:auto; }
.mist-performance button { flex-shrink:0; padding:8px 12px; color:inherit; border:1px solid #c7ae7c; background:#294438; }
.cue-garden .channel-water { stroke-dasharray:450; animation:mist-water 1.5s ease-out; }
.cue-station .mist-array,.cue-passed .mist-array,.cue-ward .mist-array,.cue-revisited .inscription,.cue-lamp .mist-lantern { animation:mist-reveal 1.5s ease-out; }
.cue-retreat .mist-array { animation:mist-retreat .65s ease-in-out; }
@keyframes mist-water { from { stroke-dashoffset:450; } to { stroke-dashoffset:0; } }
@keyframes mist-reveal { from { opacity:.1; filter:drop-shadow(0 0 25px #ffe9a6); } to { opacity:1; } }
@keyframes mist-retreat { 50% { opacity:.2; } }
.quiet * { animation:none!important; }
@media(prefers-reduced-motion:reduce) { * { animation:none!important; } }
@media(max-width:900px) { .mist-luchi { width:130px; height:190px; } .mist-performance { font-size:13px; bottom:65px; } }
</style>
