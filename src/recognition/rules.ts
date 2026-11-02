import type { State } from "../world";
import { cultivationStageIndex } from "../cultivation";
import { workshopLock } from "../workshop/rules";
import type { DeedTier, Method, Office } from "./state";
export type RecognitionAction =
  | { kind: "inner" | "appoint" | "defer" | "resign" }
  | { kind: "undertake" | "routine"; tier: DeedTier; method: Method };
export const hasExperience = (s: State) =>
  s.expedition.cleared >= 1 ||
  s.qiJourney.preparations.some((p) => Object.values(p).some((v) => v === 3));
export const hasOldRoad = (s: State) =>
  s.realm === 1 && (s.adventure.road.surveyed || s.expedition.cleared === 3);
export const currentOffice = (s: State): Office =>
  s.recognition.affiliation === s.journey.branch ? s.recognition.office : 0;
export function eligibleOffice(s: State): Office {
  if (
    s.realm === 1 &&
    s.foundationJourney.cultivation >= 200 &&
    s.foundationJourney.growth.refined &&
    s.recognition.deeds.some((d) => d.tier === 1)
  )
    return 2;
  return (s.realm === 1 || cultivationStageIndex(s) >= 1) && hasExperience(s)
    ? 1
    : 0;
}
export function officeName(s: State, tier: Office = currentOffice(s)) {
  return tier === 2
    ? { none: "药队客卿", dan: "丹房主事", jian: "护路执事" }[s.journey.branch]
    : tier === 1
      ? { none: "受邀领队", dan: "护药领队", jian: "护送领队" }[
          s.journey.branch
        ]
      : "未任职";
}
export function identity(s: State) {
  return s.journey.branch === "none"
    ? "散修"
    : s.recognition.innerMonth !== null
      ? "内门弟子"
      : s.journey.rank
        ? "外门弟子"
        : "记名弟子";
}
export function jobName(s: State, tier: DeedTier) {
  return {
    none: ["领队过山口", "护商队过旧阵", "合探归路"],
    dan: ["独护一篓药", "主持护脉药会", "主理一季药运"],
    jian: ["独领山口药队", "主持旧阵护送", "统筹深山护路"],
  }[s.journey.branch][tier]!;
}
export function recognitionQuote(s: State, a: RecognitionAction) {
  let error = workshopLock(s)
      ? "先处理眼前事件或结束历练，再来商议任用与行程"
      : "",
    months = 0,
    herbs = 0,
    stones = 0,
    contribution = 0;
  if (!error && s.adventure.step !== "done") error = "先救回药工，再来商议行程";
  if (a.kind === "inner") {
    error ||=
      s.journey.branch === "none"
        ? "先拜入师门"
        : s.recognition.innerMonth !== null
          ? "已入内门"
          : !hasOldRoad(s)
            ? "筑基后重返青嶂，打通旧阵或踏勘归路，再回山受录"
            : "";
  } else if (a.kind === "appoint") {
    const level = eligibleOffice(s);
    error ||= !level
      ? "修至炼气中期，亲自完成一次护送或成长路线实战"
      : currentOffice(s) >= level
        ? "已受此职"
        : level === 2 &&
            s.journey.branch !== "none" &&
            s.recognition.innerMonth === null
          ? "先回师门受录内门"
          : "";
  } else if (a.kind === "resign") {
    error ||= !currentOffice(s) ? "眼下未任职" : "";
  } else if (a.kind === "defer") {
    error ||= s.recognition.deferred ? "已记下暂缓之意" : "";
  } else if (a.kind === "undertake" || a.kind === "routine") {
    if (
      ![0, 1, 2].includes(a.tier) ||
      !["supplies", "skill"].includes(a.method)
    )
      return {
        error: "未知差事或行路办法",
        months,
        herbs,
        stones,
        contribution,
      };
    const done = s.recognition.deeds.some((d) => d.tier === a.tier);
    error ||=
      currentOffice(s) < (a.tier === 2 ? 2 : 1) ? "先接受领队或执事任用" : "";
    error ||=
      a.tier >= 1 && !hasOldRoad(s) ? "先以筑基之力打通旧阵或踏勘归路" : "";
    error ||=
      a.tier >= 1 &&
      s.journey.branch !== "none" &&
      s.recognition.innerMonth === null
        ? "先受录内门，再主持此事"
        : "";
    error ||=
      a.tier === 2 &&
      (s.foundationJourney.cultivation < 200 ||
        !s.foundationJourney.growth.refined)
        ? "筑基中期亲自取材炼元后，方可主持远路"
        : "";
    error ||=
      a.kind === "routine"
        ? !done
          ? "先亲自办成此事，再循熟路简办"
          : ""
        : done
          ? "此事已记入履历；可选择熟路差事"
          : "";
    error ||= s.injury > 2 ? "先静养至伤势 2 或以下" : "";
    months = 1;
    herbs = a.method === "supplies" ? a.tier + 2 : 0;
    // Skill replaces supplies only after actual practice, never by an empty title.
    const skilled =
      a.tier === 0
        ? s.realm === 1 ||
          cultivationStageIndex(s) >= 2 ||
          (s.sense >= 8 && s.study >= 2)
        : a.tier === 1
          ? s.journey.main !== null && s.growth.training[s.journey.main] >= 1
          : s.journey.main !== null &&
            s.growth.training[s.journey.main] === 2 &&
            s.foundationJourney.inheritance === s.journey.main;
    error ||=
      a.method === "skill" && !skilled
        ? a.tier === 0
          ? "需神识 8、心得 2；或修至炼气后期"
          : a.tier === 1
            ? "需装配熟练或通达的主修功法"
            : "需装配与沉井传承相合的通达主修"
        : "";
    error ||=
      s.herbs < herbs ? `需灵草 ${herbs}；可采药、购草或另选凭本领行事` : "";
    stones =
      (a.kind === "routine" ? [8, 12, 16] : [12, 18, 24])[a.tier]! + herbs * 2;
    contribution = s.journey.branch === "none" ? 0 : 1;
    if (s.journey.branch === "none") stones += 2;
  } else error ||= "未知任用事项";
  return { error, months, herbs, stones, contribution };
}
export function runRecognition(
  input: State,
  a: RecognitionAction,
  id: string,
  tick: (s: State) => State,
): State {
  const quote = recognitionQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  if (quote.months) {
    s = tick(s);
    if (s.status !== "alive" || s.pending || s.social.scene) {
      s.recognition.last =
        s.status === "alive"
          ? "行前有信，暂缓出发。药材未动，报酬未领。"
          : "寿元已尽，此行未成。";
      return finish();
    }
  }
  const r = s.recognition;
  if (a.kind === "inner") {
    r.innerMonth = s.month;
    r.last =
      s.journey.branch === "dan"
        ? "温蘅将你的名字录入内门册：“旧阵那一程，你已能护住旁人。这回你主炉，我替你看药。”内门已受录，可主持护脉药会；借丹房炼化筑基主材，贡献由 8 减为 6。"
        : "季衡将内门名册摊开：“青嶂那道旧阵，你已经走过。往后这段药路，可愿接手一程？”内门已受录，可主持旧阵护送；借丹房炼化筑基主材，贡献由 8 减为 6。";
  } else if (a.kind === "appoint") {
    r.office = eligibleOffice(s);
    r.affiliation = s.journey.branch;
    r.deferred = false;
    if (
      !r.appointments.some(
        (x) => x.tier === r.office && x.affiliation === r.affiliation,
      )
    )
      r.appointments.push({
        tier: r.office as 1 | 2,
        affiliation: r.affiliation,
        month: s.month,
      });
    r.last =
      `${officeName(s)}之职已受。` +
      (s.journey.branch === "dan"
        ? "温蘅把药册交给你：“药性和退路，都由你来定。办妥后回来告诉我。”"
        : s.journey.branch === "jian"
          ? "季衡将行牌递来：“这一程你领队，走哪条路，你来定。”"
          : "药队管事将行牌交给你：“听说你亲自闯过险路。这一程，有劳领路。”") +
      "可先备药稳行，也可凭所学护住队伍；闭关前随时可交还行牌。";
  } else if (a.kind === "defer") {
    r.deferred = true;
    r.last = "你暂缓任用，先去修行。日后有意，再来商议。";
  } else if (a.kind === "resign") {
    r.office = 0;
    r.deferred = true;
    r.last =
      "你交还行牌，腾出时间闭关远行。旧日亲历仍记在册中，日后也可再来受职。";
  } else if (a.kind === "undertake" || a.kind === "routine") {
    s.herbs -= quote.herbs;
    s.stones += quote.stones;
    s.journey.contribution += quote.contribution;
    if (a.kind === "undertake")
      r.deeds.push({
        tier: a.tier,
        method: a.method,
        affiliation: s.journey.branch,
        month: s.month,
      });
    let outcome =
      a.method === "supplies"
        ? `你用灵草 ${quote.herbs} 备好护脉药，带众人沿缓路稳行。`
        : a.tier === 0
          ? "你辨清山口灵流，护着药队穿过险处，无须再请师长撑住阵口。"
          : a.tier === 1
            ? "你展开筑基灵息，稳住曾逼你退回的旧阵。身后的人踏过石阶，药箱一只也未落下。"
            : "你将沉井所学运过回流，逐一稳住沿途险处。药队按你留下的记号换班，归路不断。";
    if (s.journey.branch === "dan" && a.tier === 1)
      outcome =
        a.method === "supplies"
          ? `你用灵草 ${quote.herbs} 调和药性，温蘅在旁看药，由你坐镇药炉。成药交给药工，送往沿路药站。`
          : "你以筑基灵息稳住炉火，按熟习的行功法调和药力。温蘅验过成药，点头让药工装篓送出。";
    r.last =
      `${jobName(s, a.tier)}：${outcome}` +
      (a.kind === "undertake"
        ? "归来时，药工问你：“下回几时起行？”此事已记入履历，往后可循熟路简办。"
        : "旧路已熟，此番不再逐处停留试探。") +
      `灵石 +${quote.stones}${quote.contribution ? "，贡献 +1" : ""}；耗时一月。`;
  }
  return finish();
  function finish() {
    s.seen = [...s.seen, id].slice(-512);
    s.log.unshift({ month: s.month, kind: "story", text: s.recognition.last });
    s.log = s.log.slice(0, 180);
    return s;
  }
}
