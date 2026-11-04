import { teachingExercises, teachingIntroduction, type TeachingMove } from "./teaching";
export { teachingSolution } from "./teaching";
import { companionNews } from "./companion";
export { companionNews } from "./companion";
import type { State } from "../world";
import { advanceMonths } from "../timeline";
import { activityInterruption } from "../scene-activity";
import { settleResources } from "../economy";
import type { TeachingTopic, RubbingRecipient } from "./state";
export type GoldenStoryAction =
  | { kind: "direction"; choice: "sect" | "independent" }
  | { kind: "observe"; point: "gauge" | "flow" }
  | { kind: "duty"; duty: "ward" | "survey" }
  | { kind: "measure" | "oldRecord" | "companion" }
  | { kind: "practice"; move: TeachingMove }
  | { kind: "ask"; topic: TeachingTopic; source: "seat" | "public" }
  | { kind: "rubbing"; recipient: RubbingRecipient };
export const goldenStoryActive = (_s: State) => false;
export const goldenTeaching = (s: State) =>
  s.goldenStory.teachings.length === 4;
export const goldenCooperation = (s: State) => ({
  harbor: s.goldenStory.rubbings.includes("chengyuan"),
  charts: s.goldenStory.rubbings.includes("hengxuan"),
  frost: s.goldenStory.rubbings.includes("zhaoshuang"),
});
const atSea = (s: State) =>
  s.outerSea.location === "ferry" && s.conclave.location === "away";
