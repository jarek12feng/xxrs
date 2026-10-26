export type Path = "wood" | "sword" | "spirit";
export const paths = {
  wood: {
    name: "长春功",
    label: "养生 · 稳健",
    gain: 9,
    bonus: 12,
    description: "修炼平缓，寿元额外增加十二年。",
  },
  sword: {
    name: "青锋诀",
    label: "剑修 · 精进",
    gain: 14,
    bonus: 0,
    description: "修炼最快，突破概率略低。",
  },
  spirit: {
    name: "观星经",
    label: "悟道 · 通明",
    gain: 11,
    bonus: 0,
    description: "参悟天机，突破概率额外增加一成。",
  },
};
export const realms = ["炼气", "筑基", "金丹", "元婴", "化神", "飞升"];
export const thresholds = [360, 650, 1000, 1450, 2000];
export interface Choice {
  text: string;
  hint: string;
  qi?: number;
  stones?: number;
  pills?: number;
  years?: number;
  insight?: number;
}
export interface Encounter {
  id: string;
  title: string;
  body: string;
  choices: Choice[];
}
export const encounters: Encounter[] = [
  {
    id: "spring",
    title: "山泉洗髓",
    body: "山涧深处，一眼灵泉映着月色。泉边石刻只留四字：取舍由心。",
    choices: [
      { text: "静坐泉畔", hint: "修为 +40", qi: 40 },
      { text: "汲泉换取灵石", hint: "灵石 +18", stones: 18 },
    ],
  },
  {
    id: "merchant",
    title: "云游药商",
    body: "一位背着药篓的老人停在洞府前。他有一枚护脉丹，想换些盘缠。",
    choices: [
      {
        text: "购下护脉丹",
        hint: "灵石 −20 · 护脉丹 +1",
        stones: -20,
        pills: 1,
      },
      { text: "请教药理", hint: "感悟 +2", insight: 2 },
    ],
  },
  {
    id: "cave",
    title: "无名古洞",
    body: "雨后山壁裂开一道缝隙，隐约透出灵光。深入或许有所收获，也会耗去修行岁月。",
    choices: [
      { text: "入洞寻宝", hint: "寿元上限 −1年 · 修为 +75", years: -1, qi: 75 },
      { text: "记下洞口，继续修行", hint: "感悟 +2", insight: 2 },
    ],
  },
  {
    id: "traveler",
    title: "渡口相逢",
    body: "一位负伤的散修在渡口求援。他握紧的不是法宝，而是一封未寄出的家书。",
    choices: [
      { text: "赠药相助", hint: "灵石 −10 · 感悟 +5", stones: -10, insight: 5 },
      { text: "送他一程", hint: "修为 +20", qi: 20 },
    ],
  },
  {
    id: "moon",
    title: "月下问道",
    body: "月满之夜，你忽然想起初入山门的自己。修行至今，究竟为何？",
    choices: [
      { text: "为见更远的天地", hint: "修为 +45", qi: 45 },
      { text: "为珍重当下之身", hint: "寿元上限 +2年", years: 2 },
    ],
  },
  {
    id: "market",
    title: "山下小集",
    body: "山下集市开了。摊贩叫卖着灵谷与旧书，远处传来熟悉的人间烟火声。",
    choices: [
      { text: "出售多余灵草", hint: "灵石 +25", stones: 25 },
      { text: "翻阅旧书", hint: "感悟 +4", insight: 4 },
    ],
  },
  {
    id: "storm",
    title: "风雨悟剑",
    body: "骤雨拍打竹林，千叶齐鸣。你在风声中听出一道未曾领会的剑意。",
    choices: [
      { text: "迎雨演练", hint: "修为 +55", qi: 55 },
      { text: "收心参悟", hint: "感悟 +3", insight: 3 },
    ],
  },
  {
    id: "crane",
    title: "白鹤衔芝",
    body: "一只白鹤落在庭前，口衔灵芝，似在等待你做出回应。",
    choices: [
      {
        text: "以灵石换芝",
        hint: "灵石 −15 · 寿元上限 +4年",
        stones: -15,
        years: 4,
      },
      { text: "任它自由离去", hint: "感悟 +3", insight: 3 },
    ],
  },
  {
    id: "letter",
    title: "故乡来信",
    body: "故乡寄来一封信。少年时的伙伴已经成家，院里的桃树又开了一次花。",
    choices: [
      {
        text: "寄些灵石回乡",
        hint: "灵石 −8 · 感悟 +4",
        stones: -8,
        insight: 4,
      },
      { text: "珍藏书信", hint: "修为 +25", qi: 25 },
    ],
  },
  {
    id: "relic",
    title: "前人遗泽",
    body: "一座无名石碑立在山径旁。苔痕掩住姓名，却掩不住石下温润的灵气。",
    choices: [
      { text: "拂去青苔，行礼参悟", hint: "感悟 +5", insight: 5 },
      { text: "借灵气温养经脉", hint: "修为 +50", qi: 50 },
    ],
  },
];
export interface State {
  version: 1;
  seed: number;
  name: string;
  path: Path;
  life: number;
  month: number;
  age: number;
  limit: number;
  realm: number;
  qi: number;
  stones: number;
  pills: number;
  insight: number;
  legacy: number;
  earned: number;
  status: "alive" | "dead" | "ascended";
  pending: number | null;
  lastEvent: number;
  log: { month: number; text: string; kind: string }[];
  seen: string[];
  result: string;
}
export type Command =
  | { id: string; type: "tick"; months: number }
  | {
      id: string;
      type: "choose";
      event: number;
      option: number;
      expectedMonth?: number;
    }
  | { id: string; type: "break"; pill: boolean }
  | { id: string; type: "next"; gift: "insight" | "wealth" | "health" };
