import {
  hasFoundationRecipe,
  breakthroughError,
  relicJourneyError,
  foundationGoal,
  foundationPassages,
} from "./foundation";
export {
  hasFoundationRecipe,
  breakthroughError,
  relicJourneyError,
  foundationGoal,
} from "./foundation";
import {
  validState as validLegacy,
  type State as LegacyState,
} from "./legacy-v1";
import { validState as validV2 } from "./legacy-v2";
export type Aptitude = "sturdy" | "insightful" | "perceptive";
export const aptitudes = {
  sturdy: {
    name: "山岳之骨",
    root: 8,
    wisdom: 4,
    sense: 3,
    description: "根骨 8 · 悟性 4 · 神识 3。吐纳更快，能以体魄护友。",
  },
  insightful: {
    name: "明心善悟",
    root: 4,
    wisdom: 8,
    sense: 3,
    description: "根骨 4 · 悟性 8 · 神识 3。研读更快，领悟替代丹方。",
  },
  perceptive: {
    name: "灵台清明",
    root: 4,
    wisdom: 4,
    sense: 7,
    description: "根骨 4 · 悟性 4 · 神识 7。接近识阵门槛，控火省灵石。",
  },
};
export type Path = "wood" | "sword";
export type Inheritance = "none" | "herbal" | "sword" | "bond" | "ember";
export type Activity =
  "cultivate" | "gather" | "train" | "work" | "rest" | "meditate" | "study";
export type Stage = "unmet" | "waiting" | "crossing" | "relic" | "resolved";
export type Decision =
  "meeting" | "departure" | "crossing" | "relic" | "letter" | "visit";
export const paths = {
  wood: {
    name: "长春医道",
    label: "采药 · 炼丹 · 济人",
    gain: 10,
    description:
      "用修行时间培育灵草，闯过遗府取得丹方后可自行补丹。灵草也能解瘴救人。",
  },
  sword: {
    name: "青锋剑道",
    label: "历练 · 破阵 · 争先",
    gain: 14,
    description: "更早积满修为，历练剑意可破遗府阵法；伤势会降低突破把握。",
  },
};
export const inheritances: Record<
  Inheritance,
  { name: string; description: string }
> = {
  ember: {
    name: "孤灯丹诀",
    description:
      "自留孤丹后结算解锁。下一世首次突破失败保留九成修为且不减寿；不叠加。",
  },
  none: { name: "白纸新生", description: "不带传承，重新选择这一世的道路。" },
  herbal: {
    name: "长春丹札",
    description:
      "初始灵草 +4；跨路线采药。各道途取得遗府丹方后均可补炼。亲手炼丹后结算解锁。",
  },
  sword: {
    name: "青锋残谱",
    description: "初始剑意 +2；跨路线历练剑意。剑意达到 4 后结算解锁。",
  },
  bond: {
    name: "渡口旧约",
    description: "解锁与陆迟相认及遗府无伤捷径。赠丹助陆迟筑基后结算解锁。",
  },
};
export interface State {
  version: 3;
  aptitude: Aptitude;
  root: number;
  wisdom: number;
  sense: number;
  study: number;
  ward: boolean;
  memories: {
    letter: boolean;
    visit: boolean;
    confided: boolean;
    support: string;
    crossing: string;
  };
  seed: number;
  name: string;
  path: Path;
  life: number;
  month: number;
  age: number;
  limit: number;
  realm: 0 | 1;
  qi: number;
  stones: number;
  herbs: number;
  pills: number;
  foundation: number;
  mastery: number;
  injury: number;
  legacy: number;
  earned: number;
  status: "alive" | "complete" | "dead" | "legacy";
  pending: { id: string; kind: Decision } | null;
  story: {
    stage: Stage;
    trust: number;
    choice: "none" | "self" | "gift" | "missed";
    luchi: "stranger" | "companion" | "foundation" | "distant";
    deadline: number;
  };
  crafted: number;
  inherited: Inheritance;
  unlocked: Inheritance[];
  result: string;
  log: { month: number; text: string; kind: string }[];
  seen: string[];
  archive: LegacyState | null;
}
export type Command =
  | { id: string; type: "advance"; activity: Activity; months: number }
  | { id: string; type: "prepare"; kind: "refine" | "retreat" }
  | { id: string; type: "choose"; instanceId: string; option: string }
  | { id: string; type: "break"; pill: boolean }
  | { id: string; type: "revisitRelic" }
  | {
      id: string;
      type: "next";
      path: Path;
      inheritance: Inheritance;
      aptitude?: Aptitude;
    }
  | { id: string; type: "beginChapter"; path: Path; aptitude?: Aptitude };
