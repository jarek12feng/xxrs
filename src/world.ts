import { validRoadV9 } from "./legacy-road-v9";
import * as chapter from "./chapter";
import { freshMist, validMist, runMist, type MistAction } from "./mist";
export * from "./mist";
import { freshRoad, validRoad, runRoad, type RoadAction } from "./road";
export * from "./road";
import { validState as validV4 } from "./legacy-v4";
import {
  freshSocial,
  validSocial,
  dispatchSocial,
  socialCommands,
  heartEvent,
  relationshipGoal,
  type SocialState,
  type SocialCommand,
  type Gender,
} from "./social";
export * from "./chapter";
export * from "./social";

export const techniques = {
  spring: { name: "长春诀", slot: "main", hint: "吐纳每月额外 +3 修为" },
  blade: { name: "听松剑经", slot: "main", hint: "历练每月额外 +4 修为" },
  breath: { name: "归元息", slot: "main", hint: "劳作每月额外 +4 修为" },
  herb: { name: "辨草录", slot: "support", hint: "采药每月额外 +1 灵草" },
  guard: { name: "护身诀", slot: "support", hint: "历练不新增伤势" },
  lantern: {
    name: "照夜篇",
    slot: "support",
    hint: "凝神同时获得 1 研读心得，上限 4",
  },
} as const;
export type Technique = keyof typeof techniques;
export type Branch = "none" | "dan" | "jian";
export type Place = "valley" | "peak" | "sea";
export type TrialPlace = "peak" | "sea";
export type Relic = "vial" | "sword";
export const relics = {
  vial: { name: "归元灵瓶", hint: "应对妖修的瘴气额外 +8；失败少受 1 层伤势" },
  sword: { name: "听松灵剑", hint: "应对邪修的袭击额外 +8" },
};
export const opponents = {
  guardian: {
    name: "石角 · 守境妖修",
    description:
      "他守着族人的药圃，误以为闯入者又来盗药。你可以闯过他的瘴阵，也可以带药与心得交涉。",
    base: 18,
  },
  raider: {
    name: "乌灯客 · 夺宝邪修",
    description:
      "他盯上了你的旧图，在必经之路布下劫阵。退回准备不会丢失线索，盲目硬闯则可能负伤。",
    base: 14,
  },
} as const;
export interface Encounter {
  kind: keyof typeof opponents;
  attempts: number;
  aid: "none" | "mentor" | "luchi";
  passed: boolean;
  lastRoll: number;
  lastChance: number;
  outcome: "none" | "win" | "loss" | "peace";
}
export type QueueAction = chapter.Activity | "refine";
export const queueActions: Record<QueueAction, string> = {
  cultivate: "吐纳",
  gather: "采药",
  train: "历练",
  work: "劳作",
  rest: "养伤",
  meditate: "凝神",
  study: "研读",
  refine: "炼丹（三月一次）",
};
export const places = {
  valley: {
    name: "回春谷",
    goal: "找到失踪采药人的旧营地",
    reward: "辨草录 · 雾岭线索",
    realm: 0,
  },
  peak: {
    name: "雾岭古道",
    goal: "循药篓刻痕寻找山中幸存者",
    reward: "照夜篇 · 雾海航图",
    realm: 1,
  },
  sea: {
    name: "雾海孤灯",
    goal: "查明那盏为归人点亮的灯",
    reward: "父亲来信 · 本版探索终章",
    realm: 1,
  },
} as const;
export interface Journey {
  branch: Branch;
  rank: 0 | 1;
  contribution: number;
  duties: number;
  mentor: boolean;
  known: Technique[];
  main: Technique | null;
  support: Technique | null;
  maps: Record<Place, number>;
  approach: "none" | "rescue" | "trace";
  settled: boolean;
  queue: { action: QueueAction; remaining: number }[];
  relics: Record<Relic, number>;
  equipped: Relic | null;
  encounters: Record<TrialPlace, Encounter | null>;
}
import {
  freshAdventure,
  validAdventure,
  runAdventure,
  type Adventure,
  type AdventureAction,
} from "./adventure";
export * from "./adventure";
export interface State extends Omit<chapter.State, "version"> {
  version: 10;
  adventure: Adventure;
  journey: Journey;
  social: SocialState;
}
export type Command =
  | chapter.Command
  | SocialCommand
  | { id: string; type: "mist"; action: MistAction }
  | { id: string; type: "road"; action: RoadAction }
  | { id: string; type: "adventure"; action: AdventureAction }
  | { id: string; type: "join"; branch: Exclude<Branch, "none"> }
  | { id: string; type: "duty"; duty: "herbs" | "watch" | "copy" }
  | { id: string; type: "promote" }
  | { id: string; type: "supplies" }
  | { id: string; type: "forge" | "equipRelic"; relic: Relic }
  | { id: string; type: "aid"; place: TrialPlace; helper: "mentor" | "luchi" }
  | {
      id: string;
      type: "challenge";
      place: TrialPlace;
      mode: "fight" | "parley";
    }
  | { id: string; type: "mentor"; answer: "care" | "seek" }
  | { id: string; type: "enqueue"; action: QueueAction; repeat: number }
  | { id: string; type: "clearQueue" | "queueTick" }
  | { id: string; type: "learn"; technique: Technique }
  | { id: string; type: "equip"; technique: Technique }
  | { id: string; type: "explore"; place: Place; approach?: "rescue" | "trace" }
  | { id: string; type: "retire" | "continue" };