export function createGame(name: string, path: Path, seed = 12345): State {
  return {
    version: 1,
    seed: seed >>> 0 || 1,
    name: name.trim().slice(0, 16) || "无名",
    path,
    life: 1,
    month: 0,
    age: 16 * 12,
    limit: (48 + paths[path].bonus) * 12,
    realm: 0,
    qi: 0,
    stones: 25,
    pills: 0,
    insight: 0,
    legacy: 0,
    earned: 0,
    status: "alive",
    pending: null,
    lastEvent: -1,
    log: [
      {
        month: 0,
        text: "十六岁，你辞别故乡，来到听松山，开始了这一世修行。",
        kind: "story",
      },
    ],
    seen: [],
    result: "",
  };
}
function draw(s: State) {
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
export function chance(s: State) {
  return Math.min(
    92,
    Math.max(
      15,
      55 -
        s.realm * 5 +
        Math.min(s.insight, 25) +
        (s.path === "spirit" ? 10 : s.path === "sword" ? -5 : 0),
    ),
  );
}
function end(s: State, ascended = false) {
  s.status = ascended ? "ascended" : "dead";
  s.pending = null;
  s.earned = Math.max(3, 2 + s.realm * 2 + Math.floor(s.month / 120));
  s.legacy += s.earned;
  s.result = ascended
    ? "天门洞开，你踏过云海，将这一世留在人间。"
    : "灯火渐微，山风依旧。你的一世修行，就此落笔。";
  record(s, s.result, "major");
}
export function dispatch(input: State, c: Command): State {
  if (input.seen.includes(c.id)) return input;
  const s: State = structuredClone(input);
  const accept = () => {
    s.seen.push(c.id);
    s.seen = s.seen.slice(-512);
    return s;
  };
  if (c.type === "next") {
    if (s.status === "alive") return input;
    const cost = 3;
    if (s.legacy < cost) return input;
    draw(s);
    const n = createGame(s.name, s.path, s.seed);
    n.life = s.life + 1;
    n.legacy = s.legacy - cost;
    if (c.gift === "insight") n.insight = 10;
    if (c.gift === "wealth") {
      n.stones = 65;
      n.pills = 1;
    }
    if (c.gift === "health") n.limit += 8 * 12;
    n.log[0].text = `第 ${n.life} 世，你带着前尘的${c.gift === "insight" ? "悟性" : c.gift === "wealth" ? "机缘" : "生息"}重新踏入山门。`;
    n.seen = [c.id];
    return n;
  }
  if (s.status !== "alive") return input;
  if (
    c.type === "choose" &&
    c.expectedMonth !== undefined &&
    c.expectedMonth !== s.month
  )
    return input;
  if (c.type === "tick") {
    if (
      s.pending !== null ||
      !Number.isInteger(c.months) ||
      c.months < 1 ||
      c.months > 12
    )
      return input;
    for (let i = 0; i < c.months; i++) {
      s.month++;
      s.age++;
      if (s.age >= s.limit) {
        end(s);
        break;
      }
      s.qi = Math.min(
        thresholds[s.realm],
        s.qi + paths[s.path].gain + s.realm * 3,
      );
      if (s.month % 3 === 0) s.stones += 3;
      if (s.month % 9 === 0) {
        let e = Math.floor(draw(s) * encounters.length);
        if (e === s.lastEvent) e = (e + 1) % encounters.length;
        s.pending = e;
        s.lastEvent = e;
        break;
      }
    }
    return accept();
  }
  if (c.type === "choose") {
    if (s.pending === null || c.event !== s.pending) return input;
    const e = encounters[s.pending],
      o = e.choices[c.option];
    if (!o || s.stones + (o.stones || 0) < 0) return input;
    s.qi = Math.min(thresholds[s.realm], s.qi + (o.qi || 0));
    s.stones += o.stones || 0;
    s.pills += o.pills || 0;
    s.insight += o.insight || 0;
    s.limit += (o.years || 0) * 12;
    record(s, `${e.title}：${o.text}。${o.hint}`);
    s.pending = null;
    if (s.age >= s.limit) end(s);
    return accept();
  }
  if (
    s.pending !== null ||
    s.qi < thresholds[s.realm] ||
    (c.pill && s.pills < 1)
  )
    return input;
  const probability = Math.min(97, chance(s) + (c.pill ? 20 : 0));
  if (c.pill) s.pills--;
  const roll = Math.floor(draw(s) * 100);
  if (roll < probability) {
    s.realm++;
    s.qi = 0;
    s.limit += 18 * 12;
    s.result = `突破成功 · ${realms[s.realm]}。判定 ${roll + 1}/100，成功率 ${probability}%。`;
    record(s, s.result, "major");
    if (s.realm === 5) end(s, true);
  } else {
    s.qi = Math.floor(s.qi * 0.65);
    s.limit -= 2 * 12;
    s.insight += 2;
    s.result = `突破失败，修为保留六成五，寿元上限减少两年，感悟 +2。判定 ${roll + 1}/100，成功率 ${probability}%。`;
    record(s, s.result, "warning");
    if (s.age >= s.limit) end(s);
  }
  return accept();
}
export function validState(x: unknown): x is State {
  if (!x || typeof x !== "object") return false;
  const s = x as State;
  return (
    s.version === 1 &&
    typeof s.name === "string" &&
    s.name.length > 0 &&
    s.name.length <= 16 &&
    Object.hasOwn(paths, s.path) &&
    ["alive", "dead", "ascended"].includes(s.status) &&
    [
      "seed",
      "life",
      "month",
      "age",
      "limit",
      "realm",
      "qi",
      "stones",
      "pills",
      "insight",
      "legacy",
      "earned",
    ].every(
      (k) =>
        Number.isSafeInteger(s[k as keyof State]) &&
        Number(s[k as keyof State]) >= 0,
    ) &&
    s.realm <= 5 &&
    s.seed > 0 &&
    s.seed <= 0xffffffff &&
    s.life >= 1 &&
    (s.status !== "alive" || s.age < s.limit) &&
    (s.status !== "ascended" || s.realm === 5) &&
    (s.status === "alive" || s.pending === null) &&
    (s.status !== "alive" || s.qi <= thresholds[s.realm]) &&
    (s.status !== "alive" || s.realm < 5) &&
    (s.pending === null ||
      (Number.isInteger(s.pending) &&
        s.pending >= 0 &&
        s.pending < encounters.length)) &&
    Array.isArray(s.seen) &&
    s.seen.length <= 512 &&
    s.seen.every((i) => typeof i === "string") &&
    Array.isArray(s.log) &&
    s.log.length <= 180 &&
    s.log.every(
      (l) =>
        l != null &&
        typeof l.text === "string" &&
        typeof l.kind === "string" &&
        Number.isSafeInteger(l.month),
    ) &&
    typeof s.result === "string" &&
    Number.isInteger(s.lastEvent) &&
    s.lastEvent >= -1 &&
    s.lastEvent < encounters.length
  );
}