export type Intent = Command extends infer C
  ? C extends Command
    ? Omit<C, "id">
    : never
  : never;
export interface Option {
  id: string;
  label: string;
  hint: string;
  disabled?: string;
}
export interface EventView {
  title: string;
  body: string;
  options: Option[];
}
export const MAX_QI = 360;
export function createGame(
  name: string,
  path: Path,
  seed = 12345,
  aptitude: Aptitude = "insightful",
): State {
  return {
    version: 3,
    aptitude,
    root: aptitudes[aptitude].root,
    wisdom: aptitudes[aptitude].wisdom,
    sense: aptitudes[aptitude].sense,
    study: 0,
    ward: false,
    memories: {
      letter: false,
      visit: false,
      confided: false,
      support: "none",
      crossing: "none",
    },
    seed: seed >>> 0 || 1,
    name: name.trim().slice(0, 16) || "无名",
    path,
    life: 1,
    month: 0,
    age: 192,
    limit: (path === "wood" ? 60 : 48) * 12,
    realm: 0,
    qi: 0,
    stones: 25,
    herbs: 0,
    pills: 0,
    foundation: 0,
    mastery: 0,
    injury: 0,
    legacy: 0,
    earned: 0,
    status: "alive",
    pending: null,
    story: {
      stage: "unmet",
      trust: 0,
      choice: "none",
      luchi: "stranger",
      deadline: 36,
    },
    crafted: 0,
    inherited: "none",
    unlocked: [],
    result: "",
    log: [
      {
        month: 0,
        text: "十六岁，你来到听松山。山下渡口，似有一段尚未开始的缘分。",
        kind: "story",
      },
    ],
    seen: [],
    archive: null,
  };
}
function rng(s: State) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0;
  return s.seed / 4294967296;
}
function record(s: State, text: string, kind = "story") {
  s.log.unshift({ month: s.month, text, kind });
  s.log = s.log.slice(0, 180);
}
function decision(s: State, kind: Decision) {
  s.pending = { id: `${s.life}:${s.month}:${kind}`, kind };
}
export function canGather(s: State) {
  return s.path === "wood" || s.inherited === "herbal";
}
export function canTrain(s: State) {
  return s.path === "sword" || s.inherited === "sword";
}
export function breakthroughDetails(s: State, pill = false) {
  const parts = [
    { label: "炼气基础", value: 45 },
    { label: "根基", value: s.foundation },
    { label: "剑意", value: Math.floor(s.mastery / 2) },
    {
      label: "陆迟护法",
      value:
        s.story.luchi === "foundation" ? (s.story.trust >= 4 ? 15 : 10) : 0,
    },
    { label: "伤势", value: -s.injury * 5 },
    { label: "筑基丹", value: pill ? 20 : 0 },
  ];
  return {
    parts,
    chance: Math.max(
      10,
      Math.min(
        95,
        parts.reduce((n, p) => n + p.value, 0),
      ),
    ),
  };
}
export function cultivationGain(s: State) {
  return paths[s.path].gain + Math.max(0, s.root - 4);
}
export function refineCost(s: State) {
  return {
    herbs: s.wisdom >= 8 && s.study >= 2 ? 4 : 6,
    stones: s.sense >= 8 ? 8 : 12,
  };
}
export function replayHints(s: State) {
  const hints: string[] = [];
  if (s.memories.crossing !== "sense")
    hints.push("凝神至神识 8，可看见青石阵眼，另寻无伤通路。");
  if (s.memories.crossing !== "decipher")
    hints.push("选择明心善悟并研读至心得 2，可读懂石门残诀。");
  if (s.story.choice !== "self")
    hints.push("留下孤丹会得到一次护脉丹纹，帮助承受突破失败。");
  if (s.story.choice !== "gift")
    hints.push("赠丹后的故人，会以不同身份再次站在你身边。");
  if (!s.memories.confided)
    hints.push("下次读懂陆迟那封未寄出的信，或许能听见他真正的心愿。");
  return hints.slice(0, 3);
}
export function nextGoal(s: State) {
  if (s.status !== "alive")
    return "此篇已落笔，可回看履历、读取存档或新建角色。";
  if (s.pending) return "完成眼前的选择，时间已暂停。";
  if (s.story.stage === "unmet") return "第三个月，去渡口认识同行之人。";
  if (s.story.stage === "waiting" && !s.memories.letter && s.month < 12)
    return `第十二月，陆迟邀你煮茶叙旧；还有 ${12 - s.month} 个月。第三十六月仍须赴约。`;
  if (s.story.stage === "waiting" && !s.memories.visit && s.month < 24)
    return `第二十四月，陆迟将带回山外消息；还有 ${24 - s.month} 个月。第三十六月仍须赴约。`;
  if (s.story.stage === "waiting")
    return `第三十六个月与陆迟会合，还剩 ${Math.max(0, 36 - s.month)} 个月。闭关六个月若跨过约期，将失约。`;
  if (s.realm === 0) return foundationGoal(s);
  return "筑基篇即将结算。";
}
export function eventView(s: State): EventView | null {
  if (!s.pending) return null;
  const o = (
    id: string,
    label: string,
    hint: string,
    disabled?: string,
  ): Option => ({ id, label, hint, disabled });
  switch (s.pending.kind) {
    case "meeting":
      return {
        title: s.inherited === "bond" ? "旧剑上的刻痕" : "渡口相逢",
        body:
          s.inherited === "bond"
            ? "渡口少年自称陆迟。他剑柄上的刻痕，与你梦中的旧约一模一样。那场遗府之行，仿佛已经发生过。"
            : "负伤的散修陆迟托你寄一封家书。他提起第三十六个月开启的青石遗府，愿与你一起寻找筑基机缘。",
        options: [
          ...(s.inherited === "bond"
            ? [o("remember", "说出梦中的旧约", "无需灵石 · 信任 3 · 前缘专属")]
            : []),
          o(
            "aid",
            "买药相助，约定同行",
            "灵石 −8 · 信任 2 · 第三十六个月赴约",
            s.stones < 8 ? "灵石不足" : undefined,
          ),
          o(
            "promise",
            "替他送信，约定同行",
            "不花灵石 · 信任 1 · 第三十六个月赴约",
          ),
        ],
      };
    case "letter":
      return {
        title: "未寄出的家书",
        body: "茶水凉了，陆迟仍握着那封信。他说父亲当年进山采药，再没回来；母亲却每年在渡口留一盏灯。“我想筑基，不是要她再等一百年。是想有本事进山，把父亲带回家。”他低头抚过剑柄上的三道刻痕。",
        options: [
          o("listen", "陪他把这盏茶喝完", "信任 +1 · 记下他的心愿，不消耗月份"),
          o(
            "read",
            "读懂信中没有写出的那句话",
            "悟性至少 8 · 信任 +1 · 研读心得 +1",
            s.wisdom < 8 ? "需要悟性 8" : undefined,
          ),
          o("leave", "将信收好，暂不追问", "尊重他的沉默 · 不改变信任"),
        ],
      };
    case "visit":
      return {
        title: "风雪里的一盏灯",
        body: "山门外的雪还没化，陆迟已经把药包放在桌上。“上回是你帮我。这次，换我。”他没有带稀世灵物，只带来跑了三处集市换来的灵草、温养经脉的药，以及一卷他反复读过的残诀。你可以告诉他眼下最需要什么。",
        options: [
          o("herbs", "收下灵草，留作炼丹", "灵草 +4 · 陆迟仍保留其他物资"),
          o(
            "heal",
            "请他温养受损经脉",
            "伤势 −2（最低 0） · 根基 +2（上限 24）",
          ),
          o(
            "lesson",
            "与他共读残诀",
            "神识 +1（上限 12） · 研读心得 +1（上限 4）",
          ),
        ],
      };
    case "departure":
      return {
        title: "三年之约",
        body: `陆迟已经在渡口等你。${s.realm === 1 ? "你已筑基，可以从容护送他越过遗府石阵。" : "你尚在炼气。遗府有石阵与毒瘴，准备的灵草或剑意将派上用场。"}现在出发，往返需三个月；留下会失去同行与护法，但此后仍可独自探府。`,
        options: [
          o(
            "go",
            "赴约，共探遗府",
            "接下来选择破阵方式与丹药归属 · 往返三个月",
          ),
          o(
            "stay",
            "留在洞府，专心修行",
            "失约 · 陆迟独行，无护法；之后可独自重返遗府取丹",
          ),
        ],
      };
    case "crossing": {
      const alone = s.story.choice === "missed";
      return {
        title: "青石阵前",
        body:
          (alone
            ? "你独自站在遗府石门前，毒瘴与剑阵封住去路。"
            : "遗府石门外，毒瘴与剑阵交错。陆迟旧伤复发，你们需要合力过阵。") +
          "至少需要 180 修为稳住灵息，再选一种手段破阵。" +
          (alone
            ? "准备不足可退出休整，再独自回来。"
            : "准备不足可以退出，陆迟会先行；此后仍可独自取丹，但不再有赠丹护法的机会。"),
        options: foundationPassages(s).concat([
          o(
            "withdraw",
            "退出石阵，回去准备",
            alone
              ? "不耗月份、不发奖励；准备好后可独自再来"
              : "不耗月份、不发奖励；陆迟先行，失去护法机会，之后可独自重返遗府",
          ),
        ]),
      };
    }
    case "relic":
      if (s.story.choice === "missed")
        return {
          title: "独入遗府",
          body: "石阵散去，石匣中留着一枚筑基丹与刻在匣底的丹方。你拓下丹方，从此不必为每次叩关再闯此阵。这里没有等候你的故人，陆迟早已走上自己的路。",
          options: [
            o(
              "self",
              "取丹，拓下丹方",
              "筑基丹 +1 · 解锁补炼 · 一次护脉丹纹；旧约不恢复",
            ),
          ],
        };
      return {
        title:
          s.realm === 1
            ? "故人的天关"
            : s.pills > 0
              ? "丹药有余，归途同行"
              : "一丹，两条仙途",
        body:
          s.realm === 1
            ? "石匣里只有一枚筑基丹。你已筑基，陆迟却仍困在天关之前。将丹药赠他，可以让故人与你并肩；也可以留下丹药，各赴前程。"
            : s.pills > 0
              ? `你摸到行囊里已有的 ${s.pills} 枚筑基丹。这枚遗府丹不再是你唯一的机会。陆迟看见你的丹瓶，松开了紧握石匣的手：“若你愿意，我想先过天关，再护你一程。”你可以把它交给他，或留作自己再试的储备。`
              : "石匣里只有一枚筑基丹。陆迟伸出手，又停住，指节抵在匣沿：“我想要。若先筑基，也许今年就能进雾岭找父亲。”你想起闭关时撞不开的那道关隘，没有立刻答话。匣底另刻着丹方，你拓在纸上；药材可以再筹，眼前的成丹却只有一枚。陆迟将匣子放到两人中间：“你先过，我再等；若让我先过，下一炉药我守着，你叩关时也一样。”",
        options: [
          o(
            "self",
            "留下筑基丹，自寻长生",
            "筑基丹 +1 · 丹方解锁 · 一次护脉丹纹（失败保留九成、不减寿） · 无陆迟护法",
          ),
          o(
            "gift",
            "将丹药交给陆迟",
            "不获得成丹 · 丹方解锁，可购草补炼 · 陆迟筑基后护法 +10%（信任达 4 则 +15%）",
          ),
        ],
      };
  }
}
function finish(s: State, dead = false) {
  if (s.status !== "alive") return;
  s.status = dead ? "dead" : "complete";
  s.pending = null;
  s.earned = 0;
  s.result = dead
    ? "灯尽山中：寿元已尽，你走过的路与结识的人留在修行履历中。"
    : s.story.choice === "gift"
      ? "双星照渡：你与陆迟都已筑基，今后可并肩而行。那句三年之约，终于有了回音。"
      : s.story.choice === "self"
        ? s.story.luchi === "distant"
          ? "独剑入云：你独自闯过遗府，以孤丹叩开天关。丹方与护脉丹纹已经记下，渡口的旧约却无法重来。"
          : "独剑入云：你以孤丹叩开天关，记下护脉丹诀。陆迟留下家书，决定先回乡陪母亲过冬；你答应将来替他寻访父亲的下落。"
        : "山门独成：你错过了渡口之约，以自己的准备筑基。山下那道身影，已渐行渐远。";
  record(s, s.result, "major");
}
function maybeFinish(s: State) {
  if (s.realm === 1 && s.story.stage === "resolved") finish(s);
}
function missed(s: State) {
  s.story.stage = "resolved";
  s.story.choice = "missed";
  s.story.luchi = "distant";
  s.pending = null;
  record(
    s,
    "约期已过，陆迟独自离开渡口。同行的约定已经错过；你仍可准备好后独自重返青石遗府取丹。",
    "warning",
  );
}
// Death is checked before monthly rewards or story decisions.
function month(s: State) {
  s.month++;
  s.age++;
  if (s.age >= s.limit) {
    finish(s, true);
    return false;
  }
  s.stones++;
  return true;
}
function hooks(s: State) {
  if (s.pending || s.status !== "alive") return;
  if (s.story.stage === "unmet" && s.month >= 3) {
    decision(s, "meeting");
    return;
  }
  if (s.story.stage !== "waiting") return;
  if (s.month >= 36) {
    decision(s, "departure");
    return;
  }
  if (s.month >= 12 && !s.memories.letter) {
    decision(s, "letter");
    return;
  }
  if (s.month >= 24 && !s.memories.visit) decision(s, "visit");
}
// Shared adventure clock: consumes lifespan and processes appointments, without work income.
export function travelMonth(input: State): State {
  if (input.status !== "alive" || input.pending) return input;
  const s = structuredClone(input);
  const stones = s.stones;
  if (month(s)) {
    s.stones = stones;
    record(s, "行路准备耗时一月，寿元随之流逝。");
    hooks(s);
  }
  return s;
}
export function actionError(s: State, activity: Activity) {
  if (activity === "meditate" && s.sense >= 12) return "神识已达本篇上限";
  if (activity === "study" && s.study >= 4) return "研读心得已满";
  if (activity === "gather" && !canGather(s)) return "需选择长春医道";
  if (activity === "train" && !canTrain(s)) return "需选择青锋剑道";
  if (activity === "train" && s.mastery >= 12) return "剑意已满";
  if (activity === "rest" && s.injury === 0) return "当前无伤势";
  if (activity === "cultivate" && (s.qi >= MAX_QI || s.realm === 1))
    return "修为已满，可准备突破或做其他行动";
  return "";
}
export function preparationError(s: State, kind: "refine" | "retreat") {
  if (kind === "refine") {
    if (!hasFoundationRecipe(s)) return "先闯过青石遗府，取得筑基丹方";
    const cost = refineCost(s);
    if (s.herbs < cost.herbs || s.stones < cost.stones)
      return `需要灵草 ${cost.herbs}、灵石 ${cost.stones}`;
    if (
      (s.story.stage === "unmet" && s.month + 3 >= 3) ||
      (s.story.stage === "waiting" && s.month + 3 >= 36)
    )
      return "即将有约，先处理渡口之事再炼丹";
  } else {
    if (s.story.stage === "unmet") return "先去渡口相识";
    if (s.foundation >= 24) return "根基已圆满";
    if (s.stones < 8) return "需要灵石 8";
  }
  return "";
}
export function dispatch(input: State, c: Command): State {
  if (!c.id || input.seen.includes(c.id)) return input;
  if (
    (c.type === "next" || c.type === "beginChapter") &&
    c.aptitude !== undefined &&
    !Object.hasOwn(aptitudes, c.aptitude)
  )
    return input;
  const s = structuredClone(input);
  const accept = () => {
    s.seen = [...s.seen, c.id].slice(-512);
    return s;
  };
  if (c.type === "beginChapter") {
    if (s.status !== "legacy" || !s.archive || !Object.hasOwn(paths, c.path))
      return input;
    const n = createGame(s.name, c.path, s.seed, c.aptitude);
    n.life = s.archive.life + 1;
    n.legacy = s.archive.legacy;
    n.archive = s.archive;
    n.seen = [c.id];
    record(n, "旧版人生已封存，可随时导出。你以全新的十六岁之身进入筑基篇。");
    return n;
  }
  if (c.type === "next") {
    // Retained command name means a fresh character, never a reincarnation reward.
    if (
      !["complete", "dead"].includes(s.status) ||
      !Object.hasOwn(paths, c.path) ||
      c.inheritance !== "none"
    )
      return input;
    rng(s);
    const n = createGame(s.name, c.path, s.seed, c.aptitude);
    n.seen = [c.id];
    return n;
  }
  if (s.status !== "alive") return input;
  if (c.type === "revisitRelic") {
    if (relicJourneyError(s)) return input;
    s.story.stage = "crossing";
    decision(s, "crossing");
    record(
      s,
      s.story.choice === "missed"
        ? "你独自重返青石遗府。旧约已失，石阵仍在，能否取丹要靠自己的准备。"
        : "准备妥当后，你与陆迟重新来到青石阵前。",
    );
    return accept();
  }
  if (c.type === "choose") {
    if (!s.pending || s.pending.id !== c.instanceId) return input;
    const option = eventView(s)?.options.find((o) => o.id === c.option);
    if (!option || option.disabled) return input;
    const kind = s.pending.kind;
    s.pending = null;
    if (kind === "meeting") {
      s.story.stage = "waiting";
      s.story.luchi = "companion";
      s.story.trust = c.option === "remember" ? 3 : c.option === "aid" ? 2 : 1;
      if (c.option === "aid") s.stones -= 8;
      record(
        s,
        `${option.label}。陆迟与你定下第三十六个月的渡口之约。信任 ${s.story.trust}。`,
        "major",
      );
    } else if (kind === "letter") {
      s.memories.letter = true;
      if (c.option !== "leave") {
        s.memories.confided = true;
        s.story.trust = Math.min(6, s.story.trust + 1);
      }
      if (c.option === "read") s.study = Math.min(4, s.study + 1);
      record(
        s,
        `未寄出的家书：${option.label}。陆迟想入山寻找失踪的父亲，不愿母亲永远守着渡口的灯。`,
        "major",
      );
      hooks(s);
    } else if (kind === "visit") {
      s.memories.visit = true;
      s.memories.support = c.option;
      if (c.option === "herbs") s.herbs += 4;
      if (c.option === "heal") {
        s.injury = Math.max(0, s.injury - 2);
        s.foundation = Math.min(24, s.foundation + 2);
      }
      if (c.option === "lesson") {
        s.sense = Math.min(12, s.sense + 1);
        s.study = Math.min(4, s.study + 1);
      }
      record(
        s,
        `陆迟冒雪来访：${option.label}，${option.hint}。这次换他照顾你。`,
        "major",
      );
      hooks(s);
    } else if (kind === "departure") {
      if (c.option === "stay") {
        missed(s);
        maybeFinish(s);
      } else {
        s.story.stage = "crossing";
        decision(s, "crossing");
        record(s, "你准时赴约，与陆迟进入青石遗府。");
      }
    } else if (kind === "crossing") {
      if (c.option === "withdraw") {
        const alone = s.story.choice === "missed";
        if (alone) s.story.stage = "resolved";
        else missed(s);
        record(
          s,
          alone
            ? "你独自退出石阵。丹药尚未取得，准备好后仍可再来。"
            : "你暂退石阵，陆迟先行。丹药尚未取得；准备好后可独自再来，旧约不会恢复。",
        );
        return accept();
      }
      if (c.option === "medicine") s.herbs -= 4;
      s.injury = Math.min(
        6,
        s.injury +
          (c.option === "detour"
            ? 2
            : ["blade", "endure"].includes(c.option)
              ? 1
              : 0),
      );
      if (s.story.choice !== "missed")
        s.story.trust = Math.min(6, s.story.trust + 1);
      s.memories.crossing = c.option;
      record(s, `${option.label}：${option.hint}。`);
      s.story.stage = "relic";
      decision(s, "relic");
    } else {
      const alone = s.story.choice === "missed";
      s.story.choice = c.option === "gift" ? "gift" : "self";
      s.story.stage = "resolved";
      if (c.option === "gift") {
        s.story.luchi = "foundation";
        s.story.trust = Math.min(6, s.story.trust + 2);
        record(
          s,
          s.pills > 0
            ? `你将遗府所得的筑基丹交给陆迟，行囊中自备的 ${s.pills} 枚丹药仍留给自己。他筑基后承诺为你护法，突破概率随信任增加 10–15%。`
            : "你将遗府中唯一的筑基丹交给陆迟。他筑基后承诺为你护法，突破概率随信任增加 10–15%。",
          "major",
        );
      } else {
        s.pills++;
        s.ward = true;
        record(
          s,
          alone
            ? "你独自取出筑基丹，拓下丹方与护脉丹纹：可抵消一次失败的减寿，保留九成修为。旧约已失，丹方留待日后补炼。"
            : "你留下孤丹并拓下匣底丹方与护脉丹纹：可抵消一次突破失败的减寿，保留九成修为。陆迟说：“那我先回家。等你出关，替我去山里看一眼。”",
          "major",
        );
      }
      for (let i = 0; i < 3; i++) if (!month(s)) break;
      if (s.status === "alive") {
        record(
          s,
          alone
            ? "三个月后，你独自离开遗府，带着丹方回到听松山。"
            : "三个月后，你们带着丹方离开遗府。回望石门时，你试着抬手引气，想知道筑基之后，眼前的山风会不会也变得不同。",
        );
        maybeFinish(s);
      }
    }
    return accept();
  }
  if (s.pending) return input;
  if (c.type === "advance") {
    if (
      ![
        "cultivate",
        "gather",
        "train",
        "work",
        "rest",
        "meditate",
        "study",
      ].includes(c.activity) ||
      !Number.isInteger(c.months) ||
      c.months < 1 ||
      c.months > 12 ||
      actionError(s, c.activity)
    )
      return input;
    for (let i = 0; i < c.months; i++) {
      const previousQi = s.qi;
      if (actionError(s, c.activity) || !month(s)) break;
      if (c.activity === "cultivate")
        s.qi = Math.min(MAX_QI, s.qi + cultivationGain(s));
      if (c.activity === "gather") {
        s.herbs += 2;
        s.qi = Math.min(MAX_QI, s.qi + 3);
      }
      if (c.activity === "train") {
        s.mastery++;
        s.qi = Math.min(MAX_QI, s.qi + 10);
        if (s.mastery % 4 === 0) s.injury = Math.min(6, s.injury + 1);
      }
      if (c.activity === "meditate") {
        s.sense = Math.min(12, s.sense + 1);
        s.qi = Math.min(MAX_QI, s.qi + 2);
      }
      if (c.activity === "study")
        s.study = Math.min(4, s.study + (s.wisdom >= 8 ? 2 : 1));
      if (c.activity === "work") s.stones += 4;
      if (c.activity === "rest") s.injury = Math.max(0, s.injury - 1);
      if (c.activity !== "cultivate")
        record(
          s,
          `${{ meditate: "凝神内观，神识 +1（上限 12）、修为 +2", study: `研读残卷，心得 +${s.wisdom >= 8 ? 2 : 1}（上限 4）`, gather: "采药得灵草二株，修为 +3", train: "历练剑意 +1，修为 +10；每四重剑意累积一层伤势", work: "山下劳作，额外灵石 +4", rest: "静养经脉，伤势 −1" }[c.activity]}。`,
        );
      hooks(s);
      if (
        s.pending ||
        (previousQi < MAX_QI && s.qi === MAX_QI && s.realm === 0)
      )
        break;
    }
    return accept();
  }
  if (c.type === "prepare") {
    if (!["refine", "retreat"].includes(c.kind) || preparationError(s, c.kind))
      return input;
    if (c.kind === "refine") {
      const cost = refineCost(s);
      s.herbs -= cost.herbs;
      s.stones -= cost.stones;
      for (let i = 0; i < 3; i++) if (!month(s)) break;
      if (s.status === "alive") {
        s.pills++;
        s.crafted++;
        record(
          s,
          `耗时三个月炼成筑基丹：灵草 −${cost.herbs}、灵石 −${cost.stones}。悟性配合研读可省灵草，神识控火可省灵石。`,
          "major",
        );
        hooks(s);
      }
    } else {
      s.stones -= 8;
      for (let i = 0; i < 6; i++) if (!month(s)) break;
      if (s.status === "alive") {
        s.foundation = Math.min(24, s.foundation + 6);
        s.qi = Math.min(MAX_QI, s.qi + 30);
        record(s, "闭关六个月：根基 +6、修为 +30。世间约期仍在流逝。");
        if (s.story.stage === "waiting" && s.month >= 36) missed(s);
        maybeFinish(s);
        hooks(s);
      }
    }
    return accept();
  }
  if (c.type === "break") {
    if (breakthroughError(s) || !c.pill) return input;
    const chance = breakthroughDetails(s, c.pill).chance,
      roll = Math.floor(rng(s) * 100) + 1;
    if (c.pill) s.pills--;
    if (roll <= chance) {
      s.realm = 1;
      s.qi = 0;
      s.limit += 216;
      s.result = `筑基成功：判定 ${roll}/100，成功率 ${chance}%。寿元 +18 年。`;
      record(s, s.result, "major");
      maybeFinish(s);
    } else {
      const protectedFailure = s.ward;
      s.qi = Math.floor((s.qi * (protectedFailure ? 9 : 7)) / 10);
      s.ward = false;
      s.injury = Math.min(6, s.injury + 2);
      if (!protectedFailure) s.limit -= 12;
      s.result = `突破未成：判定 ${roll}/100，成功率 ${chance}%。${protectedFailure ? "护脉丹纹消耗：保留九成修为、不减寿" : "修为保留七成、寿元上限 −1 年"}，伤势 +2；可养伤、炼丹或再打磨根基。`;
      record(s, s.result, "warning");
      if (s.age >= s.limit) finish(s, true);
    }
    return accept();
  }
  return input;
}
const oneOf = (v: unknown, values: readonly unknown[]) => values.includes(v);
const int = (v: unknown, min = 0, max = 1e9) =>
  Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