export function goldenStoryQuote(s: State, a: GoldenStoryAction) {
  const g = s.goldenStory;
  let months = 0,
    stones = 0,
    herbs = 0;
  let error = activityInterruption(s);
  if (s.nascentSoul?.trial || s.nascentSoul?.attempt)
    error ||= "先结束圆满考验或凝婴，再办理交接";
  if (s.lizhao?.location !== "away")
    error ||= "先离开离照与伏潮湾现场，再办理交接";
  if (s.realm !== 2) error ||= "金丹行旅期间方可办理此事";
  if (!g) return { months, stones, herbs, error: "金丹见闻尚未初始化" };
  switch (a.kind) {
    case "direction":
      if (!["sect", "independent"].includes(a.choice)) error ||= "未知引荐方式";
      if (g.direction !== "none") error ||= "问路之约已记下";
      if (s.outerSea.location !== "home" || s.conclave.location !== "away")
        error ||= "回凝丹旧居交接远行之事";
      break;
    case "observe":
      if (!atSea(s) || !s.outerSea.met) error ||= "先在古渡与两位道友相识";
      if (
        !["gauge", "flow"].includes(a.point) ||
        g.observations.includes(a.point) ||
        g.tideComplete
      )
        error ||= "这处测读已经记下";
      break;
    case "duty":
      if (!atSea(s) || !s.outerSea.met) error ||= "先在古渡与两位道友相识";
      if (
        !["ward", "survey"].includes(a.duty) ||
        g.duty === a.duty ||
        g.tideComplete
      )
        error ||= "分工已经落实";
      break;
    case "measure":
      months = 1;
      herbs = g.duty === "ward" ? 2 : 0;
      stones = g.duty === "survey" ? 4 : 0;
      if (!atSea(s) || g.observations.length !== 2 || g.duty === "none")
        error ||= "先读潮尺、测回流并确定分工";
      if (g.tideComplete) error ||= "本次观潮已完成";
      break;
    case "oldRecord":
      if (s.outerSea.cleared !== 2 || !atSea(s))
        error ||= "完成退潮内府后，回古渡摊开带出的旧录";
      if (!s.outerSea.attuned || s.outerSea.method === "none")
        error ||= "先温养镇潮印并研修澄息篇，用实际所得核对旧录";
      if (g.oldRecord) error ||= "旧录已经核对";
      break;
    case "ask":
      months =
        (a.topic === "ground" && goldenCooperation(s).harbor) ||
        (a.topic === "spirit" && goldenCooperation(s).charts) ||
        (a.topic === "method" && goldenCooperation(s).frost) ||
        (a.topic === "pill" && g.rubbings.includes("retain"))
          ? 0
          : 1;
      if (
        !["method", "spirit", "pill", "ground"].includes(a.topic) ||
        !["seat", "public"].includes(a.source)
      )
        error ||= "未知问法事项";
      if (
        a.source === "seat" &&
        (s.conclave.location !== "court" || !s.conclave.introduced)
      )
        error ||= "先在会谷与各宗来客相识";
      if (a.source === "public" && (!atSea(s) || !s.outerSea.met))
        error ||= "先到古渡与当值传讲人相识";
      if (g.teachings.includes(a.topic)) error ||= "这项问法已有实测批注";
      if (g.practice) error ||= "石案上的试法尚未收束，先辨清这一处";
      break;
    case "practice": {
      const p = g.practice;
      if (!p) { error ||= "石案尚未点亮，先将疑处说与传讲者听"; break; }
      if (p.source === "seat" ? s.conclave.location !== "court" || !s.conclave.introduced : !atSea(s) || !s.outerSea.met) error ||= "回原来的石案前，再续试法";
      if (!teachingExercises[p.topic][p.step].choices.some(c => c.move === a.move)) error ||= "这一试须从眼前灵流着手";
      break;
    }
    case "rubbing":
      if (
        s.conclave.depth !== 2 ||
        !(atSea(s) || s.conclave.location === "court")
      )
        error ||= "带回归潮深处记录后，在古渡或会谷交接";
      if (
        !["chengyuan", "hengxuan", "zhaoshuang", "retain"].includes(
          a.recipient,
        ) ||
        g.rubbings.length >= 2 ||
        g.rubbings.includes(a.recipient)
      )
        error ||= "原页灵纹只够留下两份完整印痕，每方至多一份";
      break;
    case "companion": {
      const news = companionNews(s);
      if (!news || g.companionLetters.includes(news.id))
        error ||= "暂无新的可靠来信";
      break;
    }
    default:
      error ||= "未知金丹见闻行动";
  }
  if (s.stones < stones || s.herbs < herbs)
    error ||= "观潮物资不足，可回静修处筹备";
  if (months && s.limit - s.age <= months) error ||= "余寿不足以完成此事";
  return { months, stones, herbs, error };
}
export const teachingText: Record<TeachingTopic, string> = {
 method: "旧脉缓下来，新法才接得住。抱元录的要义，在于令神魂与丹元同息；往后转修，也须先理清旧法行气的来路。",
 spirit: "定神珠能替你挡住一阵潮压，却不能替你守住本念。护神而不闭神，一念在内，仍须听得见身外风潮。",
 pill: "潮毒浮而药息沉，先辨性，再分离。离照泊岸的候潮记号已添在路图上，须亲往寻得定性辅药，验过药性，方可开炉。",
 ground: "供灵须有来去，护持须分内外。依今日阵图准备闭关处，再与可信之人商议守关，莫将两阵挤在一处。",
};
export function runGoldenStory(
  input: State,
  a: GoldenStoryAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (input.seen.includes(id)) return input;
  const q = goldenStoryQuote(input, a);
  if (q.error) return input;
  let s = structuredClone(input);
  const elapsed = advanceMonths(s, q.months, {
    tick,
    interrupt: (n) =>
      activityInterruption(n) ||
      (n.outerSea.reminded && !input.outerSea.reminded
        ? "会谷来信已到，先查看来信"
        : ""),
  });
  s = elapsed.state;
  if (elapsed.stopped) {
    record("事务因眼前消息暂止，未扣物资、未结算观潮或问法成果。");
    return finish();
  }
  if (settleResources(s, { stones: q.stones, herbs: q.herbs }).error)
    return input;
  const g = s.goldenStory;
  switch (a.kind) {
    case "direction":
      g.direction = a.choice;
      record(
        (a.choice === "sect"
          ? "你接过听松旧传承的缺页目录。"
          : "你请药路引荐人核验公开传承目录，仍保留散修身份。") +
          "听松是青玄界内陆的中小宗门，有完整凝丹传承，却无在世元婴坐镇。旧册所载掌门陆怀真为金丹后期，受困于凝婴资料残缺；这是当年的记载，如今宗务由谁执掌，还须向山门问讯。缺页后篇可向外海同道与论法席打听，这封书只作引荐，你仍可自择去留。",
      );
      break;
    case "observe":
      g.observations.push(a.point);
      record(
        a.point === "gauge"
          ? "你将潮尺的旧刻痕与今日满潮线并排标记：相差半尺，但一次读数还分不清风势与潮路变动。"
          : "你沿堤缘测回流，记录护潮阵石后的流向；背流比主流迟缓。顾沧遥要保药船，叶问苓要校旧图，所需不是同一条线。",
      );
      break;
    case "duty":
      g.duty = a.duty;
      record(
        a.duty === "ward"
          ? "你负责护堤留绳，顾沧遥看药船，叶问苓测主流。实测需一月、灵草2；你会保留护堤的受力记录。"
          : "你负责沿安全石道校图，叶问苓定刻度，顾沧遥守堤。实测需一月、灵石4；你会保留潮流前后对照。",
      );
      break;
    case "measure":
      g.tideComplete = true;
      record(
        g.duty === "ward"
          ? "一个潮期里，你稳住两处回流阵石，药船趁背潮靠岸；受力记录证实旧图缺少堤后缓流。现在可以决定是否公开潮图，护堤职责不会把你的私图变成公物。"
          : "一个潮期里，你把新旧刻度逐一对照，改正主流到达时刻；药船按新记号绕过急流。现在可以决定是否公开潮图，保留图纸也不撤销本次分工。",
      );
      break;
    case "oldRecord":
      g.oldRecord = true;
      record(
        "镇潮印已回应今日灵流，澄息篇也已实际运转。你据此核对旧主人残录：此地原用来研究潮息与护体，旧年修行所需的灵潮已经变弱。残页只留下几处星位。你将它另行收好；仅凭这些，还辨不出旧主人所记的远方在何处。",
      );
      break;
    case "ask":
      g.practice = { topic: a.topic, source: a.source, step: 0, errors: 0, feedback: teachingIntroduction(s, a.topic, a.source) };
      record(g.practice.feedback);
      break;
    case "practice": {
      const p = g.practice!;
      const exercise = teachingExercises[p.topic][p.step];
      if (a.move !== exercise.answer) {
        p.errors = Math.min(999, p.errors + 1);
        p.feedback = exercise.failure;
        record(p.feedback);
      } else if (p.step === 0) {
        p.step = 1;
        p.feedback = exercise.success;
        record(p.feedback);
      } else {
        g.teachings.push(p.topic);
        g.teachingSources.push(p.source);
        g.teachingPracticeResults.push({ topic: p.topic, errors: p.errors });
        record(exercise.success + teachingText[p.topic]);
        g.practice = null;
      }
      break;
    }
    case "rubbing":
      g.rubbings.push(a.recipient);
      record(
        {
          chengyuan: "你将一份潮路维护拓本交给澄渊值守，回执允你查阅护持布置。",
          hengxuan: "你将一份测阵拓本交给衡璇校图者，对方交回勘路批注。",
          zhaoshuang:
            "纪闻霜一方收到凝神原卷的有限拓页，答复愿核对照霜旧传承；衡璇补缀的私有成果不在此份中。",
          retain:
            "你自留一份药息灵纹，逐处对照带出的药性笔记。问成丹缺口时可直接带到石案前，省去一月核验，分药亲习仍须亲手完成。",
        }[a.recipient] +
          "原页所附的灵纹每拓一次便淡去一层，只能留下两份完整印痕；寻常纸墨只能抄字，留不住药息与潮势。每方至多一份，交出后不追回。定神珠、抱元凝神录原本和灵髓仍由你收好。",
      );
      break;
    case "companion": {
      const news = companionNews(s)!;
      g.companionLetters.push(news.id);
      if (news.id === 4 && news.goldenAt !== null) {
        g.companionGoldenAt = news.goldenAt;
        g.companionConfirmedAt = s.month;
      }
      record(news.text);
      break;
    }
  }
  return finish();
  function record(text: string) {
    s.goldenStory.last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
