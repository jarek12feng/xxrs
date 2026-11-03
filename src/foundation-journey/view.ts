import { foundationCap, foundationBlock, resourceRoutes, hasSteady } from "./growth-state";
import { routeInfo } from "./growth";
import { maleMainline } from "./heroine";
import { opponentRealmName } from "../realm-pressure";
import type { State } from "../world";
import type { JourneyAction, BattleId, Destination, Side } from "./state";
import { victoryCultivation, challenges, rankIds, sideChoices } from "./content";
import { aftermathScene } from "./aftermath";
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
    add(
      `${challenges[id].name} · ${opponentRealmName(challenges[id])} · 一月 / 灵石 ${id === "frontier" && q.growth.routes.frontier.choice === "careful" ? 0 : challenges[id].cost} / 首胜灵石 ${challenges[id].prize}、修行 ${Math.max(0, Math.min(id === "application" || id === "steady" ? 0 : victoryCultivation, foundationCap(s) - q.cultivation))}`,
      {
        kind: "battle",
        battle: id,
      },
    );
  if (mode === "journey") {
    if(q.board.wins.length>=3 && !q.growth.rankGift) {
      add("榜单前八择一：护脉丹 2 瓶",{kind:"rankGift",reward:"medicine"});
      add("榜单前八择一：灵石 16、灵草 4",{kind:"rankGift",reward:"supplies"});
    }
    if(maleMainline(s)) {
      const h=q.heroine;
      if(q.location === "home" && h.meeting === "none") {
        add("青嶂同路 · 剑意稳住石梁（一月）",{kind:"meetHeroine",method:"strength"});
        add("青嶂同路 · 辨清石梁承力处（一月）",{kind:"meetHeroine",method:"insight"});
        add("青嶂同路 · 灵草 4 护根开路（一月）",{kind:"meetHeroine",method:"supplies"});
      }
      if(q.location === "ferry" && h.purpose === "none") {
        add("谈入井来意：想走得比寿数更远",{kind:"journeyPurpose",purpose:"longevity"});
        add("谈入井来意：不愿再被旧阵挡住",{kind:"journeyPurpose",purpose:"strength"});
        add("暂不细说，听她讲测渡计划",{kind:"journeyPurpose",purpose:"private"});
      }
      if(q.location === "home" && h.route !== "none" && h.map === "none") {
        add("图上与图外：只公开干道，药工引路 · 一月",{kind:"mapPlan",plan:"public"});
        add("图上与图外：另探替代路 · 灵石 6、一月",{kind:"mapPlan",plan:"detour"});
      }
      if(q.location === "home" && h.map !== "none" && !q.reunion) {
        if(q.contact === "none") {
          add("与苏婉宁约定药队递信",{kind:"contact",contact:"letters"});
          add("与苏婉宁约定旅亭留信",{kind:"contact",contact:"station"});
        } else if(q.whereabouts === "home")add("各自远行 · 三个月后重逢",{kind:"depart"});
        else if(q.whereabouts === "away")add("按约重逢，互看修行所得",{kind:"reunion"});
      }
      if(q.location === "home" && q.reunion && !h.expedition)add("听取苏婉宁与闻岑小队的探路计划 · 一月",{kind:"expeditionPlan"});
    }
    if(q.location === "ferry" && q.inheritance !== "none" && !q.won.includes("application"))fight("application");
    for(const route of resourceRoutes) {
      if(q.location !== route || q.cultivation<200)continue;
      const p=q.growth.routes[route],info=routeInfo[route];
      if(!p.prepared) {
        add(`${info.name}：自备护脉丹 1、灵草 ${route === "estate" ? 3 : 2}、灵石 2 · 一月`,{kind:"routePrepare",route,method:"supplies"});
        add(`${info.name}：租用阵具并购补给 · 灵石 ${route === "estate" ? 32 : 30}、一月`,{kind:"routePrepare",route,method:"service"});
        if(route === "snow") {
          add("灵器隔寒 · 已装配二阶灵器，灵石 2、一月；省下药物",{kind:"routePrepare",route,method:"relic"});
          add("行功御寒 · 已装配通达主修，灵石 2、六月；省下药物",{kind:"routePrepare",route,method:"training"});
        }
      } else if(!p.choice) {
        add(info.careful,{kind:"routeChoose",route,choice:"careful"});
        add(info.swift,{kind:"routeChoose",route,choice:"swift"});
      } else if(!q.won.includes(info.foe)) {
        if(route !== "frontier" || q.rescue !== 2)fight(info.foe);
      } else if(!p.processed) {
        add(`自行处理${info.material} · 灵草 6、灵石 4、两月`,{kind:"routeProcess",route,method:"self"});
        add(`请当地修士处理${info.material} · 灵石 28、一月`,{kind:"routeProcess",route,method:"service"});
        add(`借师门丹房处理${info.material} · 贡献 ${s.recognition.innerMonth !== null ? 6 : 8}、一月`,{kind:"routeProcess",route,method:"sect"});
      } else if(!p.revisited)add(`回访${info.name} · ${route === "estate" ? "交灵草 2，领取药材订单报酬" : "交接行路记录，灵石 +12"}、一月`,{kind:"routeRevisit",route});
    }
    if(q.cultivation>=400 && !hasSteady(q)) {
      if(q.growth.steadyStudy === "none") {
        if(q.location === "estate")add("岑霁行功疗程 · 灵石 18、灵草 2、一月，之后亲自调息",{kind:"steadyStudy",method:"medicine"});
        if(q.location === "frontier")add("独立研习稳脉 · 灵石 4、三月，之后亲自调息",{kind:"steadyStudy",method:"practice"});
      } else fight("steady");
    }
  }
  if (mode === "relationship") {
    if (q.contact === "none") {
      add("约定药队递信", { kind: "contact", contact: "letters" });
      add("约定出关在旅亭碰面", { kind: "contact", contact: "station" });
    }
    if (q.bond === "none" && s.social.bonded)
      add("商议结为道侣 · 可以暂缓", { kind: "propose" });
    if (q.bond === "promised") add("明确答应，结为道侣", { kind: "covenant" });
    if (q.bond === "covenant" && !q.sharedMoment)
      add("一起吃顿晚饭，聊聊各自的远路", { kind: "sharedMoment" });
    add("共同准备 · 灵草 2 / 下次筑基挑战减伤 2", { kind: "prepareTogether" });
    if (!q.reunion && q.whereabouts === "home")
      add("各自远行 · 三个游戏月后重逢", { kind: "depart" });
    if (q.whereabouts === "away")
      add("按约重逢，交换修行所得", { kind: "reunion" });
    if (q.location !== "home")
      add("回听松行前居 · 展开路图", { kind: "travel", destination: "home" });
    return actions;
  }
  if (q.location === "home" && q.won.includes("culmination") && !q.epilogue)
    add("归山 · 翻开筑基篇尾声", { kind: "epilogue" });
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
    if (step === 3 && !q.aftermath[side])
      add(aftermathScene(s, side)!.label, { kind: "revisit", side });
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
        maleMainline(s)
          ? "核实苏婉宁所在队伍的失联消息"
          : q.bond === "covenant" && q.reunion
          ? "继续约好的探路 · 核实道侣所在队伍失联消息"
          : "核实探索队事故，寻找稳脉机缘",
        { kind: "report" },
      );
    if (q.rescue === 1) add("辨认信号，确认内部避险处", { kind: "signal" });
    if (q.rescue === 2 && !q.won.includes("frontier")) fight("frontier");
    if (q.rescue === 2 && q.won.includes("frontier") && !q.heroine.supplied)
      add("稳绳送入补给 · 灵草 2、一月",{kind:"supply"});
    if (q.rescue === 2 && q.won.includes("frontier") && q.heroine.supplied)
      add("向程砚学稳脉 · 后续筑基挑战减伤 2", { kind: "mentor" });
    if (q.rescue === 3) fight("rescue");
    if (hasSteady(q) && !q.condensation)
      add("贯通周天 · 换招增伤减伤，准备圆满试炼", { kind: "finish" });
    if (q.condensation && !q.won.includes("culmination")) fight("culmination");
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
      speaker = s.social.gender === "male" ? "苏婉宁" : "尹照川";
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
    body = q.won.includes("culmination")
      ? "谷口的灵流已平息，程砚正在卷起护阵旗。他望了望山门方向，笑着催你先走，自己还要等最后一班渡船。"
      : q.rescue === 4
        ? "接应已经完成，探索队回到落脚点。程砚收好归绳，向你指了指谷口的归流阵：“大家都已安顿。接下来，走你自己的路。”"
        : q.rescue === 2 || q.rescue === 3
          ? "内侧灯号未断，众人暂在石室避险。先开外缘、送补给，再约好撤出的次序。程砚接过外侧阵旗，示意你先调息。"
          : "";
  }
  if (!relationship && ["estate", "snow", "inn"].includes(q.location)) {
    const side = q.location as Side;
    const followup = aftermathScene(s, side);
    if (followup) body = q.aftermath[side] ? followup.result : followup.scene;
    else body = sideScene(s, side);
  }
  if (
    relationship &&
    q.sharedMoment &&
    ["home", "returned", "rescued"].includes(q.whereabouts)
  )
    body +=
      s.social.gender === "male"
        ? "。窗边还压着你们一起晾干的图，行囊上的蓝线也没有解下。"
        : "。那张一起修好的桌子仍放在窗边，盐罐摆在灶旁顺手的位置。";
  if (!relationship && q.location === "home" && q.epilogue)
    body =
      "窗下的行囊还带着山风的气息。你已从长风归流阵归来，今夜可以安心歇一歇，明日再去看看故人。";
  if(!relationship && q.location === "home" && maleMainline(s) && !["away","missing","shelter"].includes(q.whereabouts)) {
    speaker=q.heroine.meeting === "none" ? "青嶂勘路人" : "苏婉宁";
    portrait=q.reunion ? "shentinglan-reunion" : "shentinglan-growth";
    if(q.heroine.meeting === "none")body="你正要踏上青嶂石梁，崖下有人敲了两下尺杆：左边那块是空的。女修收紧绳索，请你稳住上面的石梁，她来测落脚处。";
    else if(q.growth.refined && q.heroine.map === "none")body="苏婉宁带回试印图，药舍住户却指着图上的井口与果树，问她能否不公开住处。她停下刻刀，和你重新商量：保留干道，由药工引路；或撤下刻样，另探一条替代路。";
    else if(q.reunion && !q.heroine.expedition)body="苏婉宁带回独立测完的图，修正了曾轻信的旧里程。闻岑小队邀她复核古道深处，临行前，她想与你再试一遍备用路标。";
  }
  if(!relationship && q.location === "estate" && q.growth.routes.estate.prepared) {
    speaker="岑霁";portrait="";body=routeInfo.estate.intro+"岑霁将药性逐条记在册上：“庄里的家事容后再谈。药心性烈，先辨清药性，莫伤了经脉。”";
  }
  return {
    image: `/art/foundation-journey/${image}.webp`,
    speaker,
    portrait: speaker === "岑霁" ? "/art/foundation-growth/cen-ji.webp" : portrait ? `/art/foundation-journey/${portrait}.webp` : undefined,
    body,
  };
}
