import type { State } from "../world";
import { destinations, sideChoices } from "./content";
import type { JourneyAction } from "./state";
export function advancePlot(s: State, a: JourneyAction) {
  const q = s.foundationJourney,
    shen = s.social.gender === "male";
  switch (a.kind) {
    case "travel":
      q.location = a.destination;
      if (a.destination === "ferry" && !q.ferry) q.ferry = 1;
      q.last = destinations[a.destination].intro;
      return;
    case "inherit":
      q.inheritance = a.technique;
      if (!s.journey.known.includes(a.technique))
        s.journey.known.push(a.technique);
      s.growth.training[a.technique] = 2;
      q.last = `${{ spring: "长春续脉", blade: "剑经分流", breath: "归元定枢" }[a.technique]}传承已领悟，对应主修研修至通达。装配它，在筑基挑战使用${{ spring: "守势", blade: "反击", breath: "辨影" }[a.technique]}时额外伤害 +4、承伤 −2。你留下古院原本用于自修的铭记；渡口后加的名籍控制支路不是传承来源。${q.cultivation >= 80 ? "修行已足，装配后即可去出口亲手试用。" : `再积累 ${80 - q.cultivation} 点筑基修行，便可去出口亲手试用。`}`;
      return;
    case "sister":
      q.sister = "promised";
      q.last =
        "你答应与郁青找人，但先约定各自有自己的修行与工作。讣帖只留下疑点；无论寻亲进度如何，沉井传承都由你自己争取。";
      return;
    case "reuniteSister":
      q.sister = "reunited";
      q.last =
        "侧院里，郁晚舟先替伤者换完药，才抬头叫了弟弟的名字。郁青问：“你若只是不想回去，至少也该告诉我。”她说：“起初是我没写。后来写了，没能送出去。这两件事，我都得跟你说清楚。”她愿与弟弟重新来往，也要先把手边的病人交接好。" +
        (s.adventure.mist.station
          ? "你记得废驿交接簿写她随队救治；如今终于当面核实。"
          : "她亲口说明当年随队救治的经历；你没有读过旧交接簿，不能把这称为早已查清。");
      return;
    case "evidence":
      q.evidence.push(a.evidence);
      q.last = {
        paper:
          "新药纸、针孔和邮递存根相互对上：所谓三年前的讣帖是今年从渡口寄出的。它不能单独证明谁尚在人世。",
        registry:
          "你核对离渡申请、拒批记录和药债凭据。纸面显示祝庭的执卫反复阻止已还清药债者离开；这是目前能够确认的限制。",
        control:
          "你分清古院原阵与后来加装的名籍支路，并保全维护副簿和救济交接凭证。祝庭利用后改支路截信、挪用救济；不能因此说古修行院本就用于奴役。",
      }[a.evidence];
      return;
    case "consent":
      q.consent = true;
      q.last =
        "郁晚舟同意以自己的证言作证，要求隐去病人的姓名与住处。药队仅接收脱敏副本；其他幸存者各自选择去留，姐弟不能代他们答应。";
      return;
    case "ferryOutcome":
      q.ferry = 4;
      q.ferryOutcome = a.outcome;
      if (a.outcome === "break")
        q.evidence = q.evidence.filter((x) => x !== "control");
      q.last =
        {
          open: "郁青负责护送愿离渡的人，温蘅所在丹堂与剑院各派一位轮值见证人互存副本，不由祝庭旧属单独处理。你公开已核实的限制、截信与挪用，隐去病人身份。渡牌撤去强制留渡项；取证和见证完成，本段追责收束。",
          escort:
            "你先护送愿离开的人。药队接手短途接应，名籍检查停止；没有同意公开的姓名不入公示。祝庭相关责任仍可补查，但没有阻拦你继续修行。",
          break:
            "你切断正在限制离渡的控制支路，保住公共出口；混乱中维护原簿部分受损。药队保存的副联可以补查，尚未核实的罪行仍是疑点。传承不受影响，渡工接手临时通行。",
        }[a.outcome] +
        (q.sister === "reunited"
          ? "郁晚舟约初七写信，郁青说：“别省那张新纸。”"
          : "你没有参与姐弟重逢，不会在履历中得到那段经历。");
      return;
    case "sideInvestigate":
      q.sides[a.side].step = a.side === "inn" ? 2 : 1;
      q.last = {
        estate:
          "阙明棠拿出压后处理的旧欠，许芦也承认父亲曾在假账上签字。两份遗嘱真印不互相抵消：后件补充了先偿工钱。你抄下见证留底，去旧药圃检验供水与育苗记录。",
        snow: "温蘅交出原诊页，季衡交出西门留引原令。仓库副联显示韩肃在雪灾前挪售阵石，又另发西门封闭指令。尚需现场重走雪线，分清主门必要与西门失效。",
        inn: "你循泥脚印找到小亭。阿团把灯放在漏雨处，窝在一群山雀旁。它没有隐藏身世，只是喜欢这个地方。你叫老人亲自来看看，再决定灯放哪里。",
      }[a.side];
      return;
    case "sideResolve":
      q.sides[a.side] = { step: 3, outcome: a.outcome };
      q.last = sideChoices[a.side][a.outcome]!.result;
      if (a.side === "estate") {
        s.herbs += 6;
        q.last += "你已领到这次合法合作的灵草 6；后续可继续使用原有商路。";
      }
      if (a.side === "snow") {
        if (!s.journey.known.includes("lantern"))
          s.journey.known.push("lantern");
        s.growth.training.lantern = Math.min(2, s.growth.training.lantern + 1);
        q.last +=
          "雪线实测让照夜篇研修提升一阶（上限通达），已习得；原有师门教学继续开放。";
      }
      if (a.side === "inn") {
        s.injury = Math.max(0, s.injury - 1);
        q.last += "热汤与歇脚让伤势减少 1，不附赠稀有功法。";
      }
      return;
    case "contact":
      q.contact = a.contact;
      q.last =
        a.contact === "letters"
          ? "你们约好由药队递信，信封只留投递点，不公开住处。闭关时可以晚些回信，不以离线或迟回惩罚彼此。"
          : "你们在旅图背面记下云栈旅亭，约好出关后在那里碰面；临时改道就留下封好的口信，不把等待变成一方的全部生活。";
      return;
    case "propose":
      q.bond = "promised";
      q.last = shen
        ? "沈听澜放下刻刀：“我愿意同你走，也会有自己要画的山。结契之后，我们都得说清楚想去哪里。”她愿意，你仍可以暂缓，最后的答复由你亲口说。"
        : "尹照川合上修单：“我愿意。但我不能把你也写进每个夜班里。我们都得留出闭关与远行的时间。”他愿意，你可以暂缓，不会因此失去朋友的帮助。";
      return;
    case "covenant":
      q.bond = "covenant";
      q.last =
        "你明确答应，与对方以简素信物结为道侣。没有豪华婚礼费用，也没有境界奖励；联系办法与各自修行目标写在同一页。共同准备仍只保留一份，朋友也能获得这项帮助。";
      return;
    case "prepareTogether":
      s.herbs -= 2;
      q.aid = true;
      q.last =
        "你们用灵草 2 调好一份护脉准备，下次筑基挑战每合承伤再减 2，开战即消耗，不叠加。它来自实际准备，不是远方道侣随时出手；出发分别前未用的共同准备会收回。";
      return;
    case "depart":
      q.whereabouts = "away";
      q.departedAt = s.month;
      q.aid = false;
      q.last = shen
        ? "沈听澜独自去补测渡口以外的旧路，带走共同准备。你可以继续自己的修行；三个月后按约重逢，她不再同时出现在山门替你帮忙。"
        : "尹照川把夜值交给受训渡工，随修阵队去复核外地节点。你可以继续修行；三个月后按约重逢，原地不会再出现一个同时值守的他。";
      return;
    case "reunion":
      q.whereabouts = "returned";
      q.reunion = true;
      q.last = shen
        ? "沈听澜拿来一张由她独立测完的新图，修正了自己曾轻信的旧里程。她学会在险段先留标，再进山。你们谈彼此的修行收获，约好以后继续使用相同的撤退记号。"
        : "尹照川带回修订过的节点工单：这次由新同伴完成最后校验，他没有把全队工作揽回自己手里。你们核对亮灭节奏，把备用接应方式练了一遍。";
      s.study = Math.min(4, s.study + 1);
      return;
    case "oldFriend":
      q.oldFriend = true;
      q.last =
        (s.journey.maps.sea === 3
          ? "陆迟已经把父亲亲笔信带回家，知道父亲还在守灯；他不再追问一场早已查明的生死。"
          : "陆迟仍在循已知药路找父亲的可靠消息，你没有替他宣布团聚。") +
        (s.story.choice === "gift"
          ? "他提起你当年赠丹：“这次轮到我把自己的修行安排好。”"
          : "他承认各自取得机缘的路不同，也不把你当年留丹当作背叛。") +
        "他选择留在药路轮值一季，教新药工辨路；温蘅和季衡则把程砚的行路指点交给你，旧师长不会凭空消失。";
      return;
    case "report":
      q.rescue = 1;
      q.target = q.bond === "covenant" && q.reunion ? "companion" : "party";
      if (q.target === "companion") q.whereabouts = "missing";
      q.aid = false;
      q.last =
        q.target === "companion"
          ? "正常重逢后，你们已商定下一次探路。对方按约随探索队出发，却在古道变动后断了信。陶泊带来队伍退回的行牌，只能证明道路受阻，不能证明有人死亡。先核实信号，不为现实离线设倒计时。"
          : "闻岑的小队进入古道后失去联络。你为自己的凝丹机缘来到此地，也可以先从这场公共探索事故打开通路。没有道侣在队中，不会凭空给你安排恋爱或私人失踪经历。";
      q.last += "你在外围发出问讯灯号，等内侧回讯后再判断去向。";
      return;
    case "signal":
      q.rescue = 2;
      if (q.target === "companion") q.whereabouts = "shelter";
      q.last =
        (q.target === "companion"
          ? shen
            ? "你认出双方约定的路标：沈听澜正在内部标出安全带，带人避开移动崖壁。"
            : "你听见约定的亮灭节奏：尹照川正用备用节点维持内部避险处。"
          : "闻岑从内侧送出标记，带着同伴退到了稳定石室。") +
        "你们确认有人活着并能接应，避险处稳定但补给受限。程砚守住外围，可以留出明确的修行准备时间；下一步先打通外缘、送入补给。";
      return;
    case "mentor":
      q.rescue = 3;
      q.last =
        "程砚让你把沉井所学用于两股相冲灵流之间：稳住自身，再拆外部支点。他仍守着落脚点，不能弃外缘众人替你深入。你学会稳脉，在本段后续交锋每合承伤 −2；内部同伴负责牵归绳。准备至筑基修行 420 后，可完成内外会合。";
      return;
    case "finish":
      q.condensation = true;
      q.last =
        "你整理好沉井传承、古道稳脉法和自己的圆满修行，记下将来凝丹时必须处理的经脉负荷。金丹前这一段主线已收束：既得功法、关系与世界后果保留。金丹突破尚未开放；没有必须先谈恋爱、收齐支线或夺魁的额外条件。";
      return;
  }
}
