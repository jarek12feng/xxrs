<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { senseLimit, spiritReadiness, controlCapacity } from "../spirit";
import { spiritQuote } from "./rules";
import { dailyMedicineQuote } from "../medicines";
import { medicineError } from "../growth";
const props = defineProps<{game: State; busy: boolean}>();
const emit = defineEmits<{act:[intent: Intent]}>();
const p = computed(()=>spiritReadiness(props.game));
const recover = computed(()=>spiritQuote(props.game,{kind:'recover'}));
</script>
<template>
  <section class="spirit-summary" aria-label="神识与炼神成果">
    <p>神识 {{game.sense}} / {{senseLimit(game.realm,game.spirit)}} · 常规上限 {{senseLimit(game.realm)}} · 御器容量 {{controlCapacity(game.sense)}} / 最高22</p>
    <p>分念诀：{{game.spirit.manual==='learned'?'已研修 · 永久上限+6':game.spirit.manual==='found'?'残篇已得，待研修':'尚未取得'}}。澄神玉髓：{{game.spirit.jade==='refined'?'已炼化 · 永久上限+6':game.spirit.jade==='found'?'已取得，待炼化':'尚未取得'}}。</p>
    <p>有效神识 {{p.effectiveSense}} · 护神抗性 {{p.resistance}} · 圆满考验心神 {{p.trialMind}} · 凝婴额外心神 +{{p.breakthroughBonus}}。</p>
    <p v-if="game.realm===1 && game.spirit.manual==='none' && !game.foundationJourney.won.includes('application')">筑基中期前须在无名渡沉井内室探阵取法，再研修分念诀；击退石偶后可见回声阵。</p>
    <p v-if="game.realm===2 && game.spirit.jade==='none'">归潮深处拓本会指向古渡潮隙，可自愿深入取得澄神玉髓。</p>
    <template v-for="[kind,label] in [['study','研修分念诀 · 三月，上限+6、神识+3'],['refine','炼化澄神玉髓 · 半年，上限+6、神识+6']] as const" :key="kind">
      <button v-if="kind==='study'?game.spirit.manual==='found':game.spirit.jade==='found'" :disabled="busy||!!spiritQuote(game,{kind}).error" @click="emit('act',{type:'spirit',action:{kind}})">{{label}}<small>{{spiritQuote(game,{kind}).error}}</small></button>
    </template>
    <template v-if="game.spirit.trauma">
      <p>识海创伤 {{game.spirit.trauma}} / 3 · 有效神识降低 {{game.spirit.trauma*3}}。永久神识与装备容量保留；专御按有效神识发挥。</p>
      <button :disabled="busy||!!recover.error" @click="emit('act',{type:'spirit',action:{kind:'recover'}})">免费调息三月 · 创伤−1<small>{{recover.error}}</small></button>
      <button v-for="id in ['clarity','spirit'] as const" :key="id" :disabled="busy||!!medicineError(game,id,true,'restore')" @click="emit('act',{type:'consume',medicine:id,purpose:'restore'})">{{id==='clarity'?'清心丹':'养神丹'}}疗复 · 创伤−{{dailyMedicineQuote(game,id,'restore').restored}}<small>{{medicineError(game,id,true,'restore')}}</small></button>
    </template>
    <p v-if="game.spirit.last" role="status">{{game.spirit.last}}</p>
  </section>
</template>
<style scoped>
.spirit-summary {line-height:1.7;} button {display:block;text-align:left;margin:8px 0;width:100%;} small {display:block;}
</style>
