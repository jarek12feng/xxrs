<script setup lang="ts">
import { computed, ref, watch } from "vue";
import TravelMap from "../wayfaring/TravelMap.vue";
import { pactDestinationError } from "./revision";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import type { State, Intent } from "../core";
import { destinations } from "../foundation-journey/content";
import { pactView } from "./view";
import { journeyActionError } from "../foundation-journey/progression";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const view = computed(() => pactView(props.game));
const fightError = computed(() =>
  journeyActionError(props.game, { kind: "battle", battle: "pactRival" }),
);
const selected = ref("");
const active = computed({
  get: () => props.game.secretPact.hazard ? "terms" : selected.value,
  set: (value: string) => { selected.value = value; },
});
const mapDestination = ref<"pact" | "stele" | null>(null);
watch(
  () =>
    `${props.game.secretPact.stage}:${props.game.secretPact.trial}:${!!props.game.secretPact.hazard}`,
  () => {
    active.value = props.game.secretPact.hazard ? "terms" : "";
  },
);
const inside = computed(() => props.game.secretPact.site === "zhaoxuan");
const hotspots = computed(() => [
  { id: "terms", label: inside.value ? "封简石台" : "照玄来信", x: 47, y: 50 },
  { id: "preparation", label: "阵图与退路", x: 25, y: 70 },
  { id: "leave", label: "府门与归路", x: 78, y: 62 },
]);
const actionObject = (action: string) =>
  ["leave", "decline"].includes(action)
    ? "leave"
    : ["enterAnchor", "enterLight"].includes(action)
      ? "preparation"
      : "terms";
const shownActions = computed(() =>
  view.value.actions.filter(
    (option) => actionObject(option.action) === active.value,
  ),
);
</script>
<template>
  <section v-if="view.visible" class="secret-pact" aria-label="照玄之约">
    <TravelMap
      v-if="mapDestination"
      :game="game"
      :busy="busy"
      :destination="mapDestination"
      @act="emit('act', $event)"
      @close="mapDestination = null"
    />
    <NarrativeStage
      v-else
      :image="
        game.secretPact.site === 'brokenStele'
          ? '/art/world-story/foundation/broken-stele-inn.webp'
          : inside
            ? '/art/secret-pact/zhaoxuan-chamber.webp'
            : '/art/foundation-journey/' +
              destinations[game.foundationJourney.location].image +
              '.webp'
      "
      :title="
        game.secretPact.site === 'brokenStele'
          ? '断碑驿对质'
          : inside
            ? '照玄遗府'
            : '同行与交接'
      "
      :goal="view.relationship"
      :stage-key="
        game.secretPact.site + game.secretPact.trial + game.secretPact.stage
      "
      :hotspots="hotspots"
      :active="active"
      :battle="!!game.secretPact.hazard"
      @select="active = $event"
      @close="active = ''"
    >
      <template #notes
        ><p>{{ view.next }}</p>
        <p v-if="game.secretPact.last">{{ game.secretPact.last }}</p></template
      >
      <template #status
        ><span>{{
          game.secretPact.manual ? "照玄护脉法已得" : view.relationship
        }}</span
        ><small
          v-if="game.secretPact.last"
          class="scene-recent"
          role="status"
          >{{ game.secretPact.last.split("。")[0] }}</small
        ></template
      >
      <template v-if="active === 'terms'">
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
        <p v-if="game.secretPact.last" role="status">
          {{ game.secretPact.last }}
        </p>
        <p v-if="game.secretPact.manual">
          <img
            class="jade"
            src="/art/secret-pact/zhaoxuan-jade-slip.webp"
            alt="照玄玉简"
            loading="lazy"
          />
          已得照玄护脉法：筑基交锋中，守势后接识阵，伤害 +6、承伤 −3。
        </p>
      </template>
      <template
        v-if="active === 'preparation' || (active === 'terms' && view.fight)"
      >
        <section class="pact-readiness">
          <h3>争宝与退路</h3>
          <p>
            贺崇 · 筑基中期：气势 {{ view.rival.hp }}，攻势
            {{ view.rival.attack }}。你：气势 {{ view.power.hp }}，攻势
            {{ view.power.damage }}，护持 {{ view.power.armor }}。
          </p>
          <p>
            入府不等于得宝。胜负还看功法与临阵应对；败退伤势
            +2，已用月份与补给不退。
          </p>
          <ul>
            <li v-for="hint in view.preparation" :key="hint">{{ hint }}</li>
          </ul>
        </section>
      </template>
      <template v-if="active === 'leave'">
        <p>{{ view.next }}</p>
        <button
          v-if="game.secretPact.trial !== 'complete'"
          :disabled="busy || !!pactDestinationError(game, 'zhaoxuan')"
          @click="mapDestination = 'pact'"
        >
          查看赴照玄路程<small>{{
            pactDestinationError(game, "zhaoxuan")
          }}</small>
        </button>
        <button
          v-if="game.secretPact.pursuit === 'notified'"
          :disabled="busy || !!pactDestinationError(game, 'brokenStele')"
          @click="mapDestination = 'stele'"
        >
          查看断碑驿路程<small>{{
            pactDestinationError(game, "brokenStele")
          }}</small>
        </button>
        <button
          v-if="!game.secretPact.hazard && game.secretPact.trial !== 'division'"
          @click="mapDestination = 'pact'"
        >
          展开行旅地图 · 选择去向
        </button>
      </template>
      <div class="pact-actions">
        <button
          v-for="option in shownActions"
          :key="option.action"
          :disabled="busy || !option.available"
          @click="emit('act', { type: 'secretPact', action: option.action })"
        >
          {{ option.label }}<small>{{ option.detail }}</small
          ><small v-if="option.error">{{ option.error }}</small>
        </button>
        <button
          v-if="view.fight && active === 'terms'"
          :disabled="busy || !!fightError"
          @click="
            emit('act', {
              type: 'foundationJourney',
              action: { kind: 'battle', battle: 'pactRival' },
            })
          "
        >
          {{
            game.secretPact.stage === "betrayed"
              ? "与贺崇争夺玉简"
              : "追索玉简"
          }}<small
            >一月，不耗灵石；败退伤势
            +2，主动撤退不增伤。既有主材与其他传承保留。</small
          ><small>{{ fightError }}</small>
        </button>
      </div>
    </NarrativeStage>
  </section>
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
  margin: 0;
  padding: 0;
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

<style scoped>
.scene-recent {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: 8px;
  color: #dfd4b9;
  font-size: 12px;
  line-height: 1.6;
}
</style>
