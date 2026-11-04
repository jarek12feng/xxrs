<script setup lang="ts">
import { projectInteractions } from "../story-interactions";
import GoldenWorld from "../golden-scene/GoldenWorld.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import { goldenCombat } from "../golden-scene/presentation";

import { goldenCap } from "../conclave/state";
import { realmStageLabel } from "../progression";
import { computed, ref, watch } from "vue";
import { seaObject } from "../scene2d/golden-objects";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
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
const emit = defineEmits<{ act: [intent: Intent]; shore: []; meeting: [] }>();
const o = computed(() => props.game.outerSea);
const options = computed(() => {
  const s = props.game,
    t = o.value;
  const a: { label: string; action: SeaAction }[] = [];
  const add = (label: string, action: SeaAction) => a.push({ label, action });
  if (t.duel) {
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
    return projectInteractions(s, a, seaQuote);
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
      add("先取镇潮印 · 温养后可出战：伤害 +4、护体 +3", {
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
  return projectInteractions(s, a, seaQuote);
});
const send = (action: SeaAction) => emit("act", { type: "outerSea", action });

// The selected object is presentation state; opening it never dispatches a command.
const selected = ref("");
const stageKey = computed(() => `sea-${o.value.location}-${o.value.cleared}`);
const image = computed(() =>
  o.value.location === "ruins"
    ? o.value.cleared
      ? "/art/outer-sea/inner.webp"
      : "/art/outer-sea/ruins.webp"
    : o.value.location === "home"
      ? "/scenes/cloud-frontier.jpg"
      : "/art/outer-sea/ferry.webp",
);
const hotspots = computed(() => {
  if (o.value.duel) return [];
  const ids = new Set<string>(
    options.value.map((row) => seaObject(row.action.kind)),
  );
  if (o.value.location === "ferry") ids.add("friends");
  if (o.value.met && o.value.location !== "ruins") ids.add("chamber");
  if (
    o.value.location === "ferry" &&
    (o.value.notice !== null || o.value.cleared === 2)
  )
    ids.add("letter");
  return [
    {
      id: "letter",
      label: o.value.reminded ? "会谷来信" : "道友之约",
      x: 68,
      y: 70,
    },
    {
      id: "friends",
      label: o.value.met ? "顾沧遥与叶问苓" : "堤边修士",
      x: 49,
      y: 83,
    },
    {
      id: "path",
      label:
        o.value.location === "home"
          ? "外海航路"
          : o.value.location === "ruins"
            ? seaFoe(o.value.cleared ? 2 : 1).name
            : "退潮石道",
      x: 59,
      y: 43,
    },
    { id: "treasure", label: "随身法宝与功法", x: 51, y: 76 },
    { id: "chamber", label: "临海静修处", x: 22, y: 47 },
    {
      id: "exit",
      label: o.value.location === "ruins" ? "回渡石道" : "归山海路",
      x: 16,
      y: 77,
    },
  ].filter((row) => ids.has(row.id));
});
const seaTell = computed(() => {
  const d = o.value.duel;
  if (!d) return "";
  const move = seaFoe(d.depth).pattern[d.turn % 3];
  return move === "guard"
    ? "石臂挟潮横扫，先守住来势。"
    : move === "discern"
      ? "阵眼轮流明灭，先辨灵流。"
      : "石卫回身归位，趁隙反击。";
});
const combat = computed(() => goldenCombat(props.game, "sea"));
const combatOptions = computed(() =>
  options.value
    .filter((row) => row.action.kind === "move")
    .map((row) => ({
      id: row.action.kind === "move" ? row.action.move : "",
      label: row.label.split(" · ")[0]!,
      detail: row.label.split(" · ").slice(1).join(" · "),
      disabled: !row.available,
    })),
);
function move(id: string) {
  const row = options.value.find(
    (row) => row.action.kind === "move" && row.action.move === id,
  );
  if (row && !props.busy && !row.quote.error)
    emit("act", { type: "outerSea", action: row.action });
}
const shown = computed(() =>
  o.value.duel
    ? []
    : options.value.filter(
        (row) => seaObject(row.action.kind) === selected.value,
      ),
);
watch(stageKey, () => {
  selected.value = "";
});
watch(() => o.value.pact, () => { selected.value = ""; });
watch(hotspots, (objects) => {
  if (selected.value && !objects.some((o) => o.id === selected.value))
    selected.value = "";
});
</script>
<template>
  <NarrativeStage
    v-if="
      game.realm === 2 &&
      game.goldenCore.farShore &&
      game.conclave.location === 'away'
    "
    class="outer-sea"
    aria-label="金丹外海行旅"
    :stage-key="stageKey"
    :image="image"
    :title="
      o.location === 'home'
        ? '云壁海路'
        : o.location === 'ferry'
          ? '外海古渡 · 澄渊宗潮堤'
          : o.cleared
            ? '退潮遗迹 · 内府'
            : '退潮遗迹 · 外府'
    "
    :goal="seaGoal(game)"
    :hotspots="hotspots"
    :active="selected"
    :battle="!!o.duel"
    @select="$event === 'letter' ? emit('meeting') : (selected = $event)"
    @close="selected = ''"
  >
    <template #status
      ><span
        >{{ realmStageLabel(game) }} · 修为 {{ o.cultivation }}/{{
          goldenCap(game)
        }}
        · 遗迹 {{ o.cleared }}/2</span
      ></template
    >
    <template #world>
      <GoldenWorld
        :busy="busy"
        :game="game"
        domain="sea"
        :focus="selected"
        @performed="selected = ''"
        @select="selected = $event"
      />
      <CombatBar
        v-if="combat && o.duel"
        :turn="combat.turn"
        :player="combat.player"
        :player-max="combat.playerMax"
        :enemy="combat.enemy"
        :enemy-max="combat.enemyMax"
        :enemy-name="combat.enemyName"
        :tell="seaTell"
        :options="combatOptions"
        :busy="busy"
        retreat-label="收势撤回 · 保留此前进度"
        @move="move"
        @retreat="
          emit('act', { type: 'outerSea', action: { kind: 'withdraw' } })
        "
      />
    </template>

    <p v-if="selected === 'friends'">
      {{
        o.met
          ? "顾沧遥修缮潮堤，叶问苓寻找内府观潮记录。"
          : "堤边有人修补石基，也有人持盘观潮。"
      }}
    </p>
    <p v-if="selected === 'friends' && o.pact !== 'none'">
      {{
        o.pact === "share"
          ? "你答应共享潮图，两宗提供接应，成果用于修堤。"
          : "你独自勘路，保留新支路；观潮卷交还衡璇院。"
      }}
    </p>
    <div v-if="selected === 'treasure'" class="treasures">
      <figure v-if="o.seal">
        <img src="/art/outer-sea/seal.webp" alt="镇潮印" />
        <figcaption>
          镇潮印 · {{ o.attuned ? "已温养；出战后伤害 +4 / 护体 +3" : "待温养" }}
        </figcaption>
      </figure>
      <figure v-if="o.manual">
        <img src="/art/outer-sea/manual.webp" alt="澄息篇" />
        <figcaption>
          澄息篇 ·
          {{
            o.method === "none"
              ? "待参悟"
              : o.method === "clear"
                ? "澄息守势"
                : "续修原法"
          }}
        </figcaption>
      </figure>
      <p>两种运功不叠加，旧功法与研修保留。</p>
    </div>

    <div v-for="option in shown" :key="option.id" class="scene-choice">
      <button
        :disabled="busy || !option.available"
        @click="send(option.action)"
      >
        {{ option.label.split(" · ")[0] }}
      </button>
      <small v-if="option.label.includes(' · ')">{{
        option.label.split(" · ").slice(1).join(" · ")
      }}</small>
      <small
        v-if="option.quote.months || option.quote.stones || option.quote.herbs"
        >{{ option.quote.months }} 月 · 灵石 {{ option.quote.stones }} / 灵草
        {{ option.quote.herbs }}</small
      >
      <small v-if="option.quote.error">{{ option.quote.error }}</small>
    </div>
    <template
      v-if="
        selected === 'chamber' && o.met && o.location !== 'ruins' && !o.duel
      "
    >
      <details class="retreat-plan">
        <summary>安排闭关</summary>
        <CultivationOutlook
          :game="game"
          :busy="busy"
          automatic
          :target="o.cultivation < 60 ? 60 : goldenCap(game)"
          @act="emit('act', $event)"
        />
      </details>
      <button
        v-if="game.injury"
        :disabled="busy || !!actionError(game, 'rest')"
        @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
      >
        静养一月
      </button>
    </template>
    <details v-if="o.last">
      <summary>刚才的经过</summary>
      <p role="status">{{ o.last }}</p>
    </details>
    <template #notes>
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
        {{ realmStageLabel(game) }}修为 {{ o.cultivation }} /
        {{ goldenCap(game) }} · 遗迹已通 {{ o.cleared }} / 2 层
      </p>
      <p v-if="o.seal || o.manual">
        镇潮印：{{
          o.attuned
            ? "已温养；出战后伤害 +4 / 护体 +3"
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
        }}。消息来自交接时的约定，未替你报名；会期到来可循道友来信赴会。
      </p>
      <p v-if="o.last">{{ o.last }}</p>
    </template>
  </NarrativeStage>
</template>
<style scoped>
.outer-sea :deep(.battle-inspector) {
  display: none;
}
.outer-sea :deep(.narrative-inspector:not(.narrative-notes)) {
  top: auto;
  bottom: 24px;
  max-height: 48%;
  height: auto;
  width: min(400px, 35%);
  padding: 16px;
}
.outer-sea.in-combat :deep(.narrative-goal) {
  display: none;
}
@media (max-width: 900px) {
  .outer-sea :deep(.narrative-inspector:not(.narrative-notes)) {
    width: auto;
    max-height: 42%;
  }
}

.shore-friends {
  position: absolute;
  left: 29%;
  bottom: 25%;
  height: 37%;
  display: flex;
  pointer-events: none;
}
.shore-friends img {
  height: 100%;
  width: auto;
  max-width: 16vw;
  object-fit: contain;
  filter: drop-shadow(0 8px 6px #05120ccc);
}
.treasures figure {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
.treasures img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.scene-choice {
  margin: 12px 0;
}
.scene-choice small {
  display: block;
  color: #dfcfaa;
}
button {
  display: block;
  margin: 8px 0;
  max-width: 100%;
  padding: 10px 12px;
  color: #fff2d4;
  background: #283e39;
  border: 1px solid #9fb2a1;
  border-radius: 6px;
  text-align: left;
  white-space: normal;
}
button:disabled {
  opacity: 0.58;
}
button:focus-visible {
  outline: 2px solid #f9d480;
}
</style>