export function validState(x: unknown): x is State {
  if (!x || typeof x !== "object") return false;
  const s = x as State;
  if (
    s.version !== 3 ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    s.name.length > 16 ||
    !oneOf(s.path, ["wood", "sword"]) ||
    !oneOf(s.status, ["alive", "complete", "dead", "legacy"])
  )
    return false;
  if (
    !Object.hasOwn(aptitudes, s.aptitude) ||
    s.root !== aptitudes[s.aptitude].root ||
    s.wisdom !== aptitudes[s.aptitude].wisdom ||
    !int(s.sense, aptitudes[s.aptitude].sense, 12) ||
    !int(s.study, 0, 4) ||
    typeof s.ward !== "boolean"
  )
    return false;
  if (
    !s.memories ||
    !["letter", "visit", "confided"].every(
      (k) => typeof s.memories[k as keyof State["memories"]] === "boolean",
    ) ||
    !oneOf(s.memories.support, ["none", "herbs", "heal", "lesson"]) ||
    !oneOf(s.memories.crossing, [
      "none",
      "protect",
      "memory",
      "medicine",
      "blade",
      "detour",
      "endure",
      "sense",
      "decipher",
    ])
  )
    return false;
  if (s.memories.confided && !s.memories.letter) return false;
  if (
    !int(s.seed, 1, 0xffffffff) ||
    !int(s.life, 1) ||
    ![
      "month",
      "age",
      "limit",
      "stones",
      "herbs",
      "pills",
      "legacy",
      "earned",
      "crafted",
    ].every((k) => int(s[k as keyof State]))
  )
    return false;
  if (
    !int(s.realm, 0, 1) ||
    !int(s.qi, 0, 360) ||
    !int(s.foundation, 0, 24) ||
    !int(s.mastery, 0, 12) ||
    !int(s.injury, 0, 6) ||
    typeof s.result !== "string"
  )
    return false;
  if (
    !s.story ||
    !oneOf(s.story.stage, [
      "unmet",
      "waiting",
      "crossing",
      "relic",
      "resolved",
    ]) ||
    !int(s.story.trust, 0, 6) ||
    s.story.deadline !== 36 ||
    !oneOf(s.story.choice, ["none", "self", "gift", "missed"]) ||
    !oneOf(s.story.luchi, ["stranger", "companion", "foundation", "distant"])
  )
    return false;
  if (
    !oneOf(s.inherited, Object.keys(inheritances)) ||
    !Array.isArray(s.unlocked) ||
    s.unlocked.length > 4 ||
    new Set(s.unlocked).size !== s.unlocked.length ||
    !s.unlocked.every((k) => oneOf(k, ["herbal", "sword", "bond", "ember"]))
  )
    return false;
  if (s.inherited !== "none" && !s.unlocked.includes(s.inherited)) return false;
  if (
    !Array.isArray(s.seen) ||
    s.seen.length > 512 ||
    !s.seen.every((k) => typeof k === "string") ||
    !Array.isArray(s.log) ||
    s.log.length > 180 ||
    !s.log.every(
      (l) =>
        l &&
        typeof l.text === "string" &&
        typeof l.kind === "string" &&
        int(l.month),
    )
  )
    return false;
  if (s.archive !== null && !validLegacy(s.archive)) return false;
  if (s.status === "legacy" && s.archive === null) return false;
  if (s.status === "alive" && s.age >= s.limit) return false;
  if (
    s.status === "complete" &&
    (s.realm !== 1 || s.story.stage !== "resolved")
  )
    return false;
  if (s.pending !== null) {
    if (
      s.status !== "alive" ||
      !s.pending ||
      typeof s.pending.id !== "string" ||
      !oneOf(s.pending.kind, [
        "meeting",
        "departure",
        "crossing",
        "relic",
        "letter",
        "visit",
      ])
    )
      return false;
    if (s.pending.id !== `${s.life}:${s.month}:${s.pending.kind}`) return false;
    if (
      (
        {
          letter: "waiting",
          visit: "waiting",
          meeting: "unmet",
          departure: "waiting",
          crossing: "crossing",
          relic: "relic",
        } as const
      )[s.pending.kind] !== s.story.stage
    )
      return false;
  }
  if (
    s.status === "alive" &&
    ["crossing", "relic"].includes(s.story.stage) &&
    s.pending === null
  )
    return false;
  if (s.story.stage === "resolved" && s.story.choice === "none") return false;
  return true;
}
export function migrateSave(value: unknown): State {
  if (validState(value)) return structuredClone(value);
  if (validV2(value)) {
    const upgraded: State = {
      ...structuredClone(value),
      version: 3,
      aptitude: "insightful",
      root: 4,
      wisdom: 8,
      sense: 3,
      study: 0,
      ward: false,
      memories: {
        letter: value.month >= 12,
        visit: value.month >= 24,
        confided: false,
        support: "none",
        crossing: "none",
      },
    };
    if (
      value.story.choice === "self" &&
      ["complete", "dead"].includes(value.status) &&
      !upgraded.unlocked.includes("ember")
    )
      upgraded.unlocked.push("ember");
    record(
      upgraded,
      "人物与资质版已接续旧进度：补入明心善悟资质。已经过去的相处节点不补发奖励；新建角色时可重新选择资质。",
    );
    return upgraded;
  }
  if (validLegacy(value)) {
    const s = createGame(
      value.name,
      value.path === "sword" ? "sword" : "wood",
      value.seed,
    );
    s.status = "legacy";
    s.archive = structuredClone(value);
    s.life = value.life;
    s.legacy = value.legacy;
    s.result =
      "旧版人生已完整封存。筑基篇采用新规则，确认后以十六岁重新开篇；旧版人物、境界、资源与卷宗均保留在原档中。";
    return s;
  }
  throw new Error("存档格式不受支持或已损坏，原始数据未被修改。");
}
