<script setup lang="ts">
import AdmissionScene from "../initiation/AdmissionScene.vue";
import LizhaoPanel from "../lizhao/LizhaoPanel.vue";
import NascentPanel from "../nascent-soul/NascentPanel.vue";
import { sceneOwner } from "../scene-activity";
import { readStoryPreference, writeStoryPreference } from './story-preference';
import { qiGoal } from '../qi-journey/rules';
import StoryTravelMap from "../wayfaring/StoryTravelMap.vue";
import { useStoryTravel } from "../wayfaring/useStoryTravel";
import { computed, ref, watch } from 'vue';
import type { State, Intent } from '../core';
import type { ActionReceipt } from '../action-feedback';
import type { CombatFeedback } from '../foundation-journey/feedback';
import { storyChapter, storyChapters } from './story-routing';
import LearningChoices from '../LearningChoices.vue';
import FirstPractice from './FirstPractice.vue';
import AdventurePanel from '../AdventurePanel.vue';
import RoadPanel from '../RoadPanel.vue';
import MistPanel from '../MistPanel.vue';
import QiJourneyPanel from '../qi-journey/QiJourneyPanel.vue';
import FoundationPanel from '../foundation-journey/FoundationPanel.vue';
import SectContestScene from '../sect-contest/SectContestScene.vue';
import GoldenCorePanel from '../golden-core/GoldenCorePanel.vue';
import OuterSeaPanel from '../outer-sea/OuterSeaPanel.vue';
import ConclavePanel from '../conclave/ConclavePanel.vue';
const props=defineProps<{game:State;busy:boolean;showRoad:boolean;entryChapter?:string;receipt?:ActionReceipt|null;combatFeedback?:CombatFeedback|null}>();
const emit=defineEmits<{act:[intent:Intent];cultivate:[];map:[];breakthrough:[];mist:[];road:[];equipment:[];board:[];sect:[];inventory:[]}>();
const travel=useStoryTravel(()=>props.game,()=>props.busy,intent=>emit('act',intent));
const {route:travelRoute,arrived:travelArrived}=travel;
const preferred=ref(props.entryChapter || readStoryPreference(props.game, localStorage) || (props.game.adventure.step === 'done' && !props.game.journey.learning.book ? 'rewards' : props.showRoad ? 'road' : ''));
watch(() => props.entryChapter, (entry) => { if (entry && !encounter.value) preferred.value=entry; });
watch(() => props.showRoad, (road) => { if (!encounter.value) preferred.value=road ? 'road' : 'mist'; });
watch(() => props.game.adventure.step, (step,old) => { if(step==='done' && old!=='done' && !props.game.journey.learning.book) preferred.value='rewards'; });
watch(() => props.game.qiJourney.narrative.initiation.kit, (kit,old) => { if(old==='none' && kit!=='none')preferred.value='rewards'; });
watch(() => props.game.journey.learning.book, (book,old) => { if(book&&!old) preferred.value='practice'; });
const chapters=computed(()=>storyChapters(props.game,props.showRoad).filter(item=>item.id!=='conclave'));
const chapter=computed(()=>storyChapter(props.game,preferred.value,props.showRoad));
const encounter=computed(()=>!!sceneOwner(props.game));
// Loading or mounting mid-encounter must also retain that journey after its final turn.
// Otherwise the temporary forced chapter would fall back to the old road preference.
watch(() => encounter.value ? chapter.value : null, (owner) => {
 if (owner) preferred.value=owner;
}, { immediate: true });
watch([chapter, () => props.game], () => writeStoryPreference(props.game, chapter.value, localStorage), { immediate: true });
function followGrowth(){ if(props.game.realm) { preferred.value=props.game.realm === 1 ? 'foundation' : props.game.realm === 3 ? 'nascent' : props.game.conclave.stage >= 2 ? 'nascent' : 'sea'; return; } if(props.game.qi < 120 || props.game.qiJourney.gates === 2) emit('cultivate'); else preferred.value='qi'; }
function choose(id:string){if(!encounter.value&&!props.busy)preferred.value=id;}
defineExpose({ choose });
</script>
<template>
 <div class="story-scenes" :data-chapter="chapter" :class="{'travel-open':!!travelRoute}">
  <StoryTravelMap v-if="travelRoute" :game="game" :route="travelRoute" :busy="busy" :arrived="travelArrived" @depart="travel.depart" @close="travel.close" @cancel="travel.cancel" />
  <div class="story-location" v-show="!travelRoute" :inert="!!travelRoute">
  <nav v-if="chapters.length>1" class="story-chapters" aria-label="查看已有行旅">
   <button v-for="item in chapters" :key="item.id" :aria-pressed="chapter===item.id" :disabled="busy||encounter" @click="choose(item.id)">{{item.label}}</button>
  <button v-if="!game.realm && game.journey.learning.book && !encounter && chapter !== 'qi'" class="growth-return" :disabled="busy" @click="followGrowth">修行目标 · {{ qiGoal(game) }} →</button>
  </nav>
  <AdmissionScene v-if="chapter==='admission'" :game="game" :busy="busy" @act="travel.act($event)" />
  <LearningChoices v-else-if="chapter==='rewards'" standalone :game="game" :busy="busy" @act="travel.act($event)" @close="followGrowth" />
  <FirstPractice v-else-if="chapter==='practice'" standalone :game="game" :busy="busy" @close="followGrowth" />
  <AdventurePanel v-else-if="chapter==='opening'" :game="game" :busy="busy" :receipt="receipt" @act="travel.act($event)" @cultivate="emit('cultivate')" />
  <RoadPanel v-else-if="chapter==='road'" :game="game" :busy="busy" :receipt="receipt" @act="travel.act($event)" @cultivate="emit('cultivate')" @map="emit('map')" @breakthrough="emit('breakthrough')" @mist="preferred = 'mist'; emit('mist')" />
  <MistPanel v-else-if="chapter==='mist'" :game="game" :busy="busy" :receipt="receipt" @act="travel.act($event)" @cultivate="emit('cultivate')" @road="preferred = 'road'; emit('road')" />
  <QiJourneyPanel v-else-if="chapter==='qi'" :game="game" :busy="busy" @act="travel.act($event)" @facilities="emit('cultivate')" @board="emit('board')" @gear="emit('equipment')" @sect="emit('sect')" @inventory="emit('inventory')" />
  <FoundationPanel @road="preferred='road'" v-else-if="chapter==='foundation'" :game="game" :busy="busy" :combat-feedback="combatFeedback" @act="travel.act($event)" @equipment="emit('equipment')" />
  <SectContestScene v-else-if="chapter==='contest'" :game="game" :busy="busy" @act="travel.act($event)" />
  <LizhaoPanel v-else-if="chapter==='lizhao'" :game="game" :busy="busy" @act="travel.act($event)" />
  <NascentPanel v-else-if="chapter==='nascent'" :game="game" :busy="busy" @act="travel.act($event)" />
  <GoldenCorePanel v-else-if="chapter==='golden'" :game="game" :busy="busy" @act="travel.act($event)" />
  <OuterSeaPanel @meeting="preferred='conclave'" v-else-if="chapter==='sea'" :game="game" :busy="busy" @act="travel.act($event)" />
  <ConclavePanel :entry-object="game.conclave.location==='away' ? game.outerSea.reminded ? 'letter' : 'chamber' : undefined" @shore="preferred='sea'" v-else-if="chapter==='conclave'" :game="game" :busy="busy" @act="travel.act($event)" />
  </div>
 </div>
</template>
<style scoped>
.story-location {height:100%;min-height:0;display:flex;flex-direction:column;}
.story-location > :not(.story-chapters) {flex:1;min-height:0;}
.story-scenes.travel-open {overflow:auto;}
.story-scenes { width:100%; min-height:0; }
.story-scenes[data-chapter=opening] { height:100%; }
.story-chapters { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 10px; }
.story-chapters button { border:1px solid #a98e5980; background:#112d25; color:#e9ddc2; padding:8px 14px; cursor:pointer; }
.story-chapters button[aria-pressed=true] { border-color:#dec187; background:#305342; }
.story-chapters button:disabled { opacity:.6; cursor:default; }
</style>
