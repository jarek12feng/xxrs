import { hasCultivationKit } from './initiation/rules';
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
  if(!hasCultivationKit(s))return {title:'回药坪求学',body:'你尚无正式传承与修行行装。药坪的温蘅熟悉求学门路；入宗或以散修身份立约，由你决定。',action:'initiation' as const,label:'到药坪求教'};
  const echo = rescueEcho(s.adventure);
  if (!s.journey.learning.book) return {
    title: "挑选入门功法",
    body: `${!s.adventure.road.thanked ? echo : ""} 你已取得基础功法的选学资格，可以挑选一册功法。养气、练剑或调息，学过之后仍可兼修。`,
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
  if(s.journey.branch === 'none' && s.qiJourney.narrative.initiation.admission === 'none') return {
    title:'在听松求学', body:'你已选好功法。到山下药坪拿出引荐纸，听听温蘅愿教你什么；可以争取拜师，也可以选择以散修身份继续。', action:'initiation' as const, label:'到药坪求教',
  };
  const r = s.adventure.road,
    q = s.expedition;
  if (!r.map)
    return {
      title: "坊市问路",
      body: "补齐缺角航图，寻找通往山外的路。坊市的郁青或许认得图上的标记；护送药队也是一条谋生门路。",
      action: "road" as const,
      label: "循缺角航图去坊市",
    };
  if (!q.accepted && !r.passed)
    return {
      title: "山道护送",
      body: "青嶂关的药队正在寻找护送之人。首关补给需灵石 2 与一月时间，炼气修士即可参与。",
      action: "road" as const,
      label: "查看护送委托",
    };
  if (q.accepted && q.cleared < 2)
    return {
      title: q.cleared === 0 ? "护住药车，追查名单" : "探明古阵",
      body:
        q.cleared === 0
          ? "观察来招，护住药车。若败退，可先静养，再来一试。"
          : "阵眼被乱流与草根缠住。寻踪所得的药签指向这里，准备方式可在阵前查看。",
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
      body: "到听松山下药坪，向温蘅说明求学之意。丹堂与剑院同属听松宗，须有历练引荐才可拜师；也可以保持散修，在坊市求教。",
      action: "road" as const,
      label: "回到山下求学",
    };
  if (s.story.choice === "missed" && !s.crafted && !s.pills)
    return { title: "独自再探遗府", body: "旧约已过。洞府丹炉处可独自重返青石遗府，取得筑基丹与丹方；入府仍须修为180与破阵准备。", action: "break" as const, label: "查看遗府筹备" };
  if (s.qi < 360)
    return {
      title: s.story.stage === "waiting" ? "为三年之约作准备" : "积累修为，准备筑基",
      body: s.story.stage === "waiting" ? `第三十六月赴约，尚余 ${Math.max(0,36-s.month)} 个月。入府需 180 修为与一种破阵手段；修行与历练都会消耗月份。` : "圆满修为与筑基丹是叩关所需，疗伤与固本可改善把握。",
      action: "cultivate" as const,
      label: "回洞府准备",
    };
  return {
    title: "修为已满，先检查准备",
    body: "筑基必须有一枚筑基丹；遗府通关后可凭丹方补炼。伤势会拖累突破，养伤与护法能改善把握。突破面板可查看本次代价与把握。",
    action: "break" as const,
    label: "查看突破准备",
  };
}
