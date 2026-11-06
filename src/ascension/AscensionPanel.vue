<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { characterArt, heroArt } from '../presentation/art';
import type { State, Intent } from '../core';
import { ascensionOptions, phaseName, type AscensionAction } from './rules';
import { breakthroughDetails, goldenChance } from '../progression/breakthrough';
const props=defineProps<{game:State;busy:boolean;notice?:string}>();
const emit=defineEmits<{act:[intent:Intent]}>();
const options=computed(()=>ascensionOptions(props.game));
const panel=ref<HTMLElement|null>(null);
watch(()=>props.game.ascension?.step,async step=>{if(step!==undefined){await nextTick();panel.value?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});}},{immediate:true});
function keydown(e:KeyboardEvent){
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();return;}
 if(e.key!=='Tab')return;
 const buttons=[...panel.value!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
 const first=buttons[0],last=buttons[buttons.length-1];
 if(e.shiftKey && (document.activeElement===first || document.activeElement?.tagName==='H2')){e.preventDefault();last?.focus();}
 else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
}
const send=(action:AscensionAction)=>emit('act',{type:'ascension',action});
</script>
<template>
  <div v-if="game.ascension && !game.pending" class="ascension-overlay" role="dialog" aria-modal="true" aria-label="破境行功">
    <section ref="panel" @keydown="keydown" :class="{unstable:game.ascension.strain>0}" :data-phase="game.ascension.step">
      <div class="ritual-world" aria-hidden="true">
        <div class="meridians"></div><div class="core-light"></div>
        <img :src="characterArt(heroArt(game.social.gender,game.realm),'meditate')" alt="" />
        <div class="phase-caption">{{ ['灵气沿经脉汇入','护持灵光渐渐收拢','灵流正向丹田收拢','气机已定，等待最后叩关'][game.ascension.step] }}</div>
      </div>
      <div class="ritual-controls">
      <p v-if="notice" role="alert">{{ notice }} 当前行功阶段仍保留，可重新选择本阶段操作重试。</p>
      <h2 tabindex="-1">{{ game.realm ? '凝丹' : '筑基' }} · {{ phaseName(game.realm,game.ascension.step) ?? '行功已稳，最后叩关' }}</h2>
      <p>行功 {{ Math.min(3,game.ascension.step+1) }}/3 · 灵草 {{ game.herbs }} · 灵流紊乱 {{ game.ascension.strain }}</p>
      <p>神识、根基与主修可助你稳住灵流。最终服丹消耗一枚丹药及{{ game.realm ? '六个月' : '一个月' }}；行功期间仍会受到寿元与约期影响。</p>
      <ol><li v-for="line in game.ascension.history" :key="line">{{ line }}</li></ol>
      <template v-if="game.ascension.step < 3">
        <div v-for="option in options" :key="option.id">
          <button :disabled="busy || !!option.error" @click="send(option.id)">{{ option.label }}</button>
          <p>{{ option.detail }} <span v-if="option.error">{{ option.error }}</span></p>
        </div>
      </template>
      <template v-else>
        <p>本次把握 {{ game.realm===0?breakthroughDetails(game,true).chance:goldenChance(game) }}%。{{ game.ascension.strain ? '强推留下的紊乱仍在；可收势后改变准备再来。' : game.realm===0?'行功已稳，最终把握仍由根基、护法与筑基准备决定。':'三段行功已稳，把握增加10个百分点；最终仍由根基、功法、灵地与护持共同决定。' }}</p>
        <button :disabled="busy" @click="send('commit')">服丹，完成突破</button>
      </template>
      <button :disabled="busy" @click="send('withdraw')">收势调息 · 一月，保留丹药</button>
    </div></section>
  </div>
</template>
<style scoped>
.ascension-overlay{position:fixed;inset:0;z-index:1000;background:#061b16dd;display:grid;place-items:center;padding:16px;color:#f2e7cd}
section{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);width:min(1180px,100%);max-height:90dvh;overflow:auto;background:#18342d;border:1px solid #c0a974;padding:0;border-radius:8px;overflow:hidden}
p,li{line-height:1.7}button{padding:10px 16px;background:#304e40;color:#fff0cf;border:1px solid #bba36b;cursor:pointer}button:disabled{opacity:.55}button:focus-visible{outline:3px solid #edcf82}
</style>

<style scoped>
.ritual-controls{padding:24px;overflow:auto;max-height:88dvh}.ritual-world{position:relative;min-height:520px;overflow:hidden;background:linear-gradient(0deg,#102c24aa,#102c2420),url('/art/foundation-growth/meridian-retreat.webp') center/cover}.ritual-world img{position:absolute;width:52%;height:55%;object-fit:contain;left:24%;bottom:12%;filter:drop-shadow(0 0 16px #bce7c4aa)}.meridians{position:absolute;inset:23% 12% 18%;border:2px solid #c4eac7aa;border-radius:50%;box-shadow:inset 0 0 45px #9ee8bd66,0 0 35px #9ee8bd55;transition:transform .8s,box-shadow .8s}.core-light{position:absolute;left:45%;top:58%;width:10%;aspect-ratio:1;border-radius:50%;background:#e9e3ac;filter:blur(10px);opacity:.2;transition:opacity .8s}.phase-caption{position:absolute;bottom:5%;left:8%;right:8%;text-align:center;background:#102c24d9;padding:10px;color:#fff0cf}[data-phase="1"] .meridians{transform:scale(.85)}[data-phase="2"] .meridians,[data-phase="3"] .meridians{transform:scale(.65);box-shadow:0 0 70px #eadd9eaa}[data-phase="2"] .core-light,[data-phase="3"] .core-light{opacity:.9}.unstable .meridians{border-color:#e8aa76;box-shadow:0 0 35px #df8b5266}@media(max-width:760px){section{grid-template-columns:1fr;overflow:auto}.ritual-world{min-height:220px}.ritual-controls{max-height:none}.ritual-world img{height:75%;bottom:15%}}@media(prefers-reduced-motion:reduce){.meridians,.core-light{transition:none}}
</style>
