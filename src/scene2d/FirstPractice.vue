<script setup lang="ts">
import { computed, ref, watch } from "vue";
import NarrativeStage from "./NarrativeStage.vue";
import type { State } from "../core";
import { techniques } from "../core";
import { tacticalExchange, combatStyle } from "../expedition/combat";
import { characterArt, heroArt } from "../presentation/art";
import type { Move } from "../expedition/content";
const props = withDefaults(
  defineProps<{ game: State; busy: boolean; standalone?: boolean }>(),
  { standalone: false },
);
const emit = defineEmits<{ close: [] }>();
const stroke = ref(0);
function practice(id: Move) {
  move.value = id;
  stroke.value++;
}

const move = ref<Move | null>(null);
const open = ref(false);
watch(
  () => props.game.journey.main,
  () => {
    move.value = null;
    open.value = false;
  },
);
const main = computed(() => props.game.journey.main);
const style = computed(() => combatStyle(props.game));
const moves = [
  ["guard", "守势"],
  ["strike", "反击"],
  ["discern", "辨影"],
] as const;
// Read-only demonstration against a clearly labelled practice target. No command, cost or reward.
const result = computed(() =>
  move.value
    ? tacticalExchange(
        props.game,
        move.value,
        { hp: 100, attack: 12, pattern: ["guard"] },
        { hp: 16, enemy: 100, turn: 0 },
        "",
        false,
      )
    : null,
);
const basic = computed(() =>
  move.value
    ? tacticalExchange(
        { ...props.game, journey: { ...props.game.journey, main: null } },
        move.value,
        { hp: 100, attack: 12, pattern: ["guard"] },
        { hp: 16, enemy: 100, turn: 0 },
        "",
        false,
      )
    : null,
);
</script>
<template>
  <NarrativeStage
    v-if="standalone && main && game.journey.learning.book"
    class="practice-stage"
    aria-label="第一册功法试招"
    stage-key="first-practice"
    image="/scenes/shrine-relit.jpg"
    :title="`${techniques[main].name} · 山祠外试招`"
    goal="练习阵影横扫而来，试试用新学的功法应对。"
    :hotspots="[]"
    active="practice"
    @close="emit('close')"
  >
    <template #status
      ><span>可选试演 · 不耗年月与物资 · 不留伤势 · 无奖励</span></template
    >
    <template #world
      ><div class="practice-actors" :class="move" :key="stroke">
        <img
          :src="
            characterArt(
              heroArt(game.social.gender, game.realm),
              move === 'strike' ? 'attack' : move ? 'guard' : 'idle',
            )
          "
          alt="主角试演所学功法"
        />
        <div class="practice-target">
          <div class="target-shadow"></div>
          <div class="practice-ring" aria-hidden="true"></div>
          <span>练习阵影 · 横扫来势</span>
        </div>
      </div></template
    >
    <div class="practice-console">
      <div class="practice-direction">
        <strong>{{ techniques[main].name }}</strong>
        <p>{{ style.description }}</p>
        <button class="practice-exit" @click="emit('close')">
          结束试招，继续上路
        </button>
      </div>
      <div>
        <div class="practice-moves">
          <button
            v-for="[id, label] in moves"
            :key="id"
            :disabled="busy"
            :aria-pressed="move === id"
            @click="practice(id)"
          >
            {{ label }}
          </button>
        </div>
        <p v-if="result && basic" role="status">
          伤敌 {{ basic.damage }} → {{ result.damage }} · 承伤
          {{ basic.incoming }} → {{ result.incoming }}。{{
            result.healing ? `有灵草时可恢复 ${result.healing} 气势。` : ""
          }}{{ result.note }}
        </p>
        <p v-else>试着守住这一合，也可以比较抢攻与辨影。</p>
        <small>数值左为未装主修，右为当前功法；正式交锋才实际结算。</small>
      </div>
    </div>
    <template #notes
      ><p>
        这里只试演，不消耗灵草、不留伤势、不推进年月，也不领取奖励。比较来自现有战斗计算，没有另设试招加成。
      </p></template
    >
  </NarrativeStage>

  <section
    v-else-if="
      main && game.journey.learning.book && !game.adventure.road.thanked
    "
    class="first-practice"
    aria-label="第一册功法试招"
  >
    <h3>{{ techniques[main].name }} · 已设为主修</h3>
    <p>{{ style.description }}</p>
    <button :disabled="busy" @click="open = !open">
      {{ open ? "收起试招" : "在药庐外试一招 · 可选" }}
    </button>
    <div v-if="open" class="practice-area">
      <div class="practice-picture" :class="move" :key="move || 'idle'">
        <img
          :src="
            characterArt(
              heroArt(game.social.gender, game.realm),
              move === 'strike' ? 'attack' : move ? 'guard' : 'idle',
            )
          "
          alt="主角试演所学功法"
        />
        <div class="practice-ring" aria-hidden="true"></div>
        <span>练习阵影 · 横扫来势</span>
      </div>
      <p>试着守住这一合，也可以比较抢攻与辨影。</p>
      <div class="practice-moves">
        <button
          v-for="[id, label] in moves"
          :key="id"
          :disabled="busy"
          :aria-pressed="move === id"
          @click="move = id"
        >
          {{ label }}
        </button>
      </div>
      <p v-if="result && basic" role="status">
        这一招：伤敌 {{ basic.damage }} → {{ result.damage }}，承伤
        {{ basic.incoming }} → {{ result.incoming }}。{{
          result.healing ? `有灵草时可恢复 ${result.healing} 气势。` : ""
        }}
        {{ result.note }}
      </p>
      <small
        >左为未装主修，右为当前功法。这里只试演，不消耗灵草、不留伤势、不推进年月；正式交锋会实际结算。</small
      >
    </div>
  </section>
