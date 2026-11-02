<script setup lang="ts">
import { computed, ref } from "vue";
import { techniques, type State, type Intent, type Technique } from "../world";
import ItemArt from "../presentation/ItemArt.vue";
import {
  treasures,
  treasureIds,
  lotInfo,
  venues,
  venueError,
  type Venue,
} from "./catalog";
import { treasureQuote, type TreasureAction } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const budget = ref(0);
const sceneFailed = ref(false);
const auction = computed(() => props.game.treasures.auction);
const lot = computed(() =>
  auction.value && !auction.value.closed
    ? auction.value.lots[auction.value.index]
    : null,
);
const reason = (action: TreasureAction) =>
  treasureQuote(props.game, action).error;
function act(action: TreasureAction) {
  emit("act", { type: "treasure", action });
}
const venueIds: Venue[] = ["market", "foundation"];
</script>
<template>
  <section class="treasure-panel" aria-label="宝物与拍卖会">
    <h3>宝物与拍卖会</h3>
    <p>
      灵石 {{ game.stones }} ·
      主灵器之外可装配一件辅器；入袋后需自行装配，交锋中不能更换。
    </p>
    <p role="status">{{ game.treasures.last }}</p>
    <div class="treasure-grid">
      <article v-for="id in treasureIds" :key="id">
        <ItemArt :id="id" :size="72" />
        <h4>{{ treasures[id].name }}</h4>
        <p>
          {{ treasures[id].quality }} ·
          {{
            game.treasures.owned[id] === 2
              ? "已精炼"
              : game.treasures.owned[id]
                ? "未精炼"
                : "未持有"
          }}
        </p>
        <p>{{ treasures[id].hint }}</p>
        <template v-if="!game.treasures.owned[id]">
          <button
            :disabled="busy || !!reason({ kind: 'commission', item: id })"
            @click="act({ kind: 'commission', item: id })"
          >
            委托炼制 · {{ treasures[id].price }} 灵石 / 一月
          </button>
          <small>{{ reason({ kind: "commission", item: id }) }}</small>
        </template>
        <template v-else>
          <button
            :disabled="busy || !!reason({ kind: 'equip', item: id })"
            @click="act({ kind: 'equip', item: id })"
          >
            {{ game.treasures.equipped === id ? "已装配" : "装配辅器" }}
          </button>
          <button
            v-if="game.treasures.owned[id] < 2"
            :disabled="busy || !!reason({ kind: 'refine', item: id })"
            @click="act({ kind: 'refine', item: id })"
          >
            精炼 · 18 灵石 / 玄铁料 1 / 一月
          </button>
          <small v-if="game.treasures.owned[id] < 2">{{
            reason({ kind: "refine", item: id })
          }}</small>
        </template>
      </article>
    </div>
    <button
      v-if="game.treasures.equipped"
      :disabled="busy || !!reason({ kind: 'unequip' })"
      @click="act({ kind: 'unequip' })"
    >
      卸下辅器
    </button>
    <h4>赴会争宝</h4>
    <p>
      免费查看目录，先筹资再赴会。逐口竞价，成交才扣款；可以随时放弃。本场结束后至少十二个月才有下场目录。
    </p>
    <template v-for="venue in venueIds" :key="venue">
      <button
        :disabled="busy || !!reason({ kind: 'catalog', venue })"
        @click="act({ kind: 'catalog', venue })"
      >
        查看{{ venues[venue] }}目录
      </button>
      <small>{{
        venueError(game, venue) || reason({ kind: "catalog", venue })
      }}</small>
    </template>
    <div v-if="auction" class="auction">
      <img
        v-if="!sceneFailed"
        class="auction-scene"
        :src="'/art/treasures/auction-hall.webp'"
        alt="坊市拍卖会场"
        loading="lazy"
        decoding="async"
        @error="sceneFailed = true"
      />
      <h4>
        {{ venues[auction.venue] }} ·
        {{
          auction.closed
            ? "已散场"
            : auction.entered
              ? "正在竞拍"
              : "目录已公布"
        }}
      </h4>
      <ol>
        <li v-for="(entry, i) in auction.lots" :key="i">
          <ItemArt :id="entry.item" :size="48" />
          <strong>{{ lotInfo(entry.item).name }}</strong> ·
          {{ lotInfo(entry.item).category }}
          <p>{{ lotInfo(entry.item).hint }}</p>
          <p v-if="lotInfo(entry.item).category === '功法'">
            {{ techniques[entry.item as Technique].hint }}
          </p>
          <small
            >起价 {{ entry.opening }} · 每口加 {{ entry.step }} 灵石。{{
              lotInfo(entry.item).source
            }}参考价 {{ lotInfo(entry.item).price }} 灵石。</small
          >
          <p>
            {{
              entry.result === "won"
                ? `已竞得 · 支付 ${entry.paid} 灵石`
                : entry.result === "passed"
                  ? "已放弃"
                  : i === auction.index
                    ? "本拍"
                    : "候拍"
            }}
          </p>
        </li>
      </ol>
      <template v-if="!auction.closed">
        <label
          >每口出价上限（灵石）<input
            v-model.number="budget"
            type="number"
            min="0"
            max="1000000000"
            step="1"
        /></label>
        <button
          :disabled="busy || !!reason({ kind: 'budget', value: budget })"
          @click="act({ kind: 'budget', value: budget })"
        >
          设定预算
        </button>
        <p>已设上限 {{ auction.budget }} 灵石；每次出价仍须确认。</p>
        <button
          v-if="!auction.entered"
          :disabled="busy || !!reason({ kind: 'enter' })"
          @click="act({ kind: 'enter' })"
        >
          赴会 · 耗时一月
        </button>
        <template v-if="auction.entered && lot">
          <p>
            本拍：{{ lotInfo(lot.item).name }} ·
            {{
              lot.price < lot.opening
                ? "尚未有人出价"
                : `对手现价 ${lot.price} 灵石`
            }}
          </p>
          <button
            :disabled="busy || !!reason({ kind: 'bid' })"
            @click="act({ kind: 'bid' })"
          >
            出价 {{ lot.price + lot.step }} 灵石
          </button>
          <small>{{ reason({ kind: "bid" }) }}</small>
          <button
            :disabled="busy || !!reason({ kind: 'pass' })"
            @click="act({ kind: 'pass' })"
          >
            放弃本拍
          </button>
        </template>
        <button
          :disabled="busy || !!reason({ kind: 'leave' })"
          @click="act({ kind: 'leave' })"
        >
          离场 · 保留已得拍品
        </button>
      </template>
    </div>
    <aside v-if="game.realm === 1 && game.foundationJourney.cultivation >= 200">
      <ItemArt id="seal" :size="72" />
      <h4>法宝见闻 · 镇潮印</h4>
      <p>
        会场展示了一方镇潮印。执事说，金丹修士以丹元祭炼，可镇住汹涌灵潮；筑基灵力尚不足以长久驱使。此印只供观摩，并非本场拍品。
      </p>
    </aside>
  </section>
</template>
<style scoped>
.treasure-panel button:disabled {
  color: #c5c8be;
  background: #25342e;
  border-color: #68746a;
  opacity: 1;
}
.treasure-panel h3 {
  font-size: 1.2rem;
}
.treasure-panel h4 {
  font-size: 1.05rem;
}
.auction-scene {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
}
.treasure-panel {
  margin-block: 1rem;
  border-top: 1px solid #8c795b;
  padding-top: 1rem;
}
.treasure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 1rem;
}
.treasure-grid article,
.auction {
  padding: 1rem;
  background: rgba(10, 18, 22, 0.35);
  border: 1px solid #8c795b;
  border-radius: 8px;
}
.treasure-panel small {
  display: block;
}
.treasure-panel button {
  margin: 0.25rem;
  white-space: normal;
}
.treasure-panel input {
  width: 8rem;
  max-width: 100%;
  margin: 0.5rem;
}
.auction li {
  padding-block: 0.6rem;
}
.treasure-panel p {
  line-height: 1.65;
}
</style>
