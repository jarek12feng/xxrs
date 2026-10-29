import type { State } from "./world";
import type { EventView } from "./chapter";

export type Gender = "male" | "female";
export type Memory = "walk" | "night" | "watch";
export type HeartScene = "meet" | Memory | "pledge";
export type Stance = "break" | "endure" | "discern";
export const stances: Record<Stance, string> = {
  break: "破势",
  endure: "守息",
  discern: "识阵",
};
export const companions = {
  male: {
    name: "沈听澜",
    gender: "女",
    age: 24,
    pronoun: "她",
    portrait: "/characters/shentinglan.png",
    title: "绘山河 · 记归途",
    goal: "绘一册人人都能看懂的山路图，让凡人也能平安穿过听松山。",
    keepsake: "亲手画的归途小图",
    first:
      "山门外，一位女修正蹲在路旁改地图。她把危险的近路划掉，宁愿多绕两里。“这段坡太陡，背药篓的人过不去。绕到溪边能走吗？”她抬头，问你是否认得附近的药径。",
  },
  female: {
    name: "尹照川",
    gender: "男",
    age: 26,
    pronoun: "他",
    portrait: "/characters/yinzhaochuan.png",
    title: "补旧阵 · 护长路",
    goal: "修好山下废弃的引路阵，让夜归的人不用冒险穿过山瘴。",
    keepsake: "亲手刻的引路木符",
    first:
      "石桥旁，一位男修把坏掉的阵盘拆得满地都是。他没有急着换新盘，而是记下每一道旧刻痕。“第三道纹又断了……昨晚药队摸黑走到这里，险些落水。”他抬头，向你借一份识阵心得。",
  },
} as const;
export const rivals = [
  {
    name: "巩砚",
    style: "磐石守势",
    story:
      "曾护送药队穿山，最信任稳扎稳打。他不怕你力大，却怕你看准护势转换的空隙。",
    hp: 23,
    attack: 8,
    pattern: ["break", "break", "endure"] as Stance[],
    prize: "归元息 · 灵石 8",
  },
  {
    name: "裴逐风",
    style: "疾剑连攻",
    story: "快剑争先，连攻后会短暂换气。硬追他的剑尖，常会先耗尽自己的气息。",
    hp: 30,
    attack: 10,
    pattern: ["endure", "endure", "break"] as Stance[],
    prize: "护身诀 · 灵石 12",
  },
  {
    name: "邱星罗",
    style: "流光阵步",
    story:
      "筑基阵修，把每一步都藏进阵纹。先看阵眼，再决定何时出手，比盲目猛攻有效。",
    hp: 38,
    attack: 12,
    pattern: ["discern", "discern", "endure"] as Stance[],
    prize: "照夜篇 · 听松试剑魁首 · 灵石 20",
  },
] as const;
export interface Duel {
  opponent: number;
  turn: number;
  hp: number;
  maxHp: number;
  enemyHp: number;
  log: string[];
}
export interface SocialState {
  gender: Gender | null;
  met: boolean;
  metMonth: number | null;
  affection: number;
  memories: Memory[];
  answers: Partial<Record<HeartScene, string>>;
  bonded: boolean;
  scene: { id: string; kind: HeartScene } | null;
  arena: {
    wins: number;
    losses: number;
    scouted: number[];
    duel: Duel | null;
    last: string;
    invited: boolean;
  };
}
export type SocialCommand =
  | { id: string; type: "identity"; gender: Gender }
  | { id: string; type: "visit" }
  | { id: string; type: "outing"; outing: Memory }
  | { id: string; type: "confess" }
  | { id: string; type: "arenaScout" | "arenaStart" | "arenaWithdraw" }
  | { id: string; type: "arenaTurn"; stance: Stance }
  | { id: string; type: "choose"; instanceId: string; option: string };
export const socialCommands = [
  "identity",
  "visit",
  "outing",
  "confess",
  "arenaScout",
  "arenaStart",
  "arenaWithdraw",
  "arenaTurn",
];
export function freshSocial(gender: Gender | null = null): SocialState {
  return {
    gender,
    met: false,
    metMonth: null,
    affection: 0,
    memories: [],
    answers: {},
    bonded: false,
    scene: null,
    arena: {
      wins: 0,
      losses: 0,
      scouted: [],
      duel: null,
      last: "",
      invited: false,
    },
  };
}
export const companion = (s: State) =>
  s.social.gender ? companions[s.social.gender] : null;
