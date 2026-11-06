<script setup lang="ts">
import { computed, ref } from 'vue';
import CharacterSprite from '../presentation/CharacterSprite.vue';
import { actorAppearance, type CharacterId, type Pose } from '../presentation/art';
import type { Point } from './navigation';
const props = withDefaults(defineProps<{
  character: CharacterId; label: string; position: Point; moving: boolean; frame: number; facing: number;
  pose?: Pose; sheet?: string;
}>(), { pose:'idle', sheet:'/art/scene2d/hero-qi-walk-v2.png' });
const emit = defineEmits<{ ready:[available:boolean] }>();
const loaded=ref(false), failed=ref(false);
const sprite = computed(() => ({ transform:`translate(${-((props.frame % 4) * 25)}%,${-Math.floor(props.frame / 4) * 50}%)` }));
</script>
<template>
  <div class="walking-actor" :data-moving="moving && loaded" :style="{left:position.x+'%',top:position.y+'%'}">
    <div class="walk-crop" v-show="moving && loaded && !failed" :style="{transform:`scaleX(${actorAppearance(character, pose, facing, true).flipX ? -1 : 1})`}" role="img" :aria-label="label + '行走'">
      <img :src="sheet" :style="sprite" alt="" @load="loaded=true; emit('ready',true)" @error="failed=true; emit('ready',false)" />
    </div>
    <CharacterSprite v-if="!moving || !loaded || failed" :character="character" :pose="pose" :facing="facing" :label="label" />
  </div>
</template>
<style scoped>
.walking-actor { position:absolute; width:195px; height:260px; transform:translate(-50%,-100%); pointer-events:none; filter:drop-shadow(0 10px 8px #0008); }
.walk-crop { position:absolute; inset:0; overflow:hidden; }
.walk-crop img { position:absolute; left:0; top:0; width:400%; height:200%; max-width:none; object-fit:fill; }
@media(max-width:900px) { .walking-actor { width:143px; height:190px; } }
</style>