export type Intent = Command extends infer C
  ? C extends Command
    ? Omit<C, "id">
    : never
  : never;
const fresh = (): Journey => ({
  branch: "none",
  rank: 0,
  contribution: 0,
  duties: 0,
  mentor: false,
  known: [],
  main: null,
  support: null,
  maps: { valley: 0, peak: 0, sea: 0 },
  approach: "none",
  settled: false,
  queue: [],
  relics: { vial: 0, sword: 0 },
  equipped: null,
  encounters: { peak: null, sea: null },
});
function base(s: State): chapter.State {
  const { journey: _, social: __, adventure: ___, ...rest } = s;
  return { ...rest, version: 3 };
}
function lift(
  s: chapter.State,
  journey = fresh(),
  social = freshSocial(),
  adventure = freshAdventure(true),
): State {
  return { ...s, version: 10, journey, social, adventure };
}
export function createGame(
  name: string,
  path: chapter.Path,
  seed = 12345,
  aptitude: chapter.Aptitude = "insightful",
  gender: Gender | null = null,
): State {
  return lift(
    chapter.createGame(name, path, seed, aptitude),
    fresh(),
    freshSocial(gender),
    freshAdventure(),
  );
}
export const eventView = (s: State) => {
  const event = s.pending ? chapter.eventView(base(s)) : heartEvent(s);
  if (event && s.pending?.kind === "meeting" && s.adventure.step === "done")
    return {
      ...event,
      title: "渡口再逢 · 未寄的家书",
      body:
        "救回药工后，你再次遇见陆迟。这次他提起了自己的家事，托你寄一封家书，并邀你在第三十六个月一起寻找青石遗府的筑基机缘。" +
        (s.inherited === "bond" ? "他的旧剑又唤起了你前世的记忆。" : ""),
    };
  return event;
};
export const activeEventId = (s: State) =>
  s.pending?.id ?? s.social.scene?.id ?? "";
export const canGather = (s: State) => chapter.canGather(base(s));
export const canTrain = (s: State) => chapter.canTrain(base(s));
export const breakthroughDetails = (s: State, pill = false) =>
  chapter.breakthroughDetails(base(s), pill);
export const refineCost = (s: State) => chapter.refineCost(base(s));
export const replayHints = (s: State) => chapter.replayHints(base(s));
export const actionError = (s: State, a: chapter.Activity) =>
  a === "cultivate" && s.realm === 1
    ? "筑基后可凝神、固本、准备灵器并探索山外；金丹未开放"
    : chapter.actionError(base(s), a);
export const preparationError = (s: State, k: "refine" | "retreat") => {
  const error = chapter.preparationError(base(s), k);
  return error === "先去渡口相识" && s.adventure.step === "done"
    ? "先修行至第三月，与陆迟再叙旧约"
    : error;
};
export const cultivationGain = (s: State) =>
  chapter.cultivationGain(base(s)) + (s.journey.main === "spring" ? 3 : 0);
