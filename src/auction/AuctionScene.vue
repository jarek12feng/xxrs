<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../world";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import ItemArt from "../presentation/ItemArt.vue";
import { goldenGoods, lotInfo, type Venue } from "./catalog";
import {
  auctionVenues,
  auctionQuote,
  auctionNotice,
  venueAuction,
  type AuctionAction,
} from "./index";
import { formatLifeMonths } from "../progression";
const props = defineProps<{ game: State; busy: boolean; venue: Venue }>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const active = ref("desk"),
  budget = ref(0);
const def = computed(() => auctionVenues[props.venue]);
const notice = computed(() => auctionNotice(props.game, props.venue));
const auction = computed(() => venueAuction(props.game, props.venue));
const selected = computed(() => props.game.treasures.auction === auction.value);
const live = computed(
  () => selected.value && auction.value?.entered && !auction.value.closed,
);
const lot = computed(() =>
  auction.value && !auction.value.closed
    ? auction.value.lots[auction.value.index]
    : null,
);
const art = (item: string) =>
  Object.hasOwn(goldenGoods, item)
    ? goldenGoods[item as keyof typeof goldenGoods].art
    : item;
const reason = (a: AuctionAction) => auctionQuote(props.game, a).error;
const currentCatalog = computed(
  () => auction.value?.number === notice.value.number,
);
const catalogError = computed(() =>
  currentCatalog.value && selected.value
    ? ""
    : reason({ kind: "catalog", venue: props.venue }),
);
function openCatalog() {
  if (props.busy || catalogError.value) return;
  if (!currentCatalog.value || !selected.value)
    act({ kind: "catalog", venue: props.venue });
  active.value = "catalog";
}

