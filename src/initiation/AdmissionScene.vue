<script setup lang="ts">
import {ref} from 'vue';
import type {State,Intent} from '../core';
import NarrativeStage from '../scene2d/NarrativeStage.vue';
import AdmissionChoices from './AdmissionChoices.vue';
import {heroArt,characterArt} from '../presentation/art';
defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent];close:[]}>();
const active=ref('teacher');
</script>
<template>
  <NarrativeStage stage-key="admission" title="听松山下 · 药坪求学" image="/art/initiation/tingsong-admission-court.webp" eyebrow="我的入道之路" goal="争取修行传承与基础行装。拜入听松或以散修身份立约，由你决定。" :hotspots="[{id:'teacher',label:'温蘅与季衡',kind:'person',speech:'你既来求学，便先说说自己的打算。拜师的事，想清楚再定。',x:61,y:64}]" :active="active" :speaker="'温蘅与季衡'" @select="active=$event" @close="active=''">
    <template #world>
      <img class="seeker" :src="characterArt(heroArt(game.social.gender,game.realm))" :alt="game.name" />
      <img class="teacher" src="/art/characters/wenheng.webp" alt="温蘅" />
    </template>
    <AdmissionChoices :game="game" :busy="busy" @act="emit('act',$event)" />
    <template #notes><p>药乡供给草药，听松宗护路、炼药与传法。凡俗生计与修行彼此相连；丹堂和剑院同属听松，入门以后仍可兼修。</p></template>
  </NarrativeStage>
</template>
<style scoped>
.seeker,.teacher{position:absolute;bottom:11%;height:43%;object-fit:contain;pointer-events:none}.seeker{left:25%}.teacher{left:56%}
</style>
