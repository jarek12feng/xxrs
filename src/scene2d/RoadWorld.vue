<script setup lang="ts">
import {useActorPlayback} from "../presentation/actor-action/use-actor-playback";
import {roadSpeakerFoot} from './actor-anchors';
import {computed,ref,watch} from 'vue';
import type {State} from '../core';
import CharacterSprite from '../presentation/CharacterSprite.vue';
import WalkingActor from './WalkingActor.vue';
import {useSceneApproach} from './use-scene-approach';
import {heroArt,itemArt} from '../presentation/art';
import {roadSceneSnapshot,roadSceneTransition,roadWorldState} from './road-performance';
const props=defineProps<{game:State}>();
const emit=defineEmits<{performed:[]}>();
const field=computed(()=>roadWorldState(props.game));
const playback=useActorPlayback<NonNullable<ReturnType<typeof roadSceneTransition>>>();
const cue=playback.frame, paused=playback.hidden;
const walkReady=ref(false);
const sheet=computed(()=>props.game.realm===1?'/art/scene2d/foundation-walk/hero-male-v1.png':'/art/scene2d/hero-qi-walk-v2.png');
function foot(target:string) {
  const stage=props.game.adventure.road.stage;
  if(target==='person'){const npc=roadSpeakerFoot(stage);return {x:npc.x-9,y:npc.y};}
  // Reviewed foreground only: pass uses its central stair; cloud-frontier keeps the foreground stair visible.
  const places=stage==='pass'
    ? {entry:[57,91],person:[53,85],objects:[55,81],prepare:[57,90],road:[53,77],forward:[52,73],back:[58,92]}
    : stage==='beyond' || stage==='lookout'
      ? {entry:[48,90],person:[50,87],objects:[46,85],prepare:[45,91],road:[51,84],forward:[53,81],back:[46,93]}
      : stage==='camp'
        ? {entry:[50,90],person:[42,88],objects:[55,85],prepare:[46,92],road:[68,91],forward:[72,92],back:[44,93]}
        : {entry:[40,88],person:[35,85],objects:[50,87],prepare:[30,91],road:[62,88],forward:[68,88],back:[28,91]};
  const point=places[target as keyof typeof places]??places.entry;
  return {x:point[0]!,y:point[1]!};
}
const walk=useSceneApproach({animated:()=>walkReady.value && props.game.social.gender==='male' && props.game.realm<=1,initial:foot('entry')});
function approach(target:string,arrived?:()=>void){skip();walk.walkTo(foot(target),arrived,target==='person'?roadSpeakerFoot(props.game.adventure.road.stage).x:undefined);}
watch(sheet,()=>{walk.cancel();walkReady.value=false;});
const skip=playback.stop;
watch(()=>roadSceneSnapshot(props.game),(next,before)=>{
  skip();if(next.stage!==before.stage)walk.reset(foot('entry'));const nextCue=roadSceneTransition(before,next);
  if(!nextCue || document.hidden || playback.reduced.value)return;
  walk.cancel();playback.play([{value:nextCue,durationMs:1800}]);emit('performed');
});
defineExpose({skip,approach,cancel:walk.cancel});
</script>
<template>
  <div class="road-world" :class="{'world-paused':paused}" :data-route="field.route">
    <div v-if="field.wind || field.route==='array'" class="pass-wind" :class="{'restored-array':field.route==='array'}" :aria-label="field.route==='array'?'旧阵按约定开关':'山风阻住去路'"><i></i><i></i><i></i></div>
    <div v-if="field.route==='medicine'" class="root-path" aria-label="恢复生机的镇风草窄径"><img v-for="n in 4" :key="n" :src="itemArt('herbs')" alt="" /></div>
    <div v-if="field.route==='sword'" class="open-pass" aria-label="斩开风脉后的宽路"><i></i><i></i></div>
    <WalkingActor :key="sheet" :character="heroArt(game.social.gender,game.realm)" :pose="cue?.pose || 'idle'" :label="game.name" :position="walk.position.value" :moving="walk.moving.value" :frame="walk.frame.value" :facing="walk.facing.value" :sheet="sheet" @ready="walkReady=$event" />
    <img v-if="game.adventure.road.stage==='home'" class="road-npc" :style="{left:roadSpeakerFoot('home').x+'%',bottom:(100-roadSpeakerFoot('home').y)+'%'}" src="/art/characters/wenheng.webp" alt="温蘅" />
    <CharacterSprite v-if="field.person" class="road-npc" :style="{left:roadSpeakerFoot(game.adventure.road.stage).x+'%',bottom:(100-roadSpeakerFoot(game.adventure.road.stage).y)+'%'}" :class="{'pass-npc':game.adventure.road.stage==='pass'}" :character="field.person" :label="field.person==='yuqing'?'郁青':'青嶂'" />
    <img v-if="game.adventure.road.stage==='market'" class="market-steward" src="/art/characters/market-steward.webp" alt="坊市掌柜" />
    <img v-if="field.map" class="road-map" :src="itemArt('map')" alt="已补全的行路图" />
    <div v-if="walk.moving.value" class="road-cue" role="status"><span>沿近处石路走近</span><button @click.stop="walk.skip">略过走近</button></div>
    <div v-if="cue" class="road-cue" role="status"><span>{{cue.label}}</span><button @click.stop="skip">跳过演出</button></div>
  </div>
