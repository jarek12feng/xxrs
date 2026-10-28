<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import SceneResponse from "./SceneResponse.vue";
import type { ActionReceipt } from "./action-feedback";
import {
  mistScenes,
  mistPartner,
  mistQuote,
  mistGoal,
  mistDetails,
  mistError,
  companion,
  actionError,
  type State,
  type Intent,
  type MistAction,
} from "./core";
const props = defineProps<{
  game: State;
  busy: boolean;
  receipt?: ActionReceipt | null;
}>();
const emit = defineEmits<{ act: [intent: Intent]; cultivate: []; road: [] }>();
const panel = ref<HTMLElement>();
const m = computed(() => props.game.adventure.mist);
const reveal = async () => {
  await nextTick();
  if (!panel.value?.closest(".immersive-shell"))
    panel.value?.scrollIntoView({ block: "start", behavior: "instant" });
};
onMounted(reveal);
watch(() => m.value.stage, reveal);
const scene = computed(() => {
  const base = mistScenes[m.value.stage];
  if (m.value.stage === "garden" && m.value.garden)
    return {
      ...base,
      body: "石渠重新有了水声，引灯草在雾里慢慢舒展开来。石角把药篓放到一旁，愿意坐下来讲陈渡的往事。你不再只是闯入药圃的陌生人。",
    };
  if (m.value.stage === "station" && m.value.station)
    return {
      ...base,
      body: "旧阵恢复了缓慢的呼吸。你认得哪道灵脉送信，哪道引人归来，檐下那些干燥的信袋也终于有了答案。这一次，废驿不再只是一处看不懂的遗迹。",
    };
  if (m.value.stage === "camp" && m.value.passed)
    return {
      ...base,
      body: "来信已经读完，探灵灯静静亮在航图旁。那些没来得及问的人、没走完的路，都还在那里。你可以带着新的本领回头看看，也可以先回坊市，听听等你归来的人想说什么。",
    };
  if (m.value.stage === "shrine" && m.value.revisited)
    return {
      ...base,
      title: "旧山祠 · 归灯长明",
      image: "/scenes/shrine-relit.jpg",
      body: "石墙后的避难室亮着新灯。一个背药篓的人在檐下停住，指给同伴看你留下的归路标记。同一座山祠，因为你如今能做到的事，不再是初来时的模样。",
    };
  return base;
});
const person = computed(() => mistPartner(props.game));
const companionName = computed(() =>
  props.game.social.met
    ? companion(props.game)?.name || "相识的同行者"
    : "相识的同行者",
);
const locked = computed(
  () =>
    props.busy ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel,
);
type Choice = { action: MistAction; label: string; hint: string };
const choices = computed<Choice[]>(() => {
  const r = m.value;
  if (
    r.passed &&
    ["garden", "station"].includes(r.stage) &&
    (r.stage === "garden" ? r.garden : r.station)
  )
    return [
      {
        action: "home",
        label: "带着补全的往事回坊市",
        hint: "也可返回行营重访旧山祠；不会重复闯关或领取关系奖励",
      },
    ];
  switch (r.stage) {
    case "letter":
      return [
        {
          action: "accept",
          label: "把信收进行囊",
          hint: "与谁同行、先查哪条线索，由你决定；不强制清完两条路",
        },
      ];
    case "camp":
      return [];
    case "garden":
      return r.garden
        ? [
            {
              action: "gate",
              label: "带引灯叶前往回声阵",
              hint: "不必再清另一条支线；也可回营补探",
            },
          ]
        : [
            {
              action: "tend",
              label: "以灵草救治引灯草",
              hint: "灵草 −4；换取药队当年的目击证言",
            },
            {
              action: "attune",
              label: r.lamp ? "用探灵灯照见根脉" : "沿根脉疏通石渠",
              hint:
                props.game.adventure.road.solution === "medicine"
                  ? "沿用青嶂关救草手法；可独自完成，不耗灵草"
                  : r.lamp
                    ? "新能力让旧问题有了新解法，不耗灵草"
                    : "医道心得 2，或请同行陆迟协作；不耗灵草",
            },
          ];
    case "station":
      return r.station
        ? [
            {
              action: "gate",
              label: "循归阵节拍前往雾海",
              hint: "不必再清另一条支线；也可回营问药圃的往事",
            },
          ]
        : [
            {
              action: "decode",
              label: "分辨送信与归家的灵脉",
              hint:
                props.game.adventure.road.solution === "array"
                  ? "沿用青嶂关归阵手法；独自辨阵，不需同行或额外资源"
                  : `神识 8 / 心得 2，或${companionName.value}协作；不消耗资源`,
            },
          ];
    case "gate":
      return [
        {
          action: "steady",
          label: "先护住大家的归路",
          hint: "补给灵石 6，把握 +10；失败安全撤回，无新增伤势",
        },
        {
          action: "pursue",
          label: "约好信号，趁回声追信",
          hint: "补给灵石 3；失败伤势 +1，但保留线索并带回情报",
        },
        ...(r.vow !== "none"
          ? [
              {
                action: "challenge" as const,
                label: `按约定入阵 · 把握 ${mistDetails(props.game).chance}%`,
                hint: `本次灵石 −${mistDetails(props.game).cost}；不高于把握即成功，准备充分可达 100%`,
              },
            ]
          : []),
      ];
    case "archive":
      return [
        {
          action: "read",
          label: "读完记录，带上探灵灯归来",
          hint: "获得照见隐藏灵痕的能力；想到旧山祠那堵看不透的墙",
        },
      ];
    case "home":
      return [
        ...(!r.settled
          ? [
              {
                action: "share" as const,
                label: "坐下来，讲讲我们走过的路",
                hint:
                  r.partner === "companion"
                    ? "记下一段共同冒险，好感 +8；不是自动定情或结婚"
                    : r.partner === "luchi"
                      ? "陆迟记住这次分工与约定，道友信任 +1"
                      : "独行的经历，也有人愿意听；不强迫恋爱",
              },
            ]
          : []),
        {
          action: "shrine",
          label: "带灯重访救过药工的山祠",
          hint: "灯光能照出那堵墙后的灵痕，也许还有一条被遗忘的路",
        },
      ];
    case "shrine":
      return r.revisited
        ? [
            {
              action: "home",
              label: "把墙后的誓言带回去",
              hint: "第三卷已完成；可补探另一处证据或继续其他见闻",
            },
          ]
        : [
            {
              action: "illuminate",
              label: "举灯照向旧石墙",
              hint: "需要探灵灯，并先与等你的人分享来信真相",
            },
          ];
    default:
      return [];
  }
});
const partners = computed<Choice[]>(() => [
  {
    action: "luchi",
    label: "邀陆迟同行",
    hint: "他想寻找父亲的往事；能协作疏通药圃，阵中分工 +12",
  },
  {
    action: "companion",
    label: `邀${companionName.value}同行`,
    hint: "共同探索对方在意的归路；能协作识阵，阵中分工 +12",
  },
  {
    action: "solo",
    label: "独行，留下归程",
    hint: "自己准备药理与识阵；仍能完整通关，回来有人听你讲述",
  },
]);
const paths = computed<Choice[]>(() => [
  {
    action: "garden",
    label: "旧药圃 · 找仍记得往事的人",
    hint: m.value.garden
      ? "已获引灯叶与证言，可以重访"
      : m.value.lamp
        ? "探灵灯能照出根脉，不耗灵草也能解开石角的难题"
        : props.game.adventure.road.solution === "medicine"
          ? "沿用青嶂关救草手法；独行也不耗药材"
          : "交涉与救草：灵草 4 / 医道心得 2 / 陆迟援手，三选一",
  },
  {
    action: "station",
    label: "废驿 · 查清信从哪里寄来",
    hint: m.value.station
      ? "已记下归阵节拍，可以重访"
      : props.game.adventure.road.solution === "array"
        ? "沿用青嶂关归阵手法；独自辨读旧阵"
        : `识阵：神识 8 + 心得 2，或${companionName.value}协作`,
  },
  ...(m.value.garden || m.value.station
    ? [
        m.value.passed
          ? {
              action: "home" as const,
              label: "回坊市看看等你的人",
              hint: "线索不会失去，另一条路随时能补探",
            }
          : {
              action: "gate" as const,
              label: "已有证据，前往雾海回声阵",
              hint: "一处证据足够；另一处能补全真相、额外提高把握 8",
            },
      ]
    : []),
  {
    action: "shrine",
    label: m.value.revisited ? "旧山祠 · 归灯长明" : "旧山祠 · 看不清的刻痕",
    hint: m.value.lamp
      ? "探灵灯可以照见墙后的东西"
      : "曾经救人的地方还有秘密；可以先记下，带灯再来",
  },
]);
const growth = computed(() => [
  {
    label: "凝神辨回声 · 最多三月",
    hint: `神识 ${props.game.sense}/12；到 8 可应对回声阵`,
    activity: "meditate" as const,
    months: 3,
  },
  {
    label: "研读阵理 · 最多两月",
    hint: `心得 ${props.game.study}/4；到 2 可研究阵眼情报`,
    activity: "study" as const,
    months: 2,
  },
  {
    label: "筹措补给 · 最多三月",
    hint: "劳作积攒灵石，不替你做关键选择",
    activity: "work" as const,
    months: 3,
  },
  {
    label: "养伤休整 · 最多三月",
    hint: `伤势 ${props.game.injury}；每层降低把握 5`,
    activity: "rest" as const,
    months: 3,
  },
]);
const invoke = (action: MistAction) => emit("act", { type: "mist", action });
</script>

