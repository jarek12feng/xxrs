<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from "vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import {
  roadScenes,
  roadGoal,
  roadDetails,
  roadError,
  roadClues,
  hasShelteredRoute,
  forgeError,
  actionError,
  preparationError,
  breakthroughDetails,
  type RoadAction,
  type RoadClue,
  type State,
  type Intent,
} from "./core";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{
  act: [intent: Intent];
  cultivate: [];
  breakthrough: [];
  mist: [];
}>();
const panel = ref<HTMLElement>();
const reveal = async () => {
  await nextTick();
  panel.value?.scrollIntoView({ block: "start", behavior: "instant" });
};
onMounted(reveal);
watch(() => props.game.adventure.road.stage, reveal);
watch(() => props.game.adventure.road.discoveries.length, reveal);
const road = computed(() => props.game.adventure.road);
const scene = computed(() => {
  const r = road.value,
    base = roadScenes[r.stage];
  if (r.stage === "beyond" && r.surveyed)
    return {
      ...base,
      body: "再次越过山口，云海依旧辽阔。你认得那段背风的石阶，也看见旅人沿着你标出的方向前行。远处旅亭的灯，已经不再陌生。",
    };
  if (r.stage === "market" && r.map)
    return {
      ...base,
      body: r.surveyed
        ? "药队顺着你画下的归路回来了。郁青在茶摊替你留了位子，摊上的航图多出一段熟悉的线。这个坊市开始有了与你有关的故事。"
        : "送往山口的伤药已经装车。郁青收好图夹，在茶摊替你留着热茶。你手中的航图不再残缺，青嶂关的道路就在眼前。",
    };
  if (r.stage === "lookout" && r.surveyed)
    return {
      ...base,
      body: "路簿上多了你留下的石阶与雾障标记。旅人围过来核对行程，有人问起山下药队的近况。你不再只是路过这个世界的人。",
    };
  return base;
});
const locked = computed(
  () =>
    props.busy ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel,
);
const observations = computed(() =>
  (Object.keys(roadClues) as RoadClue[])
    .filter((key) => roadClues[key].stage === road.value.stage)
    .map((key) => ({ key, ...roadClues[key] })),
);
const choices = computed<{ action: RoadAction; label: string }[]>(
  () =>
    ({
      home: [
        { action: "thanks", label: "回访药工与温蘅 · 听听他们记住了什么" },
        { action: "market", label: "带上缺角航图，前往坊市" },
      ],
      market: [
        { action: "talk", label: "与行脚人郁青交谈" },
        { action: "accept", label: "接下伤药委托" },
        { action: "deliver", label: "交付灵草 4，换取图角" },
        { action: "verify", label: "帮忙辨药 · 神识 6 / 心得 2" },
        { action: "invite", label: "邀请郁青一起探路" },
        {
          action: "pass",
          label: road.value.passed ? "重访云外长路 · 免费" : "循图前往青嶂关",
        },
      ],
      pass: [
        { action: "inspect", label: "观察山风，询问守境妖修" },
        {
          action: "challenge",
          label: road.value.passed
            ? "已经过关"
            : `正面过关 · 把握 ${roadDetails(props.game).chance}% · 灵石 4 / 失败伤势 +1`,
        },
        {
          action: "shelteredChallenge",
          label: `循避风路过关 · 把握 ${roadDetails(props.game, "sheltered").chance}% · 灵石 6 / 失败安全撤回`,
        },
        { action: "camp", label: "退回行营，制定准备计划" },
        { action: "market", label: "回坊市找郁青" },
      ],
      camp: [
        { action: "art", label: "以功法稳住护体" },
        { action: "relic", label: "用灵器抵御山风" },
        { action: "friend", label: "与熟悉路况的人同行" },
        {
          action: "pass",
          label: road.value.passed
            ? "重走已打通的路 · 免费"
            : "按计划准备后，再赴青嶂关",
        },
        { action: "market", label: "返回坊市" },
      ],
      beyond: [{ action: "lookout", label: "走向云栈旅亭 · 看看山外的人" }],
      lookout: [
        { action: "survey", label: "将安全的归路记入路簿" },
        { action: "market", label: "回坊市告诉郁青旅亭的消息" },
        { action: "back", label: "沿归路返回行营" },
      ],
    })[road.value.stage] as { action: RoadAction; label: string }[],
);
const growth = computed(() => [
  {
    label: "凝神辨雾 · 最多三月",
    hint: `神识 ${props.game.sense}/12；迷雾中达到 8 更有利`,
    intent: { type: "advance", activity: "meditate", months: 3 } as Intent,
    error:
      props.game.sense >= 12 ? "神识已满" : actionError(props.game, "meditate"),
  },
  {
    label: "研读航图 · 最多两月",
    hint: `心得 ${props.game.study}/4；辨药委托需要 2`,
    intent: { type: "advance", activity: "study", months: 2 } as Intent,
    error:
      props.game.study >= 4 ? "心得已满" : actionError(props.game, "study"),
  },
  {
    label: "筹措盘缠 · 最多三月",
    hint: "劳作每月收入；用于灵草、功法与灵器",
    intent: { type: "advance", activity: "work", months: 3 } as Intent,
    error: actionError(props.game, "work"),
  },
  {
    label: "闭关固本 · 六月",
    hint: `根基 ${props.game.foundation}/24；消耗灵石 8，增加根基 6`,
    intent: { type: "prepare", kind: "retreat" } as Intent,
    error: preparationError(props.game, "retreat"),
  },
  {
    label: "修炼至下一段进展 · 最多十二月",
    hint: `修为 ${props.game.qi}/360；遇剧情立即停下，不替你做选择`,
    intent: { type: "advance", activity: "cultivate", months: 12 } as Intent,
    error: actionError(props.game, "cultivate"),
  },
  {
    label: "养伤休整 · 最多三月",
    hint: `当前伤势 ${props.game.injury}；伤势会降低过关把握`,
    intent: { type: "advance", activity: "rest", months: 3 } as Intent,
    error: actionError(props.game, "rest"),
  },
]);
const visibleChoices = computed(() =>
  choices.value.filter(({ action }) => {
    const r = road.value;
    if (action === "thanks") return !r.thanked;
    if (action === "talk") return !r.met;
    if (action === "accept") return r.met && !r.commission;
    if (action === "deliver" || action === "verify")
      return r.commission && !r.map;
    if (action === "invite") return r.map && !r.ally;
    if (action === "inspect") return r.obstacle === "none";
    if (action === "shelteredChallenge") return r.obstacle !== "none";
    if (action === "survey") return !r.surveyed;
    return true;
  }),
);
const person = computed(() =>
  road.value.stage === "home"
    ? {
        name: "温蘅",
        image: "/characters/wenheng.png",
        line:
          props.game.adventure.method === "medicine"
            ? "你肯先试药气，再救人。这样的稳重，我记得。"
            : props.game.adventure.method === "guide"
              ? "肯与人分工，也是一种本事。"
              : "你把伤者背回来了，也别忘了照顾自己。",
      }
    : road.value.stage === "pass"
      ? {
          name: "青嶂",
          image: "/characters/qingzhang.jpg",
          line: road.value.discoveries.includes("marks")
            ? "你肯低头看那道刻痕，我便知道你不是来逞强的。"
            : "守路不只是拦人。看清危险，再来找我。",
        }
      : {
          name:
            road.value.stage === "market" ||
            (road.value.stage === "camp" && road.value.ally)
              ? "郁青"
              : "郁青留下的话",
          image: "/characters/yuqing.jpg",
          line:
            road.value.discoveries.includes("names") &&
            road.value.stage === "market"
              ? "原来这些年，是他替我们守着回来的路。"
              : road.value.surveyed && road.value.stage === "market"
                ? "你留下的路，已经有人在走。"
                : ["beyond", "lookout"].includes(road.value.stage)
                  ? "旅亭看见的，也替我记下来。"
                  : road.value.ally
                    ? "你护住气息，我替你辨路。遇到险处，先喊我。"
                    : "画图不是为了把世界圈起来，是为了让人能走回来。",
        },
);
</script>
<template>
  <section
    ref="panel"
    class="adventure-panel road-panel"
    :data-weather="scene.mood"
    aria-label="走出听松山主线"
  >
    <SceneBackdrop
      :key="road.stage"
      :image="scene.image"
      :title="scene.name"
      eyebrow="第二卷 · 航图之外"
      :body="scene.body"
      :speaker="person.name"
      :portrait="person.image"
      :quote="person.line"
    >
      <p v-if="road.result" class="scene-result" role="status">
        {{ road.result }}
      </p>
    </SceneBackdrop>
    <section class="scene-controls" aria-label="行路与准备操作区">
      <h3 class="controls-heading">行路与准备</h3>
      <ol class="chapter-track" aria-label="第二卷进度">
        <li :class="{ passed: road.thanked }">归家回访</li>
        <li :class="{ passed: road.map }">坊市补图</li>
        <li :class="{ passed: road.obstacle !== 'none' }">看清险阻</li>
        <li :class="{ passed: road.passed }">越过山口</li>
        <li :class="{ passed: road.surveyed }">为后来者记路</li>
      </ol>
      <div class="adventure-task">
        <span class="eyebrow">眼下要做的事</span>
        <h2>{{ roadGoal(game) }}</h2>
        <p>
          {{ game.realm ? "筑基" : "炼气" }} · 灵石 {{ game.stones }} · 灵草
          {{ game.herbs }} · 神识 {{ game.sense }} · 心得 {{ game.study }}
        </p>
      </div>
      <section v-if="road.surveyed" class="mist-invitation">
        <span class="eyebrow">第三卷 · 雾海来信</span>
        <h3>
          {{
            game.adventure.mist.stage === "dormant"
              ? "失踪者寄来的新信"
              : "那封信的故事，还在这里"
          }}
        </h3>
        <p>
          {{
            game.adventure.mist.stage === "dormant"
              ? "归路重开后，旅亭收到陈渡的旧信。陆迟认出信上的护路印，与父亲的旧物有关。你想先找人问，还是先查信阵？"
              : "返回本章保留的地点、线索与同行约定。"
          }}
        </p>
        <button class="primary full" :disabled="locked" @click="emit('mist')">
          {{
            game.adventure.mist.stage === "dormant"
              ? "拆开来信 · 开启第三卷"
              : "继续雾海来信"
          }}
          →
        </button>
      </section>
      <section
        v-if="observations.length"
        class="scene-investigation"
        aria-label="环顾四周调查区"
      >
        <h3>停下来，看看四周</h3>
        <p>可选调查，不推进月份。发现会留在手记里，也可能改变你过关的办法。</p>
        <button
          v-for="object in observations"
          :key="object.key"
          :disabled="locked || !!roadError(game, object.action)"
          @click="emit('act', { type: 'road', action: object.action })"
        >
          <span class="clue-symbol" aria-hidden="true">{{
            road.discoveries.includes(object.key) ? "✓" : "◇"
          }}</span>
          <span
            ><strong>{{ object.name }}</strong
            ><small>{{
              roadError(game, object.action) || object.hint
            }}</small></span
          ><span aria-hidden="true">→</span>
        </button>
      </section>
      <details v-if="road.discoveries.length" class="road-journal">
        <summary>
          行路手记 · {{ road.discoveries.length }} 处发现{{
            hasShelteredRoute(game) ? " · 已找到避风路" : ""
          }}
        </summary>
        <article v-for="clue in road.discoveries" :key="clue">
          <h4>{{ roadClues[clue].name }}</h4>
          <p>{{ roadClues[clue].text }}</p>
        </article>
      </details>
      <div
        v-if="['pass', 'camp'].includes(road.stage) && road.obstacle !== 'none'"
        class="road-plan"
      >
        <h3>
          {{
            road.obstacle === "mist"
              ? "已知危险：迷雾误导感知"
              : "已知危险：罡风连续冲击"
          }}
        </h3>
        <p>
          当前准备方向：{{
            {
              none: "尚未选择",
              art: "功法护体",
              relic: "灵器御风",
              friend: "同行辨路",
            }[road.route]
          }}
          · {{ road.ally ? "郁青已应约" : "尚未邀请同行" }}
        </p>
        <p>
          {{ game.realm ? "当前过关把握" : "筑基后按当前准备估计" }}：<strong
            >{{ roadDetails(game).chance }}%</strong
          >；充分准备可达 100%。正面过关失败增加 1
          伤势；两种过关方式都保留航图、装备与同行约定。
        </p>
        <p v-if="hasShelteredRoute(game)" class="sheltered-hint">
          你已串起两处线索：避风路把握
          {{ roadDetails(game, "sheltered").chance }}%，多用灵石
          2，失败不新增伤势。仍需筑基与实际准备。
        </p>
        <details>
          <summary>查看把握来自哪里</summary>
          <p v-for="term in roadDetails(game).terms" :key="term.name">
            {{ term.name }}：{{ term.value >= 0 ? "+" : "" }}{{ term.value }}
          </p>
          <p>
            每次有效挑战从存档种子抽取 1–100；不高于把握即成功。刷新不重抽。
          </p>
        </details>
      </div>
      <div class="adventure-actions">
        <button
          v-for="choice in visibleChoices"
          :key="choice.action"
          :disabled="locked || !!roadError(game, choice.action)"
          @click="emit('act', { type: 'road', action: choice.action })"
        >
          <span
            >{{ choice.label
            }}<small v-if="roadError(game, choice.action)">{{
              roadError(game, choice.action)
            }}</small></span
          ><span>→</span>
        </button>
      </div>
      <section
        v-if="road.stage === 'market' || road.stage === 'camp'"
        class="road-plan"
        aria-label="在场景中准备"
      >
        <h3>
          {{
            road.stage === "market"
              ? "坊市便民与委托准备"
              : "为眼前的山口安排修行"
          }}
        </h3>
        <div class="road-preparations">
          <button
            v-if="road.stage === 'camp' && game.realm === 0"
            :disabled="locked || !!preparationError(game, 'refine')"
            @click="emit('act', { type: 'prepare', kind: 'refine' })"
          >
            炼制筑基丹 · 三月
            <small>{{
              preparationError(game, "refine") ||
              "提升突破把握；可先购药，突破前再决定是否服用"
            }}</small>
          </button>
          <button
            :disabled="locked || game.stones < 8"
            @click="emit('act', { type: 'supplies' })"
          >
            购灵草 4 · 灵石 −8<small>用于交药、炼丹或炼器</small>
          </button>
          <template v-if="road.stage === 'camp' && road.route === 'art'"
            ><button
              :disabled="
                locked ||
                game.journey.known.includes('guard') ||
                game.study < 2 ||
                game.stones < 20
              "
              @click="emit('act', { type: 'learn', technique: 'guard' })"
            >
              学习护身诀 · 心得 2 / 灵石 20<small
                >心得不扣除；已有任意功法也可在完整面板装配</small
              ></button
            ><button
              :disabled="
                locked ||
                !game.journey.known.includes('guard') ||
                game.journey.support === 'guard'
              "
              @click="emit('act', { type: 'equip', technique: 'guard' })"
            >
              装配护身诀
            </button></template
          >
          <template v-if="road.stage === 'camp' && road.route === 'relic'"
            ><button
              :disabled="locked || !!forgeError(game, 'vial')"
              @click="emit('act', { type: 'forge', relic: 'vial' })"
            >
              {{ game.journey.relics.vial ? "精炼" : "炼制" }}归元灵瓶<small>{{
                forgeError(game, "vial") || "心得 2 / 灵石 −24 / 灵草 −4"
              }}</small></button
            ><button
              :disabled="
                locked ||
                !game.journey.relics.vial ||
                game.journey.equipped === 'vial'
              "
              @click="emit('act', { type: 'equipRelic', relic: 'vial' })"
            >
              装配归元灵瓶
            </button></template
          >
          <button
            v-if="road.stage === 'camp' && road.route === 'friend'"
            :disabled="locked || !!roadError(game, 'invite')"
            @click="emit('act', { type: 'road', action: 'invite' })"
          >
            请郁青同行<small>{{
              roadError(game, "invite") || "朋友辨路，你仍需自己筑基"
            }}</small>
          </button>
          <button
            v-for="item in growth.filter(
              (x) =>
                road.stage === 'camp' ||
                ['study', 'meditate', 'work'].includes(
                  x.intent.type === 'advance' ? x.intent.activity : '',
                ),
            )"
            :key="item.label"
            :disabled="locked || !!item.error"
            @click="emit('act', item.intent)"
          >
            {{ item.label }}<small>{{ item.error || item.hint }}</small>
          </button>
        </div>
        <button
          v-if="road.stage === 'camp'"
          class="primary full"
          :disabled="locked || game.realm === 1 || game.qi < 360"
          @click="emit('breakthrough')"
        >
          准备突破筑基 · 查看丹药与把握<small
            >当前不服丹把握
            {{
              breakthroughDetails(game, false).chance
            }}%；先确认风险再尝试</small
          >
        </button>
      </section>
      <div class="adventure-actions">
        <button @click="emit('cultivate')">
          {{
            road.surveyed
              ? "展开山河见闻，寻访回春谷与雾海"
              : "查看完整功法、灵器与修行面板"
          }}
          →
        </button>
      </div>
      <p class="adventure-footnote">
        交谈、调查与移动不计修行月份；修炼按真实月份推进，遇剧情暂停。青嶂关正面挑战消耗灵石
        4，避风路消耗灵石 6，均不推进月份；首次通过后归路常开。
      </p>
    </section>
  </section>
</template>
