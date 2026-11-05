<script setup lang="ts">
import { computed } from 'vue';
import type { State, Intent } from '../world';
import { formatLifeMonths } from '../progression';
import { meetingObjective } from './meeting-objective';
import CommitmentTiming from '../correspondence/CommitmentTiming.vue';
const props = defineProps<{game:State;busy?:boolean}>();
defineEmits<{act:[intent:Intent]}>();
const plan = computed(()=>meetingObjective(props.game));
</script>
<template>
  <section v-if="plan" class="meeting-objective" aria-label="赴会与修行安排">
    <strong>以金丹中期之力，争取归潮入境资格</strong>
    <p>已具备登台所需境界，无须先修满 599。两胜即可争取入境资格，第三场自愿争优；也可先修炼、养伤或调整功法器物。</p>
    <template v-if="plan.remaining">
      <p>距已知会期 {{ formatLifeMonths(plan.remaining) }}。候会不增加修为、不恢复伤势，也不消耗灵石和灵草；按月度过年月，遇待处理事件提前停下。</p>
      <p>候至来信时年龄 {{ formatLifeMonths(plan.ageAfter) }}，剩余寿元 {{ formatLifeMonths(plan.lifeAfter) }}。来信后再自行赴会。</p>
      <CommitmentTiming :game="game" :months="plan.quote.months" />
    </template>
    <p v-else>会期已至。正会后仍可补试，旧胜绩保留；可先整备，不必仓促登台。</p>
    <button :disabled="busy || !!plan.quote.error" @click="$emit('act',plan.intent)">{{ plan.title }} · {{ formatLifeMonths(plan.quote.months) }}</button>
    <p v-if="!plan.remaining">本段路程 {{ formatLifeMonths(plan.quote.months) }} · 灵石 {{ plan.quote.stones }} · 灵草 {{ plan.quote.herbs }}。抵达后仍须自行报名。</p>
    <p v-if="plan.quote.error" role="status">{{ plan.quote.error }}</p>
  </section>
</template>
<style scoped>
.meeting-objective { border-left:2px solid #b7aa7c;padding:8px 12px;margin:12px 0; }
p {font-size:13px;line-height:1.7;margin:6px 0;}
button {white-space:normal;padding:8px 12px;}
</style>
