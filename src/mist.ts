import { companionPresent } from "./foundation-journey/progression";
import { expeditionMistEcho } from "./expedition/resolution";
import type { State } from "./world";
import { companions } from "./social";

export type MistStage =
  | "dormant"
  | "letter"
  | "camp"
  | "garden"
  | "station"
  | "gate"
  | "archive"
  | "home"
  | "shrine";
export type MistPartner = "none" | "solo" | "luchi" | "companion";
export interface Mist {
  stage: MistStage;
  partner: MistPartner;
  firstRoute: "none" | "garden" | "station";
  garden: boolean;
  station: boolean;
  hazard: "none" | "echo" | "wind";
  vow: "none" | "steady" | "pursue";
  insight: boolean;
  ward: boolean;
  attempts: number;
  roll: number;
  chance: number;
  passed: boolean;
  lamp: boolean;
  settled: boolean;
  revisited: boolean;
  result: string;
}
export const freshMist = (): Mist => ({
  stage: "dormant",
  partner: "none",
  firstRoute: "none",
  garden: false,
  station: false,
  hazard: "none",
  vow: "none",
  insight: false,
  ward: false,
  attempts: 0,
  roll: 0,
  chance: 0,
  passed: false,
  lamp: false,
  settled: false,
  revisited: false,
  result: "",
});
export type MistAction =
  | "caravanBridge"
  | "receive"
  | "accept"
  | "camp"
  | "solo"
  | "luchi"
  | "companion"
  | "garden"
  | "station"
  | "tend"
  | "attune"
  | "decode"
  | "gate"
  | "steady"
  | "pursue"
  | "challenge"
  | "ward"
  | "read"
  | "home"
  | "share"
  | "shrine"
  | "illuminate";
export const mistScenes: Record<
  MistStage,
  { title: string; image: string; body: string }
