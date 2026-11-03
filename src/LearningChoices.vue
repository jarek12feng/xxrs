<script setup lang="ts">
import { computed, ref } from "vue";
import NarrativeStage from "./scene2d/NarrativeStage.vue";
import { techniques, relics, type State, type Intent } from "./core";
import { rescueEcho } from "./adventure";
import { learningBlocked } from "./learning";
const props = withDefaults(
  defineProps<{ game: State; busy: boolean; standalone?: boolean }>(),
  { standalone: false },
);
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const selected = ref("");
const bookAvailable = computed(
  () =>
    props.game.adventure.step === "done" && !props.game.journey.learning.book,
);
const relicAvailable = computed(
  () =>
    props.game.expedition.cleared >= 1 && !props.game.journey.learning.relic,
);
const hotspots = computed(() => [
  ...(bookAvailable.value
    ? [{ id: "book", label: "药工留下的功法木匣", x: 39, y: 63 }]
    : []),
  ...(relicAvailable.value
    ? [{ id: "relic", label: "药队留下的法器木匣", x: 57, y: 65 }]
    : []),
  { id: "exit", label: "回到山路", x: 19, y: 78 },
]);
function inspect(id: string) {
  if (id === "exit") emit("close");
  else selected.value = id;
}
</script>
<template>
  <NarrativeStage
    v-if="standalone"
    class="learning-choices learning-scene"
    aria-label="挑选谢礼"
    stage-key="learning-gifts"
    image="/scenes/shrine-relit.jpg"
    title="山祠归途 · 药队谢礼"
    :goal="
      bookAvailable
        ? '药工请你挑一册功法，往后的路也好有些依仗。'
        : relicAvailable
          ? '药队留下两件法器，请你从中挑一件。'
          : '谢礼已收妥，可以继续上路了。'
    "
    :hotspots="hotspots"
    :active="selected"
    @select="inspect"
    @close="selected = ''"
  >
    <template #world
      ><div class="gift-display" aria-hidden="true">
        <div v-if="bookAvailable" class="book-gift">
          <img
            v-for="t in ['spring', 'blade', 'breath']"
            :key="t"
            :src="`/art/items/manual-${t}.webp`"
            alt=""
          />
        </div>
        <div v-if="relicAvailable" class="relic-gift">
          <img src="/art/items/sword.webp" alt="" /><img
            src="/art/items/vial.webp"
            alt=""
          />
        </div></div
    ></template>
    <template v-if="selected === 'book' && bookAvailable">
      <h3>选一册入门功法</h3>
      <p>学会后立即设为主修，以后仍可兼修或更换。</p>
      <p v-if="game.journey.main">
        将替换当前主修：{{ techniques[game.journey.main].name }}；原功法仍保留。
      </p>
      <div
        v-for="t in ['spring', 'blade', 'breath'] as const"
        :key="t"
        class="gift-option"
      >
        <img :src="`/art/items/manual-${t}.webp`" :alt="techniques[t].name" />
        <div>
          <p>
            {{ techniques[t].hint
            }}<span v-if="game.journey.known.includes(t)"
              >；已学此书，折为灵石 20</span
            >
          </p>
          <button
            :disabled="busy || learningBlocked(game)"
            @click="emit('act', { type: 'learning', choice: t, equip: true })"
          >
            学会并主修 · {{ techniques[t].name }}
          </button>
        </div>
      </div>
    </template>
    <template v-else-if="selected === 'relic' && relicAvailable">
      <h3>选一件护送谢礼</h3>
      <div v-for="r in ['sword', 'vial'] as const" :key="r" class="gift-option">
        <img :src="`/art/items/${r}.webp`" :alt="relics[r].name" />
        <div>
          <p>
            {{ relics[r].hint
            }}<span v-if="game.journey.relics[r]">；已有此物，折为灵石 12</span>
          </p>
          <button
            :disabled="busy || learningBlocked(game)"
            @click="emit('act', { type: 'learning', choice: r })"
          >
            收下{{ relics[r].name }}
          </button>
        </div>
      </div>
    </template>
    <template v-else
      ><p>已收进随身行囊。</p>
      <button @click="emit('close')">继续上路</button></template
    >
    <template #status><p class="gift-echo">{{ rescueEcho(game.adventure) }}</p></template>
    <template #notes
      ><p>{{ rescueEcho(game.adventure) }}</p>
      <p>
        首册与法器谢礼各选一次。已有相同物品时按实际规则折成灵石；领取功法会设为主修，原功法保留。
      </p></template
    >
  </NarrativeStage>
  <template v-else>
    <section
      v-if="game.adventure.step === 'done' && !game.journey.learning.book"
      class="learning-choices"
      aria-label="挑选入门功法"
    >
      <h3>药工的谢礼 · 选一册入门功法</h3>
      <p>{{ rescueEcho(game.adventure) }}</p>
      <p>选一册学会并设为主修，马上就能运用。以后仍可兼修或更换。</p>
      <p v-if="game.journey.main">
        将替换当前主修：{{ techniques[game.journey.main].name }}；原功法仍保留。
      </p>
      <button
        v-for="t in ['spring', 'blade', 'breath'] as const"
        :key="t"
        :disabled="busy || learningBlocked(game)"
        @click="emit('act', { type: 'learning', choice: t, equip: true })"
      >
        学会并主修 · {{ techniques[t].name
        }}<small
          >{{ techniques[t].hint
          }}{{
            game.journey.known.includes(t) ? "；已学此书，折为灵石 20" : ""
          }}</small
        >
      </button>
    </section>
    <section
      v-if="game.expedition.cleared >= 1 && !game.journey.learning.relic"
      class="learning-choices"
      aria-label="挑选护送谢礼"
    >
      <h3>药队的谢礼 · 选一件法器</h3>
      <button
        v-for="r in ['sword', 'vial'] as const"
        :key="r"
        :disabled="busy || learningBlocked(game)"
        @click="emit('act', { type: 'learning', choice: r })"
      >
        {{ relics[r].name
        }}<small
          >{{ relics[r].hint
          }}{{ game.journey.relics[r] ? "；已有此物，折为灵石 12" : "" }}</small
        >
      </button>
    </section>
  </template>
