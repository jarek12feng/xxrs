<script setup lang="ts">
import {computed,ref} from 'vue';
import type {State} from '../../../world';
import {choices,fresh,quote,valid,view} from './index';
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{move:[string]}>();
const selected=ref<'rack'|'guard'|'outlet'|'path'|'tide'>('guard');
const practice=computed(()=>props.game.goldenStory.practice as unknown as {step:0|1;material:unknown});
const local=computed(()=>valid(practice.value?.material)?practice.value.material:fresh(0));
const display=computed(()=>view(practice.value??{step:0,material:local.value}));
const objects={rack:'药架',guard:'护阵石',outlet:'回流口',path:'搬运通道',tide:'试潮闸'};
const moves={rack:['ground-gather','ground-transfer','ground-dry'],guard:['ground-inner','ground-outer','ground-divide'],outlet:['ground-open','ground-close'],path:['ground-clear'],tide:['ground-test']};
const actions=computed(()=>choices.filter(c=>moves[selected.value].includes(c.move)).map(c=>({...c,q:quote(props.game,c.move)})));
const rackX=computed(()=>local.value.rack==='inner'?26:local.value.rack==='high'?85:49);
</script>

<template>
  <section class="ground-practice" aria-label="护阵试具">
    <header><strong>{{display.title}}</strong><small>调整不耗年月或物资</small></header>
    <p class="clue">{{display.clue}}</p>
    <div class="tableau" :data-guard="local.guard" :data-rack="local.rack" :data-outlet="local.outlet">
      <svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
        <rect x="32" y="35" width="210" height="125" rx="35" class="inner" :class="{lit:local.guard==='inner'||local.guard==='divided'}"/>
        <path d="M285 105 H510" class="path" :class="{lit:local.guard==='outer'||local.guard==='divided'}"/>
        <path :d="local.outlet?'M10 16 H355 V150 H580':'M10 16 H355 V65 H290'" class="water"/>
        <rect x="470" y="65" width="110" height="84" rx="6" class="high"/>
        <path v-if="local.debris" d="M350 78 L395 124 M360 129 L397 85" class="debris"/>
      </svg>
      <span class="inner-label">内圈</span><span class="high-label">高台</span>
      <span class="water-label">{{local.outlet?'回潮 → 外渠':'回潮 → 外场'}}</span>
      <button class="object rack" :style="{left:rackX+'%'}" :aria-pressed="selected==='rack'" @click="selected='rack'">▥ 药架<small>{{local.soaked?'待晾干':'干燥'}}</small></button>
      <button class="object guard" :aria-pressed="selected==='guard'" @click="selected='guard'">护阵石</button>
      <button class="object outlet" :aria-pressed="selected==='outlet'" @click="selected='outlet'">回流口 · {{local.outlet?'开':'闭'}}</button>
      <button class="object aisle" :aria-pressed="selected==='path'" @click="selected='path'">通道 · {{local.debris?'浮木':'畅通'}}</button>
      <button class="object tide" :aria-pressed="selected==='tide'" @click="selected='tide'">试潮闸</button>
    </div>
    <div class="tools" :aria-label="objects[selected]+'操作'">
      <strong>{{objects[selected]}}</strong>
      <div v-for="a in actions" :key="a.move" class="action">
        <button :disabled="busy||!!a.q.error" @click="emit('move',a.move)">{{a.label}}</button>
        <small v-if="a.q.error">{{a.q.error}}</small>
      </div>
    </div>
    <div class="status" aria-live="polite"><span v-for="s in display.status" :key="s">{{s}}</span></div>
  </section>
</template>

<style scoped>
.ground-practice{pointer-events:auto;width:100%;max-width:650px;box-sizing:border-box;padding:10px;border:1px solid #9c8d63;border-radius:12px;background:rgba(25,34,32,.95);color:#f1e7ce;font-size:13px;text-align:left}
header{display:flex;justify-content:space-between;gap:10px}small{font-size:11px;color:#d1c8b3}.clue{margin:6px 0;line-height:1.5}.tableau{position:relative;height:180px;background:#203e40;border-radius:8px;overflow:hidden}.tableau svg{width:100%;height:100%;position:absolute}.inner{fill:#384e44;stroke:#8a9473;stroke-width:2}.path{stroke:#8a9473;stroke-width:22;fill:none}.lit{stroke:#e6d58e;stroke-width:6;filter:drop-shadow(0 0 4px #d8bb66)}.path.lit{stroke-width:25}.water{stroke:#75c7cf;stroke-width:6;fill:none;stroke-dasharray:12 5}.high{fill:#706853;stroke:#b8ac88;stroke-width:2}.debris{stroke:#b28b5e;stroke-width:10}.inner-label,.high-label,.water-label{position:absolute;font-size:11px;pointer-events:none}.inner-label{left:12%;top:42px}.high-label{left:83%;top:69px}.water-label{left:8%;top:4px}.object{position:absolute;padding:5px 7px;min-height:30px;background:#27302b;color:#fff3ce;border:1px solid #ad9c70;border-radius:5px;font:inherit;cursor:pointer}.object[aria-pressed=true]{outline:2px solid #f2db96;outline-offset:1px}.object:focus-visible,.tools button:focus-visible{outline:3px solid #fff}.rack{top:91px;transform:translateX(-50%)}.rack small{display:block}.guard{left:9%;bottom:8px}.outlet{left:61%;top:26px}.aisle{left:53%;bottom:8px}.tide{right:3%;top:3px}.tools{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px;margin-top:8px;min-height:66px}.tools>strong{width:100%}.action{flex:1;min-width:120px}.action button{width:100%;min-height:32px;padding:5px;border:1px solid #a89971;background:#41483b;color:#fff1cf;border-radius:5px;cursor:pointer}.action button:disabled{opacity:.55;cursor:default}.action small{display:block;line-height:1.4}.status{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px;font-size:11px;color:#d6d8c5}
</style>
