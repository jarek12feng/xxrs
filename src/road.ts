import type { State } from "./world";

export type RoadStage =
  "home" | "market" | "pass" | "camp" | "beyond" | "lookout";
export type RoadRoute = "none" | "art" | "relic" | "friend";
export type RoadClue = "ledger" | "marks" | "names";
export const roadClues = {
  ledger: {
    stage: "market",
    action: "examineLedger",
    name: "药队旧账册",
    hint: "郁青为何总把归程画得更细？",
    text: "账册上，收入旁边另记着一列平安归来的人数。郁青指着空白的一行：“那年山风转急，我们只顾赶路。”他把药队避风歇脚的时刻告诉你：路，不一定要硬闯。",
  },
  marks: {
    stage: "pass",
    action: "examineMarks",
    name: "石阶上的刻痕",
    hint: "风声骤紧时，石缝里的草为何没有动？",
    text: "你蹲下查看，发现刻痕一直朝向背风石阶。青嶂终于放下横着的木杖：“那是我替上一支药队刻的。认得路，还得肯等风。”结合药队账册的歇脚时刻，可循避风路谨慎过关。",
  },
  names: {
    stage: "lookout",
    action: "examineNames",
    name: "路簿里的旧名字",
    hint: "有人在第一页旁，留了一盏从未撤去的灯。",
    text: "路簿最旧的一页记着当年失散的药队，旁边是青嶂的刻印。他守着山口，不是为了拦住所有人，而是不愿再添一个没能归来的名字。你可以把这页故事带回坊市。",
  },
} as const;
export interface Road {
  stage: RoadStage;
  thanked: boolean;
  met: boolean;
  commission: boolean;
  map: boolean;
  obstacle: "none" | "mist" | "gale";
  route: RoadRoute;
  ally: boolean;
  attempts: number;
  roll: number;
  chance: number;
  passed: boolean;
  surveyed: boolean;
  result: string;
  discoveries: RoadClue[];
  lastApproach: "direct" | "sheltered";
}
export const freshRoad = (): Road => ({
  stage: "home",
  thanked: false,
  met: false,
  commission: false,
  map: false,
  obstacle: "none",
  route: "none",
  ally: false,
  attempts: 0,
  roll: 0,
  chance: 0,
  passed: false,
  surveyed: false,
  result: "",
  discoveries: [],
  lastApproach: "direct",
});
export type RoadAction =
  | "thanks"
  | "market"
  | "talk"
  | "accept"
  | "deliver"
  | "verify"
  | "pass"
  | "inspect"
  | "camp"
  | "art"
  | "relic"
  | "friend"
  | "invite"
  | "challenge"
  | "lookout"
  | "survey"
  | "back"
  | "shelteredChallenge"
  | RoadInvestigationAction;