function log(s: State, text: string) {
  s.log.unshift({ month: s.month, text, kind: "story" });
  s.log = s.log.slice(0, 180);
}
function learn(s: State, t: Technique) {
  if (!s.journey.known.includes(t)) {
    s.journey.known.push(t);
    log(s, `领悟「${techniques[t].name}」。可在功法栏装配。`);
  }
}
function roll(s: State) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0 || 1;
  return s.seed / 4294967296;
}
export function challengeDetails(s: State, p: TrialPlace) {
  const e = s.journey.encounters[p];
  if (!e) return null;
  const equipped = s.journey.equipped;
  const gear = equipped
    ? s.journey.relics[equipped] * 10 +
      ((equipped === "vial" && e.kind === "guardian") ||
      (equipped === "sword" && e.kind === "raider")
        ? 8
        : 0)
    : 0;
  const terms = [
    { name: "应敌基础", value: opponents[e.kind].base },
    { name: "根骨与神识", value: s.root + s.sense * 2 },
    { name: "根基与剑意", value: Math.floor(s.foundation / 2) + s.mastery },
    { name: "研读心得", value: s.study * 5 },
    {
      name: "装配功法",
      value: (s.journey.main ? 4 : 0) + (s.journey.support ? 4 : 0),
    },
    { name: "灵器与针对性", value: gear },
    { name: "同行援助", value: e.aid !== "none" ? 20 : 0 },
    { name: "伤势", value: -s.injury * 5 },
    { name: "雾海险境", value: p === "sea" ? -8 : 0 },
  ];
  return {
    terms,
    chance: Math.max(
      5,
      Math.min(
        100,
        terms.reduce((a, b) => a + b.value, 0),
      ),
    ),
    damage: Math.max(0, (p === "sea" ? 2 : 1) - (equipped === "vial" ? 1 : 0)),
  };
}
export function forgeError(s: State, r: Relic) {
  if (!Object.hasOwn(relics, r)) return "未知灵器";
  if (s.journey.relics[r] >= 2) return "已精炼至本版上限";
  if (s.journey.relics[r] === 1 && s.realm !== 1) return "筑基后可精炼";
  if (s.study < 2 || s.stones < 24 || s.herbs < 4)
    return "需心得 2、灵石 24、灵草 4";
  return "";
}
export function aidError(s: State, p: TrialPlace, helper: "mentor" | "luchi") {
  const e = s.journey.encounters[p];
  if (!e || e.passed || s.journey.maps[p] !== 1) return "尚无待应对的挑战";
  if (e.aid !== "none") return "已有一位同行者，不叠加援助";
  if (helper === "mentor" && !s.journey.mentor) return "需先获得执事认可";
  if (
    helper === "luchi" &&
    (s.story.luchi !== "foundation" || s.story.trust < 3)
  )
    return "需陆迟已筑基且信任至少 3";
  return "";
}
export function nextGoal(s: State) {
  if (s.social.arena.duel)
    return "擂台交锋中：查看对手意图，选择应对方式，或主动认负。时间暂停。";
  if (s.social.scene) return "眼前的人在等你的回应，完成对话后再继续修行。";
  if (s.story.stage === "unmet" && s.adventure.step === "done")
    return "药工已平安归家。先修炼与休整，第三个月赴渡口，再听陆迟未说完的心事。";
  if (s.realm === 0 || s.story.stage !== "resolved")
    return chapter.nextGoal(base(s));
  if (s.journey.maps.valley < 3)
    return "筑基不是终点：前往回春谷，追查采药人的旧营地。";
  if (s.journey.maps.peak < 3)
    return "进入雾岭古道：凭宗门外门资格，或神识 8 与心得 2 自行识路。";
  if (s.journey.maps.sea < 3)
    return "航图已得：前往雾海孤灯，替等待的人带回一封信。";
  return `雾海来信已送达。可参加听松擂台、补齐功法或主动轮回。${relationshipGoal(s)}`;
}
export function explorationError(s: State, p: Place) {
  if (!Object.hasOwn(places, p)) return "未知区域";
  if (s.journey.maps[p] >= 3) return "此地故事已完成";
  if (s.story.stage === "unmet") return "先完成渡口初逢";
  if (s.realm < places[p].realm) return "需先突破筑基";
  if (p !== "valley" && s.story.stage !== "resolved") return "先了结渡口旧约";
  if (p === "peak" && s.journey.maps.valley < 3) return "先寻找回春谷的刻痕";
  if (p === "peak" && s.journey.rank !== 1 && !(s.sense >= 8 && s.study >= 2))
    return "需外门资格，或神识 8、心得 2（散修识路）";
  if (p === "sea" && s.journey.maps.peak < 3) return "需雾岭航图";
  if (s.injury > 2) return "伤势需降至 2 以下或等于 2";
  return "";
}
export function promotionError(s: State) {
  if (s.journey.branch === "none") return "尚未加入宗门";
  if (s.journey.rank === 1) return "已是外门弟子";
  if (s.journey.duties < 3 || s.journey.contribution < 6 || s.study < 2)
    return "需要亲历 3 次事务、贡献 6、心得 2";
  if (!s.journey.mentor) return "需先与执事谈一谈为何修行";
  return "";
}
function normalize(n: State, old: State) {
  if (n.status === "dead") {
    n.social.scene = null;
    n.social.arena.duel = null;
  }
  if (n.status === "complete" && old.status === "alive") {
    if (old.journey.settled) {
      n.legacy = old.legacy;
      n.earned = old.earned;
      n.log = n.log.filter(
        (l) => !(l.month === n.month && l.text === n.result),
      );
    } else {
      log(
        n,
        "筑基篇已记入传承，但人生仍在继续。山外的雾岭与孤灯，正等你探访。",
      );
    }
    n.status = "alive";
    n.journey.settled = true;
  }
  // Milestone and eventual death must not award the same life's legacy twice.
  if (old.journey.settled && n.status === "dead") {
    n.legacy = old.legacy;
    n.earned = old.earned;
  }
  return n;
}
export function dispatch(input: State, c: Command): State {
  if (!c.id || input.seen.includes(c.id)) return input;
  if (c.type === "mist") return runMist(input, c.action, c.id);
  if (c.type === "road") return runRoad(input, c.action, c.id);
  if (c.type === "adventure") return runAdventure(input, c.action, c.id);
  if (
    socialCommands.includes(c.type) ||
    (c.type === "choose" && !input.pending && input.social.scene)
  ) {
    return dispatchSocial(input, c as SocialCommand, (s) =>
      dispatch(s, { id: c.id, type: "advance", activity: "work", months: 1 }),
    );
  }
  if (input.social.scene || input.social.arena.duel) return input;
  if (
    ["advance", "prepare", "choose", "break", "next", "beginChapter"].includes(
      c.type,
    )
  ) {
    const command = c as chapter.Command;
    if (command.type === "advance") {
      if (
        !Number.isInteger(command.months) ||
        command.months < 1 ||
        command.months > 12
      )
        return input;
      let n = input;
      for (let i = 0; i < command.months; i++) {
        const b = base(n);
        const result = chapter.dispatch(b, { ...command, id: c.id, months: 1 });
        if (result === b) break;
        const old = n;
        n = normalize(
          lift(
            result,
            structuredClone(n.journey),
            structuredClone(n.social),
            structuredClone(n.adventure),
          ),
          n,
        );
        if (n.status === "alive") {
          const a = command.activity;
          const bonus =
            a === "cultivate" && n.journey.main === "spring"
              ? 3
              : (a === "train" && n.journey.main === "blade") ||
                  (a === "work" && n.journey.main === "breath")
                ? 4
                : 0;
          if (n.realm === 0) n.qi = Math.min(360, n.qi + bonus);
          if (a === "gather" && n.journey.support === "herb") n.herbs++;
          if (a === "train" && n.journey.support === "guard")
            n.injury = old.injury;
          if (a === "meditate" && n.journey.support === "lantern")
            n.study = Math.min(4, n.study + 1);
        }
        // One user command owns a batch; intermediate months do not own its id.
        n.seen = old.seen;
        if (
          n.pending ||
          n.status !== "alive" ||
          (n.realm === 0 && old.qi < 360 && n.qi === 360)
        )
          break;
      }
      if (n === input) return input;
      n.seen = [...input.seen, c.id].slice(-512);
      return n;
    }
    const b = base(input),
      result = chapter.dispatch(b, command);
    if (result === b) return input;
    return normalize(
      lift(
        result,
        ["next", "beginChapter"].includes(c.type)
          ? fresh()
          : structuredClone(input.journey),
        ["next", "beginChapter"].includes(c.type)
          ? freshSocial()
          : structuredClone(input.social),
        ["next", "beginChapter"].includes(c.type)
          ? freshAdventure()
          : structuredClone(input.adventure),
      ),
      input,
    );
  }
  if (c.type === "continue") {
    if (input.status !== "complete" || input.age >= input.limit) return input;
    const n = structuredClone(input);
    n.status = "alive";
    n.journey.settled = true;
    n.seen = [...n.seen, c.id].slice(-512);
    log(n, "你收起前篇卷宗，再次踏上山外的路。");
    return n;
  }
  if (input.status !== "alive" || input.pending) return input;
  let s = structuredClone(input);
  const accept = () => {
    s.seen = [...input.seen, c.id].slice(-512);
    return s;
  };
  // Expeditions and duties spend one real month; death wins over their rewards.
  const travel = () => {
    const b = base(s),
      n = chapter.dispatch(b, {
        id: c.id,
        type: "advance",
        activity: "work",
        months: 1,
      });
    s = normalize(lift(n, s.journey, s.social, s.adventure), input);
    if (s.status === "alive") {
      s.stones -= 4; // no labour income while travelling
      s.log = s.log.filter(
        (l) => !(l.month === s.month && l.text === "山下劳作，额外灵石 +4。"),
      );
    }
    return s.status === "alive";
  };
  switch (c.type) {
    case "supplies":
      if (s.stones < 8) return input;
      s.stones -= 8;
      s.herbs += 4;
      log(s, "坊市购得灵草四株，可用于灵器炼制、炼丹或与守境妖修交涉。");
      return accept();
    case "forge":
      if (forgeError(s, c.relic)) return input;
      s.stones -= 24;
      s.herbs -= 4;
      s.journey.relics[c.relic]++;
      log(
        s,
        `${relics[c.relic].name}${s.journey.relics[c.relic] === 2 ? "精炼完成" : "炼成"}。装配后才能应对山外挑战。`,
      );
      return accept();
    case "equipRelic":
      if (!Object.hasOwn(relics, c.relic) || !s.journey.relics[c.relic])
        return input;
      s.journey.equipped = c.relic;
      return accept();
    case "aid":
      if (
        !["peak", "sea"].includes(c.place) ||
        !["mentor", "luchi"].includes(c.helper) ||
        aidError(s, c.place, c.helper)
      )
        return input;
      s.journey.encounters[c.place]!.aid = c.helper;
      log(
        s,
        c.helper === "luchi"
          ? "陆迟带剑来赴约：“这次，不让你独自闯阵。”本关援助 +20，失败后仍会陪你重试。"
          : "执事答应为你护持阵眼：“准备好了再来，我等你。”本关援助 +20，失败后仍有效。",
      );
      return accept();
    case "challenge": {
      if (
        !["peak", "sea"].includes(c.place) ||
        explorationError(s, c.place) ||
        s.journey.maps[c.place] !== 1 ||
        !["fight", "parley"].includes(c.mode)
      )
        return input;
      const e = s.journey.encounters[c.place];
      if (!e || e.passed) return input;
      if (
        c.mode === "parley" &&
        (e.kind !== "guardian" || s.herbs < 6 || s.study < 2)
      )
        return input;
      if (c.mode === "fight" && s.stones < 4) return input;
      const details = challengeDetails(s, c.place)!;
      if (!travel()) return accept();
      const current = s.journey.encounters[c.place]!;
      current.attempts++;
      if (c.mode === "parley") {
        s.herbs -= 6;
        current.passed = true;
        current.outcome = "peace";
        log(
          s,
          "你带来灵草，解释采药人的来意。石角收起瘴阵：“原来你不是来夺药的。走吧，别惊扰族人。”交涉通关，不掷骰。",
        );
      } else {
        s.stones -= 4;
        const value = Math.floor(roll(s) * 100) + 1;
        current.lastRoll = value;
        current.lastChance = details.chance;
        current.passed = value <= details.chance;
        current.outcome = current.passed ? "win" : "loss";
        if (current.passed)
          log(
            s,
            `你闯过${opponents[current.kind].name}的阻拦。判定 ${value}/100，把握 ${details.chance}%。原先的准备终于派上了用场。`,
          );
        else {
          s.injury = Math.min(6, s.injury + details.damage);
          log(
            s,
            `挑战未过：${opponents[current.kind].name}迫你退回。判定 ${value}/100，把握 ${details.chance}%，伤势 +${details.damage}。线索与灵器保留；先养伤、精炼灵器、凝神固本，或请道友护持后再来。`,
          );
        }
      }
      if (current.passed) {
        s.journey.maps[c.place] = 2;
        log(
          s,
          c.place === "peak"
            ? s.journey.approach === "rescue"
              ? "获救采药人的路标指向海边：陆迟的父亲还活着，是雾海的守灯人。"
              : "越过阻拦，你在石壁读到一行刻字：去雾海，找守灯人。"
            : "灯塔内，守灯人认出了旧剑刻痕。他受托维持引航阵，尚不能离开，却能托你带信回家。",
        );
      }
      return accept();
    }
    case "enqueue":
      if (
        !Object.hasOwn(queueActions, c.action) ||
        !Number.isInteger(c.repeat) ||
        c.repeat < 1 ||
        c.repeat > 12 ||
        s.journey.queue.length >= 8
      )
        return input;
      s.journey.queue.push({ action: c.action, remaining: c.repeat });
      return accept();
    case "clearQueue":
      if (!s.journey.queue.length) return input;
      s.journey.queue = [];
      return accept();
    case "queueTick": {
      const task = input.journey.queue[0];
      if (!task) return input;
      const error =
        task.action === "refine"
          ? preparationError(input, "refine")
          : actionError(input, task.action);
      if (error) return input;
      const n = dispatch(
        input,
        task.action === "refine"
          ? { id: c.id, type: "prepare", kind: "refine" }
          : { id: c.id, type: "advance", activity: task.action, months: 1 },
      );
      if (n === input) return input;
      n.journey.queue[0].remaining--;
      if (
        !n.journey.queue[0].remaining ||
        (task.action === "rest" && n.injury === 0) ||
        (task.action === "cultivate" && n.qi === 360)
      )
        n.journey.queue.shift();
      return n;
    }
    case "mentor":
      if (
        s.journey.branch === "none" ||
        s.journey.duties < 3 ||
        s.journey.mentor ||
        !["care", "seek"].includes(c.answer)
      )
        return input;
      s.journey.mentor = true;
      if (c.answer === "care") {
        s.herbs += 4;
        log(
          s,
          "你说修行是为了护住身边的人。执事把四株灵草放到你手中：“记住今天的话。雾岭里，也有人在等救援。”",
        );
      } else {
        s.study = Math.min(4, s.study + 1);
        log(
          s,
          "你说想亲眼看看山外的世界。执事翻开旧卷：“想走远，先学会为自己的选择负责。”心得 +1。",
        );
      }
      return accept();
    case "join":
      if (
        s.journey.branch !== "none" ||
        !["dan", "jian"].includes(c.branch) ||
        s.story.stage === "unmet"
      )
        return input;
      s.journey.branch = c.branch;
      learn(s, c.branch === "dan" ? "herb" : "guard");
      log(
        s,
        c.branch === "dan"
          ? "丹堂执事温蘅收你为记名弟子：“学会救人，才算读懂丹方。”"
          : "剑院执事季衡收你为记名弟子：“守得住身后的人，再谈剑锋。”",
      );
      if (s.story.luchi !== "distant")
        log(
          s,
          "陆迟听说你入门，送来一张旧营地草图：“若有一日能进雾岭，替我留心这道刻痕。”",
        );
      return accept();
    case "duty":
      if (
        s.journey.branch === "none" ||
        !["herbs", "watch", "copy"].includes(c.duty)
      )
        return input;
      if (c.duty === "herbs" && s.herbs < 2) return input;
      if (c.duty === "copy" && s.stones < 3) return input;
      if (!travel()) return accept();
      if (c.duty === "herbs") {
        s.herbs -= 2;
        s.foundation = Math.min(24, s.foundation + 1);
      }
      if (c.duty === "copy") {
        s.stones -= 3;
        s.study = Math.min(4, s.study + 1);
      }
      if (c.duty === "watch") {
        s.injury = Math.min(6, s.injury + 1);
        s.qi = Math.min(360, s.qi + (s.realm === 0 ? 8 : 0));
      }
      s.journey.duties++;
      s.journey.contribution += 2;
      log(
        s,
        {
          herbs: "送药下山，温蘅让你记住病人的名字，而不只是一笔贡献。",
          watch: "守夜归来，季衡接过你的灯：“今夜山路上的人，平安到家了。”",
          copy: "整理旧卷，你在采药名册上发现陆迟父亲的名字；旁边写着“雾岭”。",
        }[c.duty],
      );
      return accept();
    case "promote":
      if (promotionError(s)) return input;
      s.journey.contribution -= 6;
      s.journey.rank = 1;
      s.journey.mentor = true;
      learn(s, s.journey.branch === "dan" ? "spring" : "blade");
      log(
        s,
        "你凭亲历与心得成为外门弟子。执事交付雾岭通行令：资格不是终点，带一个答案回来。",
      );
      return accept();
    case "learn":
      if (
        !Object.hasOwn(techniques, c.technique) ||
        s.journey.known.includes(c.technique) ||
        s.study < 2 ||
        s.stones < 20
      )
        return input;
      // The same techniques are accessible to independent cultivators.
      s.stones -= 20;
      learn(s, c.technique);
      log(s, "在坊市与散修交换心得，读懂一册功法。");
      return accept();
    case "equip":
      if (!s.journey.known.includes(c.technique)) return input;
      s.journey[techniques[c.technique].slot] = c.technique;
      return accept();
    case "explore": {
      if (explorationError(s, c.place)) return input;
      const step = s.journey.maps[c.place];
      if (c.place !== "valley" && step === 1) return input; // Must resolve the encounter, never click past it.
      if (
        c.place === "valley" &&
        step === 1 &&
        (!["rescue", "trace"].includes(c.approach ?? "") ||
          (c.approach === "rescue" && s.herbs < 2))
      )
        return input;
      if (!travel()) return accept();
      s.journey.maps[c.place]++;
      if (c.place !== "valley" && step === 0) {
        const kind = roll(s) < 0.5 ? "guardian" : "raider";
        s.journey.encounters[c.place] = {
          kind,
          attempts: 0,
          aid: "none",
          passed: false,
          lastRoll: 0,
          lastChance: 0,
          outcome: "none",
        };
        log(
          s,
          `前路遇阻：${opponents[kind].name}。${opponents[kind].description}`,
        );
      }
      if (c.place === "valley") {
        if (step === 0)
          log(
            s,
            "回春谷：旧营地的药篓上有三道刻痕。崖边传来呼救，另一侧的足迹正被雨水冲淡。",
          );
        if (step === 1) {
          s.journey.approach = c.approach!;
          if (c.approach === "rescue") {
            s.herbs -= 2;
            s.story.trust = Math.min(6, s.story.trust + 1);
            log(
              s,
              "你先救起受伤的采药人。他认出了刻痕，愿替你向陆迟报平安。信任 +1。",
            );
          } else {
            s.stones += 8;
            log(
              s,
              "你先保住被雨水侵蚀的笔记，拾得灵石 8。返回时采药人已由同伴救走，你没能问出他的见闻。",
            );
          }
        }
        if (step === 2) {
          learn(s, "herb");
          log(
            s,
            "营地笔记指向雾岭。山门守卫提醒：炼气之躯难抵山瘴；筑基后凭通行令，或自行识阵，才能深入。",
          );
        }
      }
      if (c.place === "peak") {
        if (step === 0)
          log(
            s,
            s.journey.rank === 1
              ? "外门令牌换来守山人的信任，他指给你一条隐秘栈道。"
              : "你用神识辨认山瘴与阵纹，以研读所得独自走过栈道。散修也有自己的路。",
          );
        if (step === 2) {
          learn(s, "lantern");
          log(
            s,
            "雾岭尽头，你得到航图与照夜篇。纸背写着：灯不灭，归人便有路。雾海孤灯已开放。",
          );
        }
      }
      if (c.place === "sea") {
        if (step === 0)
          log(
            s,
            s.story.choice === "gift"
              ? "陆迟与你并肩登船。他第一次主动说起父亲教他握剑的模样。"
              : "你独自登船，把那封旧家书收进衣襟。此行也是为了兑现自己说过的话。",
          );
        if (step === 2) {
          s.stones += 20;
          log(
            s,
            "你带回父亲的亲笔信。陆迟的母亲读了又读，终于放下窗边的灯。“下次，带他一起回来。”本版探索终章完成，灵石 +20。北海与更高境界的故事，尚待开启。",
          );
        }
      }
      return accept();
    }
    case "retire":
      if (!s.journey.settled || s.realm !== 1 || s.story.stage !== "resolved")
        return input;
      s.status = "complete";
      for (const key of [
        s.crafted > 0 ? "herbal" : null,
        s.mastery >= 4 ? "sword" : null,
      ] as const) {
        if (key && !s.unlocked.includes(key)) s.unlocked.push(key);
      }
      log(s, "你主动封存这一世的卷宗，保留传承，准备另一种人生。");
      return accept();
  }
  return input;
}
export function validState(x: unknown): x is State {
  if (!x || typeof x !== "object") return false;
  const s = x as State,
    j = s.journey;
  if (
    s.version !== 10 ||
    !j ||
    !chapter.validState(base(s)) ||
    !validSocial(s) ||
    !validAdventure(s.adventure) ||
    !validRoad(s.adventure.road, s) ||
    !validMist(s)
  )
    return false;
  const integer = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  return (
    ["none", "dan", "jian"].includes(j.branch) &&
    integer(j.rank, 1) &&
    integer(j.contribution) &&
    integer(j.duties) &&
    typeof j.mentor === "boolean" &&
    (j.rank !== 1 || j.mentor) &&
    (!j.mentor || (j.branch !== "none" && j.duties >= 3)) &&
    (j.branch !== "none" ||
      (j.rank === 0 && j.duties === 0 && j.contribution === 0)) &&
    Array.isArray(j.known) &&
    j.known.length <= 6 &&
    new Set(j.known).size === j.known.length &&
    j.known.every((t) => Object.hasOwn(techniques, t)) &&
    [j.main, j.support].every(
      (t, i) =>
        t === null ||
        (j.known.includes(t) &&
          techniques[t].slot === (i === 0 ? "main" : "support")),
    ) &&
    !!j.maps &&
    ["valley", "peak", "sea"].every((p) => integer(j.maps[p as Place], 3)) &&
    (j.maps.peak === 0 || (j.maps.valley === 3 && s.realm === 1)) &&
    (j.maps.sea === 0 || j.maps.peak === 3) &&
    ["none", "rescue", "trace"].includes(j.approach) &&
    (j.maps.valley >= 2 ? j.approach !== "none" : j.approach === "none") &&
    typeof j.settled === "boolean" &&
    (!j.settled || (s.realm === 1 && s.story.stage === "resolved")) &&
    Array.isArray(j.queue) &&
    j.queue.length <= 8 &&
    j.queue.every(
      (q) =>
        q &&
        Object.hasOwn(queueActions, q.action) &&
        integer(q.remaining, 12) &&
        q.remaining > 0,
    ) &&
    !!j.relics &&
    ["vial", "sword"].every((r) => integer(j.relics[r as Relic], 2)) &&
    (j.equipped === null ||
      (Object.hasOwn(relics, j.equipped) && j.relics[j.equipped] > 0)) &&
    !!j.encounters &&
    (["peak", "sea"] as const).every((p) => {
      const e = j.encounters[p];
      if (!e) return e === null && j.maps[p] === 0;
      return (
        j.maps[p] >= 1 &&
        Object.hasOwn(opponents, e.kind) &&
        integer(e.attempts) &&
        ["none", "mentor", "luchi"].includes(e.aid) &&
        typeof e.passed === "boolean" &&
        e.passed === j.maps[p] >= 2 &&
        integer(e.lastRoll, 100) &&
        integer(e.lastChance, 100) &&
        ["none", "win", "loss", "peace"].includes(e.outcome) &&
        e.passed === ["win", "peace"].includes(e.outcome) &&
        (e.outcome === "none" ? e.attempts === 0 : e.attempts > 0)
      );
    })
  );
}
export function migrateSave(x: unknown): State {
  if (validState(x)) return structuredClone(x);
  if (x && typeof x === "object" && "version" in x && x.version === 9) {
    const old = x as State;
    if (!validAdventure(old.adventure) || !validRoadV9(old.adventure.road, old))
      throw new Error("旧行路存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 10,
      adventure: {
        ...structuredClone(old.adventure),
        road: {
          ...structuredClone(old.adventure.road),
          solution: old.adventure.road.passed ? "legacy" : "none",
          prepared: "none",
        },
      },
    };
    if (validState(upgraded)) return upgraded;
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 8) {
    const old = x as State;
    if (!validAdventure(old.adventure))
      throw new Error("旧冒险存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 9,
      adventure: { ...structuredClone(old.adventure), mist: freshMist() },
    };
    return migrateSave(upgraded);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 7) {
    const old = x as State;
    if (
      !validAdventure(old.adventure) ||
      !old.adventure.road ||
      typeof old.adventure.road !== "object"
    )
      throw new Error("旧行路存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 9,
      adventure: {
        ...structuredClone(old.adventure),
        mist: freshMist(),
        road: {
          ...structuredClone(old.adventure.road),
          discoveries: [],
          lastApproach: "direct",
        },
      },
    };
    return migrateSave(upgraded);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 6) {
    const old = x as State;
    if (!validAdventure(old.adventure))
      throw new Error("旧冒险存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 10,
      adventure: {
        ...structuredClone(old.adventure),
        road: freshRoad(),
        mist: freshMist(),
      },
    };
    if (validState(upgraded)) return upgraded;
    throw new Error("旧存档损坏，原始数据未被修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 5) {
    const upgraded = {
      ...structuredClone(x),
      version: 10,
      adventure: freshAdventure(true),
    };
    if (validState(upgraded)) return upgraded;
    throw new Error("旧存档损坏，原始数据未被修改。");
  }
  if (validV4(x))
    return {
      ...structuredClone(x),
      version: 10,
      social: freshSocial(),
      adventure: freshAdventure(true),
    };
  if (
    x &&
    typeof x === "object" &&
    "version" in x &&
    typeof x.version === "number" &&
    x.version >= 4
  )
    throw new Error("存档格式不受支持或已损坏，原始数据未被修改。");
  const old = chapter.migrateSave(x),
    s = lift(old);
  s.journey.settled = old.status === "complete";
  return s;
}
