<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { pactView } from "./view";
import { pactQuote } from "./rules";
import { journeyActionError } from "../foundation-journey/progression";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const view = computed(() => pactView(props.game));
const fightError = computed(() =>
  journeyActionError(props.game, { kind: "battle", battle: "pactRival" }),
);
</script>
<template>
  <details
    v-if="view.visible"
    class="secret-pact"
    :open="
      ['inside', 'betrayed'].includes(game.secretPact.stage) ||
      (game.foundationJourney.location === 'ferry' &&
        game.secretPact.stage === 'none') ||
      (game.foundationJourney.location === 'frontier' &&
        game.secretPact.stage === 'promised')
    "
  >
    <summary>照玄之约 · {{ view.relationship }}</summary>
    <img
      v-if="['inside', 'betrayed'].includes(game.secretPact.stage)"
      class="chamber"
      src="/art/secret-pact/zhaoxuan-chamber.webp"
      alt="照玄遗府内室，石台上封存着一枚玉简"
      loading="lazy"
    />
    <div class="companions" v-if="game.secretPact.stage !== 'resolved'">
      <figure>
        <img
          src="/art/secret-pact/he-chong-dialogue.webp"
          alt="贺崇，寻补脉法的剑修"
          loading="lazy"
        />
        <figcaption>贺崇 · 寻法补旧伤</figcaption>
      </figure>
      <figure>
        <img
          src="/art/secret-pact/ye-zhao-dialogue.webp"
          alt="叶照，重契约与退路的阵修"
          loading="lazy"
        />
        <figcaption>叶照 · 勘阵留归路</figcaption>
      </figure>
    </div>
    <p>{{ view.next }}</p>
    <details v-if="!game.secretPact.manual && (game.secretPact.stage !== 'resolved' || view.fight)" class="pact-readiness" :open="game.secretPact.stage === 'promised'">
      <summary>争宝前看一看</summary>
      <p>贺崇 · 筑基中期：气势 {{ view.rival.hp }}，攻势 {{ view.rival.attack }}。你：气势 {{ view.power.hp }}，攻势 {{ view.power.damage }}，护持 {{ view.power.armor }}。</p>
      <p>入府不等于得宝。胜负还看功法与临阵应对；败退伤势 +2，已用月份与补给不退。</p>
      <ul><li v-for="hint in view.preparation" :key="hint">{{ hint }}</li></ul>
    </details>
    <p v-if="game.secretPact.last" role="status">{{ game.secretPact.last }}</p>
    <p v-if="game.secretPact.manual">
      <img
        class="jade"
        src="/art/secret-pact/zhaoxuan-jade-slip.webp"
        alt="照玄玉简"
        loading="lazy"
      />
      已得照玄护脉法：筑基交锋中，守势后接识阵，伤害 +6、承伤 −3。
    </p>
    <div class="pact-actions">
      <button
        v-for="option in view.actions"
        :key="option.action"
        :disabled="busy || !!pactQuote(game, option.action).error"
        @click="emit('act', { type: 'secretPact', action: option.action })"
      >
        {{ option.label }}<small>{{ option.detail }}</small
        ><small v-if="pactQuote(game, option.action).error">{{
          pactQuote(game, option.action).error
        }}</small>
      </button>
      <button
        v-if="view.fight"
        :disabled="busy || !!fightError"
        @click="
          emit('act', {
            type: 'foundationJourney',
            action: { kind: 'battle', battle: 'pactRival' },
          })
        "
      >
        {{ game.secretPact.stage === "betrayed" ? "与贺崇争夺玉简" : "追索玉简"
        }}<small
          >一月，不耗灵石；败退伤势
          +2，主动撤退不增伤。既有主材与其他传承保留。</small
        ><small>{{ fightError }}</small>
      </button>
    </div>
  </details>
</template>
<style scoped>
.chamber {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  background: #17292b;
  border-radius: 6px;
  margin-top: 12px;
}
.companions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.companions figure {
  margin: 8px 0;
  text-align: center;
  flex: 0 1 160px;
}
.companions img {
  height: 130px;
  width: 100%;
  object-fit: contain;
}
.companions figcaption {
  font-size: 13px;
}
.jade {
  width: 48px;
  height: 48px;
  object-fit: contain;
  vertical-align: middle;
}
@media (max-width: 480px) {
  .companions img {
    height: 96px;
  }
  .chamber {
    max-height: 200px;
  }
}

.secret-pact {
  margin: 12px 0;
  padding: 14px;
  border: 1px solid #9a866d;
  border-radius: 8px;
  line-height: 1.7;
}
.pact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pact-actions button {
  flex: 1 1 220px;
  min-width: 0;
  min-height: 44px;
  white-space: normal;
  text-align: left;
  background: #243a3c;
  color: #f4e8d0;
  border: 1px solid #9a866d;
  border-radius: 6px;
  padding: 10px 12px;
}
button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
button:focus-visible {
  outline: 2px solid #e9c990;
  outline-offset: 2px;
}
small {
  display: block;
  margin-top: 5px;
}
</style>
