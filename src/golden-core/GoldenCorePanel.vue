<script setup lang="ts">
import GoldenStoryScene from "../golden-story/GoldenStoryScene.vue";
const storyOpen = ref(false);
import CloudCrossing from "./CloudCrossing.vue";
import { projectInteractions } from "../story-interactions";
import { computed, ref, watch } from "vue";
import { goldenObject } from "../scene2d/golden-objects";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import { formatLifeMonths } from "../progression";
import type { State, Intent } from "../core";
import {
  goldenGoal,
  goldenQuote,
  goldenChance,
  goldenExchange,
  goldenTells,
  type GoldenAction,
} from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const g = computed(() => props.game.goldenCore);
const visible = computed(
  () =>
    props.game.status === "alive" &&
    props.game.realm >= 1 &&
    props.game.foundationJourney.cultivation >= 200,
);
const exitAge = computed(
  () => props.game.age + goldenQuote(props.game, { kind: "break" }).months,
);
const exitLife = computed(() => Math.max(0, props.game.limit - exitAge.value));
const goal = computed(() => goldenGoal(props.game));
const options = computed(() => {
  const s = props.game,
    t = g.value;
  const choices: { label: string; action: GoldenAction }[] = [];
  const add = (label: string, action: GoldenAction) =>
    choices.push({ label, action });
  if (s.realm === 2) {
    if (!t.farShore) add("以丹元护体，独自越过云壁", { kind: "farShore" });
  } else if (t.duel) {
    for (const [move, label] of [
      ["guard", "守势"],
      ["discern", "辨影"],
      ["strike", "反击"],
    ] as const) {
      const p = goldenExchange(s, move)!;
      add(
        `${label} · 破阵 ${p.damage} / 承伤 ${p.incoming}${p.herbs ? ` / 耗草 ${p.herbs} 回气 ${p.healing}` : ""}`,
        { kind: "move", move },
      );
    }
    add("撤回归山 · 不新增伤势", { kind: "withdraw" });
  } else if (t.expedition !== "idle") {
    if (t.expedition === "prepared") {
      add("与柳知微合力 · 各取一份主药，石偶较易应对", {
        kind: "route",
        route: "share",
      });
      add("另寻药床独行 · 石偶更强，首通另得灵石 24、清心丹 1", {
        kind: "route",
        route: "alone",
      });
    }
    if (t.expedition === "path")
      add("应对守药石偶 · 看清来势再动手", { kind: "fight" });
    if (t.expedition === "won") add("采下凝露芝心，归山炼丹", { kind: "take" });
    add("沿原路撤回 · 行装不退还", { kind: "withdraw" });
  } else {
    if (t.champion === "pending") {
      add("魁首培养：领取一次凝丹灵地使用", {
        kind: "champion",
        reward: "haven",
      });
      add("魁首培养：请长老护持一次凝丹", {
        kind: "champion",
        reward: "guard",
      });
    }
    if (!t.medicine && !t.pills)
      add("整备行装，赴凝露药圃取结丹主药", { kind: "prepare" });
    if (t.medicine && !t.pills) {
      add("自行合药 · 需心得 2，研读可备", { kind: "brew", method: "self" });
      add("委托丹师炼制", { kind: "brew", method: "commission" });
    }
    if (t.site === "none") {
      add("租用凝丹静室 · 灵气充足，把握 +12", {
        kind: "site",
        site: "rented",
      });
      add("修复旧灵穴 · 需神识 8，把握 +8", { kind: "site", site: "repaired" });
      if (t.havenCredit)
        add("使用师门所赠静室 · 把握 +12", { kind: "site", site: "sect" });
    }
    if (!t.guard)
      add(
        t.guardCredit
          ? "请长老兑现护持 · 把握 +15"
          : "备护脉阵请人守关 · 把握 +15",
        { kind: "guard" },
      );
    add(`凝丹行功 · 直接叩关把握 ${goldenChance(s)}%，稳住三段可至100%`, {
      kind: "break",
    });
  }
  return projectInteractions(s, choices, goldenQuote);
});
const send = (action: GoldenAction) =>
  emit(
    "act",
    action.kind === "break"
      ? { type: "ascension", action: "start" }
      : { type: "goldenCore", action },
  );

