<script setup lang="ts">
import { ref, watch } from "vue";
import CharacterSprite from "../../presentation/CharacterSprite.vue";
import type { CharacterId } from "../../presentation/art";
import type { CombatSnapshot } from "./sequence";
import { useCombatPresentation } from "./use-combat-presentation";
const props = defineProps<{
  snapshot: CombatSnapshot | null;
  hero: CharacterId;
  heroName: string;
}>();
const failed = ref(false);
const {beat,pose,stop}=useCombatPresentation(()=>props.snapshot);
watch(
  () => props.snapshot?.enemyImage,
  () => (failed.value = false),
);
defineExpose({ stop });
</script>
<template>
  <div
    v-if="snapshot"
    class="combat-field"
    :data-phase="beat?.phase || 'ready'"
    :class="{
      'enemy-hit': beat?.phase === 'impact' && beat.enemyLost,
      'player-hit': beat?.phase === 'impact' && beat.playerLost,
    }"
  >
    <div class="combat-player">
      <CharacterSprite :character="hero" :pose="pose" :facing="1" :label="heroName" /><span
        class="combat-name"
        >{{ heroName }}</span
      ><b v-if="beat?.phase === 'impact' && beat.playerLost" class="combat-loss"
        >−{{ beat.playerLost }}</b
      >
    </div>
    <div class="combat-enemy">
      <img
        v-if="snapshot.enemyImage && !failed"
        :src="snapshot.enemyImage"
        :alt="snapshot.enemyName"
        @error="failed = true"
      /><span class="combat-name">{{ snapshot.enemyName }}</span
      ><b v-if="beat?.phase === 'impact' && beat.enemyLost" class="combat-loss"
        >−{{ beat.enemyLost }}</b
      >
    </div>
    <div v-if="beat" class="combat-skip">
      <button @click="stop">跳过招式演出</button>
    </div>
  </div>
</template>
<style scoped>
.combat-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  --combat-reach: 80px;
}
.combat-player,
.combat-enemy {
  position: absolute;
  bottom: 27%;
  height: 48%;
  width: 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  filter: drop-shadow(0 14px 10px #0009);
  transition: transform 180ms ease-out;
}
.combat-player {
  left: 21%;
}
.combat-enemy {
  right: 21%;
}
.combat-player :deep(.character-sprite) {
  height: 100%;
  width: 100%;
  min-height: 0;
}
.combat-enemy img {
  height: 100%;
  width: 100%;
  min-height: 0;
  object-fit: contain;
  object-position: bottom;
}
.combat-name {
  /* Keep identity beside the figure, above a multi-line command bar. */
  position: absolute;
  bottom: 35%;
  left: 50%;
  transform: translateX(-50%);
  color: #f5e6bb;
  background: #102720db;
  padding: 4px 12px;
  border-bottom: 1px solid #bda56c;
  white-space: nowrap;
  font-size: 14px;
}
[data-phase="approach"] .combat-player,
[data-phase="strike"] .combat-player {
  transform: translateX(var(--combat-reach));
}
[data-phase="approach"] .combat-enemy {
  transform: translateX(calc(var(--combat-reach) * -0.35));
}
[data-phase="strike"] .combat-enemy {
  transform: translateX(calc(var(--combat-reach) * -0.7));
}
[data-phase="impact"].enemy-hit .combat-enemy {
  transform: translateX(18px);
  filter: brightness(1.3) drop-shadow(0 14px 10px #0009);
}
[data-phase="impact"].player-hit .combat-player {
  transform: translateX(-12px);
}
.combat-loss {
  position: absolute;
  top: 10%;
  right: 8%;
  color: #ffe0ad;
  text-shadow: 0 2px 4px #4d1d08;
  font-size: 25px;
}
.combat-skip {
  position: absolute;
  left: 50%;
  top: 19%;
  transform: translateX(-50%);
}
.combat-skip button {
  pointer-events: auto;
  cursor: pointer;
  padding: 7px 12px;
  color: #e8ddc1;
  border: 1px solid #b39b69;
  background: #112821d9;
}
@media (prefers-reduced-motion: reduce) {
  .combat-player,
  .combat-enemy {
    transition: none;
  }
}
@media (max-width: 900px) {
  .combat-field {
    --combat-reach: 28px;
  }
  .combat-player,
  .combat-enemy {
    bottom: 38%;
    height: 35%;
    width: 29%;
  }
  .combat-player {
    left: 13%;
  }
  .combat-enemy {
    right: 13%;
  }
}
</style>
