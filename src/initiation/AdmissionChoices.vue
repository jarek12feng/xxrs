<script setup lang="ts">
import { computed } from 'vue';
import type { State, Intent } from '../core';
import { initiationError, joinError, hasCultivationKit, type InitiationAction } from './rules';
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent]}>();
const n=computed(()=>props.game.qiJourney.narrative.initiation);
const action=computed<InitiationAction>(()=>({none:'entry:seek',deferred:'entry:seek',seeking:'entry:review',recommended:'entry:terms',pledged:'entry:terms'})[n.value.admission] as InitiationAction);
const label=computed(()=>({none:'拿出引荐纸，说明求学之意',deferred:'再来求学，重议拜师',seeking:'请执事评议亲历',recommended:'听取门规与弟子职责',pledged:''})[n.value.admission]);
</script>
<template>
  <section v-if="game.journey.branch === 'none'" aria-label="药坪求学与引荐">
    <p>温蘅认得你带来的药乡引荐纸。药坪上的草药要送入丹堂，季衡的药队正在整备。你可以在这里求学，再决定是否拜入听松宗。</p>
    <p v-if="n.last && n.admission !== 'none'" role="status">{{ n.last }}</p>
    <template v-if="n.admission !== 'pledged'">
      <button :disabled="busy || !!initiationError(game,action)" @click="emit('act',{type:'qiJourney',action})">{{ label }}</button>
      <small v-if="initiationError(game,action)">{{ initiationError(game,action) }}</small>
      <template v-if="n.admission === 'seeking' && n.practice !== 'passed'">
        <p>护路绳阵一边承重，一边留作归绳。你准备怎样把空药篓送过去？</p>
        <button :disabled="busy" @click="emit('act',{type:'qiJourney',action:'entry:careful'})">先辨受力，稳住主绳并留退路</button>
        <button :disabled="busy" @click="emit('act',{type:'qiJourney',action:'entry:rush'})">一把拉紧两根绳</button>
      </template>
    </template>
    <template v-else>
      <p>引荐与门规已说清。愿意承担师门职责，才在门册上落名。初次入道发粗制储物袋、下品灵石24（含药队酬谢），并可选学一册基础功法；之后仍可兼修。</p>
      <button :disabled="busy || !!joinError(game)" @click="emit('act',{type:'join',branch:'dan'})">向温蘅行礼，拜入丹堂</button>
      <button :disabled="busy || !!joinError(game)" @click="emit('act',{type:'join',branch:'jian'})">向季衡行礼，拜入剑院</button>
    </template>
    <template v-if="n.admission === 'deferred' && !hasCultivationKit(game)">
      <button :disabled="busy || !!initiationError(game,'entry:contract')" @click="emit('act',{type:'qiJourney',action:'entry:contract'})">与药队立约，领取散修入道行装</button>
      <small>{{ initiationError(game,'entry:contract') || '粗制储物袋、下品灵石24与一册基础功法的选学资格；不立宗籍。' }}</small>
    </template>
    <button v-if="n.admission !== 'deferred'" :disabled="busy || !!initiationError(game,'entry:defer')" @click="emit('act',{type:'qiJourney',action:'entry:defer'})">暂不拜师，以散修身份行走</button>
  </section>
  <p v-else role="status">你已正式拜入{{ game.journey.branch === 'dan' ? '丹堂' : '剑院' }}。药路上的来往有了师门之谊，师门与委托现可查看；此后的功法仍可兼修。</p>
</template>
<style scoped>
p{line-height:1.65}button{margin:.3rem;padding:.6rem .8rem;background:#29453c;color:#f5ead3;border:1px solid #b6a16c;border-radius:4px}small{display:block;color:#eed6ab}button:focus-visible{outline:2px solid #ffe5ac}
</style>
