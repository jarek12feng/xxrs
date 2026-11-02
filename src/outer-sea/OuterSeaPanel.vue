<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { actionError } from "../core";
import {
  seaQuote,
  seaGoal,
  seaExchange,
  seaFoe,
  type SeaAction,
} from "./rules";
import CultivationOutlook from "../CultivationOutlook.vue";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const o = computed(() => props.game.outerSea);
const options = computed(() => {
  const s = props.game,
    t = o.value;
  const a: { label: string; action: SeaAction }[] = [];
  const add = (label: string, action: SeaAction) => a.push({ label, action });
  if (t.duel) {
    const foe = seaFoe(t.duel.depth);
    for (const [move, name] of [
      ["discern", "辨影"],
      ["guard", "守势"],
      ["strike", "反击"],
    ] as const) {
      const p = seaExchange(s, move)!;
      add(
        `${name} · 伤害 ${p.damage} / 承伤 ${p.incoming}${p.herbs ? ` / 灵草 ${p.herbs}` : ""}`,
        { kind: "move", move },
      );
    }
    add("撤回古渡 · 不新增伤势", { kind: "withdraw" });
    return a.map((x) => ({ ...x, quote: seaQuote(s, x.action) }));
  }
  if (t.location === "home") add("循海路前往外海古渡", { kind: "sail" });
  if (t.location === "ferry") {
    if (!t.met) add("与修堤者和观潮阵修交谈", { kind: "meet" });
    else if (t.pact === "none") {
      add("共享潮图 · 接应气势 +12，行装较省", { kind: "pact", pact: "share" });
      add("独自勘路 · 外府首通额外灵石 24", { kind: "pact", pact: "private" });
    }
    if (t.pact !== "none" && t.cleared < 2) {
      if (!t.prepared) add("筹备避潮行装", { kind: "prepare" });
      else
        add(t.cleared ? "重返遗迹，探入内府" : "踏上退潮石道", {
          kind: "enter",
        });
    }
    if (t.cleared && t.reward === "none") {
      add("先取镇潮印 · 温养后伤害 +4、护体 +3", {
        kind: "reward",
        reward: "seal",
      });
      add("先取澄息篇 · 参悟两种运功方式", {
        kind: "reward",
        reward: "manual",
      });
    }
    if (t.reward !== "none" && t.notice === null)
      add("交接潮图，与道友说起日后相逢", { kind: "report" });
    add("回山整备与探望故人", { kind: "home" });
  }
  if (t.location === "ruins") {
    add(t.cleared ? "应对内府守枢石卫 · 金丹前期" : "应对镇潮石卫 · 金丹前期", {
      kind: "fight",
    });
    add("沿石道退回古渡", { kind: "return" });
  } else {
    if (t.seal && !t.attuned) add("温养镇潮印 · 半年", { kind: "attune" });
    if (t.manual) {
      if (t.method !== "continue")
        add("以澄息篇续修原法 · 伤害 +3，保留主修招式", {
          kind: "method",
          method: "continue",
        });
      if (t.method !== "clear")
        add("改运澄息法 · 护体 +4，暂收原主修招式", {
          kind: "method",
          method: "clear",
        });
    }
  }
  return a.map((x) => ({ ...x, quote: seaQuote(s, x.action) }));
});
const send = (action: SeaAction) => emit("act", { type: "outerSea", action });
</script>
<template>
  <section
    v-if="game.realm === 2 && game.goldenCore.farShore"
    class="outer-sea"
    aria-label="金丹外海行旅"
  >
    <img
      class="scene"
      :src="
        o.location === 'ruins'
          ? o.cleared
            ? '/art/outer-sea/inner.webp'
            : '/art/outer-sea/ruins.webp'
          : '/art/outer-sea/ferry.webp'
      "
      :alt="
        o.location === 'ruins'
          ? '退潮露出的中式遗迹与石道'
          : '青玄界外海古渡与远岸岛屿'
      "
      loading="lazy"
    />
    <h3>
      {{
        o.location === "home"
          ? "海路已明，准备远行"
          : o.location === "ferry"
            ? "外海古渡 · 澄渊宗潮堤"
            : o.cleared
              ? "退潮遗迹 · 内府"
              : "退潮遗迹 · 外府"
      }}
    </h3>
    <p>{{ seaGoal(game) }}</p>
    <p v-if="o.last" role="status">{{ o.last }}</p>
    <div
      v-if="o.met && o.location === 'ferry'"
      class="people"
      aria-label="古渡的两位道友"
    >
      <figure>
        <img
          src="/art/outer-sea/gu-cangyao.webp"
          alt="顾沧遥，深青衣袍，携探潮铜铃"
          loading="lazy"
        />
        <figcaption>
          顾沧遥 · 澄渊宗<br /><small>{{
            o.cleared === 2 && o.pact === "share"
              ? "循共享潮图修复潮堤"
              : "为古渡药船修缮潮堤"
          }}</small>
        </figcaption>
      </figure>
      <figure>
        <img
          src="/art/outer-sea/ye-wenling.webp"
          alt="叶问苓，赭色衣袍，持观潮阵盘"
          loading="lazy"
        />
        <figcaption>
          叶问苓 · 衡璇院<br /><small>{{
            o.cleared === 2 ? "已取回观潮卷，继续校勘" : "寻找内府观潮记录"
          }}</small>
        </figcaption>
      </figure>
    </div>
    <div
      v-if="o.seal || o.manual"
      class="treasure-art"
      aria-label="已取得的外海机缘"
    >
      <figure v-if="o.seal">
        <img
          src="/art/outer-sea/seal.webp"
          alt="青铜方印形制的下品法宝镇潮印"
          loading="lazy"
        />
        <figcaption>镇潮印 · 下品法宝</figcaption>
      </figure>
      <figure v-if="o.manual">
        <img
          src="/art/outer-sea/manual.webp"
          alt="澄息篇青色线装册与玉简"
          loading="lazy"
        />
        <figcaption>澄息篇 · 金丹运功法</figcaption>
      </figure>
    </div>
    <details v-if="o.met">
      <summary>同行者与分取之约</summary>
      <p>
        顾沧遥 · 澄渊宗金丹修士，修复古渡潮堤；叶问苓 ·
        衡璇院金丹阵修，校勘宗门观潮阵图。
      </p>
      <p>
        {{
          o.pact === "share"
            ? "你答应共享潮图，两宗提供接应；后续成果会用于修堤。"
            : o.pact === "private"
              ? "你独自勘路，保留新支路；原有观潮卷交还衡璇院。"
              : "分取尚未约定，可以先听清条件再决定。"
        }}
      </p>
    </details>
    <p v-if="o.met">
      金丹前期修为 {{ o.cultivation }} / 299 · 遗迹已通 {{ o.cleared }} / 2 层
    </p>
    <p v-if="o.seal || o.manual">
      镇潮印：{{
        o.attuned
          ? "已温养，伤害 +4 / 护体 +3"
          : o.seal
            ? "已取得，待温养"
            : "尚未取得"
      }}。澄息篇：{{
        o.method === "continue"
          ? "续修原法"
          : o.method === "clear"
            ? "澄息守势"
            : o.manual
              ? "已取得，待参悟"
              : "尚未取得"
      }}。两种运功不叠加，旧功法与研修不丢失。
    </p>
    <p v-if="o.notice !== null">
      诸宗会：修行 {{ Math.floor((o.notice + 600) / 12) }} 年
      {{ (o.notice + 600) % 12 }} 月 ·
      {{
        o.reminded
          ? "会期已至"
          : `尚余 ${Math.max(0, o.notice + 600 - game.month)} 月`
      }}。消息来自交接时的约定，未替你报名；本次版本尚未开放比赛。
    </p>
    <p v-if="o.duel">
      {{ seaFoe(o.duel.depth).name }} · 金丹前期 · 第
      {{ o.duel.turn + 1 }} 合<br />你的气势 {{ o.duel.hp }} / 石卫气势
      {{ o.duel.enemy }}<br />{{
        seaFoe(o.duel.depth).pattern[o.duel.turn % 3] === "guard"
          ? "石臂挟潮横扫，先守住来势。"
          : seaFoe(o.duel.depth).pattern[o.duel.turn % 3] === "discern"
            ? "阵眼轮流明灭，先辨灵流。"
            : "石卫回身归位，趁隙反击。"
      }}
    </p>
    <div v-for="option in options" :key="option.label" class="choice">
      <button
        :disabled="busy || !!option.quote.error"
        @click="send(option.action)"
      >
        {{ option.label
        }}<small v-if="option.quote.months"
          >{{ option.quote.months }} 月 · 灵石 {{ option.quote.stones }} / 灵草
          {{ option.quote.herbs }}</small
        ></button
      ><small v-if="option.quote.error">{{ option.quote.error }}</small>
    </div>
    <template v-if="o.met && o.location !== 'ruins'">
      <CultivationOutlook
        :game="game"
        :busy="busy"
        automatic
        :target="o.cultivation < 60 ? 60 : 299"
        @act="emit('act', $event)"
      />
      <button
        v-if="game.injury"
        :disabled="busy || !!actionError(game, 'rest')"
        @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
      >
        静养一月
      </button>
    </template>
  </section>
