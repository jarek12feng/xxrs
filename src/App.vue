<script setup lang="ts">
import {
  ref,
  shallowRef,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { defineStore } from "pinia";
import {
  createGame,
  dispatch,
  paths,
  realms,
  thresholds,
  encounters,
  chance,
  validState,
  type State,
  type Path,
  type Command,
} from "./core";
import { load, save } from "./save";
const useSession = defineStore("session", {
  state: () => ({ running: false, tab: "cultivate", busy: false }),
});
const ui = useSession();
const game = shallowRef<State | null>(null);
const ready = ref(false),
  name = ref("沈青禾"),
  path = ref<Path>("wood"),
  notice = ref(""),
  saved = ref("正在读取存档"),
  showBreak = ref(false),
  pill = ref(false),
  gift = ref<"insight" | "wealth" | "health">("insight"),
  showHelp = ref(false);
const importInput = ref<HTMLInputElement>();
const event = computed(() =>
  game.value?.pending != null ? encounters[game.value.pending] : null,
);
const progress = computed(() =>
  game.value
    ? Math.min(100, (game.value.qi / (thresholds[game.value.realm] || 1)) * 100)
    : 0,
);
const canBreak = computed(
  () => game.value?.status === "alive" && progress.value >= 100 && !event.value,
);
const probability = computed(() =>
  game.value ? Math.min(97, chance(game.value) + (pill.value ? 20 : 0)) : 0,
);
let timer: ReturnType<typeof setInterval>;
async function persist(next: State) {
  ui.busy = true;
  try {
    await save(next);
    game.value = next;
    saved.value = "已保存至此设备";
    return true;
  } catch {
    ui.running = false;
    notice.value =
      "存档写入失败，操作尚未生效。请检查浏览器存储空间，或导出当前进度。";
    saved.value = "保存失败";
    return false;
  } finally {
    ui.busy = false;
  }
}
async function start() {
  await persist(
    createGame(
      name.value,
      path.value,
      crypto.getRandomValues(new Uint32Array(1))[0],
    ),
  );
}
async function act(
  command:
    | Omit<Extract<Command, { type: "tick" }>, "id">
    | Omit<Extract<Command, { type: "choose" }>, "id">
    | Omit<Extract<Command, { type: "break" }>, "id">
    | Omit<Extract<Command, { type: "next" }>, "id">,
) {
  if (!game.value || ui.busy) return;
  notice.value = "";
  const next = dispatch(game.value, {
    ...command,
    ...(command.type === "choose" ? { expectedMonth: game.value.month } : {}),
    id: crypto.randomUUID(),
  } as Command);
  if (next === game.value) return;
  await persist(next);
  if (next.pending !== null || next.status !== "alive") ui.running = false;
}
function openBreak() {
  ui.running = false;
  pill.value = false;
  showBreak.value = true;
}
async function breakthrough() {
  await act({ type: "break", pill: pill.value });
  showBreak.value = false;
}
function exportSave() {
  if (!game.value) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(game.value)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `修仙人生-第${game.value.life}世.json`;
  a.click();
  URL.revokeObjectURL(url);
}
async function importSave(e: Event) {
  ui.running = false;
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > 2e6) throw Error();
    const value: unknown = JSON.parse(await file.text());
    if (!validState(value)) throw Error();
    if (
      game.value &&
      !confirm("导入将替换当前进度。建议先导出当前存档。继续吗？")
    )
      return;
    await persist(value);
  } catch {
    notice.value = "无法导入：文件不是有效的 v1 存档，当前进度已保留。";
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
}
function visibility() {
  if (document.hidden) ui.running = false;
}
const dialogOpen = computed(
  () =>
    !!event.value ||
    showBreak.value ||
    showHelp.value ||
    (!!game.value && game.value.status !== "alive"),
);
watch(dialogOpen, async (open) => {
  if (open) ui.running = false;
  await nextTick();
  if (open) {
    const heading = document.querySelector<HTMLElement>(
      ".overlay:last-child h2",
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }
});
function dialogKeys(e: KeyboardEvent) {
  if (!dialogOpen.value) return;
  if (e.key === "Escape") {
    showHelp.value = false;
    showBreak.value = false;
  }
  if (e.key !== "Tab") return;
  const modal = [...document.querySelectorAll<HTMLElement>(".overlay")].at(-1);
  const items = [
    ...(modal?.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled)",
    ) || []),
  ];
  const first = items[0],
    last = items.at(-1);
  if (!first || !last) return;
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      document.activeElement?.tagName === "H2")
  ) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  try {
    const result = await load();
    game.value = result.state;
    saved.value = result.recovered ? "已从上一份快照恢复" : "已保存至此设备";
  } catch (e) {
    notice.value = e instanceof Error ? e.message : "无法读取本地存档";
  } finally {
    ready.value = true;
  }
  timer = setInterval(() => {
    if (ui.running && !ui.busy && !document.hidden)
      void act({ type: "tick", months: 1 });
  }, 650);
  document.addEventListener("visibilitychange", visibility);
  document.addEventListener("keydown", dialogKeys);
});
onUnmounted(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", visibility);
  document.removeEventListener("keydown", dialogKeys);
});
</script>