</template>
<style scoped>
.first-practice {
  padding: 18px;
  border: 1px solid #a59061;
  border-radius: 8px;
  background: #18352c;
  color: #eee4ce;
  margin: 12px 0;
}
.first-practice h3 {
  margin: 0;
  color: #e6cd91;
}
.first-practice p {
  line-height: 1.65;
}
.first-practice button {
  background: #345443;
  color: #fff0cc;
  border: 1px solid #ad996d;
  padding: 10px 15px;
  min-height: 44px;
}
.practice-moves {
  display: flex;
  gap: 8px;
}
.practice-moves button[aria-pressed="true"] {
  outline: 2px solid #edcf89;
}
.practice-picture {
  position: relative;
  height: 200px;
  overflow: hidden;
  margin-top: 12px;
  background:
    linear-gradient(0deg, #061d1abf, #061d1a44),
    url("/scenes/apothecary.jpg") center/cover;
}
.practice-picture img {
  position: absolute;
  bottom: 0;
  left: 15%;
  height: 180px;
  width: 120px;
  object-fit: contain;
}
.practice-picture.strike img {
  animation: lunge 0.5s ease-out;
}
.practice-ring {
  position: absolute;
  width: 75px;
  height: 100px;
  right: 20%;
  top: 40px;
  border: 3px solid #a7d6b2;
  border-radius: 50%;
  box-shadow: 0 0 35px #8dc7ac77;
}
.practice-picture span {
  position: absolute;
  bottom: 10px;
  right: 8%;
  font-size: 12px;
  color: #fff2d4;
}
.practice-area small {
  display: block;
  line-height: 1.6;
  color: #d6d1c1;
}
@keyframes lunge {
  50% {
    transform: translateX(30px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .practice-picture.strike img {
    animation: none;
  }
}
</style>

<style scoped>
.practice-actors {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.practice-actors > img {
  position: absolute;
  left: 25%;
  bottom: 30%;
  height: 45%;
  width: 19%;
  object-fit: contain;
  filter: drop-shadow(0 12px 8px #06130daa);
}
.practice-target {
  position: absolute;
  left: 57%;
  bottom: 34%;
  width: 19%;
  height: 34%;
}
.practice-target .practice-ring {
  top: 0;
  left: 0;
  right: auto;
  width: 72%;
  height: 82%;
  border-width: 5px;
  transform: rotate(-10deg);
}
.practice-target span {
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  color: #f3dfb7;
  background: #142b24bf;
  padding: 5px 10px;
}
.target-shadow {
  position: absolute;
  bottom: 0;
  left: -10%;
  width: 90%;
  height: 16%;
  border-radius: 50%;
  background: #041712aa;
  filter: blur(6px);
}
.practice-actors.strike > img {
  animation: lunge 0.5s ease-out;
}
.practice-actors.guard .practice-ring {
  border-color: #e9d292;
  box-shadow: 0 0 50px #e9d29288;
}
.practice-actors.discern .practice-ring {
  border-style: dashed;
}
.practice-stage :deep(.narrative-inspector) {
  left: 5%;
  right: 5%;
  bottom: 20px;
  top: auto;
  width: auto;
  max-height: 35%;
  padding: 20px 26px;
}
.practice-stage :deep(.narrative-inspector-heading) {
  display: none;
}
.practice-stage :deep(.narrative-notes .narrative-inspector-heading) {
  display: flex;
}
.practice-console {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 32px;
}
.practice-console p {
  margin: 8px 0;
}
.practice-console strong {
  color: #efd69e;
  font-size: 18px;
}
.practice-console small {
  color: #d6d1c1;
}
.practice-console button {
  background: #345443;
  color: #fff0cc;
  border: 1px solid #ad996d;
  padding: 10px 18px;
  min-height: 44px;
  cursor: pointer;
}
.practice-console .practice-exit {
  padding: 7px 12px;
  min-height: 36px;
  font-size: 13px;
  background: transparent;
}
.practice-console button:disabled {
  opacity: 0.55;
  cursor: default;
}
.practice-console button:focus-visible {
  outline: 2px solid #edcf89;
  outline-offset: 3px;
}
@media (max-width: 900px) {
  .practice-console {
    gap: 14px;
    grid-template-columns: 1fr;
  }
  .practice-direction p {
    display: none;
  }
  .practice-stage :deep(.narrative-inspector) {
    max-height: 42%;
    padding: 14px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .practice-actors.strike > img {
    animation: none;
  }
}
</style>
