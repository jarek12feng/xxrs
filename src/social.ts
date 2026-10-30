import { realmPressure } from "./realm-pressure";
import { companionScene } from "./companion-scenes";
import {
  availableOrigins,
  originNotes,
  recognizedOrigin,
  companionBackground,
  type Origin,
} from "./companion-origins";
import { mainTraining, supportTraining } from "./growth";
import type { State } from "./world";
import type { EventView } from "./chapter";

export type Gender = "male" | "female";
export type Memory = "walk" | "night" | "watch";
export type HeartScene = "meet" | Memory | "pledge" | "background";
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
    realm: 0 as const,
    stage: 0,
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
    realm: 0 as const,
    stage: 1,
    name: "裴逐风",
    style: "疾剑连攻",
    story: "快剑争先，连攻后会短暂换气。硬追他的剑尖，常会先耗尽自己的气息。",
    hp: 30,
    attack: 10,
    pattern: ["endure", "endure", "break"] as Stance[],
    prize: "护身诀 · 灵石 12",
  },
  {
    realm: 0 as const,
    stage: 2,
    name: "邱星罗",
    style: "流光阵步",
    story:
      "筑基阵修担任炼气组守榜教习，将气息与阵步限制在炼气组尺度。先看阵眼，再决定何时出手，比盲目猛攻有效。",
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
  origins: Origin[];
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
  | { id: string; type: "visit" | "background" }
  | { id: string; type: "readOrigin"; origin: Origin }
  | { id: string; type: "outing"; outing: Memory }
  | { id: string; type: "confess" }
  | { id: string; type: "arenaScout" | "arenaStart" | "arenaWithdraw" }
  | { id: string; type: "arenaTurn"; stance: Stance }
  | { id: string; type: "choose"; instanceId: string; option: string };
export const socialCommands = [
  "identity",
  "readOrigin",
  "background",
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
    origins: [],
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
  if (!s.social.gender) return "请先在人物页选择角色性别，再去山门外相识。";
  if (s.age < 216)
    return "成年并筑基后，可在山门外结识新的同行者。眼下先走好自己的修行路。";
  if (!s.social.met && s.realm < 1)
    return "筑基后可前往山门外相识。路旁见闻可以随缘阅读，不影响突破。";
  if (!s.social.met) return "前往山门外，认识一个有自己心愿的人。";
  if (!s.social.memories.includes("walk"))
    return "对方想勘察一段旧路，邀你一起去看看。";
  if (!s.social.memories.includes("night"))
    return "那晚的话还没说完，去灯下听一听对方真正的心愿。";
  if (!s.social.memories.includes("watch"))
    return "完成一场擂台胜利，或两次败后复盘，再一起谈谈胜负。无需夺魁才能发展感情。";
  return s.social.bonded
    ? "已经定情，保留彼此的修行目标。完成职业同行并商定联络后，可另行商议结契。"
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
  if (kind === "background")
    return {
      title: companionBackground[s.social.gender!].title,
      body: companionBackground[s.social.gender!].body,
      options: [
        {
          id: "listen",
          label: "记下这些话，各自继续修行",
          hint: "不耗月份，不增加好感",
        },
      ],
    };
  if (kind === "meet")
    return {
      title: `山门初逢 · ${who.name}`,
      body:
        who.first +
        (recognizedOrigin(s) === "route-map"
          ? "你认出了图上划去近路的画法，药庐门旁那张旧图也是这样改的。她还不知道你曾读过。"
          : recognizedOrigin(s) === "lamp-order"
            ? "他的工具旁压着一张检修单，次序和坊市旧灯上那张相同。他还不知道你曾看过修单。"
            : ""),
      options: [
        ...(recognizedOrigin(s)
          ? [
              {
                id: "recognize",
                label:
                  s.social.gender === "male"
                    ? "说起药庐门旁那张改过的路图"
                    : "说起坊市归途那盏修好的旧灯",
                hint: "交流亲眼所见 · 无需资源，与倾听同样增进相识",
              },
            ]
          : []),
        {
          id: "help",
          label:
            s.social.gender === "male"
              ? "拿出灵草，一起辨认沿途药径"
              : "拿出灵草，帮他处理修阵时划破的手",
          hint: "灵草 −2",
          disabled: s.herbs < 2 ? "需灵草 2" : undefined,
        },
        {
          id: "share",
          label:
            s.social.gender === "male"
              ? "翻开旧卷，分享自己的识路心得"
              : "翻开旧卷，一起核对引路阵的残纹",
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
      body: companionScene(s, "walk"),
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
      body: companionScene(s, "night"),
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
      body: companionScene(s, "watch"),
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
    body: companionScene(s, "pledge"),
    options: [
      {
        id: "yes",
        label: "好，我收着。你出山时，也记得告诉我",
        hint: "定情，珍藏信物；结契需日后另行商议",
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

  if (s.injury > 0) return "擂台不接纳负伤参赛，先养伤";
  if (s.stones < 4) return "需要灵石 4 作为擂台修缮费";
  if (!s.social.arena.scouted.includes(s.social.arena.wins))
    return "先观摩对手，了解招式";
  return "";
}
export function duelIntent(s: State): Stance | null {
  const d = s.social.arena.duel;
  return d
    ? rivals[d.opponent].pattern[d.turn % rivals[d.opponent].pattern.length]
    : null;
}
export function turnPreview(s: State, stance: Stance) {
  const d = s.social.arena.duel;
  if (!d) return null;
  const correct = duelIntent(s) === stance;
  const gear = s.journey.equipped;
  const skill = s.journey.main,
    support = s.journey.support;
  let damage =
    mainTraining(s) * 2 +
    (stance === "endure" ? -2 : 0) +
    (correct ? 8 : 3) +
    Math.floor((s.root + s.sense + s.study + s.mastery) / 8) +
    (gear === "sword" ? s.journey.relics.sword * 2 : 0) +
    (stance === "break" && skill === "blade" ? 4 : 0) +
    (stance === "discern" && skill === "breath" ? 3 : 0) +
    (stance === "discern" && support === "lantern" ? 3 : 0);
  let incoming = Math.max(
    1,
    rivals[d.opponent].attack +
      Math.floor(d.turn / 3) * 2 +
      (stance === "break" && skill === "blade" ? 2 : 0) -
      (stance === "discern" && skill === "breath" ? 2 : 0) -
      supportTraining(s) -
      (stance === "endure" ? 6 : 0) +
      (correct ? 0 : 5) -
      (support === "guard" ? 2 : 0) -
      (gear === "vial" ? s.journey.relics.vial : 0),
  );
  const pressure = realmPressure(s, rivals[d.opponent]);
  damage = Math.max(1, Math.floor(damage * pressure.damageFactor));
  incoming += pressure.incomingExtra;
  const heal =
    (stance === "endure" && skill === "spring" && s.herbs > 0 ? 6 : 0) +
    (support === "herb" ? 1 : 0);
  const firstStrike = stance === "break" && skill === "blade";
  const incomingRange = [0, 1, 2].map((variation) =>
    firstStrike && Math.max(1, damage) + variation >= d.enemyHp
      ? 0
      : incoming + 2 - variation,
  );
  return {
    correct,
    incomingMin: Math.min(...incomingRange),
    incomingMax: Math.max(...incomingRange),
    damage: Math.max(1, damage),
    incoming,
    heal,
    herbs: stance === "endure" && skill === "spring" && s.herbs > 0 ? 1 : 0,
    firstStrike,
  };
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
    const duplicate = s.journey.known.includes(reward);
    if (!duplicate) s.journey.known.push(reward);
    else s.stones += 12;
    s.stones += [8, 12, 20][d.opponent];
    a.wins++;
    a.last = `击败${rivals[d.opponent].name}：${duplicate ? `功法已掌握，折为灵石 12；另得胜场灵石 ${[8, 12, 20][d.opponent]}${d.opponent === 2 ? "、听松试剑魁首" : ""}` : rivals[d.opponent].prize}。`;
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
  if (!win && !withdrawal) {
    a.last +=
      d.enemyHp === 0
        ? "双方气势同时耗尽，按擂台规则仍判负；收尾前也要留出承伤余量。"
        : `对手尚余气势 ${d.enemyHp}，需兼顾伤害与存活。`;
    if (s.journey.main === "spring" && s.herbs === 0)
      a.last +=
        "长春守息已无灵草可用；先采药或在坊市买草，再比较换招后的承伤与恢复。";
    a.last +=
      s.growth.medicines.healing > 0
        ? "储物袋有回春散，可立即恢复伤势；也可免费静养一月。"
        : "免费静养可恢复伤势，劳作可筹措下次修缮费。";
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
    case "readOrigin":
      if (
        !Object.hasOwn(originNotes, c.origin) ||
        !availableOrigins(s).includes(c.origin) ||
        s.social.origins.includes(c.origin)
      )
        return input;
      s.social.origins.push(c.origin);
      note(s, `${originNotes[c.origin].title}：${originNotes[c.origin].body}`);
      return accept();
    case "background":
      if (!s.social.met || !s.social.gender || s.age < 216) return input;
      open(s, "background");
      return accept();
    case "identity":
      if (s.social.gender !== null || !["male", "female"].includes(c.gender))
        return input;
      s.social.gender = c.gender;
      return accept();
    case "visit":
      if (!s.social.gender || s.social.met || s.age < 216 || s.realm < 1)
        return input;
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
        s.social.affection += ["listen", "recognize"].includes(c.option)
          ? 8
          : 12;
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
          `你与${companion(s)!.name}两心相许，珍藏${companion(s)!.keepsake}。临别时，你又回头看了一眼，对方仍站在灯下。`,
        );
      }
      s.social.answers[kind] = c.option;
      s.social.scene = null;
      if (kind === "background")
        note(
          s,
          `你听${companion(s)!.name}讲起家人与学艺的经历。各自的远行，仍要自己准备。`,
        );
      if (kind !== "pledge" && kind !== "background")
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
        incoming =
          p.firstStrike && damage >= d.enemyHp
            ? 0
            : p.incoming + (2 - variation);
      d.enemyHp = Math.max(0, d.enemyHp - damage);
      d.hp = Math.max(0, d.hp - incoming);
      const healing = d.hp > 0 ? Math.min(d.maxHp - d.hp, p.heal) : 0;
      if (healing > 0) {
        d.hp += healing;
        s.herbs -= p.herbs;
      }
      d.turn++;
      d.log.push(
        `第${d.turn}合${stances[c.stance]}${p.correct ? "应对得当" : "未破招"}${p.firstStrike && incoming === 0 ? "，剑经抢先收势，对手未及反击" : ""}：对手气势 −${damage}，自身气势 −${incoming}${healing ? `，调息 +${healing}${p.herbs ? "、灵草 −1" : ""}` : ""}。`,
      );
      if (d.hp === 0 || d.enemyHp === 0 || d.turn === 6)
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
  if (
    Number(s.version) >= 15 &&
    (!Array.isArray(r.origins) ||
      r.origins.length > 2 ||
      new Set(r.origins).size !== r.origins.length ||
      !r.origins.every((k) => Object.hasOwn(originNotes, k)))
  )
    return false;
  const allowed = {
    meet: [
      "help",
      "share",
      "listen",
      ...(Number(s.version) >= 15 ? ["recognize"] : []),
    ],
    ...(Number(s.version) >= 15 ? { background: ["listen"] } : {}),
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
        Object.hasOwn(allowed, k) &&
        allowed[k as keyof typeof allowed]?.includes(v),
    )
  )
    return false;
  if (r.answers.meet === "recognize" && !recognizedOrigin(s)) return false;
  if (r.answers.background && !r.met) return false;
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
      !int(d.turn, Number(s.version) >= 14 ? 5 : 2) ||
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
