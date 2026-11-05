<script setup lang="ts">
import type { State, Intent } from "../core";
import {
  preparationRoutes,
  preparationReady,
  type PreparationRoute,
  type PreparationAction,
} from "./preparation";
import { qiError } from "./rules";
defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; sect: [] }>();
const action = (r: PreparationRoute, s: string) =>
  `prep:${r}:${s}` as PreparationAction;
const choices = {
  medicine: ["沿水路 · 灵草 −2", "辨兽踪 · 神识 8"],
  sect: ["包扎随队伤者 · 灵草 −2", "以剑开路 · 剑意 4、伤势 +1"],
  wander: ["辨阵绕行 · 神识 8", "强破禁制 · 灵石 −8、伤势 +1"],
} as const;
</script>
<template>
  <section
    v-if="
      game.qiJourney.gates < 2 &&
      !game.qiJourney.node &&
      !game.qiJourney.essence &&
      game.qi >= 120
    "
    aria-label="晋升成长路线"
    class="preparation"
  >
    <h4>{{ game.qiJourney.gates ? "凝元" : "淬脉" }}准备 · 三条路线择一</h4>
    <p>
      {{
        preparationReady(game)
          ? "已有一条路线通过实战，可以进入晋升秘境。"
          : "完成整备、沿途选择和实战，才具备本阶段入境准备。普通交货委托不能代替。"
      }}可以换路，已做的准备保留，已花的物资不退。
    </p>
    <details
      v-for="(r, key) in preparationRoutes"
      :key="key"
      :open="
        game.qiJourney.preparations[game.qiJourney.gates]![key] > 0 &&
        game.qiJourney.preparations[game.qiJourney.gates]![key] < 3
      "
    >
      <summary>
        {{ r.name }} ·
        {{ game.qiJourney.preparations[game.qiJourney.gates]![key] }} / 3{{
          game.qiJourney.preparations[game.qiJourney.gates]![key] === 3
            ? " · 已完成"
            : ""
        }}
      </summary>
      <p>{{ r.purpose }}</p>
      <p>{{ r.steps.join(" → ") }}</p>
      <p>{{ r.cost }}</p>
      <p>{{ r.reward }}</p>
      <button
        v-if="key === 'medicine' && !game.qiJourney.people.scout"
        :disabled="busy || !!qiError(game, 'person:scout')"
        @click="emit('act', { type: 'qiJourney', action: 'person:scout' })"
      >
        认识许照岚 · 一月<small>{{ qiError(game, "person:scout") }}</small>
      </button>
      <button
        v-if="key === 'sect' && game.journey.branch === 'none'"
        :disabled="busy"
        @click="emit('sect')"
      >
        到药坪向温蘅求教
      </button>
      <button
        v-if="game.qiJourney.preparations[game.qiJourney.gates]![key] === 0"
        :disabled="busy || !!qiError(game, action(key, 'prepare'))"
        @click="
          emit('act', { type: 'qiJourney', action: action(key, 'prepare') })
        "
      >
        开始整备 · 一月<small>{{
          qiError(game, action(key, "prepare"))
        }}</small>
      </button>
      <div
        v-if="game.qiJourney.preparations[game.qiJourney.gates]![key] === 1"
        class="choices"
      >
        <button
          v-for="(step, i) in ['careful', 'bold'] as const"
          :key="step"
          :disabled="busy || !!qiError(game, action(key, step))"
          @click="emit('act', { type: 'qiJourney', action: action(key, step) })"
        >
          {{ choices[key][i] }} · 一月<small>{{
            qiError(game, action(key, step))
          }}</small>
        </button>
      </div>
      <button
        v-if="game.qiJourney.preparations[game.qiJourney.gates]![key] === 2"
        :disabled="busy || !!qiError(game, action(key, 'trial'))"
        @click="
          emit('act', { type: 'qiJourney', action: action(key, 'trial') })
        "
      >
        {{ r.steps[2] }} · 一月<small>{{
          qiError(game, action(key, "trial")) ||
          "可撤退；败退伤势 +1，准备进度保留"
        }}</small>
      </button>
    </details>
  </section>
</template>
<style scoped>
.preparation {
  border: 1px solid #a9986d;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
  background: #20352a;
}
.preparation h4 {
  color: #f4dfaa;
}
.preparation details {
  padding: 10px 0;
  border-top: 1px solid #64745d;
}
.preparation summary {
  cursor: pointer;
  line-height: 1.5;
}
.preparation p {
  line-height: 1.6;
}
.preparation button {
  white-space: normal;
  text-align: left;
  padding: 10px;
  margin: 4px 0;
}
.preparation small {
  display: block;
}
.choices {
  display: grid;
  gap: 8px;
}
.preparation button:disabled {
  opacity: 1;
  background: #38483c;
  color: #d9e1d4;
  border: 1px solid #778571;
  cursor: not-allowed;
}
</style>
