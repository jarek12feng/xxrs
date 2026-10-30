import { rescueEcho, type State } from "./core";
import { expeditionGoal } from "./expedition/progression";
// Read-only coaching. No timers, rewards, randomness or extra save fields.
export function openingGuide(s: State) {
  if (s.status !== "alive" || s.adventure.step !== "done") return null;
  if (s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel)
    return null;
  if (s.realm === 1) {
    if (!s.expedition.accepted || s.expedition.cleared !== 2) return null;
    return {
      title: "筑基已成，再赴旧阵",
      body: expeditionGoal(s)!,
      action: "road" as const,
      label: "回到行路，重返旧阵",
    };
  }
  const echo = rescueEcho(s.adventure);
  if (!s.adventure.road.thanked)
    return {
      title: "第一段归路已完成",
      body: echo || "药工已经平安归家。旧航图指向山外，先听听他的消息。",
      action: "road" as const,
      label: "回访药工，看看后来发生的事",
    };
  if (
    (!s.adventure.road.map || s.expedition.cleared === 1) &&
    !s.journey.main &&
    s.journey.known.some((t) => t === "blade" || t === "spring")
  )
    return {
      title: "把第一册功法用起来",
      body: "药工的谢礼已收入功法页。装配主修会改变修行与战斗；以后可用灵草和灵石研修至熟练。",
      action: "skills" as const,
      label: "装配第一册功法",
    };
  if (
    s.expedition.cleared === 1 &&
    !s.journey.equipped &&
    Object.values(s.journey.relics).some((level) => level > 0)
  )
    return {
      title: "药队送来的灵器，还未装配",
      body: "首胜奖励已经在行囊里。装配后再查看交锋准备，比较伤害或减伤变化；不用先花材料精炼。",
      action: "gear" as const,
      label: "查看并装配首件灵器",
    };
  const r = s.adventure.road,
    q = s.expedition;
  if (!r.map)
    return {
      title: "先去坊市，让修行有个目标",
      body: "与郁青交谈、接下伤药委托，交灵草或帮助辨药补齐航图。接下来有炼气期就能尝试的护送小关，不必先练满属性。",
      action: "road" as const,
      label: "循缺角航图去坊市",
    };
  if (!q.accepted && !r.passed)
    return {
      title: "先试山道护送",
      body: "到青嶂关或行营接取护送与旧阵。首关只需灵石 2 与一月时间，不要求筑基；观察来招，尝试守势、反击和辨影。",
      action: "road" as const,
      label: "查看护送委托",
    };
  if (q.accepted && q.cleared < 2)
    return {
      title: q.cleared === 0 ? "护住药车，追查名单" : "古阵前有两种准备路线",
      body:
        q.cleared === 0
          ? "先完成一场短交锋；失败后静养再来，不必把所有数值练满。"
          : "神识 6、心得 2 可以辨阵；也可用灵草 4 温养草根。选择适合自己的准备方式即可。",
      action: "road" as const,
      label: "返回当前小关",
    };
  if (q.accepted && q.cleared === 2)
    return s.qi < 360
      ? {
          title: "旧阵深处，需要筑基之力",
          body: expeditionGoal(s)!,
          action: "cultivate" as const,
          label: "为守阵交锋修炼",
        }
      : {
          title: "准备叩关，再赴旧阵",
          body: expeditionGoal(s)!,
          action: "break" as const,
          label: "查看筑基准备",
        };
  if (s.month < 3)
    return {
      title: "先试一个月的修行",
      body: "营救不计月份，洞府修行才会推进时光。先体验一次吐纳；第三个月陆迟会来找你，剧情出现时修行会停下。",
      action: "cultivate" as const,
      label: "去洞府试一次吐纳",
    };
  if (s.journey.branch === "none" && s.journey.known.length === 0)
    return {
      title: "让修行有自己的路数",
      body: "丹堂擅长药理，剑院擅长护送。先看看师门和功法；也可以保持散修，在坊市求教。三十六月的渡口之约记在见闻里。",
      action: "sect" as const,
      label: "看看师门能教什么",
    };
  if (s.qi < 360)
    return {
      title: "为三年之约作准备",
      body: `距第三十六月${s.month < 36 ? `还有 ${36 - s.month} 个月` : "的约定已有进展"}。吐纳积累修为，积累 180 修为并准备一种破阵手段，通关后才能依方炼筑基丹；不用把所有属性练满。闭关会经过六个月，赴约前留意时辰。`,
      action: "cultivate" as const,
      label: "回洞府准备",
    };
  return {
    title: "修为已满，先检查准备",
    body: "筑基必须有一枚筑基丹；遗府通关后可凭丹方补炼。伤势会拖累突破，养伤与护法能改善把握。先查看突破面板的代价，再决定是否叩关。",
    action: "break" as const,
    label: "查看突破准备",
  };
}
