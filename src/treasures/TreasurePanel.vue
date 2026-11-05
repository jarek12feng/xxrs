<script setup lang="ts">
import {
  equipmentCategoryLabel,
  equipmentControl,
  controlCosts,
  controlDescription,
  getEquipment,
  inspectEquipment,
  loadoutPreview,
  type EquipmentId,
} from "../equipment";
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
const control = computed(() => equipmentControl(props.game));
const loadoutPreviews = computed(() => Object.fromEntries(
  [...treasureIds, "tideSeal", "spiritPearl", "tideBlade"].map((item) => {
    return [item, loadoutPreview(props.game, { kind: "deploy", id: item as EquipmentId })];
  }),
));
const artifacts = ["tideSeal", "spiritPearl", "tideBlade"] as const;
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
      {{ controlDescription(game) }}。容量随神识提升，每 3 点增加
      1，最高22；器物入袋后需自行出战，交锋与途中不能更换。
    </p>
    <p>
      有效神识达到 18 后，仅驾驭一件器物可专御：伤害 +2、护体
      +1。多器共享一回合行动，按各器特性配合。
    </p>
    <p v-if="control.remaining < 4">
      余量
      {{ control.remaining }}；可先收回不需要的器物，或回洞府凝神、服养神药。
    </p>
    <button
      v-if="game.journey.equipped"
      :disabled="
        busy || !!reason({ kind: 'withdraw', item: game.journey.equipped })
      "
      @click="act({ kind: 'withdraw', item: game.journey.equipped })"
    >
      收回主器 · {{ getEquipment(game.journey.equipped).name }}
    </button>
    <p role="status">{{ game.treasures.last }}</p>
    <div class="treasure-grid">
      <article v-for="id in treasureIds" :key="id">
        <ItemArt :id="id" :size="72" />
        <h4>{{ treasures[id].name }}</h4>
        <p>
          {{ treasures[id].quality }} · {{ equipmentCategoryLabel(id) }} ·
          {{
            game.treasures.owned[id] === 2
              ? "已精炼"
              : game.treasures.owned[id]
                ? "未精炼"
                : "未持有"
          }}
        </p>
        <p>{{ treasures[id].hint }} 占用容量 {{ controlCosts[id] }}。</p>
        <p v-if="loadoutPreviews[id]">{{ loadoutPreviews[id] }}</p>
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
            {{ game.treasures.equipped.includes(id) ? "已装配" : "装配辅器" }}
          </button>
          <small>{{ reason({ kind: "equip", item: id }) }}</small>
          <button
            v-if="game.treasures.equipped.includes(id)"
            :disabled="busy || !!reason({ kind: 'withdraw', item: id })"
            @click="act({ kind: 'withdraw', item: id })"
          >
            收回此器
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
      v-if="game.treasures.equipped.length"
      :disabled="busy || !!reason({ kind: 'unequip' })"
      @click="act({ kind: 'unequip' })"
    >
      卸下辅器
    </button>
    <div v-if="game.realm >= 2" class="treasure-grid">
      <article v-for="id in artifacts" :key="id">
        <ItemArt :id="id" :size="72" />
        <h4>{{ getEquipment(id).name }}</h4>
        <p>
          法宝 · 占用容量 {{ controlCosts[id] }} · 伤害 +{{
            getEquipment(id).damage
          }}、护体 +{{ getEquipment(id).armor }}
        </p>
        <p v-if="id==='tideBlade'">守势或辨影后正确反击：伤害+10、承伤+2，连攻不触发。先在外海读旧器谱，再赴离照可选器室争胚、温养。</p>
        <p v-else-if="id==='tideSeal' && game.itemGrowth.golden.seal">潮图续炼：正确守势承伤−3，已计入行动预览。</p>
        <p v-else-if="id==='spiritPearl' && game.itemGrowth.golden.pearl">拓本续炼：正确辨影承伤−3，已计入行动预览。</p>
        <p>
          {{
            inspectEquipment(game, id).rank
              ? "已取得；温养完成后可选择出战"
              : "需从秘境争取，此处不出售"
          }}
        </p>
        <button
          :disabled="busy || !!reason({ kind: 'deploy', item: id })"
          @click="act({ kind: 'deploy', item: id })"
        >
          出战法宝
        </button>
        <p v-if="loadoutPreviews[id]">{{ loadoutPreviews[id] }}</p>
        <small>{{ reason({ kind: "deploy", item: id }) }}</small>
        <button
          v-if="game.treasures.artifacts.includes(id)"
          :disabled="busy || !!reason({ kind: 'withdraw', item: id })"
          @click="act({ kind: 'withdraw', item: id })"
        >
          收回此宝
        </button>
      </article>
    </div>
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