</template>

<style scoped>
.learning-choices:not(.learning-scene) {
  position: relative;
  margin: 16px 0;
  padding: 18px;
  background: #142b24;
  color: #f3ecda;
  border: 1px solid #a99667;
  border-radius: 8px;
  line-height: 1.7;
}
.learning-choices h3 {
  margin: 0 0 8px;
  color: #f0d7a4;
  font-size: 17px;
}
.learning-choices p {
  margin: 0 0 12px;
}
.learning-choices button {
  display: block;
  width: 100%;
  min-height: 48px;
  margin-top: 10px;
  padding: 12px;
  white-space: normal;
  text-align: left;
  background: #233d32;
  color: #fff5dc;
  border: 1px solid #a99667;
  border-radius: 6px;
  font-size: 16px;
  line-height: 1.6;
}
.learning-choices small {
  display: block;
  margin-top: 5px;
  color: #e3dbc6;
  font-size: 13px;
}
</style>

<style scoped>
.gift-display {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.book-gift,
.relic-gift {
  position: absolute;
  top: 48%;
  display: flex;
  align-items: flex-end;
  filter: drop-shadow(0 10px 6px #0008);
}
.book-gift {
  left: 30%;
}
.relic-gift {
  left: 50%;
}
.gift-display img {
  width: clamp(60px, 7vw, 110px);
  height: 100px;
  object-fit: contain;
}
.gift-option {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0;
  border-bottom: 1px solid #af9e7255;
  padding-bottom: 12px;
}
.gift-option > img {
  width: 60px;
  height: 76px;
  object-fit: contain;
  flex-shrink: 0;
}
.gift-option p {
  font-size: 13px;
}
.learning-scene button {
  font-size: 14px;
}
</style>
