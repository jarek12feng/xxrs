<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { encounters, moves, type Move } from "./content";
import { expeditionError, readiness, type ExpeditionAction } from "./rules";
import { preparationAdvice, battleMeters } from "./presentation";
import BattleStage from "./BattleStage.vue";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; cultivate: [] }>();
const advice = computed(() => preparationAdvice(props.game));
const meters = computed(() => battleMeters(props.game));
const q = computed(() => props.game.expedition);
const encounter = computed(() => encounters[Math.min(q.value.cleared, 2)]!);
const power = computed(() => readiness(props.game));
const actions = computed<{ action: ExpeditionAction; label: string }[]>(() =>
  !q.value.accepted
    ? [{ action: "accept", label: "接取护送与旧阵委托" }]
    : q.value.cleared === 3
      ? []
      : q.value.duel
        ? [
            ...(Object.keys(moves) as Move[]).map((action) => ({
              action,
              label: moves[action],
            })),
            { action: "withdraw", label: "主动撤回 · 不新增伤势" },
          ]
        : q.value.cleared === 1
          ? [
              { action: "studyArray", label: "辨认阵纹 · 神识 6 / 心得 2" },
              { action: "healArray", label: "温养草根 · 消耗灵草 4" },
            ]
          : [{ action: "enter", label: "备齐补给，开始交锋" }],
);
</script>
<template>
  <section class="expedition-panel" aria-label="青嶂关冒险委托">
    <h3>青嶂关 · 护送与旧阵</h3>
    <ol>
      <li v-for="(e, i) in encounters" :key="e.name">
        {{ q.cleared > i ? "✓" : q.cleared === i ? "→" : "◇" }} {{ e.name }}
      </li>
    </ol>
    <p v-if="!q.accepted">
      药队需要同行之人。两处小关与一场守阵交锋，完成后再决定山口的归路。可随时在交锋外回洞府准备。
    </p>
    <template v-else-if="q.cleared < 3">
      <h4>{{ encounter.name }}</h4>
      <p>{{ encounter.story }}</p>
      <p v-if="!q.duel">
        本次耗时一月、灵石 {{ encounter.cost }}；首次完成奖励灵石
        {{ encounter.reward }}、灵草 2。失败保留已过小关，伤势 +1。
      </p>
      <details class="combat-help">
        <summary>查看修行如何影响交锋</summary>
        <p>
          当前气势上限 {{ power.hp }} · 基础伤害 {{ power.damage }} · 护体减伤
          {{
            power.armor
          }}。凝神、研读、剑意与固本提高伤害；根基提高气势。正确应对额外造成 6
          点伤害，并少受 8 点伤害。
        </p>
      </details>
      <p v-if="q.cleared === 2">
        需筑基。建议根基 6、神识 6、心得 2；建议不是必胜门槛，仍需看破招式。
      </p>
      <BattleStage
        v-if="q.cleared !== 1 && q.effect !== 'win'"
        :quest="q"
        :foe="encounter.foe"
        :player-max="meters.playerMax"
        :enemy-max="meters.enemyMax"
        :telegraph="
          q.duel
            ? encounter.pattern[q.duel.turn % encounter.pattern.length]
            : undefined
        "
      />
      <p v-if="q.duel" class="tell">
        {{ encounter.tells[q.duel.turn % encounter.tells.length] }}
      </p>
    </template>
    <BattleStage
      v-if="q.effect === 'win' && !q.duel && q.cleared !== 2"
      :quest="q"
      :foe="encounters[Math.max(0, q.cleared - 1)]!.foe"
    />
    <p v-if="q.last" role="status">{{ q.last }}</p>
    <div class="expedition-actions">
      <button
        v-for="a in actions"
        :key="a.action"
        :disabled="busy || !!expeditionError(game, a.action)"
        @click="emit('act', { type: 'expedition', action: a.action })"
      >
        {{ a.label }}<small>{{ expeditionError(game, a.action) }}</small>
      </button>
      <button
        v-for="tip in advice"
        :key="tip.label"
        :disabled="busy || !!game.pending || game.status !== 'alive'"
        @click="emit('act', tip.intent)"
      >
        {{ tip.label }}<small>{{ tip.text }}</small>
      </button>
      <button
        v-if="!q.duel && q.accepted && q.cleared < 3"
        :disabled="busy"
        @click="emit('cultivate')"
      >
        回洞府准备 · 每月修行消耗寿元
      </button>
    </div>
    <p v-if="q.cleared === 3">
      护身诀已入功法面板。现在可观察山口解法，决定救草、开山或修复旧阵；后续雾海剧情会记住这条归路。
    </p>
  </section>
</template>
<style scoped>
.expedition-panel {
  padding: 20px;
  border: 1px solid #9b986e;
  border-radius: 12px;
  background: #19382fe8;
  color: #f2e8c8;
  margin: 16px 0;
}
h3,
h4,
p {
  color: inherit;
}
ol {
  padding-left: 20px;
}
.expedition-actions {
  display: grid;
  gap: 10px;
}
button {
  color: #fff0c4;
  background: #345449;
  border: 1px solid #a4ad82;
  padding: 12px;
  text-align: left;
}
button:disabled {
  opacity: 0.55;
}
small {
  display: block;
}
.tell {
  border-left: 3px solid #edcb7b;
  padding: 12px;
}
</style>
