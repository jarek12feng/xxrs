<script setup lang="ts">
import { computed } from "vue";
import {
  opponents,
  challengeDetails,
  explorationError,
  aidError,
  type State,
  type Intent,
  type TrialPlace,
} from "./core";
const props = defineProps<{
  game: State;
  place: TrialPlace;
  locked: boolean;
}>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const encounter = computed(() => props.game.journey.encounters[props.place]);
const details = computed(() => challengeDetails(props.game, props.place));
</script>
<template>
  <div v-if="encounter && details" class="challenge-card">
    <span class="eyebrow">前路遇阻 · 可退回准备</span>
    <h3>{{ opponents[encounter.kind].name }}</h3>
    <p>{{ opponents[encounter.kind].description }}</p>
    <strong>当前闯关把握 {{ details.chance }}%</strong>
    <details>
      <summary>查看实力与准备如何影响把握</summary>
      <p v-for="term in details.terms" :key="term.name">
        {{ term.name }} {{ term.value >= 0 ? "+" : "" }}{{ term.value }}%
      </p>
      <p>总把握限制 5–100%。充分准备可达到 100%，无需无限碰运气。</p>
    </details>
    <p>
      闯关用时一月，消耗灵石 4；失败伤势 +{{
        details.damage
      }}，保留线索、灵器和本关援助。
    </p>
    <p v-if="encounter.outcome === 'loss'" role="status">
      上次未过：判定 {{ encounter.lastRoll }}/100，把握
      {{
        encounter.lastChance
      }}%。可去洞府养伤、凝神或固本，在「灵器准备」炼制装备，或请人同行。
    </p>
    <p v-if="encounter.aid !== 'none'">
      {{ encounter.aid === "mentor" ? "执事" : "陆迟" }}已答应同行，本关把握
      +20%。
    </p>
    <button
      :disabled="locked || !!explorationError(game, place) || game.stones < 4"
      @click="emit('act', { type: 'challenge', place, mode: 'fight' })"
    >
      准备好了，挑战 · {{ details.chance }}%
    </button>
    <button
      v-if="encounter.kind === 'guardian'"
      :disabled="
        locked ||
        !!explorationError(game, place) ||
        game.herbs < 6 ||
        game.study < 2
      "
      @click="emit('act', { type: 'challenge', place, mode: 'parley' })"
    >
      带药交涉 · 灵草 −6 / 需心得 2 / 必过
    </button>
    <div class="aid-options">
      <p>寻求帮助（本关限一位，不消耗好感）</p>
      <button
        :disabled="locked || !!aidError(game, place, 'mentor')"
        @click="emit('act', { type: 'aid', place, helper: 'mentor' })"
      >
        请执事护持</button
      ><small>{{
        aidError(game, place, "mentor") || "执事认可后可请其护阵"
      }}</small
      ><br /><button
        :disabled="locked || !!aidError(game, place, 'luchi')"
        @click="emit('act', { type: 'aid', place, helper: 'luchi' })"
      >
        请陆迟同行</button
      ><small>{{
        aidError(game, place, "luchi") || "赠丹与信任，现在有了回响"
      }}</small>
    </div>
  </div>
</template>
