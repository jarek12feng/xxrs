import { reunionLetterEcho } from "../correspondence/history";
import type { State } from "../world";
import { companionChronology } from "../golden-story/companion";
import { artifactReady } from "../equipment";
import { quoteSettlement, type ResourceAmounts } from "../economy";
import type { ReunionApproach } from "./state";
export type ReunionAction =
  | { kind: "invite" | "meet" | "anchor" | "cross" | "depart" | "useAbility" }
  | { kind: "plan"; approach: ReunionApproach }
  | { kind: "share"; sharing: "public" | "private" };
export const reunionKnown = (s: State) =>
  s.social.gender === "male" &&
  s.goldenStory.companionGoldenAt !== null &&
  s.goldenStory.companionConfirmedAt !== null &&
  s.goldenStory.companionLetters.includes(4);
export const reunionAvailable = (s: State) =>
  reunionKnown(s) && (companionChronology(s)?.age ?? 6000) < 6000;
export function reunionCapability(s: State, approach: ReunionApproach | null) {
  const active = (id: "tideSeal" | "spiritPearl" | "tideBlade") =>
    s.treasures.artifacts.includes(id) && artifactReady(s, id);
  if (approach === "ward" && active("tideSeal"))
    return { name: "镇潮印", support: "镇潮印压住回流，省去一月反复布锚" };
  if (approach === "ward" && s.outerSea.method === "clear")
    return { name: "澄息法", support: "澄息法缓住潮息，省去一月反复布锚" };
  if (approach === "survey" && active("spiritPearl"))
    return { name: "定神珠", support: "定神珠映清水下双影，省去一月复测" };
  if (approach === "survey" && s.spirit.manual === "learned")
    return { name: "分念诀", support: "分念诀同时照看尺影与归绳，省去一月复测" };
  if (approach === "edge" && active("tideBlade"))
    return { name: "潮纹剑", support: "潮纹剑沿罡隙切开旧桩，省去一月换位" };
  return null;
}
export function reunionSupport(s: State, approach: ReunionApproach | null) {
  return reunionCapability(s, approach)?.support ?? "";
}
export function reunionQuote(s: State, a: ReunionAction) {
  const r = s.goldenStory.reunion;
  let error = "",
    months = 0,
    herbs = 0;
  const reward: ResourceAmounts = {};
  if (!reunionAvailable(s))
    error = "须先核验苏婉宁的凝丹来信，并有可靠的在世近况";
  if (
    a.kind !== "invite" &&
    (s.outerSea.location !== "ferry" ||
      !s.outerSea.met ||
      s.conclave.location !== "away")
  )
    error ||= "循现有海路到外海古渡，再续此约";
  switch (a.kind) {
    case "invite":
      if (r.stage !== "none") error ||= "会面之约已记下";
      break;
    case "meet":
      if (r.stage !== "invited") error ||= "先托驿使约在古渡见面";
      break;
    case "plan":
      if (
        !["met", "planned"].includes(r.stage) ||
        !["ward", "survey", "edge"].includes(a.approach)
      )
        error ||= "此时不能更换分工";
      break;
    case "anchor":
      months = reunionSupport(s, r.approach) ? 1 : 2;
      if (r.stage !== "planned") error ||= "先商定分工，归绳只需布设一次";
      break;
    case "useAbility":
      months = 1;
      herbs = 2;
      if (r.stage !== "planned") error ||= "先商定分工；已布归绳者沿原路实测即可";
      if (!reunionSupport(s, r.approach)) error ||= "此分工尚无可用的法门或出战法宝；可换分工，也可用普通绳尺布锚";
      break;
    case "cross":
      months = 1;
      if (!["planned", "anchored"].includes(r.stage))
        error ||= "先商定分工，再观察侧堤潮势";
      break;
    case "share":
      if (r.stage !== "resolved" || !["public", "private"].includes(a.sharing))
        error ||= "实测完成后再商议路图";
      else if (a.sharing === "public") reward.herbs = 4;
      else reward.stones = 8;
      break;
    case "depart":
      if (r.stage !== "shared") error ||= "先议定此次成果，再各赴前程";
      break;
    default:
      error ||= "未知同行行动";
  }
  error ||= quoteSettlement(s, { herbs }, reward).error;
  return { error, months, stones: 0, herbs, reward };
}
export const reunionAbility = {
  ward: { label: "分流护舟，同时测堤", result: "你稳住两股回流，苏婉宁将水尺横入原本不能停舟的潮口。药船循着你护住的缓流靠岸，两人的尺数终于接上。" },
  survey: { label: "分神照见双影，引舟过堤", result: "你同时照看水下尺影与舟尾归绳，指出暗流掩住的石阶。苏婉宁压住侧浪，药船沿你辨明的落点穿过侧堤。" },
  edge: { label: "御剑切桩，趁退潮通舟", result: "你驾潮纹剑沿罡隙切开堵水旧桩，苏婉宁将碎木压向空岸。水势从新开的缺口泄去，药船第一次直穿这段侧堤。" },
} as const;
export const approachNames = {
  ward: "稳住回流",
  survey: "辨清双影",
  edge: "切开旧桩",
};
/** Mutates only the command-owned draft after time/resource settlement. */
export function applyReunion(s: State, a: ReunionAction): string {
  const r = s.goldenStory.reunion;
  switch (a.kind) {
    case "invite":
      r.stage = "invited";
      r.last =
        "你托药路驿使回信，约在外海古渡见面。苏婉宁回了新记号：“我往古渡再测一回侧堤。你忙完再来，到了找尺绳上的旧记号。”";
      break;
    case "meet":
      r.stage = "met";
      r.metAt = s.month;
      r.last =
        "苏婉宁把旧尺绳放在石台上，绳结换了，末端的旧记号却还在。“信里说得轻巧，第一炉散掉时，我也怕再没有下一次。”她停了停，推来新图：“如今能分神照住整段回潮，总算可以测这条侧堤了。从前隔着潮水，只能望着那头的空白发愁。今日你也在，咱们试试？”" + reunionLetterEcho(s);
      break;
    case "plan":
      r.approach = a.approach;
      r.stage = "planned";
      r.last = {
        ward: "你负责稳住回流，她分神校准水尺；两人各留一股灵力照看退路。",
        survey:
          "你辨水下双影，她以金丹灵力撑住侧堤；遇到看不清的落点，先退回绳结处。",
        edge: "你沿潮隙切开堵水旧桩，她压住散开的碎木与药船侧浪；破桩不能先于布好归绳。",
      }[a.approach];
      break;
    case "anchor":
      r.stage = "anchored";
      r.last =
        (reunionSupport(s, r.approach) ||
          "你们按普通绳尺逐段布锚，往返校准两个月，稳稳留下了退路") +
        "。苏婉宁把另一端系紧：“浪落了，沿绳走。我看着外侧，你留神脚下。”";
      break;
    case "useAbility":
      r.stage = "resolved";
      r.last = `你运起${reunionCapability(s, r.approach)!.name}。${reunionAbility[r.approach!].result}你们用灵草2护住连续行功的经脉，一月完成此次实测，省下了逐段布锚的往返。苏婉宁在图上添了新线：“这回用上了。往后药船照着走，也不用有你我这样的修为。”`;
      break;
    case "cross":
      if (r.stage === "planned") {
        r.mistakes = Math.min(100, r.mistakes + 1);
        r.last =
          "侧浪遮住落点，苏婉宁与你同时收势退回石台。没有受伤，也没丢行装，但这一月未能留下可靠读数。“先系归绳。咱们飞过去容易，药船可绕不过水下的暗流。”";
      } else {
        r.stage = "resolved";
        r.last = `你以${approachNames[r.approach!]}接住这段潮势，苏婉宁完成另一侧的测读。药船循新落点穿过侧堤。她把两人的读数并排写下：“旧图上的空白，这次终于能落笔了。”你也记下了自己运器与收息的差别。`;
      }
      break;
    case "share":
      r.stage = "shared";
      r.sharing = a.sharing;
      r.last =
        a.sharing === "public"
          ? "你们同意公开安全落点，私修批注各留一份。药队送来灵草4作为复测酬谢。苏婉宁添了校图年月：“后来人照着走，也得知道潮路会变。”"
          : "你们暂留完整测图，先把危险落点告知船工，待下次复核再议公开。船工支付勘路报酬灵石8。苏婉宁收起底图：“可以。没验稳的地方，不能拿别人的药船去试。”";
      break;
    case "depart":
      r.stage = "departed";
      r.departedAt = s.month;
      r.last =
        "离堤前，你们把尺绳晒干，各抄了一份实测批注。苏婉宁要沿药船去复核下游，你继续自己的修行。“我随药船再往下游看看。下回见面，可别光听我说，也让我见识见识你的新本事。”她留下仍可投递的古渡信路，两人各自收好行装。";
      break;
  }
  return r.last;
}
export function reunionFollowup(s: State) {
  const r = s.goldenStory.reunion;
  return r.sharing === "public"
    ? "药队已能照新图备航。涨潮时哪几处不能泊船，我还要再看一遍；你那份修行批注，我另收着，没交给刻图的人。那段旧绳我带走了，等下次见面再换。"
    : "下游的回流还须再看，整图且不急着刻。险处已告诉船工，底图我收着。等你得闲，再一起走一回。";
}

/** The receiving teaching system needs only the topic supported by actual field notes. */
export function reunionTeaching(s: State): 'ground'|'spirit'|'method'|null {
  const r=s.goldenStory.reunion;
  if(!['resolved','shared','departed'].includes(r.stage) || !r.approach)return null;
  return {ward:'ground',survey:'spirit',edge:'method'}[r.approach] as 'ground'|'spirit'|'method';
}
