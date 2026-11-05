import { planOrder } from "../workshop/recipes";
import type { State } from "../world";
import type { ResourceAmounts } from "../economy";
export type RevisitSite = "estate" | "ferry" | "lizhao";
export interface RevisitOffer {
  id: "herbs" | "spirit";
  label: string;
  reason: string;
  cost: ResourceAmounts;
  reward: ResourceAmounts;
}
export interface RevisitView {
  title: string;
  account: string;
  change: string;
  offers: RevisitOffer[];
}
/** Consequences come from the original chapter facts, never from truncated logs or UI visits. */
export function revisitView(s: State, site: RevisitSite): RevisitView | null {
  if (site === "estate") {
    const r = s.foundationJourney.growth.routes.estate;
    if (!r.processed || !s.foundationJourney.won.includes("salamander"))
      return null;
    const kept = r.choice === "careful",
      map = s.foundationJourney.heroine.map;
    return {
      title: "药床与旧工单",
      account: kept
        ? "那次你留下根床，药工仍按那份护根记录分畦采药。"
        : "那次你先取成熟药心，旧工单记着当季减量；如今先留足救急药，再接普通订单。",
      change:
        (map === "public"
          ? "路站留着你们公开的干道图，住户井口仍未标在公图上。"
          : map === "detour"
            ? "路站沿用你们绕开住户的路图，没有把私井画成公共取水点。"
            : "路站暂未收到你们共同交接的路图。") +
        (r.revisited
          ? "旧回访订单已经交清，本次补给照价结算。"
          : "药材订单仍可交接，护圃阵已经稳住。"),
      offers: [
        {
          id: "herbs",
          label: "按药庄旧单补灵草4",
          reason: kept
            ? "护根记录让可供药量充足，按旧单价灵石6结算。"
            : "药床先留救急份，按常价灵石8结算。",
          cost: { stones: kept ? 6 : 8 },
          reward: { herbs: 4 },
        },
      ],
    };
  }
  if (site === "ferry") {
    if (s.outerSea.cleared !== 2 || s.outerSea.pact === "none") return null;
    const medicinePrice = planOrder(s, {
      product: "spirit",
      method: "buy",
    }).stones;
    const shared = s.outerSea.pact === "share",
      r = s.goldenStory.reunion;
    const aftermath =
      r.stage === "departed"
        ? r.sharing === "public"
          ? "侧堤图台还贴着你们公开的安全落点，私修批注没有张贴。"
          : "侧堤图台只标了你们告知的险点；完整底图仍未公开。"
        : "侧堤尚无你与苏婉宁此次共同测读的留档。";
    return {
      title: "潮图留下的去路",
      account: shared
        ? "修堤者把你们共享的潮图夹在当值册中，药船循已开的支流换班。"
        : "你的私有支路仍未公开；当值册只保留交还的观潮卷，完整测图仍由你保留。",
      change: aftermath + "退潮内府的守枢已平，药船能沿旧路靠岸。",
      offers: [
        {
          id: "herbs",
          label: "向药船补灵草4",
          reason: shared
            ? "公开潮路接上合运，补草按合运价灵石6。"
            : "私有支路未加入合运，补草按常价灵石8。",
          cost: { stones: shared ? 6 : 8 },
          reward: { herbs: 4 },
        },
        {
          id: "spirit",
          label: "向药船丹师购养神丹1",
          reason: shared
            ? `成丹按常价灵石${medicinePrice}；也可自行炼制。`
            : `凭自留观潮记录协助辨药，成丹抵扣灵石8，现价${medicinePrice - 8}；也可自行炼制。`,
          cost: { stones: shared ? medicinePrice : medicinePrice - 8 },
          reward: { spirit: 1 },
        },
      ],
    };
  }
  if (site === "lizhao") {
    const l = s.lizhao;
    if (!l.recipeVerified || l.allocation === "none") return null;
    const terms = reagentTerms(s);
    const account =
      l.allocation === "share"
        ? "分药台留着你公开的排潮记录。后来轮值者能照着核验，各人的订药仍各归其主。"
        : l.allocation === "private"
          ? "分药册注明你自留所得，邵荃原订药未被动用。港口不持有你的完整药性批注。"
          : l.pursuit === "settled"
            ? "旧册同时记着扣药和后来赔偿解除雇契；这段争执没有被抹去，港口恢复常规轮取。"
            : l.pursuit === "exposed"
              ? "雇契已带回港口公开。私雇夺药的追索止住了，最初扣下订药的记录也仍在册上。"
              : "扣下订药的争执尚未按赔偿或公开雇契的方式了结。私人接应不再提供，公共轮取仍可办理。";
    return {
      title: "分药台上的旧约",
      account,
      change: `${terms.reason}下一份定性辅药需${terms.months}月、灵石${terms.stones}、灵草${terms.herbs}。药池去路已通，验过的药理仍可沿用。`,
      offers: [],
    };
  }
  return null;
}
export function reagentTerms(s: State) {
  const l = s.lizhao;
  if (l.allocation === "share")
    return {
      months: 4,
      stones: 24,
      herbs: 4,
      reason: "公开排潮记录缩短了轮值者的复核，轮取由半年缩为四月。",
    };
  if (l.allocation === "private")
    return {
      months: 6,
      stones: 20,
      herbs: 4,
      reason: "你自持药性记录，省去代查工钱，轮取仍须候满半年。",
    };
  const disputed =
    l.allocation === "seize" && !["settled", "exposed"].includes(l.pursuit);
  return {
    months: 6,
    stones: disputed ? 32 : 24,
    herbs: 4,
    reason: disputed
      ? "争执未清，公共轮取另计护送工钱。"
      : "按港口原有轮次与工钱办理。",
  };
}