// The selected object is presentation state; opening it never dispatches a command.
const selected = ref("");
const stageKey = computed(() => gameScene.value);
const gameScene = computed(() =>
  props.game.realm === 2
    ? "cloud"
    : g.value.expedition !== "idle"
      ? "garden"
      : "home",
);
const hotspots = computed(() => {
  const ids = new Set<string>(
    options.value.map((o) => goldenObject(o.action.kind)),
  );
  if (gameScene.value === "home") ids.add("chamber");
  return [
    {
      id: "path",
      label:
        gameScene.value === "cloud"
          ? "云壁"
          : gameScene.value === "garden"
            ? g.value.expedition === "won"
              ? "凝露芝心"
              : g.value.expedition === "prepared"
                ? "柳知微与药床"
                : "守药石偶"
            : "凝露药圃山路",
      x: 54,
      y: 43,
    },
    { id: "furnace", label: "合药炉", x: 27, y: 60 },
    {
      id: "elder", kind: "person" as const,
      label: g.value.champion === "pending" ? "师门传讯" : "护关阵台",
      x: 40,
      y: 62,
    },
    { id: "chamber", label: "凝丹静室", x: 64, y: 58 },
    { id: "exit", label: "归山小径", x: 18, y: 78 },
  ].filter((o) => ids.has(o.id));
});
const shown = computed(() =>
  g.value.duel
    ? options.value
    : options.value.filter(
        (o) => goldenObject(o.action.kind) === selected.value,
      ),
);
watch(stageKey, () => {
  selected.value = "";
});
watch(hotspots, (objects) => {
  if (selected.value && !objects.some((o) => o.id === selected.value))
    selected.value = "";
});
</script>
<template>
  <GoldenStoryScene
    v-if="storyOpen"
    :game="game"
    :busy="busy"
    place="home"
    @act="emit('act', $event)"
    @close="storyOpen = false"
  />
  <NarrativeStage
    v-if="visible && !storyOpen"
    class="golden-core"
    aria-label="凝丹机缘与金丹初行"
    :stage-key="stageKey"
    :image="
      gameScene === 'cloud'
        ? '/scenes/cloud-frontier.jpg'
        : gameScene === 'garden'
          ? '/scenes/mist-herb-garden.jpg'
          : '/scenes/moon-terrace.png'
    "
    :title="
      game.realm === 2
        ? '金丹初成 · 云壁之外'
        : gameScene === 'garden'
          ? '凝露药圃'
          : '听松行前居 · 凝丹筹备'
    "
    :goal="goal"
    :hotspots="
      game.realm === 2 && !g.duel
        ? [
            ...hotspots,
            { id: 'golden-story', label: '问路与旧友来信', x: 82, y: 58 },
          ]
        : hotspots
    "
    :active="selected"
    :battle="!!g.duel"
    @select="
      $event === 'golden-story' ? (storyOpen = true) : (selected = $event)
    "
    @close="selected = ''"
  >
    <template #world
      ><CloudCrossing v-if="!storyOpen && game.realm === 2" :game="game"
    /></template>
    <template #status
      ><span v-if="game.realm === 1"
        >主药 {{ g.medicine }} · 丹药 {{ g.pills }} · 灵地{{
          g.site === "none" ? "未备" : "已备"
        }}
        · 护持{{ g.guard ? "已备" : "未备" }}</span
      ></template
    >
    <h3>
      {{ g.duel ? "守药石偶" : hotspots.find((o) => o.id === selected)?.label }}
    </h3>
    <p v-if="g.duel" role="status">
      第 {{ g.duel.turn + 1 }} 合 / 最多 16 合 · 你的气势 {{ g.duel.hp }} ·
      石偶气势 {{ g.duel.enemy }}<br />{{ goldenTells[g.duel.turn % 3] }}
    </p>
    <template v-if="selected === 'chamber' && game.realm === 1 && !g.duel">
      <p>
        筑基修行 {{ game.foundationJourney.cultivation }}/600 ·
        {{
          game.foundationJourney.epilogue
            ? "本境考验与归山已完成"
            : "还需完成稳脉、贯流、长风归流与归山"
        }}
      </p>
      <p>
        预计出关年龄 {{ formatLifeMonths(exitAge) }}；按突破前寿限，届时余寿
        {{ formatLifeMonths(exitLife) }}。成功后寿限再增三百年。
      </p>
      <p>
        每次叩关消耗凝丹丹药 1 枚、六个月及已备护持。失败伤势
        +2，保留灵地、功法与筑基成果；可重新取药再试。
      </p>
    </template>
    <p v-if="selected === 'path' && g.expedition !== 'idle' && !g.duel">
      取药必过守药石偶。探索途中可撤回；不能在阵中开炉、换装或接其他行程。
    </p>
    <div v-for="o in shown" :key="o.id" class="scene-choice">
      <button :disabled="busy || !o.available" @click="send(o.action)">
        {{ o.label.split(" · ")[0] }}
      </button>
      <small v-if="o.label.includes(' · ')">{{
        o.label.split(" · ").slice(1).join(" · ")
      }}</small>
      <small
        v-if="o.quote.months || o.quote.stones || o.quote.herbs || o.quote.ward"
        >{{ formatLifeMonths(o.quote.months) }} · 灵石 {{ o.quote.stones }} /
        灵草 {{ o.quote.herbs }} / 护脉丹 {{ o.quote.ward }}</small
      >
      <small v-if="o.quote.error">{{ o.quote.error }}</small>
    </div>
    <template v-if="selected === 'chamber' && g.expedition === 'idle'">
      <button
        v-if="game.realm === 1 && game.foundationJourney.location !== 'home'"
        :disabled="busy"
        @click="
          emit('act', {
            type: 'foundationJourney',
            action: { kind: 'travel', destination: 'home' },
          })
        "
      >
        回听松行前居筹备
      </button>
      <button
        v-if="game.injury"
        :disabled="busy"
        @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
      >
        静养一月 · 不耗灵石
      </button>
      <button
        v-if="game.realm === 1"
        :disabled="busy"
        @click="emit('act', { type: 'advance', activity: 'work', months: 6 })"
      >
        劳作六个月筹资
      </button>
    </template>
    <details v-if="g.last">
      <summary>刚才的经过</summary>
      <p role="status">{{ g.last }}</p>
    </details>
    <template #notes>
      <p>
        宗门内比两胜固定授一份主药；散修、失利或错过会期者，可在筑基后期赴药圃。主药用途相同，也可先参赛再转路。
      </p>
      <p>
        重复取药不再发首通额外物资。修复灵穴较慢但便宜，可用额外护持补足把握。
      </p>
      <p v-if="g.last">{{ g.last }}</p>
    </template>
  </NarrativeStage>
</template>
<style scoped>
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
