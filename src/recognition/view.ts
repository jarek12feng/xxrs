import { pactEarnedTrust } from "../secret-pact/rules";
import type { State } from "../world";
import { cultivationStageIndex, realmStageLabel } from "../progression";
import {
  currentOffice,
  eligibleOffice,
  hasExperience,
  hasOldRoad,
  officeName,
  identity,
} from "./rules";
export function recognitionView(s: State) {
  const stage = cultivationStageIndex(s),
    r = s.recognition;
  const title = identity(s) + " · " + officeName(s);
  let next =
    "炼气中期可独领一程；先修行，再亲自完成护送或三路历练中的一次实战。";
  if (s.realm || stage >= 1)
    next = hasExperience(s)
      ? "已有亲历，可以受托领队。熟悉的山口，这次由你拿主意。"
      : "你已能持续护住灵息，去完成一次护送或成长路线实战，再来受托领队。";
  if (currentOffice(s))
    next = s.realm
      ? "重返旧阵、踏勘青嶂归路后，可主持筑基委托。"
      : "可先备药稳行；炼气后期可凭自身灵力护住熟路，不再耗草。";
  if (hasOldRoad(s))
    next =
      s.journey.branch !== "none" && r.innerMonth === null
        ? "青嶂旧路已通，回师门受录内门，再主持一次药运。"
        : "旧阵再挡不住你的脚步，可以主持一次药运；办成后开放熟路差事。";
  if (r.deeds.some((d) => d.tier === 1) || pactEarnedTrust(s))
    next =
      eligibleOffice(s) === 2
        ? pactEarnedTrust(s) ? "照玄府一行，你守住了分取之约；取材炼元也已办成，可受更高任用。" : "已有主持药运的实绩，又亲自取材炼元，可接受更高任用。"
        : "筑基中期亲自取材炼元后，可受托主持远路。";
  if (currentOffice(s) === 2)
    next = "可主持远路、循熟路办差，也可交还行牌，专心闭关。";
  const quote =
    s.journey.branch === "dan"
      ? r.innerMonth !== null
        ? "温蘅：“这批药由你主理。遇到拿不准的药性，再来找我。”"
        : hasExperience(s) && (s.realm || stage >= 1)
          ? "温蘅：“你已亲自走过险路。这次药篓交给你，退路也由你来定。”"
          : "温蘅：“先替我认清药材。气息稳了，再领药队出山。”"
      : s.journey.branch === "jian"
        ? r.innerMonth !== null
          ? "季衡：“旧阵已过，这一程你领队。我替你照看山门。”"
          : hasExperience(s) && (s.realm || stage >= 1)
            ? "季衡：“护送的本事你已有了。下次走哪条路，你来定。”"
            : "季衡：“眼下先护住身旁的人，山口有我。修到中期，再来领队。”"
        : currentOffice(s)
          ? "药队管事：“行装已齐，何时起行，听你的。”"
          : hasExperience(s)
            ? "药队管事：“你闯过险路的事，我们听说了。可愿领上一程？”"
            : "药队管事：“先熟悉这段山路。等能独自护住药车，再来接领队的差事。”";
  return {
    title,
    next,
    quote,
    invitation: !r.deferred && eligibleOffice(s) > currentOffice(s),
    realm: realmStageLabel(s),
  };
}
export function advancementPromise(s: State) {
  if(s.realm === 2) return s.conclave.stage===0?"金丹中期：凝炼丹元后可与诸宗修士斗法，争取凝婴秘境资格。":s.conclave.stage===1?"金丹后期：以护神宝物与新法融汇丹元，继续筹备凝婴。":"护神宝物与新法已兑现；圆满试炼与化婴丹仍待后续道途。";
  if (!s.realm)
    return cultivationStageIndex(s) === 0
      ? "下一境 · 炼气中期：可走药谷、宗门或散修历练；亲自闯关后，受邀领队，赚取护送报酬。"
      : cultivationStageIndex(s) === 1
        ? "下一境 · 炼气后期：已受托的山口护送可凭灵力完成，不再必需护脉药。内府也将向你开放。"
        : cultivationStageIndex(s) === 2
          ? "下一境 · 炼气圆满：修为将抵炼气尽头，可着手筑基药物、心法与旧阵行前整备。"
          : "下一境 · 筑基：重返青嶂旧阵，受录内门或以散修身份主持药运，研修通达功法与二阶灵器。";
  return s.foundationJourney.cultivation < 200
    ? "下一境 · 筑基中期：可往药庄、雪线、古道择路取材。主持药运并炼元后，可受任主事、执事或药队客卿。"
    : s.foundationJourney.cultivation < 400
      ? "下一境 · 筑基后期：可学稳脉、深入古道接应，逐步贯通周天。"
      : s.foundationJourney.cultivation < 600
        ? "下一境 · 筑基圆满：先贯通周天、闯过长风归流，再积累至圆满，归山与故人相见。可通过内比或凝露药圃争取主药，为结丹准备。"
        : "筑基圆满：可访友、主持远路或交还职务，继续同一段人生。可通过内比或凝露药圃争取主药，为结丹准备。";
}
export function advancementChanges(before: State, after: State) {
  if (
    before.realm === after.realm &&
    cultivationStageIndex(before) >= cultivationStageIndex(after)
  )
    return [];
  return [
    `${realmStageLabel(before)} → ${realmStageLabel(after)}`,
    after.realm === 1 && before.realm === 0
      ? "从前须避开的旧阵，如今可亲自重返。完成青嶂归路后，师门可受录内门，散修可主持药运。"
      : !after.realm && cultivationStageIndex(after) === 1
        ? "已能独自持续护住灵息。三路历练已可前往；亲历之后，可在师门与委托中受托领队。"
        : !after.realm && cultivationStageIndex(after) === 2
          ? "护体灵息已稳。受托的山口护送可改用本领完成，省下护脉草药。"
          : !after.realm
            ? "炼气已至圆满。备齐筑基所需，重返青嶂寻找机缘。"
            : after.foundationJourney.cultivation < 400
              ? "三地取材已可择路前往。主持过筑基委托、亲自取材炼元后，可受任主事、执事或药队客卿。"
              : after.foundationJourney.cultivation < 600
                ? "可研习稳脉之法，深入古道接应，筹备周天贯流。"
                : "修为已至筑基圆满，长风归流已过。回听松行前居归山叙旧，也可完成尚未尽兴的行旅与试剑。",
  ];
}
