import { quoteSettlement, settleResources, type ResourceSettlement } from "../economy";
import { grantTechnique } from "../techniques";
import type { State } from "../world";
export type PersonAction =
  | "person:scout"
  | "person:smith"
  | "lesson:scout"
  | "lesson:smith"
  | "reward:scales-money"
  | "reward:scales-medicine"
  | "reward:core-money"
  | "reward:core-training";
export interface QiPeople {
  scout: boolean;
  smith: boolean;
  beastLesson: boolean;
  constructLesson: boolean;
  scales: boolean;
  core: boolean;
  scoutReward: "none" | "money" | "medicine";
  smithReward: "none" | "money" | "training";
}
export const freshQiPeople = (): QiPeople => ({
  scout: false,
  smith: false,
  beastLesson: false,
  constructLesson: false,
  scales: false,
  core: false,
  scoutReward: "none",
  smithReward: "none",
});
export const qiPeople = {
  scout: {
    name: "许照岚",
    role: "药谷采药修士",
    image: "/art/qi-people-beasts/xu-zhaolan.webp",
    intro:
      "她常年沿泉谷采药，想找一条不必年年伤人的药路。药篓里除了灵草，还夹着记兽迹的薄册。",
  },
  smith: {
    name: "裴铸",
    role: "山下修器匠",
    image: "/art/qi-people-beasts/pei-zhu.webp",
    intro:
      "他替山中弟子修补灵器，想弄明白古傀阵枢为何能运转多年。工钱照收，能教的手艺也不藏。",
  },
} as const;
export function isPersonAction(a: string): a is PersonAction {
  return [
    "person:scout",
    "person:smith",
    "lesson:scout",
    "lesson:smith",
    "reward:scales-money",
    "reward:scales-medicine",
    "reward:core-money",
    "reward:core-training",
  ].includes(a);
}
function personRequirementError(s: State, a: PersonAction) {
  const p = s.qiJourney.people;
  if (s.adventure.step !== "done" || (!s.realm && s.qi < 120))
    return "先完成寻人历练，修至炼气中期";
  if (a === "person:scout") return p.scout ? "已经相识" : "";
  if (a === "person:smith")
    return p.smith
      ? "已经相识"
      : s.qiJourney.gates < 1
        ? "先淬脉入后期，再来谈内府"
        : "";
  const scout = a === "lesson:scout" || a.startsWith("reward:scales");
  if (scout && !p.scout) return "先与许照岚交谈";
  if (!scout && !p.smith) return "先与裴铸交谈";
  if (a === "lesson:scout")
    return p.beastLesson
      ? "识兽护身已经学会"
      : s.herbs < 3
        ? "帮她备好护身药：灵草 3"
        : "";
  if (a === "lesson:smith")
    return p.constructLesson
      ? "辨枢手法已经学会"
      : s.study < 2
        ? "先研读到心得 2"
        : s.stones < 10
          ? "试阵耗材需要灵石 10"
          : "";
  if (scout) {
    if (p.scoutReward !== "none") return "这份蟒蜕已经交付";
    if (!p.scales) return "击退护泉青鳞蟒后，带回泉边的完整旧蜕";
  } else {
    if (p.smithReward !== "none") return "这枚阵枢已经交付";
    if (!p.core) return "击败凝元守台傀儡，带回失去灵力的阵枢";
  }
  if (a === "reward:core-training") {
    if (s.realm !== 1) return "筑基后再来研修；可先保留阵枢";
    if (s.growth.training.guard >= 2) return "护身诀已经通达，可选择换取灵石";
  }
  return "";
}
export function personQuote(s: State, a: PersonAction) {
  const settlement: ResourceSettlement = { cost: {}, reward: {} };
  if (a === "lesson:scout") settlement.cost.herbs = 3;
  if (a === "lesson:smith") settlement.cost.stones = 10;
  if (a === "reward:scales-money") settlement.reward.stones = 24;
  if (a === "reward:core-money") settlement.reward.stones = 32;
  if (a === "reward:scales-medicine") settlement.reward = { healing: 2, herbs: 4 };
  return { months: 1, settlement, error: personRequirementError(s, a) || quoteSettlement(s, settlement.cost, settlement.reward).error };
}
export const personError = (s: State, a: PersonAction) => personQuote(s, a).error;
// Caller validates shared locks and advances time before any settlement.
export function settlePerson(s: State, a: PersonAction) {
  const quote = personQuote(s, a);
  if (quote.error || settleResources(s, quote.settlement.cost, quote.settlement.reward).error) return false;
  const q = s.qiJourney,
    p = q.people;
  if (a === "person:scout") {
    p.scout = true;
    q.last =
      "许照岚将兽迹册翻给你看：“岩獾护背，青蟒借水藏身。帮我备三株护身草，我带你认清它们的起手。”";
  }
  if (a === "person:smith") {
    p.smith = true;
    q.last =
      "裴铸敲了敲旧阵盘：“石傀不知痛，打碎外壳费力。读懂阵枢，就能少挨几下。备十枚灵石作试阵耗材，我教你。”";
  }
  if (a === "lesson:scout") {
    p.beastLesson = true;
    q.last =
      "你跟许照岚沿兽径练了一个月。学会识兽护身：药谷交锋中，正确守势承伤再减 2。她托你留意泉边蟒蜕，胜过守泉青蟒再取，别为找蜕冒进。";
  }
  if (a === "lesson:smith") {
    p.constructLesson = true;
    q.last =
      "你花灵石 10，在旧阵盘上反复练习辨枢。内府交锋中，正确辨影承伤再减 2。裴铸想要一枚完整旧阵枢，愿付钱收，也可在你筑基后用它教护身诀。";
  }
  if (a === "reward:scales-money") {
    p.scales = false;
    p.scoutReward = "money";
    q.last =
      "许照岚付下灵石 24，准备把蟒蜕裁成护袖：“这趟钱，留着温养经脉。泉口平静些，采药人也能少受伤。”";
  }
  if (a === "reward:scales-medicine") {
    p.scales = false;
    p.scoutReward = "medicine";
    q.last =
      "你用蟒蜕换回春散 2、灵草 4。许照岚把药包扎好：“先养伤，再淬脉。药路我会继续照看。”";
  }
  if (a === "reward:core-money") {
    p.core = false;
    p.smithReward = "money";
    q.last =
      "裴铸收下旧阵枢，付清灵石 32：“你拿钱去凝元，我慢慢拆解。下回进山，记得先检查法器。”";
  }
  if (a === "reward:core-training") {
    p.core = false;
    p.smithReward = "training";
    grantTechnique(s, "guard");
    s.growth.training.guard = 2;
    q.last =
      "裴铸与你拆解阵枢，将古傀卸力之法化入护身诀。护身诀已通达；装配为辅修后，可在接下来的交锋中减伤。";
  }
  return true;
}
function basePersonReply(s: State, who: "scout" | "smith") {
  const p = s.qiJourney.people;
  if (who === "scout") {
    if (!p.scout) return qiPeople.scout.intro;
    if (p.scoutReward !== "none")
      return s.realm
        ? "“你已经筑基了？往山外走，也要看脚下的兽迹。泉谷这边有我。”"
        : "“护袖已经分给采药人。等你淬脉出关，走远些看看。”";
    if (p.scales)
      return "“是守泉蟒蜕。换灵石，还是换一份养伤与淬脉的药材？你来定。”";
    if (p.beastLesson)
      return "“岩獾压低背时先守，蟒影晃动时看真身。取到旧蜕再来，不必追着妖兽杀。”";
    return "“三株护身草备齐，我们就沿兽径走一趟。认习性，比硬挨更管用。”";
  }
  if (!p.smith) return qiPeople.smith.intro;
  if (p.smithReward === "training")
    return "“卸力要随身练。你筑基后的路还长，这卸力的手法，练熟了才能保命。”";
  if (p.smithReward === "money")
    return "“阵枢拆开了，里面的旧纹还能用。你的工钱结清，往后修器照旧来。”";
  if (p.core)
    return s.realm
      ? "“你如今的灵力，练这卸力诀够了。留下阵枢，我教你；缺盘缠，也可换钱。”"
      : "“阵枢我收三十二灵石。若愿等到筑基，也可拿它来学护身诀通达之法。”";
  return p.constructLesson
    ? "“看到假阵眼不要抢砸。辨清回光，再碰阵枢。”"
    : "“先把阵理读熟，备十枚灵石来试阵。别拿经脉硬扛。”";
}
export function personReply(s: State, who: "scout" | "smith") {
  const known = s.qiJourney.people[who];
  let greeting = "";
  if (known && s.recognition.deeds.some(d => d.tier === 2)) greeting = who === "scout" ? "许照岚指着新来的药工：“他们想问你那段远路怎么走。可别把险处略了。”" : "裴铸将阵图让到你面前：“这回你先说，我听听哪处还得改。”";
  else if (known && s.realm) greeting = who === "scout" ? "许照岚看了看你的气息：“筑基了。往后险处也能多照看几个人。”" : "裴铸将炉钳递来：“筑基了？那就自己压住炉火，别光站着看。”";
  else if (known && s.recognition.deeds.some(d => d.tier === 0)) greeting = who === "scout" ? "“听说这趟是你领队。下次带新人，先把退路指给他们。”" : "“能独当一面了。出门前仍得验器，别嫌麻烦。”";
  return greeting + basePersonReply(s, who);
}
export function validQiPeople(p: QiPeople) {
  return (
    !!p &&
    [
      "scout",
      "smith",
      "beastLesson",
      "constructLesson",
      "scales",
      "core",
    ].every((k) => typeof p[k as keyof QiPeople] === "boolean") &&
    ["none", "money", "medicine"].includes(p.scoutReward) &&
    ["none", "money", "training"].includes(p.smithReward) &&
    (!p.beastLesson || p.scout) &&
    (!(p.scoutReward !== "none") || (p.scout && !p.scales)) &&
    (!(p.smithReward !== "none") || (p.smith && !p.core))
  );
}
