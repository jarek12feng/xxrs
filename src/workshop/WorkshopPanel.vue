<script setup lang="ts">
import {
  preparationPlan,
  preparationOutcome,
  preparationCompleted,
  type PreparationSelection,
} from "./preparation";
import { formatLifeMonths } from "../progression";
import { equipmentCategoryLabel } from "../equipment";
import { medicineCategoryLabel } from "../medicines";
import GrowthPreview from "../GrowthPreview.vue";
import { computed, ref, nextTick } from "vue";
import type { State, Intent } from "../core";
import ItemArt from "../presentation/ItemArt.vue";
import { products, type Product, type Method } from "./catalog";
import { tempers, temperInfo, type Temper } from "./state";
import { workshopQuote, workshopLock, type WorkshopOrder } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const selection = defineModel<PreparationSelection | null>("selection", {
  default: null,
});
const selectedOrder = computed(() => selection.value?.order ?? null);
const preparationPanel = ref<HTMLElement | null>(null);
const planComplete = computed(
  () => !!selection.value && preparationCompleted(props.game, selection.value),
);
async function selectPlan(order: WorkshopOrder) {
  selection.value = { order, outcome: preparationOutcome(props.game, order) };
  await nextTick();
  preparationPanel.value?.focus({ preventScroll: true });
  preparationPanel.value?.scrollIntoView({ block: "nearest" });
}
const preparation = computed(() =>
  selectedOrder.value ? preparationPlan(props.game, selectedOrder.value) : null,
);
const category = ref<"medicine" | "relic">(
  props.game.journey.relics.sword || props.game.journey.relics.vial
    ? "relic"
    : "medicine",
);
const methods: Record<Method, string> = {
  craft: "自行炼制",
  buy: "购买成品",
  commission: "委托加工",
};
const cards = computed(() => {
  const ids: Product[] =
    category.value === "medicine"
      ? ["healing", "clarity", "ward", "foundation"]
      : ["sword", "vial", "iron"];
  return ids.map((product) => ({
    product,
    ...products[product],
    purpose:
      product === "sword" || product === "vial"
        ? equipmentCategoryLabel(product)
        : product === "iron"
          ? "材料"
          : medicineCategoryLabel(product),
    choices: (product === "iron"
      ? (["buy"] as const)
      : product === "foundation"
        ? (["craft", "commission"] as const)
        : (["craft", "buy", "commission"] as const)
    ).map((method) => ({
      order: { product, method } as WorkshopOrder,
      method,
      ...workshopQuote(props.game, { product, method }),
    })),
  }));
});
const engravings = computed(() =>
  (["sword", "vial"] as const).map((relic) => ({
    relic,
    name: products[relic].name,
    current: temperInfo(props.game.workshop, relic).name,
    options: Object.entries(tempers[relic]).map(([temper, info]) => ({
      ...info,
      temper: temper as Temper,
      choices: (["craft", "commission"] as const).map((method) => ({
        method,
        order: { relic, temper: temper as Temper, method } as WorkshopOrder,
        ...workshopQuote(props.game, {
          relic,
          temper: temper as Temper,
          method,
        }),
      })),
    })),
  })),
);
const lock = computed(() => workshopLock(props.game));
function order(o: WorkshopOrder) {
  emit("act", { type: "workshop", order: o });
}
</script>
<template>
  <section class="workshop" aria-label="丹药与法器准备">
    <h3>丹药与法器准备</h3>
    <p>
      灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 玄铁料
      {{ game.workshop.iron }} · 护脉丹 {{ game.workshop.ward }}
    </p>
    <p>
      自制省工钱，需要研读与开炉时间；成品即时交付；委托加工不要求心得，但仍需材料与工期。筑基丹须先取得遗府丹方。
    </p>
    <p class="muted">
      开炉期间若遇来信、约定或寿尽，将中断筹备，不扣材料、不发成品；处理后可重新安排。不会自动替你选择。
    </p>
    <section
      v-if="preparation"
      ref="preparationPanel"
      tabindex="-1"
      class="workshop-card"
      aria-label="当前筹备方案"
    >
      <h4>
        {{ methods[selectedOrder!.method] }} · {{ preparation.quote.name }}
      </h4>
      <template v-if="planComplete">
        <p>本次筹备已完成，可在下方查看物品与装配选项。</p>
        <button :disabled="busy" @click="selectPlan(selectedOrder!)">
          再筹备一份
        </button>
      </template>
      <template v-else>
        <p>
          {{ preparation.quote.cost }} ·
          {{
            preparation.quote.months
              ? formatLifeMonths(preparation.quote.months)
              : "不耗月份"
          }}
        </p>
        <p>{{ preparation.quote.effect }}</p>
        <p>
          尚缺：灵石 {{ preparation.deficits.stones }} · 灵草
          {{ preparation.deficits.herbs }} · 玄铁料
          {{ preparation.deficits.iron }} · 心得
          {{ preparation.deficits.study }}
        </p>
        <div v-for="purchase in preparation.purchases" :key="purchase.label">
          <button
            :disabled="busy || !!purchase.error"
            @click="emit('act', purchase.intent)"
          >
            {{ purchase.label }}
          </button>
          <small v-if="purchase.error">{{ purchase.error }}</small>
        </div>
        <div v-for="step in preparation.steps" :key="step.label">
          <button
            :disabled="busy || !!step.error"
            @click="emit('act', step.intent)"
          >
            {{ step.label }} · 最多{{ formatLifeMonths(step.months) }} · 预计
            +{{ step.gain }}
          </button>
          <small v-if="step.error">{{ step.error }}</small>
        </div>
        <p class="muted">
          按现有收益估算，每次最多十二月；事件、约期、寿尽或修行上限可能提前停止。每项由你分别决定，不自动开炉或购买。
        </p>
        <button
          :disabled="busy || !!preparation.quote.error"
          @click="order(selectedOrder!)"
        >
          按所选方案制作或购买
        </button>
        <small v-if="preparation.quote.error">{{
          preparation.quote.error
        }}</small>
      </template>
      <button @click="selection = null">收起筹备</button>
    </section>
    <nav class="panel-tabs" aria-label="制作分类">
      <button
        :aria-pressed="category === 'medicine'"
        @click="category = 'medicine'"
      >
        丹药
      </button>
      <button :aria-pressed="category === 'relic'" @click="category = 'relic'">
        法器与刻纹
      </button>
    </nav>
    <article v-for="card in cards" :key="card.product" class="workshop-card">
      <h4>
        <ItemArt
          :id="card.product === 'foundation' ? 'pills' : card.product"
        />{{ card.name }}
      </h4>
      <p class="muted">{{ card.purpose }}</p>
      <p>{{ card.hint }}</p>
      <p v-if="card.product === 'sword' || card.product === 'vial'">
        现有 {{ game.journey.relics[card.product] }} 阶 ·
        {{
          game.journey.equipped === card.product ? "已装配" : "未装配"
        }}。基础炼制费用包含普通器胚与炉火，灵草用于温养灵路。
      </p>
      <GrowthPreview
        v-if="card.product === 'sword' || card.product === 'vial'"
        :game="game"
        :request="{ kind: 'refine', id: card.product }"
        compact
      />
      <div class="workshop-options">
        <div v-for="choice in card.choices" :key="choice.method">
          <button
            :disabled="busy || !!choice.error"
            @click="order(choice.order)"
          >
            {{
              (card.product === "sword" || card.product === "vial") &&
              game.journey.relics[card.product] &&
              choice.method !== "buy"
                ? choice.method === "craft"
                  ? "自行精炼"
                  : "委托精炼"
                : methods[choice.method]
            }}{{ card.name }}
          </button>
          <p>
            {{ choice.cost }} ·
            {{ choice.months ? `${choice.months} 个月` : "不耗月份"
            }}<span v-if="choice.study"> · 心得 {{ choice.study }}</span>
          </p>
          <small v-if="choice.error">{{ choice.error }}</small>
          <button :disabled="busy" @click="selectPlan(choice.order)">
            查看筹备缺口
          </button>
        </div>
      </div>
      <GrowthPreview
        v-if="
          (card.product === 'sword' || card.product === 'vial') &&
          game.journey.relics[card.product] &&
          game.journey.equipped !== card.product
        "
        :game="game"
        :request="{ kind: 'relic', id: card.product }"
        compact
      />
      <button
        v-if="card.product === 'sword' || card.product === 'vial'"
        :disabled="
          busy ||
          !!lock ||
          !game.journey.relics[card.product] ||
          game.journey.equipped === card.product
        "
        @click="emit('act', { type: 'equipRelic', relic: card.product })"
      >
        {{ game.journey.equipped === card.product ? "已装配" : "装配灵器 · "
        }}{{ card.name }}
      </button>
    </article>
    <template v-if="category === 'relic'">
      <p>
        筑基后可刻纹，一器仅留一种；重铸或恢复原纹同样付费。器纹只在回合交锋中生效。
      </p>
      <details
        v-for="item in engravings"
        :key="item.relic"
        class="workshop-card"
      >
        <summary>{{ item.name }} · 当前{{ item.current }} · 刻纹与重铸</summary>
        <article v-for="option in item.options" :key="option.name">
          <h4>{{ option.name }}</h4>
          <p>{{ option.hint }}</p>
          <GrowthPreview
            :game="game"
            :request="{ kind: 'temper', id: item.relic, temper: option.temper }"
            compact
          />
          <div class="workshop-options">
            <div v-for="choice in option.choices" :key="choice.method">
              <button
                :disabled="busy || !!choice.error"
                @click="order(choice.order)"
              >
                {{ choice.method === "craft" ? "自行刻纹" : "请匠师刻纹" }} ·
                {{ option.name }}
              </button>
              <p>
                {{ choice.cost }} · {{ choice.months }} 月<span
                  v-if="choice.study"
                >
                  · 心得 {{ choice.study }}</span
                >
              </p>
              <small v-if="choice.error">{{ choice.error }}</small>
              <button :disabled="busy" @click="selectPlan(choice.order)">
                查看筹备缺口
              </button>
            </div>
          </div>
        </article>
      </details>
    </template>
    <button
      :disabled="busy || !!lock || game.stones < 8"
      @click="emit('act', { type: 'supplies' })"
    >
      坊市购草 · 灵石 8 换灵草 4
    </button>
    <p>缺灵石可回洞府劳作，或接山下委托、师门差事；无需学会所有制作方式。</p>
  </section>
</template>
<style scoped>
.workshop {
  min-width: 0;
}
.workshop-card {
  padding: 1rem 0;
  border-bottom: 1px solid var(--line, #706249);
}
.workshop-card h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.workshop-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 185px), 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.workshop-options button {
  width: 100%;
  min-height: 44px;
  white-space: normal;
}
.workshop-options p {
  margin: 0.4rem 0;
}
.workshop-options small {
  display: block;
}
.workshop button:disabled {
  opacity: 0.75;
}
</style>
