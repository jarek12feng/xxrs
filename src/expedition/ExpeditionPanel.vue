<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { encounters, moves, type Move } from "./content";
import { expeditionError, readiness, type ExpeditionAction } from "./rules";
import { preparationAdvice, battleMeters } from "./presentation";
import { combatStyle, moveHint } from "./combat";
import ExpeditionResolution from "./ExpeditionResolution.vue";
import BattleStage from "./BattleStage.vue";
import { expeditionIntermission } from "./progression";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; cultivate: [] }>();
const style = computed(() => combatStyle(props.game));
const advice = computed(() => preparationAdvice(props.game));
const meters = computed(() => battleMeters(props.game));
const q = computed(() => props.game.expedition);
const encounter = computed(() => encounters[Math.min(q.value.cleared, 2)]!);
const power = computed(() => readiness(props.game));
const actions = computed<
  { action: ExpeditionAction; label: string; hint?: string }[]
>(() =>
  !q.value.accepted
    ? [{ action: "accept", label: "接取护送与旧阵委托" }]
    : q.value.cleared === 3
      ? []
      : q.value.duel
        ? [
            ...(Object.keys(moves) as Move[]).map((action) => ({
              action,
              label: moves[action],
              hint: moveHint(props.game, action),
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
  <section
    class="expedition-panel"
    :class="{ 'active-battle': q.duel }"
    aria-label="青嶂关冒险委托"
  >
    <template v-if="q.duel">
      <header class="battle-heading">
        <h3>{{ encounter.name }} · 第 {{ q.duel.turn + 1 }} 合</h3>
        <small>{{ style.name }} · 灵草 {{ game.herbs }}</small>
      </header>
      <BattleStage
        :quest="q"
        :foe="encounter.foe"
        :player-max="meters.playerMax"
        :enemy-max="meters.enemyMax"
        :telegraph="encounter.pattern[q.duel.turn % encounter.pattern.length]"
      />
      <p class="battle-intent">
        {{ encounter.tells[q.duel.turn % encounter.tells.length] }}
      </p>
      <p v-if="q.cleared === 2" class="battle-plan">
        {{
          q.duel.enemy <= encounter.hp / 2 ? "阵核暴露 · 来招加重" : "旧阵护核"
        }}
        ·
        {{
          q.effect === "guard"
            ? "已蓄势：下合反击 +10"
            : q.effect === "discern"
              ? "已辨阵：下合伤害 +6、承伤 −2"
              : "稳守蓄势，或辨阵为下合铺路"
        }}
      </p>
      <div class="battle-moves">
        <button
          v-for="a in actions.filter((a) => a.action !== 'withdraw')"
          :key="a.action"
          :disabled="busy"
          @click="emit('act', { type: 'expedition', action: a.action })"
        >
          {{ a.label }}<small>{{ a.hint }}</small>
        </button>
      </div>
      <p class="battle-receipt" role="status">{{ q.last }}</p>
      <button
        class="battle-withdraw"
        :disabled="busy"
        @click="emit('act', { type: 'expedition', action: 'withdraw' })"
      >
        主动撤回 · 不新增伤势
      </button>
    </template>
    <template v-else>
      <h3>青嶂关 · 护送与旧阵</h3>
      <ol>
        <li v-for="(e, i) in encounters" :key="e.name">
          {{ q.cleared > i ? "✓" : q.cleared === i ? "→" : "◇" }} {{ e.name }}
        </li>
      </ol>
      <p v-if="!q.accepted">
        药队需要同行之人。先以炼气之身护送、寻踪；随后药队回坊市、封阵休整，待你筑基再合力取出阵核里的证据。可随时在交锋外回洞府准备。
      </p>
      <template v-else-if="q.cleared < 3">
        <h4>{{ encounter.name }}</h4>
        <p>
          {{
            q.cleared === 1
              ? "药签上的印记通往旧阵。阵眼被乱流和草根缠住，先辨清阵纹或温养草根，再取出压在下面的东西。"
              : expeditionIntermission(game) || encounter.story
          }}
        </p>
        <p v-if="!q.duel">
          行前回山下休整、筹备一月（若遇旧约先赴约），灵石
          {{ encounter.cost }}；首次完成奖励灵石 {{ encounter.reward }}、灵草
          2。失败保留已过小关，伤势 +1。
        </p>
        <p v-if="game.realm === 1" class="muted">
          筑基护体已生效：交锋气势上限 +8、基础伤害
          +2，已计入当前能力；无需精炼灵器即可受益。
        </p>
        <aside class="combat-style">
          <strong>{{ style.name }}</strong>
          <p>{{ style.description }}</p>
          <small>当前灵草 {{ game.herbs }}；功法效果与正确应对叠加。</small>
        </aside>
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
        />
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
          {{ a.label
          }}<small>{{ expeditionError(game, a.action) || a.hint }}</small>
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
      <ExpeditionResolution :game="game" />
      <p v-if="q.cleared === 3">
        护身诀已入功法面板。现在可观察山口解法，决定救草、开山或修复旧阵；后续雾海剧情会记住这条归路。
      </p>
    </template>
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
/* Combat owns its viewport; scrolling a story never hides basic responses. */
.active-battle {
  position: fixed;
  inset: 0;
  z-index: 30;
  margin: 0;
  border-radius: 0;
  padding: 12px;
  overflow: auto;
  background: #102b24;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.active-battle h3,
.active-battle p {
  margin: 0;
}
.active-battle :deep(.battle-stage) {
  margin: 0;
  padding: 6px;
  flex: none;
}
.active-battle :deep(.battle-stage svg) {
  max-height: 100px;
}
.active-battle :deep(.battle-stage p) {
  font-size: 12px;
}
.battle-heading h3 {
  font-size: 18px;
}
.battle-heading small,
.battle-plan {
  font-size: 12px;
  color: #d0c698;
}
.battle-intent {
  font-size: 15px;
  line-height: 1.5;
}
.battle-moves {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.battle-moves button {
  padding: 9px 6px;
  font-size: 14px;
  text-align: center;
  min-height: 72px;
}
.battle-moves small {
  font-size: 11px;
  line-height: 1.45;
  margin-top: 5px;
}
.battle-receipt {
  font-size: 12px;
  line-height: 1.5;
  max-height: 5em;
  overflow: auto;
}
.battle-withdraw {
  margin-top: auto;
  text-align: center;
}
@media (min-width: 768px) {
  .active-battle {
    inset: 4vh max(20px, calc((100vw - 850px) / 2));
    border-radius: 12px;
    padding: 24px;
  }
  .active-battle :deep(.battle-stage svg) {
    max-height: 220px;
  }
}
@media (max-width: 480px) {
  .battle-moves {
    grid-template-columns: 1fr;
  }
  .battle-moves button {
    min-height: 0;
    text-align: left;
    padding: 8px 10px;
  }
  .battle-moves small {
    display: block;
  }
}
</style>
