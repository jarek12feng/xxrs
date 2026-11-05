<script setup lang="ts">
import { computed } from 'vue';
import type { State } from '../../../world';
import { choices, fresh, quote, valid, view } from './index';
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ move: [string] }>();
const practice = computed(() => props.game.goldenStory.practice);
const material = computed(() => valid(practice.value?.material) ? practice.value.material : fresh(0));
const info = computed(() => view({ step: practice.value?.step ?? 0, material: material.value }));
const controls = computed(() => choices.map(c => ({ ...c, q: quote(props.game, c.move) })));
function act(move: string) { if (!props.busy && !quote(props.game, move).error) emit('move', move); }
</script>

<template>
  <section class="method-tray" aria-label="双流玉盘接流试具" :data-backwash="material.backwash">
    <header><strong>{{ info.title }}</strong><span>不耗年月、物资</span></header>
    <p class="clue">{{ info.clue }}</p>
    <div class="apparatus">
      <svg viewBox="0 0 600 260" aria-hidden="true" class="channels">
        <path d="M85 65 H265 M335 65 H515 M300 80 V190 M85 65 V200 H260 M515 65 V200 H340" />
        <path :class="{ live: material.left }" d="M85 65 H280" />
        <path :class="{ live: material.right }" d="M320 65 H515" />
        <path :class="{ live: material.buffer === 'charged' }" d="M300 190 V80" />
        <path :class="{ surge: material.backwash }" d="M300 75 Q385 120 510 135" />
        <circle cx="300" cy="65" r="21" :class="{ live: material.calm }" />
      </svg>
      <div v-for="c in controls" :key="c.move" class="object" :class="c.move">
        <button type="button" :data-move="c.move" :disabled="busy || !!c.q.error" :title="c.q.error || c.label" @click="act(c.move)">{{ c.label }}</button>
        <small v-if="c.move === 'method-left'">{{ material.left ? '旧流不断' : '旧脉待接' }}</small>
        <small v-if="c.move === 'method-right'">{{ material.right ? '新流已接' : '新流待接' }}</small>
        <small v-if="c.move === 'method-buffer'">{{ material.buffer === 'charged' ? '缓冲盏存有旧流' : '缓冲盏空置' }}</small>
        <small v-if="c.move === 'method-calm'">{{ material.calm ? '双流相承' : game.outerSea.method === 'none' ? '尚未取得澄息篇' : '已习得' }}</small>
        <small v-if="c.move === 'method-drain'">{{ material.backwash ? '回涌阻住接点' : '侧槽平静' }}</small>
        <small v-if="c.move === 'method-release'">{{ material.released ? '玉环已亮' : '承接来流' }}</small>
      </div>
    </div>
    <p class="saved-feedback" aria-live="polite">{{ practice?.feedback || info.status.join(' · ') }}</p>
  </section>
</template>

<style scoped>
.method-tray{pointer-events:auto;width:min(660px,100%);color:#ecdfbd;background:rgba(24,39,40,.96);border:1px solid #9e9266;border-radius:16px;padding:12px 16px;box-sizing:border-box;font-size:14px}
header{display:flex;justify-content:space-between;gap:12px}header span{color:#b9c8b5;font-size:12px}.clue{margin:7px 0;line-height:1.5}.apparatus{position:relative;height:260px}.channels{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:#586763;stroke-width:5}.channels .live{stroke:#b5e8d6;filter:drop-shadow(0 0 4px #7fc7b4)}.channels .surge{stroke:#ecb37e;stroke-dasharray:8 5}.object{position:absolute;display:flex;flex-direction:column;align-items:center;width:32%;text-align:center;gap:4px}.object button{min-height:38px;padding:7px 10px;border:1px solid #bbae7f;border-radius:12px;background:#304a48;color:#fff1cd;font:inherit;cursor:pointer}.object button:disabled{opacity:.55;cursor:default}.object button:focus-visible{outline:3px solid #ffe1a0;outline-offset:3px}.object small{font-size:12px;color:#c2cdbb}.method-left{left:0;top:18px}.method-right{right:0;top:18px}.method-calm{left:34%;top:0}.method-drain{right:0;top:165px}.method-unhook{right:0;top:95px}.method-buffer{left:34%;bottom:2px}.method-release{left:0;bottom:2px}.saved-feedback{min-height:2.8em;margin:8px 0 0;line-height:1.4;color:#dfd0ab}
@media(max-width:700px){.method-tray{padding:10px;font-size:12px}.object button{padding:6px}.object small{font-size:11px}}
</style>
