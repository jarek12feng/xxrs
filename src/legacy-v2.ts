import {
  validState as validLegacy,
  type State as LegacyState,
} from "./legacy-v1";
export type Path = "wood" | "sword";
export type Inheritance = "none" | "herbal" | "sword" | "bond";
export type Activity = "cultivate" | "gather" | "train" | "work" | "rest";
export type Stage = "unmet" | "waiting" | "crossing" | "relic" | "resolved";
export type Decision = "meeting" | "departure" | "crossing" | "relic";
export const paths = {
  wood: {
    name: "长春医道",
    label: "采药 · 炼丹 · 济人",
    gain: 10,
    description:
      "用修行时间培育灵草，亲手炼制筑基丹。丹药与救人，都有可掌握的来路。",
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
  none: { name: "白纸新生", description: "不带传承，重新选择这一世的道路。" },
  herbal: {
    name: "长春丹札",
    description: "初始灵草 +4；跨路线采药炼丹。亲手炼丹后结算解锁。",
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
  version: 2;
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
  | { id: string; type: "next"; path: Path; inheritance: Inheritance }
  | { id: string; type: "beginChapter"; path: Path };
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
export function createGame(name: string, path: Path, seed = 12345): State {
  return {
    version: 2,
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
export function nextGoal(s: State) {
  if (s.status !== "alive") return "此篇已落笔，选择传承与下一世路线。";
  if (s.story.stage === "unmet") return "第三个月，去渡口认识同行之人。";
  if (s.story.stage === "waiting")
    return `第三十六个月与陆迟会合，还剩 ${Math.max(0, 36 - s.month)} 个月。闭关六个月若跨过约期，将失约。`;
  if (s.pending) return "完成眼前的选择，时间已暂停。";
  if (s.realm === 0)
    return "陆迟的故事已有答案。积满修为、准备突破，写下本篇结局。";
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
    case "departure":
      return {
        title: "三年之约",
        body: `陆迟已经在渡口等你。${s.realm === 1 ? "你已筑基，可以从容护送他越过遗府石阵。" : "你尚在炼气。遗府有石阵与毒瘴，准备的灵草或剑意将派上用场。"}现在出发，往返需三个月；留下则永远错过本世遗府。`,
        options: [
          o(
            "go",
            "赴约，共探遗府",
            "接下来选择破阵方式与丹药归属 · 往返三个月",
          ),
          o(
            "stay",
            "留在洞府，专心修行",
            "失约 · 陆迟独行，无丹药与护法；仍可自行筑基",
          ),
        ],
      };
    case "crossing":
      return {
        title: "青石阵前",
        body: "遗府石门外，毒瘴与剑阵交错。陆迟旧伤复发，必须决定如何带他过去。所有风险都摆在眼前。",
        options: [
          ...(s.realm === 1
            ? [o("protect", "以筑基修为护送", "无伤通过 · 信任 +1")]
            : []),
          ...(s.inherited === "bond"
            ? [o("memory", "沿梦中的旧路绕行", "前缘专属 · 无伤通过 · 信任 +1")]
            : []),
          o(
            "medicine",
            "以灵草解瘴",
            "灵草 −4 · 无伤通过 · 信任 +1",
            s.herbs < 4 ? "需要 4 株灵草" : undefined,
          ),
          o(
            "blade",
            "以剑意破阵",
            "剑意至少 4 · 伤势 +1 · 信任 +1",
            s.mastery < 4 ? "需要 4 点剑意" : undefined,
          ),
          o(
            "detour",
            "搀扶陆迟，强行绕过",
            "无需准备 · 伤势 +2 · 后续可养伤恢复",
          ),
        ],
      };
    case "relic":
      return {
        title: "一丹，两条仙途",
        body:
          s.realm === 1
            ? "石匣里只有一枚筑基丹。你已筑基，陆迟却仍困在天关之前。将丹药赠他，可以让故人与你并肩；也可以留下丹药，各赴前程。"
            : "石匣里只有一枚筑基丹。陆迟把石匣推到你面前：“一路承蒙照顾，你来决定。”丹药给你，可以帮助自己的突破；给他，他将先一步筑基，并为你护法。",
        options: [
          o(
            "self",
            "留下筑基丹，自寻长生",
            "筑基丹 +1 · 陆迟仍在炼气 · 本世无护法 · 保留独行结局",
          ),
          o(
            "gift",
            "将丹药交给陆迟",
            "不获得丹药 · 陆迟筑基后护法 +10%（信任达 4 则 +15%） · 结算解锁「渡口旧约」",
          ),
        ],
      };
  }
}
function finish(s: State, dead = false) {
  if (s.status !== "alive") return;
  s.status = dead ? "dead" : "complete";
  s.pending = null;
  s.earned = 3 + (dead ? 0 : 2) + (s.story.choice === "gift" ? 1 : 0);
  s.legacy += s.earned;
  const unlock = (key: Inheritance) => {
    if (!s.unlocked.includes(key)) s.unlocked.push(key);
  };
  if (s.crafted > 0) unlock("herbal");
  if (s.mastery >= 4) unlock("sword");
  if (s.story.choice === "gift") unlock("bond");
  s.result = dead
    ? "灯尽山中：你未能完成此篇，但修行所得仍可传给下一世。"
    : s.story.choice === "gift"
      ? "双星照渡：你与陆迟都已筑基，今后可并肩而行。那句三年之约，终于有了回音。"
      : s.story.choice === "self"
        ? "独剑入云：你带走丹药，独自跨过天关。陆迟尚在炼气，你们各赴前程。"
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
    "约期已过。陆迟独自离开渡口，本世遗府关闭。此后你只能靠自己准备突破。",
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
  if (s.story.stage === "unmet" && s.month >= 3) decision(s, "meeting");
  if (s.story.stage === "waiting" && s.month === 18)
    record(
      s,
      "陆迟来信：遗府第三十六个月开启。带四株灵草可解瘴，剑意四重可破阵，筑基修士也能从容通行。",
    );
  if (s.story.stage === "waiting" && s.month >= 36) decision(s, "departure");
}
export function actionError(s: State, activity: Activity) {
  if (activity === "gather" && !canGather(s)) return "需长春医道或长春丹札传承";
  if (activity === "train" && !canTrain(s)) return "需青锋剑道或青锋残谱传承";
  if (activity === "train" && s.mastery >= 12) return "剑意已满";
  if (activity === "rest" && s.injury === 0) return "当前无伤势";
  if (activity === "cultivate" && (s.qi >= MAX_QI || s.realm === 1))
    return "修为已满，可准备突破或做其他行动";
  return "";
}
export function preparationError(s: State, kind: "refine" | "retreat") {
  if (kind === "refine") {
    if (!canGather(s)) return "需长春医道或长春丹札";
    if (s.herbs < 6 || s.stones < 12) return "需要灵草 6、灵石 12";
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
  const s = structuredClone(input);
  const accept = () => {
    s.seen = [...s.seen, c.id].slice(-512);
    return s;
  };
  if (c.type === "beginChapter") {
    if (s.status !== "legacy" || !s.archive || !Object.hasOwn(paths, c.path))
      return input;
    const n = createGame(s.name, c.path, s.seed);
    n.life = s.archive.life + 1;
    n.legacy = s.archive.legacy;
    n.archive = s.archive;
    n.seen = [c.id];
    record(n, "旧版人生已封存，可随时导出。你以全新的十六岁之身进入筑基篇。");
    return n;
  }
  if (c.type === "next") {
    if (
      !["complete", "dead"].includes(s.status) ||
      !Object.hasOwn(paths, c.path) ||
      !Object.hasOwn(inheritances, c.inheritance) ||
      (c.inheritance !== "none" && !s.unlocked.includes(c.inheritance))
    )
      return input;
    rng(s);
    const n = createGame(s.name, c.path, s.seed);
    n.life = s.life + 1;
    n.legacy = s.legacy;
    n.unlocked = [...s.unlocked];
    n.archive = s.archive;
    n.inherited = c.inheritance;
    n.seen = [c.id];
    if (c.inheritance === "herbal") n.herbs = 4;
    if (c.inheritance === "sword") n.mastery = 2;
    record(
      n,
      `第 ${n.life} 世，选择${paths[c.path].name}，带来「${inheritances[c.inheritance].name}」。传承每世只选一项，不叠加。`,
      "major",
    );
    return n;
  }
  if (s.status !== "alive") return input;
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
      if (c.option === "medicine") s.herbs -= 4;
      s.injury = Math.min(
        6,
        s.injury + (c.option === "detour" ? 2 : c.option === "blade" ? 1 : 0),
      );
      if (c.option !== "detour") s.story.trust++;
      record(s, `${option.label}：${option.hint}。`);
      s.story.stage = "relic";
      decision(s, "relic");
    } else {
      s.story.choice = c.option === "gift" ? "gift" : "self";
      s.story.stage = "resolved";
      if (c.option === "gift") {
        s.story.luchi = "foundation";
        s.story.trust += 2;
        record(
          s,
          "你将唯一的筑基丹交给陆迟。他筑基后承诺为你护法，突破概率随信任增加 10–15%。",
          "major",
        );
      } else {
        s.pills++;
        record(
          s,
          "你留下遗府筑基丹，陆迟尊重你的选择，仍以炼气之身寻找自己的路。",
          "major",
        );
      }
      for (let i = 0; i < 3; i++) if (!month(s)) break;
      if (s.status === "alive") {
        record(s, "三个月后，你们离开遗府，回到听松山。");
        maybeFinish(s);
      }
    }
    return accept();
  }
  if (s.pending) return input;
  if (c.type === "advance") {
    if (
      !["cultivate", "gather", "train", "work", "rest"].includes(c.activity) ||
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
        s.qi = Math.min(MAX_QI, s.qi + paths[s.path].gain);
      if (c.activity === "gather") {
        s.herbs += 2;
        s.qi = Math.min(MAX_QI, s.qi + 3);
      }
      if (c.activity === "train") {
        s.mastery++;
        s.qi = Math.min(MAX_QI, s.qi + 10);
        if (s.mastery % 4 === 0) s.injury = Math.min(6, s.injury + 1);
      }
      if (c.activity === "work") s.stones += 4;
      if (c.activity === "rest") s.injury = Math.max(0, s.injury - 1);
      if (c.activity !== "cultivate")
        record(
          s,
          `${{ gather: "采药得灵草二株，修为 +3", train: "历练剑意 +1，修为 +10；每四重剑意累积一层伤势", work: "山下劳作，额外灵石 +4", rest: "静养经脉，伤势 −1" }[c.activity]}。`,
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
      s.herbs -= 6;
      s.stones -= 12;
      for (let i = 0; i < 3; i++) if (!month(s)) break;
      if (s.status === "alive") {
        s.pills++;
        s.crafted++;
        record(
          s,
          "耗时三个月炼成筑基丹：灵草 −6、灵石 −12。丹药可与陆迟护法叠加。",
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
      }
    }
    return accept();
  }
  if (c.type === "break") {
    if (s.realm !== 0 || s.qi < MAX_QI || (c.pill && s.pills < 1)) return input;
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
      s.qi = Math.floor((s.qi * 7) / 10);
      s.injury = Math.min(6, s.injury + 2);
      s.limit -= 12;
      s.result = `突破未成：判定 ${roll}/100，成功率 ${chance}%。修为保留七成，伤势 +2、寿元上限 −1 年；可养伤、炼丹或再打磨根基。`;
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
    s.version !== 2 ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    s.name.length > 16 ||
    !oneOf(s.path, ["wood", "sword"]) ||
    !oneOf(s.status, ["alive", "complete", "dead", "legacy"])
  )
    return false;
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
    s.unlocked.length > 3 ||
    new Set(s.unlocked).size !== s.unlocked.length ||
    !s.unlocked.every((k) => oneOf(k, ["herbal", "sword", "bond"]))
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
      !oneOf(s.pending.kind, ["meeting", "departure", "crossing", "relic"])
    )
      return false;
    if (s.pending.id !== `${s.life}:${s.month}:${s.pending.kind}`) return false;
    if (
      (
        {
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