<template>
  <section
    ref="panel"
    class="adventure-panel mist-panel desktop-scene"
    aria-label="雾海来信主线"
  >
    <SceneBackdrop
      :key="m.stage + String(m.revisited)"
      :image="scene.image"
      :title="scene.title"
      eyebrow="第三卷 · 雾海来信"
      :body="scene.body"
      :speaker="person.name"
      :portrait="person.portrait"
      :quote="mistQuote(game)"
    >
      <SceneResponse
        v-if="receipt"
        :text="m.result"
        :receipt="receipt?.scene?.chapter === 'mist' ? receipt : null"
      />
    </SceneBackdrop>
    <section class="scene-controls" aria-label="雾海探索操作区">
      <ol class="chapter-track" aria-label="第三卷进度">
        <li class="passed">迟到的信</li>
        <li :class="{ passed: m.garden || m.station }">分路寻证</li>
        <li :class="{ passed: m.passed }">共渡雾海</li>
        <li :class="{ passed: m.settled }">有人等归</li>
        <li :class="{ passed: m.revisited }">旧地新生</li>
      </ol>
      <div class="adventure-task">
        <span class="eyebrow">{{
          m.revisited ? "这一段路，你改变了什么" : "此刻值得去做的事"
        }}</span>
        <h2>{{ mistGoal(game) }}</h2>
        <p>
          灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 伤势
          {{ game.injury }} ·
          {{
            m.partner === "none"
              ? "尚未约好同行"
              : m.partner === "solo"
                ? "独行"
                : m.partner === "luchi"
                  ? "陆迟同行"
                  : `${companionName}同行`
          }}
        </p>
      </div>
      <div v-if="m.stage === 'camp'" class="mist-camp">
        <details
          v-if="!m.passed"
          :open="m.partner === 'none'"
          class="road-journal"
        >
          <summary>
            同行约定 ·
            {{ m.partner === "none" ? "先决定与谁走这段路" : "可以重新商量" }}
          </summary>
          <div class="adventure-actions">
            <button
              v-for="c in partners"
              :key="c.action"
              :disabled="locked || !!mistError(game, c.action)"
              :aria-pressed="m.partner === c.action"
              @click="invoke(c.action)"
            >
              <span
                >{{ c.label
                }}<small>{{ mistError(game, c.action) || c.hint }}</small></span
              ><span aria-hidden="true">→</span>
            </button>
          </div>
        </details>
        <h3>{{ m.passed ? "你还想去看看哪里？" : "你想先追哪条线索？" }}</h3>
        <p class="mist-route-note">
          {{
            m.passed
              ? "没有重复的闯关任务。你可以补探未走过的路，也可以回到有人等你的地方。"
              : "先找人问往事，还是先查信从哪里来？一处证据就能指向雾海，另一处留待你想回来时再看。"
          }}
        </p>
        <div class="mist-routes">
          <button
            v-for="c in paths"
            :key="c.action"
            :disabled="locked || !!mistError(game, c.action)"
            @click="invoke(c.action)"
          >
            <span class="eyebrow">{{
              c.action === "garden"
                ? "人情与药理"
                : c.action === "station"
                  ? "旧阵与真相"
                  : "已经认得的路"
            }}</span
            ><strong>{{ c.label }}</strong
            ><small>{{ mistError(game, c.action) || c.hint }}</small
            ><span aria-hidden="true">→</span>
          </button>
        </div>
        <section
          v-if="
            game.adventure.road.solution === 'sword' && !m.ward && !m.passed
          "
          class="sheltered-hint"
        >
          <h3>青嶂关的商队追上来了</h3>
          <p>
            你斩开的宽路能运来桥材，提前架设归桥，不必先失败。青嶂送来护栏木，人却没有来。
          </p>
          <button
            :disabled="locked || !!mistError(game, 'caravanBridge')"
            @click="invoke('caravanBridge')"
          >
            请商队架设归桥 · 灵石 6<small>{{
              mistError(game, "caravanBridge") ||
              "护归准备 +20，与研究护归法不叠加"
            }}</small>
          </button>
        </section>
        <section v-if="m.insight && !m.ward" class="sheltered-hint">
          <h3>失败带回了有用的东西</h3>
          <p>
            阵眼情报已让把握 +10。研究护归法可再
            +20；不需要重新碰运气找同一条情报。
          </p>
          <button
            :disabled="locked || !!mistError(game, 'ward')"
            @click="invoke('ward')"
          >
            研究护归法<small>{{
              mistError(game, "ward") || "心得 2 或师门认可；不消耗心得与资源"
            }}</small>
          </button>
        </section>
      </div>
      <section v-if="m.stage === 'gate'" class="road-plan">
        <h3>
          {{
            m.hazard === "echo"
              ? "回声扰识 · 神识达到 8 更从容"
              : "风脉断续 · 根基达到 12 更稳妥"
          }}
        </h3>
        <p>
          {{
            m.vow === "none"
              ? "先商量如何入阵"
              : m.vow === "steady"
                ? "当前约定：先护归路"
                : "当前约定：趁回声追信"
          }}
          · 当前把握 <strong>{{ mistDetails(game).chance }}%</strong>
        </p>
        <details>
          <summary>把握来自哪里 · 风险完全公开</summary>
          <p v-for="term in mistDetails(game).terms" :key="term.name">
            {{ term.name }}：{{ term.value >= 0 ? "+" : "" }}{{ term.value }}
          </p>
          <p>固定种子判定，刷新不重抽阵势。充分准备可达到 100%。</p>
        </details>
      </section>
      <div class="adventure-actions">
        <button
          v-for="c in choices"
          :key="c.action"
          :disabled="locked || !!mistError(game, c.action)"
          :aria-pressed="
            ['steady', 'pursue'].includes(c.action)
              ? m.vow === c.action
              : undefined
          "
          @click="invoke(c.action)"
        >
          <span
            >{{ c.label
            }}<small>{{ mistError(game, c.action) || c.hint }}</small></span
          ><span aria-hidden="true">→</span>
        </button>
      </div>
      <details v-if="m.stage === 'camp'" class="road-journal">
        <summary>为选好的方向做准备 · 修行与补给</summary>
        <div class="road-preparations">
          <button
            :disabled="locked || game.stones < 8"
            @click="emit('act', { type: 'supplies' })"
          >
            购灵草 4 · 灵石 −8<small
              >药圃救草所需；也可以选择不耗药材的解法</small
            ></button
          ><button
            v-for="g in growth"
            :key="g.activity"
            :disabled="locked || !!actionError(game, g.activity)"
            @click="
              emit('act', {
                type: 'advance',
                activity: g.activity,
                months: g.months,
              })
            "
          >
            {{ g.label
            }}<small>{{ actionError(game, g.activity) || g.hint }}</small>
          </button>
        </div>
      </details>
      <details v-if="m.firstRoute !== 'none'" class="road-journal">
        <summary>这次旅程留下了什么</summary>
        <p>
          最先追查：{{
            m.firstRoute === "garden" ? "旧药圃的人与往事" : "废驿的阵与来信"
          }}。
        </p>
        <p v-if="m.garden">
          引灯叶：陈渡和陆姓修士曾回来接困住的人。阵中把握 +8。
        </p>
        <p v-if="m.station">
          归阵节拍：信被旧阵保存，等归路接通才送出。阵中把握 +8。
        </p>
        <p v-if="m.insight">
          阵眼情报：失败仍有进展，把握 +10。{{
            m.ward ? "已有护归准备，再 +20（不叠加）。" : "可回营研究护归法。"
          }}
        </p>
        <p v-if="m.lamp">
          探灵灯：照见旧山祠的隐藏灵痕，也能照出药圃根脉。不占战斗灵器槽。
        </p>
        <p v-if="m.settled">
          共同经历已记录。{{
            m.vow === "steady" ? "先护归路" : "约好信号再追信"
          }}的约定，同行者记得。
        </p>
        <p v-if="m.revisited">
          旧山祠的避难室重新亮灯。陈渡来信的真相已明；其他山河见闻与家书进度仍然保留。
        </p>
      </details>
      <div class="adventure-actions mist-secondary">
        <button
          v-if="
            ['garden', 'station', 'gate', 'home', 'shrine'].includes(m.stage)
          "
          :disabled="locked"
          @click="invoke('camp')"
        >
          返回行营 · 调整准备或补探另一条路 →</button
        ><button @click="emit('cultivate')">
          查看完整修行、师门与人物关系 →</button
        ><button @click="emit('road')">回看第二卷 · 坊市与云路 →</button>
      </div>
      <p class="adventure-footnote">
        移动、调查和本章入阵不推进月份；修行按真实月份结算，遇事件暂停。线索、能力与关系自动存档，不因刷新丢失。探灵灯属于本世，轮回不会自动携带。
      </p>
    </section>
  </section>
</template>