</template>
<style scoped>
.road-world{position:absolute;inset:0;pointer-events:none}
.road-npc{position:absolute;transform:translateX(-50%);left:35%;bottom:17%;width:190px;height:270px;filter:drop-shadow(0 10px 8px #0009)}
.pass-npc{left:44%;bottom:17%}
.road-map{position:absolute;left:48%;bottom:20%;width:90px;height:90px;object-fit:contain;filter:drop-shadow(0 6px 8px #0009)}
.pass-wind{position:absolute;left:51%;top:30%;width:20%;height:38%;transform:rotate(-12deg)}
.pass-wind i{position:absolute;inset:0;border:2px solid #d7eadb66;border-radius:50%;box-shadow:0 0 18px #cce3d622;animation:road-wind 3s ease-in-out infinite}
.pass-wind i:nth-child(2){inset:15%;animation-delay:-1s}.pass-wind i:nth-child(3){inset:30%;animation-delay:-2s}
.restored-array{transform:rotate(0)}.restored-array i{border-color:#d1c38a99;animation-duration:6s}
.root-path{position:absolute;left:7%;bottom:10%;width:24%;display:flex;transform:rotate(-4deg);border-bottom:2px solid #697f4888}
.root-path img{width:25%;height:34px;object-fit:contain;filter:drop-shadow(0 2px 4px #0008)}
.open-pass{position:absolute;left:46%;top:36%;width:25%;height:35%;transform:skewY(-10deg)}
.open-pass i{position:absolute;top:0;bottom:0;width:15%;border-left:2px solid #e9d7a677;background:linear-gradient(90deg,#b7aa7c22,transparent);transform:skewX(-18deg)}.open-pass i:last-child{right:0;transform:skewX(18deg)}
.road-cue{position:absolute;left:31%;bottom:5%;display:flex;align-items:center;gap:15px;padding:10px 16px;background:#102b24ef;border:1px solid #bca26b99;color:#f4ead3}
.road-cue button{pointer-events:auto;background:transparent;color:inherit;border:1px solid #bca26b;padding:7px 12px;cursor:pointer}
@keyframes road-wind{50%{opacity:.3;transform:scaleX(.8)}}
.world-paused *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.pass-wind i{animation:none}}
@media(max-width:900px){.road-npc{left:40%;bottom:38%;height:200px;width:140px}.road-cue{left:10%;bottom:48%}}
</style>

<style scoped>.market-steward{position:absolute;left:70%;bottom:13%;height:39%;object-fit:contain}</style>
