<script setup lang="ts">
import { computed, ref } from 'vue';
import type { State } from '../../../world';
import { choices, fresh, quote, valid, view } from './index';
const props = defineProps<{game: State; busy: boolean}>();
const emit = defineEmits<{move: [string]}>();
const selected = ref<'main'|'side'|'vent'|'bottle'|'herb'>('main');
const practice = computed(() => props.game.goldenStory.practice as unknown as {step: 0|1; material: unknown} | null);
const material = computed(() => valid(practice.value?.material) ? practice.value!.material as ReturnType<typeof fresh> : fresh(0));
const scene = computed(() => view(practice.value ?? {step: 0, material: material.value}));
const groups = { main: ['pillWarm', 'pillSplit', 'pillReset'], side: ['pillHold'], vent: ['pillVent'], bottle: ['pillCollect'], herb: ['pillHerb'] };
const actions = computed(() => choices.filter(c => groups[selected.value].includes(c.move)).map(c => ({...c, result: quote(props.game, c.move)})));
function act(move: string) { if (!props.busy && !quote(props.game, move).error) emit('move', move); }
</script>
<template>
  <section class="pill-practice" aria-label="分药试具" :data-haze="material.haze" :data-breath="material.breath" :data-muddled="material.muddled">
    <header><strong>{{scene.title}}</strong><span>{{scene.clue}}</span></header>
    <div class="apparatus">
      <svg viewBox="0 0 640 210" aria-hidden="true" class="vessels">
        <path d="M190 40 L208 150 Q280 180 352 150 L370 40" class="bowl"/>
        <path d="M209 110 Q280 90 352 110 L345 145 Q280 167 215 145Z" class="liquid" :class="{muddled:material.muddled}"/>
        <path v-if="material.haze !== 'clear'" :d="material.haze==='floating'?'M220 76 Q250 55 280 76 T345 76':'M220 132 Q250 112 280 132 T345 132'" class="haze"/>
        <path d="M350 90 H460 V140" class="pipe" :class="{drained: material.haze==='clear'}"/>
        <path d="M428 142 L437 182 Q460 192 483 182 L492 142" class="bowl"/>
        <path v-if="material.haze==='clear'" d="M440 172 H480" class="haze"/>
        <path d="M80 106 L90 158 Q125 174 160 158 L170 106" class="bowl"/>
        <path v-if="material.breath==='sidecup'" d="M102 139 Q120 115 148 139" class="green"/>
        <path d="M250 130 Q265 98 280 130" class="gold"/>
        <path v-if="practice?.step===1 && material.breath!=='sidecup'" d="M295 130 Q310 98 325 130" class="green"/>
        <path v-if="material.breath==='dual'" d="M248 106 Q263 80 283 106 M293 106 Q313 80 330 106" class="mind"/>
        <path v-if="material.warm" d="M235 179 Q247 167 259 179 M275 184 Q287 172 299 184 M315 179 Q327 167 339 179" class="heat"/>
      </svg>
      <button class="object main" :aria-pressed="selected==='main'" @click="selected='main'">主盏 <small>{{material.warm?'温意透底':'盏底微凉'}}</small></button>
      <button class="object side" :aria-pressed="selected==='side'" @click="selected='side'">旁盏 <small>{{material.breath==='sidecup'?'青息暂存':'空盏待用'}}</small></button>
      <button class="object vent" :aria-pressed="selected==='vent'" @click="selected='vent'">侧孔 <small>{{material.haze==='clear'?'灰雾已排出':'通往废盏'}}</small></button>
      <button class="object bottle" :aria-pressed="selected==='bottle'" @click="selected='bottle'">净药瓶 <small>{{material.collected?'清液已收':'从盏底收取'}}</small></button>
      <button class="object herb" :aria-pressed="selected==='herb'" @click="selected='herb'">灵草 <small>补救混流 · 2株</small></button>
    </div>
    <div class="object-actions" aria-label="所选器物操作">
      <div v-for="c in actions" :key="c.move"><button :data-move="c.move" :disabled="busy || !!c.result.error" @click="act(c.move)">{{c.label}}</button><small v-if="c.result.error">{{c.result.error}}</small></div>
    </div>
    <p class="status" aria-live="polite">{{scene.status.join('；')}}</p>
  </section>
</template>
<style scoped>
.pill-practice{pointer-events:auto;width:min(680px,100%);box-sizing:border-box;color:#f1e6cd;background:#182726ed;border:1px solid #897950;border-radius:12px;padding:12px;font-size:13px}.pill-practice header{display:flex;gap:12px;align-items:start}.pill-practice header strong{white-space:nowrap;color:#edd398}.pill-practice header span{line-height:1.5;color:#d0d7cd}.apparatus{height:210px;position:relative}.vessels{position:absolute;width:100%;height:100%;inset:0}.bowl{fill:#28423e;stroke:#b6b18a;stroke-width:3}.liquid{fill:#72a48e80}.liquid.muddled{fill:#9c897c}.pipe{fill:none;stroke:#857d66;stroke-width:7}.pipe.drained{stroke:#b6b18a}.haze{fill:none;stroke:#b4abb6;stroke-width:11;stroke-linecap:round}.gold,.green,.mind,.heat{fill:none;stroke-width:5}.gold{stroke:#f5c669}.green{stroke:#7cdbb8}.mind{stroke:#c6b4ed;stroke-width:2;stroke-dasharray:4 3}.heat{stroke:#e6a56b;stroke-width:3}.object{position:absolute;background:#172b29ee;border:1px solid #9b8b67;color:#f2e4c1;border-radius:6px;padding:5px 9px;cursor:pointer}.object small{display:block;font-size:11px;color:#c4cfc5}.object[aria-pressed=true]{outline:2px solid #e8c777;outline-offset:2px}.main{left:36%;top:6px}.side{left:9%;top:64px}.vent{right:16%;top:50px}.bottle{right:0;bottom:8px}.herb{left:0;bottom:8px}.object-actions{display:flex;gap:8px;flex-wrap:wrap;min-height:48px}.object-actions>div{flex:1;min-width:145px}.object-actions button{background:#304942;border:1px solid #ad976c;border-radius:5px;color:#f1e5cb;padding:8px;width:100%;cursor:pointer}.object-actions small{display:block;color:#c8c7ba;font-size:11px;margin-top:4px}.object-actions button:disabled{opacity:.55;cursor:default}button:focus-visible{outline:2px solid #f3d782;outline-offset:3px}.status{margin:8px 0 0;color:#d8cfad;font-size:12px;line-height:1.5}@media(max-width:600px){.pill-practice{font-size:12px;padding:8px}.pill-practice header{display:block}.pill-practice header span{display:block}.apparatus{height:190px}.object{padding:4px}.object-actions>div{min-width:120px}}
</style>