export function relationship(s: State) {
  const r = s.social;
  return r.bonded
    ? "两心相许"
    : r.memories.length === 3 && r.affection >= 50
      ? "心意渐明"
      : r.memories.length >= 2
        ? "相知"
        : r.met
          ? "相识"
          : "尚未相识";
}
export function relationshipGoal(s: State) {
  if (!s.social.gender)
    return "先补选角色性别。本版按角色性别安排异性恋爱对象，不影响战力。";
  if (s.age < 216)
    return "年满十八岁后，在山门外结识新的同行者。先修行、赴陆迟的约。";
  if (!s.social.met) return "前往山门外，认识一个有自己心愿的人。";
  if (!s.social.memories.includes("walk"))
    return "对方想勘察一段旧路，邀你一起去看看。";
  if (!s.social.memories.includes("night"))
    return "那晚的话还没说完，去灯下听一听对方真正的心愿。";
  if (!s.social.memories.includes("watch"))
    return "完成一场擂台胜利，或两次败后复盘，再一起谈谈胜负。无需夺魁才能发展感情。";
  return s.social.bonded
    ? "已经定情，保留彼此的修行目标。婚礼与婚后生活尚未开放。"
    : "共同经历让心意渐明。是否定情，由你选择；保持朋友关系也不影响修行。";
}
function note(s: State, text: string) {
  s.log.unshift({ month: s.month, text, kind: "story" });
  s.log = s.log.slice(0, 180);
}
function open(s: State, kind: HeartScene) {
  s.social.scene = { id: `${s.life}:${s.month}:heart:${kind}`, kind };
}
export function heartEvent(s: State): EventView | null {
  const kind = s.social.scene?.kind,
    who = companion(s);
  if (!kind || !who) return null;
  if (kind === "meet")
    return {
      title: `山门初逢 · ${who.name}`,
      body: who.first,
      options: [
        {
          id: "help",
          label: "拿出灵草，一起辨认沿途药径",
          hint: "灵草 −2",
          disabled: s.herbs < 2 ? "需灵草 2" : undefined,
        },
        {
          id: "share",
          label: "翻开旧卷，分享自己的识路心得",
          hint: "需心得 2，不消耗",
          disabled: s.study < 2 ? "需心得 2" : undefined,
        },
        {
          id: "listen",
          label: "先坐下来，听对方讲这条路",
          hint: "无需资源",
        },
      ],
    };
  if (kind === "walk")
    return {
      title: "同行 · 雨中的旧路",
      body: `${who.name}与你勘察旧路，崖边的引路符忽然熄了。${who.pronoun}先把你推回石阶，自己攀住摇晃的绳索。崖下还有受伤药工，雨正在抹去回程记号。“别只顾拉我，”${who.pronoun}喘着气说，“我还能撑。你去救人，或者替我把归路标出来。”你第一次发现，同行不是替对方决定该冒什么险。`,
      options: [
        {
          id: "care",
          label: "用灵草照料伤者，让对方安心记路",
          hint: "灵草 −4",
          disabled: s.herbs < 4 ? "需灵草 4" : undefined,
        },
        {
          id: "mark",
          label: "用研读所得标出安全通路",
          hint: "需心得 2，不消耗",
          disabled: s.study < 2 ? "需心得 2" : undefined,
        },
        {
          id: "stay",
          label: "留下来搭把手，陪大家慢慢走回去",
          hint: "无需资源",
        },
      ],
    };
  if (kind === "night")
    return {
      title: "灯下 · 各自的远方",
      body: `${who.name}把${who.gender === "女" ? "一张被雨泡皱的路图" : "那枚裂开的引路阵盘"}推到灯下。${s.social.answers.walk === "care" ? "你那日留下照料伤者，让对方腾出手稳住归路。" : s.social.answers.walk === "mark" ? "你那日补下的标记还在，最后一个药工顺着它走出了雨幕。" : "你那日没催谁快走，一直陪到最后一个人回山。"}“我想${who.goal}可师门给了我一次闭关的机会，错过这轮灵潮，就要再等数年。”${who.pronoun}把手缩回袖里，袖口还留着那天替你挡石的裂痕。“你若也要去求自己的道，不必为了我留下。”说完这句，${who.pronoun}却没有收走你面前的茶。`,
      options: [
        {
          id: "promise",
          label: "我们各自修行，出关那天，我来找你",
          hint: "记住彼此的心愿",
        },
        {
          id: "honest",
          label: "我不能许下归期，但不想与你就此走散",
          hint: "坦诚自己的不足",
        },
      ],
    };
  if (kind === "watch")
    return {
      title: "赛后 · 胜负之外",
      body: `${who.name}在台阶下等你，递来一块浸过凉水的帕子。“虎口都红了，擦擦。刚才台下挤，我喊了两声，你听见没有？”`,
      options: [
        {
          id: "thanks",
          label: "谢谢你来，下次也让我看看你的修行",
          hint: "约好下次观摩",
        },
        {
          id: "learn",
          label: "说说我的失误吧，我想听你的看法",
          hint: "一同复盘",
        },
      ],
    };
  return {
    title: "月下 · 两心相许",
    body: `${who.name}将${who.keepsake}放在桌上。${s.social.answers.night === "promise" ? "“你愿意与我再走一段路。我便把回来的路，一笔一笔留好了。”" : "“你肯把心里的不安告诉我。我想了很久，也不愿让一个期限困住你。”"}${who.pronoun}按住信物，没有立即松手。“我要走的道还没有走完，也不想你放弃自己的。可下一次听见山门的铃，我会希望回来的是你。你愿意让我等这个消息吗？”`,
    options: [
      {
        id: "yes",
        label: "好，我收着。你出山时，也记得告诉我",
        hint: "双方定情，获得纪念信物；婚礼与婚后生活尚未开放",
      },
      {
        id: "later",
        label: "让我再想一想，先珍惜现在的同行",
        hint: "不扣好感、不影响擂台或修行，之后仍可谈心",
      },
    ],
  };
}
export function outingError(s: State, outing: Memory) {
  if (!s.social.met) return "先与对方相识";
  if (s.social.memories.includes(outing))
    return "这段经历已珍藏，不能重复刷好感";
  if (outing !== "walk" && !s.social.memories.includes("walk"))
    return "先一起勘察旧路";
  if (outing === "watch" && !s.social.memories.includes("night"))
    return "先完成灯下谈心";
  if (
    outing === "watch" &&
    s.social.arena.wins < 1 &&
    s.social.arena.losses < 2
  )
    return "先取得一场胜利，或两次落败后再来复盘";
  return "";
}
export function arenaError(s: State) {
  if (s.age < 216) return "年满十八岁后可参加";
  if (s.social.arena.wins >= 3) return "本届三位对手已全部击败，不重复发奖";
  if (s.social.arena.wins === 2 && s.realm < 1)
    return "决胜场需筑基；可先探索与准备突破";
  if (s.injury > 0) return "擂台不接纳负伤参赛，先养伤";
  if (s.stones < 4) return "需要灵石 4 作为擂台修缮费";
  if (!s.social.arena.scouted.includes(s.social.arena.wins))
    return "先观摩对手，了解招式";
  return "";
}
export function duelIntent(s: State): Stance | null {
  const d = s.social.arena.duel;
  return d ? rivals[d.opponent].pattern[d.turn] : null;
}
export function turnPreview(s: State, stance: Stance) {
  const d = s.social.arena.duel;
  if (!d) return null;
  const correct = duelIntent(s) === stance;
  const gear = s.journey.equipped;
  const skill = s.journey.main,
    support = s.journey.support;
  const damage =
    (correct ? 8 : 3) +
    Math.floor((s.root + s.sense + s.study + s.mastery) / 8) +
    (gear === "sword" ? s.journey.relics.sword * 2 : 0) +
    (stance === "break" && skill === "blade" ? 4 : 0) +
    (stance === "discern" && skill === "breath" ? 3 : 0) +
    (stance === "discern" && support === "lantern" ? 3 : 0);
  const incoming = Math.max(
    1,
    rivals[d.opponent].attack +
      (correct ? 0 : 5) -
      (support === "guard" ? 2 : 0) -
      (gear === "vial" ? s.journey.relics.vial : 0),
  );
  const heal =
    (stance === "endure" && skill === "spring" ? 2 : 0) +
    (support === "herb" ? 1 : 0);
  return { correct, damage, incoming, heal };
}
function random(s: State) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0 || 1;
  return s.seed / 4294967296;
}
function finishDuel(s: State, win: boolean, withdrawal = false) {
  const a = s.social.arena,
    d = a.duel!;
  if (win) {
    const reward = (["breath", "guard", "lantern"] as const)[d.opponent];
    if (!s.journey.known.includes(reward)) s.journey.known.push(reward);
    s.stones += [8, 12, 20][d.opponent];
    a.wins++;
    a.last = `击败${rivals[d.opponent].name}：${rivals[d.opponent].prize}。`;
    if (s.social.met && !a.invited) {
      a.invited = true;
      note(
        s,
        `${companion(s)!.name}在擂台下等你，想与你聊聊这一战。人物关系中已留下赛后邀约。`,
      );
    }
  } else {
    a.losses++;
    if (!withdrawal) s.injury = Math.min(6, s.injury + 1);
    a.last = `${withdrawal ? "主动认负" : "本场落败"}：${rivals[d.opponent].name}守住了擂台。${withdrawal ? "没有新增伤势。" : "伤势 +1。"}可观摩提示、更换功法灵器、凝神固本后再来。`;
    if (s.social.met)
      note(
        s,
        `${companion(s)!.name}递来热茶：“手还抖呢，茶碗给我。哪一招没接住？你慢慢说。”`,
      );
  }
  a.last += `本场交锋：${d.log.join(" ")}`;
  note(s, a.last);
  a.duel = null;
}
export function dispatchSocial(
  input: State,
  c: SocialCommand,
  elapse: (s: State) => State,
): State {
  if (input.status !== "alive" || input.pending) return input;
  if (input.social.scene && c.type !== "choose") return input;
  if (
    input.social.arena.duel &&
    !["arenaTurn", "arenaWithdraw"].includes(c.type)
  )
    return input;
  let s = structuredClone(input);
  const accept = () => {
    s.seen = [...input.seen, c.id].slice(-512);
    return s;
  };
  const travel = () => {
    s = elapse(s);
    if (s.status !== "alive") return false;
    s.stones -= 4;
    s.log = s.log.filter(
      (l) => !(l.month === s.month && l.text === "山下劳作，额外灵石 +4。"),
    );
    return !s.pending;
  };
  switch (c.type) {
    case "identity":
      if (s.social.gender !== null || !["male", "female"].includes(c.gender))
        return input;
      s.social.gender = c.gender;
      return accept();
    case "visit":
      if (!s.social.gender || s.social.met || s.age < 216) return input;
      if (!travel()) return accept();
      open(s, "meet");
      return accept();
    case "outing":
      if (
        !["walk", "night", "watch"].includes(c.outing) ||
        outingError(s, c.outing) ||
        s.age < 216
      )
        return input;
      if (!travel()) return accept();
      open(s, c.outing);
      return accept();
    case "confess":
      if (
        !s.social.met ||
        s.social.memories.length !== 3 ||
        s.social.affection < 50 ||
        s.social.bonded ||
        s.age < 216
      )
        return input;
      open(s, "pledge");
      return accept();
    case "choose": {
      if (!s.social.scene || c.instanceId !== s.social.scene.id) return input;
      const option = heartEvent(s)?.options.find((o) => o.id === c.option);
      if (!option || option.disabled) return input;
      const kind = s.social.scene.kind;
      if (kind === "meet") {
        s.social.met = true;
        s.social.metMonth = s.month;
        s.social.affection += c.option === "listen" ? 8 : 12;
        if (c.option === "help") s.herbs -= 2;
      }
      if (kind === "walk") {
        s.social.affection +=
          c.option === "care" ? 20 : c.option === "mark" ? 16 : 10;
        if (c.option === "care") s.herbs -= 4;
      }
      if (kind === "night") s.social.affection += 15;
      if (kind === "watch") s.social.affection += 20;
      if (["walk", "night", "watch"].includes(kind))
        s.social.memories.push(kind as Memory);
      if (kind === "pledge" && c.option === "yes") {
        s.social.bonded = true;
        note(
          s,
          `你与${companion(s)!.name}两心相许，珍藏${companion(s)!.keepsake}。这不是婚礼；你们约好尊重彼此的修行与远方。`,
        );
      }
      s.social.answers[kind] = c.option;
      s.social.scene = null;
      if (kind !== "pledge")
        note(
          s,
          `与${companion(s)!.name}的共同经历：${option.label}。好感 ${s.social.affection}，关系：${relationship(s)}。`,
        );
      return accept();
    }
    case "arenaScout":
      if (
        s.social.arena.wins >= 3 ||
        s.social.arena.scouted.includes(s.social.arena.wins)
      )
        return input;
      s.social.arena.scouted.push(s.social.arena.wins);
      note(
        s,
        `你观摩了${rivals[s.social.arena.wins].name}的招式。比赛中先看对手意图，再选择破势、守息或识阵。`,
      );
      return accept();
    case "arenaStart": {
      if (arenaError(s)) return input;
      if (!travel()) return accept();
      s.stones -= 4;
      const hp = 24 + s.root + Math.floor(s.foundation / 2),
        opponent = s.social.arena.wins;
      s.social.arena.duel = {
        opponent,
        turn: 0,
        hp,
        maxHp: hp,
        enemyHp: rivals[opponent].hp,
        log: [],
      };
      return accept();
    }
    case "arenaTurn": {
      const d = s.social.arena.duel;
      if (!d || !Object.hasOwn(stances, c.stance)) return input;
      const p = turnPreview(s, c.stance)!;
      const variation = Math.floor(random(s) * 3),
        damage = p.damage + variation,
        incoming = p.incoming + (2 - variation);
      d.enemyHp = Math.max(0, d.enemyHp - damage);
      d.hp = Math.max(0, d.hp - incoming);
      if (d.hp > 0) d.hp = Math.min(d.maxHp, d.hp + p.heal);
      d.turn++;
      d.log.push(
        `第${d.turn}合${stances[c.stance]}${p.correct ? "应对得当" : "未破招"}：对手气势 −${damage}，自身气势 −${incoming}${p.heal ? `，调息 +${p.heal}` : ""}。`,
      );
      if (d.hp === 0 || d.enemyHp === 0 || d.turn === 3)
        finishDuel(s, d.enemyHp === 0 && d.hp > 0);
      return accept();
    }
    case "arenaWithdraw":
      if (!s.social.arena.duel) return input;
      finishDuel(s, false, true);
      return accept();
  }
  return input;
}
export function validSocial(s: State): boolean {
  const r = s.social,
    int = (v: unknown, max = 1e9) =>
      Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !r ||
    ![null, "male", "female"].includes(r.gender) ||
    typeof r.met !== "boolean" ||
    typeof r.bonded !== "boolean" ||
    !int(r.affection, 100)
  )
    return false;
  if (
    !Array.isArray(r.memories) ||
    r.memories.length > 3 ||
    new Set(r.memories).size !== r.memories.length ||
    !r.memories.every((m) => ["walk", "night", "watch"].includes(m))
  )
    return false;
  if (
    r.met
      ? !r.gender || !int(r.metMonth, s.month) || s.age < 216 || r.affection < 8
      : r.metMonth !== null ||
        r.affection !== 0 ||
        r.memories.length > 0 ||
        r.bonded
  )
    return false;
  if (r.bonded && (r.memories.length !== 3 || r.affection < 50)) return false;
  const allowed = {
    meet: ["help", "share", "listen"],
    walk: ["care", "mark", "stay"],
    night: ["promise", "honest"],
    watch: ["thanks", "learn"],
    pledge: ["yes", "later"],
  };
  if (
    !r.answers ||
    typeof r.answers !== "object" ||
    Array.isArray(r.answers) ||
    !Object.entries(r.answers).every(
      ([k, v]) =>
        Object.hasOwn(allowed, k) && allowed[k as HeartScene].includes(v),
    )
  )
    return false;
  if (
    r.met !== !!r.answers.meet ||
    r.memories.some((m) => !r.answers[m]) ||
    r.bonded !== (r.answers.pledge === "yes")
  )
    return false;
  const a = r.arena;
  if (
    !a ||
    !int(a.wins, 3) ||
    !int(a.losses) ||
    typeof a.last !== "string" ||
    a.last.length > 4000 ||
    typeof a.invited !== "boolean" ||
    !Array.isArray(a.scouted) ||
    a.scouted.length > 3 ||
    new Set(a.scouted).size !== a.scouted.length ||
    !a.scouted.every((i) => int(i, 2))
  )
    return false;
  if (a.duel !== null) {
    const d = a.duel;
    if (
      !d ||
      r.scene ||
      s.pending ||
      s.status !== "alive" ||
      d.opponent !== a.wins ||
      !int(d.opponent, 2) ||
      !int(d.turn, 2) ||
      !int(d.hp, d.maxHp) ||
      d.hp === 0 ||
      d.maxHp !== 24 + s.root + Math.floor(s.foundation / 2) ||
      !int(d.enemyHp, rivals[d.opponent].hp) ||
      d.enemyHp === 0 ||
      !Array.isArray(d.log) ||
      d.log.length !== d.turn ||
      !d.log.every((l) => typeof l === "string" && l.length < 500)
    )
      return false;
  }
  if (r.scene !== null) {
    if (
      !r.scene ||
      !Object.hasOwn(allowed, r.scene.kind) ||
      s.status !== "alive" ||
      s.pending ||
      !r.gender ||
      s.age < 216 ||
      r.scene.id !== `${s.life}:${s.month}:heart:${r.scene.kind}`
    )
      return false;
    if (r.scene.kind === "meet" ? r.met : !r.met) return false;
    if (
      ["walk", "night", "watch"].includes(r.scene.kind) &&
      outingError(s, r.scene.kind as Memory)
    )
      return false;
    if (
      r.scene.kind === "pledge" &&
      (r.memories.length !== 3 || r.affection < 50 || r.bonded)
    )
      return false;
  }
  return true;
}