> = {
  dormant: {
    title: "旅亭来信",
    image: "/scenes/cloud-frontier.jpg",
    body: "你留下的归路迎来了第一位信使。他送来的信，落款竟是失踪药队里的陈渡。",
  },
  letter: {
    title: "不该到来的信",
    image: "/scenes/cloud-frontier.jpg",
    body: "信纸是旧的，封口的灵光却刚刚熄灭。陆迟认出半枚护路印：父亲的旧物上，也有同样的缺口。信中只写着：若归路重开，请到雾海驿站取灯。",
  },
  camp: {
    title: "灯下分路",
    image: "/scenes/moon-terrace.png",
    body: "你把信压在航图上。旧药圃还有人记得当年的信使；废驿保留着信阵的走向。先找人问清往事，还是先追查信从何处来？两条路都通往雾海，不必把每个地方走完才出发。",
  },
  garden: {
    title: "雾生旧药圃",
    image: "/scenes/mist-herb-garden.jpg",
    body: "药圃里的石角没有拔刀。他捧着一株枯萎的引灯草，望向断水的石渠：“陈渡答应回来修渠。后来信来了一封，人却没有回来。想问他的事，先帮我救下这些草。”",
  },
  station: {
    title: "无人的废驿",
    image: "/scenes/mist-courier-station.jpg",
    body: "雨水流过环形阵纹，信袋却没有沾湿。两条灵脉一进一出：一道送信，一道引人回家。强行拆阵会毁掉旧信，你需要辨清哪条才是归路。",
  },
  gate: {
    title: "雾海回声阵",
    image: "/scenes/mist-courier-station.jpg",
    body: "阵门里传来熟悉的呼唤，断桥旁却还系着药队留下的归绳。要赶在回声消失前追信，还是多备补给，先稳住大家的退路？雾里又响了一声，归绳绷得笔直。",
  },
  archive: {
    title: "灯还在等人",
    image: "/scenes/mist-courier-station.jpg",
    body: "门后没有人，只有陈渡留下的寄信阵。你修通的山路使旧阵重新接上灵脉，这封迟到的信才终于送出。灯旁的记录写着：陆迟的父亲曾护送最后一支药队离开，他并没有独自逃走。",
  },
  home: {
    title: "有人等你归来",
    image: "/scenes/mountain-market.jpg",
    body: "郁青收起空白的路簿。探灵灯搁在摊前，灯光映出路簿上早已褪色的几行字。陆迟也在茶摊等你。",
  },
  shrine: {
    title: "再见那座山祠",
    image: "/characters/luchi-relic.png",
    body: "你曾在这里救出药工。如今再看，倒塌的阵门背后还有一道浅浅的刻痕。过去你只看见一堵墙，这一次，也许能看见墙后的人留下了什么。",
  },
};
export function mistHomeBody(s: State): string {
  if (s.journey.maps.sea === 3)
    return "探灵灯照着你整理好的行路记录。陆迟已带亲笔信回到故乡，与母亲等候守灯人的归期。郁青留在茶摊，继续核对尚未归来的药工名单。";
  return (
    "郁青收起空白的路簿。探灵灯搁在摊前，灯光映出路簿上早已褪色的几行字。" +
    (s.adventure.mist.partner === "luchi"
      ? "陆迟与你一起放下行囊，把共同带回的记录铺在茶桌上。"
      : "陆迟在茶摊等你，想听听你带回的消息。")
  );
}
export function mistPartner(s: State) {
  const m = s.adventure.mist;
  if (m.partner === "companion" && s.social.gender)
    return {
      name: companions[s.social.gender].name,
      portrait: companions[s.social.gender].portrait,
    };
  if (m.stage === "home" && s.journey.maps.sea === 3)
    return { name: "行路手记", portrait: null };
  if (m.partner === "luchi" || m.stage === "letter" || m.stage === "home")
    return { name: "陆迟", portrait: "/characters/luchi-base.png" };
  return { name: "行路手记", portrait: null };
}
export function mistQuote(s: State): string {
  const m = s.adventure.mist;
  if (m.stage === "home" && s.journey.maps.sea === 3)
    return "亲笔信已送到家中，守灯人尚未归来。寻亲已有答案，你的修行仍有自己的方向。";
  if (m.stage === "letter")
    return s.journey.maps.sea >= 2
      ? "我们已经知道他在守灯。可他当年为什么留下来，家书里没有细说，也许答案就在这里。"
      : "我想知道他去了哪里。但这一次，我不想把等我们回来的人也丢下。";
  if (m.stage === "shrine")
    return m.revisited
      ? m.partner === "luchi"
        ? "我以前只想找到他。现在，我也想把他留下的路照亮。"
        : "下次有人在这里躲过一场雨，也许不会知道我们的名字。可灯会亮着。"
      : "这道刻痕一直都在。是我们终于有了看清它的本领。";
  if (m.stage === "archive")
    return m.partner === "luchi"
      ? "这行字，是他写的……先别收起来，让我再看一会儿。"
      : "我们追的那封信，原来一直在等一条能回去的路。";
  if (m.stage === "camp" && m.partner === "none")
    return "把想去的地方圈出来，也想一想，你希望谁和你一起看到答案。";
  if (m.stage === "home" && m.partner === "companion")
    return m.settled
      ? m.vow === "steady"
        ? "那天你先系好归绳，才问我要不要往前走。我记得。下次也一起商量。"
        : "雾里听见你回应约好的信号，我才知道，你不是只顾着往前跑的人。"
      : "先别急着整理战利品。那时你在阵门前想的是什么？我想听你说。";
  if (m.stage === "home")
    return m.settled
      ? "原来他也曾在往前走和等别人之间，做过这样的选择。下一次，我们带着答案回来。"
      : m.partner === "luchi"
        ? "一路都顾着赶路，现在终于能坐下来，一起把父亲留下的记录再读一遍了。"
        : "先坐一会儿。你愿意把这一路的事，从头讲给我听吗？";
  if (m.passed)
    return m.partner === "luchi"
      ? "以前走过这里，我只顾着赶路。这次想再听听他们说当年的事。"
      : "信的来路弄清了，可路上的人，还有他们自己的故事。我们不妨再停一会儿。";
  if (m.partner === "companion")
    return m.vow === "pursue"
      ? "我会替你认清阵纹。答应我，听见撤退的信号就回来。"
      : s.social.gender === "male"
        ? "我想画下的不只是你走得过的路，而是我们都能走回来的路。"
        : "我想修好的不只是一座阵，而是让我们都能走回来的路。";
  if (m.partner === "luchi")
    return m.vow === "steady"
      ? "我也急着找他。可你说得对，不能让一个人的盼头变成所有人的险路。"
      : "这次让我帮你守住归绳。无论信里写了什么，我们一起看。";
  return "独行不是没有牵挂。把撤退的路记住，再往前走。";
}
export function mistGoal(s: State): string {
  const m = s.adventure.mist;
  if (m.stage === "dormant") return "旅亭记路后，一封迟到的信将开启第三卷。";
  if (m.stage === "letter")
    return "追查陈渡的来信，找出护路印与陆迟父亲的关系。";
  if (m.stage === "shrine")
    return m.revisited
      ? "你已照见旧墙后的归路誓言。此章完成，可补探另一条支线或继续山河见闻。"
      : m.lamp
        ? "举起探灵灯，看看当初无法看见的东西。"
        : "记住这道看不清的刻痕。雾海来信提到的灯，也许能照出它。";
  if (m.stage === "archive")
    return "读完陈渡的记录，带走探灵灯；它能照见旧地点的隐藏阵迹。";
  if (m.stage === "home" && m.revisited)
    return s.journey.maps.sea === 3
      ? "归灯与家书都已完成。可补探尚未走过的支线，或回看人物档案。"
      : "归灯已经点亮，本章已完成。可补探支线；陆迟家书的后续见山河探索·道友寻亲。";
  if (m.stage === "home")
    return m.settled
      ? "带着探灵灯重访救过药工的山祠，看看旧墙后藏着什么。"
      : m.partner === "luchi"
        ? "与陆迟一起整理带回的记录，谈谈这一路。"
        : "把来信真相告诉陆迟，与同行者谈谈这一路。";
  if (m.stage === "garden")
    return m.garden
      ? m.passed
        ? "石角的证言补全了旧事。回坊市分享，或再看看其他旧路。"
        : "石角已交出引灯草的记忆；可以去阵门，或补探废驿。"
      : s.adventure.rescueChoice === "roots"
        ? "山祠留下的护根手法在这里也能使用：独自疏通，不耗灵草。"
        : s.adventure.road.solution === "medicine"
          ? "沿用青嶂关救草手法，不耗灵草也能疏通根脉。"
          : m.lamp
            ? "探灵灯能照出堵塞的根脉，不耗灵草也能救下药圃。"
            : "可用灵草 4 救治引灯草，或用辨草知识 / 同行援助疏通根脉。";
  if (m.stage === "station")
    return m.station
      ? m.passed
        ? "旧阵的节拍已记下。回坊市整理发现，或补探药圃的往事。"
        : "你已掌握归阵节拍；可以去阵门，或问问药圃的往事。"
      : s.adventure.road.solution === "array"
        ? "沿用与青嶂立约时记下的归阵手法，可独自辨读旧阵。"
        : `神识 8 + 心得 2 可辨认旧阵；${s.social.met && s.social.gender ? companions[s.social.gender].name : "相识的同行者"}也能协作辨阵。`;
  if (m.stage === "gate")
    return m.passed
      ? "阵门已开，信阵中的旧记录正等你阅读。"
      : m.vow === "none"
        ? "与同行者商定追信或护归路，再决定是否尝试。"
        : m.insight && !m.ward
          ? "失败带回了阵眼情报。回营研究护归法，或提高自身能力，再来验证准备。"
          : "把握与代价已明确，可以挑战，也可以回营调整准备。";
  if (m.passed)
    return m.revisited
      ? "归灯已经点亮。这一章已完成，未走过的支线仍可补探。"
      : m.settled
        ? "你已带回探灵灯。重访旧山祠，或用新本领补探药圃。"
        : "回坊市与等你的人分享真相，再带灯重访旧山祠。";
  return m.partner === "none"
    ? "决定与谁同行，再选择先探旧药圃还是废驿。独行也能完整通关。"
    : "选择你更在意的一条线索；找到一处证据即可前往阵门，另一条随时能补探。";
}
export function mistDetails(s: State) {
  const m = s.adventure.mist;
  const terms = [
    { name: "筑基护体", value: 20 },
    { name: "神识", value: s.sense * 2 },
    { name: "心得", value: s.study * 4 },
    { name: "根基", value: Math.floor(s.foundation / 2) },
    { name: "药圃引灯草", value: m.garden ? 8 : 0 },
    { name: "废驿归阵节拍", value: m.station ? 8 : 0 },
    {
      name: "同行分工",
      value: m.partner === "solo" || m.partner === "none" ? 0 : 12,
    },
    { name: "护归路的准备", value: m.vow === "steady" ? 10 : 0 },
    { name: "带回的阵眼情报", value: m.insight ? 10 : 0 },
    { name: "护归法", value: m.ward ? 20 : 0 },
    {
      name: "应对当前阵势",
      value:
        (m.hazard === "echo" && s.sense >= 8) ||
        (m.hazard === "wind" && s.foundation >= 12)
          ? 10
          : 0,
    },
    {
      name: "装配灵器",
      value: s.journey.equipped
        ? s.journey.relics[s.journey.equipped] *
          (s.journey.equipped === (m.hazard === "wind" ? "sword" : "vial")
            ? 6
            : 3)
        : 0,
    },
    {
      name: "照夜辨阵",
      value:
        s.journey.support === "lantern" ? 8 + s.growth.training.lantern * 2 : 0,
    },
    {
      name: "主修研修",
      value: s.journey.main ? s.growth.training[s.journey.main] * 2 : 0,
    },
    { name: "伤势", value: -s.injury * 5 },
  ];
  return {
    terms,
    chance: Math.max(
      5,
      Math.min(
        100,
        terms.reduce((sum, t) => sum + t.value, 0),
      ),
    ),
    cost: m.vow === "steady" ? 6 : 3,
  };
}
const allowed: Record<MistAction, MistStage[]> = {
  caravanBridge: ["camp"],
  receive: ["dormant"],
  accept: ["letter"],
  camp: ["garden", "station", "gate", "home", "shrine"],
  solo: ["camp"],
  luchi: ["camp"],
  companion: ["camp"],
  garden: ["camp"],
  station: ["camp"],
  tend: ["garden"],
  attune: ["garden"],
  decode: ["station"],
  gate: ["camp", "garden", "station"],
  steady: ["gate"],
  pursue: ["gate"],
  challenge: ["gate"],
  ward: ["camp"],
  read: ["archive"],
  home: ["camp", "shrine", "garden", "station"],
  share: ["home"],
  shrine: ["camp", "home"],
  illuminate: ["shrine"],
};
export function mistError(s: State, action: MistAction): string {
  const m = s.adventure.mist;
  if (
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel
  )
    return "先处理眼前的事情";
  if (!s.adventure.road.surveyed || s.realm !== 1)
    return "先筑基越关，并在云栈旅亭留下归路";
  if (!Object.hasOwn(allowed, action) || !allowed[action].includes(m.stage))
    return "不在对应地点";
  if (action === "companion" && !companionPresent(s))
    return "对方正在远行或等待接应，不能同时赴约；可独行或邀陆迟";
  if (["solo", "luchi", "companion"].includes(action)) {
    if (m.passed) return "这段同行经历已经写入故事";
    if (m.partner === action) return "已经约好同行方式";
    if (
      action === "companion" &&
      (!s.social.met || !s.social.gender || s.age < 216)
    )
      return "先在人物关系中结识成年异性同行者；也可邀陆迟或独行";
  }
  if (["garden", "station", "gate"].includes(action) && m.partner === "none")
    return "先决定同行者，或选择独行";
  if ((action === "tend" || action === "attune") && m.garden)
    return "已取得药圃证据，不重复消耗";
  if (action === "tend" && s.herbs < 4)
    return "需要灵草 4；可回营购买或用知识疏通";
  if (
    action === "attune" &&
    !m.lamp &&
    s.adventure.rescueChoice !== "roots" &&
    s.adventure.road.solution !== "medicine" &&
    !(s.path === "wood" && s.study >= 2) &&
    m.partner !== "luchi"
  )
    return "需要护根手法、医道心得 2、陆迟同行，或探灵灯";
  if (action === "decode") {
    if (m.station) return "已经读懂旧阵";
    if (
      !(s.sense >= 8 && s.study >= 2) &&
      m.partner !== "companion" &&
      s.adventure.road.solution !== "array"
    )
      return "需要神识 8 / 心得 2，或已相识的异性同行者协作";
  }
  if (action === "gate" && !(m.garden || m.station))
    return "至少找到药圃或废驿的一处证据";
  if (action === "gate" && m.passed)
    return "阵门已开，旧记录已带回；可回坊市或补探支线";
  if (["steady", "pursue"].includes(action) && (m.passed || m.vow === action))
    return "已作出这一约定";
  if (action === "challenge") {
    if (m.passed) return "阵门已经打开";
    if (m.vow === "none") return "先商定追信或护归路";
    if (s.injury >= 3) return "伤势达到 3，先回营养伤";
    if (s.stones < mistDetails(s).cost)
      return `补给需要灵石 ${mistDetails(s).cost}`;
  }
  if (action === "caravanBridge") {
    if (s.adventure.road.solution !== "sword")
      return "需要青嶂关开出的货车商道";
    if (m.passed || m.ward) return "归路已经备好，不重复领取援助";
    if (m.partner === "none") return "先决定同行方式";
    if (s.stones < 6) return "需要灵石 6 雇商队运来桥材";
  }
  if (action === "ward") {
    if (!m.insight) return "亲历一次受阻后，才有可研究的阵眼情报";
    if (m.ward) return "已掌握护归法";
    if (s.study < 2 && !s.journey.mentor)
      return "需要心得 2，或获得师门执事认可";
  }
  if (action === "home" && !m.lamp) return "先从雾海带回来信真相";
  if (action === "share" && m.settled)
    return "这段经历已记入关系，不重复加好感或信任";
  if (action === "illuminate") {
    if (!m.lamp) return "缺少能照见灵痕的探灵灯；先追查雾海来信";
    if (!m.settled) return "先回坊市与等你的人分享真相";
    if (m.revisited) return "已经记下墙后的誓言";
  }
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
export function runMist(input: State, action: MistAction, id: string): State {
  if (mistError(input, action)) return input;
  const s = structuredClone(input),
    m = s.adventure.mist;
  m.result = "";
  switch (action) {
    case "caravanBridge":
      s.stones -= 6;
      m.ward = true;
      m.result =
        "郁青的货车沿你斩开的商道运来桥材。药工架好撤退便桥，你不必先闯阵受伤才找到归路。护归准备 +20，与研究护归法不叠加。青嶂托车带来一捆护栏木，却没有捎来问候。";
      break;
    case "receive":
      m.stage = "letter";
      break;
    case "accept":
      m.stage = "camp";
      m.result =
        "你将信收进行囊。信纸已经发脆，封口却还留着新近消散的灵光。得去寄信的地方看看。";
      break;
    case "camp":
      m.stage = "camp";
      break;
    case "solo":
    case "luchi":
    case "companion":
      m.partner = action;
      m.result =
        action === "solo"
          ? "你把归程留给陆迟，约定回来再一起读信。你检查药囊和识阵笔记，独自踏上山路。"
          : action === "luchi"
            ? "陆迟带来药囊：“药圃的根脉我能帮忙。父亲的事，我们一步步查。”"
            : `${mistPartner(s).name}收好行囊：“废驿的旧阵我可以帮你辨认。但我的心愿，是让这条路以后也有人能走。”`;
      break;
    case "garden":
    case "station":
      m.stage = action;
      if (m.firstRoute === "none") m.firstRoute = action;
      break;
    case "tend":
    case "attune":
      if (action === "tend") s.herbs -= 4;
      m.garden = true;
      m.result = `${action === "tend" ? "你用四株灵草救活引灯草。" : s.adventure.rescueChoice === "roots" ? "石角认出你腕上的护根结：山祠的守卫曾提过留下成株的旅人。他让你独自循着旧手法疏通水渠，不耗灵草。" : s.adventure.road.solution === "medicine" ? "你用青嶂关救活镇风草的手法疏通根脉。石角认出了药站的包扎结，主动为你引水。" : m.lamp ? "探灵灯照出堵塞的根脉，你沿着光纹疏通石渠。" : "你们沿根脉疏通石渠，没有耗费灵草。"}石角递来一片引灯叶：“陈渡不是逃走的。他和陆姓修士最后一次回来，是为了接还困在山里的人。”这片叶能稳住阵中的归绳。`;
      break;
    case "decode":
      m.station = true;
      m.result = `${s.adventure.road.solution === "array" ? "你沿用与青嶂修阵时记下的归阵手法，独自对上旧阵的节拍。" : m.partner === "companion" ? `${mistPartner(s).name}扶住阵盘，你稳住灵气，两人让错位的阵纹重新咬合。` : "你闭目分辨灵脉，让自己的呼吸跟上旧阵。"}你发现信不是近日写的：它在等归路重新接通。抄下归阵节拍，可减轻回声阵的干扰。`;
      break;
    case "gate":
      m.stage = m.passed ? "archive" : "gate";
      if (m.hazard === "none") m.hazard = roll(s) <= 50 ? "echo" : "wind";
      break;
    case "steady":
    case "pursue":
      m.vow = action;
      m.result =
        action === "steady"
          ? "你决定先系稳归绳，花更多补给留出撤退余地。即使失败，也不再让一个人留在雾里。护归路消耗灵石 6，把握 +10，失败不新增伤势。"
          : "你决定趁回声尚清追查信阵，但留下明确的撤退信号。追信消耗灵石 3；失败伤势 +1，仍能带回阵眼情报。";
      break;
    case "challenge": {
      const d = mistDetails(s);
      s.stones -= d.cost;
      m.chance = d.chance;
      m.roll = roll(s);
      m.attempts++;
      if (m.roll <= m.chance) {
        m.passed = true;
        m.stage = "archive";
        m.result = `${m.garden ? "引灯叶替你稳住归绳。" : "你循着旧阵节拍踏入阵门。"}${m.station && m.garden ? "废驿的节拍与引灯叶的光恰好相合。" : ""}${m.partner === "luchi" ? "陆迟没有追着回声跑，而是一直握着你交给他的绳索。" : m.partner === "companion" ? `${mistPartner(s).name}回应了你的撤退信号，然后与你一起跨过最后一道阵纹。` : "你按自己留下的记号，稳稳走过了最后一道阵纹。"}把握 ${m.chance}%，判定 ${m.roll}。阵门开了。`;
      } else {
        m.insight = true;
        if (m.vow === "pursue") s.injury = Math.min(6, s.injury + 1);
        m.result = `把握 ${m.chance}%，判定 ${m.roll}，你退回了阵门外。${m.vow === "steady" ? "归绳护住了你，没有新增伤势。" : "急转的灵流划伤经脉，伤势 +1。"}但这次你听清了阵眼的间歇：永久记下本章情报（把握 +10）。回营以心得 2 或师门认可研究护归法，可再提高 20；也可以补探另一处证据。线索和同行都保留。`;
      }
      break;
    }
    case "ward":
      m.ward = true;
      m.result = s.journey.mentor
        ? "执事根据你带回的阵眼记录，教你以三息护住归绳。入阵把握 +20。"
        : "你把失败带回的节拍反复推演，找到了三息换气的空隙。本章把握 +20；归绳随灵流起伏，不再绷紧。";
      break;
    case "read":
      m.lamp = true;
      m.stage = "home";
      m.result =
        "陈渡的旧记录止于最后一次护送。你翻到早年的阵图：三声铃是撤离信号，阵门应当向外打开；如今断裂的灵路，却把护人的门变成了牢笼。旁边记着他教守祠妖修用药篓求援的办法。山祠那夜的异象终于有了来处，陆迟父亲最后一次入山，也在这份护送名单上。记录没有写他的归期，只有一盏探灵灯留在末页旁。灯火不灼人，映过旧阵时，却能照见肉眼看不见的灵痕。你想起救过药工的山祠，那堵墙，也许从来不是尽头。";
      break;
    case "home":
      m.stage = "home";
      if (m.settled && m.station)
        m.result =
          "你将新核实的废驿记录补进手记。" + expeditionMistEcho(s, "share");
      break;
    case "share":
      m.settled = true;
      if (m.partner === "companion")
        s.social.affection = Math.min(100, s.social.affection + 8);
      if (m.partner === "luchi") s.story.trust = Math.min(6, s.story.trust + 1);
      m.result = `${m.partner === "luchi" ? "你与陆迟并肩坐下，把一路共同查到的记录逐页核对。" : `你把${m.firstRoute === "garden" ? "从石角的记忆开始" : "从废驿的阵纹开始"}的这段路讲给陆迟听。`}他把父亲的护路印放在探灵灯旁，终于肯慢慢喝完一杯茶。${m.partner === "companion" ? `${mistPartner(s).name}还记得你${m.vow === "steady" ? "宁可多备补给也先留退路" : "追信前仍约好撤退信号"}的约定：“下一段路，也一起商量。”共同经历：好感 +8（上限 100），不替代定情所需的相处。` : m.partner === "luchi" ? "陆迟把归绳收进自己的行囊。共同经历：道友信任 +1（上限 6）。" : "你独自走过的路，如今也有人愿意听。陆迟约你下次一起查剩下的线索。"}现在可以带灯重访旧山祠。`;
      break;
    case "shrine":
      m.stage = "shrine";
      break;
    case "illuminate":
      m.revisited = true;
      m.result =
        "探灵灯亮起，石墙上的尘土没有消失，尘土下的阵纹却一寸寸浮现。墙后是药队留下的避难室，刻着陆迟父亲的字：若我未归，先带其他人下山。你把誓言拓下带回，又点亮避难室的归灯。以后路过的药工，多了一个能避雨的地方。你曾靠力量救出一个人，如今靠新本领让这条旧路发生了变化。第三卷·雾海来信完。";
      break;
  }
  const expeditionEcho = expeditionMistEcho(s, action);
  if (expeditionEcho) m.result += expeditionEcho;
  s.seen = [...s.seen, id].slice(-512);
  s.log.unshift({
    month: s.month,
    kind: "story",
    text: `雾海来信·${mistScenes[m.stage].title}：${m.result || mistGoal(s)}`,
  });
  s.log = s.log.slice(0, 180);
  return s;
}
export function validMist(s: State): boolean {
  const m = s.adventure.mist;
  if (!m || typeof m !== "object" || !Object.hasOwn(mistScenes, m.stage))
    return false;
  if (m.stage === "dormant")
    return (Object.keys(freshMist()) as (keyof Mist)[]).every(
      (k) => m[k] === freshMist()[k],
    );
  const int = (x: unknown, max: number) =>
    Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
  return (
    s.adventure.road.surveyed &&
    s.realm === 1 &&
    ["none", "solo", "luchi", "companion"].includes(m.partner) &&
    ["none", "garden", "station"].includes(m.firstRoute) &&
    ["none", "echo", "wind"].includes(m.hazard) &&
    ["none", "steady", "pursue"].includes(m.vow) &&
    [
      m.garden,
      m.station,
      m.insight,
      m.ward,
      m.passed,
      m.lamp,
      m.settled,
      m.revisited,
    ].every((v) => typeof v === "boolean") &&
    int(m.attempts, 1e9) &&
    int(m.roll, 100) &&
    int(m.chance, 100) &&
    typeof m.result === "string" &&
    m.result.length < 2200 &&
    (m.partner !== "companion" ||
      (s.social.met && !!s.social.gender && s.age >= 216)) &&
    (m.firstRoute === "none"
      ? !m.garden && !m.station
      : m.partner !== "none") &&
    (!["garden", "station"].includes(m.stage) || m.firstRoute !== "none") &&
    (m.hazard === "none"
      ? m.attempts === 0 && m.vow === "none"
      : m.garden || m.station) &&
    (m.stage !== "gate" || m.hazard !== "none") &&
    (m.attempts === 0
      ? m.roll === 0 && m.chance === 0 && !m.insight
      : m.roll >= 1 &&
        m.chance >= 5 &&
        m.vow !== "none" &&
        m.hazard !== "none" &&
        (m.passed ? m.roll <= m.chance : m.roll > m.chance && m.insight)) &&
    (!m.ward ||
      (m.partner !== "none" &&
        (m.insight || s.adventure.road.solution === "sword"))) &&
    (!m.passed || m.attempts > 0) &&
    (!m.lamp || m.passed) &&
    (!m.settled || m.lamp) &&
    (!m.revisited || m.settled) &&
    (m.stage !== "archive" || (m.passed && !m.lamp)) &&
    (m.stage !== "home" || m.lamp) &&
    (m.stage !== "letter" ||
      (m.partner === "none" &&
        m.firstRoute === "none" &&
        m.hazard === "none" &&
        !m.passed))
  );
}
