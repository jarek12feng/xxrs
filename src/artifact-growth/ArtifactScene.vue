<script setup lang="ts">
import { computed, ref } from "vue";
import type { State, Intent } from "../world";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import ItemArt from "../presentation/ItemArt.vue";
import { characterArt, heroArt } from "../presentation/art";
import { readiness } from "../combat/game";
import { moves, type Move } from "../combat";
import {
  artifactQuote,
  artifactExchange,
  artifactEnemy,
  type ArtifactAction,
} from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const selected = ref("forge");
const p = computed(() => props.game.itemGrowth.golden);
const rows = computed(() => {
  const list: { label: string; action: ArtifactAction }[] = [];
  if (!p.value.heard)
    list.push({ label: "翻阅旧器谱 · 听闻潮纹剑胚", action: { kind: "hear" } });
  else if (p.value.blade === "none")
    list.push(
      {
        label: "自行定潮 · 有效神识28",
        action: { kind: "claim", preparation: "sense" },
      },
      {
        label: "备药护神 · 灵草6",
        action: { kind: "claim", preparation: "herbs" },
      },
    );
  else if (p.value.blade === "embryo")
    list.push({
      label: "温养潮纹剑胚 · 有效神识24",
      action: { kind: "attune" },
    });
  else if (!p.value.proven)
    list.push({
      label: "赴试罡石台 · 验证蓄势破罡",
      action: { kind: "prove" },
    });
  if (!p.value.seal)
    list.push({
      label: "循内府潮图续炼镇潮印",
      action: { kind: "cultivate", artifact: "tideSeal" },
    });
  if (!p.value.pearl)
    list.push({
      label: "依归潮拓本续炼定神珠",
      action: { kind: "cultivate", artifact: "spiritPearl" },
    });
  return list.map((row) => ({
    ...row,
    quote: artifactQuote(props.game, row.action),
  }));
});
const options = computed(() =>
  Object.entries(moves).map(([move, label]) => {
    const v = artifactExchange(props.game, move as Move);
    return {
      id: move,
      label,
      detail: v
        ? `伤敌${v.damage} / 承伤${v.incoming} / 回气${v.healing} / 灵草${v.herbs}`
        : "",
      disabled: !!artifactQuote(props.game, {
        kind: "move",
        move: move as Move,
      }).error,
    };
  }),
);
function act(action: ArtifactAction) {
  if (!props.busy && !artifactQuote(props.game, action).error)
    emit("act", { type: "artifactGrowth", action });
}
function move(id: string) {
  if (id in moves) act({ kind: "move", move: id as Move });
}
</script>
<template>
  <NarrativeStage
    title="药船器谱 · 潮纹旧器"
    image="/art/outer-sea/inner.webp"
    stage-key="golden-artifact"
    :goal="
      p.duel
        ? '罡衣合时先辨影；潮纹剑可守后反击破罡。十八合为限，败退伤势+1，可恢复重试。'
        : p.proven
          ? '试罡已成。按神识容量选择剑、印、珠，带入下一程。'
          : '器胚在离照可选侧路；主药与器物分开争取，不取也可凝婴。'
    "
    :hotspots="
      p.duel
        ? []
        : [
            { id: 'forge', label: '旧器谱与温养台', x: 65, y: 53 },
            { id: 'exit', label: '返回药船', x: 18, y: 68 },
          ]
    "
    :active="selected"
    :battle="!!p.duel"
    @select="(id) => (id === 'exit' ? emit('close') : (selected = id))"
    @close="selected = ''"
  >
    <template #world>
      <img
        class="artifact-hero"
        :src="heroArt(game.social.gender, game.realm)"
        :alt="game.name"
      />
      <img
        v-if="p.duel"
        class="artifact-foe"
        :src="characterArt('golem', 'idle')"
        :alt="artifactEnemy(game).name"
      />
      <CombatBar
        v-if="p.duel"
        :turn="p.duel.turn"
        :player="p.duel.hp"
        :player-max="readiness(game).hp"
        :enemy="p.duel.enemy"
        :enemy-max="artifactEnemy(game).hp"
        :enemy-name="artifactEnemy(game).name"
        :options="options"
        :busy="busy"
        :tell="
          [
            '傀儡抬臂压潮，守势可卸力。',
            '罡衣换息，反击可击中器枢。',
            '潮影交叠，辨影可找到下一合的罡隙。',
          ][p.duel.turn % 3]
        "
        retreat-label="撤回药船 · 不新增伤势"
        @move="move"
        @retreat="act({ kind: 'withdraw' })"
      >
        <template #preparation
          ><p>{{ p.last }}</p>
          <p v-for="option in options" :key="option.id">
            {{ option.label }}：{{
              artifactExchange(game, option.id as Move)?.note
            }}
          </p></template
        >
      </CombatBar>
    </template>
    <template #status
      ><span
        >{{
          p.blade === "none"
            ? "尚未取得剑胚"
            : p.blade === "embryo"
              ? "潮纹剑胚 · 待温养"
              : "潮纹剑 · 已温养"
        }}
        · {{ p.proven ? "试罡已成" : "尚待试罡" }}</span
      ></template
    >
    <template v-if="!p.duel">
      <ItemArt
        v-if="p.blade !== 'none'"
        :id="p.blade === 'embryo' ? 'tide-embryo' : 'tideBlade'"
        :size="96"
      />
      <p>
        {{
          p.last ||
          "药船修士收着一页残旧器谱。潮纹剑胚尚封在离照石道旁，须亲自应对守匣傀儡。"
        }}
      </p>
      <p>
        潮纹剑占御器10：基础伤害+3；守势或辨影后正确反击伤害+10、承伤+2，连攻不触发。镇潮印续炼后正确守势承伤−3；定神珠续炼后正确辨影承伤−3。均须在行囊出战。
      </p>
      <div v-for="row in rows" :key="row.label">
        <button :disabled="busy || !!row.quote.error" @click="act(row.action)">
          {{ row.label }}</button
        ><small>
          {{ row.quote.months }}月 · 灵石{{ row.quote.stones }} · 灵草{{
            row.quote.herbs
          }}</small
        >
        <p v-if="row.quote.error">{{ row.quote.error }}</p>
      </div>
    </template>
  </NarrativeStage>
</template>
<style scoped>
.artifact-hero,
.artifact-foe {
  position: absolute;
  bottom: 8%;
  height: 56%;
  object-fit: contain;
  pointer-events: none;
}
.artifact-hero {
  left: 19%;
}
.artifact-foe {
  right: 18%;
}
small {
  display: block;
}
button {
  margin-top: 0.6rem;
}
</style>
