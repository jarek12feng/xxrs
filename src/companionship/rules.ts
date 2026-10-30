import { plans } from "./content";
import type { State } from "../world";

export type Method = "strength" | "insight" | "supplies";
export type Plan = "public" | "detour" | "relay" | "backup";
export interface Companionship {
  stage: "unstarted" | "prepare" | "dispute" | "trial" | "done";
  method: Method | null;
  plan: Plan | null;
  last: string;
}
export type CompanionAction = "start" | Method | Plan | "test" | "revisit";
export const freshCompanionship = (): Companionship => ({
  stage: "unstarted",
  method: null,
  plan: null,
  last: "",
});
export function companionshipError(s: State) {
  if (s.status !== "alive") return "这段修行已经结束";
  if (s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel)
    return "先处理眼前事件或结束交锋";
  if (s.realm < 1) return "筑基后才能承受这段险路的灵流";
  if (s.age < 216) return "成年后再与同行者相约";
  if (!s.social.met || !s.social.gender) return "先在山门外相识，无需定情";
  return "";
}
export function methodError(s: State, method: Method) {
  if (s.injury > 2) return "先将伤势养至 2 以下或等于 2；可免费静养";
  if (method === "strength" && s.root + s.mastery < 12)
    return "需根骨与剑意合计 12，可历练积累剑意";
  if (method === "insight" && (s.sense < 8 || s.study < 2))
    return "需神识 8、心得 2；凝神与研读可以准备，不消耗心得";
  if (method === "supplies" && s.herbs < 4) return "需灵草 4，可采药准备";
  return "";
}
export function availablePlans(s: State): Plan[] {
  return s.social.gender === "male"
    ? ["public", "detour"]
    : ["relay", "backup"];
}
export function runCompanionship(
  input: State,
  action: CompanionAction,
  id: string,
): State {
  if (companionshipError(input)) return input;
  const q = input.companionship;
  if (action === "start" && q.stage !== "unstarted") return input;
  if (
    ["strength", "insight", "supplies"].includes(action) &&
    q.stage !== "prepare"
  )
    return input;
  if (
    Object.hasOwn(plans, action) &&
    (q.stage !== "dispute" || !availablePlans(input).includes(action as Plan))
  )
    return input;
  if (action === "test" && q.stage !== "trial") return input;
  if (action === "revisit" && q.stage !== "done") return input;
  if (
    ![
      "start",
      "strength",
      "insight",
      "supplies",
      "public",
      "detour",
      "relay",
      "backup",
      "test",
      "revisit",
    ].includes(action)
  )
    return input;
  if (Object.hasOwn(plans, action) && input.stones < plans[action as Plan].cost)
    return input;
  // Invalid or unprepared attempts do not consume resources, time or RNG.
  if (
    ["strength", "insight", "supplies"].includes(action) &&
    methodError(input, action as Method)
  )
    return input;
  if (action === "test" && input.injury > 2) return input;
  const s = structuredClone(input),
    n = s.companionship;
  const femaleCompanion = s.social.gender === "male";
  if (action === "start") {
    n.stage = "prepare";
    n.last = femaleCompanion
      ? "你要为自己的远行勘一条安全路。沈听澜带来尺绳：“我量坡度，你稳住上面的石梁。能御剑过去，不代表背粮的人也能走。”雨棚外有一道松动的落石，先准备好再动手。"
      : "你想学会在紊乱灵流中护住自身，为远行作准备。尹照川请你到上游校验阵石，他在主灯处报信。旧工单漏记了风标半格的偏差；今晚先用空船试灯，失手便退到备用泊点，不拿药工试阵。";
  } else if (["strength", "insight", "supplies"].includes(action)) {
    n.method = action as Method;
    if (action === "supplies") s.herbs -= 4;
    n.stage = "dispute";
    const methods = femaleCompanion
      ? {
          strength:
            "你以剑意卸去松石的力道，稳住石梁；沈听澜拴好尺绳，测出背粮人能走的坡度。",
          insight:
            "你循灵流找出石梁下的稳固节点；沈听澜顺着你的标记重测，避开那截看似平坦的空壳石。",
          supplies:
            "你用四份灵草调出固根药液，把崖边根系护住；沈听澜系绳复核每一段落脚点。灵草 −4。",
        }
      : {
          strength:
            "你以剑意分开压向阵石的乱流；尹照川按约定亮灭主灯，让你抓住重新固定阵石的空隙。",
          insight:
            "你辨出旧阵回流的节点，指出风标应偏回半格；尹照川立即修正灯讯，空船稳稳进了备用泊点。",
          supplies:
            "你用四份灵草调出护脉药液，顶住回流稳住阵石；尹照川守着灯讯引空船入泊。灵草 −4。",
        };
    const learned = !s.journey.known.includes("guard");
    if (learned) s.journey.known.push("guard");
    else s.study = Math.min(4, s.study + 2);
    n.last =
      methods[action as Method] +
      (learned
        ? "你把这次稳住周身灵流的办法记成护身诀，已习得，可在功法页装配。它在交锋中每合减伤 2，历练不新增伤势。"
        : "你已学过护身诀，这次复核使心得增加 2（上限 4）。") +
      "接下来仍须装配护身诀，亲自校验归路。";
  } else if (Object.hasOwn(plans, action)) {
    n.plan = action as Plan;
    s.stones -= plans[n.plan].cost;
    n.stage = "trial";
    n.last = femaleCompanion
      ? "“我没写名字。”沈听澜看着药舍住户指出的井口与果树，终于放下刻刀：“可这些已经够找上门了。”这户人家拒绝以孩子抵债的私约，住址未经同意不能公开。你们选定修改办法；她亲自改图，你去复核归路，不能只在纸上画一条安全线。"
      : "尹照川又把自己的名字填进每个空班。“风标是我修的，漏写也是我的错。”你指出一直熬着不能补上训练。他划去多余夜值，答应按你们选定的办法交接。先让渡工独立报信，你去验备用泊点。";
  } else if (action === "test") {
    // The same existing support technique that reduces combat damage now
    // protects this announced, deterministic field test. No new stat system.
    if (s.journey.support !== "guard") {
      s.injury = Math.min(6, s.injury + 2);
      n.last =
        "两股回流接连撞上经脉，伤势 +2。你们按事先约定退回安全泊点；方案与已学功法保留。先免费静养，再装配护身诀重试，同行者不替你硬扛。";
    } else {
      n.stage = "done";
      n.last =
        "护身诀已装配：归路试验的两股回流被护势化开，本次新增伤势 0（未装配时承受 2 层伤势并退回）。" +
        plans[n.plan!].result +
        (s.social.bonded
          ? "你们仍记得定情时各自的远方，约好下次出关后再来看看。"
          : "你们以同行朋友的身份互相道谢，各自继续修行。") +
        "护身诀留在你的功法中，后续交锋与历练都能继续使用。";
    }
  } else {
    const revisit =
      plans[n.plan!].result +
      "归路仍按这份安排运作，没有额外报酬，也不要求你留下代班。";
    if (n.last === revisit) return input;
    n.last = revisit;
  }
  s.seen = [...input.seen, id].slice(-512);
  s.log.unshift({ month: s.month, kind: "story", text: n.last });
  s.log = s.log.slice(0, 180);
  return s;
}
export function validCompanionship(s: State): boolean {
  const q = s.companionship;
  if (
    !q ||
    !["unstarted", "prepare", "dispute", "trial", "done"].includes(q.stage) ||
    ![null, "strength", "insight", "supplies"].includes(q.method) ||
    ![null, "public", "detour", "relay", "backup"].includes(q.plan) ||
    typeof q.last !== "string" ||
    q.last.length > 2000
  )
    return false;
  if (q.stage === "unstarted")
    return q.method === null && q.plan === null && q.last === "";
  if (!s.social.met || !s.social.gender || s.realm < 1 || s.age < 216)
    return false;
  if (q.stage === "prepare") return q.method === null && q.plan === null;
  if (!q.method || !s.journey.known.includes("guard")) return false;
  return q.stage === "dispute"
    ? q.plan === null
    : q.plan !== null && availablePlans(s).includes(q.plan);
}