export type RoadInvestigationAction = (typeof roadClues)[RoadClue]["action"];
export const roadScenes = {
  home: {
    name: "有人记得你",
    image: "/scenes/apothecary.jpg",
    mood: "warm",
    body: "药工把门前的灯挑亮了些。他见你进门，先给你添了一碗热汤，才从柜底取出那张缺角航图。原来，归来并不是故事的终点。",
  },
  market: {
    name: "山下坊市",
    image: "/scenes/mountain-market.jpg",
    mood: "warm",
    body: "药香、茶汽与叫卖声混在一起。地图摊前的年轻行脚人郁青认出药工的印记。他手里恰有缺失的图角，却还有一批送往山口的伤药没有备齐。",
  },
  pass: {
    name: "青嶂关",
    image: "/scenes/mist-path.jpg",
    mood: "mist",
    body: "青角妖修青嶂横杖拦路：“不是不让你过去。前面山风会剥去护体灵气，筑基未稳，走进去就是送命。先看清这片山，再决定怎么走。”",
  },
  camp: {
    name: "山口行营",
    image: "/scenes/moon-terrace.png",
    mood: "moon",
    body: "你把补全的航图压在石桌上。这一次，凝神、固本和准备灵器都有了明确用途。山口一直在那里，不会因为你暂时退回来就消失。",
  },
  beyond: {
    name: "云外长路",
    image: "/scenes/cloud-frontier.jpg",
    mood: "warm",
    body: "你终于站到了云层之上。曾经只在航图上见过的瀑布就在脚下，远处旅亭亮起了灯。青嶂收起木杖：“记住，你走过的路，也可以给后来的人留着。”",
  },
  lookout: {
    name: "云栈旅亭",
    image: "/scenes/cloud-frontier.jpg",
    mood: "warm",
    body: "亭中有人晾着湿透的行囊。郁青的旧同伴留下了一本路簿：往东是药工营地，往北是常年无灯的雾海。你开始为后来的人补画第一段安全的归路。",
  },
} as const;
export function roadGoal(s: State): string {
  const r = s.adventure.road;
  if (r.stage === "home") return "回访药工与温蘅，问清航图缺角的去向。";
  if (r.passed && r.stage === "market")
    return r.surveyed
      ? "听听郁青的回应；归路已通，可重访旅亭，或展开山河见闻。"
      : "山口已经打通，去云栈旅亭留下归路，往返不再消耗补给。";
  if (r.passed && r.stage === "camp")
    return "归路已经打通。可以在此休整，也可免费重访云栈旅亭。";
  if (r.stage === "market")
    return !r.met
      ? "认识地图摊的郁青，打听缺角。"
      : !r.commission
        ? "决定是否帮郁青备齐山口伤药，换取图角。"
        : !r.map
          ? "交付灵草 4，或凭神识 6、心得 2 帮忙辨药，完成委托。"
          : "航图补全了。可以邀郁青同行，去青嶂关看看。";
  if (r.stage === "beyond")
    return r.surveyed
      ? "沿熟悉的归路重访旅亭，或展开山河见闻，继续追寻未完的故事。"
      : "你已越过青嶂关。前往云栈旅亭，留下属于你的第一段路。";
  if (r.stage === "lookout")
    return r.surveyed
      ? "归路已记入路簿。回访坊市看看回应，或继续现有山河见闻。"
      : "辨认路簿上的安全标记，将你的过关经验留给后来的人。";
  if (r.obstacle === "none") return "先观察守境妖修与山风，别急着闯关。";
  if (s.realm === 0)
    return "准备筑基：积累修为、赴陆迟旧约、凝神固本，再挑战山口。";
  return "按已知危险选择功法、灵器或同行援助，准备妥当后挑战青嶂关。";
}
export function roadDetails(
  s: State,
  approach: "direct" | "sheltered" = "direct",
) {
  const r = s.adventure.road;
  const routeBonus =
    r.route === "art" && (s.journey.main || s.journey.support)
      ? 20
      : r.route === "relic" && s.journey.equipped
        ? s.journey.relics[s.journey.equipped] * 10 +
          (s.journey.equipped === "vial" ? 10 : 0)
        : r.route === "friend" && r.ally
          ? 20
          : 0;
  const terms = [
    { name: "稳住气息", value: 14 + Math.floor(s.root / 2) },
    { name: "神识", value: s.sense * 2 },
    { name: "根基", value: s.foundation },
    { name: "识路心得", value: s.study * 4 },
    { name: "所选准备", value: routeBonus },
    {
      name: r.obstacle === "mist" ? "识破迷雾" : "抵御罡风",
      value:
        (r.obstacle === "mist" && s.sense >= 8) ||
        (r.obstacle === "gale" && s.foundation >= 12)
          ? 5
          : 0,
    },
    { name: "伤势", value: -s.injury * 8 },
  ];
  if (approach === "sheltered" && hasShelteredRoute(s))
    terms.push({ name: "避风路与歇脚时刻", value: 10 });
  return {
    terms,
    chance: Math.max(
      5,
      Math.min(
        100,
        terms.reduce((sum, t) => sum + t.value, 0),
      ),
    ),
  };
}
export function hasShelteredRoute(s: State): boolean {
  return (
    s.adventure.road.discoveries.includes("ledger") &&
    s.adventure.road.discoveries.includes("marks")
  );
}
export function roadError(s: State, action: RoadAction): string {
  const r = s.adventure.road;
  if (s.adventure.step !== "done") return "先完成药工营救";
  if (
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel
  )
    return "先处理眼前的事情";
  const allowed: Record<RoadAction, RoadStage[]> = {
    thanks: ["home"],
    market: ["home", "camp", "pass", "lookout"],
    talk: ["market"],
    accept: ["market"],
    deliver: ["market"],
    verify: ["market"],
    pass: ["market", "camp"],
    inspect: ["pass"],
    camp: ["pass", "market"],
    art: ["camp"],
    relic: ["camp"],
    friend: ["camp"],
    invite: ["market", "camp"],
    challenge: ["pass"],
    lookout: ["beyond"],
    survey: ["lookout"],
    back: ["lookout"],
    examineLedger: ["market"],
    examineMarks: ["pass"],
    examineNames: ["lookout"],
    shelteredChallenge: ["pass"],
  };
  if (!Object.hasOwn(allowed, action) || !allowed[action].includes(r.stage))
    return "不在对应地点";
  const clue = (Object.keys(roadClues) as RoadClue[]).find(
    (key) => roadClues[key].action === action,
  );
  if (clue) {
    if (r.discoveries.includes(clue)) return "已记入行路手记";
    if (clue === "ledger" && !r.met) return "先认识摊主郁青，再询问他的账册";
    if (clue === "marks" && r.obstacle === "none")
      return "先观察山风，辨清眼前的危险";
  }
  if (action === "thanks" && r.thanked) return "已经回访";
  if (action === "market" && !r.thanked) return "先听药工说完";
  if (action === "talk" && r.met) return "已经认识郁青";
  if (action === "accept" && (!r.met || r.commission))
    return r.commission ? "已接下委托" : "先与郁青交谈";
  if (["deliver", "verify"].includes(action)) {
    if (!r.commission || r.map) return r.map ? "已拿到图角" : "先接下委托";
    if (action === "deliver" && s.herbs < 4)
      return "需要灵草 4；可在此购药或在修行面板采药";
    if (action === "verify" && (s.sense < 6 || s.study < 2))
      return "需要神识 6、心得 2";
  }
  if (["pass", "camp", "invite"].includes(action) && !r.map)
    return "先补全航图";
  if (action === "invite" && r.ally) return "郁青已经答应同行";
  if (action === "inspect" && r.obstacle !== "none")
    return "已看清危险，不会刷新重抽";
  if (["art", "relic", "friend"].includes(action) && r.route === action)
    return "已选择此准备方向";
  if (action === "challenge" || action === "shelteredChallenge") {
    if (r.passed) return "已经过关";
    if (r.obstacle === "none") return "先观察山口";
    if (s.realm !== 1) return "山风剥离护体，需先筑基；可回行营安排修行";
    if (s.injury >= 3) return "伤势过重，先养伤至 2 以下";
    if (r.route === "none") return "回行营选择一种准备方向";
    if (r.route === "art" && !s.journey.main && !s.journey.support)
      return "先学会并装配一本功法";
    if (r.route === "relic" && !s.journey.equipped)
      return "先炼制并装配一件灵器";
    if (r.route === "friend" && !r.ally) return "先邀请郁青同行";
    if (action === "shelteredChallenge" && !hasShelteredRoute(s))
      return "需结合坊市药队账册与山口刻痕，找到避风路";
    const cost = action === "shelteredChallenge" ? 6 : 4;
    if (s.stones < cost) return `需要灵石 ${cost} 用于过关补给`;
  }
  if (action === "survey" && r.surveyed) return "已为后来者记路";
  return "";
}
function roll(s: State) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0 || 1;
  return Math.floor((s.seed / 4294967296) * 100) + 1;
}
export function runRoad(input: State, action: RoadAction, id: string): State {
  if (roadError(input, action)) return input;
  const s = structuredClone(input),
    r = s.adventure.road;
  r.result = "";
  const clue = (Object.keys(roadClues) as RoadClue[]).find(
    (key) => roadClues[key].action === action,
  );
  if (clue) {
    r.discoveries.push(clue);
    r.result = roadClues[clue].text;
  }
  switch (action) {
    case "thanks":
      r.thanked = true;
      r.result =
        {
          medicine:
            "温蘅认出了你配药的手法：“那株幼草后来活了。你救的不只一个人。”",
          guide:
            "药工记得你和陆迟的分工。他说：“路上有人照应，和独自走，是不一样的。”",
          ward: "药工摸着补好的药篓：“背我出来时，你的手在发抖，却没有松。”",
          none: "药工记得那盏归家的灯。",
        }[s.adventure.method] + " 他指向航图的印记：山下坊市，去找行脚人郁青。";
      break;
    case "market":
      r.stage = "market";
      r.result = r.surveyed
        ? "郁青已经收到旅亭捎来的消息：“现在那条归路上，也有你的名字了。”"
        : r.map
          ? "郁青替你留着茶，问你山口的风是否还大。"
          : "你循着药工的介绍来到坊市。";
      if (r.discoveries.includes("names"))
        r.result =
          "你把路簿中的旧名字告诉郁青。他沉默许久，收起了往日的笑：“下回送药，我要去山口好好谢他。”这一次，航图连起的不只是两个地方。";
      break;
    case "talk":
      r.met = true;
      r.result =
        "郁青不是卖图的。他靠替商队记路谋生，只想让运药的人少走一趟险路。“你救过老药工，这张图角我愿给你。先帮我把这批伤药备齐，好吗？”";
      break;
    case "accept":
      r.commission = true;
      r.result =
        "你答应帮忙。可以交付四株灵草，也可以用神识与辨药心得把混入的毒叶挑出来。两条办法都能换得图角，不必重复做。";
      break;
    case "deliver":
      s.herbs -= 4;
      r.map = true;
      r.result =
        "郁青将伤药包好，交给等在街口的脚夫。他把图角与你的航图拼在一起：青嶂关，在这里。";
      break;
    case "verify":
      r.map = true;
      r.result =
        "你挑出混在灵草里的毒叶，保住了这批伤药。郁青郑重交出图角：“以后看见这枚印记，就知道有人替你探过路。”";
      break;
    case "pass":
      r.stage = r.passed ? "beyond" : "pass";
      break;
    case "inspect":
      r.obstacle = roll(s) <= 50 ? "mist" : "gale";
      r.result =
        r.obstacle === "mist"
          ? "山雾会让近路看起来更安全。神识达到 8，能辨出其中的假象；但穿过风壁仍需筑基。"
          : "罡风会连续冲击护体。根基达到 12，能稳住第一轮冲击；但穿过风壁仍需筑基。";
      break;
    case "camp":
      r.stage = "camp";
      break;
    case "art":
    case "relic":
    case "friend":
      r.route = action;
      r.result = {
        art: "你决定用功法稳住护体。学会后必须装配；神识与根基仍会影响把握。",
        relic: "你决定准备灵器。归元灵瓶能抵御山瘴；炼好后记得装配。",
        friend:
          "你决定与郁青同行。他能辨路，却不能替你承受风壁；自己仍须筑基。",
      }[action];
      break;
    case "invite":
      r.ally = true;
      r.result =
        "郁青答应与你同行：“我识路，你护住自己。过了山口，替我看看云栈旅亭还亮不亮灯。”";
      break;
    case "shelteredChallenge":
    case "challenge": {
      const sheltered = action === "shelteredChallenge";
      s.stones -= sheltered ? 6 : 4;
      r.attempts++;
      r.lastApproach = sheltered ? "sheltered" : "direct";
      r.chance = roadDetails(s, r.lastApproach).chance;
      r.roll = roll(s);
      if (r.roll <= r.chance) {
        r.passed = true;
        r.stage = "beyond";
        r.result =
          {
            art: "你让功法的运转贴着山风的节奏，稳稳穿过风壁。",
            relic: "灵器替你挡住最凌厉的一阵风，你沿着航图走出了迷雾。",
            friend:
              "郁青找出背风的石阶，你稳住灵气，与他一起越过山口。他随后回去接应药队，托你继续探访旅亭。",
            none: "",
          }[r.route] + " 青嶂让出道路，你第一次看见云层那边的世界。";
        if (sheltered)
          r.result =
            "你依照药队歇脚的时刻，在刻痕旁等风回落，再沿背风石阶前行。青嶂点头：“知道什么时候不逞强，也算看懂了山。” " +
            r.result;
      } else {
        if (!sheltered) s.injury = Math.min(6, s.injury + 1);
        r.result = sheltered
          ? `风势比预计更急。把握 ${r.chance}%，判定 ${r.roll}。你及时退入避风石缝，没有新增伤势，但灵石 6 的补给已用去。提高神识或根基后再来，比继续冒险更稳妥。`
          : `山风逼退了你。把握 ${r.chance}%，判定 ${r.roll}；伤势 +1。航图、同行约定和装备都还在。回行营提升神识、根基或换一种准备，再来。`;
      }
      break;
    }
    case "lookout":
      r.stage = "lookout";
      break;
    case "survey":
      r.surveyed = true;
      s.stones += 8;
      r.result =
        "你将背风石阶和假雾的位置画进路簿。旅亭给你灵石 8 作为谢礼。郁青的旧友托人捎话：下次运药，会走你留下的这条路。";
      if (r.discoveries.includes("names"))
        r.result +=
          " 你还替那些没能归来的人留了一页空白：不是等他们回来，是不让后来的人忘记。";
      break;
    case "back":
      r.stage = "camp";
      r.result =
        "你记得回来的路。此后再过青嶂关不重复收费，也不会再次抽取胜负。";
      break;
  }
  s.seen = [...s.seen, id].slice(-512);
  s.log.unshift({
    month: s.month,
    kind: "story",
    text: `山外·${roadScenes[r.stage].name}：${r.result || roadGoal(s)}`,
  });
  s.log = s.log.slice(0, 180);
  return s;
}
function validRoadProgress(r: Road, s: State): boolean {
  if (s.adventure.step !== "done") {
    const { discoveries: _, lastApproach: __, ...initial } = freshRoad();
    return (
      !!r &&
      (Object.keys(initial) as (keyof typeof initial)[]).every(
        (k) => r[k] === initial[k],
      )
    );
  }
  const int = (x: unknown, max = 1e9) =>
    Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
  return (
    !!r &&
    Object.hasOwn(roadScenes, r.stage) &&
    ["thanked", "met", "commission", "map", "ally", "passed", "surveyed"].every(
      (k) => typeof r[k as keyof Road] === "boolean",
    ) &&
    ["none", "mist", "gale"].includes(r.obstacle) &&
    ["none", "art", "relic", "friend"].includes(r.route) &&
    int(r.attempts) &&
    int(r.roll, 100) &&
    int(r.chance, 100) &&
    typeof r.result === "string" &&
    r.result.length < 1500 &&
    (!r.met || (r.thanked && r.stage !== "home")) &&
    (!r.commission || r.met) &&
    (!r.map || r.commission) &&
    (!r.ally || r.map) &&
    (r.route === "none" || r.map) &&
    (!r.thanked || s.adventure.step === "done") &&
    (r.stage === "home" || r.thanked) &&
    (!["pass", "camp", "beyond", "lookout"].includes(r.stage) || r.map) &&
    (r.obstacle === "none" ? r.attempts === 0 : r.map) &&
    (r.attempts === 0
      ? r.roll === 0 && r.chance === 0
      : r.roll >= 1 &&
        r.chance >= 5 &&
        r.route !== "none" &&
        (r.passed || r.roll > r.chance)) &&
    (!r.passed || (s.realm === 1 && r.attempts > 0 && r.roll <= r.chance)) &&
    (!["beyond", "lookout"].includes(r.stage) || r.passed) &&
    (!r.surveyed || r.passed)
  );
}
export function validRoad(r: Road, s: State): boolean {
  return (
    validRoadProgress(r, s) &&
    Array.isArray(r.discoveries) &&
    r.discoveries.length <= 3 &&
    r.discoveries.every(
      (k) => typeof k === "string" && Object.hasOwn(roadClues, k),
    ) &&
    new Set(r.discoveries).size === r.discoveries.length &&
    ["direct", "sheltered"].includes(r.lastApproach) &&
    (!r.discoveries.includes("ledger") || r.met) &&
    (!r.discoveries.includes("marks") || r.obstacle !== "none") &&
    (!r.discoveries.includes("names") || r.passed) &&
    (r.lastApproach === "direct" || (r.attempts > 0 && hasShelteredRoute(s))) &&
    (s.adventure.step === "done" ||
      (r.discoveries.length === 0 && r.lastApproach === "direct"))
  );
}