function act(a: AuctionAction) {
  if (!props.busy && !reason(a)) emit("act", { type: "treasure", action: a });
}
watch(
  () => auction.value?.budget,
  (b) => (budget.value = b ?? 0),
  { immediate: true },
);
watch(
  live,
  (on) => {
    if (on) active.value = "rostrum";
  },
  { immediate: true },
);
const hotspots = computed(() => [
  { id: "desk", label: "管事与会讯", x: 25, y: 58 },
  { id: "catalog", label: "拍品陈列", x: 47, y: 44 },
  {
    id: "rostrum",
    label: live.value ? "拍台 · 继续竞价" : "入席参拍",
    x: 66,
    y: 52,
  },
  { id: "exit", label: "厅门", x: 86, y: 77 },
]);
</script>
<template>
  <section class="auction-world" :data-venue="venue" aria-label="拍卖会场">
    <NarrativeStage
      :image="def.image"
      :title="def.place + ' · ' + def.name"
      :goal="
        live ? '本场竞价中，落槌才付款' : '询问会期、查看拍品，再决定是否赴会'
      "
      :body="def.detail"
      :stage-key="'auction-' + venue"
      :hotspots="hotspots"
      :active="active"
      @select="active = $event"
      @close="active = ''"
    >
      <template #status
        ><span
          >灵石 {{ game.stones }} · 当前第 {{ game.month }} 月</span
        ></template
      >
      <template v-if="active === 'desk'">
        <h3>{{ def.name }} · 每{{ formatLifeMonths(def.period) }}一届</h3>
        <p>
          提前{{ formatLifeMonths(def.notice) }}公布目录，入场窗口{{
            formatLifeMonths(def.window)
          }}。
        </p>
        <p>
          第 {{ notice.number }} 届：第 {{ notice.opens }} 月开场，第
          {{ notice.closes }} 月截止入场。
        </p>
        <p v-if="game.month < notice.opens">
          距开场还有 {{ formatLifeMonths(notice.opens - game.month) }}。
        </p>
        <button :disabled="busy || !!catalogError" @click="openCatalog">
          {{
            auction && auction.number === notice.number
              ? "展开本届目录"
              : "向管事领取目录"
          }}
        </button>
        <p>{{ catalogError }}</p>
        <button
          v-if="
            auction && selected && !auction.closed && game.month < auction.opens
          "
          :disabled="busy || !!reason({ kind: 'wait' })"
          @click="act({ kind: 'wait' })"
        >
          在当地候会 · {{ formatLifeMonths(auction.opens - game.month) }}
        </button>
        <p v-if="auction && game.month < auction.opens">
          候会会推进寿元，遇到剧情或寿尽即停；也可先离开筹资。
        </p>
      </template>
      <template v-if="active === 'catalog'">
        <h3>{{ auction ? `第 ${auction.number} 届拍品目录` : "拍品目录" }}</h3>
        <p v-if="!auction">先到管事处询问本届目录。</p>
        <p v-else-if="game.month >= auction.closes">
          这份目录的会期已过，可询问下一届。
        </p>
        <article v-for="(entry, i) in auction?.lots" :key="i" class="lot-card">
          <ItemArt :id="art(entry.item)" :size="56" />
          <div>
            <h4>{{ lotInfo(entry.item).name }}</h4>
            <p>{{ lotInfo(entry.item).hint }}</p>
            <small
              >起价 {{ entry.opening }} · 每口加 {{ entry.step }} 灵石 ·
              {{ venue === "golden" ? "会馆估价" : "常规来源参考价" }}
              {{ lotInfo(entry.item).price }}</small
            >
            <p>
              {{
                entry.result === "won"
                  ? `已竞得 · ${entry.paid} 灵石`
                  : entry.result === "passed"
                    ? "已放弃"
                    : "候拍"
              }}
            </p>
          </div>
        </article>
      </template>
      <template v-if="active === 'rostrum'">
        <h3>
          {{ auction?.closed ? "本届已散场" : live ? "拍台竞价" : "入席参拍" }}
        </h3>
        <p v-if="!auction || !selected">先到管事处领取或展开本届目录。</p>
        <template v-else-if="!auction.closed">
          <label
            >每口出价上限（灵石）<input
              v-model.number="budget"
              type="number"
              min="0"
              max="1000000000"
          /></label>
          <button
            :disabled="busy || !!reason({ kind: 'budget', value: budget })"
            @click="act({ kind: 'budget', value: budget })"
          >
            设定预算
          </button>
          <p>已设上限 {{ auction.budget }} 灵石。</p>
          <button
            v-if="!live"
            :disabled="busy || !!reason({ kind: 'enter' })"
            @click="act({ kind: 'enter' })"
          >
            入席参拍
          </button>
          <p v-if="!live">{{ reason({ kind: "enter" }) }}</p>
          <template v-if="live && lot">
            <ItemArt :id="art(lot.item)" :size="72" />
            <h4>{{ lotInfo(lot.item).name }}</h4>
            <p>{{ lotInfo(lot.item).hint }}</p>
            <p>
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
            <button
              :disabled="busy || !!reason({ kind: 'pass' })"
              @click="act({ kind: 'pass' })"
            >
              放弃本拍
            </button>
            <p>{{ reason({ kind: "bid" }) }}</p>
          </template>
        </template>
      </template>
      <template v-if="active === 'exit'">
        <h3>厅门</h3>
        <p v-if="live">
          暂时收起界面会保留竞价；正式退出后，本届剩余拍品全部放弃。
        </p>
        <p v-else-if="auction?.closed">
          本届已散场，已得拍品保留；下一届按会期开放。
        </p>
        <p v-else>开场前可离开筹资。再次来访，本届目录不变。</p>
        <button
          v-if="auction && !auction.closed && selected"
          :disabled="busy || !!reason({ kind: 'leave' })"
          @click="act({ kind: 'leave' })"
        >
          正式退出本届 · 保留已得拍品
        </button>
        <button :disabled="busy" @click="live ? (active = '') : emit('close')">
          {{ live ? "暂收面板" : "返回当地场景" }}
        </button>
      </template>
      <p v-if="active" class="auction-receipt" role="status">
        {{ game.treasures.last }}
      </p>
    </NarrativeStage>
  </section>
</template>
<style scoped>
.auction-world {
  height: 100%;
  min-height: 440px;
  width: 100%;
}
.auction-world :deep(.narrative-stage) {
  height: 100%;
  min-height: 440px;
}
.lot-card {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #b4986655;
  padding: 12px 0;
}
.lot-card h4,
.lot-card p {
  margin: 4px 0;
}
.auction-world button {
  padding: 10px 14px;
  margin: 6px 8px 6px 0;
  border: 1px solid #b99e68;
  background: #18372e;
  color: #f1e6ca;
  cursor: pointer;
}
.auction-world button:disabled {
  color: #b5b8ae;
  background: #26332c;
  cursor: default;
}
.auction-world input {
  width: 110px;
  margin-left: 8px;
  padding: 8px;
}
.auction-world p {
  line-height: 1.65;
}
.auction-receipt {
  border-top: 1px solid #b4986655;
  padding-top: 10px;
}
</style>
