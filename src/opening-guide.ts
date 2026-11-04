import { rescueEcho, type State } from "./core";
import { expeditionGoal } from "./expedition/progression";
// Read-only coaching. No timers, rewards, randomness or extra save fields.
export function openingGuide(s: State) {
  if (s.status !== "alive" || s.adventure.step !== "done") return null;
  if (s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel)
    return null;
  if (s.realm >= 2) return null;
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
  if (!s.journey.learning.book) return {
    title: "挑选入门功法",
    body: `${!s.adventure.road.thanked ? echo : ""} 药工请你挑选一册功法。养气、练剑或调息，学过之后仍可兼修。`,
    action: "skills" as const,
    label: "挑选第一册功法",
  };
  if (
    (!s.adventure.road.map || s.expedition.cleared === 1) &&
    !s.journey.main &&
    s.journey.known.some((t) => t === "blade" || t === "spring" || t === "breath")
  )
    return {
      title: "初习功法",
      body: `${!s.adventure.road.thanked ? echo : ""} 药工所赠功法已收好。装配主修，修行与交锋便可运用；也可回访药工，打听归路消息。`,
      action: "skills" as const,
      label: "装配第一册功法",
    };
  if (!s.adventure.road.thanked)
    return {
      title: "第一段归路已完成",
      body: echo || "药工已经平安归家。旧航图指向山外，先听听他的消息。",
      action: "road" as const,
      label: "回访药工，看看后来发生的事",
    };
  if (
    s.expedition.cleared === 1 &&
    !s.journey.equipped &&
    Object.values(s.journey.relics).some((level) => level > 0)
  )
    return {
      title: "药队送来的灵器，还未装配",
      body: "药队所赠灵器已收入行囊，装配便可御敌，无须先行精炼。",
      action: "gear" as const,
      label: "查看并装配首件灵器",
    };
  const r = s.adventure.road,
    q = s.expedition;
  if (!r.map)
    return {
      title: "坊市问路",
      body: "与郁青交谈、接下伤药委托，交灵草或帮助辨药补齐航图。炼气修士也可接下山道护送，赚些盘缠。",
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
          ? "观察来招，护住药车。若败退，可先静养，再来一试。"
          : "神识 6、心得 2 可以辨阵；也可用灵草 4 温养草根。选择适合自己的准备方式即可。",
      action: "road" as const,
      label: "返回关口",
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
      title: "回山吐纳",
      body: "此番营救不耗月份。回洞府吐纳一月，稳固根基；遇来信或赴约，修行会暂停。",
      action: "cultivate" as const,
      label: "去洞府试一次吐纳",
    };
  if (s.journey.branch === "none" && s.journey.known.length === 0)
    return {
      title: "择师求道",
      body: "丹堂擅长药理，剑院擅长护送。先看看师门和功法；也可以保持散修，在坊市求教。三十六月的渡口之约记在见闻里。",
      action: "sect" as const,
      label: "看看师门能教什么",
    };
  if (s.qi < 360)
    return {
      title: "为三年之约作准备",
      body: `距第三十六月${s.month < 36 ? `还有 ${36 - s.month} 个月` : "的约定已有进展"}。吐纳积累修为，积累 180 修为并准备一种破阵手段，通关后才能依方炼筑基丹；闭关会经过六个月，赴约前留意时辰。`,
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
