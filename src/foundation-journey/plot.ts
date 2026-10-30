import type { State } from "../world";
import { revisit, chapterEnding } from "./aftermath";
import { destinations, sideChoices } from "./content";
import type { JourneyAction } from "./state";
export function advancePlot(s: State, a: JourneyAction) {
  const q = s.foundationJourney,
    shen = s.social.gender === "male";
  switch (a.kind) {
    case "revisit":
      revisit(s, a.side);
      return;
    case "epilogue":
      q.epilogue = true;
      q.last = chapterEnding(s).join("\n");
      return;
    case "sharedMoment":
      q.sharedMoment = true;
      q.last = shen
        ? "雨下得急，沈听澜把湿图摊在桌边。你将饭碗挪开，帮她压住翘起的纸角。她说小时候总以为画到山外就算走远，如今倒想把回来的路也画好。锅里的饭煮软了，你们谁也没先提。临睡前，她在你的行囊上系了一截蓝线。"
        : "尹照川照着你的口味煮面，却忘了先放盐。你递过盐罐，他笑着说往日总等交班才吃，面早坨了。饭后你们一起修好摇晃的桌脚，他把明日的工单留在门边，陪你听完了这场雨。";
      return;
    case "travel":
      q.location = a.destination;
      if (a.destination === "ferry" && !q.ferry) q.ferry = 1;
      q.last = `你来到${destinations[a.destination].name}。`;
      return;
    case "inherit":
      q.inheritance = a.technique;
      if (!s.journey.known.includes(a.technique))
        s.journey.known.push(a.technique);
      s.growth.training[a.technique] = 2;
      q.last = `${{ spring: "长春续脉", blade: "剑经分流", breath: "归元定枢" }[a.technique]}传承已领悟，对应主修研修至通达。装配它，在筑基挑战使用${{ spring: "守势", blade: "反击", breath: "辨影" }[a.technique]}时额外伤害 +4、承伤 −2。你循着古院铭记走完一遍行功路线，曾经淤在腕脉的灵息顺着指尖散开。门外却响起了催你登记名籍的铜铃。出口执卫是筑基中期，装配传承后可尝试越阶，也可先修到同阶再来。`;
      return;
    case "sister":
      q.sister = "promised";
      q.last =
        "郁青将讣帖摊开，写着三年前的日子，纸上却还有新药的气味。“我认得她写的药签。这几个字……不像。”他抹平折角，请你探沉井时留意侧院的消息，自己去渡头找送信人。";
      return;
    case "reuniteSister":
      q.sister = "reunited";
      q.last =
        "你循药布的气味走进侧院。一个背对门口的女子正在替伤者换药，打结时将线头绕了三回。郁青停在门边，半晌才叫了一声“姐”。郁晚舟的手一顿，先压好伤口，才转身叫了弟弟的名字。郁青问：“你若只是不想回去，至少也该告诉我。”她说：“起初是我没写。后来写了，没能送出去。这两件事，我都得跟你说清楚。”郁青把讣帖放在她面前，没有立刻接她递来的水。她拉过一张矮凳：“你坐一会儿。这副药换完，我从头说。”" +
        (s.adventure.mist.station
          ? "你记得废驿交接簿写她随队救治；如今终于当面核实。"
          : "她亲口说明当年随队救治的经历；你直到此刻才知道，她当年也走过那条药路。");
      return;
    case "evidence":
      q.evidence.push(a.evidence);
      q.last = {
        paper:
          "送信人认得封口的针孔，取来今年的邮递存根。你将讣帖贴在灯前，新药纸透出的水纹也与存根相同。郁青盯着那个三年前的日期：“为什么今年才做一张旧讣帖？”送信人摇头，只记得信是从渡口收的。",
        registry:
          "一个渡客将还清药债的凭据摊在桌上，离渡申请却连盖三次“缓行”。祝庭伸手要收，渡客按住纸角：“你上回说，付清就能走。”你把两张纸对在一起。祝庭改口说船期未定，窗外却正有人登船。",
        control:
          "古院石刻只教人导流行功，通向名籍房的铜线却压在新灰下面。你循线找到被扣的信，又将维护副簿与救济凭证相对：补药已入库，却被祝庭转记到了私账。你抄好副本，封住接线处，留下能复查的原样。",
      }[a.evidence];
      return;
    case "consent":
      q.consent = true;
      q.last =
        "郁晚舟将自己的证言推过来，却按住病人的那一页：“我的名字可以写。他们住哪里，先别传出去。”郁青想替旁人一并答应，她摇了摇头，挨个走到床前询问。你留下遮去姓名住处的副本，将原页封好。";
      return;
    case "ferryOutcome":
      q.ferry = 4;
      q.ferryOutcome = a.outcome;
      if (a.outcome === "break")
        q.evidence = q.evidence.filter((x) => x !== "control");
      q.last =
        {
          open: "祝庭还想拿药债拦人，渡客已将还清的凭据举到他面前。丹堂与剑院来的见证人各收一份副本，逐项记下扣人、截信和挪用救济的凭据；公示中隐去病人身份。执卫卸下强制留渡的牌子时，郁青先扶一个背药筐的老人上了船。",
          escort:
            "“先让他们上船。”你站到石阶前，郁青带愿离开的人依次过渡。祝庭喊着还有账没清，已经没人替他拦路。药队接手短途接应，收好尚待核查的记录；未答应公开姓名的人，也安静地坐进了船舱。",
          break:
            "你斩断通向名籍房的铜线，出口的禁光骤然熄灭。渡客拥下石阶，水浪却冲散了维护原簿，几页字迹再也辨不清。郁青从药队行囊里找出副联，晾在船板上。渡工接手通行，你收稳气息，沉井所得仍在经脉间运转。",
        }[a.outcome] +
        (q.sister === "reunited"
          ? "郁晚舟约初七写信，郁青说：“别省那张新纸。”"
          : "郁青收起行囊，还想再去侧院问一次消息。");
      return;
    case "sideInvestigate":
      q.sides[a.side].step = a.side === "inn" ? 2 : 1;
      q.last = {
        estate:
          "阙明棠先拿出传庄的遗嘱：“祖父把药圃交给我，总不能断在我手里。”许芦从匣底抽出另一页，印一样，日子更晚，添着先偿工钱。他看到假账末尾父亲的签名，声音也低了：“这笔他签过。我认。可我们几家的工钱，不能因此抹了。”你将两页留底，翻到育苗记录：同一片老圃，阙家的账和药工的记法竟对不上。得开渠看根。",
        snow: "季衡摊开当年的主门封闭令：“风雪已压碎外阵，再开，后面的人也守不住。”温蘅把原诊页压在他手边：“可西门还有人在等。我后来少报了几名伤者，怕药队就此被撤掉。”你从仓库副联找到韩肃挪售阵石的凭单，后面另夹着一道封西门的令。季衡反复看着落款，终于松开主门令：“西门那夜，我没去验。”纸上的两道令，到底怎样落在两道门上，还得进雪线看。",
        inn: "你循泥脚印找到小亭。阿团把灯放在漏雨处，窝在一群山雀旁。它把头埋进爪子里，任你怎么唤也不挪窝。你叫老人亲自来看看，再决定灯放哪里。",
      }[a.side];
      return;
    case "sideResolve":
      q.sides[a.side] = { step: 3, outcome: a.outcome };
      q.last = sideChoices[a.side][a.outcome]!.result;
      if (a.side === "estate") {
        s.herbs += 6;
        q.last +=
          "灵草 6 已收入行囊。许芦抱着救急的药，与等在门外的同伴先行一步。";
      }
      if (a.side === "snow") {
        if (!s.journey.known.includes("lantern"))
          s.journey.known.push("lantern");
        s.growth.training.lantern = Math.min(2, s.growth.training.lantern + 1);
        q.last +=
          "你把雪中辨认阵痕的心得记入照夜篇。照夜篇已习得，研修提升一阶（上限通达）。";
      }
      if (a.side === "inn") {
        s.injury = Math.max(0, s.injury - 1);
        q.last += "热汤与歇脚让伤势减少 1。老人说，下回路过也来坐坐。";
      }
      return;
    case "contact":
      q.contact = a.contact;
      q.last =
        a.contact === "letters"
          ? "你们约好由药队递信，信封只留投递点，不公开住处。“闭关时不必急着回。”对方将信封压好，“出关后告诉我一声就好。”"
          : "你们在旅图背面记下云栈旅亭，约好出关后在那里碰面；临时改道就留下封好的口信，亭主在簿上留了两行空白，问你们到时想喝什么茶。";
      return;
    case "propose":
      q.bond = "promised";
      q.last = shen
        ? "沈听澜放下刻刀：“我愿意同你走，也会有自己要画的山。结契之后，我们都得说清楚想去哪里。”她将刻刀收进匣里，看着你，等你回答。"
        : "尹照川合上修单：“我愿意。但我不能把你也写进每个夜班里。我们都得留出闭关与远行的时间。”他将手边的空杯斟满，推到你面前，等你的回答。";
      return;
    case "covenant":
      q.bond = "covenant";
      q.last =
        "你接过信物，把自己的那一枚放进对方掌心。你们在窗下坐到灯芯烧短，将各自想去的地方写在同一页纸上。今后是道侣，也是各有远路的修行人。";
      return;
    case "prepareTogether":
      s.herbs -= 2;
      q.aid = true;
      q.last =
        "你们用灵草 2 调好一份护脉准备，下次筑基挑战每合承伤再减 2，开战即消耗，不叠加；独战也可使用事前准备的药包。若已结契且远行重逢，道侣会随此次出行，在允许协作的关口依招式牵制敌人。药包已封好；若分别前没有用上，便留给远行的人。";
      return;
    case "depart":
      q.whereabouts = "away";
      q.departedAt = s.month;
      q.aid = false;
      q.last = shen
        ? "沈听澜独自去补测渡口以外的旧路，带走共同准备。你可以继续自己的修行；三个月后按约重逢，临行时，她朝你晃了晃那截约好的路标绳。"
        : "尹照川把夜值交给受训渡工，随修阵队去复核外地节点。你可以继续修行；三个月后按约重逢，出门前，他特意指给你看接班人的名字。";
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
          ? "陆迟已经把父亲亲笔信带回家，知道父亲还在守灯；信纸折了又展，边角已有些起毛。"
          : "陆迟仍在沿药路找父亲的消息。他把新问来的地名圈在图上，请你有空时也替他留意。") +
        (s.story.choice === "gift"
          ? "他提起你当年赠丹：“这次轮到我把自己的修行安排好。”"
          : "他看了看你腰间的丹瓶：“你走得比我快些。下回见面，我也该拿点新本事给你看。”") +
        "他选择留在药路轮值一季，教新药工辨路；温蘅和季衡则把程砚的行路指点交给你，温蘅另包了些干药叶，嘱咐他别误了晚饭。";
      return;
    case "report":
      q.rescue = 1;
      q.target = q.bond === "covenant" && q.reunion ? "companion" : "party";
      if (q.target === "companion") q.whereabouts = "missing";
      q.aid = false;
      q.last =
        q.target === "companion"
          ? `${shen ? "沈听澜带上新图" : "尹照川带上备用阵盘"}，在上次重逢后又随探索队进了古道。${q.contact === "letters" ? "药队没有带来约好的回信。" : "你先前去旅亭赴约，只见到了等候的亭主，连改道口信也没有。"}如今陶泊递来一枚断裂行牌，边缘还卡着新石屑：“山壁换了位置，船进不去。我只捡到这个，没见到人。”你攥住行牌，程砚却让你先把灯举高：“别跟着回声走。用你们自己的记号问。”`
          : "你来古道寻找稳脉机缘，却在渡头捡到一枚断裂的行牌。陶泊认出是闻岑小队的东西：“昨晚还看见他们的灯，现在山里只剩回声。”";
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
        "信号忽然被回声盖住，隔了片刻，又按原来的次序完整响了一遍。你这才松开攥着行牌的手。程砚钉牢外旗：“石室底下是整块岩基，守得住。我照应这里，你先把气调稳，再开外缘送补给。”";
      return;
    case "mentor":
      q.rescue = 3;
      q.last =
        "补给送入后，你再试那股逆流，灵息却在腕间撞作一团。程砚用两指压住你的脉：“你一直想把它推回去。让它过去，再接回来。”你照着沉井的行功路线重试，指尖终于不再发麻。他将外旗换到另一只手，示意你先练熟；内侧的归绳已有回应。学会稳脉：本段后续交锋每合承伤 −2。筑基修行达到 420 后可挑战内层禁制。";
      return;
    case "finish":
      q.condensation = true;
      q.last =
        "你将沉井传承与稳脉法接成一个周天，积在经脉间的涩意渐渐消散。程砚撤去半幅护阵旗：“换一口气，别沿着原来的劲硬顶。试着自己走完。”领悟周天贯流：此后筑基挑战中，相邻两合换招，伤害 +5、承伤 −2。长风归流试炼已可挑战，胜后归山完成本篇。";
      return;
  }
}
