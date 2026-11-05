<script setup lang="ts">
import { computed } from 'vue';
import type { State, Intent } from '../core';
import { initiationError, type InitiationAction } from './rules';
import { motiveText } from '../qi-journey/narrative';
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent]}>();
const n=computed(()=>props.game.qiJourney.narrative.initiation);
function act(action:InitiationAction){emit('act',{type:'qiJourney',action});}
</script>
<template>
  <section aria-label="药乡启程">
    <template v-if="n.arrival === 'landed'">
      <p>你叫{{ game.name }}，十六岁，出身青玄界听松山外的药乡。家中靠晒药、识草与运药过活。今日随药船抵岸，你带来的不只有药包，还有温蘅允你上山求教的引荐纸。</p>
      <button :disabled="busy || !!initiationError(game,'entry:unload')" @click="act('entry:unload')">把家乡药包搬上石阶</button>
    </template>
    <template v-else-if="n.arrival === 'unloaded'">
      <p>{{ n.last }}</p>
      <p>风雨吹乱气息。你想起上次运药遇险，老药师教你慢慢调息，才没有昏倒。温蘅后来发现，你能从这呼吸间感应到灵气。</p>
      <button :disabled="busy" @click="act('entry:steady')">放缓呼吸，辨认那缕灵气</button>
      <button :disabled="busy" @click="act('entry:force')">试着强压气息</button>
    </template>
    <template v-else>
      <p>{{ n.last }}</p>
      <div class="motive-choices">
        <button v-for="(label,key) in motiveText" :key="key" :disabled="busy" @click="emit('act',{type:'qiJourney',action:`origin:${key}`})">{{ label }}</button>
      </div>
    </template>
  </section>
</template>
<style scoped>
p{line-height:1.65;margin:.5rem 0}.motive-choices{display:flex;flex-wrap:wrap;gap:.5rem}button{margin:.25rem;padding:.6rem .8rem;color:#f5ead3;background:#29453c;border:1px solid #b6a16c;border-radius:4px}button:focus-visible{outline:2px solid #ffe5ac}
</style>
