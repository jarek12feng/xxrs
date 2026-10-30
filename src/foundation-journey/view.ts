import type { State } from "../world";
import type { JourneyAction, BattleId, Destination, Side } from "./state";
import { challenges, rankIds, sideChoices } from "./content";
import { ferryScene, sideScene, homeScene } from "./narrative";
import { journeyActionError } from "./progression";
export const rankNames = [
  "未入榜",
  "第三十名",
  "第十五名",
  "第八名",
  "第三名",
  "本届魁首",
];
export function foundationBoard(s: State) {
  const q = s.foundationJourney,
    count = q.board.wins.length,
    next = rankIds[count];
  return {
    title: rankNames[count]!,
    next: next
      ? `下一场：${challenges[next].foe}。${journeyActionError(s, { kind: "battle", battle: next }) || "可以挑战；行前一月，灵石 4。"}`
      : "已夺得听松本届筑基组魁首。金丹组尚未开放。",
    rows: rankIds.map((id, i) => ({
      id,
      ...challenges[id],
      rank: rankNames[i + 1],
      won: q.board.wins.includes(id),
      current: i === count,
      prize: challenges[id].prize + (i + 1) * 4,
      extra: i === 2 ? "回春散 2 瓶" : i === 4 ? "清心丹 2 瓶" : "",
      turns: q.board.best[id],
    })),
  };
}
export function journeyOptions(s: State, mode: "journey" | "relationship") {
  const q = s.foundationJourney,
    actions: { label: string; action: JourneyAction; error: string }[] = [];
  const add = (label: string, action: JourneyAction) =>
    actions.push({ label, action, error: journeyActionError(s, action) });
  const fight = (id: BattleId) =>
    add(`${challenges[id].name} · 一月 / 灵石 4 / 首胜灵石 10、修行 40`, {
      kind: "battle",
      battle: id,
    });
  if (mode === "relationship") {
    if (q.contact === "none") {
      add("约定药队递信", { kind: "contact", contact: "letters" });
      add("约定出关在旅亭碰面", { kind: "contact", contact: "station" });
    }
    if (q.bond === "none" && s.social.bonded)
      add("商议结为道侣 · 可以暂缓", { kind: "propose" });
    if (q.bond === "promised") add("明确答应，结为道侣", { kind: "covenant" });
    add("共同准备 · 灵草 2 / 下次筑基挑战减伤 2", { kind: "prepareTogether" });
    if (!q.reunion && q.whereabouts === "home")
      add("各自远行 · 三个游戏月后重逢", { kind: "depart" });
    if (q.whereabouts === "away")
      add("按约重逢，交换修行所得", { kind: "reunion" });
    if (q.location !== "home")
      add("回听松行前居 · 一月", { kind: "travel", destination: "home" });
    return actions;
  }
  if (q.location === "ferry") {
    if (q.ferry === 1) fight("well");
    if (q.ferry === 2 && q.inheritance === "none")
      for (const [technique, label] of [
        ["spring", "长春续脉 · 守势"],
        ["blade", "剑经分流 · 反击"],
        ["breath", "归元定枢 · 辨影"],
      ] as const)
        add(`领悟${label}传承`, { kind: "inherit", technique });
    if (q.ferry === 2 && q.inheritance !== "none") fight("exit");
    if (q.sister === "none") add("可选：答应郁青寻姐", { kind: "sister" });
    if (q.sister === "promised")
      add("可选：去侧院打听消息", { kind: "reuniteSister" });
    if (q.sister === "reunited" && !q.consent)
      add("可选：询问证言公开范围", { kind: "consent" });
    for (const [evidence, label] of [
      ["paper", "核对讣帖与邮递存根"],
      ["registry", "核对离渡申请与药债"],
      ["control", "保全阵法副簿与救济凭证"],
    ] as const)
      if (!q.evidence.includes(evidence))
        add(`可选：${label}`, { kind: "evidence", evidence });
    if (q.ferry >= 3 && q.ferryOutcome !== "open") {
      if (q.ferry === 3) {
        add("先护送离渡 · 保留补查机会", {
          kind: "ferryOutcome",
          outcome: "escort",
        });
        add("先破禁开放出口 · 原簿部分受损，可补查副联", {
          kind: "ferryOutcome",
          outcome: "break",
        });
      }
      add("隐去病人身份，将证据交给两堂见证人", {
        kind: "ferryOutcome",
        outcome: "open",
      });
    }
  }
  if (["estate", "snow", "inn"].includes(q.location)) {
    const side = q.location as Side,
      step = q.sides[side].step;
    if (step === 0)
      add(side === "inn" ? "循泥脚印跟随阿团" : "了解现场与旧记录", {
        kind: "sideInvestigate",
        side,
      });
    if (step === 1 && side !== "inn") fight(side);
    if (step === 2)
      for (const [outcome, choice] of Object.entries(sideChoices[side]))
        add(choice.label, { kind: "sideResolve", side, outcome });
  }
  if (q.location === "frontier") {
    if (q.rescue === 0)
      add(
        q.bond === "covenant" && q.reunion
          ? "继续约好的探路 · 核实道侣所在队伍失联消息"
          : "核实探索队事故，寻找稳脉机缘",
        { kind: "report" },
      );
    if (q.rescue === 1) add("辨认信号，确认内部避险处", { kind: "signal" });
    if (q.rescue === 2 && !q.won.includes("frontier")) fight("frontier");
    if (q.rescue === 2 && q.won.includes("frontier"))
      add("向程砚学稳脉 · 后续筑基挑战减伤 2", { kind: "mentor" });
    if (q.rescue === 3) fight("rescue");
    if (q.rescue === 4 && !q.condensation)
      add("整理凝丹准备，收束金丹前主线", { kind: "finish" });
  }
  if (q.ferry === 4 && !q.oldFriend)
    add("接续陆迟与旧师长的近况", { kind: "oldFriend" });
  return actions;
}
export const whereaboutsText = {
  home: "在听松，可共同准备",
  away: "已按约独自远行；三个月后可以重逢",
  returned: "已回到听松，带来了远行见闻",
  missing: "古道事故后失联，生死尚未确认",
  shelter: "已确认在内部避险处，能共同接应",
  rescued: "已与你一同撤回，可在听松相聚",
};
export function journeyPresentation(s: State, relationship = false) {
  const q = s.foundationJourney;
  let image =
    q.location === "home"
      ? "journey-fork"
      : (
          {
            ferry: "wuming-ferry",
            estate: "herb-estate",
            snow: "snow-gates",
            inn: "roadside-pavilion",
            frontier: "frontier-valley",
          } as const
        )[q.location as Exclude<Destination, "home">];
  let speaker = "",
    portrait = "",
    body = "";
  if (relationship) {
    image =
      q.bond === "covenant"
        ? "vow-terrace"
        : q.reunion
          ? "reunion-courtyard"
          : "journey-fork";
    if (["home", "returned", "rescued"].includes(q.whereabouts)) {
      speaker = s.social.gender === "male" ? "沈听澜" : "尹照川";
      const id = s.social.gender === "male" ? "shentinglan" : "yinzhaochuan";
      portrait = `${id}-${q.bond === "covenant" ? "vow" : q.reunion ? "reunion" : "growth"}`;
    }
    body = whereaboutsText[q.whereabouts];
  } else if (q.location === "home") {
    body = homeScene(s);
  } else if (q.location === "ferry") {
    image =
      q.ferry === 1
        ? "sunken-entry"
        : q.ferry === 2
          ? "inheritance-room"
          : q.ferry === 3
            ? "ferry-return"
            : "wuming-ferry";
    body = ferryScene(s);
    if (q.sister === "reunited") {
      speaker = "郁晚舟";
      portrait = "healer-sister";
      body +=
        "侧院还传来捣药声。郁晚舟低头换药，郁青坐在门槛上，替她将干净的药布叠好。";
    }
  } else if (q.location === "estate") {
    speaker = "阙明棠";
    portrait = "qu-heir";
  } else if (q.location === "frontier") {
    image = [
      "frontier-valley",
      "frontier-valley",
      "signal-refuge",
      "outer-rescue",
      "recovery-stop",
    ][q.rescue]!;
    speaker = q.rescue >= 3 ? "程砚" : "陶泊";
    portrait = q.rescue >= 3 ? "frontier-mentor" : "frontier-boatman";
    body =
      q.rescue === 4
        ? "接应已经完成，探索队回到落脚点。程砚留下稳脉要诀，你可以继续积累修行，待圆满时整理凝丹准备。"
        : q.rescue === 2 || q.rescue === 3
          ? "内部人员已经传出信号，避险处可以维持。先打通外缘送入补给，再和内部接应者约好撤离节奏；这段准备没有现实倒计时。"
          : "";
  }
  if (!relationship && ["estate", "snow", "inn"].includes(q.location)) {
    body = sideScene(s, q.location as Side);
  }
  return {
    image: `/art/foundation-journey/${image}.webp`,
    speaker,
    portrait: portrait ? `/art/foundation-journey/${portrait}.webp` : undefined,
    body,
  };
}