<template>
  <div v-if="notice" class="notice" role="alert">
    {{ notice }} <button @click="notice = ''">关闭</button>
  </div>
  <div class="shell" :inert="dialogOpen || undefined">
    <header>
      <a class="brand" href="#"
        ><span class="seal">仙</span
        ><span>修仙人生<small>CULTIVATION · LIFE</small></span></a
      >
      <div class="header-right">
        <span class="edition">山海初卷 · 可玩原型</span
        ><button
          class="icon-btn"
          @click="showHelp = true"
          aria-label="玩法说明"
        >
          ?</button
        ><button class="quiet" @click="importInput?.click()">导入存档</button
        ><button v-if="game" class="quiet" @click="exportSave">导出</button>
      </div>
      <input
        ref="importInput"
        type="file"
        accept=".json"
        hidden
        @change="importSave"
      />
    </header>
    <main v-if="ready && !game" class="creation">
      <div class="creation-art">
        <img src="/mountains.svg" alt="青山与云海间的一座修行洞府" />
        <div class="art-copy">
          <span class="eyebrow">一卷山海 · 几世修行</span>
          <h1>凡尘一念<br />山海长生</h1>
          <p>从无名少年，到云外仙人。<br />这一世，你想如何度过？</p>
        </div>
        <span class="vertical-poem">山中无甲子　寒尽不知年</span>
      </div>
      <section class="creation-form">
        <span class="eyebrow">初入仙途 / 第一世</span>
        <h2>落笔，写下你的名字</h2>
        <p class="muted">十六岁那年，你在听松山下，叩响了仙门。</p>
        <label class="field-label" for="name">道号</label
        ><input
          id="name"
          v-model="name"
          maxlength="16"
          class="name-input"
          placeholder="请输入道号"
        />
        <h3>选择入门功法</h3>
        <div class="path-list">
          <button
            v-for="(p, id) in paths"
            :key="id"
            class="path-card"
            :class="{ selected: path === id }"
            @click="path = id"
          >
            <span class="path-symbol">{{
              id === "wood" ? "木" : id === "sword" ? "剑" : "星"
            }}</span
            ><span
              ><strong>{{ p.name }}</strong
              ><small>{{ p.label }} · {{ p.description }}</small></span
            ><span class="radio">{{ path === id ? "●" : "○" }}</span>
          </button>
        </div>
        <button class="primary start" :disabled="ui.busy" @click="start">
          踏入仙途 <span>→</span>
        </button>
        <p class="fineprint">
          单机修行 · 自动存档 · 一世约 10–20 分钟<br />当前原型时间加速，适合快速体验完整轮回。
        </p>
      </section>
    </main>
    <main v-else-if="game" class="game-layout">
      <aside class="character">
        <div class="life-label">
          第 {{ game.life }} 世 <span>听松山 · 散修</span>
        </div>
        <div class="portrait">
          <span>{{ game.name.slice(0, 1) }}</span
          ><i>道</i>
        </div>
        <h1>{{ game.name }}</h1>
        <p class="realm-label">
          {{ realms[game.realm]
          }}<span>{{
            game.status === "alive"
              ? "修行中"
              : game.status === "ascended"
                ? "已飞升"
                : "此世已终"
          }}</span>
        </p>
        <div class="character-line"></div>
        <div class="stat">
          <span>年岁</span
          ><strong
            >{{ Math.floor(game.age / 12)
            }}<small> 岁 {{ game.age % 12 }} 月</small></strong
          >
        </div>
        <div class="stat">
          <span>寿元</span
          ><strong>{{ Math.floor(game.limit / 12) }}<small> 载</small></strong>
        </div>
        <div class="thin-track">
          <i
            :style="{
              width: Math.min(100, (game.age / game.limit) * 100) + '%',
            }"
          ></i>
        </div>
        <div class="stat">
          <span>灵石</span><strong>{{ game.stones }} <small>枚</small></strong>
        </div>
        <div class="stat">
          <span>感悟</span><strong>{{ game.insight }} <small>点</small></strong>
        </div>
        <div class="stat">
          <span>护脉丹</span><strong>{{ game.pills }} <small>枚</small></strong>
        </div>
        <div class="character-line"></div>
        <span class="eyebrow">本命功法</span>
        <div class="equipped">
          <span>{{
            game.path === "wood" ? "木" : game.path === "sword" ? "剑" : "星"
          }}</span>
          <div>
            <strong>{{ paths[game.path].name }}</strong
            ><small>{{ paths[game.path].label }}</small>
          </div>
        </div>
        <div class="legacy">
          <span>前尘遗产</span
          ><strong>{{ game.legacy }} <small>点</small></strong>
        </div>
        <p class="save-status"><i></i>{{ saved }}</p>
      </aside>
      <section class="journey">
        <nav>
          <button
            :class="{ active: ui.tab === 'cultivate' }"
            @click="ui.tab = 'cultivate'"
          >
            洞府修行</button
          ><button
            :class="{ active: ui.tab === 'history' }"
            @click="ui.tab = 'history'"
          >
            人生卷宗</button
          ><span>修行第 {{ Math.floor(game.month / 12) + 1 }} 年</span>
        </nav>
        <template v-if="ui.tab === 'cultivate'"
          ><div class="landscape">
            <img src="/mountains.svg" alt="听松山云海和竹林小屋" />
            <div class="landscape-title">
              <span class="eyebrow">此心安处，即是仙乡</span>
              <h2>听松山居</h2>
              <p>松风入定，云气养神。</p>
            </div>
            <div class="scene-tag">◌ 灵气充盈</div>
            <div class="landscape-bottom">
              <span>听松山 · 洞府</span><span>山居岁月，自有长生</span>
            </div>
          </div>
          <section class="cultivation-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">静心吐纳</span>
                <h2>
                  {{
                    game.status === "alive"
                      ? "修行一月，积跬步以至千里"
                      : "此世已成一卷"
                  }}
                </h2>
              </div>
              <span class="gain"
                >每月 +{{ paths[game.path].gain + game.realm * 3 }} 修为</span
              >
            </div>
            <div class="progress-label">
              <span>{{ realms[game.realm] }}修为</span
              ><strong
                >{{ game.qi }}
                <small>/ {{ thresholds[game.realm] || "圆满" }}</small></strong
              >
            </div>
            <div class="qi-track">
              <i :style="{ width: progress + '%' }"></i>
            </div>
            <div class="cultivation-actions">
              <button
                class="primary"
                :disabled="ui.busy || !!event || game.status !== 'alive'"
                @click="ui.running = !ui.running"
              >
                {{ ui.running ? "Ⅱ 暂停修炼" : "▷ 闭关修炼" }}</button
              ><button
                class="secondary"
                :disabled="
                  ui.busy || !!event || game.status !== 'alive' || ui.running
                "
                @click="act({ type: 'tick', months: 1 })"
              >
                推进一月</button
              ><button
                class="break-button"
                :disabled="!canBreak || ui.busy"
                @click="openBreak"
              >
                尝试突破 <span>↗</span>
              </button>
            </div>
            <p class="muted tip">
              {{
                progress >= 100
                  ? "修为已满。准备妥当后，可尝试突破下一境界。"
                  : "闭关每 0.65 秒推进一月；遇到机缘自动暂停。每三月获得 3 枚灵石。"
              }}
            </p>
            <p v-if="game.result" class="last-result" aria-live="polite">
              {{ game.result }}
            </p>
          </section></template
        >
        <section class="timeline" :class="{ expanded: ui.tab === 'history' }">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">岁月有痕</span>
              <h2>人生卷宗</h2>
            </div>
            <span class="muted">{{
              ui.tab === "history" ? "本世最近 180 条" : "近事三则"
            }}</span>
          </div>
          <article
            v-for="(entry, i) in game.log.slice(
              0,
              ui.tab === 'history' ? 180 : 3,
            )"
            :key="i"
            :class="entry.kind"
          >
            <span class="timeline-dot"></span
            ><time
              >修行 {{ Math.floor(entry.month / 12) }} 年
              {{ entry.month % 12 }} 月</time
            >
            <p>{{ entry.text }}</p>
          </article>
        </section>
      </section>
      <aside class="right-column">
        <section class="guide-card">
          <span class="eyebrow">修行指引</span>
          <h2>一念长生</h2>
          <p>
            修为有尽，仙途无穷。<br />每一次选择，都会成为<br />下一世的回响。
          </p>
          <ol>
            <li :class="{ done: game.month > 0 }">吐纳修炼，积攒修为</li>
            <li :class="{ done: game.log.length > 1 }">邂逅机缘，增长感悟</li>
            <li :class="{ done: game.realm > 0 }">准备丹药，叩问天关</li>
            <li>一世终了，携遗产再来</li>
          </ol>
        </section>
        <section class="realm-card">
          <span class="eyebrow">境界之路</span>
          <div
            v-for="(r, i) in realms"
            :key="r"
            :class="{ current: game.realm === i, passed: game.realm > i }"
          >
            <i>{{ game.realm > i ? "✓" : String(i + 1).padStart(2, "0") }}</i
            ><span>{{ r }}</span
            ><small v-if="game.realm === i">当前</small>
          </div>
        </section>
        <p class="side-note">「长生非一日之功，<br />　山海皆为后来之路。」</p>
      </aside>
    </main>
    <p v-else class="loading">正在展开山海绘卷……</p>
    <footer>
      <span>修仙人生 <i>·</i> 山海初卷</span><span>本地单机试玩 / v0.1.0</span>
    </footer>
  </div>
  <div v-if="event && game" class="overlay">
    <section
      class="modal event-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <span class="eyebrow">仙途机缘 · 时光暂驻</span>
      <div class="event-icon">缘</div>
      <h2 id="event-title">{{ event.title }}</h2>
      <p class="event-body">{{ event.body }}</p>
      <button
        v-for="(o, i) in event.choices"
        :key="i"
        class="choice"
        :disabled="ui.busy || game.stones + (o.stones || 0) < 0"
        @click="act({ type: 'choose', event: game.pending!, option: i })"
      >
        <span
          >{{ o.text
          }}<small
            >{{ o.hint
            }}{{
              game.stones + (o.stones || 0) < 0 ? " · 灵石不足" : ""
            }}</small
          ></span
        ><b>→</b>
      </button>
      <p class="fineprint">选择后自动保存，继续闭关需再次点击修炼。</p>
    </section>
  </div>
  <div v-if="showBreak && game" class="overlay">
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-title"
    >
      <span class="eyebrow">叩问天关</span>
      <h2 id="break-title">
        {{ realms[game.realm] }} → {{ realms[game.realm + 1] }}
      </h2>
      <div class="probability">{{ probability }}<small>%</small></div>
      <p class="muted">本次突破成功率</p>
      <p class="break-details">
        境界基础 {{ 55 - game.realm * 5 }}% + 感悟
        {{ Math.min(game.insight, 25) }}%<br />功法修正
        {{
          game.path === "spirit" ? "+10" : game.path === "sword" ? "-5" : "0"
        }}%{{ pill ? " + 护脉丹 20%" : "" }} · 概率上限 97%
      </p>
      <label class="pill-option"
        ><input type="checkbox" v-model="pill" :disabled="game.pills < 1" />
        使用护脉丹（持有 {{ game.pills }} 枚，成功率 +20%）</label
      >
      <p class="warning-text">
        成功延寿十八年。失败损失 35% 修为、两年寿元上限，获得 2
        点感悟。判定随存档保存。
      </p>
      <button class="primary full" :disabled="ui.busy" @click="breakthrough">
        凝神，突破</button
      ><button class="quiet full" @click="showBreak = false">尚需准备</button>
    </section>
  </div>
  <div v-if="game && game.status !== 'alive'" class="overlay">
    <section
      class="modal end-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-title"
    >
      <span class="eyebrow"
        >第 {{ game.life }} 世 ·
        {{ game.status === "ascended" ? "功德圆满" : "尘缘已尽" }}</span
      >
      <h2 id="end-title">
        {{
          game.status === "ascended"
            ? "乘风归去，踏入天门"
            : "青山依旧，人间一梦"
        }}
      </h2>
      <p class="event-body">{{ game.result }}</p>
      <div class="end-stats">
        <div>
          <strong>{{ Math.floor(game.age / 12) }}</strong
          ><small>享年</small>
        </div>
        <div>
          <strong>{{ realms[game.realm] }}</strong
          ><small>此世境界</small>
        </div>
        <div>
          <strong>+{{ game.earned }}</strong
          ><small>获得遗产</small>
        </div>
      </div>
      <details class="life-review">
        <summary>展开此世卷宗（最近 {{ game.log.length }} 条）</summary>
        <p v-for="(entry, i) in game.log" :key="i">
          修行 {{ Math.floor(entry.month / 12) }} 年 {{ entry.month % 12 }} 月 ·
          {{ entry.text }}
        </p>
      </details>
      <h3>以三点遗产，续一缕前缘</h3>
      <p class="muted">当前遗产 {{ game.legacy }} 点 · 未花费点数保留</p>
      <div class="gift-list">
        <button
          :class="{ selected: gift === 'insight' }"
          @click="gift = 'insight'"
        >
          前世悟性<small>初始感悟 +10</small></button
        ><button
          :class="{ selected: gift === 'wealth' }"
          @click="gift = 'wealth'"
        >
          故人机缘<small>灵石 +40 · 丹药 +1</small></button
        ><button
          :class="{ selected: gift === 'health' }"
          @click="gift = 'health'"
        >
          一息生机<small>寿元 +8 年</small>
        </button>
      </div>
      <button
        class="primary full"
        :disabled="ui.busy || game.legacy < 3"
        @click="act({ type: 'next', gift })"
      >
        携此前缘，再入轮回 →</button
      ><button class="quiet full" @click="exportSave">
        导出此世卷宗与存档
      </button>
    </section>
  </div>
  <div v-if="showHelp" class="overlay">
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <span class="eyebrow">初入仙途</span>
      <h2 id="help-title">如何修行</h2>
      <p class="event-body">
        点击闭关会自动推进月份，机缘出现时停下。积满修为后主动突破；感悟与护脉丹可以提高成功率。寿元耗尽时，本世结束并结算遗产，选择继承后开启下一世。
      </p>
      <p class="event-body">
        每次操作都保存到本机浏览器。切到后台会暂停，不结算离线收益。使用导出存档可保留备份或迁移设备。当前内容为快速试玩数值。
      </p>
      <button class="primary full" @click="showHelp = false">我已知晓</button>
    </section>
  </div>
</template>
