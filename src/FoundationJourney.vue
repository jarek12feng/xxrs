<script setup lang="ts">
import { computed } from "vue";
import { foundationPreparation } from "./foundation-preparation";
import {
  foundationGoal,
  hasFoundationRecipe,
  relicJourneyError,
} from "./foundation";
import { preparationError, refineCost, type State, type Intent } from "./core";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ command: [intent: Intent] }>();
const plan = computed(() => foundationPreparation(props.game));
const cost = computed(() => refineCost(props.game));
</script>
<template>
  <section v-if="!game.realm" class="foundation-journey" aria-label="筑基机缘">
    <h3>筑基机缘 · 青石遗府</h3>
    <p>{{ foundationGoal(game) }}</p>
    <template v-if="!hasFoundationRecipe(game) && !game.pills">
      <p>
        探府修为：{{ Math.min(game.qi, 180) }}/180 ·
        {{
          plan.ready
            ? "破阵手段已具备，只需选一种"
            : "再备一种破阵手段即可，不必练满所有属性"
        }}。
      </p>
      <details>
        <summary>选一种破阵准备 · 查看已有手段与代价</summary>
        <ul class="passage-options">
          <li v-for="route in plan.routes" :key="route.id">
            <strong
              >{{ route.label }} · {{ route.disabled || "手段已具备" }}</strong
            >
            <p>{{ route.hint }}</p>
            <button
              v-if="route.preparation"
              :disabled="busy || route.preparation.disabled"
              @click="emit('command', route.preparation.intent)"
            >
              {{ route.preparation.label }}
            </button>
            <small v-if="route.preparation?.error">{{
              route.preparation.error
            }}</small>
          </li>
        </ul>
      </details>
    </template>
    <template v-if="plan.optional.length">
      <p>{{ plan.timing }}</p>
      <p
        v-if="
          plan.optional.some(
            (choice) =>
              choice.intent.type === 'advance' &&
              choice.intent.activity === 'train',
          )
        "
      >
        {{ plan.trainingHint }} 可用功法与灵器调整攻守。
      </p>
      <div v-for="choice in plan.optional" :key="choice.label">
        <button
          :disabled="busy || choice.disabled"
          @click="emit('command', choice.intent)"
        >
          {{ choice.label }}
        </button>
        <small v-if="choice.error">{{ choice.error }}</small>
      </div>
    </template>
    <template v-if="plan.next">
      <button
        :disabled="busy || plan.next.disabled"
        @click="emit('command', plan.next!.intent)"
      >
        {{ plan.next.label }}
      </button>
      <p class="fineprint">
        逐月结算，遇人物来信、赴约或修为已满即停，不替你选择。可随时改用洞府的一月行动。
      </p>
    </template>
    <button
      v-if="!relicJourneyError(game)"
      :disabled="busy"
      @click="emit('command', { type: 'revisitRelic' })"
    >
      {{ game.story.choice === "missed" ? "独自重返遗府" : "重返青石阵前" }}
    </button>
    <template v-if="hasFoundationRecipe(game) && !game.pills">
      <p>当前持有：灵草 {{ game.herbs }}、灵石 {{ game.stones }}。</p>
      <p>
        补炼一枚：三个月、灵草 {{ cost.herbs }}、灵石
        {{ cost.stones }}。失败后丹方仍在。
      </p>
      <button
        :disabled="busy || !!preparationError(game, 'refine')"
        @click="emit('command', { type: 'prepare', kind: 'refine' })"
      >
        依方补炼筑基丹
      </button>
      <p v-if="preparationError(game, 'refine')">
        {{ preparationError(game, "refine") }}
      </p>
      <button
        v-if="game.herbs < cost.herbs"
        :disabled="busy || game.stones < 8"
        @click="emit('command', { type: 'supplies' })"
      >
        购入灵草四株 · 灵石 8
      </button>
    </template>
  </section>
</template>
<style scoped>
.foundation-journey {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid currentColor;
  border-radius: 8px;
}
p {
  line-height: 1.7;
}
button {
  margin: 4px 8px 4px 0;
}
</style>

<style scoped>
.passage-options {
  padding-left: 20px;
}
.passage-options li {
  margin: 12px 0;
}
.passage-options p {
  margin: 4px 0;
}
button {
  white-space: normal;
  max-width: 100%;
}
</style>