</template>
<style scoped>
.outer-sea {
  margin: 16px 0;
  padding: 18px;
  background: #182e32;
  color: #f7edd8;
  border: 1px solid #8da9a1;
  border-radius: 10px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  display: flow-root;
}
.scene {
  float: right;
  width: min(43%, 480px);
  aspect-ratio: 16/9;
  object-fit: contain;
  margin: 0 0 12px 18px;
  border-radius: 8px;
}
.people {
  clear: both;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 8px;
}
.people figure,
.treasure-art figure {
  margin: 0;
  text-align: center;
  background: #203b3e;
  border-radius: 8px;
  padding: 8px;
}
.people img {
  height: 144px;
  max-width: 100%;
  object-fit: contain;
}
.people small {
  font-size: 12px;
  color: #ddd1b8;
}
.treasure-art {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.treasure-art img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.treasure-art figcaption {
  font-size: 12px;
}
.choice {
  margin: 12px 0;
}
.choice small {
  display: block;
}
.outer-sea button {
  background: #2b4849;
  color: #fff2d4;
  border: 1px solid #9cb5a8;
  border-radius: 6px;
  padding: 9px 12px;
  max-width: 100%;
  white-space: normal;
  text-align: left;
}
.outer-sea button:disabled {
  background: #303c3c;
  color: #c3ccc5;
}
.outer-sea button:focus-visible {
  outline: 2px solid #f9d480;
}
.choice > small {
  color: #dfcfaa;
}
@media (max-width: 600px) {
  .outer-sea {
    padding: 12px;
  }
  .scene {
    float: none;
    width: 100%;
    margin: 0;
  }
  .outer-sea button {
    width: 100%;
  }
}
</style>
